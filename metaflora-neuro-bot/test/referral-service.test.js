import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { createReferralService } from '../src/referral-service.js';
import { METACOIN_BALANCE_CONTRACT } from '../src/referral-repository.js';

function createTestService(options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'metaflora-referrals-'));
  const service = createReferralService({
    databasePath: join(directory, 'referrals.sqlite'),
    now: () => new Date('2026-07-24T01:00:00.000Z'),
    randomToken: () => 'K7m4Q2x9Qa12',
    holdDays: 0,
    ...options
  });
  return {
    service,
    cleanup() {
      service.close();
      rmSync(directory, { recursive: true, force: true });
    }
  };
}

function user(id, username) {
  return { id, username, first_name: username };
}

test('users receive persistent readable referral links backed by opaque codes', () => {
  const { service, cleanup } = createTestService();
  try {
    const first = service.registerUser(user(10, 'ivan_test'));
    const second = service.registerUser(user(10, 'ivan_renamed'));

    assert.equal(first.referralCode, 'ivan_test_K7m4Q2x9Qa12');
    assert.equal(second.referralCode, first.referralCode);
    assert.equal(service.referralUrl(10), 'https://t.me/neuro_metaflora_bot?start=ref_ivan_test_K7m4Q2x9Qa12');
  } finally {
    cleanup();
  }
});

test('new accounts expose persistent billing defaults for the profile cabinet', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    const account = service.account(10);

    assert.equal(account.subscriptionPlanId, 'newcomer');
    assert.equal(account.subscriptionMetacoinsTotal, 0);
    assert.equal(account.subscriptionMetacoinsRemaining, 0);
    assert.equal(account.subscriptionPriceKopecks, 0);
    assert.equal(account.subscriptionDurationMonths, 1);
    assert.equal(account.subscriptionExpiresAt, null);
    assert.equal(account.spentMetacoins1d, 0);
    assert.equal(account.spentMetacoins30d, 0);
  } finally {
    cleanup();
  }
});

test('paid subscription activation is idempotent and persists the plan allowance', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));

    const first = service.activateSubscription({
      paymentId: 'yookassa-plan-1',
      telegramId: 10,
      planId: 'author',
      durationMonths: 1,
      durationDays: 30,
      priceKopecks: 74_900,
      metacoins: 300,
      activatedAt: '2026-07-24T01:00:00.000Z'
    });
    const duplicate = service.activateSubscription({
      paymentId: 'yookassa-plan-1',
      telegramId: 10,
      planId: 'author',
      durationMonths: 1,
      durationDays: 30,
      priceKopecks: 74_900,
      metacoins: 300,
      activatedAt: '2026-07-24T01:00:00.000Z'
    });

    assert.equal(first.status, 'activated');
    assert.equal(duplicate.status, 'duplicate');
    assert.equal(first.startsAt, '2026-07-24T01:00:00.000Z');
    assert.equal(duplicate.startsAt, '2026-07-24T01:00:00.000Z');
    assert.equal(first.expiresAt, '2026-08-23T01:00:00.000Z');

    const account = service.account(10);
    assert.equal(account.subscriptionPlanId, 'author');
    assert.equal(account.subscriptionMetacoinsTotal, 300);
    assert.equal(account.subscriptionMetacoinsRemaining, 300);
    assert.equal(account.subscriptionPriceKopecks, 74_900);
    assert.equal(account.subscriptionDurationMonths, 1);
    assert.equal(account.subscriptionExpiresAt, '2026-08-23T01:00:00.000Z');
  } finally {
    cleanup();
  }
});

test('crypto package entitlement credits once without using RUB kopecks', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'crypto_buyer'));
    const input = {
      orderId: 'mfc_0123456789abcdef0123456789abcdef', telegramId: 10,
      kind: 'package', productId: 'coins_150', durationMonths: 1,
      durationDays: 0, metacoins: 150, amountUsdcMicros: 12_500_000,
      paymentRail: 'crypto_usdc', fundingProvider: 'openrouter',
      confirmedAt: '2026-08-11T12:00:00.000Z'
    };

    assert.equal(service.fulfillCryptoEntitlement(input).status, 'fulfilled');
    assert.equal(service.fulfillCryptoEntitlement(input).status, 'duplicate');
    assert.equal(service.account(10).metacoinBalance, 150);
  } finally {
    cleanup();
  }
});

