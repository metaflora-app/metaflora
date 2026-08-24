import assert from 'node:assert/strict';
import test from 'node:test';

import { SupabaseReferralPayoutQueue } from '../src/supabase-referral-payout-queue.js';

const CLAIM = '22222222-2222-4222-8222-222222222222';

function client(rows = []) {
  const calls = [];
  return {
    calls,
    async rpc(name, args) {
      calls.push({ name, args });
      return { data: name === 'claim_referral_payouts_v2' ? rows : true, error: null };
    }
  };
}

test('queue maps leased Supabase claims and keeps destinations outside the job DTO', async () => {
  const db = client([{
    withdrawal_id: 'withdrawal-1',
    claim_token: CLAIM,
    user_id: 'user-1',
    amount_kopecks: 100_000,
    payout_method: 'sbp',
    destination_encrypted: 'encrypted-destination',
    destination_hint: '+7 *** 00-00',
    attempt_count: 2,
    external_payout_id: null,
    lease_until: '2026-08-14T10:03:00.000Z'
  }]);
  const queue = new SupabaseReferralPayoutQueue({
    client: db,
    workerId: 'railway-payout-1',
    decodeDestination: (value) => {
      assert.equal(value, 'encrypted-destination');
      return { phone: '79990000000', bankId: '100000000111' };
    }
  });

  const jobs = await queue.claimReferralPayoutJobs({ limit: 10, leaseSeconds: 180 });

  assert.equal(jobs[0].withdrawalId, 'withdrawal-1');
  assert.equal(jobs[0].claimToken, CLAIM);
  assert.equal(jobs[0].amountKopecks, 100_000);
  assert.equal(jobs[0].destination, undefined);
  assert.equal(jobs[0].destinationEncrypted, undefined);
  assert.deepEqual(db.calls[0], {
    name: 'claim_referral_payouts_v2',
    args: { p_worker_id: 'railway-payout-1', p_limit: 10, p_lease_seconds: 180 }
  });
  assert.deepEqual(await queue.getReferralPayoutDestination({
    withdrawalId: 'withdrawal-1', claimToken: CLAIM
  }), { phone: '79990000000', bankId: '100000000111' });
});

test('queue uses claim-token RPCs for submission, completion, retry, and dead-letter', async () => {
  const db = client();
  const queue = new SupabaseReferralPayoutQueue({ client: db, workerId: 'worker-1', decodeDestination: () => ({}) });
  const identity = { withdrawalId: 'withdrawal-1', claimToken: CLAIM };

  assert.equal(await queue.markReferralPayoutStarted(identity), true);
  await queue.markReferralPayoutSubmitted({ ...identity, externalPayoutId: 'payout-1', providerStatus: 'pending' });
  await queue.markReferralPayoutCompleted({ ...identity, externalPayoutId: 'payout-1', payoutFeeKopecks: 123 });
  await queue.markReferralPayoutRetry({ ...identity, errorCode: 'tbank_network' });
  await queue.markReferralPayoutManual({ ...identity, errorCode: 'verification_failed' });

  assert.deepEqual(db.calls.map(({ name }) => name), [
    'record_referral_payout_submission_v2',
    'complete_referral_payout_v2',
    'fail_referral_payout_v2',
    'manual_referral_payout_v2'
  ]);
  assert.equal(db.calls[2].args.p_retryable, true);
  assert.equal(db.calls[3].args.p_error_code, 'verification_failed');
});

test('queue rejects Supabase errors without leaking encrypted destinations', async () => {
  const db = {
    async rpc() { return { data: null, error: { message: 'db failed encrypted-secret' } }; }
  };
  const queue = new SupabaseReferralPayoutQueue({ client: db, workerId: 'worker-1', decodeDestination: () => ({}) });

  await assert.rejects(
    queue.claimReferralPayoutJobs(),
    (error) => error.message === 'Referral payout database operation failed.'
  );
});

test('queue verifies a T-Business notification and reconciles it through the authoritative CAS RPC', async () => {
  const db = client();
  const queue = new SupabaseReferralPayoutQueue({ client: db, workerId: 'worker-1', decodeDestination: () => ({}) });
  const verified = {
    withdrawalId: 'withdrawal-1', id: 'provider-payout-1', amountKopecks: 100_000,
    status: 'succeeded', errorCode: null
  };
  const notificationClient = {
    verifyNotification(payload) {
      assert.deepEqual(payload, { Token: 'signed' });
      return verified;
    }
  };

  assert.deepEqual(await queue.reconcileTBankNotification({ Token: 'signed' }, notificationClient), verified);
  assert.deepEqual(db.calls[0], {
    name: 'reconcile_referral_payout_notification_v2',
    args: {
      p_withdrawal_id: 'withdrawal-1', p_external_payout_id: 'provider-payout-1',
      p_amount_kopecks: 100_000, p_provider_status: 'succeeded', p_error_code: null
    }
  });
});

test('queue rejects a valid provider notification when authoritative CAS did not reconcile a row', async () => {
  const db = { async rpc() { return { data: false, error: null }; } };
  const queue = new SupabaseReferralPayoutQueue({ client: db, workerId: 'worker-1', decodeDestination: () => ({}) });
  await assert.rejects(
    queue.reconcileTBankNotification({}, { verifyNotification: () => ({
      withdrawalId: 'withdrawal-1', id: 'provider-payout-1', amountKopecks: 100_000,
      status: 'succeeded', errorCode: null
    }) }),
    /not reconciled/u
  );
});
