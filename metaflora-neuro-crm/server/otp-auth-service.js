import { randomBytes } from "node:crypto";

const GATEWAY_ORIGIN = "https://gatewayapi.telegram.org";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;

function envValue(env, name) {
  return String(env[name] ?? "").trim();
}

function secureId() {
  return randomBytes(32).toString("base64url");
}

function gatewayError(body) {
  const label = String(body?.error ?? "gateway request failed")
    .replace(/[^A-Za-z0-9_ -]/g, "")
    .slice(0, 80);
  return new Error(label || "gateway request failed");
}

export function createTelegramGatewayOtpService({
  env = process.env,
  fetchImpl = fetch,
  randomId = secureId,
  nowMs = () => Date.now(),
  challengeTtlMs = CHALLENGE_TTL_MS,
  sessionTtlMs = SESSION_TTL_MS,
  requestLimit = 3,
} = {}) {
  const token = envValue(env, "TELEGRAM_GATEWAY_TOKEN");
  const phoneNumber = envValue(env, "TELEGRAM_GATEWAY_PHONE_NUMBER");
  const callbackUrl = envValue(env, "TELEGRAM_GATEWAY_CALLBACK_URL");
  if (!token) throw new Error("TELEGRAM_GATEWAY_TOKEN is required");
  if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
    throw new Error("TELEGRAM_GATEWAY_PHONE_NUMBER must use E.164");
  }
  if (callbackUrl && !/^https:\/\//i.test(callbackUrl)) {
    throw new Error("TELEGRAM_GATEWAY_CALLBACK_URL must use HTTPS");
  }
  if (typeof fetchImpl !== "function") throw new TypeError("fetch is required");

  const challenges = new Map();
  const sessions = new Map();
  const requestWindows = new Map();

  async function callGateway(method, payload) {
    const response = await fetchImpl(`${GATEWAY_ORIGIN}/${method}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.ok !== true) throw gatewayError(body);
    return body.result;
  }

  function prune() {
    const current = nowMs();
    for (const [id, challenge] of challenges) {
      if (challenge.expiresAt <= current) challenges.delete(id);
    }
    for (const [tokenValue, session] of sessions) {
      if (session.expiresAt <= current) sessions.delete(tokenValue);
    }
    for (const [key, window] of requestWindows) {
      if (window.startedAt + REQUEST_WINDOW_MS <= current) requestWindows.delete(key);
    }
  }

  async function requestCode({ clientKey }) {
    prune();
    const key = String(clientKey ?? "").slice(0, 200);
    const current = nowMs();
    const existingWindow = requestWindows.get(key);
    const nextWindow =
      existingWindow && existingWindow.startedAt + REQUEST_WINDOW_MS > current
        ? { startedAt: existingWindow.startedAt, count: existingWindow.count + 1 }
        : { startedAt: current, count: 1 };
    if (nextWindow.count > requestLimit) throw new Error("too many code requests");
    requestWindows.set(key, nextWindow);

    const gatewayResult = await callGateway("sendVerificationMessage", {
      phone_number: phoneNumber,
      code_length: 6,
      ttl: Math.max(30, Math.min(3600, Math.floor(challengeTtlMs / 1000))),
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
    });
    const requestId = String(gatewayResult?.request_id ?? "");
    if (!requestId) throw new Error("gateway response is incomplete");
    const challengeId = randomId();
    const expiresAt = current + challengeTtlMs;
    challenges.set(challengeId, {
      requestId,
      clientKey: key,
      expiresAt,
      attempts: 0,
    });
    return Object.freeze({
      challengeId,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  }

  async function verifyCode({ challengeId, code, clientKey }) {
    prune();
    const id = String(challengeId ?? "");
    const challenge = challenges.get(id);
    if (!challenge || challenge.clientKey !== String(clientKey ?? "").slice(0, 200)) {
      throw new Error("challenge is invalid");
    }
    if (!/^\d{4,8}$/.test(String(code ?? ""))) throw new Error("code is invalid");
    if (challenge.attempts >= 5) {
      challenges.delete(id);
      throw new Error("code attempts exceeded");
    }
    const nextChallenge = { ...challenge, attempts: challenge.attempts + 1 };
    challenges.set(id, nextChallenge);
    const result = await callGateway("checkVerificationStatus", {
      request_id: challenge.requestId,
      code: String(code),
    });
    const status = result?.verification_status?.status;
    if (status !== "code_valid") {
      if (["expired", "code_max_attempts_exceeded"].includes(status)) {
        challenges.delete(id);
      }
      throw new Error(status === "code_invalid" ? "code is invalid" : "verification failed");
    }
    challenges.delete(id);
    const sessionToken = randomId();
    const expiresAt = nowMs() + sessionTtlMs;
    sessions.set(sessionToken, { expiresAt });
    return Object.freeze({
      sessionToken,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  }

  function isSessionValid(sessionToken) {
    prune();
    return sessions.has(String(sessionToken ?? ""));
  }

  function revokeSession(sessionToken) {
    sessions.delete(String(sessionToken ?? ""));
  }

  return Object.freeze({
    requestCode,
    verifyCode,
    isSessionValid,
    revokeSession,
  });
}