test('crypto new-plan entitlement activates once with rail/provider provenance and no kopeck price', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'crypto_plan_buyer'));
    const result = service.fulfillCryptoEntitlement({
      orderId: 'mfc_fedcba9876543210fedcba9876543210', telegramId: 10,
      kind: 'tariff', productId: 'author', durationMonths: 1,
      durationDays: 30, metacoins: 300, amountUsdcMicros: 75_000_000,
      paymentRail: 'crypto_usdc', fundingProvider: 'openrouter',
      confirmedAt: '2026-08-11T12:00:00.000Z'
    });

    assert.equal(result.status, 'fulfilled');
    assert.equal(service.account(10).subscriptionPlanId, 'author');
    assert.equal(service.account(10).metacoinBalance, 300);
    assert.equal(service.account(10).subscriptionPriceKopecks, 0);
  } finally {
    cleanup();
  }
});

test('an upgrade tops the subscription up to the target allowance and preserves package coins', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    service.activateSubscription({
      paymentId: 'plan-amateur', telegramId: 10, planId: 'amateur',
      durationMonths: 1, durationDays: 30, priceKopecks: 44_900,
      metacoins: 130, activatedAt: '2026-07-24T01:00:00.000Z'
    });
    service.debitMetacoins({ telegramId: 10, amount: 20, requestKey: 'spent-before-upgrade' });
    service.grantPromoMetacoins({ telegramId: 10, promoCode: 'PACKAGE-LIKE', amount: 50 });

    service.reservePlanUpgrade({
      reservationId: 'upgrade-reservation-author', telegramId: 10,
      fromPlanId: 'amateur', targetPlanId: 'author', durationMonths: 1,
      remainingPlanMetacoins: 110
    });
    assert.equal(service.account(10).metacoinBalance, 50);
    assert.equal(service.account(10).subscriptionMetacoinsRemaining, 0);

    service.activateSubscription({
      paymentId: 'plan-upgrade-author', telegramId: 10, planId: 'author',
      durationMonths: 1, durationDays: 30, priceKopecks: 36_900,
      metacoins: 300, creditedMetacoins: 190,
      remainingPlanMetacoinsBefore: 110,
      upgradeReservationId: 'upgrade-reservation-author',
      activatedAt: '2026-07-24T01:00:00.000Z'
    });

    const account = service.account(10);
    assert.equal(account.subscriptionMetacoinsTotal, 300);
    assert.equal(account.subscriptionMetacoinsRemaining, 300);
    assert.equal(account.metacoinBalance, 350);
  } finally {
    cleanup();
  }
});

test('an upgrade reservation is idempotent and release restores only subscription coins', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    service.activateSubscription({
      paymentId: 'plan-amateur', telegramId: 10, planId: 'amateur',
      durationMonths: 1, durationDays: 30, priceKopecks: 44_900,
      metacoins: 130, activatedAt: '2026-07-24T01:00:00.000Z'
    });
    const input = {
      reservationId: 'upgrade-reservation-release', telegramId: 10,
      fromPlanId: 'amateur', targetPlanId: 'author', durationMonths: 1,
      remainingPlanMetacoins: 130
    };
    assert.equal(service.reservePlanUpgrade(input).status, 'reserved');
    assert.equal(service.reservePlanUpgrade(input).status, 'duplicate');
    assert.equal(service.releasePlanUpgrade({ reservationId: input.reservationId, telegramId: 10 }).status, 'released');
    assert.equal(service.releasePlanUpgrade({ reservationId: input.reservationId, telegramId: 10 }).status, 'released');
    assert.equal(service.account(10).metacoinBalance, 130);
    assert.equal(service.account(10).subscriptionMetacoinsRemaining, 130);
    assert.equal(service.reservePlanUpgrade(input).status, 'reserved');
    assert.equal(service.account(10).metacoinBalance, 0);
    assert.equal(service.account(10).subscriptionMetacoinsRemaining, 0);
  } finally {
    cleanup();
  }
});

