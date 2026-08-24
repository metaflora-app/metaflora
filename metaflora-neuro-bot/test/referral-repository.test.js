import test from 'node:test';
import assert from 'node:assert/strict';

import {
  METACOIN_BALANCE_CONTRACT,
  ReferralRepository
} from '../src/referral-repository.js';

const USER_ID = '10';

function repositoryWithBalance(balance) {
  const repository = new ReferralRepository(':memory:');
  repository.insertUser({
    telegramId: USER_ID,
    username: 'tester',
    firstName: 'Test',
    referralCode: 'tester_RequestDebit1',
    now: '2026-07-01T00:00:00.000Z'
  });
  repository.addMetacoins(USER_ID, balance);
  return repository;
}

test('successful debit is atomic and updates balance and rolling spend counters', () => {
  const repository = repositoryWithBalance(20);
  try {
    const result = repository.debitMetacoins({
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'provider-success-1',
      now: '2026-07-25T12:00:00.000Z'
    });

    assert.deepEqual(result, {
      status: 'debited',
      requestKey: 'provider-success-1',
      amount: 7,
      balance: 13,
      subscriptionMetacoinsRemaining: 0,
      spentMetacoins1d: 7,
      spentMetacoins30d: 7
    });
    assert.equal(repository.accountStats(USER_ID).metacoinBalance, 13);
  } finally {
    repository.close();
  }
});

test('the SQLite balance contract is authoritative and exposes the fresh post-debit profile snapshot', () => {
  const repository = repositoryWithBalance(20);
  try {
    assert.deepEqual(METACOIN_BALANCE_CONTRACT, {
      authority: 'sqlite',
      table: 'referral_users',
      balanceColumn: 'metacoin_balance',
      debitTable: 'metacoin_debits',
      ledgerRole: 'supabase_history_audit_mirror'
    });

    const before = repository.readAccount(USER_ID);
    const debit = repository.debitMetacoins({
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'profile-refresh-1',
      now: '2026-07-25T12:00:00.000Z'
    });
    const after = repository.readAccount(USER_ID);

    assert.equal(before.metacoinBalance, 20);
    assert.equal(after.metacoinBalance, debit.balance);
    assert.equal(after.spentMetacoins1d, debit.spentMetacoins1d);
    assert.equal(after.spentMetacoins30d, debit.spentMetacoins30d);
  } finally {
    repository.close();
  }
});

test('debit is idempotent for the same request key and payload', () => {
  const repository = repositoryWithBalance(20);
  try {
    const payload = {
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'provider-success-1',
      now: '2026-07-25T12:00:00.000Z'
    };

    repository.debitMetacoins(payload);
    const duplicate = repository.debitMetacoins({
      ...payload,
      now: '2026-07-25T12:05:00.000Z'
    });

    assert.deepEqual(duplicate, {
      status: 'duplicate',
      requestKey: 'provider-success-1',
      amount: 7,
      balance: 13,
      subscriptionMetacoinsRemaining: 0,
      spentMetacoins1d: 7,
      spentMetacoins30d: 7
    });
    assert.throws(() => repository.debitMetacoins({
      ...payload,
      amount: 8
    }), /request key collision/i);
  } finally {
    repository.close();
  }
});

test('insufficient balance never becomes negative and does not consume the request key', () => {
  const repository = repositoryWithBalance(6);
  try {
    assert.deepEqual(repository.debitMetacoins({
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'retry-after-topup',
      now: '2026-07-25T12:00:00.000Z'
    }), {
      status: 'insufficient_funds',
      requestKey: 'retry-after-topup',
      amount: 7,
      balance: 6,
      subscriptionMetacoinsRemaining: 0,
      spentMetacoins1d: 0,
      spentMetacoins30d: 0
    });

    repository.addMetacoins(USER_ID, 1);
    assert.equal(repository.debitMetacoins({
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'retry-after-topup',
      now: '2026-07-25T12:01:00.000Z'
    }).status, 'debited');
    assert.equal(repository.accountStats(USER_ID).metacoinBalance, 0);
  } finally {
    repository.close();
  }
});

test('rolling counters are recalculated from successful debits only', () => {
  const repository = repositoryWithBalance(100);
  try {
    for (const [requestKey, amount, now] of [
      ['old', 5, '2026-06-20T12:00:00.000Z'],
      ['month', 7, '2026-07-10T12:00:00.000Z'],
      ['day', 11, '2026-07-25T06:00:00.000Z']
    ]) {
      repository.debitMetacoins({ telegramId: USER_ID, amount, requestKey, now });
    }

    const latest = repository.debitMetacoins({
      telegramId: USER_ID,
      amount: 13,
      requestKey: 'latest',
      now: '2026-07-25T12:00:00.000Z'
    });

    assert.equal(latest.spentMetacoins1d, 24);
    assert.equal(latest.spentMetacoins30d, 31);
    assert.equal(repository.accountStats(USER_ID).metacoinBalance, 64);
  } finally {
    repository.close();
  }
});

test('metacoin reservation holds balance without charging until delivery commits', () => {
  const repository = repositoryWithBalance(20);
  try {
    const reservation = repository.reserveMetacoins({
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'delivery-reservation-1',
      now: '2026-07-25T12:00:00.000Z'
    });

    assert.equal(reservation.status, 'reserved');
    assert.equal(reservation.balance, 13);
    assert.equal(repository.accountStats(USER_ID).metacoinBalance, 13);
    assert.equal(repository.accountStats(USER_ID).spentMetacoins1d, 0);

    const released = repository.releaseMetacoins({
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'delivery-reservation-1',
      now: '2026-07-25T12:00:01.000Z'
    });

    assert.equal(released.status, 'released');
    assert.equal(released.balance, 20);
    assert.equal(repository.accountStats(USER_ID).metacoinBalance, 20);
  } finally {
    repository.close();
  }
});

test('committing a reservation creates one debit and is idempotent', () => {
  const repository = repositoryWithBalance(20);
  try {
    repository.reserveMetacoins({
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'delivery-commit-1',
      now: '2026-07-25T12:00:00.000Z'
    });

    const committed = repository.commitMetacoins({
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'delivery-commit-1',
      now: '2026-07-25T12:00:01.000Z'
    });
    assert.equal(committed.status, 'committed');
    assert.equal(committed.balance, 13);
    assert.equal(committed.spentMetacoins1d, 7);

    const duplicate = repository.commitMetacoins({
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'delivery-commit-1',
      now: '2026-07-25T12:00:02.000Z'
    });
    assert.equal(duplicate.status, 'duplicate');
    assert.equal(duplicate.balance, 13);
    assert.equal(repository.accountStats(USER_ID).spentMetacoins1d, 7);
  } finally {
    repository.close();
  }
});

test('an insufficient reservation leaves the balance and debit ledger unchanged', () => {
  const repository = repositoryWithBalance(6);
  try {
    const result = repository.reserveMetacoins({
      telegramId: USER_ID,
      amount: 7,
      requestKey: 'delivery-insufficient-1',
      now: '2026-07-25T12:00:00.000Z'
    });

    assert.equal(result.status, 'insufficient_funds');
    assert.equal(result.balance, 6);
    assert.equal(repository.accountStats(USER_ID).metacoinBalance, 6);
    assert.equal(repository.accountStats(USER_ID).spentMetacoins1d, 0);
  } finally {
    repository.close();
  }
});
