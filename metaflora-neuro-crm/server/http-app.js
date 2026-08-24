import { createHash, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import {
  MetacoinAdjustmentError,
  MetacoinAdjustmentMigrationRequiredError,
  SubscriptionChangeError,
} from "./supabase-crm.js";
import { validateAuthorizationAction } from "./polza-browser-funding.js";
import { createProductCatalogView } from "./product-catalog.js";

const PRODUCT_CATALOG_VIEW = createProductCatalogView(JSON.parse(readFileSync(
  new URL("../src/generated/product-catalog.v1.json", import.meta.url),
  "utf8",
)));

const CONTENT_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
});

function safeEqual(left, right) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function authorizeBasicAuth(header, username, password) {
  if (!username || !password || !header?.startsWith("Basic ")) return false;

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;
    return (
      safeEqual(decoded.slice(0, separator), username) &&
      safeEqual(decoded.slice(separator + 1), password)
    );
  } catch {
    return false;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function getHeader(headers, name) {
  const normalized = name.toLowerCase();
  return headers?.[normalized] ?? headers?.[name] ?? "";
}

function parseCookies(header) {
  return Object.fromEntries(
    String(header ?? "")
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separator = item.indexOf("=");
        return separator < 0
          ? [item, ""]
          : [item.slice(0, separator), decodeURIComponent(item.slice(separator + 1))];
      }),
  );
}

function clientKey(request) {
  const forwarded = String(getHeader(request.headers, "x-forwarded-for"))
    .split(",")[0]
    .trim();
  return (forwarded || request.socket?.remoteAddress || "unknown").slice(0, 200);
}

function bearerToken(headers) {
  const value = String(getHeader(headers, "authorization")).trim();
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function authorizeServiceToken(request, configuredToken) {
  const expected = String(configuredToken ?? "").trim();
  const actual = bearerToken(request.headers);
  return Boolean(expected && actual && safeEqual(actual, expected));
}

function validateProviderFundingRequest(value, kind = "charge") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("invalid provider funding request");
  }
  const allowedKeys = kind === "charge"
    ? new Set(["provider", "allocationKey", "paymentId", "amountKopecks", "currency", "idempotencyKey"])
    : new Set(["provider", "transactionId", "expectedAmountKopecks", "currency"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new TypeError("unknown provider funding field");
  }
  if (String(value.provider ?? "").trim().toLowerCase() !== "polza") {
    throw new TypeError("provider funding provider is invalid");
  }
  const identifiers = kind === "charge"
    ? ["allocationKey", "paymentId", "idempotencyKey"]
    : ["transactionId"];
  for (const field of identifiers) {
    const normalized = String(value[field] ?? "").trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,254}$/u.test(normalized)) {
      throw new TypeError(`invalid ${field}`);
    }
  }
  const amount = Number(kind === "charge" ? value.amountKopecks : value.expectedAmountKopecks);
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 10_000_000) {
    throw new TypeError("invalid provider funding amount");
  }
  if (String(value.currency ?? "").trim().toUpperCase() !== "RUB") {
    throw new TypeError("invalid provider funding currency");
  }
  if (kind === "charge") {
    return Object.freeze({
      provider: "polza",
      allocationKey: String(value.allocationKey).trim(),
      paymentId: String(value.paymentId).trim(),
      amountKopecks: amount,
      currency: "RUB",
      idempotencyKey: String(value.idempotencyKey).trim(),
    });
  }
  return Object.freeze({
    provider: "polza",
    transactionId: String(value.transactionId).trim(),
    expectedAmountKopecks: amount,
    currency: "RUB",
  });
}

function validateProviderFundingBatchRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("invalid provider funding batch");
  }
  const allowedKeys = new Set([
    "provider",
    "batchId",
    "amountKopecks",
    "currency",
    "idempotencyKey",
    "requests",
  ]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new TypeError("unknown provider funding batch field");
  }
  const batchId = String(value.batchId ?? "").trim();
  const idempotencyKey = String(value.idempotencyKey ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,254}$/u.test(batchId)
    || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,254}$/u.test(idempotencyKey)) {
    throw new TypeError("invalid provider funding batch identity");
  }
  if (String(value.provider ?? "").trim().toLowerCase() !== "polza"
    || String(value.currency ?? "").trim().toUpperCase() !== "RUB") {
    throw new TypeError("provider funding batch provider or currency is invalid");
  }
  if (!Array.isArray(value.requests) || value.requests.length < 2 || value.requests.length > 50) {
    throw new TypeError("invalid provider funding batch size");
  }
  const requests = value.requests.map((request) => validateProviderFundingRequest(request, "charge"));
  const identities = new Set();
  for (const request of requests) {
    const identity = `${request.allocationKey}:${request.paymentId}`;
    if (identities.has(identity)) throw new TypeError("duplicate provider funding batch request");
    identities.add(identity);
  }
  const amountKopecks = Number(value.amountKopecks);
  const calculatedAmount = requests.reduce((total, request) => total + request.amountKopecks, 0);
  if (!Number.isSafeInteger(amountKopecks) || amountKopecks <= 0 || amountKopecks > 50_000_000
    || calculatedAmount !== amountKopecks) {
    throw new TypeError("invalid provider funding batch amount");
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

function providerFundingErrorResponse(error) {
  const code = String(error?.code ?? "provider_funding_failed").trim().toLowerCase();
  const safeCode = /^[a-z][a-z0-9_-]{1,63}$/u.test(code)
    ? code
    : "provider_funding_failed";
  const userActionRequired = error?.userActionRequired === true
    || ["browser_authorization_required", "card_enrollment_required", "3ds_required", "browser_user_action_required", "browser_payment_disabled"].includes(safeCode);
  const externalChargeStarted = error?.externalChargeStarted === false;
  const retryAfterSeconds = Number(error?.retryAfterSeconds);
  return {
    status: userActionRequired || safeCode === "charge_result_unknown" ? 409 : 503,
    body: {
      success: false,
      error: safeCode,
      ...(userActionRequired ? { userActionRequired: true } : {}),
      ...(externalChargeStarted ? { externalChargeStarted: false } : {}),
      ...(externalChargeStarted && Number.isSafeInteger(retryAfterSeconds) && retryAfterSeconds > 0
        ? { retryAfterSeconds: Math.min(retryAfterSeconds, 86_400) }
        : {}),
    },
  };
}

function safeProviderFundingStatus(value) {
  const status = value && typeof value === "object" ? value : {};
  const allowed = (candidate, fallback) => {
    const normalized = String(candidate ?? "").trim();
    return normalized || fallback;
  };
  const probeErrorCode = String(status.probeErrorCode ?? "").trim().toLowerCase();
  return Object.freeze({
    persistent: status.persistent === true,
    profileMode: allowed(status.profileMode, "persistent"),
    authorization: allowed(status.authorization, "unknown"),
    automation: allowed(status.automation, "unknown"),
    cardEnrollment: allowed(status.cardEnrollment, "unknown"),
    loginPerPayment: false,
    ...(probeErrorCode && /^[a-z][a-z0-9_-]{1,63}$/u.test(probeErrorCode)
      ? { probeErrorCode }
      : {}),
  });
}

function authorizationTokenFromRequest(request) {
  const token = String(getHeader(request.headers, "x-provider-authorization-token")).trim();
  return /^[a-f0-9]{64}$/iu.test(token) ? token : "";
}

function safeBrowserAuthorizationView(value) {
  const view = value && typeof value === "object" ? value : {};
  const result = {
    active: view.active === true,
    authorization: String(view.authorization ?? "unknown").trim() || "unknown",
    automation: String(view.automation ?? "unknown").trim() || "unknown",
    cardEnrollment: String(view.cardEnrollment ?? "unknown").trim() || "unknown",
  };
  if (view.expiresAt) result.expiresAt = String(view.expiresAt);
  if (view.viewport && Number.isSafeInteger(view.viewport.width) && Number.isSafeInteger(view.viewport.height)) {
    result.viewport = {
      width: view.viewport.width,
      height: view.viewport.height,
    };
  }
  if (typeof view.image === "string" && view.image.startsWith("data:image/png;base64,")) {
    if (view.image.length > 6_000_000) throw new Error("authorization view is too large");
    result.image = view.image;
  }
  return Object.freeze(result);
}

async function readJsonBody(request, maxBytes = 64 * 1024) {
  if (typeof request.body === "string") {
    if (Buffer.byteLength(request.body) > maxBytes) throw new Error("request body too large");
    return JSON.parse(request.body || "{}");
  }
  if (!request[Symbol.asyncIterator]) return {};
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new Error("request body too large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function normalizeOrigins(value) {
  const values = Array.isArray(value) ? value : String(value ?? "").split(",");
  return Object.freeze(
    values
      .map((item) => String(item).trim())
      .filter(Boolean)
      .map((item) => {
        try {
          return new URL(item).origin;
        } catch {
          return "";
        }
      })
      .filter(Boolean),
  );
}

function validateMetacoinCommand(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("invalid command");
  }
  const allowedKeys = new Set([
    "userId",
    "direction",
    "amount",
    "reason",
    "idempotencyKey",
  ]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new TypeError("unknown command field");
  }
  const userId = String(value.userId ?? "").toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(userId)) {
    throw new TypeError("invalid userId");
  }
  const direction = String(value.direction ?? "");
  if (!["credit", "debit"].includes(direction)) throw new TypeError("invalid direction");
  const amount = Number(value.amount);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 2_147_483_647) {
    throw new TypeError("invalid amount");
  }
  const reason = String(value.reason ?? "").trim();
  if (reason.length < 3 || reason.length > 500) throw new TypeError("invalid reason");
  const idempotencyKey = String(value.idempotencyKey ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/.test(idempotencyKey)) {
    throw new TypeError("invalid idempotencyKey");
  }
  return Object.freeze({ userId, direction, amount, reason, idempotencyKey });
}