test('an upgrade checkout and a generation reservation cannot overlap', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    service.activateSubscription({
      paymentId: 'plan-amateur-race', telegramId: 10, planId: 'amateur',
      durationMonths: 1, durationDays: 30, priceKopecks: 44_900,
      metacoins: 130, activatedAt: '2026-07-24T01:00:00.000Z'
    });
    service.grantPromoMetacoins({ telegramId: 10, promoCode: 'RACE-PACKAGE', amount: 200 });

    service.reserveMetacoins({
      telegramId: 10, amount: 10, requestKey: 'generation-before-upgrade'
    });
    assert.throws(() => service.reservePlanUpgrade({
      reservationId: 'upgrade-during-generation', telegramId: 10,
      fromPlanId: 'amateur', targetPlanId: 'author', durationMonths: 1,
      remainingPlanMetacoins: 130
    }), /generation.*pending|reservation.*pending/i);

    service.releaseMetacoins({
      telegramId: 10, amount: 10, requestKey: 'generation-before-upgrade'
    });
    service.reservePlanUpgrade({
      reservationId: 'upgrade-before-generation', telegramId: 10,
      fromPlanId: 'amateur', targetPlanId: 'author', durationMonths: 1,
      remainingPlanMetacoins: 130
    });
    assert.throws(() => service.reserveMetacoins({
      telegramId: 10, amount: 1, requestKey: 'generation-during-upgrade'
    }), /upgrade.*pending|reservation.*pending/i);
    assert.throws(() => service.debitMetacoins({
      telegramId: 10, amount: 1, requestKey: 'legacy-generation-during-upgrade'
    }), /upgrade.*pending|reservation.*pending/i);
  } finally {
    cleanup();
  }
});

test('CRM metacoin adjustments are applied once and reject an insufficient debit', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    service.grantPromoMetacoins({ telegramId: 10, promoCode: 'CRM100', amount: 100 });

    const payload = {
      actionId: 'crm-action-0001',
      telegramId: 10,
      delta: 50,
      reason: 'компенсация',
      now: '2026-07-24T01:00:00.000Z'
    };
    assert.deepEqual(service.applyAdminMetacoinAdjustment(payload), {
      status: 'applied',
      actionId: 'crm-action-0001',
      balanceAfter: 150
    });
    assert.deepEqual(service.applyAdminMetacoinAdjustment(payload), {
      status: 'duplicate',
      actionId: 'crm-action-0001',
      balanceAfter: 150
    });
    assert.equal(service.account(10).metacoinBalance, 150);

    assert.throws(
      () => service.applyAdminMetacoinAdjustment({
        ...payload,
        actionId: 'crm-action-0002',
        delta: -151
      }),
      /insufficient|недостаточно/i
    );
  } finally {
    cleanup();
  }
});

test('CRM subscription changes update the local account and remain idempotent', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    const payload = {
      actionId: 'crm-plan-0001',
      telegramId: 10,
      planId: 'author',
      durationMonths: 1,
      metacoins: 300,
      expiresAt: '2026-08-23T01:00:00.000Z',
      reason: 'ручная компенсация',
      now: '2026-07-24T01:00:00.000Z'
    };

    assert.deepEqual(service.applyAdminSubscription(payload), {
      status: 'applied',
      actionId: 'crm-plan-0001',
      expiresAt: '2026-08-23T01:00:00.000Z',
      balanceAfter: 300
    });
    assert.deepEqual(service.applyAdminSubscription(payload), {
      status: 'duplicate',
      actionId: 'crm-plan-0001',
      expiresAt: '2026-08-23T01:00:00.000Z',
      balanceAfter: 300
    });
    assert.equal(service.account(10).subscriptionPlanId, 'author');
    assert.equal(service.account(10).metacoinBalance, 300);
  } finally {
    cleanup();
  }
});

