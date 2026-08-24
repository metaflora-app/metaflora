import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  randomUUID
} from 'node:crypto';
import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { getCuratedVoice } from './voice-library.js';

export const VOICE_CONSENT_VERSION = '2026-07-26';

const ALLOWED_PROVIDERS = new Set(['elevenlabs', 'fal', 'kie', 'polza', 'replicate']);
const ALLOWED_CONSENT_BASES = new Set(['own_voice', 'licensed_voice', 'authorized_speaker']);
const PROFILE_FIELDS = new Set([
  'ownerTelegramId', 'name', 'provider', 'providerVoiceId', 'consent', 'sample', 'retentionDays'
]);
const CONSENT_FIELDS = new Set([
  'confirmed', 'basis', 'version', 'confirmedAt', 'sourceMessageId', 'evidenceReference'
]);
const SAMPLE_FIELDS = new Set(['hmacSha256', 'hmacKeyId', 'durationSeconds']);
const SENSITIVE_KEY = /^(raw_?audio|audio_?base64|audio_?bytes|audio_?buffer|api_?key|access_?token|secret|password)$/i;

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
}

function assertAllowedFields(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError(`Unknown ${label} field: ${key}.`);
  }
}

function assertNoSensitivePayload(value, seen = new Set()) {
  if (!value || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) {
      throw new TypeError('Sensitive values and raw audio cannot be stored in voice profiles.');
    }
    assertNoSensitivePayload(nested, seen);
  }
}

function telegramId(value) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,19}$/.test(id)) throw new TypeError('Invalid Telegram user id.');
  return id;
}

function voiceProfileId(value) {
  const id = String(value ?? '');
  if (!/^vp_[a-f0-9-]{36}$/.test(id)) throw new TypeError('Invalid voice profile id.');
  return id;
}

function deletionId(value) {
  const id = String(value ?? '');
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new TypeError('Invalid deletion id.');
  return id;
}

function leaseToken(value) {
  const token = String(value ?? '');
  if (!/^[a-f0-9-]{36}$/.test(token)) throw new TypeError('Invalid deletion lease token.');
  return token;
}

function providerName(value) {
  const provider = String(value ?? '').trim().toLowerCase();
  if (!ALLOWED_PROVIDERS.has(provider)) throw new TypeError('Invalid voice provider.');
  return provider;
}

function providerVoiceId(value) {
  const id = String(value ?? '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{2,127}$/.test(id)) {
    throw new TypeError('Invalid provider voice id.');
  }
  return id;
}

function displayName(value) {
  const name = String(value ?? '').trim().toLocaleLowerCase('ru-RU');
  if (name.length < 2 || name.length > 80 || /[<>\u0000-\u001f]/u.test(name)) {
    throw new TypeError('Invalid voice profile name.');
  }
  return name;
}

function isoDate(value, label) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new TypeError(`${label} must be a valid date.`);
  return date.toISOString();
}

function retentionDays(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 365) {
    throw new TypeError('retentionDays must be an integer between 1 and 365.');
  }
  return value;
}

function expirationDate(value, days) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function consentEvidence(value, now) {
  assertObject(value, 'consent');
  assertAllowedFields(value, CONSENT_FIELDS, 'consent');
  if (value.confirmed !== true) throw new TypeError('Explicit consent is required.');
  const basis = String(value.basis ?? '');
  if (!ALLOWED_CONSENT_BASES.has(basis)) throw new TypeError('Invalid consent basis.');
  if (value.version !== VOICE_CONSENT_VERSION) throw new TypeError('Invalid consent version.');
  const confirmedAt = isoDate(value.confirmedAt, 'consent.confirmedAt');
  const ageMilliseconds = new Date(now).valueOf() - new Date(confirmedAt).valueOf();
  if (ageMilliseconds < 0) throw new TypeError('Consent confirmation cannot be in the future.');
  if (ageMilliseconds > 24 * 60 * 60 * 1000) throw new TypeError('Consent confirmation is too old.');
  const sourceMessageId = String(value.sourceMessageId ?? '');
  if (!/^[1-9]\d{0,19}$/.test(sourceMessageId)) throw new TypeError('Invalid consent source message id.');
  const evidenceReference = value.evidenceReference === undefined || value.evidenceReference === null
    ? null
    : String(value.evidenceReference);
  if (evidenceReference !== null && !/^[a-z0-9][a-z0-9_.:-]{2,127}$/.test(evidenceReference)) {
    throw new TypeError('Invalid consent evidence reference.');
  }
  if (basis !== 'own_voice' && evidenceReference === null) {
    throw new TypeError('Licensed and authorized voices require an evidence reference.');
  }
  return Object.freeze({
    basis,
    version: VOICE_CONSENT_VERSION,
    confirmedAt,
    sourceMessageId,
    evidenceReference
  });
}

