import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFinanceAllocations,
  summarizeFinanceAllocations
} from '../src/finance-ledger.js';
import {
  FINANCE_POLICY,
  providerBudgetPercent,
  providerLiabilityRublesForMetacoins
} from '../src/finance-policy.js';
import { minimumTariffRublesPerMetacoin } from '../src/model-pricing.js';
import {
  getSubscriptionOffer,
  METACOIN_PACKAGES,
  SUBSCRIPTION_PLANS
} from '../src/billing-catalog.js';

test('production finance policy is the immutable 50.5/6/3.5/40 split', () => {
  assert.deepEqual({
    routerai: FINANCE_POLICY.routeraiReservePercent,
    polza: FINANCE_POLICY.polzaReservePercent,
    fee: FINANCE_POLICY.paymentFeePercent,
    owner: FINANCE_POLICY.targetGrossMarginPercent
  }, { routerai: 50.5, polza: 6, fee: 3.5, owner: 40 });
  assert.equal(FINANCE_POLICY.apiReservePercent, 56.5);
  assert.equal(providerBudgetPercent(), 56.5);
});

test('every RouterAI-funded product carries a two-percent provider tail above its base capacity', () => {
  const products = [
    ...METACOIN_PACKAGES.map(({ id, priceKopecks, metacoins }) => ({
      id: `package:${id}`,
      priceKopecks,
      metacoins
    })),
    ...SUBSCRIPTION_PLANS
      .filter(({ priceKopecks }) => priceKopecks > 0)
      .flatMap(({ id }) => [1, 3].map((months) => ({
        id: `plan:${id}:${months}`,
        ...getSubscriptionOffer(id, months)
      })))
  ];

  assert.equal(FINANCE_POLICY.failoverReservePercent, 2);
  for (const product of products) {
    const liability = providerLiabilityRublesForMetacoins({
      metacoins: product.metacoins,
      minimumTariffRublesPerMetacoin: minimumTariffRublesPerMetacoin()
    });
    assert.ok(
      liability.total >= liability.primary * 1.02,
      `${product.id}: RouterAI tail must cover at least two percent`
    );
    assert.ok(liability.buffer > 0, `${product.id}: RouterAI tail must be explicit`);
  }
});

test('every package and one/three-month offer fully covers worst-case RouterAI liability', () => {
  const products = [
    ...METACOIN_PACKAGES.map(({ id, priceKopecks, metacoins }) => ({ id: `package:${id}`, priceKopecks, metacoins })),
    ...SUBSCRIPTION_PLANS
      .filter(({ priceKopecks }) => priceKopecks > 0)
      .flatMap(({ id }) => [1, 3].map((months) => {
        const offer = getSubscriptionOffer(id, months);
        return { id: `plan:${id}:${months}`, ...offer };
      }))
  ];
  for (const product of products) {
    const allocations = createFinanceAllocations({
      externalPaymentId: `solvency:${product.id}`,
      amountKopecks: product.priceKopecks,
      metacoinsGranted: product.metacoins,
      enforceExactGrossMargin: true
    });
    const byProvider = Object.fromEntries(allocations
      .filter(({ category }) => category === 'api_reserve')
      .map(({ provider, amountKopecks }) => [provider, amountKopecks]));
    const summary = summarizeFinanceAllocations(allocations);
    const maximumLiability = Math.ceil(
      product.metacoins * minimumTariffRublesPerMetacoin()
        * FINANCE_POLICY.routeraiReservePercent / 100
    );

    assert.ok(byProvider.routerai >= maximumLiability, `${product.id}: RouterAI liability`);
    assert.ok(byProvider.routerai >= 10_000, `${product.id}: RouterAI minimum`);
    assert.equal(byProvider.polza, Math.ceil(product.priceKopecks * 0.06), `${product.id}: Polza`);
    assert.ok(summary.ownerShare >= Math.floor(product.priceKopecks * 0.40) - 2, `${product.id}: owner`);
    assert.equal(
      summary.gross - summary.paymentFee - summary.referralLiability - summary.apiReserve - summary.ownerShare,
      0,
      `${product.id}: reconciliation`
    );
  }
});