test('active renewal is rejected without resetting the carried metacoin balance', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    const first = service.activateSubscription({
      paymentId: 'yookassa-plan-1',
      telegramId: 10,
      planId: 'author',
      durationMonths: 1,
      durationDays: 30,
      priceKopecks: 74_900,
      metacoins: 300,
      activatedAt: '2026-07-24T01:00:00.000Z'
    });
    assert.equal(service.debitMetacoins({
      telegramId: 10,
      amount: 40,
      requestKey: 'generation-1'
    }).status, 'debited');

    assert.throws(() => service.activateSubscription({
      paymentId: 'yookassa-plan-2',
      telegramId: 10,
      planId: 'author',
      durationMonths: 1,
      durationDays: 30,
      priceKopecks: 74_900,
      metacoins: 300,
      activatedAt: '2026-07-25T01:00:00.000Z'
    }), /already active|active subscription/i);

    assert.equal(service.account(10).subscriptionExpiresAt, first.expiresAt);
    assert.equal(service.account(10).metacoinBalance, 260);
  } finally {
    cleanup();
  }
});

test('same plan can be purchased after the previous subscription ends', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    service.activateSubscription({
      paymentId: 'yookassa-plan-1',
      telegramId: 10,
      planId: 'author',
      durationMonths: 1,
      durationDays: 30,
      priceKopecks: 74_900,
      metacoins: 300,
      activatedAt: '2026-07-24T01:00:00.000Z'
    });

    const renewed = service.activateSubscription({
      paymentId: 'yookassa-plan-2',
      telegramId: 10,
      planId: 'author',
      durationMonths: 1,
      durationDays: 30,
      priceKopecks: 74_900,
      metacoins: 300,
      activatedAt: '2026-08-24T01:00:00.000Z'
    });

    assert.equal(renewed.startsAt, '2026-08-24T01:00:00.000Z');
    assert.equal(renewed.expiresAt, '2026-09-23T01:00:00.000Z');
    assert.equal(service.account(10).metacoinBalance, 600);
  } finally {
    cleanup();
  }
});

test('metacoin promo grant is idempotent for the same user and code', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));

    assert.equal(service.grantPromoMetacoins({
      telegramId: 10,
      promoCode: 'HELLO100',
      amount: 100
    }), true);
    assert.equal(service.grantPromoMetacoins({
      telegramId: 10,
      promoCode: 'HELLO100',
      amount: 100
    }), false);
    assert.equal(service.account(10).metacoinBalance, 100);
  } finally {
    cleanup();
  }
});

test('metacoin debit uses the service clock and returns the updated account counters', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    service.grantPromoMetacoins({
      telegramId: 10,
      promoCode: 'DEBIT20',
      amount: 20
    });

    assert.deepEqual(service.debitMetacoins({
      telegramId: 10,
      amount: 7,
      requestKey: 'generation:request-1'
    }), {
      status: 'debited',
      requestKey: 'generation:request-1',
      amount: 7,
      balance: 13,
      subscriptionMetacoinsRemaining: 0,
      spentMetacoins1d: 7,
      spentMetacoins30d: 7
    });
    assert.equal(service.account(10).metacoinBalance, 13);
  } finally {
    cleanup();
  }
});

test('profile and the history ledger mirror use the same fresh authoritative debit balance', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    service.grantPromoMetacoins({
      telegramId: 10,
      promoCode: 'PROFILE20',
      amount: 20
    });

    const debit = service.debitMetacoins({
      telegramId: 10,
      amount: 7,
      requestKey: 'generation:profile-refresh'
    });
    const profile = service.account(10);
    const ledgerMirror = {
      delta: -debit.amount,
      balanceAfter: debit.balance
    };

    assert.equal(METACOIN_BALANCE_CONTRACT.authority, 'sqlite');
    assert.equal(profile.metacoinBalance, 13);
    assert.equal(profile.metacoinBalance, debit.balance);
    assert.deepEqual(ledgerMirror, {
      delta: -7,
      balanceAfter: profile.metacoinBalance
    });
  } finally {
    cleanup();
  }
});

