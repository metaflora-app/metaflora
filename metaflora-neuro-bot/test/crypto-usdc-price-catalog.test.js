import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { METACOIN_PACKAGES, SUBSCRIPTION_PLANS } from '../src/billing-catalog.js';
import { FINANCE_POLICY } from '../src/finance-policy.js';

function examplePrices() {
  const source = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  const line = source.split(/\r?\n/u).find((entry) => entry.startsWith('CRYPTO_USDC_PRICES_JSON='));
  assert.ok(line, 'CRYPTO_USDC_PRICES_JSON must be documented');
  return JSON.parse(line.slice('CRYPTO_USDC_PRICES_JSON='.length));
}

const APPROVED_GROSS_USDC_MICROS = Object.freeze({
  'plan:amateur:1': 8_320_000,
  'plan:author:1': 16_560_000,
  'plan:researcher:1': 27_670_000,
  'plan:expert:1': 44_330_000,
  'plan:amateur:3': 21_220_000,
  'plan:author:3': 42_220_000,
  'plan:researcher:3': 70_560_000,
  'plan:expert:3': 113_060_000,
  'package:coins_150': 6_100_000,
  'package:coins_400': 14_330_000,
  'package:coins_1000': 33_220_000,
  'package:coins_2500': 77_670_000
});

test('the documented USDC catalog covers every production plan and package', () => {
  const prices = examplePrices();
  const expected = [
    ...SUBSCRIPTION_PLANS.filter((plan) => plan.priceKopecks > 0 && plan.id !== 'ultimate_test')
      .flatMap((plan) => plan.durationMonths.map((months) => `plan:${plan.id}:${months}`)),
    ...METACOIN_PACKAGES.map((item) => `package:${item.id}`)
  ].sort();
  assert.deepEqual(Object.keys(prices).sort(), expected);
  assert.deepEqual(
    Object.fromEntries(Object.entries(prices).map(([key, value]) => [key, value.amountUsdcMicros])),
    APPROVED_GROSS_USDC_MICROS
  );
});

test('every documented USDC quote has an exact non-negative split', () => {
  for (const [key, value] of Object.entries(examplePrices())) {
    assert.equal(value.amountUsdcMicros % 10_000, 0, `${key}: gross must be cent-aligned`);
    assert.ok(value.openrouterCreditMicrousd >= 5_000_000, `${key}: OpenRouter credit minimum`);
    assert.ok(value.openrouterUsdcMicros >= 5_250_000, `${key}: OpenRouter funding minimum`);
    assert.ok(value.gasReserveUsdcMicros >= 10_000, `${key}: gas reserve minimum`);
    assert.ok(value.ownerUsdcMicros >= 0, `${key}: owner share must not be negative`);
    assert.equal(
      value.openrouterUsdcMicros + value.gasReserveUsdcMicros + value.ownerUsdcMicros,
      value.amountUsdcMicros,
      `${key}: split must equal gross`
    );
  }
});

test('every USDC quote funds OpenRouter immediately and preserves the production economics', () => {
  const minimumFundingExceptions = new Set(['plan:amateur:1', 'package:coins_150']);
  for (const [key, value] of Object.entries(examplePrices())) {
    const expectedOpenRouter = Math.max(
      5_250_000,
      Math.round(value.amountUsdcMicros * FINANCE_POLICY.routeraiReservePercent / 100 / 10_000) * 10_000
    );
    const expectedFee = Math.round(
      value.amountUsdcMicros * FINANCE_POLICY.paymentFeePercent / 100 / 10_000
    ) * 10_000;
    const polzaReserve = Math.round(
      value.amountUsdcMicros * FINANCE_POLICY.polzaReservePercent / 100 / 10_000
    ) * 10_000;
    const minimumOwner = Math.floor(
      value.amountUsdcMicros * FINANCE_POLICY.targetGrossMarginPercent / 100 / 10_000
    ) * 10_000;

    assert.equal(value.openrouterUsdcMicros, expectedOpenRouter, `${key}: OpenRouter share`);
    assert.equal(value.gasReserveUsdcMicros, expectedFee, `${key}: payment/gas reserve`);
    if (minimumFundingExceptions.has(key)) {
      assert.equal(value.openrouterUsdcMicros, 5_250_000, `${key}: exact OpenRouter minimum`);
      assert.ok(value.ownerUsdcMicros >= 0, `${key}: residual owner allocation`);
    } else {
      assert.ok(
        value.ownerUsdcMicros - polzaReserve >= minimumOwner,
        `${key}: owner share after the 6% Polza reserve must preserve 40%`
      );
    }
  }
});
