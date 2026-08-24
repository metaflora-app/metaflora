const SECRET_KEYS = /(?:api[_-]?key|authorization|cookie|password|secret|token|file[_-]?data|buffer|bytes)/i;
const SENSITIVE_TEXT_FIELDS = /(?:prompt|messages?|content|input|output|choices?|response)/i;
const EVENT_NAME = /^[a-z][a-z0-9_.-]{1,119}$/;
const CATEGORY = /^[a-z][a-z0-9_-]{1,39}$/;
const SUBJECT_TYPE = /^(?:model|agent|tool|voice|music|system)$/;
const SAFE_KEY = /^[a-zA-Z][a-zA-Z0-9_.:-]{0,199}$/;
const TELEGRAM_ID = /^[1-9]\d{0,19}$/;

function boundedString(value, maximum) {
  return String(value ?? '').replace(/\u0000/g, '').slice(0, maximum);
}

function sanitizedString(value) {
  const bounded = boundedString(value, 20_000);
  if (!/^https?:\/\//iu.test(bounded)) return bounded;
  try {
    const url = new URL(bounded);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return bounded;
  }
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && !Buffer.isBuffer(value);
}

function sanitizedValue(value, depth) {
  if (depth > 6 || value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') return sanitizedString(value);
  if (Buffer.isBuffer(value) || ArrayBuffer.isView(value)) return undefined;
  if (Array.isArray(value)) {
    return value
      .slice(0, 100)
      .map((item) => sanitizedValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }
  if (!plainObject(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_KEYS.test(key))
      .slice(0, 100)
      .map(([key, item]) => [boundedString(key, 100), sanitizedValue(item, depth + 1)])
      .filter(([, item]) => item !== undefined)
  );
}

export function sanitizeHistoryMetadata(value) {
  return plainObject(value) ? Object.freeze(sanitizedValue(value, 0)) : Object.freeze({});
}

export function sanitizeAuditText(value, maximum = 1_000) {
  if (value === null || value === undefined) return '';
  const bounded = boundedString(value, maximum);
  return bounded
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/giu, '$1 [REDACTED]')
    .replace(/\b(?:sk|or|rq|fal|key|token|secret)[-_][A-Za-z0-9._~+/=-]{8,}/giu, '[REDACTED]')
    .replace(/\b(prompt|content|input|output|message)\s*=\s*(["'])(?:(?!\2).){0,2000}\2/giu, '$1=$2[REDACTED]$2')
    .replace(/([?&](?:api[_-]?key|key|token|secret|password|authorization|prompt|content|input|output|message)=)[^&"'}]+/giu, '$1[REDACTED]')
    .replace(
      new RegExp(`(["'])(${SENSITIVE_TEXT_FIELDS.source})\\1(\\s*:\\s*)(["'])(?:(?!\\4).){0,2000}\\4`, 'giu'),
      '$1$2$1$3$4[REDACTED]$4'
    );
}

function optionalTelegramId(value, label) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value);
  if (!TELEGRAM_ID.test(normalized)) throw new TypeError(`Invalid ${label}.`);
  return normalized;
}

function optionalIntegerString(value, label) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value);
  if (!/^\d{1,24}$/.test(normalized)) throw new TypeError(`Invalid ${label}.`);
  return normalized;
}

function optionalKey(value, label) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = boundedString(value, 200);
  if (!SAFE_KEY.test(normalized)) throw new TypeError(`Invalid ${label}.`);
  return normalized;
}

export function normalizeHistoryEvent(value, now = new Date()) {
  if (!value || typeof value !== 'object') throw new TypeError('History event is required.');
  if (String(value.eventName ?? '').length > 120) throw new TypeError('Invalid event name.');
  if (String(value.category ?? '').length > 40) throw new TypeError('Invalid event category.');
  const eventName = boundedString(value.eventName, 120);
  const category = boundedString(value.category, 40);
  if (!EVENT_NAME.test(eventName)) throw new TypeError('Invalid event name.');
  if (!CATEGORY.test(category)) throw new TypeError('Invalid event category.');
  const telegramUserId = optionalTelegramId(value.telegramUserId, 'Telegram user id');
  if (!telegramUserId) throw new TypeError('Invalid Telegram user id.');
  const subjectType = value.subjectType
    ? boundedString(value.subjectType, 20)
    : null;
  if (subjectType && !SUBJECT_TYPE.test(subjectType)) throw new TypeError('Invalid subject type.');
  const timestamp = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(timestamp.valueOf())) throw new TypeError('Invalid event date.');

  return Object.freeze({
    eventName,
    category,
    telegramUserId,
    telegramChatId: optionalTelegramId(value.telegramChatId, 'Telegram chat id'),
    telegramUpdateId: optionalIntegerString(value.telegramUpdateId, 'Telegram update id'),
    telegramMessageId: optionalIntegerString(value.telegramMessageId, 'Telegram message id'),
    requestKey: optionalKey(value.requestKey, 'request key'),
    conversationKey: optionalKey(value.conversationKey, 'conversation key'),
    subjectType,
    subjectId: optionalKey(value.subjectId, 'subject id'),
    occurredAt: timestamp.toISOString(),
    metadata: sanitizeHistoryMetadata(value.metadata)
  });
}