function validateSubscriptionCommand(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("invalid command");
  }
  const allowedKeys = new Set([
    "userId",
    "planId",
    "durationMonths",
    "reason",
    "idempotencyKey",
  ]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new TypeError("unknown command field");
  }
  const userId = String(value.userId ?? "").toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(userId)) {
    throw new TypeError("invalid userId");
  }
  const planId = String(value.planId ?? "").trim().toLowerCase();
  if (!["newcomer", "amateur", "author", "researcher", "expert"].includes(planId)) {
    throw new TypeError("invalid planId");
  }
  const durationMonths = Number(value.durationMonths ?? 1);
  if (!Number.isInteger(durationMonths) || ![1, 3].includes(durationMonths)) {
    throw new TypeError("invalid durationMonths");
  }
  const reason = String(value.reason ?? "").trim();
  if (reason.length < 3 || reason.length > 500) throw new TypeError("invalid reason");
  const idempotencyKey = String(value.idempotencyKey ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/.test(idempotencyKey)) {
    throw new TypeError("invalid idempotencyKey");
  }
  return Object.freeze({ userId, planId, durationMonths, reason, idempotencyKey });
}

function validateDiagnosticCommand(value, kind) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("invalid diagnostic command");
  }
  const allowed =
    kind === "repair"
      ? new Set(["actionId", "approval", "idempotencyKey"])
      : new Set(["idempotencyKey"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new TypeError("unknown diagnostic command field");
  }
  const idempotencyKey = String(value.idempotencyKey ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/.test(idempotencyKey)) {
    throw new TypeError("invalid idempotency key");
  }
  if (kind !== "repair") return Object.freeze({ idempotencyKey });
  const actionId = String(value.actionId ?? "").trim();
  const approval = String(value.approval ?? "");
  if (actionId !== "repair_synthetic_canary") {
    throw new TypeError("repair action is not allowlisted");
  }
  return Object.freeze({ actionId, approval, idempotencyKey });
}

function isMetacoinError(error) {
  return error instanceof MetacoinAdjustmentError || error?.name === "MetacoinAdjustmentError";
}

function isMigrationRequiredError(error) {
  return (
    error instanceof MetacoinAdjustmentMigrationRequiredError ||
    error?.name === "MetacoinAdjustmentMigrationRequiredError"
  );
}

function applySecurityHeaders(response) {
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-frame-options", "DENY");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader(
    "content-security-policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );
}

function resolveStaticPath(staticRoot, requestPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(requestPath.split("?")[0]);
  } catch {
    return { error: "invalid-encoding" };
  }
  const requested = decoded === "/" ? "/index.html" : decoded;
  const normalized = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const candidate = resolve(staticRoot, `.${normalized}`);
  return {
    path: candidate.startsWith(resolve(staticRoot)) ? candidate : null,
  };
}

function serveFile(response, filePath) {
  response.writeHead(200, {
    "content-type": CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream",
    "cache-control": filePath.endsWith(".html")
      ? "no-store"
      : "public, max-age=31536000, immutable",
  });
  createReadStream(filePath).pipe(response);
}

