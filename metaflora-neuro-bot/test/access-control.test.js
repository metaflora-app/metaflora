import test from 'node:test';
import assert from 'node:assert/strict';

import { decideModelAccess } from '../src/access-control.js';

const FREE_MODELS = Object.freeze(['gpt_oss_20b_free']);
const NOW = '2026-07-25T12:00:00.000Z';

function account(overrides = {}) {
  return Object.freeze({
    subscriptionPlanId: 'newcomer',
    subscriptionExpiresAt: null,
    metacoinBalance: 0,
    ...overrides
  });
}

test('newcomer can use only an explicitly allowlisted free model', () => {
  assert.deepEqual(decideModelAccess({
    account: account(),
    modelId: 'gpt_oss_20b_free',
    priceMetacoins: 0,
    freeModelIds: FREE_MODELS,
    now: NOW
  }), {
    allowed: true,
    reason: null,
    debitMetacoins: 0
  });

  assert.deepEqual(decideModelAccess({
    account: account({ metacoinBalance: 100 }),
    modelId: 'another_zero_price_model',
    priceMetacoins: 0,
    freeModelIds: FREE_MODELS,
    now: NOW
  }), {
    allowed: false,
    reason: 'tariff_required',
    debitMetacoins: 0
  });
});

test('newcomer cannot buy access to a paid model from a package balance', () => {
  assert.deepEqual(decideModelAccess({
    account: account({ metacoinBalance: 100 }),
    modelId: 'paid_model',
    priceMetacoins: 7,
    freeModelIds: FREE_MODELS,
    now: NOW
  }), {
    allowed: false,
    reason: 'tariff_required',
    debitMetacoins: 7
  });
});

test('unknown subscription plan does not grant paid access', () => {
  assert.deepEqual(decideModelAccess({
    account: account({
      subscriptionPlanId: 'removed_plan',
      subscriptionExpiresAt: '2026-07-26T12:00:00.000Z',
      metacoinBalance: 100
    }),
    modelId: 'paid_model',
    priceMetacoins: 7,
    freeModelIds: FREE_MODELS,
    now: NOW
  }), {
    allowed: false,
    reason: 'tariff_required',
    debitMetacoins: 7
  });
});

test('expired paid tariff is rejected before checking its balance', () => {
  assert.deepEqual(decideModelAccess({
    account: account({
      subscriptionPlanId: 'author',
      subscriptionExpiresAt: NOW,
      metacoinBalance: 100
    }),
    modelId: 'paid_model',
    priceMetacoins: 7,
    freeModelIds: FREE_MODELS,
    now: NOW
  }), {
    allowed: false,
    reason: 'tariff_expired',
    debitMetacoins: 7
  });
});

test('active tariff requires enough metacoins and preserves the exact calculated price', () => {
  const activeAccount = account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-07-26T12:00:00.000Z',
    metacoinBalance: 6
  });

  assert.deepEqual(decideModelAccess({
    account: activeAccount,
    modelId: 'paid_model',
    priceMetacoins: 7,
    freeModelIds: FREE_MODELS,
    now: NOW
  }), {
    allowed: false,
    reason: 'insufficient_metacoins',
    debitMetacoins: 7
  });

  assert.deepEqual(decideModelAccess({
    account: { ...activeAccount, metacoinBalance: 7 },
    modelId: 'paid_model',
    priceMetacoins: 7,
    freeModelIds: FREE_MODELS,
    now: NOW
  }), {
    allowed: true,
    reason: null,
    debitMetacoins: 7
  });
});

test('access decision validates exact prices instead of rounding them', () => {
  assert.throws(() => decideModelAccess({
    account: account(),
    modelId: 'paid_model',
    priceMetacoins: 1.5,
    freeModelIds: FREE_MODELS,
    now: NOW
  }), /non-negative safe integer/i);
});
