import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SupabaseReferralRepository,
  SUPABASE_REFERRAL_BALANCE_CONTRACT
} from '../src/supabase-referral-repository.js';

function clientWith(responses = {}) {
  const calls = [];
  return {
    calls,
    async rpc(name, params) {
      calls.push({ name, params });
      return responses[name] ?? { data: null, error: null };
    }
  };
}

test('declares Supabase ledger as the authoritative referral balance', () => {
  assert.deepEqual(SUPABASE_REFERRAL_BALANCE_CONTRACT, {
    authority: 'supabase',
    schema: 'neuro',
    ledgerTable: 'referral_ledger_entries',
    writeSurface: 'security_definer_rpcs',
    legacyRole: 'sqlite_backfill_only'
  });
});

test('records an earning through the idempotent RPC and maps its result', async () => {
  const client = clientWith({
    record_referral_earning_v2: {
      data: [{ earning_id: '67ab3863-3ec6-4dce-bc3a-c844bb6d046e', outcome: 'created' }],
      error: null
    }
  });
  const repository = new SupabaseReferralRepository(client);
  const result = await repository.recordEarning({
    paymentKey: 'tbank:payment-42',
    referrerTelegramId: '1001',
    referredTelegramId: '1002',
    grossAmountKopecks: 100_000,
    rewardAmountKopecks: 10_000,
    percent: 10,
    availableAt: '2026-08-28T10:00:00.000Z',
    metadata: { source: 'tbank' }
  });
  assert.equal(result.outcome, 'created');
  assert.equal(client.calls[0].name, 'record_referral_earning_v2');
  assert.equal(client.calls[0].params.p_payment_key, 'tbank:payment-42');
  assert.equal(client.calls[0].params.p_reward_amount_kopecks, 10_000);
});

test('fails closed when Supabase rejects a financial write', async () => {
  const client = clientWith({
    record_referral_earning_v2: { data: null, error: new Error('network unavailable') }
  });
  const repository = new SupabaseReferralRepository(client);
  await assert.rejects(() => repository.recordEarning({
    paymentKey: 'payment-42',
    referrerTelegramId: '1001',
    referredTelegramId: '1002',
    grossAmountKopecks: 100_000,
    rewardAmountKopecks: 10_000,
    percent: 10,
    availableAt: '2026-08-28T10:00:00.000Z'
  }), /network unavailable/);
});

test('reserves a withdrawal atomically with an idempotency key', async () => {
  const client = clientWith({
    reserve_referral_withdrawal_v2: {
      data: [{ withdrawal_id: 'wd_12345678', status: 'pending', outcome: 'created' }],
      error: null
    }
  });
  const repository = new SupabaseReferralRepository(client);
  const result = await repository.reserveWithdrawal({
    withdrawalId: 'wd_12345678',
    telegramId: '1001',
    amountKopecks: 100_000,
    payoutMethod: 'sbp',
    destinationEncrypted: 'ciphertext',
    destinationHint: '+7•••1234',
    idempotencyKey: 'withdrawal:1001:42'
  });
  assert.equal(result.outcome, 'created');
  assert.equal(client.calls[0].params.p_idempotency_key, 'withdrawal:1001:42');
});

test('uses compare-and-swap for withdrawal transitions', async () => {
  const client = clientWith({
    transition_referral_withdrawal_v2: {
      data: [{ withdrawal_id: 'wd_12345678', status: 'paid', changed: true }],
      error: null
    }
  });
  const repository = new SupabaseReferralRepository(client);
  const result = await repository.transitionWithdrawal({
    withdrawalId: 'wd_12345678',
    expectedStatus: 'processing',
    nextStatus: 'paid',
    externalPayoutId: 'tb_42'
  });
  assert.equal(result.changed, true);
  assert.equal(client.calls[0].params.p_expected_status, 'processing');
});

test('reversal is idempotent and references the original earning', async () => {
  const client = clientWith({
    reverse_referral_earning_v2: {
      data: [{ outcome: 'reversed', reversal_key: 'refund:42' }],
      error: null
    }
  });
  const repository = new SupabaseReferralRepository(client);
  const result = await repository.reverseEarning({
    paymentKey: 'tbank:payment-42',
    reversalKey: 'refund:42',
    reason: 'payment_refunded'
  });
  assert.equal(result.outcome, 'reversed');
  assert.equal(client.calls[0].params.p_reversal_key, 'refund:42');
});
