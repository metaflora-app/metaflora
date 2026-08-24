const DEFAULT_ENDPOINT = "https://polza.ai/api/mcp";
const MCP_PROTOCOL_VERSION = "2025-06-18";

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function requiredText(value, label, maximum = 2_000) {
  const normalized = String(value ?? "").replaceAll("\u0000", "").trim();
  if (!normalized || normalized.length > maximum) throw new TypeError(`${label} is required.`);
  return normalized;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new TypeError(`${label} is invalid.`);
  return number;
}

function currency(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/u.test(normalized)) throw new TypeError("currency is invalid.");
  return normalized;
}

function parseDecimalKopecks(value) {
  const normalized = String(value ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/u.test(normalized)) {
    throw new PolzaMcpFundingError("invalid_provider_value", "Provider amount is invalid.");
  }
  const [rubles, cents = ""] = normalized.split(".");
  const result = Number(rubles) * 100 + Number(`${cents}00`.slice(0, 2));
  if (!Number.isSafeInteger(result)) {
    throw new PolzaMcpFundingError("invalid_provider_value", "Provider amount is invalid.");
  }
  return result;
}

function kopecks(value, label, allowZero = true) {
  if (value === undefined || value === null || value === "") {
    throw new PolzaMcpFundingError("invalid_provider_value", `${label} is missing.`);
  }
  const number = Number(value);
  if (typeof value === "number" || /^\d+$/u.test(String(value))) {
    if (!Number.isSafeInteger(number) || number < 0 || (!allowZero && number === 0)) {
      throw new PolzaMcpFundingError("invalid_provider_value", `${label} is invalid.`);
    }
    return number;
  }
  const parsed = parseDecimalKopecks(value);
  if (!allowZero && parsed === 0) throw new PolzaMcpFundingError("invalid_provider_value", `${label} is invalid.`);
  return parsed;
}

function errorCode(error, fallback = "mcp_error") {
  const value = String(error?.code ?? "").trim().toLowerCase();
  return /^[a-z][a-z0-9_-]{1,63}$/u.test(value) ? value : fallback;
}

function diagnosticText(value, maximum = 320) {
  return String(value ?? "")
    .replace(/https?:\/\/\S+/giu, "[url]")
    .replace(/Bearer\s+\S+/giu, "Bearer [redacted]")
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, maximum);
}

function providerToolFailure(result) {
  const contentText = Array.isArray(result?.content)
    ? result.content.find((item) => item?.type === "text" && typeof item.text === "string")?.text
    : "";
  let payload = null;
  try {
    payload = contentText ? JSON.parse(contentText) : null;
  } catch {
    payload = null;
  }
  const message = String(payload?.error ?? payload?.message ?? contentText ?? "").trim();
  const rateLimited = /лимит.*(?:операц|пополн)|rate\s*limit|too\s*many\s*(?:requests|operations)/iu.test(message);
  throw new PolzaMcpFundingError(
    rateLimited ? "provider_rate_limited" : "tool_call_failed",
    "Polza MCP tool call failed.",
    {
      retryable: rateLimited,
      externalChargeStarted: false,
      retryAfterSeconds: rateLimited ? 3_600 : null,
      providerMessage: diagnosticText(message) || null,
    },
  );
}

function unwrap(value) {
  const result = object(value)?.result ?? value;
  if (object(result)?.isError === true) {
    providerToolFailure(result);
  }
  if (object(result)?.structuredContent) return result.structuredContent;
  if (Array.isArray(result?.content)) {
    const text = result.content.find((item) => item?.type === "text" && typeof item.text === "string")?.text;
    if (text) {
      try {
        return JSON.parse(text);
      } catch {
        return { text };
      }
    }
  }
  return result ?? {};
}

function responseMessages(body) {
  const trimmed = String(body ?? "").trim();
  if (!trimmed) return [];
  const lines = trimmed.includes("\n")
    ? trimmed.split(/\r?\n/u).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim())
    : [trimmed];
  return lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

class HttpMcpTransport {
  constructor({ endpoint, token, fetchImpl }) {
    this.endpoint = endpoint;
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.nextId = 1;
    this.initialized = false;
    this.sessionId = null;
  }

