import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryEntertainmentSessionRepository,
  entertainmentSessionProjection,
  normalizeEntertainmentSession
} from '../src/entertainment-session-repository.js';

const base = {
  telegramUserId: '12345', sessionId: 'lila-1', scenarioId: 'ent_lila',
  version: 1, step: 2, status: 'active', charged: true, cost: 6,
  mediaCounts: { image: 1, video: 0, audio: 0 },
  state: { question: 'Что мешает?', position: 12, internalPrompt: 'secret' }
};

test('normalizes a bounded durable session and exposes only CRM-safe projection', () => {
  const session = normalizeEntertainmentSession(base, new Date('2026-08-13T09:00:00Z'));
  assert.equal(session.expiresAt, '2026-08-14T09:00:00.000Z');
  assert.deepEqual(entertainmentSessionProjection(session), {
    scenarioId: 'ent_lila', version: 1, step: 2, status: 'active', charged: true,
    cost: 6, mediaCounts: { image: 1, video: 0, audio: 0 }
  });
  assert.equal('state' in entertainmentSessionProjection(session), false);
});

test('rejects malformed identifiers, states and counters', () => {
  assert.throws(() => normalizeEntertainmentSession({ ...base, scenarioId: '../admin' }), /scenario/i);
  assert.throws(() => normalizeEntertainmentSession({ ...base, cost: -1 }), /cost/i);
  assert.throws(() => normalizeEntertainmentSession({ ...base, state: { token: 'x'.repeat(100_001) } }), /large/i);
});

test('repository owns sessions per Telegram user, expires them and enforces revisions', async () => {
  let now = new Date('2026-08-13T09:00:00Z');
  const repository = new InMemoryEntertainmentSessionRepository({ now: () => now });
  const created = await repository.save(base);
  assert.equal(created.revision, 1);
  assert.equal((await repository.load({ telegramUserId: '999', sessionId: 'lila-1' })), null);
  await assert.rejects(() => repository.save({ ...base, step: 3, expectedRevision: 0 }), /revision/i);
  const updated = await repository.save({ ...base, step: 3, expectedRevision: 1, transitionKey: 'turn-3' });
  const duplicate = await repository.save({ ...base, step: 99, expectedRevision: 2, transitionKey: 'turn-3' });
  assert.equal(updated.revision, 2);
  assert.equal(duplicate.step, 3);
  now = new Date('2026-08-14T09:00:01Z');
  assert.equal(await repository.load({ telegramUserId: '12345', sessionId: 'lila-1' }), null);
});

test('concurrent transitions use compare-and-swap so only one stale writer wins', async () => {
  const repository = new InMemoryEntertainmentSessionRepository({
    now: () => new Date('2026-08-13T09:00:00Z')
  });
  const created = await repository.save(base);
  const attempts = await Promise.allSettled([
    repository.save({ ...base, step: 3, expectedRevision: created.revision, transitionKey: 'choice:a' }),
    repository.save({ ...base, step: 4, expectedRevision: created.revision, transitionKey: 'choice:b' })
  ]);
  assert.equal(attempts.filter(({ status }) => status === 'fulfilled').length, 1);
  assert.equal(attempts.filter(({ status }) => status === 'rejected').length, 1);
  assert.match(attempts.find(({ status }) => status === 'rejected').reason.message, /revision conflict/i);
});
