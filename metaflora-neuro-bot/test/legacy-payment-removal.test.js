import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getPurchasableSubscriptionPlans,
  getSubscriptionPlan
} from '../src/billing-catalog.js';
import {
  buildBalanceHomeMessage,
  buildInvoicePlaceholderMessage,
  buildMetacoinPackagesMessage,
  buildPlanDetailsMessage,
  buildPlansMessage
} from '../src/billing-ui.js';
import { loadConfig } from '../src/config.js';

const account = Object.freeze({
  subscriptionPlanId: 'newcomer',
  subscriptionExpiresAt: null,
  subscriptionMetacoinsRemaining: 0,
  subscriptionMetacoinsTotal: 0,
  metacoinBalance: 0
});

function serialized(message) {
  return JSON.stringify(message);
}

test('legacy test tariffs stay unreachable even when the former flag is supplied', () => {
  const formerEnvironment = { TEST_TARIFF_ENABLED: 'true' };
  const removedIds = ['test_140', 'test_110', 'final_test_130'];

  assert.deepEqual(
    getPurchasableSubscriptionPlans(formerEnvironment).map(({ id }) => id),
    ['newcomer', 'amateur', 'author', 'researcher', 'expert']
  );
  for (const id of removedIds) assert.equal(getSubscriptionPlan(id, formerEnvironment), null);
});

test('runtime configuration no longer exposes legacy test tariffs or Telegram Stars', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    TEST_TARIFF_ENABLED: 'true',
    TELEGRAM_STARS_ENABLED: 'true',
    TELEGRAM_STARS_CATALOG_JSON: JSON.stringify({
      plans: { amateur: { oneMonth: 1, threeMonths: 2 } },
      packages: {}
    })
  });

  assert.equal('testTariff' in config, false);
  assert.equal('testTariffs' in config, false);
  assert.equal('telegramStars' in config, false);
});

test('customer billing UI exposes only RUB/SBP prices and callback routes', () => {
  const messages = [
    buildBalanceHomeMessage(account),
    buildPlansMessage(account),
    buildPlanDetailsMessage('amateur', account),
    buildMetacoinPackagesMessage(),
    buildInvoicePlaceholderMessage({
      kind: 'plan',
      productId: 'amateur',
      durationMonths: 1,
      account,
      origin: 'profile'
    })
  ];

  for (const message of messages) {
    assert.doesNotMatch(serialized(message), /Telegram Stars|billing:stars|\bXTR\b/iu);
  }
});

test('crypto payment button appears only when the crypto rail is configured', () => {
  const disabled = buildInvoicePlaceholderMessage({
    kind: 'package', productId: 'coins_150', account, origin: 'balance'
  });
  const enabled = buildInvoicePlaceholderMessage({
    kind: 'package', productId: 'coins_150', account, origin: 'balance',
    paymentMethods: ['sbp', 'crypto_usdc']
  });

  assert.doesNotMatch(serialized(disabled), /оплата криптовалютой/iu);
  assert.match(serialized(enabled), /оплата криптовалютой/iu);
  assert.match(serialized(enabled), /billing:checkout:crypto_usdc:package:coins_150/iu);
});

test('crypto-only invoice does not render a dead SBP button', () => {
  const message = buildInvoicePlaceholderMessage({
    kind: 'package', productId: 'coins_150', account, origin: 'balance',
    paymentMethods: ['crypto_usdc']
  });
  const serializedMessage = serialized(message);

  assert.match(serializedMessage, /оплата криптовалютой/iu);
  assert.doesNotMatch(serializedMessage, /оплатить по СБП/iu);
});