test('metacoin debit wrapper preserves idempotency and insufficient-funds results', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'ivan_test'));
    service.grantPromoMetacoins({
      telegramId: 10,
      promoCode: 'DEBIT5',
      amount: 5
    });

    const payload = {
      telegramId: 10,
      amount: 5,
      requestKey: 'generation:request-2'
    };
    assert.equal(service.debitMetacoins(payload).status, 'debited');
    assert.equal(service.debitMetacoins(payload).status, 'duplicate');
    assert.deepEqual(service.debitMetacoins({
      telegramId: 10,
      amount: 1,
      requestKey: 'generation:request-3'
    }), {
      status: 'insufficient_funds',
      requestKey: 'generation:request-3',
      amount: 1,
      balance: 0,
      subscriptionMetacoinsRemaining: 0,
      spentMetacoins1d: 5,
      spentMetacoins30d: 5
    });
  } finally {
    cleanup();
  }
});

test('referrer binding is permanent and rejects self-referrals and unknown codes', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    const other = service.registerUser(user(11, 'other'));
    service.registerUser(user(20, 'friend'));

    assert.equal(service.bindReferral(20, inviter.referralCode).status, 'bound');
    assert.equal(service.bindReferral(20, other.referralCode).status, 'already_bound');
    assert.equal(service.bindReferral(10, inviter.referralCode).status, 'self_referral');
    assert.equal(service.bindReferral(11, 'missing_code').status, 'invalid_code');
    assert.equal(service.getUser(20).referrerId, '10');
  } finally {
    cleanup();
  }
});

test('an existing user cannot be attached after their first normal bot start', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.processStart(user(20, 'existing_user'), '');

    assert.equal(service.processStart(user(20, 'existing_user'), inviter.referralCode).status, 'already_started');
    assert.equal(service.bindReferral(20, inviter.referralCode).status, 'already_started');
    assert.equal(service.getUser(20).referrerId, null);
  } finally {
    cleanup();
  }
});

