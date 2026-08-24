import assert from 'node:assert/strict';
import test from 'node:test';

import { ReferralPayoutWorker } from '../src/referral-payout-worker.js';

const UUID = Object.freeze({
  id: '11111111-1111-4111-8111-111111111111',
  claim: '22222222-2222-4222-8222-222222222222'
});

function payoutJob(overrides = {}) {
  return Object.freeze({
    id: UUID.id,
    withdrawalId: 'withdrawal-1',
    claimToken: UUID.claim,
    amountKopecks: 100_000,
    currency: 'RUB',
    method: 'sbp',
    attemptCount: 0,
    externalPayoutId: null,
    ...overrides
  });
}

function repository(overrides = {}) {
  return {
    async claimReferralPayoutJobs() { return [payoutJob()]; },
    async getReferralPayoutDestination() {
      return { phone: '79990000000', bankId: '100000000111' };
    },
    async markReferralPayoutStarted() { return true; },
    async markReferralPayoutSubmitted() { return true; },
    async markReferralPayoutCompleted() { return true; },
    async markReferralPayoutRetry() { return true; },
    async markReferralPayoutManual() { return true; },
    ...overrides
  };
}

test('worker claims leased jobs and submits one idempotent SBP payout', async () => {
  const claims = [];
  const transitions = [];
  const requests = [];
  const worker = new ReferralPayoutWorker({
    enabled: true,
    repository: repository({
      async claimReferralPayoutJobs(options) { claims.push(options); return [payoutJob()]; },
      async markReferralPayoutStarted(value) { transitions.push(['started', value]); return true; },
      async markReferralPayoutSubmitted(value) { transitions.push(['submitted', value]); return true; }
    }),
    client: {
      async createPayout(value) {
        requests.push(value);
        return { id: 'tbank-payout-1', status: 'pending' };
      }
    },
    leaseSeconds: 180,
    maxBatchSize: 4
  });

  const result = await worker.runOnce();

  assert.deepEqual(claims, [{ limit: 4, leaseSeconds: 180, maxAttempts: 5 }]);
  assert.deepEqual(result, { status: 'processed', claimed: 1, submitted: 1, completed: 0, retrying: 0, manual: 0, skipped: 0 });
  assert.equal(requests[0].idempotenceKey, 'payout:withdrawal-1');
  assert.equal(requests[0].phone, '79990000000');
  assert.deepEqual(transitions.map(([name]) => name), ['started', 'submitted']);
  assert.equal(transitions[1][1].externalPayoutId, 'tbank-payout-1');
});

test('worker polls an existing provider payout and completes through claim-token CAS', async () => {
  const completed = [];
  let destinationReads = 0;
  const worker = new ReferralPayoutWorker({
    enabled: true,
    repository: repository({
      async claimReferralPayoutJobs() {
        return [payoutJob({ externalPayoutId: 'tbank-payout-2', attemptCount: 1 })];
      },
      async getReferralPayoutDestination() { destinationReads += 1; return null; },
      async markReferralPayoutCompleted(value) { completed.push(value); return true; }
    }),
    client: {
      async getPayout(id) {
        assert.equal(id, 'tbank-payout-2');
        return { id, status: 'succeeded', amount: { value: '1000.00', currency: 'RUB' } };
      }
    }
  });

  const result = await worker.runOnce();

  assert.equal(destinationReads, 0);
  assert.equal(result.completed, 1);
  assert.equal(completed[0].claimToken, UUID.claim);
  assert.equal(completed[0].externalPayoutId, 'tbank-payout-2');
  assert.equal(completed[0].observedAmountKopecks, 100_000);
});

test('worker quarantines a provider amount mismatch instead of paying the ledger', async () => {
  const manual = [];
  let completed = false;
  const worker = new ReferralPayoutWorker({
    enabled: true,
    repository: repository({
      async claimReferralPayoutJobs() {
        return [payoutJob({ externalPayoutId: 'tbank-payout-mismatch', attemptCount: 2 })];
      },
      async markReferralPayoutCompleted() { completed = true; return true; },
      async markReferralPayoutManual(value) { manual.push(value); return true; }
    }),
    client: {
      async getPayout(id) {
        return { id, status: 'succeeded', amount: { value: '999.00', currency: 'RUB' } };
      }
    }
  });

  const result = await worker.runOnce();

  assert.equal(result.manual, 1);
  assert.equal(completed, false);
  assert.equal(manual[0].errorCode, 'payout_verification_failed');
});

