const PROTOCOL = "2025-06-18";

export class FundingError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.code = code;
    this.retryable = options.retryable === true;
    this.userActionRequired = options.userActionRequired === true;
    if (options.externalChargeStarted === false) this.externalChargeStarted = false;
    if (Number.isSafeInteger(options.retryAfterSeconds) && options.retryAfterSeconds > 0) {
      this.retryAfterSeconds = Math.min(options.retryAfterSeconds, 86_400);
    }
  }
}

function parseText(result) {
  const text = result?.content?.find?.((item) => item?.type === "text")?.text;
  if (!text) return result?.structuredContent ?? result ?? {};
  try { return JSON.parse(text); } catch { return { text }; }
}

function rows(payload) {
  return Array.isArray(payload) ? payload : payload?.transactions ?? payload?.items ?? payload?.data ?? [];
}

function transactionId(row) {
  return String(row?.transaction_id ?? row?.transactionId ?? row?.external_id ?? row?.id ?? "").trim();
}

function successful(row) {
  const status = String(row?.status ?? row?.state ?? "succeeded").toLowerCase();
  const direction = String(row?.direction ?? row?.type ?? "topup").toLowerCase();
  const currency = String(row?.currency ?? "RUB").toUpperCase();
  return /success|succeed|paid|complete|выполн|успеш/iu.test(status)
    && !/withdraw|debit|expense|списан|вывод/iu.test(direction)
    && currency === "RUB";
}

function amountKopecks(row) {
  if (Number.isSafeInteger(Number(row?.amount_kopecks))) return Number(row.amount_kopecks);
  if (Number.isSafeInteger(Number(row?.amountKopecks))) return Number(row.amountKopecks);
  const value = String(row?.amount ?? "");
  if (!/^\d+(?:\.\d{1,12})?$/u.test(value)) return null;
  const result = Math.round(Number(value) * 100);
  return Number.isSafeInteger(result) && result >= 0 ? result : null;
}

function balanceKopecks(payload) {
  const direct = payload?.balance_kopecks ?? payload?.balanceKopecks ?? payload?.amount_kopecks;
  if (Number.isSafeInteger(Number(direct)) && Number(direct) >= 0) return Number(direct);
  return amountKopecks({ amount: payload?.amount ?? payload?.balance });
}

export function createMcpClient({ endpoint, token, fetchImpl = fetch }) {
  let id = 1;
  let initialized = false;
  let sessionId = null;
  async function request(method, params = {}) {
    if (!initialized && method !== "initialize" && method !== "notifications/initialized") {
      await request("initialize", { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: { name: "metaflora-polza-funding-agent", version: "1.0.0" } });
      await request("notifications/initialized");
      initialized = true;
    }
    const notification = method.startsWith("notifications/");
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { Accept: "application/json, text/event-stream", "Content-Type": "application/json", Authorization: `Bearer ${token}`, "MCP-Protocol-Version": PROTOCOL, ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", ...(notification ? {} : { id: id++ }), method, params }),
      signal: AbortSignal.timeout(15000)
    });
    sessionId = response.headers.get("mcp-session-id") || sessionId;
    if (!response.ok) throw new FundingError(response.status === 429 ? "provider_rate_limited" : "mcp_http_error", "Polza MCP request failed", { retryable: response.status === 429 || response.status >= 500, externalChargeStarted: false });
    if (notification) return {};
    const body = await response.text();
    const messages = body.split(/\r?\n/u).filter(Boolean).map((line) => line.startsWith("data:") ? line.slice(5).trim() : line).map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
    const message = messages.at(-1) ?? {};
    if (message.error) throw new FundingError("mcp_error", "Polza MCP request failed", { externalChargeStarted: false });
    return message.result ?? message;
  }
  async function tool(name, args = {}) {
    const result = await request("tools/call", { name, arguments: args });
    const unwrapped = parseText(result);
    if (result?.isError || unwrapped?.isError) throw new FundingError("tool_call_failed", "Polza MCP tool failed", { externalChargeStarted: false });
    return unwrapped;
  }
  return Object.freeze({
    async getBalance() {
      const value = await tool("get_balance");
      const amount = balanceKopecks(value);
      if (!Number.isSafeInteger(amount) || amount < 0) throw new FundingError("verification_failed", "Invalid Polza balance");
      return { balanceKopecks: amount, currency: "RUB" };
    },
    async findTransaction({ amountKopecks: expected, after, excluded = [] }) {
      const payload = await tool("get_transaction_history");
      const minimum = new Date(after).getTime();
      const matches = rows(payload).filter((row) => {
        const id = transactionId(row);
        const created = new Date(row.created_at ?? row.createdAt ?? row.occurred_at ?? 0).getTime();
        return id && !excluded.includes(id) && successful(row) && amountKopecks(row) === expected && created >= minimum;
      });
      if (matches.length > 1) throw new FundingError("ambiguous_transaction", "Multiple matching Polza transactions");
      if (!matches[0]) return null;
      return { transactionId: transactionId(matches[0]) };
    },
    async getTransactionIds() {
      const payload = await tool("get_transaction_history");
      return rows(payload).map(transactionId).filter(Boolean);
    },
    async verifyTransaction({ transactionId, amountKopecks: expected }) {
      const payload = await tool("get_transaction_history");
      const row = rows(payload).find((item) => String(item.transaction_id ?? item.transactionId ?? item.external_id ?? item.id ?? "") === transactionId);
      if (!row || !successful(row) || amountKopecks(row) !== expected) throw new FundingError("verification_failed", "Polza transaction mismatch");
      return { transactionId, amountKopecks: expected, currency: "RUB" };
    }
  });
}
