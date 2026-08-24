import assert from 'node:assert/strict';
import test from 'node:test';

import { SupabaseHistoryRepository } from '../src/supabase-history-repository.js';

function scriptedClient(results) {
  const calls = [];
  const queue = [...results];
  const schemaClient = {
    rpc(name, args) {
      calls.push({ rpc: name, args });
      return Promise.resolve(queue.shift() ?? { data: null, error: null });
    },
    from(table) {
      calls.push({ table });
      throw new Error(`unexpected table query: ${table}`);
    }
  };
  return { calls, schema: () => schemaClient };
}

function metadataClient() {
  const calls = [];
  const schemaClient = {
    from(table) {
      const call = { table, operations: [] };
      calls.push(call);
      const builder = new Proxy({}, {
        get(_target, property) {
          if (property === 'then') {
            return (resolve, reject) => Promise.resolve({
              data: table === 'users' ? [{ id: 'user-id' }] : [],
              error: null
            }).then(resolve, reject);
          }
          return (...args) => {
            call.operations.push([property, ...args]);
            if (property === 'maybeSingle') return Promise.resolve({ data: { id: 'user-id' }, error: null });
            return builder;
          };
        }
      });
      return builder;
    }
  };
  return { calls, schema: () => schemaClient };
}

const row = {
  id: '00000000-0000-4000-8000-000000000001',
  allocation_key: 'payment-1:api_reserve:polza',
  payment_id: 'payment-1',
  provider: 'polza',
  amount_kopecks: 10_000,
  currency: 'RUB',
  status: 'processing',
  attempt_count: 1,
  claim_token: '00000000-0000-4000-8000-000000000002',
  lease_until: '2026-08-07T05:00:00.000Z',
  external_id: null,
  observed_transaction_id: null,
  observed_amount_kopecks: null,
  observed_balance_kopecks: null,
  observed_at: null,
  error_code: null
};

test('Supabase repository claims provider topups with bounded leases and attempts', async () => {
  const client = scriptedClient([{ data: [row], error: null }]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const claimed = await repository.claimProviderTopupRequests({
    provider: 'polza',
    limit: 5,
    leaseSeconds: 300,
    maxAttempts: 5
  });

  assert.deepEqual(claimed, [{
    id: row.id,
    allocationKey: row.allocation_key,
    paymentId: row.payment_id,
    provider: row.provider,
    amountKopecks: 10_000,
    currency: 'RUB',
    status: 'processing',
    attemptCount: 1,
    claimToken: row.claim_token,
    leaseUntil: row.lease_until,
    externalId: null,
    observedTransactionId: null,
    observedAmountKopecks: null,
    observedBalanceKopecks: null,
    observedAt: null,
    errorCode: null
  }]);
  assert.deepEqual(client.calls[0], {
    rpc: 'claim_provider_topup_requests',
    args: { p_provider: 'polza', p_limit: 5, p_lease_seconds: 300, p_max_attempts: 5 }
  });
});

test('Supabase repository marks a provider charge as started before opening the checkout', async () => {
  const row = {
    id: '3f4e9c1b-4d8f-4d78-9d1e-6a57f6f72c8a',
    claim_token: '7b5c3d32-8c8f-4f41-9b4b-75dba6f33e21'
  };
  const client = scriptedClient([{ data: true, error: null }]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  assert.equal(await repository.markProviderTopupChargeStarted({
    id: row.id,
    claimToken: row.claim_token,
    idempotencyKey: 'provider-topup:polza:payment-1:reserve',
    metadata: { worker: 'provider_funding' }
  }), true);
  assert.deepEqual(client.calls[0], {
    rpc: 'mark_provider_topup_charge_started',
    args: {
      p_id: row.id,
      p_claim_token: row.claim_token,
      p_idempotency_key: 'provider-topup:polza:payment-1:reserve',
      p_metadata: { worker: 'provider_funding' }
    }
  });
});

test('Supabase repository records verified observations and fail-closed errors through RPCs', async () => {
  const client = scriptedClient([
    { data: true, error: null },
    { data: true, error: null },
    { data: row, error: null }
  ]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  assert.equal(await repository.markProviderTopupSucceeded({
    id: row.id,
    claimToken: row.claim_token,
    externalId: 'tx-1',
    observedTransactionId: 'tx-1',
    observedAmountKopecks: 10_000,
    observedBalanceKopecks: 25_000,
    metadata: { verification: 'transaction_and_balance' }
  }), true);
  assert.equal(await repository.markProviderTopupFailed({
    id: row.id,
    claimToken: row.claim_token,
    errorCode: 'verification_failed',
    retryable: false,
    metadata: { safe: true }
  }), true);
  const request = await repository.getProviderTopupRequest({
    allocationKey: row.allocation_key,
    paymentId: row.payment_id,
    provider: row.provider
  });

  assert.equal(request.status, 'processing');
  assert.deepEqual(client.calls.map(({ rpc }) => rpc), [
    'complete_provider_topup_request',
    'fail_provider_topup_request',
    'get_provider_topup_request'
  ]);
  assert.equal(client.calls[0].args.p_observed_amount_kopecks, 10_000);
  assert.equal(client.calls[1].args.p_retryable, false);
});

test('finance metadata for test tariffs stays on the allocation until YooKassa confirms it', async () => {
  const client = metadataClient();
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  await repository.recordFinanceAllocations({
    externalPaymentId: 'payment-test-1',
    telegramUserId: '10',
    autoTopUp: true,
    metadata: {
      testOnly: true,
      targetProvider: 'polza',
      targetProviderTopupKopecks: 10_000
    },
    allocations: [{
      allocationKey: 'payment-test-1:api_reserve:polza',
      category: 'api_reserve',
      provider: 'polza',
      amountKopecks: 10_000,
      currency: 'RUB',
      status: 'reserved',
      source: 'test_tariff_payment_webhook'
    }]
  });

  assert.equal(client.calls.some(({ table }) => table === 'provider_topup_requests'), false);
  const allocationCall = client.calls.find(({ table }) => table === 'finance_allocations');
  const row = allocationCall.operations.find(([name]) => name === 'upsert')[1][0];
  assert.equal(row.metadata.testOnly, true);
  assert.equal(row.metadata.targetProvider, 'polza');
  assert.equal(row.metadata.targetProviderTopupKopecks, 10_000);
});

test('Supabase repository confirms YooKassa through the DB gate', async () => {
  const client = scriptedClient([{
    data: [{
      confirmation_id: '00000000-0000-4000-8000-000000000003',
      duplicate: false,
      payment_id: 'payment-1',
      provider_reserve_kopecks: 10_000,
      topup_count: 1,
      status: 'succeeded'
    }],
    error: null
  }]);
  const repository = new SupabaseHistoryRepository({ client, schema: 'neuro' });

  const result = await repository.recordYooKassaPaymentConfirmation({
    externalEventId: 'payment.succeeded:payment-1',
    paymentId: 'payment-1',
    amountKopecks: 14_000,
    confirmedAt: '2026-08-07T00:00:00.000Z',
    metadata: { testOnly: true }
  });

  assert.equal(result.topupCount, 1);
  assert.deepEqual(client.calls[0], {
    rpc: 'record_yookassa_payment_confirmation',
    args: {
      p_external_event_id: 'payment.succeeded:payment-1',
      p_payment_id: 'payment-1',
      p_amount_kopecks: 14_000,
      p_currency: 'RUB',
      p_event: 'payment.succeeded',
      p_confirmed_at: '2026-08-07T00:00:00.000Z',
      p_metadata: { testOnly: true }
    }
  });
});
