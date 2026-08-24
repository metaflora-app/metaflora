import http from "node:http";
import httpProxy from "http-proxy";
import { basicAuthorized, bearerAuthorized, browserSessionAuthorized, browserSessionToken } from "./auth.js";

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 128_000) throw new Error("payload_too_large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function requestAmount(payload) {
  const amount = Number(payload?.amountKopecks);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new TypeError("amountKopecks is invalid");
  return amount;
}

function providerName(payload) {
  const value = String(payload?.provider ?? "polza").trim().toLowerCase();
  if (!/^(?:polza|gptunnel|routerai|openrouter)$/u.test(value)) throw new TypeError("provider is invalid");
  return value;
}

export function safeErrorDiagnostic(error) {
  const errorName = /^[A-Za-z][A-Za-z0-9]{0,63}$/u.test(String(error?.name || ""))
    ? String(error.name)
    : "Error";
  const errorMessage = String(error?.message || "unknown error")
    .replace(/Bearer\s+\S+/giu, "Bearer <redacted>")
    .replace(/https?:\/\/\S+/giu, "<url>")
    .replace(/\b\d{12,19}\b/gu, "<redacted>")
    .replace(/(?:sk-|shds-)[A-Za-z0-9_-]+/gu, "<redacted>")
    .slice(0, 240);
  return Object.freeze({ errorName, errorMessage });
}

function challenge(response) {
  response.writeHead(401, { "WWW-Authenticate": 'Basic realm="Polza funding browser"', "Cache-Control": "no-store" });
  response.end("Authentication required");
}

function limiter({ maximum, windowMs }) {
  const buckets = new Map();
  return (key) => {
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (current.count >= maximum) return false;
    current.count += 1;
    return true;
  };
}

export function createServer({ config, browser, mcp, providers = null, cryptoSettlement = null }) {
  const providerMap = providers ?? { polza: { browser, ledger: mcp } };
  const health = Object.freeze({
    ok: true,
    service: "metaflora-polza-funding-agent",
    version: "1.0.0",
    releaseId: String(config.releaseId || "local"),
    fundingProviders: Object.freeze(Object.keys(providerMap).sort())
  });
  const proxy = httpProxy.createProxyServer({ target: config.novncTarget, ws: true });
  const allowAdmin = limiter({ maximum: 60, windowMs: 60_000 });
  const allowApi = limiter({ maximum: 120, windowMs: 60_000 });
  proxy.on("error", (_error, _request, response) => {
    if (response?.writeHead) json(response, 502, { success: false, error: "browser_proxy_unavailable" });
  });
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
      if (url.pathname === "/health") return json(response, 200, health);
      if (url.pathname === "/" || url.pathname.startsWith("/browser")) {
        if (!allowAdmin(request.socket.remoteAddress || "unknown")) return json(response, 429, { success: false, error: "rate_limited" });
        const basic = basicAuthorized(request.headers.authorization, config.adminUser, config.adminPassword);
        const session = browserSessionAuthorized(request.headers.cookie, config.adminUser, config.adminPassword);
        if (!basic && !session) return challenge(response);
        if (basic) response.setHeader("Set-Cookie", `funding_browser_session=${browserSessionToken(config.adminUser, config.adminPassword)}; Path=/browser; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
        if (url.pathname === "/") {
          response.writeHead(302, { Location: "/browser/vnc.html?autoconnect=1&resize=scale&path=browser/websockify" });
          return response.end();
        }
        request.url = url.pathname.replace(/^\/browser/u, "") + url.search;
        return proxy.web(request, response);
      }
      if (!url.pathname.startsWith("/api/internal/provider-funding/")) return json(response, 404, { success: false, error: "not_found" });
      if (!allowApi(request.socket.remoteAddress || "unknown")) return json(response, 429, { success: false, error: "rate_limited" });
      if (!bearerAuthorized(request.headers.authorization, config.apiToken)) return json(response, 401, { success: false, error: "unauthorized" });
      if (request.method !== "POST") return json(response, 405, { success: false, error: "method_not_allowed" });
      const payload = request.method === "POST" ? await body(request) : {};
      const operation = url.pathname.split("/").at(-1);
      if (operation === "settle-usdc") {
        if (!cryptoSettlement?.settleCryptoSale) return json(response, 503, { success: false, error: "crypto_settlement_unavailable" });
        return json(response, 200, { success: true, data: await cryptoSettlement.settleCryptoSale(payload) });
      }
      const provider = providerName(payload);
      const target = providerMap[provider];
      if (!target?.browser) return json(response, 503, { success: false, error: "provider_unavailable" });
      const ledger = target.ledger ?? target.browser;
      if (operation === "status") return json(response, 200, { success: true, data: await target.browser.status() });
      if (operation === "balance") return json(response, 200, { success: true, data: await ledger.getBalance() });
      if (operation === "verify") return json(response, 200, { success: true, data: await ledger.verifyTransaction({ transactionId: String(payload.transactionId || ""), expectedAmountKopecks: Number(payload.expectedAmountKopecks), amountKopecks: Number(payload.expectedAmountKopecks), currency: String(payload.currency || (provider === "openrouter" ? "USD" : "RUB")) }) });
      if (operation === "payment-status" && typeof target.browser.paymentStatus === "function") return json(response, 200, { success: true, data: await target.browser.paymentStatus(String(payload.paymentId || "")) });
      if (operation === "resume-checkout" && typeof target.browser.resumeCheckout === "function") return json(response, 200, { success: true, data: await target.browser.resumeCheckout(String(payload.checkoutUrl || "")) });
      if (operation === "charge") return json(response, 200, { success: true, data: await target.browser.charge({ amountKopecks: requestAmount(payload), idempotencyKey: String(payload.idempotencyKey || "") }) });
      if (operation === "charge-batch") return json(response, 200, { success: true, data: await target.browser.charge({ amountKopecks: requestAmount(payload), idempotencyKey: String(payload.idempotencyKey || "") }) });
      return json(response, 404, { success: false, error: "not_found" });
    } catch (error) {
      const code = /^[a-z][a-z0-9_-]{1,63}$/u.test(String(error?.code || "")) ? error.code : "funding_agent_error";
      const diagnostic = safeErrorDiagnostic(error);
      console.error(JSON.stringify({
        level: "error",
        event: "provider_funding.agent_failed",
        operation: request.url?.split("/").at(-1)?.split("?")[0] || "unknown",
        errorCode: code,
        retryable: error?.retryable === true,
        externalChargeStarted: error?.externalChargeStarted === false ? false : null,
        ...diagnostic,
      }));
      json(response, code === "funding_agent_error" ? 400 : 503, { success: false, error: code, retryable: error?.retryable === true, userActionRequired: error?.userActionRequired === true, ...(error?.externalChargeStarted === false ? { externalChargeStarted: false } : {}), ...(Number.isSafeInteger(error?.retryAfterSeconds) ? { retryAfterSeconds: error.retryAfterSeconds } : {}) });
    }
  });
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const authorized = basicAuthorized(request.headers.authorization, config.adminUser, config.adminPassword)
      || browserSessionAuthorized(request.headers.cookie, config.adminUser, config.adminPassword);
    if (!url.pathname.startsWith("/browser/") || !allowAdmin(request.socket.remoteAddress || "unknown") || !authorized) return socket.destroy();
    request.url = url.pathname.replace(/^\/browser/u, "") + url.search;
    proxy.ws(request, socket, head);
  });
  return server;
}