test('migration prevents existing users from being claimed retroactively', () => {
  const directory = mkdtempSync(join(tmpdir(), 'metaflora-referrals-legacy-'));
  const databasePath = join(directory, 'referrals.sqlite');
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE referral_users (
      telegram_id TEXT PRIMARY KEY,
      username TEXT NOT NULL DEFAULT '',
      first_name TEXT NOT NULL DEFAULT '',
      referral_code TEXT NOT NULL UNIQUE,
      referrer_id TEXT REFERENCES referral_users(telegram_id),
      referred_at TEXT,
      metacoin_balance INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  database.prepare(`
    INSERT INTO referral_users (
      telegram_id, username, first_name, referral_code, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('20', 'legacy_user', 'Legacy', 'legacy_user_Legacy123', '2026-07-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z');
  database.close();

  const service = createReferralService({
    databasePath,
    now: () => new Date('2026-07-24T01:00:00.000Z'),
    randomToken: () => 'K7m4Q2x9Qa12'
  });
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    assert.equal(service.processStart(user(20, 'legacy_user'), inviter.referralCode).status, 'already_started');
    assert.equal(service.getUser(20).referrerId, null);
    assert.equal(service.getUser(20).startedAt, '2026-07-01T00:00:00.000Z');
  } finally {
    service.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('first referral payment grants both 25 percent bonuses and one cash earning', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.registerUser(user(20, 'friend'));
    service.bindReferral(20, inviter.referralCode);

    const payment = service.recordPayment({
      paymentId: 'pay-1',
      telegramId: 20,
      amountKopecks: 100_000,
      baseMetacoins: 2_000
    });
    const duplicate = service.recordPayment({
      paymentId: 'pay-1',
      telegramId: 20,
      amountKopecks: 100_000,
      baseMetacoins: 2_000
    });

    assert.equal(payment.friendBonusMetacoins, 500);
    assert.equal(payment.inviterBoostCreated, true);
    assert.equal(payment.referralEarningKopecks, 12_500);
    assert.equal(payment.referralPercent, 25);
    assert.equal(duplicate.status, 'duplicate');

    const friend = service.account(20);
    const inviterAccount = service.account(10);
    assert.equal(friend.metacoinBalance, 2_500);
    assert.equal(inviterAccount.availableBoosts, 1);
    assert.equal(inviterAccount.pendingKopecks, 12_500);
  } finally {
    cleanup();
  }
});

test('a referred subscription purchase grants both metacoin bonuses and a cash earning', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.registerUser(user(20, 'friend'));
    service.bindReferral(20, inviter.referralCode);

    const purchase = service.activateSubscription({
      paymentId: 'subscription-referral-1',
      telegramId: 20,
      planId: 'amateur',
      durationMonths: 1,
      durationDays: 30,
      priceKopecks: 100_000,
      metacoins: 2_000,
      creditedMetacoins: 2_000,
      remainingPlanMetacoinsBefore: 0,
      activatedAt: new Date('2026-07-24T01:00:00.000Z')
    });

    assert.equal(purchase.friendBonusMetacoins, 500);
    assert.equal(purchase.inviterBoostCreated, true);
    assert.equal(purchase.referralEarningKopecks, 12_500);
    assert.equal(service.account(20).metacoinBalance, 2_500);
    assert.equal(service.account(10).availableBoosts, 1);
    assert.equal(service.listEarnings(10).length, 1);
  } finally {
    cleanup();
  }
});

test('inviter boost applies once to the next top-up without an amount ceiling', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.registerUser(user(20, 'friend'));
    service.bindReferral(20, inviter.referralCode);
    service.recordPayment({
      paymentId: 'friend-payment',
      telegramId: 20,
      amountKopecks: 100_000,
      baseMetacoins: 2_000
    });

    const first = service.recordPayment({
      paymentId: 'inviter-payment-1',
      telegramId: 10,
      amountKopecks: 1_000_000,
      baseMetacoins: 20_000
    });
    const second = service.recordPayment({
      paymentId: 'inviter-payment-2',
      telegramId: 10,
      amountKopecks: 1_000_000,
      baseMetacoins: 20_000
    });

    assert.equal(first.inviterBonusMetacoins, 5_000);
    assert.equal(second.inviterBonusMetacoins, 0);
    assert.equal(service.account(10).metacoinBalance, 45_000);
  } finally {
    cleanup();
  }
});

test('levels rise by distinct paid referrals and affect the triggering payment', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    for (const id of [21, 22, 23]) {
      service.registerUser(user(id, `friend_${id}`));
      service.bindReferral(id, inviter.referralCode);
      service.recordPayment({
        paymentId: `pay-${id}`,
        telegramId: id,
        amountKopecks: 100_000,
        baseMetacoins: 2_000
      });
    }

    const account = service.account(10);
    assert.equal(account.paidReferrals, 3);
    assert.equal(account.level.name, 'серебро');
    assert.equal(service.listEarnings(10)[0].percent, 30);
  } finally {
    cleanup();
  }
});

test('repeat payments create recurring cash earnings without repeating first-payment bonuses', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.registerUser(user(20, 'friend'));
    service.bindReferral(20, inviter.referralCode);
    service.recordPayment({ paymentId: 'pay-1', telegramId: 20, amountKopecks: 100_000, baseMetacoins: 2_000 });
    const repeat = service.recordPayment({
      paymentId: 'pay-2',
      telegramId: 20,
      amountKopecks: 200_000,
      baseMetacoins: 4_000
    });

    assert.equal(repeat.friendBonusMetacoins, 0);
    assert.equal(repeat.inviterBoostCreated, false);
    assert.equal(repeat.referralEarningKopecks, 25_000);
    assert.equal(service.account(10).availableBoosts, 1);
    assert.equal(service.listEarnings(10).length, 2);
  } finally {
    cleanup();
  }
});

test('payout setup encrypts card details and exposes only a safe mask to the bot and CRM', () => {
  const { service, cleanup } = createTestService({
    payoutEncryptionKey: 'test-payout-encryption-key'
  });
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.registerUser(user(20, 'friend'));
    service.bindReferral(20, inviter.referralCode);
    service.recordPayment({
      paymentId: 'pay-secure-withdrawal',
      telegramId: 20,
      amountKopecks: 1_000_000,
      baseMetacoins: 2_000
    });
    service.releaseDueEarnings();

    const setup = service.createPayoutSetup({
      telegramId: 10,
      amountKopecks: 100_000,
      method: 'bank_card',
      expiresAt: '2026-07-24T02:00:00.000Z'
    });
    const withdrawal = service.completePayoutSetup({
      setupToken: setup.setupToken,
      destinationData: {
        payoutToken: 'synonym.token-1234567890',
        first6: '411111',
        last4: '1111',
        issuerName: 'Test bank'
      }
    });

    assert.equal(withdrawal.destinationHint, '•••• 1111');
    assert.doesNotMatch(JSON.stringify(withdrawal), /synonym|411111/u);
    assert.deepEqual(service.getWithdrawalPayoutData(withdrawal.withdrawalId), {
      method: 'bank_card',
      payoutToken: 'synonym.token-1234567890'
    });
  } finally {
    cleanup();
  }
});

test('payout setup link uses the configured short lifetime', () => {
  const { service, cleanup } = createTestService({
    payoutEncryptionKey: 'test-payout-encryption-key',
    payoutSetupTtlMinutes: 22
  });
  try {
    service.registerUser(user(10, 'inviter'));
    const friend = service.registerUser(user(20, 'friend'));
    service.bindReferral(20, service.getUser(10).referralCode);
    service.recordPayment({
      paymentId: 'pay-setup-ttl',
      telegramId: friend.telegramId,
      amountKopecks: 1_000_000,
      baseMetacoins: 2_000
    });
    service.releaseDueEarnings();

    const setup = service.createPayoutSetup({
      telegramId: 10,
      amountKopecks: 100_000,
      method: 'sbp'
    });

    assert.equal(setup.expiresAt, '2026-07-24T01:22:00.000Z');
  } finally {
    cleanup();
  }
});

test('duplicate payment id must match the original immutable payment payload', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'payer'));
    service.recordPayment({
      paymentId: 'pay-immutable',
      telegramId: 10,
      amountKopecks: 100_000,
      baseMetacoins: 2_000,
      confirmedAt: '2026-07-24T01:00:00.000Z'
    });

    assert.throws(() => service.recordPayment({
      paymentId: 'pay-immutable',
      telegramId: 10,
      amountKopecks: 200_000,
      baseMetacoins: 2_000,
      confirmedAt: '2026-07-24T01:00:00.000Z'
    }), /collision/i);
    assert.throws(() => service.recordPayment({
      paymentId: 'pay-immutable',
      telegramId: 10,
      amountKopecks: 100_000,
      baseMetacoins: 2_000,
      confirmedAt: '2026-07-24T02:00:00.000Z'
    }), /collision/i);
  } finally {
    cleanup();
  }
});

test('cash rewards continue without a hidden campaign cutoff', () => {
  const { service, cleanup } = createTestService({
    now: () => new Date('2026-09-02T00:00:00.000Z')
  });
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.registerUser(user(20, 'friend'));
    service.bindReferral(20, inviter.referralCode);
    const payment = service.recordPayment({
      paymentId: 'pay-after-cutoff',
      telegramId: 20,
      amountKopecks: 100_000,
      baseMetacoins: 2_000
    });

    assert.equal(payment.friendBonusMetacoins, 500);
    assert.equal(payment.inviterBoostCreated, true);
    assert.equal(payment.referralEarningKopecks, 12_500);
    assert.equal(service.listEarnings(10).length, 1);
  } finally {
    cleanup();
  }
});

test('persistent database keeps users and referral links after reopening', () => {
  const directory = mkdtempSync(join(tmpdir(), 'metaflora-referrals-persist-'));
  const databasePath = join(directory, 'referrals.sqlite');
  const first = createReferralService({
    databasePath,
    randomToken: () => 'K7m4Q2x9Qa12',
    now: () => new Date('2026-07-24T01:00:00.000Z')
  });
  const registered = first.registerUser(user(10, 'persistent'));
  first.close();

  const second = createReferralService({ databasePath });
  try {
    assert.equal(second.getUser(10).referralCode, registered.referralCode);
  } finally {
    second.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('withdrawal requires 1000 rubles and reserves available earnings', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.registerUser(user(20, 'friend'));
    service.bindReferral(20, inviter.referralCode);
    service.recordPayment({
      paymentId: 'pay-1',
      telegramId: 20,
      amountKopecks: 1_000_000,
      baseMetacoins: 20_000
    });
    service.releaseDueEarnings();

    assert.throws(
      () => service.requestWithdrawal({ telegramId: 10, amountKopecks: 99_900, destination: '+79990000000' }),
      /минимальная сумма/i
    );
    const withdrawal = service.requestWithdrawal({
      telegramId: 10,
      amountKopecks: 100_000,
      destination: '+79990000000'
    });

    assert.equal(withdrawal.status, 'pending');
    assert.equal(service.account(10).availableKopecks, 25_000);
  } finally {
    cleanup();
  }
});

test('withdrawal accepts only Russian payout methods and rejects crypto destinations', () => {
  const { service, cleanup } = createTestService();
  try {
    service.registerUser(user(10, 'partner'));
    assert.throws(
      () => service.requestWithdrawal({ telegramId: 10, amountKopecks: 100_000, destination: '<b>send here</b>' }),
      /реквизиты/i
    );
    assert.throws(
      () => service.requestWithdrawal({
        telegramId: 10,
        amountKopecks: 100_000,
        method: 'crypto',
        destination: 'TQ3f3f3f3f3f3f3f3f3f3f3f3f3f3f3f3f'
      }),
      /спб|карт/i
    );
    assert.throws(
      () => service.requestWithdrawal({
        telegramId: 10,
        amountKopecks: 100_000,
        method: 'bank_card',
        destination: '+79990000000'
      }),
      /карт/i
    );
  } finally {
    cleanup();
  }
});

test('withdrawal stores the selected SBP or bank-card route', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.registerUser(user(20, 'friend'));
    service.bindReferral(20, inviter.referralCode);
    service.recordPayment({ paymentId: 'pay-route-1', telegramId: 20, amountKopecks: 2_000_000, baseMetacoins: 40_000 });
    service.releaseDueEarnings();

    const sbp = service.requestWithdrawal({
      telegramId: 10,
      amountKopecks: 100_000,
      method: 'sbp',
      destination: '+79990000000'
    });
    assert.equal(sbp.method, 'sbp');
    service.rejectWithdrawal(sbp.withdrawalId);
    const card = service.requestWithdrawal({
      telegramId: 10,
      amountKopecks: 100_000,
      method: 'bank_card',
      destination: '4111111111111111'
    });
    assert.equal(card.method, 'bank_card');
    assert.equal(service.getWithdrawal(card.withdrawalId).method, 'bank_card');
  } finally {
    cleanup();
  }
});

test('withdrawal queue exposes an idempotent paid transition for real manual payouts', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.registerUser(user(20, 'friend'));
    service.bindReferral(20, inviter.referralCode);
    service.recordPayment({
      paymentId: 'pay-queue-1',
      telegramId: 20,
      amountKopecks: 1_000_000,
      baseMetacoins: 20_000
    });
    service.releaseDueEarnings();
    const withdrawal = service.requestWithdrawal({
      telegramId: 10,
      amountKopecks: 100_000,
      destination: '+79990000000'
    });

    assert.equal(service.listPendingWithdrawals().length, 1);
    const paid = service.markWithdrawalPaid(withdrawal.withdrawalId);
    const duplicate = service.markWithdrawalPaid(withdrawal.withdrawalId);

    assert.equal(paid.status, 'paid');
    assert.equal(duplicate.status, 'paid');
    assert.equal(service.listPendingWithdrawals().length, 0);
    assert.equal(service.account(10).availableKopecks, 25_000);
  } finally {
    cleanup();
  }
});

test('rejected withdrawal releases the reserved partner balance', () => {
  const { service, cleanup } = createTestService();
  try {
    const inviter = service.registerUser(user(10, 'inviter'));
    service.registerUser(user(20, 'friend'));
    service.bindReferral(20, inviter.referralCode);
    service.recordPayment({
      paymentId: 'pay-queue-2',
      telegramId: 20,
      amountKopecks: 1_000_000,
      baseMetacoins: 20_000
    });
    service.releaseDueEarnings();
    const withdrawal = service.requestWithdrawal({
      telegramId: 10,
      amountKopecks: 100_000,
      destination: '+79990000000'
    });

    const rejected = service.rejectWithdrawal(withdrawal.withdrawalId);
    assert.equal(rejected.status, 'rejected');
    assert.equal(service.account(10).availableKopecks, 125_000);
  } finally {
    cleanup();
  }
});
