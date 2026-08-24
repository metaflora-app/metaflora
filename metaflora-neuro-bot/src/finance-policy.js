/**
 * The money split is deliberately kept separate from the provider routing
 * code. A provider weight is a cash-reserve allocation, not a traffic split.
 */
export const FINANCE_POLICY = Object.freeze({
  paymentFeePercent: 3.5,
  targetGrossMarginPercent: 40,
  polzaReservePercent: 6,
  routeraiReservePercent: 50.5,
  // RouterAI's 50.5% is the complete provider budget, not a traffic weight.
  // Every public RouterAI price reserves a small tail above the live provider
  // cost. The same tail is surfaced in the product solvency ledger below.
  failoverReservePercent: 2,
  primaryProviderBufferPercent: 2,
  apiReservePercent: 56.5,
  // Historical rows without product data use the same production cash split.
  legacyProviderWeights: Object.freeze({ polza: 60, routerai: 505 }),
  // Compatibility alias for older callers and persisted configuration.
  providerWeights: Object.freeze({ polza: 60, routerai: 505 }),
  providerMinimumsKopecks: Object.freeze({ routerai: 10_000 })
});

const PRODUCT_RESERVE_OVERRIDES = Object.freeze({
  'plan:amateur:1': Object.freeze({ polzaReservePercent: 6.1 }),
  'plan:author:1': Object.freeze({ polzaReservePercent: 7 }),
  'package:coins_150:1': Object.freeze({ polzaReservePercent: 6.1 }),
  'package:coins_400:1': Object.freeze({ polzaReservePercent: 8 }),
  'plan:ultimate_test:1': Object.freeze({
    polzaReservePercent: 6,
    allocateRemainingToRouter: true,
    targetGrossMarginPercent: 0
  })
});

export function financePolicyForProduct({ kind, productId, durationMonths = 1 } = {}) {
  const normalizedKind = String(kind ?? '').trim().toLowerCase();
  const normalizedProductId = String(productId ?? '').trim().toLowerCase();
  const months = Number(durationMonths ?? 1);
  if (!['plan', 'package'].includes(normalizedKind)) throw new TypeError('Unknown product kind.');
  if (!/^[a-z0-9_]{2,64}$/u.test(normalizedProductId)) throw new TypeError('Invalid product id.');
  if (![1, 3].includes(months)) throw new TypeError('Invalid product duration.');
  const override = PRODUCT_RESERVE_OVERRIDES[
    `${normalizedKind}:${normalizedProductId}:${months}`
  ] ?? {};
  return Object.freeze({
    paymentFeePercent: FINANCE_POLICY.paymentFeePercent,
    polzaReservePercent: override.polzaReservePercent ?? FINANCE_POLICY.polzaReservePercent,
    routeraiReservePercent: FINANCE_POLICY.routeraiReservePercent,
    targetGrossMarginPercent: override.targetGrossMarginPercent
      ?? FINANCE_POLICY.targetGrossMarginPercent,
    allocateRemainingToRouter: override.allocateRemainingToRouter === true
  });
}

function finitePercent(value, label) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${label} must be between 0 and 100.`);
  }
  return value;
}

function positiveNumber(value, label) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive number.`);
  }
  return value;
}

/**
 * Returns the percentage of gross revenue available for provider calls after
 * acquiring fees and the target owner margin. This is the provider budget,
 * not merely the GPTunnel fallback share.
 */
export function providerBudgetPercent({
  paymentFeePercent = FINANCE_POLICY.paymentFeePercent,
  targetGrossMarginPercent = FINANCE_POLICY.targetGrossMarginPercent
} = {}) {
  const fee = finitePercent(paymentFeePercent, 'payment fee');
  const margin = finitePercent(targetGrossMarginPercent, 'gross margin');
  const budget = 100 - fee - margin;
  if (budget < 0) throw new RangeError('Payment policy leaves no provider budget.');
  return budget;
}

/**
 * Provider budget per purchased metacoin at the lowest public tariff rate.
 * The returned total is the immutable RouterAI cash allocation. `primary` is
 * the maximum underlying RouterAI cost it covers; `buffer` is the explicit
 * tail above that cost already included in the public model price.
 */
export function providerLiabilityRublesForMetacoins({
  metacoins,
  minimumTariffRublesPerMetacoin,
  paymentFeePercent = FINANCE_POLICY.paymentFeePercent,
  targetGrossMarginPercent = FINANCE_POLICY.targetGrossMarginPercent,
  routeraiReservePercent = FINANCE_POLICY.routeraiReservePercent,
  primaryProviderBufferPercent = FINANCE_POLICY.primaryProviderBufferPercent
} = {}) {
  if (!Number.isSafeInteger(metacoins) || metacoins <= 0) {
    throw new TypeError('Metacoins must be a positive integer.');
  }
  const tariff = positiveNumber(
    minimumTariffRublesPerMetacoin,
    'minimum tariff per metacoin'
  );
  finitePercent(paymentFeePercent, 'payment fee');
  finitePercent(targetGrossMarginPercent, 'gross margin');
  const routerShare = finitePercent(routeraiReservePercent, 'primary provider reserve');
  const bufferPercent = finitePercent(primaryProviderBufferPercent, 'primary provider buffer');
  const total = metacoins * tariff * routerShare / 100;
  const primary = total / (1 + (bufferPercent / 100));
  return Object.freeze({
    total,
    primary,
    buffer: total - primary,
    fallback: 0
  });
}
