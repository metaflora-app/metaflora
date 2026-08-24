import { loadAdminSession } from "./admin-client";

function normalizeStatus(payload) {
  return {
    connected: Boolean(payload?.connected),
    provider: payload?.provider ?? "openrouter",
    model: payload?.model ?? null,
    missingEnv: Array.isArray(payload?.missingEnv) ? payload.missingEnv : [],
    invalidEnv: Array.isArray(payload?.invalidEnv) ? payload.invalidEnv : [],
    mode: payload?.mode ?? "read-only",
  };
}

function normalizeReply(payload) {
  return {
    answer: String(payload?.answer ?? ""),
    repairPlan: Array.isArray(payload?.repairPlan) ? payload.repairPlan : [],
    toolActions: Array.isArray(payload?.toolActions) ? payload.toolActions : [],
  };
}

async function readEnvelope(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success !== true) {
    throw new Error(body.error || `agent request failed: ${response.status}`);
  }
  return body.data ?? {};
}

export async function loadAgentStatus(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
  const response = await fetchImpl("/api/agent/status", {
    method: "GET",
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  return normalizeStatus(await readEnvelope(response));
}

export async function sendAgentMessage(messages, fetchImpl = globalThis.fetch, options = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
  const { csrfToken } = await loadAdminSession(fetchImpl);
  const response = await fetchImpl("/api/agent/chat", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({ messages, ...options }),
  });
  return normalizeReply(await readEnvelope(response));
}

export async function loadAgentDiagnostics(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
  const response = await fetchImpl("/api/agent/diagnostics", {
    method: "GET",
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  return readEnvelope(response);
}

function diagnosticIdempotencyKey(prefix) {
  const randomPart =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return `crm.diagnostic.${prefix}.${randomPart}`;
}

async function postDiagnosticCommand(path, payload, fetchImpl) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
  const { csrfToken } = await loadAdminSession(fetchImpl);
  const response = await fetchImpl(path, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(payload),
  });
  return readEnvelope(response);
}

export function injectControlledDiagnosticFailure(fetchImpl = globalThis.fetch) {
  return postDiagnosticCommand(
    "/api/agent/diagnostics/test-failure",
    { idempotencyKey: diagnosticIdempotencyKey("failure") },
    fetchImpl,
  );
}

export function executeDiagnosticRepair(actionId, fetchImpl = globalThis.fetch) {
  const cleanActionId = String(actionId ?? "").trim();
  if (cleanActionId !== "repair_synthetic_canary") {
    throw new TypeError("unsupported repair action");
  }
  return postDiagnosticCommand(
    "/api/agent/diagnostics/repair",
    {
      actionId: cleanActionId,
      approval: "ПОДТВЕРЖДАЮ",
      idempotencyKey: diagnosticIdempotencyKey("repair"),
    },
    fetchImpl,
  );
}