function sampleEvidence(value) {
  assertObject(value, 'sample');
  assertAllowedFields(value, SAMPLE_FIELDS, 'sample');
  const hmacSha256 = String(value.hmacSha256 ?? '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hmacSha256)) throw new TypeError('Invalid sample HMAC hash.');
  const hmacKeyId = String(value.hmacKeyId ?? '');
  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(hmacKeyId)) throw new TypeError('Invalid sample HMAC key id.');
  const durationSeconds = Number(value.durationSeconds);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 10 || durationSeconds > 300) {
    throw new TypeError('Sample duration must be between 10 and 300 seconds.');
  }
  return Object.freeze({ hmacSha256, hmacKeyId, durationSeconds });
}

function encryptionKey(value) {
  const key = Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(String(value ?? ''), 'base64');
  if (key.length !== 32) throw new TypeError('Voice profile encryption key must contain 32 bytes.');
  return key;
}

function freezeProfile(row, decrypt) {
  if (!row) return null;
  return Object.freeze({
    profileId: row.profile_id,
    ownerTelegramId: row.owner_telegram_id,
    name: row.name,
    provider: row.provider,
    providerVoiceId: decrypt(row.profile_id, row.provider_voice_id),
    consent: Object.freeze({
      basis: row.consent_basis,
      version: row.consent_version,
      confirmedAt: row.consent_confirmed_at,
      sourceMessageId: row.consent_source_message_id,
      evidenceReference: row.consent_evidence_reference ?? null
    }),
    sample: Object.freeze({
      hmacSha256: row.sample_hmac_sha256,
      hmacKeyId: row.sample_hmac_key_id,
      durationSeconds: Number(row.sample_duration_seconds)
    }),
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at
  });
}

function freezeDeletion(row, decrypt) {
  return Object.freeze({
    deletionId: row.deletion_id,
    profileId: row.profile_id,
    ownerTelegramId: row.owner_telegram_id,
    provider: row.provider,
    providerVoiceId: decrypt(row.profile_id, row.provider_voice_id),
    requestedAt: row.requested_at,
    nextAttemptAt: row.next_attempt_at,
    attempts: Number(row.attempts),
    lastErrorCode: row.last_error_code ?? null,
    leaseToken: row.lease_token ?? null,
    leaseUntil: row.lease_until ?? null
  });
}

