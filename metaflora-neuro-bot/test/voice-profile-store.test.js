import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { VoiceProfileStore } from '../src/voice-profile-store.js';
import { setCuratedVoices } from '../src/voice-library.js';

const ENCRYPTION_KEY = Buffer.alloc(32, 7);
const VOICE_IDS = Array.from(
  { length: 80 },
  (_, index) => `elv_${index.toString(16).padStart(24, '0')}`
);

setCuratedVoices(Object.freeze(VOICE_IDS.map((id, index) => Object.freeze({
  id,
  name: `голос ${index + 1}`,
  description: 'реальный тестовый голос',
  category: index % 2 === 0 ? 'premade' : 'professional',
  labels: Object.freeze({ language: 'ru', useCase: 'тест' }),
  preview: Object.freeze({ type: 'id', value: `voice-preview-${id}` })
}))));

function databasePath() {
  return join(mkdtempSync(join(tmpdir(), 'metaflora-voices-')), 'voices.sqlite');
}

function openStore(path = databasePath()) {
  return new VoiceProfileStore(path, { encryptionKey: ENCRYPTION_KEY });
}

function profile(overrides = {}) {
  return {
    ownerTelegramId: '100',
    name: 'мой спокойный голос',
    provider: 'elevenlabs',
    providerVoiceId: 'el_voice_4M7x2p',
    consent: {
      confirmed: true,
      basis: 'own_voice',
      version: '2026-07-26',
      confirmedAt: '2026-07-26T01:00:00.000Z',
      sourceMessageId: '9812'
    },
    sample: {
      hmacSha256: 'a'.repeat(64),
      hmacKeyId: 'voice-samples-2026-07',
      durationSeconds: 42
    },
    retentionDays: 30,
    ...overrides
  };
}

test('voice profile stores bound consent and HMAC evidence without raw audio or secrets', () => {
  const path = databasePath();
  const store = openStore(path);
  const created = store.createProfile(profile(), '2026-07-26T01:00:00.000Z');

  assert.match(created.profileId, /^vp_[a-f0-9-]{36}$/);
  assert.deepEqual({ ...created, profileId: 'generated' }, {
    profileId: 'generated',
    ownerTelegramId: '100',
    name: 'мой спокойный голос',
    provider: 'elevenlabs',
    providerVoiceId: 'el_voice_4M7x2p',
    consent: {
      basis: 'own_voice',
      version: '2026-07-26',
      confirmedAt: '2026-07-26T01:00:00.000Z',
      sourceMessageId: '9812',
      evidenceReference: null
    },
    sample: {
      hmacSha256: 'a'.repeat(64),
      hmacKeyId: 'voice-samples-2026-07',
      durationSeconds: 42
    },
    createdAt: '2026-07-26T01:00:00.000Z',
    lastUsedAt: '2026-07-26T01:00:00.000Z',
    expiresAt: '2026-08-25T01:00:00.000Z'
  });
  assert.ok(Object.isFrozen(created));

  assert.throws(
    () => store.createProfile(profile({ rawAudio: Buffer.from('voice') }), '2026-07-26T01:00:00.000Z'),
    /raw audio|sensitive/i
  );
  assert.throws(
    () => store.createProfile(profile({ apiKey: 'secret' }), '2026-07-26T01:00:00.000Z'),
    /secret|sensitive/i
  );
  assert.throws(() => store.createProfile(profile({
    sample: { ...profile().sample, filePath: '/tmp/sample.wav' }
  }), '2026-07-26T01:00:00.000Z'), /field/i);
  store.close();

  assert.equal(statSync(path).mode & 0o777, 0o600);
  assert.equal(readFileSync(path).includes(Buffer.from('el_voice_4M7x2p')), false);
});

test('profile creation requires current recent consent and valid sample evidence', () => {
  const store = openStore();

  assert.throws(() => store.createProfile(profile({
    consent: { ...profile().consent, confirmed: false }
  }), '2026-07-26T01:00:00.000Z'), /consent/i);
  assert.throws(() => store.createProfile(profile({
    consent: { ...profile().consent, basis: 'celebrity_voice' }
  }), '2026-07-26T01:00:00.000Z'), /consent basis/i);
  assert.throws(() => store.createProfile(profile({
    consent: { ...profile().consent, version: '2025-01-01' }
  }), '2026-07-26T01:00:00.000Z'), /consent version/i);
  assert.throws(() => store.createProfile(profile({
    consent: { ...profile().consent, confirmedAt: '2026-07-27T01:00:00.000Z' }
  }), '2026-07-26T01:00:00.000Z'), /future|consent/i);
  assert.throws(() => store.createProfile(profile({
    sample: { ...profile().sample, hmacSha256: 'not-a-hash' }
  }), '2026-07-26T01:00:00.000Z'), /hash/i);
  assert.throws(() => store.createProfile(profile({
    sample: { ...profile().sample, durationSeconds: 4 }
  }), '2026-07-26T01:00:00.000Z'), /duration/i);
  store.close();
});

