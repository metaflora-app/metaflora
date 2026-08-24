import assert from 'node:assert/strict';
import test from 'node:test';

import { ReferralRepository } from '../src/referral-repository.js';

test('withdrawal claim is atomic and blocks manual completion while provider submission is in flight', () => {
  const repository = new ReferralRepository(':memory:');
  try {
    repository.insertUser({
      telegramId: '123', username: '', firstName: '', referralCode: 'claim-code', now: '2026-08-14T09:00:00.000Z'
    });
    repository.createWithdrawal({
      withdrawalId: 'withdrawal-claim', telegramId: '123', amountKopecks: 100_000,
      method: 'sbp', destination: 'скрыто', now: '2026-08-14T09:00:00.000Z'
    });
    const first = repository.claimWithdrawalForPayout({
      withdrawalId: 'withdrawal-claim', attemptedAt: '2026-08-14T09:01:00.000Z'
    });
    const second = repository.claimWithdrawalForPayout({
      withdrawalId: 'withdrawal-claim', attemptedAt: '2026-08-14T09:01:01.000Z'
    });
    assert.equal(first.payoutStatus, 'submitting');
    assert.equal(first.payoutAttempts, 1);
    assert.equal(first.lastPayoutAttemptAt, '2026-08-14T09:01:00.000Z');
    assert.equal(second, null);
    assert.throws(() => repository.transitionWithdrawal({
      withdrawalId: 'withdrawal-claim', status: 'paid', now: '2026-08-14T09:01:02.000Z'
    }), /being processed/u);
  } finally {
    repository.close();
  }
});

test('manual-review payouts leave the automatic queue without releasing reserved funds', () => {
  const repository = new ReferralRepository(':memory:');
  try {
    repository.insertUser({
      telegramId: '123', username: '', firstName: '', referralCode: 'manual-code', now: '2026-08-14T09:00:00.000Z'
    });
    repository.createWithdrawal({
      withdrawalId: 'withdrawal-manual', telegramId: '123', amountKopecks: 100_000,
      method: 'sbp', destination: 'скрыто', now: '2026-08-14T09:00:00.000Z'
    });
    repository.markWithdrawalForManualReview({
      withdrawalId: 'withdrawal-manual', errorCode: 'payout_attempts_exhausted', attemptedAt: '2026-08-14T10:00:00.000Z'
    });
    assert.equal(repository.listPendingWithdrawals().length, 0);
    const row = repository.getWithdrawal('withdrawal-manual');
    assert.equal(row.status, 'pending');
    assert.equal(row.payoutStatus, 'manual_review');
    assert.equal(row.payoutErrorCode, 'payout_attempts_exhausted');
  } finally {
    repository.close();
  }
});