export function createCrmRequestHandler({
  getDashboardData,
  getUserDetails = null,
  adjustMetacoins = null,
  changeSubscription = null,
  probeProvider = null,
  createPromo = null,
  deletePromo = null,
  adminUsername,
  adminPassword,
  csrfToken = "",
  allowedOrigins = [],
  agentService = null,
  browserSessionService = null,
  providerFundingConnector = null,
  providerFundingServiceToken = "",
  diagnosticService = null,
  otpAuthService = null,
  staticRoot = join(process.cwd(), "dist", "client"),
  now = () => new Date(),
}) {
  if (typeof getDashboardData !== "function") {
    throw new TypeError("getDashboardData must be a function");
  }
  const normalizedAllowedOrigins = normalizeOrigins(allowedOrigins);

  function isAuthorizedWriteRequest(request) {
    const origin = String(getHeader(request.headers, "origin")).trim();
    const requestCsrfToken = String(
      getHeader(request.headers, "x-csrf-token"),
    ).trim();
    const contentType = String(
      getHeader(request.headers, "content-type"),
    ).toLowerCase();
    return (
      origin &&
      normalizedAllowedOrigins.includes(origin) &&
      csrfToken &&
      safeEqual(requestCsrfToken, csrfToken) &&
      contentType.startsWith("application/json")
    );
  }

  return async function handleRequest(request, response) {
    applySecurityHeaders(response);

    const url = new URL(request.url ?? "/", "http://crm.local");
    if (url.pathname === "/api/health") {
      sendJson(response, 200, {
        success: true,
        data: { status: "ok", checkedAt: now().toISOString() },
      });
      return;
    }

    if (url.pathname.startsWith("/api/internal/provider-funding/")) {
      if (request.method !== "POST") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!providerFundingServiceToken) {
        sendJson(response, 503, { success: false, error: "provider funding connector is not configured" });
        return;
      }
      if (!authorizeServiceToken(request, providerFundingServiceToken)) {
        sendJson(response, 401, { success: false, error: "unauthorized" });
        return;
      }
      const operation = url.pathname.slice("/api/internal/provider-funding/".length);
      if (!providerFundingConnector) {
        sendJson(response, 503, { success: false, error: "provider funding connector is not ready" });
        return;
      }
      try {
        if (operation === "status") {
          if (typeof providerFundingConnector.getStatus !== "function") throw new Error("status unavailable");
          const result = await providerFundingConnector.getStatus();
          sendJson(response, 200, { success: true, data: safeProviderFundingStatus(result) });
          return;
        }
        const payload = await readJsonBody(request, 16 * 1024);
        if (operation === "charge") {
          if (typeof providerFundingConnector.charge !== "function") throw new Error("charge unavailable");
          const result = await providerFundingConnector.charge(
            validateProviderFundingRequest(payload, "charge"),
          );
          const transactionId = String(result?.transactionId ?? "").trim();
          if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,254}$/u.test(transactionId)) {
            throw Object.assign(new Error("transaction id missing"), { code: "charge_result_unknown" });
          }
          sendJson(response, 200, { success: true, data: { transactionId } });
          return;
        }
        if (operation === "charge-batch") {
          if (typeof providerFundingConnector.chargeBatch !== "function") throw new Error("batch charge unavailable");
          const result = await providerFundingConnector.chargeBatch(
            validateProviderFundingBatchRequest(payload),
          );
          const transactionId = String(result?.transactionId ?? "").trim();
          if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,254}$/u.test(transactionId)) {
            throw Object.assign(new Error("transaction id missing"), { code: "charge_result_unknown" });
          }
          sendJson(response, 200, { success: true, data: { transactionId } });
          return;
        }
        if (operation === "verify") {
          if (typeof providerFundingConnector.verifyTransaction !== "function") throw new Error("verify unavailable");
          const result = await providerFundingConnector.verifyTransaction(
            validateProviderFundingRequest(payload, "verify"),
          );
          sendJson(response, 200, {
            success: true,
            data: {
              transactionId: String(result?.transactionId ?? ""),
              amountKopecks: Number(result?.amountKopecks),
              currency: String(result?.currency ?? "RUB"),
            },
          });
          return;
        }
        if (operation === "balance") {
          if (typeof providerFundingConnector.getBalance !== "function") throw new Error("balance unavailable");
          const provider = String(payload?.provider ?? "").trim().toLowerCase();
          if (provider !== "polza") throw new TypeError("invalid provider");
          const result = await providerFundingConnector.getBalance({ provider });
          sendJson(response, 200, {
            success: true,
            data: {
              balanceKopecks: Number(result?.balanceKopecks),
              currency: String(result?.currency ?? "RUB"),
            },
          });
          return;
        }
        sendJson(response, 404, { success: false, error: "not found" });
      } catch (error) {
        const mapped = providerFundingErrorResponse(error);
        console.error(JSON.stringify({
          level: "warn",
          event: "crm.provider_funding.internal_failed",
          operation,
          errorCode: mapped.body.error,
          ...(mapped.body.externalChargeStarted === false ? { externalChargeStarted: false } : {}),
          ...(mapped.body.retryAfterSeconds ? { retryAfterSeconds: mapped.body.retryAfterSeconds } : {}),
        }));
        sendJson(response, mapped.status, mapped.body);
      }
      return;
    }

    if (url.pathname === "/api/auth/request-code") {
      if (!otpAuthService || request.method !== "POST") {
        sendJson(response, otpAuthService ? 405 : 404, {
          success: false,
          error: otpAuthService ? "method not allowed" : "not found",
        });
        return;
      }
      try {
        await readJsonBody(request, 2 * 1024);
        const result = await otpAuthService.requestCode({
          clientKey: clientKey(request),
        });
        sendJson(response, 200, { success: true, data: result });
      } catch (error) {
        const limited = /too many/i.test(String(error?.message));
        sendJson(response, limited ? 429 : 503, {
          success: false,
          error: limited
            ? "слишком много попыток — попробуй позже"
            : "код сейчас не отправляется — попробуй ещё раз",
        });
      }
      return;
    }

    if (url.pathname === "/api/auth/verify") {
      if (!otpAuthService || request.method !== "POST") {
        sendJson(response, otpAuthService ? 405 : 404, {
          success: false,
          error: otpAuthService ? "method not allowed" : "not found",
        });
        return;
      }
      try {
        const payload = await readJsonBody(request, 4 * 1024);
        const challengeId = String(payload?.challengeId ?? "");
        const code = String(payload?.code ?? "");
        if (!/^[A-Za-z0-9_-]{4,200}$/.test(challengeId) || !/^\d{4,8}$/.test(code)) {
          throw new TypeError("invalid verification payload");
        }
        const result = await otpAuthService.verifyCode({
          challengeId,
          code,
          clientKey: clientKey(request),
        });
        response.setHeader(
          "set-cookie",
          `crm_session=${encodeURIComponent(result.sessionToken)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`,
        );
        sendJson(response, 200, {
          success: true,
          data: { authenticated: true, expiresAt: result.expiresAt },
        });
      } catch {
        sendJson(response, 401, {
          success: false,
          error: "код неверный или уже истёк",
        });
      }
      return;
    }

    if (url.pathname === "/api/auth/status") {
      if (!otpAuthService || request.method !== "GET") {
        sendJson(response, otpAuthService ? 405 : 404, {
          success: false,
          error: otpAuthService ? "method not allowed" : "not found",
        });
        return;
      }
      const sessionToken = parseCookies(getHeader(request.headers, "cookie")).crm_session;
      sendJson(response, 200, {
        success: true,
        data: { authenticated: otpAuthService.isSessionValid(sessionToken) },
      });
      return;
    }

    if (url.pathname === "/api/auth/logout") {
      if (!otpAuthService || request.method !== "POST") {
        sendJson(response, otpAuthService ? 405 : 404, {
          success: false,
          error: otpAuthService ? "method not allowed" : "not found",
        });
        return;
      }
      const sessionToken = parseCookies(getHeader(request.headers, "cookie")).crm_session;
      otpAuthService.revokeSession(sessionToken);
      response.setHeader(
        "set-cookie",
        "crm_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
      );
      sendJson(response, 200, { success: true, data: { authenticated: false } });
      return;
    }

    const sessionToken = parseCookies(getHeader(request.headers, "cookie")).crm_session;
    const authorized = otpAuthService
      ? otpAuthService.isSessionValid(sessionToken)
      : authorizeBasicAuth(
          request.headers.authorization,
          adminUsername,
          adminPassword,
        );
    const isApiRequest = url.pathname.startsWith("/api/");
    if (!authorized && isApiRequest) {
      sendJson(response, 401, {
        success: false,
        error: "требуется доступ администратора",
      });
      return;
    }

    if (url.pathname === "/api/session") {
      if (request.method !== "GET") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!csrfToken) {
        sendJson(response, 503, {
          success: false,
          error: "write session is not configured",
        });
        return;
      }
      sendJson(response, 200, {
        success: true,
        data: { csrfToken },
      });
      return;
    }

    if (url.pathname === "/api/product-catalog") {
      if (request.method !== "GET") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      sendJson(response, 200, { success: true, data: PRODUCT_CATALOG_VIEW });
      return;
    }

    const authorizationBasePath = "/api/admin/provider-funding/authorization/";
    if (url.pathname.startsWith(authorizationBasePath)) {
      const operation = url.pathname.slice(authorizationBasePath.length);
      const supportedOperations = new Set(["start", "view", "action", "complete", "cancel"]);
      if (!supportedOperations.has(operation)) {
        sendJson(response, 404, { success: false, error: "authorization operation not found" });
        return;
      }
      if (!browserSessionService) {
        sendJson(response, 503, { success: false, error: "browser authorization is not configured" });
        return;
      }
      if (operation === "view") {
        if (request.method !== "GET") {
          sendJson(response, 405, { success: false, error: "method not allowed" });
          return;
        }
        try {
          const view = await browserSessionService.getAuthorizationView(
            authorizationTokenFromRequest(request),
          );
          sendJson(response, 200, { success: true, data: safeBrowserAuthorizationView(view) });
        } catch (error) {
          const mapped = providerFundingErrorResponse(error);
          sendJson(response, mapped.status, mapped.body);
        }
        return;
      }
      if (request.method !== "POST") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!isAuthorizedWriteRequest(request)) {
        sendJson(response, 403, { success: false, error: "write action is not allowed" });
        return;
      }
      try {
        const payload = await readJsonBody(request, 16 * 1024);
        let result;
        if (operation === "start") {
          if (Object.keys(payload).length) throw new TypeError("authorization start body must be empty");
          result = await browserSessionService.beginAuthorization();
          const safeView = safeBrowserAuthorizationView(result);
          const token = String(result?.token ?? "").trim();
          if (!/^[a-f0-9]{64}$/iu.test(token)) throw new Error("authorization token missing");
          sendJson(response, 200, { success: true, data: { token, ...safeView } });
          return;
        }
        const token = authorizationTokenFromRequest(request);
        if (!token) throw new TypeError("authorization token is invalid");
        if (operation === "action") {
          result = await browserSessionService.authorizationAction(
            token,
            validateAuthorizationAction(payload),
          );
        } else if (operation === "complete") {
          if (Object.keys(payload).length) throw new TypeError("authorization complete body must be empty");
          result = await browserSessionService.completeAuthorization(token);
        } else {
          if (Object.keys(payload).length) throw new TypeError("authorization cancel body must be empty");
          result = await browserSessionService.cancelAuthorization(token);
        }
        sendJson(response, 200, { success: true, data: safeBrowserAuthorizationView(result) });
      } catch (error) {
        if (error instanceof SyntaxError || error instanceof TypeError) {
          sendJson(response, 400, { success: false, error: "invalid browser authorization request" });
          return;
        }
        const mapped = providerFundingErrorResponse(error);
        console.warn(JSON.stringify({
          level: "warn",
          event: "crm.provider_funding.browser_authorization.failed",
          operation,
          errorCode: mapped.body.error,
        }));
        sendJson(response, mapped.status, mapped.body);
      }
      return;
    }

    if (url.pathname === "/api/admin/promos") {
      if (request.method !== "POST") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!isAuthorizedWriteRequest(request)) {
        sendJson(response, 403, { success: false, error: "write action is not allowed" });
        return;
      }
      if (typeof createPromo !== "function") {
        sendJson(response, 503, { success: false, error: "write adapter is not configured" });
        return;
      }
      try {
        const body = await readJsonBody(request);
        const allowedKeys = new Set(["code", "rewardType", "rewardValue", "modelIds", "maxRedemptions", "expiresAt"]);
        if (!body || typeof body !== "object" || Array.isArray(body)
          || Object.keys(body).some((key) => !allowedKeys.has(key))) throw new TypeError();
        const code = String(body.code ?? "").trim().toUpperCase();
        const rewardType = String(body.rewardType ?? "");
        const rewardValue = Number(body.rewardValue);
        const modelIds = Array.isArray(body.modelIds) ? [...new Set(body.modelIds.map(String))] : [];
        const productModelIds = new Set(PRODUCT_CATALOG_VIEW.models.map(({ id }) => id));
        if (!/^[A-Z0-9_-]{3,32}$/.test(code)
          || !["metacoins", "discount_percent"].includes(rewardType)
          || !Number.isSafeInteger(rewardValue) || rewardValue < 1
          || (rewardType === "discount_percent" && (rewardValue > 100 || modelIds.length < 1))
          || (rewardType === "metacoins" && modelIds.length > 0)
          || modelIds.some((id) => !productModelIds.has(id))) throw new TypeError();
        const maxRedemptions = body.maxRedemptions == null || body.maxRedemptions === ""
          ? undefined : Number(body.maxRedemptions);
        if (maxRedemptions !== undefined && (!Number.isSafeInteger(maxRedemptions) || maxRedemptions < 1)) throw new TypeError();
        const expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : undefined;
        const result = await createPromo({ code, rewardType, rewardValue, modelIds, ...(maxRedemptions === undefined ? {} : { maxRedemptions }), ...(expiresAt === undefined ? {} : { expiresAt }) });
        sendJson(response, 201, { success: true, data: result });
      } catch (error) {
        if (error instanceof SyntaxError || error instanceof TypeError || error instanceof RangeError) {
          sendJson(response, 422, { success: false, error: "invalid promo" });
          return;
        }
        sendJson(response, 503, { success: false, error: "promo creation is unavailable" });
      }
      return;
    }

    const deletePromoMatch = url.pathname.match(/^\/api\/admin\/promos\/([^/]+)$/u);
    if (deletePromoMatch) {
      if (request.method !== "DELETE") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!isAuthorizedWriteRequest(request)) {
        sendJson(response, 403, { success: false, error: "write action is not allowed" });
        return;
      }
      if (typeof deletePromo !== "function") {
        sendJson(response, 503, { success: false, error: "write adapter is not configured" });
        return;
      }
      try {
        const promoId = decodeURIComponent(deletePromoMatch[1]).toUpperCase();
        if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/u.test(promoId)) {
          throw new TypeError("invalid promo identifier");
        }
        const result = await deletePromo(promoId);
        if (!result) {
          sendJson(response, 404, { success: false, error: "промокод не найден" });
          return;
        }
        sendJson(response, 200, { success: true, data: result });
      } catch (error) {
        if (error instanceof URIError || error instanceof TypeError) {
          sendJson(response, 400, { success: false, error: "invalid promo identifier" });
          return;
        }
        console.error(JSON.stringify({
          level: "error",
          event: "crm.promo.delete.failed",
          message: error instanceof Error ? error.message : "unknown error",
        }));
        sendJson(response, 503, { success: false, error: "promo deletion is unavailable" });
      }
      return;
    }

    if (url.pathname === "/api/admin/metacoins/adjust") {
      if (request.method !== "POST") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!isAuthorizedWriteRequest(request)) {
        sendJson(response, 403, { success: false, error: "write action is not allowed" });
        return;
      }
      if (typeof adjustMetacoins !== "function") {
        sendJson(response, 503, { success: false, error: "write adapter is not configured" });
        return;
      }
      try {
        const command = validateMetacoinCommand(await readJsonBody(request));
        const result = await adjustMetacoins({
          ...command,
          actor: adminUsername,
        });
        sendJson(response, 200, { success: true, data: result });
      } catch (error) {
        if (error instanceof SyntaxError || error instanceof TypeError) {
          sendJson(response, 400, { success: false, error: "invalid adjustment command" });
          return;
        }
        if (isMigrationRequiredError(error)) {
          sendJson(response, 503, { success: false, error: error.message });
          return;
        }
        if (isMetacoinError(error)) {
          const status = ["insufficient_balance", "idempotency_conflict"].includes(error.code)
            ? 409
            : 400;
          sendJson(response, status, { success: false, error: error.message });
          return;
        }
        console.error(
          JSON.stringify({
            level: "error",
            event: "crm.metacoins.adjust.failed",
            message: error instanceof Error ? error.message : "unknown error",
          }),
        );
        sendJson(response, 503, { success: false, error: "write action is unavailable" });
      }
      return;
    }

    if (url.pathname === "/api/admin/subscriptions/change") {
      if (request.method !== "POST") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!isAuthorizedWriteRequest(request)) {
        sendJson(response, 403, { success: false, error: "write action is not allowed" });
        return;
      }
      if (typeof changeSubscription !== "function") {
        sendJson(response, 503, { success: false, error: "write adapter is not configured" });
        return;
      }
      try {
        const command = validateSubscriptionCommand(await readJsonBody(request));
        const result = await changeSubscription({ ...command, actor: adminUsername });
        sendJson(response, 200, { success: true, data: result });
      } catch (error) {
        if (error instanceof SyntaxError || error instanceof TypeError) {
          sendJson(response, 400, { success: false, error: "invalid subscription command" });
          return;
        }
        if (error instanceof SubscriptionChangeError || error?.name === "SubscriptionChangeError") {
          const status = error.code === "idempotency_conflict" ? 409 : 400;
          sendJson(response, status, { success: false, error: error.message });
          return;
        }
        console.error(JSON.stringify({
          level: "error",
          event: "crm.subscription.change.failed",
          message: error instanceof Error ? error.message : "unknown error",
        }));
        sendJson(response, 503, { success: false, error: "write action is unavailable" });
      }
      return;
    }

    if (url.pathname === "/api/admin/providers/probe") {
      if (request.method !== "POST") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!isAuthorizedWriteRequest(request)) {
        sendJson(response, 403, {
          success: false,
          error: "write action is not allowed",
        });
        return;
      }
      if (typeof probeProvider !== "function") {
        sendJson(response, 503, {
          success: false,
          error: "provider probe is not configured",
        });
        return;
      }
      try {
        const payload = await readJsonBody(request, 4 * 1024);
        if (
          !payload ||
          typeof payload !== "object" ||
          Array.isArray(payload) ||
          Object.keys(payload).some((key) => key !== "providerId")
        ) {
          throw new TypeError("invalid provider probe");
        }
        const providerId = String(payload.providerId ?? "")
          .trim()
          .toLowerCase();
        if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(providerId)) {
          throw new TypeError("invalid providerId");
        }
        const result = await probeProvider(providerId);
        if (!result) {
          sendJson(response, 404, {
            success: false,
            error: "провайдер не найден",
          });
          return;
        }
        sendJson(response, 200, { success: true, data: result });
      } catch (error) {
        if (error instanceof SyntaxError || error instanceof TypeError) {
          sendJson(response, 400, {
            success: false,
            error: "invalid provider probe",
          });
          return;
        }
        console.error(
          JSON.stringify({
            level: "error",
            event: "crm.provider.probe.failed",
            message: error instanceof Error ? error.message : "unknown error",
          }),
        );
        sendJson(response, 503, {
          success: false,
          error: "проверка провайдера временно недоступна",
        });
      }
      return;
    }

    const userDetailsMatch = url.pathname.match(
      /^\/api\/users\/([^/]+)\/details$/,
    );
    if (userDetailsMatch) {
      if (request.method !== "GET") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      const userId = String(userDetailsMatch[1]).toLowerCase();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(userId)) {
        sendJson(response, 400, { success: false, error: "invalid user id" });
        return;
      }
      if (typeof getUserDetails !== "function") {
        sendJson(response, 503, {
          success: false,
          error: "user details are unavailable",
        });
        return;
      }
      try {
        const details = await getUserDetails(userId);
        if (!details) {
          sendJson(response, 404, {
            success: false,
            error: "пользователь не найден",
          });
          return;
        }
        sendJson(response, 200, { success: true, data: details });
      } catch (error) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "crm.user.details.failed",
            userId,
            message: error instanceof Error ? error.message : "unknown error",
          }),
        );
        sendJson(response, 503, {
          success: false,
          error: "данные пользователя временно недоступны",
        });
      }
      return;
    }

    if (url.pathname === "/api/readiness") {
      try {
        await getDashboardData();
        sendJson(response, 200, {
          success: true,
          data: { status: "ready", checkedAt: now().toISOString() },
        });
      } catch (error) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "crm.readiness.failed",
            message: error instanceof Error ? error.message : "unknown error",
          }),
        );
        sendJson(response, 503, {
          success: false,
          error: "CRM is not ready",
        });
      }
      return;
    }

    if (url.pathname === "/api/agent/status") {
      if (request.method !== "GET") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      const status = agentService?.getStatus
        ? await agentService.getStatus()
        : {
            connected: false,
            status: "configuration_required",
            mode: "supervised",
            capabilities: [],
          };
      sendJson(response, 200, { success: true, data: status });
      return;
    }

    if (url.pathname === "/api/admin/provider-funding/browser-session") {
      if (request.method !== "GET") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!browserSessionService?.getStatus) {
        sendJson(response, 503, {
          success: false,
          error: "постоянная сессия браузера не настроена",
        });
        return;
      }
      try {
        const status = await browserSessionService.getStatus();
        sendJson(response, 200, { success: true, data: status });
      } catch (error) {
        console.error(JSON.stringify({
          level: "error",
          event: "crm.provider_funding.browser_session.status_failed",
          message: error instanceof Error ? error.message : "unknown error",
        }));
        sendJson(response, 503, {
          success: false,
          error: "статус постоянной сессии временно недоступен",
        });
      }
      return;
    }

    if (url.pathname === "/api/agent/diagnostics") {
      if (request.method !== "GET") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!agentService?.getDiagnostics && !diagnosticService?.getSnapshot) {
        sendJson(response, 503, { success: false, error: "диагностика недоступна" });
        return;
      }
      const result = agentService?.getDiagnostics
        ? await agentService.getDiagnostics()
        : await diagnosticService.getSnapshot();
      sendJson(response, 200, { success: true, data: result });
      return;
    }

    if (
      url.pathname === "/api/agent/diagnostics/test-failure" ||
      url.pathname === "/api/agent/diagnostics/repair"
    ) {
      if (request.method !== "POST") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!isAuthorizedWriteRequest(request)) {
        sendJson(response, 403, { success: false, error: "write action is not allowed" });
        return;
      }
      try {
        const isRepair = url.pathname.endsWith("/repair");
        const payload = validateDiagnosticCommand(
          await readJsonBody(request),
          isRepair ? "repair" : "failure",
        );
        const result = isRepair
          ? await diagnosticService?.executeRepair?.({ ...payload, actor: "admin" })
          : await diagnosticService?.injectControlledFailure?.({
              ...payload,
              actor: "admin",
            });
        if (!result) throw new Error("diagnostic service unavailable");
        sendJson(response, 200, { success: true, data: result });
      } catch (error) {
        const status = Number.isInteger(error?.statusCode)
          ? error.statusCode
          : error instanceof TypeError
            ? 400
            : 503;
        sendJson(response, status, {
          success: false,
          error: status === 503 ? "диагностика временно недоступна" : error.message,
        });
      }
      return;
    }

    if (url.pathname === "/api/agent/chat") {
      if (request.method !== "POST") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }
      if (!isAuthorizedWriteRequest(request)) {
        sendJson(response, 403, {
          success: false,
          error: "write action is not allowed",
        });
        return;
      }
      if (!agentService?.chat) {
        sendJson(response, 503, { success: false, error: "агент не подключён" });
        return;
      }
      try {
        const payload = await readJsonBody(request);
        const result = await agentService.chat(payload);
        sendJson(response, 200, { success: true, data: result });
      } catch (error) {
        const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
        sendJson(response, status, {
          success: false,
          error: status === 500 ? "агент временно недоступен" : error.message,
        });
      }
      return;
    }

    if (url.pathname === "/api/dashboard") {
      if (request.method !== "GET") {
        sendJson(response, 405, { success: false, error: "method not allowed" });
        return;
      }

      try {
        const data = await getDashboardData();
        sendJson(response, 200, { success: true, data });
      } catch (error) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "crm.dashboard.failed",
            message: error instanceof Error ? error.message : "unknown error",
          }),
        );
        sendJson(response, 503, {
          success: false,
          error: "данные CRM временно недоступны",
        });
      }
      return;
    }

    const staticPath = resolveStaticPath(staticRoot, url.pathname);
    if (staticPath.error) {
      sendJson(response, 400, {
        success: false,
        error: "invalid request path",
      });
      return;
    }
    const filePath = staticPath.path;
    if (filePath && existsSync(filePath) && statSync(filePath).isFile()) {
      serveFile(response, filePath);
      return;
    }

    const indexPath = join(staticRoot, "index.html");
    if (existsSync(indexPath)) {
      serveFile(response, indexPath);
      return;
    }

    sendJson(response, 404, { success: false, error: "not found" });
  };
}
