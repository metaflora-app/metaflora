const ID = /^[a-z0-9][a-z0-9:_-]{0,127}$/;
const STATUSES = new Set(['active', 'completed', 'cancelled', 'expired']);
const DAY_MS = 86_400_000;

const integer = (value, label, { min = 0, max = 1_000_000 } = {}) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) throw new TypeError(`Invalid ${label}.`);
  return number;
};
const telegramId = (value) => {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,19}$/.test(id)) throw new TypeError('Invalid Telegram user id.');
  return id;
};
const identifier = (value, label) => {
  const id = String(value ?? '');
  if (!ID.test(id)) throw new TypeError(`Invalid ${label}.`);
  return id;
};
const object = (value, label, maxBytes = 100_000) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > maxBytes) throw new TypeError(`${label} is too large.`);
  return structuredClone(value);
};

export function normalizeEntertainmentSession(input, now = new Date()) {
  const timestamp = new Date(now);
  if (Number.isNaN(timestamp.valueOf())) throw new TypeError('Invalid session timestamp.');
  const status = String(input?.status ?? 'active');
  if (!STATUSES.has(status)) throw new TypeError('Invalid status.');
  const media = input?.mediaCounts ?? {};
  const updatedAt = timestamp.toISOString();
  const expires = input?.expiresAt ? new Date(input.expiresAt) : new Date(timestamp.valueOf() + DAY_MS);
  if (Number.isNaN(expires.valueOf())) throw new TypeError('Invalid expiry.');
  return Object.freeze({
    telegramUserId: telegramId(input?.telegramUserId),
    sessionId: identifier(input?.sessionId, 'session id'),
    scenarioId: identifier(input?.scenarioId, 'scenario id'),
    version: integer(input?.version ?? 1, 'version', { min: 1, max: 1000 }),
    step: integer(input?.step ?? 0, 'step', { max: 10_000 }),
    status,
    charged: Boolean(input?.charged),
    cost: integer(input?.cost ?? 0, 'cost'),
    mediaCounts: Object.freeze({
      image: integer(media.image ?? 0, 'image count', { max: 100 }),
      video: integer(media.video ?? 0, 'video count', { max: 100 }),
      audio: integer(media.audio ?? 0, 'audio count', { max: 100 })
    }),
    state: Object.freeze(object(input?.state ?? {}, 'state')),
    transitionKey: input?.transitionKey ? identifier(input.transitionKey, 'transition key') : null,
    revision: integer(input?.revision ?? 0, 'revision'),
    updatedAt,
    expiresAt: expires.toISOString()
  });
}

export function entertainmentSessionProjection(session) {
  return Object.freeze({
    scenarioId: session.scenarioId, version: session.version, step: session.step,
    status: session.status, charged: session.charged, cost: session.cost,
    mediaCounts: Object.freeze({ ...session.mediaCounts })
  });
}

export class InMemoryEntertainmentSessionRepository {
  #records = new Map();
  #transitions = new Map();
  constructor({ now = () => new Date() } = {}) { this.now = now; }
  key(userId, sessionId) { return `${userId}:${sessionId}`; }
  async load({ telegramUserId, sessionId }) {
    const key = this.key(telegramId(telegramUserId), identifier(sessionId, 'session id'));
    const found = this.#records.get(key) ?? null;
    if (!found) return null;
    if (Date.parse(found.expiresAt) <= new Date(this.now()).valueOf()) { this.#records.delete(key); return null; }
    return found;
  }
  async loadActive({ telegramUserId }) {
    const id = telegramId(telegramUserId);
    const found = [...this.#records.values()].filter((item) => item.telegramUserId === id && item.status === 'active')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return found ? this.load({ telegramUserId: id, sessionId: found.sessionId }) : null;
  }
  async save(input) {
    const normalized = normalizeEntertainmentSession(input, this.now());
    const key = this.key(normalized.telegramUserId, normalized.sessionId);
    if (normalized.transitionKey) {
      const duplicate = this.#transitions.get(`${key}:${normalized.transitionKey}`);
      if (duplicate) return duplicate;
    }
    const current = this.#records.get(key);
    if (input.expectedRevision !== undefined && Number(input.expectedRevision) !== (current?.revision ?? 0)) {
      throw new Error('Entertainment session revision conflict.');
    }
    const saved = Object.freeze({ ...normalized, revision: (current?.revision ?? 0) + 1 });
    this.#records = new Map(this.#records).set(key, saved);
    if (saved.transitionKey) this.#transitions = new Map(this.#transitions).set(`${key}:${saved.transitionKey}`, saved);
    return saved;
  }
}