test('production allocation rounds provider reserves upward and fails closed below RouterAI minimum', () => {
  const allocations = createFinanceAllocations({
    externalPaymentId: 'rounding-policy',
    amountKopecks: 44_900,
    metacoinsGranted: 130,
    enforceExactGrossMargin: true
  });
  const byProvider = Object.fromEntries(allocations
    .filter(({ category }) => category === 'api_reserve')
    .map(({ provider, amountKopecks }) => [provider, amountKopecks]));
  assert.deepEqual(byProvider, { polza: 2_694, routerai: 22_675 });
  assert.throws(() => createFinanceAllocations({
    externalPaymentId: 'below-router-minimum',
    amountKopecks: 10_000,
    metacoinsGranted: 1,
    enforceExactGrossMargin: true
  }), /Provider minimum/i);
});

test('finance allocations reconcile a payment into API reserve, referral liability and owner share', () => {
  const allocations = createFinanceAllocations({
    externalPaymentId: 'pay-100',
    amountKopecks: 100_000,
    referralEarningKopecks: 25_000,
    providerWeights: { polza: 1, gptunnel: 1 }
  });

  assert.deepEqual(
    allocations.map(({ category, provider, amountKopecks }) => ({
      category,
      provider: provider ?? null,
      amountKopecks
    })),
    [
      { category: 'gross', provider: null, amountKopecks: 100_000 },
      { category: 'payment_fee', provider: null, amountKopecks: 3_500 },
      { category: 'referral_liability', provider: null, amountKopecks: 25_000 },
      { category: 'api_reserve', provider: 'polza', amountKopecks: 28_250 },
      { category: 'api_reserve', provider: 'routerai', amountKopecks: 28_250 },
      { category: 'owner_share', provider: null, amountKopecks: 15_000 }
    ]
  );
  assert.deepEqual(summarizeFinanceAllocations(allocations), {
    gross: 100_000,
    paymentFee: 3_500,
    referralLiability: 25_000,
    apiReserve: 56_500,
    ownerShare: 15_000,
    grossMargin: 40_000,
    grossMarginPercent: 40
  });
  assert.equal(allocations.find(({ category }) => category === 'payment_fee').status, 'estimated');
  assert.equal(new Set(allocations.map(({ allocationKey }) => allocationKey)).size, allocations.length);
});

test('the policy keeps the combined provider budget and dedicates liability to RouterAI', () => {
  assert.equal(providerBudgetPercent(), 56.5);
  assert.deepEqual(FINANCE_POLICY.providerWeights, { polza: 60, routerai: 505 });
  const liability = providerLiabilityRublesForMetacoins({
    metacoins: 3_900,
    minimumTariffRublesPerMetacoin: minimumTariffRublesPerMetacoin()
  });
  assert.equal(liability.total, liability.primary + liability.buffer);
  assert.ok(liability.total >= liability.primary * 1.02);
  assert.ok(liability.buffer > 0);
  assert.equal(liability.fallback, 0);
});

test('product-aware allocation keeps the combined provider budget and RouterAI 100-ruble floor', () => {
  const allocations = createFinanceAllocations({
    externalPaymentId: 'amateur-product-aware',
    amountKopecks: 44_900,
    metacoinsGranted: 130,
    enforceExactGrossMargin: true
  });
  const byProvider = Object.fromEntries(allocations
    .filter(({ category }) => category === 'api_reserve')
    .map(({ provider, amountKopecks }) => [provider, amountKopecks]));

  assert.deepEqual(byProvider, { polza: 2_694, routerai: 22_675 });
  assert.equal(summarizeFinanceAllocations(allocations).ownerShare, 17_959);
});

