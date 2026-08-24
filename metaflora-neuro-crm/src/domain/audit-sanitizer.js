const SENSITIVE_TERMS = new Set([
  "apikey",
  "authorization",
  "content",
  "cookie",
  "generatedoutput",
  "input",
  "modeloutput",
  "output",
  "password",
  "prompt",
  "requestbody",
  "responsebody",
  "secret",
  "session",
  "token",
]);

const SAFE_STRING_KEYS = new Set([
  "actionCode",
  "errorCode",
  "nextStatus",
  "plan",
  "previousStatus",
  "provider",
  "providerId",
  "reasonCode",
  "requestId",
  "status",
  "transactionId",
  "userId",
]);

function isSensitiveKey(key) {
  const compact = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return [...SENSITIVE_TERMS].some(
    (term) => compact === term || compact.endsWith(term),
  );
}

function sanitizeValue(value, seen, key) {
  if (typeof value === "string") {
    return SAFE_STRING_KEYS.has(key) &&
      /^[\p{L}\p{N}._:@-]{1,100}$/u.test(value)
      ? value
      : undefined;
  }
  if (value === null || ["number", "boolean"].includes(typeof value)) {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object" || seen.has(value)) return undefined;

  seen.add(value);
  if (Array.isArray(value)) {
    const result = value
      .map((item) => sanitizeValue(item, seen, key))
      .filter((item) => item !== undefined);
    seen.delete(value);
    return result;
  }

  const result = Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isSensitiveKey(key))
      .map(([entryKey, item]) => [
        entryKey,
        sanitizeValue(item, seen, entryKey),
      ])
      .filter(([, item]) => item !== undefined),
  );
  seen.delete(value);
  return result;
}

export function sanitizeAuditMetadata(metadata) {
  if (metadata === undefined) return {};
  const sanitized = sanitizeValue(metadata, new WeakSet(), "metadata");
  return sanitized && !Array.isArray(sanitized) ? sanitized : {};
}

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}

export function createSafeAuditEvent(event) {
  const safeEvent = {
    id: requiredText(event.id, "id"),
    actorId: requiredText(event.actorId, "actorId"),
    action: requiredText(event.action, "action"),
    ...(event.targetId ? { targetId: String(event.targetId) } : {}),
    occurredAt: requiredText(event.occurredAt, "occurredAt"),
    metadata: Object.freeze(sanitizeAuditMetadata(event.metadata)),
  };
  return Object.freeze(safeEvent);
}