function failureCode(value) {
  const code = String(value ?? '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_.:-]{0,79}$/.test(code)) throw new TypeError('Invalid deletion error code.');
  return code;
}

export class VoiceProfileStore {
  constructor(databasePath, options = {}) {
    this.key = encryptionKey(options.encryptionKey);
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    if (databasePath !== ':memory:') this.database.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS voice_profiles (
        profile_id TEXT PRIMARY KEY,
        owner_telegram_id TEXT NOT NULL,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_voice_id TEXT NOT NULL,
        provider_voice_fingerprint TEXT NOT NULL UNIQUE,
        consent_basis TEXT NOT NULL,
        consent_version TEXT NOT NULL,
        consent_confirmed_at TEXT NOT NULL,
        consent_source_message_id TEXT NOT NULL,
        consent_evidence_reference TEXT,
        sample_hmac_sha256 TEXT NOT NULL,
        sample_hmac_key_id TEXT NOT NULL,
        sample_duration_seconds REAL NOT NULL,
        retention_days INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        last_used_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS voice_profiles_owner_idx
        ON voice_profiles(owner_telegram_id, created_at);
      CREATE INDEX IF NOT EXISTS voice_profiles_expiration_idx
        ON voice_profiles(expires_at);

      CREATE TABLE IF NOT EXISTS voice_profile_deletions (
        deletion_id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL UNIQUE,
        owner_telegram_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_voice_id TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        next_attempt_at TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error_code TEXT,
        lease_token TEXT,
        lease_until TEXT
      );

      CREATE INDEX IF NOT EXISTS voice_profile_deletions_due_idx
        ON voice_profile_deletions(next_attempt_at, lease_until);

      CREATE TABLE IF NOT EXISTS voice_library_activity (
        owner_telegram_id TEXT NOT NULL,
        voice_id TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
        last_used_at TEXT,
        PRIMARY KEY (owner_telegram_id, voice_id)
      );

      CREATE INDEX IF NOT EXISTS voice_library_recent_idx
        ON voice_library_activity(owner_telegram_id, last_used_at DESC);
    `);
    if (databasePath !== ':memory:') {
      for (const path of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
        if (existsSync(path)) chmodSync(path, 0o600);
      }
    }
  }

  close() {
    this.key.fill(0);
    this.database.close();
  }

  #encrypt(id, plaintext) {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, nonce);
    cipher.setAAD(Buffer.from(id));
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return `v1.${nonce.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
  }

  #decrypt(id, envelope) {
    const [version, nonce, tag, ciphertext] = String(envelope ?? '').split('.');
    if (version !== 'v1' || !nonce || !tag || !ciphertext) throw new Error('Invalid encrypted provider voice id.');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(nonce, 'base64url'));
    decipher.setAAD(Buffer.from(id));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final()
    ]).toString('utf8');
  }

  #fingerprint(provider, id) {
    return createHmac('sha256', this.key).update(`${provider}\0${id}`).digest('hex');
  }

  #row(id) {
    return this.database.prepare('SELECT * FROM voice_profiles WHERE profile_id = ?').get(voiceProfileId(id));
  }

  #assertOwner(ownerValue, row) {
    if (row && row.owner_telegram_id !== telegramId(ownerValue)) {
      throw new Error('Voice profile owner access denied.');
    }
  }

  #queueRows(rows, timestamp) {
    const insert = this.database.prepare(`
      INSERT INTO voice_profile_deletions (
        deletion_id, profile_id, owner_telegram_id, provider,
        provider_voice_id, requested_at, next_attempt_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const ids = [];
    for (const row of rows) {
      const id = randomUUID();
      insert.run(
        id,
        row.profile_id,
        row.owner_telegram_id,
        row.provider,
        row.provider_voice_id,
        timestamp,
        timestamp
      );
      ids.push(id);
    }
    const remove = this.database.prepare('DELETE FROM voice_profiles WHERE profile_id = ?');
    for (const row of rows) remove.run(row.profile_id);
    return ids;
  }

  #queuedByIds(ids) {
    const select = this.database.prepare('SELECT * FROM voice_profile_deletions WHERE deletion_id = ?');
    return Object.freeze(ids.map((id) => freezeDeletion(
      select.get(id),
      (profile, encrypted) => this.#decrypt(profile, encrypted)
    )));
  }

  #ownedActiveRow(ownerValue, profileValue, now = new Date()) {
    const row = this.#row(profileValue);
    if (!row) return null;
    this.#assertOwner(ownerValue, row);
    const timestamp = isoDate(now, 'now');
    if (row.expires_at > timestamp) return row;
    this.database.exec('BEGIN IMMEDIATE');
    try {
      this.#queueRows([row], timestamp);
      this.database.exec('COMMIT');
      return null;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  createProfile(input, now = new Date()) {
    assertObject(input, 'voice profile input');
    assertNoSensitivePayload(input);
    assertAllowedFields(input, PROFILE_FIELDS, 'voice profile');
    const timestamp = isoDate(now, 'now');
    const id = `vp_${randomUUID()}`;
    const owner = telegramId(input.ownerTelegramId);
    const provider = providerName(input.provider);
    const providerId = providerVoiceId(input.providerVoiceId);
    const consent = consentEvidence(input.consent, timestamp);
    const sample = sampleEvidence(input.sample);
    const days = retentionDays(input.retentionDays);
    const encryptedProviderId = this.#encrypt(id, providerId);

    this.database.prepare(`
      INSERT INTO voice_profiles (
        profile_id, owner_telegram_id, name, provider, provider_voice_id, provider_voice_fingerprint,
        consent_basis, consent_version, consent_confirmed_at,
        consent_source_message_id, consent_evidence_reference,
        sample_hmac_sha256, sample_hmac_key_id, sample_duration_seconds, retention_days,
        created_at, last_used_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      owner,
      displayName(input.name),
      provider,
      encryptedProviderId,
      this.#fingerprint(provider, providerId),
      consent.basis,
      consent.version,
      consent.confirmedAt,
      consent.sourceMessageId,
      consent.evidenceReference,
      sample.hmacSha256,
      sample.hmacKeyId,
      sample.durationSeconds,
      days,
      timestamp,
      timestamp,
      expirationDate(timestamp, days)
    );
    return freezeProfile(this.#row(id), (profile, encrypted) => this.#decrypt(profile, encrypted));
  }

  getProfile(ownerValue, profileValue, now = new Date()) {
    const row = this.#ownedActiveRow(ownerValue, profileValue, now);
    return freezeProfile(row, (profile, encrypted) => this.#decrypt(profile, encrypted));
  }

  listProfiles(ownerValue, now = new Date()) {
    const owner = telegramId(ownerValue);
    this.purgeExpired(now);
    const rows = this.database.prepare(`
      SELECT * FROM voice_profiles
      WHERE owner_telegram_id = ?
      ORDER BY created_at DESC, profile_id ASC
    `).all(owner);
    return Object.freeze(rows.map((row) =>
      freezeProfile(row, (profile, encrypted) => this.#decrypt(profile, encrypted))
    ));
  }

  touchProfile(ownerValue, profileValue, now = new Date()) {
    const row = this.#ownedActiveRow(ownerValue, profileValue, now);
    if (!row) return null;
    const timestamp = isoDate(now, 'now');
    const expiresAt = expirationDate(timestamp, Number(row.retention_days));
    this.database.prepare(`
      UPDATE voice_profiles SET last_used_at = ?, expires_at = ? WHERE profile_id = ?
    `).run(timestamp, expiresAt, row.profile_id);
    return freezeProfile(this.#row(row.profile_id), (profile, encrypted) => this.#decrypt(profile, encrypted));
  }

  deleteProfile(ownerValue, profileValue, now = new Date()) {
    const row = this.#row(profileValue);
    if (!row) return false;
    this.#assertOwner(ownerValue, row);
    const timestamp = isoDate(now, 'now');
    this.database.exec('BEGIN IMMEDIATE');
    try {
      this.#queueRows([row], timestamp);
      this.database.exec('COMMIT');
      return true;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  purgeExpired(now = new Date()) {
    const timestamp = isoDate(now, 'now');
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const rows = this.database.prepare(`
        SELECT * FROM voice_profiles WHERE expires_at <= ? ORDER BY expires_at ASC, profile_id ASC
      `).all(timestamp);
      const ids = this.#queueRows(rows, timestamp);
      this.database.exec('COMMIT');
      return this.#queuedByIds(ids);
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  listPendingDeletions(options = {}) {
    const limit = options.limit === undefined ? 100 : options.limit;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
      throw new TypeError('limit must be an integer between 1 and 500.');
    }
    const rows = this.database.prepare(`
      SELECT * FROM voice_profile_deletions ORDER BY requested_at ASC, deletion_id ASC LIMIT ?
    `).all(limit);
    return Object.freeze(rows.map((row) =>
      freezeDeletion(row, (profile, encrypted) => this.#decrypt(profile, encrypted))
    ));
  }

  claimPendingDeletions({ now = new Date(), limit = 20, leaseSeconds = 60 } = {}) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new TypeError('Invalid claim limit.');
    if (!Number.isSafeInteger(leaseSeconds) || leaseSeconds < 10 || leaseSeconds > 600) {
      throw new TypeError('Invalid deletion lease duration.');
    }
    const timestamp = isoDate(now, 'now');
    const leaseUntil = new Date(new Date(timestamp).valueOf() + leaseSeconds * 1000).toISOString();
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const rows = this.database.prepare(`
        SELECT * FROM voice_profile_deletions
        WHERE next_attempt_at <= ? AND (lease_until IS NULL OR lease_until <= ?)
        ORDER BY next_attempt_at ASC, deletion_id ASC
        LIMIT ?
      `).all(timestamp, timestamp, limit);
      const update = this.database.prepare(`
        UPDATE voice_profile_deletions SET lease_token = ?, lease_until = ? WHERE deletion_id = ?
      `);
      const claimed = rows.map((row) => {
        const token = randomUUID();
        update.run(token, leaseUntil, row.deletion_id);
        return { ...row, lease_token: token, lease_until: leaseUntil };
      });
      this.database.exec('COMMIT');
      return Object.freeze(claimed.map((row) =>
        freezeDeletion(row, (profile, encrypted) => this.#decrypt(profile, encrypted))
      ));
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  failDeletion(deletionValue, leaseValue, errorValue, now = new Date()) {
    const id = deletionId(deletionValue);
    const token = leaseToken(leaseValue);
    const row = this.database.prepare(`
      SELECT attempts FROM voice_profile_deletions WHERE deletion_id = ? AND lease_token = ?
    `).get(id, token);
    if (!row) return false;
    const timestamp = isoDate(now, 'now');
    const delaySeconds = Math.min(86_400, 60 * (2 ** Number(row.attempts)));
    const nextAttemptAt = new Date(new Date(timestamp).valueOf() + delaySeconds * 1000).toISOString();
    return this.database.prepare(`
      UPDATE voice_profile_deletions
      SET attempts = attempts + 1, last_error_code = ?, next_attempt_at = ?,
          lease_token = NULL, lease_until = NULL
      WHERE deletion_id = ? AND lease_token = ?
    `).run(failureCode(errorValue), nextAttemptAt, id, token).changes === 1;
  }

  completeDeletion(deletionValue, leaseValue) {
    return this.database.prepare(`
      DELETE FROM voice_profile_deletions WHERE deletion_id = ? AND lease_token = ?
    `).run(deletionId(deletionValue), leaseToken(leaseValue)).changes === 1;
  }

  setFavorite(ownerValue, voiceValue, favorite) {
    const owner = telegramId(ownerValue);
    const voice = getCuratedVoice(voiceValue);
    if (!voice) throw new TypeError('Unknown curated voice.');
    if (typeof favorite !== 'boolean') throw new TypeError('favorite must be a boolean.');
    this.database.prepare(`
      INSERT INTO voice_library_activity (owner_telegram_id, voice_id, is_favorite)
      VALUES (?, ?, ?)
      ON CONFLICT(owner_telegram_id, voice_id) DO UPDATE SET is_favorite = excluded.is_favorite
    `).run(owner, voice.id, favorite ? 1 : 0);
    return favorite;
  }

  listFavorites(ownerValue) {
    const owner = telegramId(ownerValue);
    const rows = this.database.prepare(`
      SELECT voice_id FROM voice_library_activity
      WHERE owner_telegram_id = ? AND is_favorite = 1 ORDER BY voice_id ASC
    `).all(owner);
    return Object.freeze(rows.map(({ voice_id: id }) => getCuratedVoice(id)).filter(Boolean));
  }

  recordRecent(ownerValue, voiceValue, now = new Date()) {
    const owner = telegramId(ownerValue);
    const voice = getCuratedVoice(voiceValue);
    if (!voice) throw new TypeError('Unknown curated voice.');
    const timestamp = isoDate(now, 'now');
    this.database.prepare(`
      INSERT INTO voice_library_activity (owner_telegram_id, voice_id, last_used_at)
      VALUES (?, ?, ?)
      ON CONFLICT(owner_telegram_id, voice_id) DO UPDATE SET last_used_at = excluded.last_used_at
    `).run(owner, voice.id, timestamp);
    return voice;
  }

  listRecent(ownerValue, options = {}) {
    const owner = telegramId(ownerValue);
    const limit = options.limit === undefined ? 20 : options.limit;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new TypeError('limit must be an integer between 1 and 100.');
    }
    const rows = this.database.prepare(`
      SELECT voice_id FROM voice_library_activity
      WHERE owner_telegram_id = ? AND last_used_at IS NOT NULL
      ORDER BY last_used_at DESC, voice_id ASC
      LIMIT ?
    `).all(owner, limit);
    return Object.freeze(rows.map(({ voice_id: id }) => getCuratedVoice(id)).filter(Boolean));
  }
}