test('product-aware allocation gives RouterAI the remainder of the combined provider budget', () => {
  const allocations = createFinanceAllocations({
    externalPaymentId: 'package-product-aware',
    amountKopecks: 129_000,
    metacoinsGranted: 400,
    enforceExactGrossMargin: true
  });
  const byProvider = Object.fromEntries(allocations
    .filter(({ category }) => category === 'api_reserve')
    .map(({ provider, amountKopecks }) => [provider, amountKopecks]));

  assert.equal(byProvider.polza, 7_740);
  assert.equal(byProvider.routerai, 65_145);
  assert.equal(summarizeFinanceAllocations(allocations).ownerShare, 51_600);
});

test('a small plan upgrade reduces only the owner share to fund Polza liability and RouterAI immediate minimum', () => {
  const allocations = createFinanceAllocations({
    externalPaymentId: 'upgrade-amateur-author',
    amountKopecks: 85_600,
    metacoinsGranted: 170,
    enforceExactGrossMargin: true,
    providerMinimumsKopecks: { routerai: 10_000 },
    allowOwnerShareForProviderMinimums: true
  });
  const byProvider = Object.fromEntries(
    allocations
      .filter(({ category }) => category === 'api_reserve')
      .map(({ provider, amountKopecks }) => [provider, amountKopecks])
  );
  const summary = summarizeFinanceAllocations(allocations);

  assert.deepEqual(byProvider, { polza: 5_136, routerai: 43_228 });
  assert.equal(summary.ownerShare, 34_240);
  assert.equal(summary.paymentFee, 2_996);
});

test('an insolvent tiny upgrade fails closed instead of underfunding either provider', () => {
  assert.throws(() => createFinanceAllocations({
    externalPaymentId: 'upgrade-tiny', amountKopecks: 10_000,
    metacoinsGranted: 300, enforceExactGrossMargin: true,
    providerMinimumsKopecks: { routerai: 10_000 },
    allowOwnerShareForProviderMinimums: true
  }), /negative owner share/i);
});

test('an upgrade may add an explicitly carried immutable reserve to owner share', () => {
  const allocations = createFinanceAllocations({
    externalPaymentId: 'upgrade-quarter-full-remainder',
    amountKopecks: 189_000,
    metacoinsGranted: 510,
    enforceExactGrossMargin: true,
    providerMinimumsKopecks: { routerai: 10_000 },
    allowOwnerShareForProviderMinimums: true,
    reserveCarryInKopecks: 12_588
  });
  const byProvider = Object.fromEntries(allocations
    .filter(({ category }) => category === 'api_reserve')
    .map(({ provider, amountKopecks }) => [provider, amountKopecks]));
  assert.deepEqual(byProvider, { polza: 11_340, routerai: 95_445 });
  assert.equal(summarizeFinanceAllocations(allocations).ownerShare, 88_188);
});

test('every paid package and plan funds buffered primary liability and an immediate fallback minimum', () => {
  const products = [
    { id: 'coins_150', amountKopecks: 54_900, metacoins: 150 },
    { id: 'coins_400', amountKopecks: 129_000, metacoins: 400 },
    { id: 'coins_1000', amountKopecks: 299_000, metacoins: 1_000 },
    { id: 'coins_2500', amountKopecks: 699_000, metacoins: 2_500 },
    { id: 'amateur-month', amountKopecks: 74_900, metacoins: 130 },
    { id: 'author-month', amountKopecks: 149_000, metacoins: 300 },
    { id: 'researcher-month', amountKopecks: 249_000, metacoins: 850 },
    { id: 'expert-month', amountKopecks: 399_000, metacoins: 1_300 },
    { id: 'expert-quarter', amountKopecks: 1_017_500, metacoins: 3_900 }
  ];

  for (const product of products) {
    const allocations = createFinanceAllocations({
      externalPaymentId: `coverage-${product.id}`,
      amountKopecks: product.amountKopecks,
      metacoinsGranted: product.metacoins
    });
    const summary = summarizeFinanceAllocations(allocations);
    const liability = providerLiabilityRublesForMetacoins({
      metacoins: product.metacoins,
      minimumTariffRublesPerMetacoin: minimumTariffRublesPerMetacoin()
    });
    const providerAmounts = Object.fromEntries(allocations
      .filter(({ category }) => category === 'api_reserve')
      .map(({ provider, amountKopecks }) => [provider, amountKopecks]));
    assert.equal(providerAmounts.polza, Math.ceil(product.amountKopecks * 0.06), product.id);
    assert.ok(providerAmounts.routerai >= Math.ceil(liability.total * 100), product.id);
    assert.ok(providerAmounts.routerai >= 10_000, product.id);
    assert.equal(
      summary.gross - summary.paymentFee - summary.referralLiability
        - summary.apiReserve - summary.ownerShare,
      0,
      product.id
    );
  }
});

