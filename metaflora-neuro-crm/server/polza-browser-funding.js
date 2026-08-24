import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_POLZA_CHECKOUT_URL = "https://polza.ai/dashboard/billing";
const DEFAULT_SESSION_NAME = "polza-funding";
const DEFAULT_TIMEOUT_MS = 45_000;
const AUTHORIZATION_SESSION_TTL_MS = 10 * 60 * 1000;
const AUTHORIZATION_ACTION_WINDOW_MS = 60 * 1000;
const AUTHORIZATION_ACTION_LIMIT = 120;
const AUTHORIZATION_START_WINDOW_MS = 10 * 60 * 1000;
const AUTHORIZATION_START_LIMIT = 3;
const STATUS_CACHE_MS = 60 * 1000;
const DEFAULT_VIEWPORT = Object.freeze({ width: 1280, height: 800 });
const AUTHORIZATION_CONFIRMATION_FILE = ".polza-worker-authorization.json";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
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

function safeLog(logger, level, event, context = {}) {
  try {
    if (typeof logger?.[level] === "function") logger[level](event, context);
  } catch {
    // Logging must never change payment state.
  }
}

async function visibleUiSnapshot(page) {
  try {
    const controls = await page.locator('button, a, [role="button"], input, select').evaluateAll((elements) => elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden"
          && style.display !== "none"
          && rect.width > 0
          && rect.height > 0;
      })
      .slice(0, 40)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute("role") || null,
        text: (element.innerText || element.getAttribute("aria-label") || "").replace(/\s+/gu, " ").trim().slice(0, 120),
        type: element.getAttribute("type") || null,
        name: element.getAttribute("name") || null,
        placeholder: element.getAttribute("placeholder") || null,
      })));
    return Object.freeze({
      url: diagnosticText(page.url(), 240),
      title: diagnosticText(await page.title(), 120),
      controls,
    });
  } catch (error) {
    return Object.freeze({
      url: diagnosticText(page.url(), 240),
      snapshotError: diagnosticText(error?.message, 160),
    });
  }
}

function withUiSnapshot(error, snapshot) {
  if (error && typeof error === "object") error.uiSnapshot = snapshot;
  return error;
}

function safeStatusErrorCode(error) {
  const candidate = text(error?.code ?? error?.name).toLowerCase();
  if (candidate && candidate !== "error" && /^[a-z][a-z0-9_-]{1,63}$/u.test(candidate)) {
    return candidate;
  }
  const message = text(error?.message).toLowerCase();
  if (/timeout|timed out|exceeded/iu.test(message)) return "browser_timeout";
  if (/running as root|sandbox/iu.test(message)) return "browser_sandbox_blocked";
  if (/executable.*(?:missing|not found|does not exist|doesn't exist)|browser.*(?:missing|not found)/iu.test(message)) {
    return "browser_executable_missing";
  }
  if (/shared object|lib(?:nss|atk|gbm|xkb)|cannot open.*library/iu.test(message)) {
    return "browser_system_dependency_missing";
  }
  if (/failed to launch|browser has been closed|target page.*closed/iu.test(message)) {
    return "browser_launch_failed";
  }
  if (/launch|executable|playwright|chrom(e|ium)/iu.test(message)) {
    return "browser_runtime_unavailable";
  }
  if (/eacces|eperm|permission/iu.test(message)) return "browser_profile_permission";
  if (/ebusy|lock|already in use|singleton/iu.test(message)) return "browser_profile_locked";
  if (/enoent|not found|no such file/iu.test(message)) return "browser_profile_missing";
  if (/read-only/iu.test(message)) return "browser_profile_read_only";
  if (/profile/iu.test(message)) return "browser_profile_unavailable";
  if (/net::|navigation|dns|connection|socket|http/iu.test(message)) {
    return "browser_navigation_failed";
  }
  return "browser_status_probe_failed";
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new TypeError(`${label} must be a positive integer.`);
  }
  return number;
}

function wholeRubles(amountKopecks) {
  const amount = positiveInteger(amountKopecks, "amountKopecks");
  if (amount % 100 !== 0) {
    throw new BrowserFundingError(
      "custom_amount_requires_whole_ruble",
      "Polza custom checkout accepts whole rubles; the ledger amount was not rounded silently.",
    );
  }
  return amount / 100;
}

function safeId(value, label) {
  const normalized = text(value);
  if (!normalized || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,254}$/u.test(normalized)) {
    throw new TypeError(`${label} is invalid.`);
  }
  return normalized;
}

function extractUrl(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^https?:\/\/[^\s"<>]+$/u.test(trimmed)) return trimmed;
    try {
      const parsed = JSON.parse(trimmed);
      return extractUrl(parsed);
    } catch {
      return null;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = extractUrl(item);
      if (result) return result;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (/url|link|checkout|payment/iu.test(key)) {
        const result = extractUrl(child);
        if (result) return result;
      }
    }
    for (const child of Object.values(value)) {
      const result = extractUrl(child);
      if (result) return result;
    }
  }
  return null;
}

function allowedCheckoutUrl(value, allowedHosts) {
  const url = extractUrl(value);
  if (!url) {
    throw new BrowserFundingError("checkout_link_missing", "Polza did not return a checkout link.");
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new BrowserFundingError("checkout_link_invalid", "Polza returned an invalid checkout link.");
  }
  if (parsed.protocol !== "https:" || !allowedHosts.has(parsed.hostname)) {
    throw new BrowserFundingError("checkout_host_not_allowed", "Checkout host is not on the allowlist.");
  }
  return parsed.href;
}

function validateRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new TypeError("funding request is required.");
  }
  const provider = safeId(request.provider, "provider").toLowerCase();
  if (provider !== "polza") throw new TypeError("browser funding supports Polza only.");
  const currency = text(request.currency).toUpperCase();
  if (currency !== "RUB") throw new TypeError("browser funding supports RUB only.");
  return Object.freeze({
    provider,
    allocationKey: safeId(request.allocationKey, "allocationKey"),
    paymentId: safeId(request.paymentId, "paymentId"),
    amountKopecks: positiveInteger(request.amountKopecks, "amountKopecks"),
    currency,
    idempotencyKey: safeId(request.idempotencyKey, "idempotencyKey"),
  });
}

function validateBatchRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new TypeError("funding batch is required.");
  }
  const batchId = safeId(request.batchId, "batchId");
  const idempotencyKey = safeId(request.idempotencyKey, "idempotencyKey");
  const requests = Array.isArray(request.requests) ? request.requests.map(validateRequest) : [];
  if (requests.length < 2 || requests.length > 50) {
    throw new TypeError("funding batch size is invalid.");
  }
  const amountKopecks = positiveInteger(request.amountKopecks, "batch amountKopecks");
  if (requests.reduce((total, item) => total + item.amountKopecks, 0) !== amountKopecks) {
    throw new TypeError("funding batch amount does not match its requests.");
  }
  const identities = new Set();
  for (const item of requests) {
    const identity = `${item.allocationKey}:${item.paymentId}`;
    if (identities.has(identity)) throw new TypeError("funding batch contains a duplicate request.");
    identities.add(identity);
  }
  return Object.freeze({
    provider: "polza",
    batchId,
    amountKopecks,
    currency: "RUB",
    idempotencyKey,
    requests: Object.freeze(requests),
  });
}

function normalizeBrowserResult(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new BrowserFundingError("charge_result_unknown", "Browser payment returned no result.");
  }
  const status = text(result.status).toLowerCase();
  if (status === "authorization_required") {
    throw new BrowserFundingAuthorizationRequiredError();
  }
  if (status === "action_required" || status === "challenge") {
    throw new BrowserFundingActionRequiredError(text(result.code) || "browser_user_action_required");
  }
  if (status !== "succeeded") {
    throw new BrowserFundingError(
      text(result.code) || "charge_result_unknown",
      "Payment was not confirmed; the queue will not repeat an ambiguous charge.",
    );
  }
  const transactionId = text(result.transactionId ?? result.externalId ?? result.id);
  return Object.freeze({ transactionId: transactionId || null });
}

export class BrowserFundingError extends Error {
  constructor(
    code = "browser_funding_error",
    message = "Browser funding failed.",
    { retryable = false, externalChargeStarted = null } = {},
  ) {
    super(message);
    this.name = "BrowserFundingError";
    this.code = code;
    this.retryable = retryable === true;
    if (externalChargeStarted === false) this.externalChargeStarted = false;
  }
}

export class BrowserFundingAuthorizationRequiredError extends BrowserFundingError {
  constructor() {
    super(
      "browser_authorization_required",
      "The persistent Polza browser profile needs one-time authorization.",
    );
    this.name = "BrowserFundingAuthorizationRequiredError";
    this.userActionRequired = true;
  }
}

export class BrowserFundingActionRequiredError extends BrowserFundingError {
  constructor(code = "browser_user_action_required") {
    super(
      code,
      code === "card_enrollment_required"
        ? "The hosted checkout still requires one-time card enrollment."
        : "Polza requested a 3-D Secure, SMS, CAPTCHA, or other manual confirmation.",
    );
    this.name = "BrowserFundingActionRequiredError";
    this.userActionRequired = true;
  }
}