test('worker retries transient pre-submit failures with exponential backoff', async () => {
  const retries = [];
  const now = new Date('2026-08-14T10:00:00.000Z');
  const error = Object.assign(new Error('network'), { name: 'TBankPayoutNetworkError' });
  const worker = new ReferralPayoutWorker({
    enabled: true,
    now: () => now,
    retryBaseMs: 60_000,
    repository: repository({
      async markReferralPayoutStarted() { throw error; },
      async markReferralPayoutRetry(value) { retries.push(value); return true; }
    }),
    client: { async createPayout() { assert.fail('external call must not start'); } }
  });

  const result = await worker.runOnce();

  assert.equal(result.retrying, 1);
  assert.equal(retries[0].errorCode, 'tbank_network');
  assert.equal(retries[0].retryAt.toISOString(), '2026-08-14T10:01:00.000Z');
  assert.equal(retries[0].externalEffectStarted, false);
});

test('worker never retries an unknown outcome after the external payout may have started', async () => {
  const retries = [];
  const manual = [];
  const worker = new ReferralPayoutWorker({
    enabled: true,
    repository: repository({
      async markReferralPayoutRetry(value) { retries.push(value); return true; },
      async markReferralPayoutManual(value) { manual.push(value); return true; }
    }),
    client: {
      async createPayout() {
        throw Object.assign(new Error('timeout after submit'), { name: 'TBankPayoutTimeoutError' });
      }
    }
  });

  const result = await worker.runOnce();

  assert.equal(result.manual, 1);
  assert.equal(retries.length, 0);
  assert.equal(manual[0].errorCode, 'tbank_timeout_unknown');
});

test('worker sends exhausted and ambiguous jobs to manual reconciliation', async () => {
  const manual = [];
  const worker = new ReferralPayoutWorker({
    enabled: true,
    maxAttempts: 3,
    repository: repository({
      async claimReferralPayoutJobs() {
        return [payoutJob({ attemptCount: 3 })];
      },
      async markReferralPayoutManual(value) { manual.push(value); return true; }
    }),
    client: { async getPayout() { assert.fail('exhausted job must not reach provider'); } }
  });

  const result = await worker.runOnce();

  assert.equal(result.manual, 1);
  assert.equal(manual[0].errorCode, 'payout_attempts_exhausted');
  assert.equal(manual[0].automaticRetry, false);
});

test('kill switch prevents claiming and readiness never exposes credentials', async () => {
  let claimed = false;
  const worker = new ReferralPayoutWorker({
    enabled: true,
    killSwitch: true,
    repository: repository({ async claimReferralPayoutJobs() { claimed = true; return []; } }),
    client: { terminalKey: 'secret-terminal', privateKey: 'secret-private-key' }
  });

  assert.deepEqual(await worker.runOnce(), {
    status: 'kill_switch', claimed: 0, submitted: 0, completed: 0, retrying: 0, manual: 0, skipped: 0
  });
  assert.equal(claimed, false);
  const health = worker.health();
  assert.deepEqual({ ...health, lastCycleAt: '<timestamp>' }, {
    ok: false,
    enabled: true,
    killSwitch: true,
    running: false,
    providerReady: false,
    lastCycleAt: '<timestamp>',
    lastCycleStatus: 'kill_switch'
  });
  assert.match(health.lastCycleAt, /^\d{4}-\d{2}-\d{2}T/u);
  assert.doesNotMatch(JSON.stringify(worker.health()), /secret|terminalKey|privateKey/u);
});

test('invalid claims never reach provider or logs with payout destinations', async () => {
  const logs = [];
  let called = false;
  const worker = new ReferralPayoutWorker({
    enabled: true,
    logger: { warn: (event, context) => logs.push({ event, context }) },
    repository: repository({
      async claimReferralPayoutJobs() {
        return [payoutJob({ amountKopecks: -1, destination: { phone: '79990000000' } })];
      }
    }),
    client: { async createPayout() { called = true; } }
  });

  const result = await worker.runOnce();

  assert.equal(result.manual, 1);
  assert.equal(called, false);
  assert.doesNotMatch(JSON.stringify(logs), /79990000000/u);
});
