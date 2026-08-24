import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createOwnerMarginPayoutService,
  ownerMarginPayoutIdempotencyKey
} from '../src/owner-margin-payout-service.js';

const OWNER_PAYOUT_TOKEN = 'synonym.token-1234567890';

function payoutInput(overrides = {}) {
  return {
    paymentId: 'payment-1',
    ownerShareKopecks: 12_500,
    ...overrides
  };
}

test('disabled owner payouts are queued and never call the payout client', async () => {
  const calls = [];
  const service = createOwnerMarginPayoutService({
    client: {
      async createPayout(value) {
        calls.push(['create', value]);
      },
      async getPayout(value) {
        calls.push(['get', value]);
      }
    },
    ownerPayoutToken: OWNER_PAYOUT_TOKEN
  });

  const result = await service.processOwnerMarginPayout(payoutInput());

  assert.equal(result.status, 'queued');
  assert.equal(result.reason, 'disabled');
  assert.equal(result.paymentId, 'payment-1');
  assert.equal(result.ownerShareKopecks, 12_500);
  assert.equal(result.idempotencyKey, ownerMarginPayoutIdempotencyKey('payment-1'));
  assert.deepEqual(calls, []);
});

test('owner payout creates one idempotent card payout and polls instead of posting again', async () => {
  const calls = [];
  const service = createOwnerMarginPayoutService({
    enabled: true,
    client: {
      async createPayout(value) {
        calls.push(['create', value]);
        return {
          id: 'owner-payout-1',
          status: 'pending',
          amount: { value: '125.00', currency: 'RUB' }
        };
      },
      async getPayout(value) {
        calls.push(['get', value]);
        return {
          id: value,
          status: 'pending',
          amount: { value: '125.00', currency: 'RUB' }
        };
      }
    },
    ownerPayoutToken: OWNER_PAYOUT_TOKEN
  });

  const submitted = await service.processOwnerMarginPayout(payoutInput());
  const pending = await service.processOwnerMarginPayout(payoutInput());

  assert.equal(submitted.status, 'submitted');
  assert.equal(submitted.externalPayoutId, 'owner-payout-1');
  assert.equal(pending.status, 'pending');
  assert.equal(pending.externalPayoutId, 'owner-payout-1');
  assert.equal(calls.filter(([kind]) => kind === 'create').length, 1);
  assert.deepEqual(calls.map(([kind]) => kind), ['create', 'get']);
  assert.deepEqual(calls[0][1], {
    idempotenceKey: ownerMarginPayoutIdempotencyKey('payment-1'),
    amountKopecks: 12_500,
    method: 'bank_card',
    payoutToken: OWNER_PAYOUT_TOKEN,
    description: 'доля владельца',
    metadata: {
      paymentId: 'payment-1',
      payoutType: 'owner_margin'
    }
  });
});

test('owner payout reaches succeeded only after a successful provider status', async () => {
  let pollCount = 0;
  const service = createOwnerMarginPayoutService({
    enabled: true,
    client: {
      async createPayout() {
        return {
          id: 'owner-payout-2',
          status: 'pending',
          amount: { value: '125.00', currency: 'RUB' }
        };
      },
      async getPayout(id) {
        pollCount += 1;
        return {
          id,
          status: 'succeeded',
          amount: { value: '125.00', currency: 'RUB' }
        };
      }
    },
    ownerPayoutToken: OWNER_PAYOUT_TOKEN
  });

  await service.processOwnerMarginPayout(payoutInput());
  const result = await service.processOwnerMarginPayout(payoutInput());

  assert.equal(result.status, 'succeeded');
  assert.equal(result.externalPayoutId, 'owner-payout-2');
  assert.equal(pollCount, 1);
});

test('owner payout returns failed on a provider error and never fabricates success', async () => {
  let createCalls = 0;
  const service = createOwnerMarginPayoutService({
    enabled: true,
    client: {
      async createPayout() {
        createCalls += 1;
        throw new Error('provider detail must not be returned');
      },
      async getPayout() {
        throw new Error('must not poll without a provider payout id');
      }
    },
    ownerPayoutToken: OWNER_PAYOUT_TOKEN
  });

  const result = await service.processOwnerMarginPayout(payoutInput());

  assert.equal(result.status, 'failed');
  assert.equal(result.errorCode, 'provider_error');
  assert.equal(result.externalPayoutId, null);
  assert.equal(createCalls, 1);
  assert.doesNotMatch(JSON.stringify(result), /provider detail|synonym\.token/u);
});

test('owner payout polls a persisted provider id without a second create or a token', async () => {
  const calls = [];
  const service = createOwnerMarginPayoutService({
    enabled: true,
    client: {
      async createPayout(value) {
        calls.push(['create', value]);
        throw new Error('must not create when payout id is already known');
      },
      async getPayout(value) {
        calls.push(['get', value]);
        return {
          id: value,
          status: 'pending',
          amount: { value: '125.00', currency: 'RUB' }
        };
      }
    }
  });

  const result = await service.processOwnerMarginPayout({
    ...payoutInput(),
    externalPayoutId: 'owner-payout-persisted'
  });

  assert.equal(result.status, 'pending');
  assert.equal(result.externalPayoutId, 'owner-payout-persisted');
  assert.deepEqual(calls.map(([kind]) => kind), ['get']);
});

test('owner payout validates amount and card token before contacting the provider', async () => {
  const calls = [];
  const client = {
    async createPayout(value) {
      calls.push(['create', value]);
    },
    async getPayout(value) {
      calls.push(['get', value]);
    }
  };

  const invalidAmountService = createOwnerMarginPayoutService({
    enabled: true,
    client,
    ownerPayoutToken: OWNER_PAYOUT_TOKEN
  });
  await assert.rejects(
    () => invalidAmountService.processOwnerMarginPayout(payoutInput({ ownerShareKopecks: 0 })),
    /owner share amount/i
  );

  const invalidTokenService = createOwnerMarginPayoutService({
    enabled: true,
    client,
    ownerPayoutToken: 'too-short'
  });
  await assert.rejects(
    () => invalidTokenService.processOwnerMarginPayout(payoutInput()),
    /owner payout token/i
  );

  assert.deepEqual(calls, []);
});

test('enabled owner payouts fail closed when the client or owner token is missing', async () => {
  const clientWithoutTokenCalls = [];
  const withoutToken = createOwnerMarginPayoutService({
    enabled: true,
    client: {
      async createPayout(value) {
        clientWithoutTokenCalls.push(value);
      }
    }
  });
  const tokenMissingResult = await withoutToken.processOwnerMarginPayout(payoutInput());

  const withoutClient = createOwnerMarginPayoutService({
    enabled: true,
    ownerPayoutToken: OWNER_PAYOUT_TOKEN
  });
  const clientMissingResult = await withoutClient.processOwnerMarginPayout(payoutInput({ paymentId: 'payment-2' }));

  assert.equal(tokenMissingResult.status, 'failed');
  assert.equal(tokenMissingResult.errorCode, 'not_configured');
  assert.equal(clientMissingResult.status, 'failed');
  assert.equal(clientMissingResult.errorCode, 'not_configured');
  assert.deepEqual(clientWithoutTokenCalls, []);
});
