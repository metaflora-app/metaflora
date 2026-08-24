import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const VERSION = 'v1';

function encryptionKey(value) {
  const source = String(value ?? '');
  if (source.length < 16 || source.length > 4096) {
    throw new TypeError('payout encryption key is invalid.');
  }
  return createHash('sha256').update(source, 'utf8').digest();
}

function serializedValue(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('payout data must be an object.');
  }
  const serialized = JSON.stringify(value);
  if (!serialized || Buffer.byteLength(serialized, 'utf8') > 8 * 1024) {
    throw new TypeError('payout data is invalid.');
  }
  return serialized;
}

export function encryptPayoutData(value, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(key), iv);
  const ciphertext = Buffer.concat([
    cipher.update(serializedValue(value), 'utf8'),
    cipher.final()
  ]);
  return [
    VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url')
  ].join(':');
}

export function decryptPayoutData(value, key) {
  const parts = String(value ?? '').split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) throw new TypeError('encrypted payout data is invalid.');
  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      encryptionKey(key),
      Buffer.from(parts[1], 'base64url')
    );
    decipher.setAuthTag(Buffer.from(parts[2], 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(parts[3], 'base64url')),
      decipher.final()
    ]).toString('utf8');
    const result = JSON.parse(plaintext);
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new TypeError('encrypted payout data is invalid.');
    }
    return result;
  } catch (error) {
    if (error instanceof TypeError && /encryption key|encrypted payout data/u.test(error.message)) throw error;
    throw new Error('Could not decrypt payout data.');
  }
}