export function createPolzaBrowserFundingConnector({
  mcp,
  browserPayment,
  balanceUrl = DEFAULT_POLZA_CHECKOUT_URL,
  allowedCheckoutHosts = ["polza.ai"],
  logger = null,
} = {}) {
  if (!mcp || typeof mcp !== "object") throw new TypeError("Polza MCP client is required.");
  if (!browserPayment || typeof browserPayment.pay !== "function") {
    throw new TypeError("persistent browser payment adapter is required.");
  }
  const allowedHosts = new Set(
    allowedCheckoutHosts.map((host) => text(host).toLowerCase()).filter(Boolean),
  );
  if (allowedHosts.size === 0) throw new TypeError("at least one checkout host is required.");
  const normalizedBalanceUrl = allowedCheckoutUrl(balanceUrl, allowedHosts);
  const inFlight = new Map();
  let reconciliationTail = Promise.resolve();
  const reconciledTransactionIds = new Set();

  async function reconcileTransaction(input) {
    if (typeof mcp.findMatchingTransaction !== "function") return null;
    let release;
    const previous = reconciliationTail;
    reconciliationTail = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      const result = await mcp.findMatchingTransaction({
        amountKopecks: input.amountKopecks,
        currency: input.currency,
        after: input.startedAt,
        operationId: input.operationId,
        excludeTransactionIds: [...reconciledTransactionIds],
      });
      const transactionId = text(result?.transactionId ?? result?.id);
      if (transactionId) reconciledTransactionIds.add(transactionId);
      return transactionId || null;
    } finally {
      release();
    }
  }

  async function checkout({ amountKopecks, currency, paymentId, allocationKey, idempotencyKey, batchId = null, batchSize = 1 }) {
    const amountRubles = wholeRubles(amountKopecks);
    const startedAt = new Date().toISOString();
    const operationId = null;
    const context = {
      provider: "polza",
      route: "persistent_balance_card",
      mcpLinkCreation: false,
      paymentId,
      allocationKey,
      amountKopecks,
      currency,
      idempotencyKey,
      batchId,
      batchSize,
    };
    safeLog(logger, "info", "crm.provider_funding.charge_started", context);
    try {
      const browserResult = await browserPayment.pay({
        url: normalizedBalanceUrl,
        flow: "balance",
        amountRubles,
        amountKopecks,
        paymentId,
        allocationKey,
        idempotencyKey,
        operationId,
        batchId,
        batchSize,
        profileMode: "persistent",
        loginPerPayment: false,
      });
      const normalized = normalizeBrowserResult(browserResult);
      safeLog(logger, "info", "crm.provider_funding.browser_payment_succeeded", {
        ...context,
        transactionId: normalized.transactionId,
      });
      const transactionId = normalized.transactionId || await reconcileTransaction({
        amountKopecks,
        currency,
        startedAt,
        operationId,
      });
      if (!transactionId) {
        throw new BrowserFundingError(
          "charge_result_unknown",
          "Payment page finished without a verifiable transaction ID.",
        );
      }
      safeLog(logger, "info", "crm.provider_funding.reconciliation_succeeded", {
        ...context,
        transactionId,
      });
      return Object.freeze({ transactionId });
    } catch (error) {
      safeLog(logger, "warn", "crm.provider_funding.charge_failed", {
        ...context,
        errorCode: text(error?.code) || "browser_funding_error",
        retryable: error?.retryable === true,
        userActionRequired: error?.userActionRequired === true,
        externalChargeStarted: error?.externalChargeStarted ?? null,
      ...(diagnosticText(error?.providerMessage)
          ? { providerMessage: diagnosticText(error.providerMessage) }
          : {}),
        ...(error?.uiSnapshot ? { uiSnapshot: error.uiSnapshot } : {}),
      });
      throw error;
    }
  }

  async function runInFlight(key, operationFactory) {
    const existing = inFlight.get(key);
    if (existing) return existing;
    const operation = Promise.resolve().then(operationFactory);
    inFlight.set(key, operation);
    try {
      return await operation;
    } finally {
      if (inFlight.get(key) === operation) {
        inFlight.delete(key);
      }
    }
  }

  async function charge(rawRequest) {
    const request = validateRequest(rawRequest);
    return runInFlight(request.idempotencyKey, () => checkout(request));
  }

  async function chargeBatch(rawRequest) {
    const request = validateBatchRequest(rawRequest);
    return runInFlight(request.idempotencyKey, () => checkout({
      amountKopecks: request.amountKopecks,
      currency: request.currency,
      paymentId: request.batchId,
      allocationKey: request.batchId,
      idempotencyKey: request.idempotencyKey,
      batchId: request.batchId,
      batchSize: request.requests.length,
    }));
  }

  return Object.freeze({
    charge,
    chargeBatch,
    async beginAuthorization() {
      if (typeof browserPayment.beginAuthorization !== "function") {
        throw new BrowserFundingError(
          "browser_authorization_unavailable",
          "Browser authorization is not available for this connector.",
        );
      }
      return browserPayment.beginAuthorization();
    },
    async getAuthorizationView(token) {
      if (typeof browserPayment.getAuthorizationView !== "function") {
        throw new BrowserFundingError(
          "browser_authorization_unavailable",
          "Browser authorization is not available for this connector.",
        );
      }
      return browserPayment.getAuthorizationView(token);
    },
    async authorizationAction(token, action) {
      if (typeof browserPayment.authorizationAction !== "function") {
        throw new BrowserFundingError(
          "browser_authorization_unavailable",
          "Browser authorization is not available for this connector.",
        );
      }
      return browserPayment.authorizationAction(token, action);
    },
    async completeAuthorization(token) {
      if (typeof browserPayment.completeAuthorization !== "function") {
        throw new BrowserFundingError(
          "browser_authorization_unavailable",
          "Browser authorization is not available for this connector.",
        );
      }
      return browserPayment.completeAuthorization(token);
    },
    async cancelAuthorization(token) {
      if (typeof browserPayment.cancelAuthorization !== "function") {
        throw new BrowserFundingError(
          "browser_authorization_unavailable",
          "Browser authorization is not available for this connector.",
        );
      }
      return browserPayment.cancelAuthorization(token);
    },
    async verifyTransaction(input) {
      if (typeof mcp.verifyTransaction !== "function") {
        throw new BrowserFundingError("verification_unavailable", "Polza verification is not configured.");
      }
      return mcp.verifyTransaction(input);
    },
    async getBalance(input) {
      if (typeof mcp.getBalance !== "function") {
        throw new BrowserFundingError("verification_unavailable", "Polza balance verification is not configured.");
      }
      return mcp.getBalance(input);
    },
    async getStatus() {
      if (typeof browserPayment.getStatus === "function") {
        const status = await browserPayment.getStatus();
        const blocked = [
          "blocked_until_authorization",
          "blocked_until_card_enrollment",
          "blocked_until_user_action",
        ].includes(status?.automation)
          || status?.cardEnrollment === "required_once"
          || status?.loginPerPayment !== false;
        if (blocked || status?.authorization !== "authorized") return status;

        // Do not create a disposable checkout link during a health probe. That
        // call is provider state, can be rate-limited, and is not evidence that
        // a payment should be started. The real charge path still validates
        // the exact amount, remembered card, challenge state, transaction ID,
        // and provider balance before it can commit the top-up.
        return Object.freeze({
          ...status,
          automation: "ready",
          cardEnrollment: "ready",
        });
      }
      return Object.freeze({
        persistent: true,
        automation: "ready",
        authorization: "unknown",
        cardEnrollment: "unknown",
        loginPerPayment: false,
      });
    },
    async close() {
      await browserPayment.close?.();
    },
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function amountVisible(body, amountRubles) {
  const normalized = String(body ?? "")
    .replaceAll("\u00a0", " ")
    .replaceAll("₽", " RUB ");
  const amount = String(amountRubles).replaceAll(".", "\\.");
  return new RegExp(`(?:^|\\D)${amount}(?:\\D|$)`, "u").test(normalized);
}

function challengeVisible(body) {
  return /3[- ]?d\s*secure|one[- ]?time password|captcha|смс|sms|код подтверждения|подтвердите операцию/iu.test(
    String(body ?? ""),
  );
}

function loginVisible(body) {
  return /войти|вход|log\s*in|sign\s*in|пароль|password/iu.test(String(body ?? ""));
}

function loginPageUrl(value) {
  try {
    const url = new URL(value);
    return /^\/login(?:\/|$)/u.test(url.pathname);
  } catch {
    return false;
  }
}

function authenticatedDashboardVisible(body) {
  const normalized = String(body ?? "");
  const signals = [
    /нейростуди|studio/iu,
    /api[- ]?ключ|api[- ]?key/iu,
    /хранилищ|storage/iu,
    /пополнить баланс|баланс организации|organization|организац/iu,
  ];
  return signals.filter((signal) => signal.test(normalized)).length >= 3;
}

function createPersistentAuthorizationConfirmationStore(profileDir, {
  fsImpl = { chmod, mkdir, readFile, writeFile },
} = {}) {
  const filePath = join(profileDir, AUTHORIZATION_CONFIRMATION_FILE);
  return Object.freeze({
    async isConfirmed() {
      try {
        const raw = await fsImpl.readFile(filePath, "utf8");
        const parsed = JSON.parse(raw);
        return parsed?.version === 1 && typeof parsed.confirmedAt === "string";
      } catch {
        return false;
      }
    },
    async confirm() {
      await fsImpl.mkdir(profileDir, { recursive: true, mode: 0o700 });
      await fsImpl.writeFile(filePath, JSON.stringify({
        version: 1,
        confirmedAt: new Date().toISOString(),
      }), { encoding: "utf8", mode: 0o600 });
      await fsImpl.chmod(filePath, 0o600);
    },
  });
}

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${label} must be a finite number.`);
  return number;
}

function hashAuthorizationToken(value) {
  return createHash("sha256").update(String(value)).digest();
}

function tokenMatchesHash(token, expectedHash) {
  const actualHash = hashAuthorizationToken(token);
  return Buffer.isBuffer(expectedHash)
    && expectedHash.length === actualHash.length
    && timingSafeEqual(actualHash, expectedHash);
}

export function validateAuthorizationAction(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("authorization action is required.");
  }
  const type = text(value.type).toLowerCase();
  if (!["click", "drag", "type", "press", "scroll", "reload", "back"].includes(type)) {
    throw new TypeError("authorization action type is invalid.");
  }
  const allowedKeys = {
    click: new Set(["type", "x", "y"]),
    drag: new Set(["type", "startX", "startY", "endX", "endY"]),
    type: new Set(["type", "text"]),
    press: new Set(["type", "key"]),
    scroll: new Set(["type", "deltaY"]),
    reload: new Set(["type"]),
    back: new Set(["type"]),
  }[type];
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new TypeError("authorization action contains an unknown field.");
  }
  if (type === "click") {
    const x = finiteNumber(value.x, "x");
    const y = finiteNumber(value.y, "y");
    if (x < 0 || x > DEFAULT_VIEWPORT.width || y < 0 || y > DEFAULT_VIEWPORT.height) {
      throw new TypeError("authorization click is outside the browser viewport.");
    }
    return Object.freeze({ type, x, y });
  }
  if (type === "drag") {
    const startX = finiteNumber(value.startX, "startX");
    const startY = finiteNumber(value.startY, "startY");
    const endX = finiteNumber(value.endX, "endX");
    const endY = finiteNumber(value.endY, "endY");
    const coordinates = [startX, startY, endX, endY];
    if (
      startX < 0 || startX > DEFAULT_VIEWPORT.width
      || endX < 0 || endX > DEFAULT_VIEWPORT.width
      || startY < 0 || startY > DEFAULT_VIEWPORT.height
      || endY < 0 || endY > DEFAULT_VIEWPORT.height
    ) {
      throw new TypeError("authorization drag is outside the browser viewport.");
    }
    if (coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
      throw new TypeError("authorization drag is invalid.");
    }
    return Object.freeze({ type, startX, startY, endX, endY });
  }
  if (type === "type") {
    const typed = typeof value.text === "string" ? value.text : "";
    if (!typed || typed.length > 2_048) throw new TypeError("authorization text is invalid.");
    return Object.freeze({ type, text: typed });
  }
  if (type === "press") {
    const key = text(value.key);
    const allowedKeysForKeyboard = new Set([
      "Tab", "Enter", "Escape", "Backspace", "Delete", "Space",
      "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "PageDown", "PageUp",
      "Home", "End", "Shift+Tab",
    ]);
    if (!allowedKeysForKeyboard.has(key)) throw new TypeError("authorization key is not allowed.");
    return Object.freeze({ type, key });
  }
  if (type === "scroll") {
    const deltaY = finiteNumber(value.deltaY, "deltaY");
    if (deltaY < -2_000 || deltaY > 2_000 || deltaY === 0) {
      throw new TypeError("authorization scroll delta is invalid.");
    }
    return Object.freeze({ type, deltaY });
  }
  return Object.freeze({ type });
}

function successVisible(body) {
  return /успеш|пополнен|оплата прошла|payment successful|success|paid/iu.test(String(body ?? ""));
}

export async function requiresCardEnrollment(page) {
  const field = page.getByRole("textbox", { name: /cardNumber|номер карты/iu }).first();
  if (!(await field.count())) return false;
  try {
    return (await field.isVisible()) && (await field.isEditable());
  } catch {
    return false;
  }
}

function transactionIdFromUrl(value) {
  try {
    const url = new URL(value);
    for (const key of ["transaction_id", "transactionId", "payment_id", "paymentId"]) {
      const candidate = text(url.searchParams.get(key));
      if (candidate) return candidate;
    }
  } catch {
    // The page adapter reports an unknown result below.
  }
  return null;
}

function checkoutOperationId(value) {
  try {
    const url = new URL(value);
    for (const key of ["operationId", "operation_id", "operation"]) {
      const candidate = text(url.searchParams.get(key));
      if (candidate && /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,254}$/u.test(candidate)) return candidate;
    }
  } catch {
    // The link was already validated before this helper is used.
  }
  return null;
}

async function defaultPagePayment(page, {
  url,
  flow = "checkout",
  amountRubles,
  autoSubmit,
  cardHint,
  timeoutMs,
}) {
  if (flow === "balance") {
    return defaultBalancePagePayment(page, {
      url,
      amountRubles,
      autoSubmit,
      cardHint,
      timeoutMs,
    });
  }
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  let body = await page.locator("body").innerText({ timeout: timeoutMs });
  if (loginPageUrl(page.url()) || (loginVisible(body) && !/оплат|пополн/iu.test(body))) {
    throw new BrowserFundingAuthorizationRequiredError();
  }
  if (challengeVisible(body)) {
    throw new BrowserFundingActionRequiredError();
  }
  if (!amountVisible(body, amountRubles)) {
    throw new BrowserFundingError(
      "checkout_amount_not_visible",
      "The checkout page did not display the exact requested amount.",
    );
  }
  if (await requiresCardEnrollment(page)) {
    throw new BrowserFundingActionRequiredError("card_enrollment_required");
  }
  if (!autoSubmit) {
    return Object.freeze({ status: "action_required", code: "browser_payment_disabled" });
  }

  if (cardHint) {
    const card = page.getByText(new RegExp(escapeRegExp(cardHint), "u")).first();
    if (await card.count()) await card.click();
  }
  const payButton = page.getByRole("button", {
    name: /оплатить|пополнить|pay|top up/iu,
  }).first();
  if (!(await payButton.count())) {
    throw new BrowserFundingError(
      "checkout_submit_control_missing",
      "The allowlisted checkout page has no unambiguous payment button.",
    );
  }
  await payButton.click({ noWaitAfter: true });
  await page.waitForTimeout(750);
  body = await page.locator("body").innerText({ timeout: timeoutMs });
  if (challengeVisible(body)) throw new BrowserFundingActionRequiredError();
  if (!successVisible(body)) {
    throw new BrowserFundingError(
      "charge_result_unknown",
      "The payment button was submitted but Polza did not show a success state.",
    );
  }
  return Object.freeze({
    status: "succeeded",
    transactionId: transactionIdFromUrl(page.url()),
  });
}

async function firstVisibleEditable(locators) {
  for (const locator of locators) {
    try {
      if (!(await locator.count())) continue;
      const first = locator.first();
      if (await first.isVisible() && await first.isEditable()) return first;
    } catch {
      // A changing checkout can detach a candidate between count and visibility.
    }
  }
  return null;
}

async function firstVisibleClickable(locators) {
  for (const locator of locators) {
    try {
      if (!(await locator.count())) continue;
      const first = locator.first();
      if (await first.isVisible()) return first;
    } catch {
      // A changing checkout can detach a candidate between count and visibility.
    }
  }
  return null;
}

async function waitForVisibleClickable(page, locators, timeoutMs) {
  const deadline = Date.now() + Math.max(0, timeoutMs);
  do {
    const clickable = await firstVisibleClickable(locators);
    if (clickable) return clickable;
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await page.waitForTimeout(Math.min(250, remaining));
  } while (Date.now() <= deadline);
  return null;
}

function namedActionLocators(page, patterns) {
  const locators = [];
  for (const pattern of patterns) {
    for (const role of ["button", "link"]) {
      if (typeof page.getByRole === "function") {
        locators.push(page.getByRole(role, { name: pattern }).first());
      }
    }
    if (typeof page.getByText === "function") {
      locators.push(page.getByText(pattern).first());
    }
  }
  return locators;
}

async function defaultBalancePagePayment(page, {
  url,
  amountRubles,
  autoSubmit,
  cardHint,
  timeoutMs,
}) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  let body = await page.locator("body").innerText({ timeout: timeoutMs });
  if (loginPageUrl(page.url()) || (loginVisible(body) && !/оплат|пополн/iu.test(body))) {
    throw new BrowserFundingAuthorizationRequiredError();
  }
  if (challengeVisible(body)) throw new BrowserFundingActionRequiredError();
  if (!autoSubmit) {
    return Object.freeze({ status: "action_required", code: "browser_payment_disabled" });
  }

  const openTopup = await waitForVisibleClickable(page, namedActionLocators(page, [
    /^пополнить баланс$|^top up balance$/iu,
    /^пополнить\s+баланс$|^top\s+up\s+balance$/iu,
  ]), Math.min(timeoutMs, 10_000));
  if (!openTopup) {
    throw withUiSnapshot(new BrowserFundingError(
      "balance_topup_control_missing",
      "The Polza balance page has no unambiguous top-up control.",
      { retryable: true, externalChargeStarted: false },
    ), await visibleUiSnapshot(page));
  }
  await openTopup.click();
  await page.waitForTimeout(250);

  const customAmount = await firstVisibleClickable(namedActionLocators(page, [
    /^другая сумма$|^custom amount$/iu,
    /^другая\s+сумма$|^custom\s+amount$/iu,
  ]));
  if (customAmount) {
    await customAmount.click();
    await page.waitForTimeout(100);
  }

  const amountInputCandidates = [
    ...(typeof page.getByPlaceholder === "function"
      ? [page.getByPlaceholder(/5 000 ₽|сумма пополнения/iu).first()]
      : []),
    page.getByRole("spinbutton").first(),
    page.locator(
      'input[type="number"], input[inputmode="decimal"], input[name*="amount" i], input[placeholder*="сумм" i]',
    ).first(),
    page.getByRole("textbox").first(),
  ];
  const amountInput = await firstVisibleEditable(amountInputCandidates)
    || await (async () => {
      const deadline = Date.now() + Math.min(timeoutMs, 5_000);
      while (Date.now() < deadline) {
        await page.waitForTimeout(250);
        const candidate = await firstVisibleEditable(amountInputCandidates);
        if (candidate) return candidate;
      }
      return null;
    })();
  if (!amountInput) {
    throw withUiSnapshot(new BrowserFundingError(
      "balance_amount_input_missing",
      "The Polza balance page has no editable custom amount field.",
      { retryable: true, externalChargeStarted: false },
    ), await visibleUiSnapshot(page));
  }
  await amountInput.fill(String(amountRubles));

  if (await requiresCardEnrollment(page)) {
    throw new BrowserFundingActionRequiredError("card_enrollment_required");
  }
  if (cardHint) {
    const card = page.getByText(new RegExp(escapeRegExp(cardHint), "u")).first();
    if (await card.count()) await card.click();
  } else if (typeof page.getByRole === "function") {
    const savedCard = page.getByRole("button", { name: /Карта ••/iu }).first();
    if (await savedCard.count() && await savedCard.isVisible()) await savedCard.click();
  }

  const payButton = await waitForVisibleClickable(page, namedActionLocators(page, [
    /^оплатить в 1 клик$|^оплатить$|^pay$/iu,
    /^оплатить\s+в\s+1\s+клик$|^оплатить\s*$|^pay\s*$/iu,
  ]), Math.min(timeoutMs, 5_000));
  if (!payButton) {
    throw withUiSnapshot(new BrowserFundingError(
      "balance_submit_control_missing",
      "The Polza balance page has no unambiguous payment button.",
      { retryable: true, externalChargeStarted: false },
    ), await visibleUiSnapshot(page));
  }
  await payButton.click({ noWaitAfter: true });
  await page.waitForTimeout(750);
  body = await page.locator("body").innerText({ timeout: timeoutMs });
  if (challengeVisible(body)) throw new BrowserFundingActionRequiredError();
  const pageUrl = page.url();
  if (!successVisible(body) && !/success|succeeded|paid|payment[_-]?success/iu.test(pageUrl)) {
    throw new BrowserFundingError(
      "charge_result_unknown",
      "The Polza balance page was submitted but did not show a success state.",
    );
  }
  return Object.freeze({ status: "succeeded", transactionId: transactionIdFromUrl(pageUrl) });
}

async function loadPlaywrightRuntime() {
  const { chromium } = await import("playwright");
  return Object.freeze({
    async launchPersistentContext(profileDir, options) {
      return chromium.launchPersistentContext(profileDir, {
        headless: options.headless,
        args: [
          "--disable-dev-shm-usage",
          "--no-first-run",
          "--no-default-browser-check",
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],
        acceptDownloads: false,
      });
    },
  });
}

export function createPlaywrightBrowserPaymentAdapter({
  profileDir,
  sessionName = DEFAULT_SESSION_NAME,
  autoSubmit = false,
  cardHint = "",
  authorizationUrl = DEFAULT_POLZA_CHECKOUT_URL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  runtime = null,
  pagePayment = defaultPagePayment,
  authorizationConfirmationStore = null,
} = {}) {
  const normalizedProfileDir = text(profileDir);
  if (!normalizedProfileDir) throw new TypeError("persistent browser profile directory is required.");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 5_000 || timeoutMs > 180_000) {
    throw new RangeError("browser payment timeout is invalid.");
  }
  if (typeof pagePayment !== "function") throw new TypeError("pagePayment must be a function.");
  const confirmationStore = authorizationConfirmationStore
    ?? createPersistentAuthorizationConfirmationStore(normalizedProfileDir);
  if (
    typeof confirmationStore?.isConfirmed !== "function"
    || typeof confirmationStore?.confirm !== "function"
  ) {
    throw new TypeError("authorization confirmation store is invalid.");
  }
  let contextPromise = null;
  let loadedRuntimePromise = runtime ? Promise.resolve(runtime) : null;
  let authorizationPage = null;
  let authorizationExpiresAt = 0;
  let authorizationTokenHash = null;
  const authorizationActionTimes = [];
  const authorizationStartTimes = [];
  let statusCache = null;
  let statusCachedAt = 0;

  async function getContext() {
    if (!loadedRuntimePromise) loadedRuntimePromise = loadPlaywrightRuntime();
    if (!contextPromise) {
      contextPromise = loadedRuntimePromise.then((loadedRuntime) => {
        if (typeof loadedRuntime.launchPersistentContext !== "function") {
          throw new TypeError("browser runtime must launch persistent contexts.");
        }
        return loadedRuntime.launchPersistentContext(normalizedProfileDir, {
          sessionName,
          headless: true,
          loginPerPayment: false,
          viewport: DEFAULT_VIEWPORT,
        });
      }).catch((error) => {
        contextPromise = null;
        throw error;
      });
    }
    return contextPromise;
  }

  function pruneRateTimes(times, windowMs, now = Date.now()) {
    while (times.length && now - times[0] >= windowMs) times.shift();
  }

  function ensureAuthorizationRateLimit(times, limit, windowMs, code) {
    const now = Date.now();
    pruneRateTimes(times, windowMs, now);
    if (times.length >= limit) {
      const error = new BrowserFundingError(code, "Слишком много действий в окне авторизации.");
      error.userActionRequired = true;
      throw error;
    }
    times.push(now);
  }

  async function closeAuthorizationPage() {
    const page = authorizationPage;
    authorizationPage = null;
    authorizationExpiresAt = 0;
    authorizationTokenHash = null;
    if (page) await page.close?.().catch(() => {});
  }

  function authorizationSessionExpired() {
    return !authorizationPage || !authorizationExpiresAt || Date.now() >= authorizationExpiresAt;
  }

  function clearStatusCache() {
    statusCache = null;
    statusCachedAt = 0;
  }

  function rememberStatus(value) {
    statusCache = Object.freeze({ ...value });
    statusCachedAt = Date.now();
    return statusCache;
  }

  function cachedStatus() {
    return statusCache && Date.now() - statusCachedAt < STATUS_CACHE_MS
      ? statusCache
      : null;
  }

  async function hasExplicitAuthorizationConfirmation() {
    try {
      return await confirmationStore.isConfirmed() === true;
    } catch {
      return false;
    }
  }

  function assertAuthorizationToken(token) {
    if (!authorizationTokenHash || !tokenMatchesHash(token, authorizationTokenHash)) {
      throw new BrowserFundingError("authorization_session_invalid", "Сессия авторизации недействительна.");
    }
  }

  function asAuthorizationError(error) {
    if (error instanceof BrowserFundingError) return error;
    return new BrowserFundingError(
      safeStatusErrorCode(error),
      "Не удалось открыть защищённое окно авторизации.",
    );
  }

  async function currentPageStatus(page) {
    if (!page || page.isClosed?.()) {
      return Object.freeze({
        authorization: "unknown",
        automation: "unavailable",
        cardEnrollment: "unknown",
      });
    }
    const body = await page.locator("body").innerText({ timeout: timeoutMs });
    if (loginPageUrl(page.url()) || loginVisible(body)) {
      return Object.freeze({
        authorization: "required_once",
        automation: "configured_pending_authorization",
        cardEnrollment: "unknown",
      });
    }
    if (challengeVisible(body)) {
      return Object.freeze({
        authorization: "authorized",
        automation: "blocked_until_user_action",
        cardEnrollment: "unknown",
      });
    }
    if (!authenticatedDashboardVisible(body)) {
      return Object.freeze({
        authorization: "unknown",
        automation: "configured_pending_authorization",
        cardEnrollment: "unknown",
      });
    }
    return Object.freeze({
      authorization: "authorized",
      automation: "ready",
      cardEnrollment: "ready",
    });
  }

  async function recoverAuthorizationFromPersistentProfile() {
    const context = await getContext();
    const page = await context.newPage();
    try {
      await page.goto(authorizationUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      const state = await currentPageStatus(page);
      if (state.authorization === "authorized") {
        await confirmationStore.confirm();
      }
      return state;
    } finally {
      await page.close().catch(() => {});
    }
  }

  async function authorizationView(token = "") {
    if (authorizationSessionExpired()) {
      if (authorizationPage) await closeAuthorizationPage();
      return Object.freeze({ active: false });
    }
    assertAuthorizationToken(token);
    const page = authorizationPage;
    const state = await currentPageStatus(page);
    const screenshot = await page.screenshot({ type: "png" });
    return Object.freeze({
      active: true,
      ...state,
      expiresAt: new Date(authorizationExpiresAt).toISOString(),
      viewport: DEFAULT_VIEWPORT,
      image: `data:image/png;base64,${Buffer.from(screenshot).toString("base64")}`,
    });
  }

  async function beginAuthorization() {
    ensureAuthorizationRateLimit(
      authorizationStartTimes,
      AUTHORIZATION_START_LIMIT,
      AUTHORIZATION_START_WINDOW_MS,
      "authorization_start_rate_limited",
    );
    clearStatusCache();
    if (!authorizationSessionExpired()) {
      const token = randomBytes(32).toString("hex");
      authorizationTokenHash = hashAuthorizationToken(token);
      return Object.freeze({ token, ...(await authorizationView(token)) });
    }
    let page = null;
    try {
      const context = await getContext();
      page = await context.newPage();
      await page.goto(authorizationUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      authorizationPage = page;
      authorizationExpiresAt = Date.now() + AUTHORIZATION_SESSION_TTL_MS;
      const token = randomBytes(32).toString("hex");
      authorizationTokenHash = hashAuthorizationToken(token);
      return Object.freeze({ token, ...(await authorizationView(token)) });
    } catch (error) {
      await page?.close?.().catch(() => {});
      throw asAuthorizationError(error);
    }
  }

  async function authorizationAction(token, rawAction) {
    const action = validateAuthorizationAction(rawAction);
    if (authorizationSessionExpired()) {
      if (authorizationPage) await closeAuthorizationPage();
      throw new BrowserFundingError(
        "authorization_session_expired",
        "Сессия авторизации истекла; начни авторизацию заново.",
      );
    }
    assertAuthorizationToken(token);
    ensureAuthorizationRateLimit(
      authorizationActionTimes,
      AUTHORIZATION_ACTION_LIMIT,
      AUTHORIZATION_ACTION_WINDOW_MS,
      "authorization_action_rate_limited",
    );
    const page = authorizationPage;
    if (action.type === "click") await page.mouse.click(action.x, action.y);
    if (action.type === "drag") {
      const distance = Math.max(
        Math.abs(action.endX - action.startX),
        Math.abs(action.endY - action.startY),
      );
      const steps = Math.min(20, Math.max(6, Math.round(distance / 32)));
      await page.mouse.move(action.startX, action.startY);
      await page.mouse.down();
      await page.mouse.move(action.endX, action.endY, { steps });
      await page.mouse.up();
    }
    if (action.type === "type") {
      if (typeof page.keyboard.insertText === "function") await page.keyboard.insertText(action.text);
      else await page.keyboard.type(action.text);
    }
    if (action.type === "press") await page.keyboard.press(action.key);
    if (action.type === "scroll") await page.mouse.wheel(0, action.deltaY);
    if (action.type === "reload") await page.reload({ waitUntil: "domcontentloaded", timeout: timeoutMs });
    if (action.type === "back") await page.goBack({ waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForTimeout(150);
    return authorizationView(token);
  }

  async function completeAuthorization(token) {
    if (authorizationSessionExpired()) {
      if (authorizationPage) await closeAuthorizationPage();
      throw new BrowserFundingError(
        "authorization_session_expired",
        "Сессия авторизации истекла; начни авторизацию заново.",
      );
    }
    assertAuthorizationToken(token);
    const state = await currentPageStatus(authorizationPage);
    if (state.authorization !== "authorized") {
      const error = new BrowserFundingError(
        "authorization_incomplete",
        "Вход в Polza ещё не подтверждён.",
      );
      error.userActionRequired = true;
      throw error;
    }
    try {
      await confirmationStore.confirm();
    } catch {
      throw new BrowserFundingError(
        "authorization_confirmation_unavailable",
        "Не удалось сохранить подтверждение авторизации в защищённом профиле worker.",
      );
    }
    await closeAuthorizationPage();
    const completed = Object.freeze({ active: false, ...state });
    rememberStatus({
      persistent: true,
      profileMode: "persistent",
      sessionName,
      ...state,
      loginPerPayment: false,
    });
    return completed;
  }

  return Object.freeze({
    async pay(input) {
      if (!(await hasExplicitAuthorizationConfirmation())) {
        const recovered = await recoverAuthorizationFromPersistentProfile();
        if (recovered.authorization !== "authorized") {
          throw new BrowserFundingAuthorizationRequiredError();
        }
      }
      const context = await getContext();
      const page = await context.newPage();
      try {
        return await pagePayment(page, {
          ...input,
          autoSubmit,
          cardHint: text(cardHint),
          timeoutMs,
        });
      } finally {
        await page.close().catch(() => {});
      }
    },
    async getStatus() {
      let authorization = "required_once";
      let probeErrorCode = "";
      let probedState = null;
      if (autoSubmit) {
        try {
          // An active relay is the freshest source of truth. Probing the
          // persistent profile here can navigate the same browser context
          // back to the login page while the user is still completing the
          // one-time authorization.
          if (!authorizationSessionExpired()) {
            const relayState = await currentPageStatus(authorizationPage);
            return Object.freeze({
              persistent: true,
              profileMode: "persistent",
              sessionName,
              ...relayState,
              // Reaching the dashboard is necessary but not sufficient: the
              // encrypted profile marker is committed only by
              // completeAuthorization(). Until then payments stay disabled.
              automation: "configured_pending_authorization",
              loginPerPayment: false,
            });
          }
          if (!(await hasExplicitAuthorizationConfirmation())) {
            const recovered = await recoverAuthorizationFromPersistentProfile();
            return rememberStatus({
              persistent: true,
              profileMode: "persistent",
              sessionName,
              authorization: recovered.authorization,
              authorizationUrl,
              automation: recovered.automation,
              cardEnrollment: recovered.cardEnrollment,
              loginPerPayment: false,
            });
          }
          const knownStatus = cachedStatus();
          if (knownStatus) return knownStatus;
          const context = await getContext();
          const page = await context.newPage();
          try {
            await page.goto(authorizationUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
            probedState = await currentPageStatus(page);
            authorization = probedState.authorization;
          } finally {
            await page.close().catch(() => {});
          }
        } catch (error) {
          probeErrorCode = safeStatusErrorCode(error);
          console.warn(JSON.stringify({
            level: "warn",
            event: "crm.provider_funding.browser_status_probe_failed",
            errorCode: probeErrorCode,
          }));
          authorization = "unknown";
        }
      }
      return rememberStatus({
        persistent: true,
        profileMode: "persistent",
        sessionName,
        authorization,
        authorizationUrl,
        automation: autoSubmit && probedState
          ? probedState.automation
          : autoSubmit && authorization === "authorized"
            ? "ready"
          : autoSubmit
            ? "configured_pending_authorization"
            : "disabled_until_authorization",
        cardEnrollment: probedState?.cardEnrollment ?? "unknown",
        loginPerPayment: false,
        ...(probeErrorCode ? { probeErrorCode } : {}),
      });
    },
    async beginAuthorization() {
      return beginAuthorization();
    },
    async getAuthorizationView(token) {
      return authorizationView(token);
    },
    async authorizationAction(token, action) {
      return authorizationAction(token, action);
    },
    async completeAuthorization(token) {
      return completeAuthorization(token);
    },
    async cancelAuthorization(token) {
      if (!authorizationSessionExpired()) assertAuthorizationToken(token);
      await closeAuthorizationPage();
      clearStatusCache();
      return Object.freeze({ active: false });
    },
    async close() {
      await closeAuthorizationPage();
      if (!contextPromise) return;
      const context = await contextPromise.catch(() => null);
      contextPromise = null;
      await context?.close?.().catch(() => {});
    },
    async inspectCheckout({ url, amountRubles } = {}) {
      const checkoutUrl = text(url);
      if (!checkoutUrl) throw new TypeError("checkout URL is required.");
      const amount = positiveInteger(amountRubles, "amountRubles");
      const context = await getContext();
      const page = await context.newPage();
      try {
        await page.goto(checkoutUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
        const body = await page.locator("body").innerText({ timeout: timeoutMs });
        if (loginVisible(body) && !/оплат|пополн/iu.test(body)) {
          return Object.freeze({
            authorization: "required_once",
            automation: "blocked_until_authorization",
            cardEnrollment: "unknown",
          });
        }
        if (challengeVisible(body)) {
          return Object.freeze({
            authorization: "authorized",
            automation: "blocked_until_user_action",
            cardEnrollment: "unknown",
          });
        }
        if (!amountVisible(body, amount)) {
          return Object.freeze({
            authorization: "authorized",
            automation: "unavailable",
            cardEnrollment: "unknown",
          });
        }
        const enrolled = !(await requiresCardEnrollment(page));
        return Object.freeze({
          authorization: "authorized",
          automation: enrolled ? "ready" : "blocked_until_card_enrollment",
          cardEnrollment: enrolled ? "ready" : "required_once",
        });
      } finally {
        await page.close().catch(() => {});
      }
    },
  });
}

export function createPolzaBrowserFundingConfig(env = process.env) {
  const profileDir = text(env.HERMES_BROWSER_PROFILE_DIR || env.POLZA_BROWSER_PROFILE_DIR);
  const enabled = text(env.POLZA_BROWSER_FUNDING_ENABLED).toLowerCase() === "true";
  const autoSubmit = text(env.POLZA_BROWSER_AUTO_SUBMIT).toLowerCase() === "true";
  const cardHint = text(env.POLZA_BROWSER_CARD_HINT);
  const sessionName = text(env.POLZA_BROWSER_SESSION_NAME) || DEFAULT_SESSION_NAME;
  const allowedHosts = (text(env.POLZA_BROWSER_ALLOWED_HOSTS) || "polza.ai,www.payanyway.ru")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return Object.freeze({
    enabled,
    autoSubmit,
    profileDir: profileDir || null,
    cardHint: cardHint || null,
    sessionName,
    allowedHosts: Object.freeze(allowedHosts),
    checkoutUrl: text(env.POLZA_CHECKOUT_URL) || DEFAULT_POLZA_CHECKOUT_URL,
    loginPerPayment: false,
  });
}