  async request(method, params = {}) {
    if (!this.initialized && method !== "initialize" && method !== "notifications/initialized") {
      await this.request("initialize", {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "metaflora-neuro-crm-browser-funding", version: "1.0.0" },
      });
      await this.request("notifications/initialized", {});
      this.initialized = true;
    }
    const id = method.startsWith("notifications/") ? undefined : this.nextId++;
    let response;
    try {
      response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
          "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
          ...(this.sessionId ? { "Mcp-Session-Id": this.sessionId } : {}),
        },
        body: JSON.stringify({ jsonrpc: "2.0", ...(id === undefined ? {} : { id }), method, params }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new PolzaMcpFundingError("mcp_timeout", "Polza MCP is temporarily unavailable.");
    }
    const sessionId = response.headers?.get?.("mcp-session-id");
    if (sessionId) this.sessionId = sessionId;
    if (!response.ok) {
      const retryAfterHeader = Number(response.headers?.get?.("retry-after"));
      const providerMessage = diagnosticText(await response.text());
      throw new PolzaMcpFundingError(
        response.status === 429 ? "rate_limited" : "mcp_http_error",
        "Polza MCP request failed.",
        {
          retryable: response.status === 429 || response.status >= 500,
          retryAfterSeconds: Number.isSafeInteger(retryAfterHeader) && retryAfterHeader > 0
            ? retryAfterHeader
            : null,
          providerMessage: providerMessage || null,
        },
      );
    }
    if (method.startsWith("notifications/")) return {};
    const messages = responseMessages(await response.text());
    const message = messages.at(-1) ?? {};
    if (message.error) {
      throw new PolzaMcpFundingError(errorCode(message.error, "mcp_error"), "Polza MCP request failed.");
    }
    return message.result ?? message;
  }
}

export class PolzaMcpFundingError extends Error {
  constructor(
    code = "mcp_error",
    message = "Polza MCP request failed.",
    {
      retryable = null,
      externalChargeStarted = null,
      retryAfterSeconds = null,
      providerMessage = null,
    } = {},
  ) {
    super(message);
    this.name = "PolzaMcpFundingError";
    this.code = code;
    this.retryable = retryable ?? ["mcp_timeout", "mcp_http_error", "rate_limited", "provider_rate_limited"].includes(code);
    if (externalChargeStarted === false) this.externalChargeStarted = false;
    if (Number.isSafeInteger(retryAfterSeconds) && retryAfterSeconds > 0) {
      this.retryAfterSeconds = Math.min(retryAfterSeconds, 86_400);
    }
    const diagnostic = diagnosticText(providerMessage);
    if (diagnostic) this.providerMessage = diagnostic;
  }
}