test('every production product keeps owner share non-negative inside the combined provider budget', () => {
  const products = [
    { id: 'coins-150-exact', amountKopecks: 54_900, metacoins: 150 },
    { id: 'amateur-exact', amountKopecks: 74_900, metacoins: 130 },
    { id: 'expert-quarter-exact', amountKopecks: 1_017_500, metacoins: 3_900 }
  ];

  for (const product of products) {
    const allocations = createFinanceAllocations({
      externalPaymentId: product.id,
      amountKopecks: product.amountKopecks,
      metacoinsGranted: product.metacoins,
      enforceExactGrossMargin: true,
      targetGrossMarginPercent: 40
    });
    const summary = summarizeFinanceAllocations(allocations);
    const liability = providerLiabilityRublesForMetacoins({
      metacoins: product.metacoins,
      minimumTariffRublesPerMetacoin: minimumTariffRublesPerMetacoin()
    });
    const byProvider = Object.fromEntries(allocations
      .filter(({ category }) => category === 'api_reserve')
      .map(({ provider, amountKopecks }) => [provider, amountKopecks]));
    assert.equal(byProvider.polza, Math.ceil(product.amountKopecks * 0.06), product.id);
    assert.ok(byProvider.routerai >= Math.ceil(liability.total * 100), product.id);
    assert.ok(byProvider.routerai >= 10_000, product.id);
    assert.ok(summary.ownerShare >= 0, product.id);
    assert.equal(
      summary.gross - summary.paymentFee - summary.referralLiability
        - summary.apiReserve - summary.ownerShare,
      0,
      product.id
    );
  }
});

test('an underfunded metacoin grant fails closed instead of creating a false owner balance', () => {
  assert.throws(
    () => createFinanceAllocations({
      externalPaymentId: 'underfunded-1',
      amountKopecks: 100_000,
      apiReservePercent: 1,
      metacoinsGranted: 1_200
    }),
    /RouterAI reserve|negative owner share/i
  );
});

test('finance allocations distribute rounding once and keep the total auditable', () => {
  const allocations = createFinanceAllocations({
    externalPaymentId: 'pay-101',
    amountKopecks: 999,
    referralEarningKopecks: 0,
    paymentFeePercent: 3.5,
    apiReservePercent: 10,
    providerWeights: { polza: 2, gptunnel: 1, unused: 0 }
  });

  const summary = summarizeFinanceAllocations(allocations);
  assert.equal(summary.gross - summary.paymentFee - summary.apiReserve - summary.ownerShare, 0);
  assert.equal(summary.grossMargin, 864);
  assert.equal(summary.grossMarginPercent, (864 / 999) * 100);
  assert.deepEqual(
    allocations.filter(({ category }) => category === 'api_reserve')
      .map(({ provider, amountKopecks }) => [provider, amountKopecks]),
    [['polza', 67], ['routerai', 33]]
  );
});

