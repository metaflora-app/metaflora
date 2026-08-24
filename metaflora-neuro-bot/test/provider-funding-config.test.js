import assert from 'node:assert/strict';
import test from 'node:test';

import { createDirectChargeContract } from '../src/provider-funding-config.js';

test('direct charge contract renders only explicit funding placeholders', () => {
  const contract = createDirectChargeContract({
    toolName: 'charge_card',
    argumentsTemplate: {
      amount: '${amount_rubles}',
      amount_kopecks: '${amount_kopecks}',
      currency: '${currency}',
      idempotency_key: '${idempotency_key}',
      note: 'Metaflora ${payment_id}'
    }
  });

  assert.deepEqual(contract.buildArguments({
    provider: 'polza',
    allocationKey: 'payment-1:api_reserve:polza',
    paymentId: 'payment-1',
    amountKopecks: 10_000,
    currency: 'RUB',
    idempotencyKey: 'provider-topup:polza:payment-1:allocation'
  }), {
    amount: '100.00',
    amount_kopecks: 10_000,
    currency: 'RUB',
    idempotency_key: 'provider-topup:polza:payment-1:allocation',
    note: 'Metaflora payment-1'
  });
});

test('direct charge contract reports whether it can carry the billing amount', () => {
  const fixedAmount = createDirectChargeContract({
    toolName: 'charge_from_card',
    argumentsTemplate: {
      idempotencyKey: '${idempotency_key}',
      confirm: true
    }
  });
  const customAmount = createDirectChargeContract({
    toolName: 'charge_card',
    argumentsTemplate: {
      amount: '${amount_rubles}',
      currency: '${currency}',
      idempotencyKey: '${idempotency_key}'
    }
  });

  assert.equal(fixedAmount.supportsCustomAmount, false);
  assert.equal(customAmount.supportsCustomAmount, true);
});

test('direct charge contract fails closed for an unknown or unresolved placeholder', () => {
  assert.equal(createDirectChargeContract({}), null);
  assert.throws(
    () => createDirectChargeContract({
      toolName: 'charge_card',
      argumentsTemplate: { amount: '${unapproved_secret}' }
    }).buildArguments({
      provider: 'polza',
      allocationKey: 'allocation-1',
      paymentId: 'payment-1',
      amountKopecks: 100,
      currency: 'RUB',
      idempotencyKey: 'key'
    }),
    /placeholder/i
  );
  assert.throws(
    () => createDirectChargeContract({
      toolName: 'charge_card',
      argumentsTemplate: { amount: '${unapproved_secret1}' }
    }).buildArguments({
      provider: 'polza',
      allocationKey: 'allocation-1',
      paymentId: 'payment-1',
      amountKopecks: 100,
      currency: 'RUB',
      idempotencyKey: 'key'
    }),
    /placeholder/i
  );
});