export function createPolzaMcpFundingClient({
  endpoint = DEFAULT_ENDPOINT,
  token,
  fetchImpl = globalThis.fetch,
  transport = null,
} = {}) {
  const secret = requiredText(token, "Polza MCP token");
  const url = new URL(requiredText(endpoint, "Polza MCP endpoint"));
  if (url.protocol !== "https:") throw new TypeError("Polza MCP endpoint must use HTTPS.");
  if (!transport && typeof fetchImpl !== "function") throw new TypeError("fetchImpl is required.");
  const connection = transport ?? new HttpMcpTransport({
    endpoint: url.href,
    token: secret,
    fetchImpl,
  });

  async function callTool(name, args = {}) {
    const raw = await connection.request("tools/call", { name, arguments: args });
    return unwrap(raw);
  }

  async function transactionRows() {
    const payload = await callTool("get_transaction_history", {});
    const rows = Array.isArray(payload)
      ? payload
      : payload.transactions ?? payload.items ?? payload.data ?? [];
    if (!Array.isArray(rows)) {
      throw new PolzaMcpFundingError("verification_failed", "Transaction history is invalid.");
    }
    return rows;
  }

  return Object.freeze({
    async createTopupLink({ amountRubles, paymentMethod = "CARD" } = {}) {
      const amount = positiveInteger(amountRubles, "amountRubles");
      if (amount < 100) throw new TypeError("Polza top-up amount must be at least 100 RUB.");
      const method = String(paymentMethod).trim().toUpperCase();
      if (!["CARD", "SBP"].includes(method)) throw new TypeError("paymentMethod is invalid.");
      return callTool("create_topup_link", { amount, paymentMethod: method });
    },
    async verifyTransaction({ transactionId, expectedAmountKopecks, currency: expectedCurrency = "RUB" } = {}) {
      const id = requiredText(transactionId, "transactionId", 255);
      const amount = positiveInteger(expectedAmountKopecks, "expectedAmountKopecks");
      const expected = currency(expectedCurrency);
      const rows = await transactionRows();
      const row = rows.find((candidate) => String(
        candidate?.transaction_id ?? candidate?.transactionId ?? candidate?.external_id ?? candidate?.id ?? "",
      ) === id);
      if (!row) throw new PolzaMcpFundingError("verification_failed", "Transaction was not found.");
      const observedAmount = row.amount_kopecks !== undefined
        ? kopecks(row.amount_kopecks, "transaction amount", false)
        : row.amountKopecks !== undefined
          ? kopecks(row.amountKopecks, "transaction amount", false)
          : parseDecimalKopecks(row.amount);
      const observedCurrency = currency(row.currency ?? expected);
      if (observedAmount !== amount || observedCurrency !== expected) {
        throw new PolzaMcpFundingError("verification_failed", "Transaction amount or currency does not match.");
      }
      return Object.freeze({ transactionId: id, amountKopecks: observedAmount, currency: observedCurrency });
    },
    async findMatchingTransaction({ amountKopecks: expectedAmountKopecks, currency: expectedCurrency = "RUB", after = null, operationId = null, excludeTransactionIds = [] } = {}) {
      const expectedAmount = positiveInteger(expectedAmountKopecks, "amountKopecks");
      const expected = currency(expectedCurrency);
      const expectedOperationId = operationId === null || operationId === undefined
        ? null
        : requiredText(operationId, "operationId", 255);
      const excluded = new Set((Array.isArray(excludeTransactionIds) ? excludeTransactionIds : []).map((value) => String(value)));
      const afterTime = after ? new Date(after).getTime() : 0;
      const rows = await transactionRows();
      const matches = rows.map((row) => {
        const transactionId = String(
          row?.transaction_id ?? row?.transactionId ?? row?.external_id ?? row?.id ?? "",
        ).trim();
        if (!transactionId || excluded.has(transactionId)) return null;
        const observedAmount = row.amount_kopecks !== undefined
          ? kopecks(row.amount_kopecks, "transaction amount", false)
          : row.amountKopecks !== undefined
            ? kopecks(row.amountKopecks, "transaction amount", false)
            : parseDecimalKopecks(row.amount);
        const observedCurrency = currency(row.currency ?? expected);
        const observedOperationId = String(
          row?.operation_id ?? row?.operationId ?? row?.operation ?? row?.topup_id ?? "",
        ).trim();
        const createdAt = row.created_at ?? row.createdAt ?? row.occurred_at ?? row.occurredAt;
        const createdTime = createdAt ? new Date(createdAt).getTime() : 0;
        if (observedAmount !== expectedAmount
          || observedCurrency !== expected
          || (expectedOperationId && observedOperationId !== expectedOperationId)
          || !createdTime
          || createdTime < afterTime) return null;
        return { transactionId, createdTime };
      }).filter(Boolean).sort((left, right) => right.createdTime - left.createdTime);
      if (matches.length > 1 && !expectedOperationId) {
        throw new PolzaMcpFundingError(
          "ambiguous_transaction",
          "More than one provider transaction matches the requested amount.",
        );
      }
      return matches[0] ? Object.freeze({ transactionId: matches[0].transactionId }) : null;
    },
    async getBalance() {
      const payload = await callTool("get_balance", {});
      const rawAmount = payload.balance_kopecks ?? payload.balanceKopecks ?? payload.amount_kopecks;
      const balanceKopecks = rawAmount !== undefined
        ? kopecks(rawAmount, "balance")
        : parseDecimalKopecks(payload.amount ?? payload.balance);
      return Object.freeze({ balanceKopecks, currency: currency(payload.currency ?? "RUB") });
    },
  });
}