test('profile reads, updates and deletes enforce ownership and queue remote deletion', () => {
  const store = openStore();
  const created = store.createProfile(profile(), '2026-07-26T01:00:00.000Z');

  assert.equal(store.getProfile('100', created.profileId, '2026-07-26T01:00:01.000Z').name, 'мой спокойный голос');
  assert.throws(() => store.getProfile('200', created.profileId), /owner|access/i);
  assert.throws(() => store.touchProfile('200', created.profileId), /owner|access/i);
  assert.throws(() => store.deleteProfile('200', created.profileId), /owner|access/i);

  assert.equal(store.deleteProfile('100', created.profileId, '2026-07-26T01:01:00.000Z'), true);
  assert.equal(store.getProfile('100', created.profileId), null);
  assert.equal(store.listPendingDeletions().length, 1);
  store.close();
});

test('last use extends retention and expired profiles enter a leased deletion queue', () => {
  const store = openStore();
  const input = profile({
    retentionDays: 5,
    consent: { ...profile().consent, confirmedAt: '2026-07-01T00:00:00.000Z' }
  });
  const created = store.createProfile(input, '2026-07-01T00:00:00.000Z');

  const touched = store.touchProfile('100', created.profileId, '2026-07-04T12:00:00.000Z');
  assert.equal(touched.expiresAt, '2026-07-09T12:00:00.000Z');
  assert.deepEqual(store.purgeExpired('2026-07-09T11:59:59.000Z'), []);

  const removed = store.purgeExpired('2026-07-09T12:00:00.000Z');
  assert.deepEqual(removed.map(({ profileId, providerVoiceId }) => ({ profileId, providerVoiceId })), [{
    profileId: created.profileId,
    providerVoiceId: 'el_voice_4M7x2p'
  }]);
  assert.equal(store.getProfile('100', created.profileId), null);

  const pending = store.claimPendingDeletions({ now: '2026-07-09T12:00:00.000Z' });
  assert.equal(pending.length, 1);
  assert.equal(pending[0].providerVoiceId, 'el_voice_4M7x2p');
  assert.match(pending[0].leaseToken, /^[a-f0-9-]{36}$/);
  assert.equal(store.claimPendingDeletions({ now: '2026-07-09T12:00:30.000Z' }).length, 0);
  assert.equal(store.failDeletion(
    pending[0].deletionId,
    pending[0].leaseToken,
    'provider_timeout',
    '2026-07-09T12:00:00.000Z'
  ), true);
  assert.equal(store.listPendingDeletions()[0].attempts, 1);

  const retried = store.claimPendingDeletions({ now: '2026-07-09T12:01:00.000Z' });
  assert.equal(retried.length, 1);
  assert.equal(store.completeDeletion(retried[0].deletionId, retried[0].leaseToken), true);
  assert.deepEqual(store.listPendingDeletions(), []);
  store.close();
});

test('expired profiles cannot be read or revived before the cleanup sweep', () => {
  const store = openStore();
  const created = store.createProfile(profile({
    retentionDays: 1,
    consent: { ...profile().consent, confirmedAt: '2026-07-01T00:00:00.000Z' }
  }), '2026-07-01T00:00:00.000Z');

  assert.equal(store.getProfile('100', created.profileId, '2026-07-02T00:00:00.000Z'), null);
  assert.equal(store.touchProfile('100', created.profileId, '2026-07-02T00:00:00.000Z'), null);
  assert.equal(store.listPendingDeletions().length, 1);
  store.close();
});

test('favorites and recent voices are private, deduplicated and bounded', () => {
  const store = openStore();

  assert.equal(store.setFavorite('100', VOICE_IDS[0], true), true);
  assert.equal(store.setFavorite('100', VOICE_IDS[1], true), true);
  assert.equal(store.setFavorite('100', VOICE_IDS[0], false), false);
  assert.deepEqual(store.listFavorites('100').map(({ id }) => id), [VOICE_IDS[1]]);
  assert.deepEqual(store.listFavorites('200'), []);

  store.recordRecent('100', VOICE_IDS[2], '2026-07-26T01:00:00.000Z');
  store.recordRecent('100', VOICE_IDS[3], '2026-07-26T01:01:00.000Z');
  store.recordRecent('100', VOICE_IDS[2], '2026-07-26T01:02:00.000Z');
  assert.deepEqual(store.listRecent('100', { limit: 2 }).map(({ id }) => id), [
    VOICE_IDS[2],
    VOICE_IDS[3]
  ]);
  assert.deepEqual(store.listRecent('200'), []);
  assert.throws(() => store.setFavorite('100', 'missing', true), /voice/i);
  store.close();
});

test('profile and deletion state survive restart with the encryption key', () => {
  const path = databasePath();
  const first = openStore(path);
  first.createProfile(profile(), '2026-07-26T01:00:00.000Z');
  first.setFavorite('100', VOICE_IDS[9], true);
  first.close();

  const second = openStore(path);
  assert.equal(second.listProfiles('100').length, 1);
  assert.equal(second.listProfiles('200').length, 0);
  assert.deepEqual(second.listFavorites('100').map(({ id }) => id), [VOICE_IDS[9]]);
  second.close();
});

test('expired provider deletion survives restart until remote confirmation', () => {
  const path = databasePath();
  const first = openStore(path);
  first.createProfile(profile({
    retentionDays: 1,
    consent: { ...profile().consent, confirmedAt: '2026-07-01T00:00:00.000Z' }
  }), '2026-07-01T00:00:00.000Z');
  first.purgeExpired('2026-07-02T00:00:00.000Z');
  first.close();

  const second = openStore(path);
  assert.equal(second.listProfiles('100').length, 0);
  assert.equal(second.listPendingDeletions().length, 1);
  second.close();
});
