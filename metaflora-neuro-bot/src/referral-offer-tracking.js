import { createHmac, timingSafeEqual } from 'node:crypto';

const VERSION = 'v1';

function secretBuffer(value) {
  const buffer = Buffer.from(String(value ?? ''), 'utf8');
  if (buffer.length < 32) throw new TypeError('A strong partner offer tracking secret is required.');
  return buffer;
}

function safeVersion(value) {
  const version = String(value ?? '');
  if (!/^[a-z0-9][a-z0-9._-]{0,79}$/u.test(version)) throw new TypeError('Invalid partner offer version.');
  return version;
}

function signature(payload, secret) {
  return createHmac('sha256', secretBuffer(secret)).update(payload).digest('base64url');
}

export function createReferralOfferTrackingUrl({ publicBaseUrl, secret, telegramId, offerVersion, expiresAt }) {
  const base = new URL(String(publicBaseUrl ?? ''));
  if (base.protocol !== 'https:') throw new TypeError('Partner offer tracking requires HTTPS.');
  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expiry.valueOf())) throw new TypeError('Invalid partner offer tracking expiry.');
  const payload = Buffer.from(JSON.stringify({
    t: String(BigInt(telegramId)),
    v: safeVersion(offerVersion),
    e: expiry.toISOString()
  }), 'utf8').toString('base64url');
  const token = `${VERSION}.${payload}.${signature(`${VERSION}.${payload}`, secret)}`;
  return new URL(`/referral/offer/open/${token}`, base).toString();
}

export function verifyReferralOfferTrackingToken({ token, secret, now = new Date() }) {
  const [version, payload, providedSignature, ...rest] = String(token ?? '').split('.');
  if (version !== VERSION || !payload || !providedSignature || rest.length) {
    throw new TypeError('Invalid partner offer tracking token.');
  }
  const expectedSignature = signature(`${version}.${payload}`, secret);
  const provided = Buffer.from(providedSignature, 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new TypeError('Invalid partner offer tracking token.');
  }
  let parsed;
  try { parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch {}
  const expiresAt = new Date(parsed?.e);
  if (!parsed || !/^\d{1,20}$/u.test(String(parsed.t)) || Number.isNaN(expiresAt.valueOf()) || expiresAt <= now) {
    throw new TypeError('Invalid partner offer tracking token.');
  }
  return Object.freeze({
    telegramId: String(parsed.t),
    offerVersion: safeVersion(parsed.v),
    expiresAt: expiresAt.toISOString()
  });
}