test('finance allocations reject unsafe or insolvent inputs', () => {
  assert.throws(
    () => createFinanceAllocations({ externalPaymentId: 'pay', amountKopecks: 0 }),
    /amount/i
  );
  assert.throws(
    () => createFinanceAllocations({ externalPaymentId: 'pay', amountKopecks: 100, referralEarningKopecks: 101 }),
    /referral/i
  );
  assert.throws(
    () => createFinanceAllocations({ externalPaymentId: 'pay', amountKopecks: 100, apiReservePercent: 101 }),
    /reserve/i
  );
  assert.throws(
    () => createFinanceAllocations({ externalPaymentId: 'pay', amountKopecks: 100, providerWeights: {} }),
    /provider/i
  );
});

test('the temporary test tariff can reserve exactly 100 rubles for Polza without changing production policy', () => {
  const allocations = createFinanceAllocations({
    externalPaymentId: 'test-tariff-payment',
    amountKopecks: 14_000,
    metacoinsGranted: 100,
    providerReserveOverrideKopecks: 10_000,
    providerReserveOverrideWeights: { polza: 1 },
    allowTestOnlyReserveOverride: true,
    enforceExactGrossMargin: false
  });
  const summary = summarizeFinanceAllocations(allocations);

  assert.equal(summary.apiReserve, 10_000);
  assert.equal(summary.ownerShare, 3_510);
  assert.equal(summary.grossMargin, 3_510);
  assert.equal(summary.grossMarginPercent, 25.071428571428573);
  assert.deepEqual(
    allocations.filter(({ category }) => category === 'api_reserve')
      .map(({ provider, amountKopecks }) => [provider, amountKopecks]),
    [['polza', 10_000]]
  );
  assert.equal(allocations.some(({ provider }) => provider === 'kie'), false);
});

test('the new test tariff reserves Polza minimum 100 rubles from the 110 ruble payment', () => {
  const allocations = createFinanceAllocations({
    externalPaymentId: 'new-test-tariff-payment',
    amountKopecks: 11_000,
    metacoinsGranted: 100,
    providerReserveOverrideKopecks: 10_000,
    providerReserveOverrideWeights: { polza: 1 },
    allowTestOnlyReserveOverride: true,
    enforceExactGrossMargin: false
  });
  const summary = summarizeFinanceAllocations(allocations);

  assert.equal(summary.apiReserve, 10_000);
  assert.equal(summary.paymentFee, 385);
  assert.equal(summary.ownerShare, 615);
  assert.deepEqual(
    allocations.filter(({ category }) => category === 'api_reserve')
      .map(({ provider, amountKopecks }) => [provider, amountKopecks]),
    [['polza', 10_000]]
  );
});

test('the final test tariff reserves exactly 110 rubles for Polza from 130 rubles', () => {
  const allocations = createFinanceAllocations({
    externalPaymentId: 'final-test-tariff-payment',
    amountKopecks: 13_000,
    metacoinsGranted: 100,
    providerReserveOverrideKopecks: 11_000,
    providerReserveOverrideWeights: { polza: 1 },
    allowTestOnlyReserveOverride: true,
    enforceExactGrossMargin: false
  });
  const summary = summarizeFinanceAllocations(allocations);

  assert.equal(summary.apiReserve, 11_000);
  assert.equal(summary.paymentFee, 455);
  assert.equal(summary.ownerShare, 1_545);
  assert.deepEqual(
    allocations.filter(({ category }) => category === 'api_reserve')
      .map(({ provider, amountKopecks }) => [provider, amountKopecks]),
    [['polza', 11_000]]
  );
});

test('test-only reserve overrides fail closed unless explicitly enabled', () => {
  assert.throws(
    () => createFinanceAllocations({
      externalPaymentId: 'test-tariff-disabled',
      amountKopecks: 14_000,
      providerReserveOverrideKopecks: 10_000
    }),
    /test-only reserve override/i
  );
});
