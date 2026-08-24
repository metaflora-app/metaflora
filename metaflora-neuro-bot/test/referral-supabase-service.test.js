import assert from 'node:assert/strict';
import test from 'node:test';

import { decryptPayoutData } from '../src/payout-crypto.js';
import { createSupabaseBackedReferralService } from '../src/referral-supabase-service.js';

test('Supabase referral authority awaits writes, owns reads and reserves before local withdrawal commit', async () => {
  const encryptionKey = 'supabase-referral-wrapper-test-key';
  const calls = [];
  const base = {
    processStart(user, code) {
      return { status: 'bound', referrerId: '100' };
    },
    recordPayment(args) {
      return {
        status: 'recorded',
        referralEarningKopecks: 1000,
        referralPercent: 25,
        friendBonusMetacoins: 25,
        inviterBonusMetacoins: 25
      };
    },
    getUser() {
      return { telegramId: '200', referrerId: '100' };
    },
    account() { return {}; },
    preparePayoutSetupCompletion() {
      return {
        withdrawalId: 'withdrawal-1',
        telegramId: '100',
        amountKopecks: 100_000,
        method: 'sbp',
        destinationHint: '+7••• •••-0000',
        payoutIdempotencyKey: 'payout:withdrawal-1',
        payoutData: { method: 'sbp', phone: '79990000000', bankId: '100000000111' }
      };
    },
    commitPayoutSetupCompletion(prepared) {
      calls.push(['localCommit', prepared]);
      return prepared;
    },
    close() {}
  };
  const repository = {
    async bindRelation(value) {
      calls.push(['bindRelation', value]);
      return { outcome: 'bound' };
    },
    async recordEarning(value) {
      calls.push(['recordEarning', value]);
      return { outcome: 'recorded' };
    },
    async reserveWithdrawal(value) {
      calls.push(['reserveWithdrawal', value]);
      return { outcome: 'reserved' };
    },
    async readAccount() {
      return { available_kopecks: 1234, pending_kopecks: 55, reserved_kopecks: 66, lifetime_kopecks: 7777 };
    },
    async listReferrals() {
      return [{ telegramId: '200', paidPayments: 1 }];
    },
    async listEarnings() {
      return [{ paymentId: 'pay-1', amountKopecks: 1000 }];
    }
  };
  const service = createSupabaseBackedReferralService({
    service: base,
    repository,
    payoutEncryptionKey: encryptionKey,
    holdDays: 14,
    onError(error) {
      throw error;
    }
  });

  await service.processStart({ id: 200 }, 'ref_code');
  await service.recordPayment({
    paymentId: 'pay-1',
    telegramId: 200,
    amountKopecks: 10_000,
    baseMetacoins: 100,
    paymentFeeKopecks: 300,
    apiLiabilityKopecks: 4000,
    confirmedAt: '2026-08-14T00:00:00.000Z'
  });
  await service.completePayoutSetup({ setupToken: 'setup-1', destinationData: {} });
  assert.deepEqual(await service.account(100), {
    availableKopecks: 1234,
    pendingKopecks: 55,
    reservedKopecks: 66,
    lifetimeKopecks: 7777
  });
  assert.equal((await service.listReferrals(100))[0].telegramId, '200');
  assert.equal((await service.listEarnings(100))[0].paymentId, 'pay-1');

  assert.equal(calls[0][0], 'bindRelation');
  assert.equal(calls[1][0], 'recordEarning');
  assert.equal(calls[1][1].referrerTelegramId, '100');
  assert.equal(calls[1][1].referredTelegramId, '200');
  assert.equal(calls[1][1].referralBonusLiabilityKopecks, 1333);
  assert.equal(calls[1][1].ownerRemainderKopecks, 4700);
  assert.equal(calls[2][0], 'reserveWithdrawal');
  assert.equal(calls[3][0], 'localCommit');
  assert.deepEqual(decryptPayoutData(calls[2][1].destinationEncrypted, encryptionKey), {
    method: 'sbp',
    phone: '79990000000',
    bankId: '100000000111'
  });
});

test('Supabase authority fails closed and never commits a local withdrawal after reserve failure', async () => {
  let committed = false;
  const service = createSupabaseBackedReferralService({
    service: {
      preparePayoutSetupCompletion() {
        return {
          withdrawalId: 'withdrawal-2', telegramId: '100', amountKopecks: 100_000,
          method: 'sbp', destinationHint: '+7••• •••-0000', payoutIdempotencyKey: 'payout:withdrawal-2',
          payoutData: { method: 'sbp', phone: '79990000000', bankId: '100000000111' }
        };
      },
      commitPayoutSetupCompletion() { committed = true; },
      close() {}
    },
    repository: {
      async reserveWithdrawal() { throw new Error('supabase unavailable'); }
    },
    payoutEncryptionKey: 'supabase-referral-wrapper-test-key'
  });
  await assert.rejects(() => service.completePayoutSetup({ setupToken: 'x', destinationData: {} }), /supabase unavailable/);
  assert.equal(committed, false);
});

test('Supabase authority does not swallow relation or earning write failures', async () => {
  const relation = createSupabaseBackedReferralService({
    service: { processStart() { return { status: 'bound', referrerId: '100' }; }, close() {} },
    repository: { async bindRelation() { throw new Error('relation failed'); } }
  });
  await assert.rejects(() => relation.processStart({ id: 200 }, 'ref'), /relation failed/);

  const earning = createSupabaseBackedReferralService({
    service: {
      recordPayment() { return { status: 'recorded', referralEarningKopecks: 100, referralPercent: 25 }; },
      getUser() { return { telegramId: '200', referrerId: '100' }; }, close() {}
    },
    repository: { async recordEarning() { throw new Error('earning failed'); } }
  });
  await assert.rejects(() => earning.recordPayment({
    paymentId: 'pay-x', telegramId: 200, amountKopecks: 1000, baseMetacoins: 10
  }), /earning failed/);
});

test('a local duplicate retries the idempotent Supabase earning with its original percent', async () => {
  let recorded;
  const service = createSupabaseBackedReferralService({
    service: {
      recordPayment() {
        return { status: 'duplicate', referralEarningKopecks: 250, referralPercent: 25 };
      },
      getUser() { return { telegramId: '200', referrerId: '100' }; },
      close() {}
    },
    repository: {
      async recordEarning(value) { recorded = value; return { outcome: 'already_recorded' }; }
    }
  });
  await service.recordPayment({
    paymentId: 'pay-retry', telegramId: 200, amountKopecks: 1000, baseMetacoins: 10,
    paymentFeeKopecks: 35, apiLiabilityKopecks: 465
  });
  assert.equal(recorded.percent, 25);
  assert.equal(recorded.rewardAmountKopecks, 250);
});
