import {
  createSafeAuditEvent,
  sanitizeAuditMetadata,
} from "./audit-sanitizer.js";

export function createAdminActionState() {
  return Object.freeze({
    processed: Object.freeze({}),
    auditLog: Object.freeze([]),
  });
}

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}

export function executeIdempotentAdminAction(state, command, handler) {
  const idempotencyKey = requiredText(
    command.idempotencyKey,
    "idempotencyKey",
  );
  const actorId = requiredText(command.actorId, "actorId");
  const action = requiredText(command.action, "action");
  const targetId = command.targetId ? String(command.targetId).trim() : null;
  if (typeof handler !== "function") throw new TypeError("handler is required");

  const prior = state.processed[idempotencyKey];
  if (prior !== undefined) {
    if (
      prior.actorId !== actorId ||
      prior.action !== action ||
      prior.targetId !== targetId
    ) {
      throw new Error("Idempotency key conflict");
    }
    return { state, result: prior.result, replayed: true };
  }

  const result = Object.freeze(sanitizeAuditMetadata(handler(command)));
  const auditEvent = createSafeAuditEvent({
    id: `audit:${idempotencyKey}`,
    actorId,
    action,
    targetId,
    occurredAt: command.occurredAt,
    metadata: command.metadata,
  });
  const nextState = Object.freeze({
    processed: Object.freeze({
      ...state.processed,
      [idempotencyKey]: Object.freeze({
        actorId,
        action,
        targetId,
        result,
      }),
    }),
    auditLog: Object.freeze([...state.auditLog, auditEvent]),
  });

  return { state: nextState, result, replayed: false };
}
