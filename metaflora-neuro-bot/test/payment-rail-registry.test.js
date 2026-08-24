import assert from 'node:assert/strict';
import test from 'node:test';

import { createPaymentRailRegistry } from '../src/payment-rail-registry.js';

test('payment rail registry keeps SBP and USDC services separate', () => {
  const sbp = Object.freeze({ createCheckout() {} });
  const crypto = Object.freeze({ createCheckout() {} });
  const registry = createPaymentRailRegistry({ sbp, cryptoUsdc: crypto });

  assert.equal(registry.get('sbp'), sbp);
  assert.equal(registry.get('crypto_usdc'), crypto);
  assert.deepEqual(registry.enabledMethods(), ['sbp', 'crypto_usdc']);
  assert.equal(registry.get('rub'), null);
});

test('payment rail registry omits unconfigured rails', () => {
  const sbp = Object.freeze({ createCheckout() {} });
  const registry = createPaymentRailRegistry({ sbp });

  assert.deepEqual(registry.enabledMethods(), ['sbp']);
  assert.equal(registry.get('crypto_usdc'), null);
});

test('payment rail registry hides a rail when the selected product has no price', () => {
  const registry = createPaymentRailRegistry({
    sbp: { createCheckout() {} },
    cryptoUsdc: { createCheckout() {}, supportsCheckout: ({ productId }) => productId === 'coins_150' }
  });

  assert.deepEqual(registry.enabledMethods({ productId: 'coins_150' }), ['sbp', 'crypto_usdc']);
  assert.deepEqual(registry.enabledMethods({ productId: 'coins_400' }), ['sbp']);
});
