import { decryptPayoutData } from './payout-crypto.js';
import { ReferralPayoutWorker } from './referral-payout-worker.js';
import { SupabaseReferralPayoutQueue } from './supabase-referral-payout-queue.js';

export function createReferralPayoutWorkerRuntime({
  supabaseClient,
  tbankClient,
  encryptionKey,
  workerId,
  ...workerOptions
} = {}) {
  const key = String(encryptionKey ?? '');
  if (key.length < 16) throw new TypeError('Payout encryption key is invalid.');
  const repository = new SupabaseReferralPayoutQueue({
    client: supabaseClient,
    workerId,
    decodeDestination: (encrypted) => decryptPayoutData(encrypted, key)
  });
  return new ReferralPayoutWorker({
    ...workerOptions,
    repository,
    client: tbankClient,
    workerId
  });
}

