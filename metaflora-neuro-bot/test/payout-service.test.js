import assert from 'node:assert/strict';
import test from 'node:test';

import { createPayoutService } from '../src/payout-service.js';

test('payout worker submits one idempotent request and records the provider id', async () => {
  const calls = [];
  const transitions = [];
  const payoutService = createPayoutService({
    enabled: true,
    client: {
      async createPayout(value) {
        calls.push(value);
        return { id: 'payout-1', status: 'pending' };
      },
      async getPayout() {
        throw new Error('should not poll a payout created in this pass');
      }
    },
    referralService: {
      listPendingWithdrawals: () => [{ withdrawalId: 'withdrawal-1', amountKopecks: 100_000, method: 'sbp' }],
      getWithdrawalPayoutData: () => ({ method: 'sbp', phone: '79990000000', bankId: '100000000111' }),
      markWithdrawalPayoutAttempt: (value) => transitions.push(['attempt', value]),
      markWithdrawalPayoutSubmitted: (value) => transitions.push(['submitted', value])
    }
  });

  const result = await payoutService.processPendingWithdrawals();

  assert.deepEqual(result, { submitted: 1, completed: 0, failed: 0, skipped: 0 });
  assert.equal(calls[0].idempotenceKey, 'payout:withdrawal-1');
  assert.equal(calls[0].phone, '79990000000');
  assert.deepEqual(transitions.map(([kind]) => kind), ['attempt', 'submitted']);
  assert.equal(transitions[1][1].externalPayoutId, 'payout-1');
});

test('payout worker finalizes a succeeded provider payout and is safe to rerun', async () => {
  const transitions = [];
  const changes = [];
  let polls = 0;
  const payoutService = createPayoutService({
    enabled: true,
    client: {
      async getPayout(id) {
        polls += 1;
        assert.equal(id, 'payout-2');
        return { id, status: 'succeeded', amount: { value: '1000.00', currency: 'RUB' } };
      }
    },
    referralService: {
      listPendingWithdrawals: () => [
        { withdrawalId: 'withdrawal-2', amountKopecks: 100_000, method: 'sbp', externalPayoutId: 'payout-2', payoutStatus: 'pending' }
      ],
      getWithdrawalPayoutData: () => ({ method: 'sbp', phone: '79990000000', bankId: '100000000111' }),
      markWithdrawalPayoutAttempt: () => {},
      markWithdrawalPayoutResult: (value) => transitions.push(value)
    },
    onPayoutChanged: (value) => changes.push(value)
  });

  await payoutService.processPendingWithdrawals();
  await payoutService.processPendingWithdrawals();

  assert.equal(polls, 2);
  assert.equal(transitions[0].status, 'succeeded');
  assert.equal(transitions[0].externalPayoutId, 'payout-2');
  assert.equal(changes[0].telegramUserId, undefined);
  assert.equal(changes[0].amountKopecks, 100_000);
  assert.equal(changes[0].method, 'sbp');
});

test('payout worker does not submit the same withdrawal concurrently', async () => {
  let releases;
  const gate = new Promise((resolve) => { releases = resolve; });
  let submissions = 0;
  const payoutService = createPayoutService({
    enabled: true,
    client: {
      async createPayout() { submissions += 1; await gate; return { id: 'payout-race', status: 'pending' }; }
    },
    referralService: {
      listPendingWithdrawals: () => [{ withdrawalId: 'withdrawal-race', amountKopecks: 100_000, method: 'sbp' }],
      getWithdrawal: () => ({ withdrawalId: 'withdrawal-race', status: 'pending' }),
      getWithdrawalPayoutData: () => ({ method: 'sbp', phone: '79990000000', bankId: '100000000111' }),
      markWithdrawalPayoutAttempt: () => {},
      markWithdrawalPayoutSubmitted: () => {}
    }
  });
  const first = payoutService.processPendingWithdrawals();
  const second = payoutService.processPendingWithdrawals();
  await new Promise((resolve) => setImmediate(resolve));
  releases();
  const [, secondResult] = await Promise.all([first, second]);
  assert.equal(submissions, 1);
  assert.equal(secondResult.skipped, 1);
});

test('payout worker respects an atomic claim lost to a manual or another worker', async () => {
  let submitted = 0;
  const payoutService = createPayoutService({
    enabled: true,
    client: { async createPayout() { submitted += 1; return { id: 'must-not-run', status: 'pending' }; } },
    referralService: {
      listPendingWithdrawals: () => [{ withdrawalId: 'withdrawal-claim', amountKopecks: 100_000, method: 'sbp' }],
      getWithdrawal: () => ({ withdrawalId: 'withdrawal-claim', status: 'pending' }),
      getWithdrawalPayoutData: () => ({ method: 'sbp', phone: '79990000000', bankId: '100000000111' }),
      claimWithdrawalForPayout: () => null
    }
  });
  const result = await payoutService.processPendingWithdrawals();
  assert.equal(submitted, 0);
  assert.equal(result.skipped, 1);
});

test('payout worker backs off retries and sends exhausted attempts to manual reconciliation', async () => {
  const changes = [];
  const payoutService = createPayoutService({
    enabled: true,
    now: () => new Date('2026-08-14T09:00:00.000Z'),
    maxAttempts: 5,
    retryBaseMs: 60_000,
    client: { async createPayout() { assert.fail('must not retry yet'); } },
    referralService: {
      listPendingWithdrawals: () => [
        { withdrawalId: 'withdrawal-backoff', amountKopecks: 100_000, method: 'sbp', payoutAttempts: 2, lastPayoutAttemptAt: '2026-08-14T08:58:30.000Z' },
        { withdrawalId: 'withdrawal-manual', amountKopecks: 100_000, method: 'sbp', payoutAttempts: 5, lastPayoutAttemptAt: '2026-08-14T08:00:00.000Z' }
      ],
      getWithdrawalPayoutData: () => ({ method: 'sbp', phone: '79990000000', bankId: '100000000111' }),
      markWithdrawalForManualReview: (value) => changes.push(value),
      markWithdrawalPayoutResult: (value) => changes.push(value)
    },
    onPayoutChanged: (value) => changes.push(value)
  });
  const result = await payoutService.processPendingWithdrawals();
  assert.deepEqual(result, { submitted: 0, completed: 0, failed: 0, skipped: 1, manual: 1 });
  assert.equal(changes[0].status, 'manual_review');
  assert.equal(changes[0].errorCode, 'payout_attempts_exhausted');
});

test('verified provider notification finalizes by withdrawal order id', async () => {
  const transitions = [];
  const payoutService = createPayoutService({
    enabled: true,
    client: { verifyNotification: () => ({ withdrawalId: 'withdrawal-hook', id: 'payout-hook', status: 'succeeded', amountKopecks: 100_000 }) },
    referralService: {
      listPendingWithdrawals: () => [],
      getWithdrawal: () => ({ withdrawalId: 'withdrawal-hook', telegramId: '123', amountKopecks: 100_000, method: 'sbp', status: 'pending' }),
      markWithdrawalPayoutResult: (value) => transitions.push(value)
    }
  });
  const result = await payoutService.processNotification({ Token: 'provider-signed' });
  assert.equal(result.status, 'succeeded');
  assert.equal(transitions[0].externalPayoutId, 'payout-hook');
});
