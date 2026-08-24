import assert from 'node:assert/strict';
import test from 'node:test';

import { encryptPayoutData } from '../src/payout-crypto.js';
import { createReferralPayoutWorkerRuntime } from '../src/referral-payout-worker-runtime.js';

test('runtime composes Supabase queue, encrypted destination and TBank client without funding-agent coupling', async () => {
  const encryptionKey = 'test-referral-payout-encryption-key';
  const rpcCalls = [];
  const client = {
    async rpc(name, args) {
      rpcCalls.push({ name, args });
      if (name === 'claim_referral_payouts_v2') return {
        data: [{
          withdrawal_id: 'withdrawal-runtime',
          claim_token: '22222222-2222-4222-8222-222222222222',
          user_id: '11111111-1111-4111-8111-111111111111',
          amount_kopecks: 100_000,
          payout_method: 'sbp',
          destination_encrypted: encryptPayoutData({ phone: '79990000000', bankId: '100000000111' }, encryptionKey),
          destination_hint: '+7 *** 00-00',
          external_payout_id: null,
          attempt_count: 1,
          lease_until: '2026-08-14T10:03:00.000Z'
        }],
        error: null
      };
      return { data: true, error: null };
    }
  };
  const providerCalls = [];
  const worker = createReferralPayoutWorkerRuntime({
    supabaseClient: client,
    tbankClient: {
      async createPayout(value) {
        providerCalls.push(value);
        return { id: 'tbank-runtime-1', status: 'pending' };
      }
    },
    encryptionKey,
    workerId: 'runtime-worker',
    enabled: true
  });

  const result = await worker.runOnce();

  assert.equal(result.submitted, 1);
  assert.equal(providerCalls[0].phone, '79990000000');
  assert.deepEqual(rpcCalls.map(({ name }) => name), [
    'claim_referral_payouts_v2',
    'record_referral_payout_submission_v2'
  ]);
});

