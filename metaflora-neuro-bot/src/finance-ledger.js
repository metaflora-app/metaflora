import { minimumTariffRublesPerMetacoin } from './model-pricing.js';
import {
  FINANCE_POLICY,
  providerLiabilityRublesForMetacoins
} from './finance-policy.js';

const CATEGORIES = Object.freeze([
  'gross',
  'payment_fee',
  'referral_liability',
  'api_reserve',
  'owner_share'
]);

// Only used when a historical allocation has no product/metacoin data.
// Current tariff/package/upgrade paths use product-aware liabilities below.
const DEFAULT_PROVIDER_WEIGHTS = FINANCE_POLICY.legacyProviderWeights
  ?? FINANCE_POLICY.providerWeights;

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive integer.`);
  }
  return value;
}

function nonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative integer.`);
  }
  return value;
}

function percentage(value, label) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${label} must be between 0 and 100.`);
  }
  return value;
}

function paymentIdentifier(value) {
  const id = String(value ?? '').trim();
  if (!/^[A-Za-z0-9_.:-]{1,128}$/u.test(id)) {
    throw new TypeError('external payment id is invalid.');
  }
  return id;
}

function providerWeights(value) {
  if (value === undefined || value === null) return DEFAULT_PROVIDER_WEIGHTS;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('provider weights are invalid.');
  }
  const normalized = new Map();
  for (const [sourceProvider, sourceWeight] of Object.entries(value)) {
    const rawProvider = String(sourceProvider).trim().toLowerCase();
    const provider = rawProvider === 'gptunnel' ? 'routerai' : rawProvider;
    const weight = Number(sourceWeight);
    normalized.set(provider, (normalized.get(provider) ?? 0) + weight);
  }
  const entries = [...normalized.entries()]
    .filter(([, weight]) => weight > 0);
  if (!entries.length || entries.some(([provider, weight]) => !/^[a-z][a-z0-9_-]{1,48}$/u.test(provider) || !Number.isFinite(weight))) {
    throw new TypeError('provider weights are invalid.');
  }
  return Object.freeze(Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right))));
}

function allocation({ externalPaymentId, category, amountKopecks, provider = null, currency, source }) {
  return Object.freeze({
    allocationKey: [externalPaymentId, category, provider ?? 'all'].join(':'),
    externalPaymentId,
    category,
    provider,
    amountKopecks,
    currency,
    status: category === 'gross' ? 'actual' : category === 'payment_fee' ? 'estimated' : 'reserved',
    source
  });
}

function splitAmount(total, weights) {
  const entries = Object.entries(weights);
  const weightTotal = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const portions = entries.map(([provider, weight]) => {
    const exact = total * weight / weightTotal;
    const floor = Math.floor(exact);
    return { provider, floor, remainder: exact - floor };
  });
  let remainder = total - portions.reduce((sum, item) => sum + item.floor, 0);
  portions.sort((left, right) => right.remainder - left.remainder || left.provider.localeCompare(right.provider));
  return portions.map((item) => ({
    provider: item.provider,
    amountKopecks: item.floor + (remainder-- > 0 ? 1 : 0)
  })).sort(({ provider: left }, { provider: right }) => left.localeCompare(right));
}

function providerMinimumsValue(value, weights) {
  if (value === null || value === undefined) return Object.freeze({});
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('provider minimums are invalid.');
  }
  const entries = Object.entries(value).map(([sourceProvider, amount]) => {
    const provider = String(sourceProvider).trim().toLowerCase() === 'gptunnel'
      ? 'routerai'
      : String(sourceProvider).trim().toLowerCase();
    if (!Object.hasOwn(weights, provider)) {
      throw new RangeError(`provider minimum is configured for unknown provider: ${provider}.`);
    }
    return [provider, nonNegativeInteger(amount, `provider minimum for ${provider}`)];
  });
  return Object.freeze(Object.fromEntries(entries));
}

function splitAmountWithMinimums(total, weights, minimums) {
  const minimumTotal = Object.values(minimums).reduce((sum, amount) => sum + amount, 0);
  if (minimumTotal <= 0) return splitAmount(total, weights);
  if (total < minimumTotal) return splitAmount(total, minimums);

  const initial = Object.fromEntries(
    splitAmount(total, weights).map(({ provider, amountKopecks }) => [provider, amountKopecks])
  );
  const deficits = Object.entries(minimums)
    .map(([provider, minimum]) => ({ provider, amount: Math.max(0, minimum - (initial[provider] ?? 0)) }))
    .filter(({ amount }) => amount > 0);
  const donors = Object.keys(initial)
    .map((provider) => ({
      provider,
      available: Math.max(0, initial[provider] - (minimums[provider] ?? 0))
    }))
    .sort((left, right) => right.available - left.available || left.provider.localeCompare(right.provider));
  const adjusted = { ...initial };
  for (const deficit of deficits) {
    let remaining = deficit.amount;
    for (const donor of donors) {
      const transfer = Math.min(remaining, donor.available);
      if (transfer <= 0) continue;
      adjusted[donor.provider] -= transfer;
      adjusted[deficit.provider] = (adjusted[deficit.provider] ?? 0) + transfer;
      donor.available -= transfer;
      remaining -= transfer;
      if (remaining === 0) break;
    }
    if (remaining > 0) throw new RangeError('provider minimums cannot be satisfied.');
  }
  return Object.entries(adjusted)
    .map(([provider, amountKopecks]) => ({ provider, amountKopecks }))
    .sort(({ provider: left }, { provider: right }) => left.localeCompare(right));
}

export function createFinanceAllocations({
  externalPaymentId,
  amountKopecks,
  currency = 'RUB',
  referralEarningKopecks = 0,
  paymentFeePercent = FINANCE_POLICY.paymentFeePercent,
  apiReservePercent = FINANCE_POLICY.apiReservePercent,
  providerWeights = DEFAULT_PROVIDER_WEIGHTS,
  metacoinsGranted = null,
  enforceExactGrossMargin = false,
  targetGrossMarginPercent = FINANCE_POLICY.targetGrossMarginPercent,
  providerReserveOverrideKopecks = null,
  providerReserveOverrideWeights = null,
  allowTestOnlyReserveOverride = false,
  providerMinimumsKopecks = null,
  allowOwnerShareForProviderMinimums = false,
  reserveCarryInKopecks = 0,
  primaryProviderBufferPercent = FINANCE_POLICY.primaryProviderBufferPercent,
  source = 'payment_webhook'
} = {}) {
  const paymentId = paymentIdentifier(externalPaymentId);
  const gross = positiveInteger(amountKopecks, 'payment amount');
  const referral = nonNegativeInteger(referralEarningKopecks, 'referral earning');
  const reserveCarry = nonNegativeInteger(reserveCarryInKopecks, 'reserve carry');
  const feePercent = percentage(paymentFeePercent, 'payment fee');
  const reservePercent = percentage(apiReservePercent, 'API reserve');
  const exactMarginEnabled = enforceExactGrossMargin === true;
  const targetMarginPercent = percentage(targetGrossMarginPercent, 'target gross margin');
  percentage(primaryProviderBufferPercent, 'primary provider buffer');
  const hasReserveOverride = providerReserveOverrideKopecks !== null
    && providerReserveOverrideKopecks !== undefined;
  if (hasReserveOverride && allowTestOnlyReserveOverride !== true) {
    throw new RangeError('test-only reserve override requires explicit enablement.');
  }
  if (!hasReserveOverride && providerReserveOverrideWeights !== null && providerReserveOverrideWeights !== undefined) {
    throw new RangeError('provider reserve override weights require a test-only reserve override.');
  }
  const reserveOverride = hasReserveOverride
    ? positiveInteger(providerReserveOverrideKopecks, 'provider reserve override')
    : null;
  const granted = metacoinsGranted === null || metacoinsGranted === undefined
    ? null
    : positiveInteger(metacoinsGranted, 'granted metacoins');
  const weights = providerWeights === DEFAULT_PROVIDER_WEIGHTS
    ? DEFAULT_PROVIDER_WEIGHTS
    : providerWeightsValue(providerWeights);
  const providerMinimums = providerMinimumsValue(providerMinimumsKopecks, weights);
  const providerMinimumTotal = Object.values(providerMinimums).reduce((sum, amount) => sum + amount, 0);
  const normalizedCurrency = String(currency ?? '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/u.test(normalizedCurrency)) throw new TypeError('currency is invalid.');
  if (!/^[a-z][a-z0-9_.:-]{0,64}$/u.test(String(source))) throw new TypeError('allocation source is invalid.');
  if (referral > gross) throw new RangeError('referral earning cannot exceed payment amount.');

  const fee = Math.round(gross * feePercent / 100);
  const configuredApiReserve = Math.round(gross * reservePercent / 100);
  const providerLiability = granted !== null && normalizedCurrency === 'RUB'
    ? providerLiabilityRublesForMetacoins({
        metacoins: granted,
        minimumTariffRublesPerMetacoin: minimumTariffRublesPerMetacoin(),
        paymentFeePercent: feePercent,
        targetGrossMarginPercent: FINANCE_POLICY.targetGrossMarginPercent,
        routeraiReservePercent: FINANCE_POLICY.routeraiReservePercent,
        primaryProviderBufferPercent
      })
    : null;
  const liabilityApiReserve = providerLiability === null
    ? 0
    : Math.ceil(providerLiability.total * 100);
  const targetGrossMargin = Math.round(gross * targetMarginPercent / 100);
  const exactApiReserve = gross - fee - targetGrossMargin;
  if (hasReserveOverride && exactMarginEnabled && reserveOverride !== exactApiReserve) {
    throw new RangeError('test-only reserve override cannot bypass exact gross margin.');
  }
  const liabilityRoundingToleranceKopecks = 1;
  if (exactMarginEnabled
    && exactApiReserve + liabilityRoundingToleranceKopecks < liabilityApiReserve
    && allowOwnerShareForProviderMinimums !== true) {
    throw new RangeError('provider liability cannot maintain the exact gross margin.');
  }
  const productAwareAllocation = !hasReserveOverride
    && providerLiability !== null
    && Object.hasOwn(weights, 'polza')
    && Object.hasOwn(weights, 'routerai');
  const productAwarePolza = productAwareAllocation
    ? Math.ceil(gross * FINANCE_POLICY.polzaReservePercent / 100)
    : 0;
  const productAwareRouter = productAwareAllocation
    ? Math.max(
        providerMinimums.routerai ?? 10_000,
        Math.ceil(gross * FINANCE_POLICY.routeraiReservePercent / 100),
        Math.max(0, liabilityApiReserve - reserveCarry)
      )
    : 0;
  if (productAwareAllocation && productAwareRouter + reserveCarry < liabilityApiReserve) {
    throw new RangeError('RouterAI reserve cannot cover the maximum metacoin liability.');
  }
  const productAwareReserve = productAwarePolza + productAwareRouter;
  const baseApiReserve = hasReserveOverride
    ? reserveOverride
    : productAwareAllocation
      ? productAwareReserve
    : exactMarginEnabled
      ? exactApiReserve
      : Math.max(configuredApiReserve, liabilityApiReserve);
  const spendableAfterFeeAndReferral = gross - fee - referral;
  const apiReserve = productAwareAllocation
    ? productAwareReserve
    : allowOwnerShareForProviderMinimums === true && !hasReserveOverride
    ? Math.min(spendableAfterFeeAndReferral, Math.max(baseApiReserve, providerMinimumTotal))
    : baseApiReserve;
  const allocationWeights = hasReserveOverride
    ? providerWeightsValue(providerReserveOverrideWeights ?? { polza: 1 })
    : weights;
  const ownerShare = gross + reserveCarry - fee - referral - apiReserve;
  if (ownerShare < 0 && productAwareAllocation && productAwareRouter === 10_000) {
    throw new RangeError('RouterAI minimum cannot be funded by this payment.');
  }
  if (ownerShare < 0) throw new RangeError('payment allocation leaves a negative owner share.');

  const rows = [
    allocation({ externalPaymentId: paymentId, category: 'gross', amountKopecks: gross, currency: normalizedCurrency, source }),
    ...(fee > 0 ? [allocation({ externalPaymentId: paymentId, category: 'payment_fee', amountKopecks: fee, currency: normalizedCurrency, source })] : []),
    ...(referral > 0 ? [allocation({ externalPaymentId: paymentId, category: 'referral_liability', amountKopecks: referral, currency: normalizedCurrency, source })] : []),
    ...(productAwareAllocation
      ? [
          { provider: 'polza', amountKopecks: productAwarePolza },
          { provider: 'routerai', amountKopecks: productAwareRouter }
        ]
      : splitAmountWithMinimums(apiReserve, allocationWeights, providerMinimums))
      .filter(({ amountKopecks }) => amountKopecks > 0)
      .map(({ provider, amountKopecks }) => allocation({
        externalPaymentId: paymentId,
        category: 'api_reserve',
        provider,
        amountKopecks,
        currency: normalizedCurrency,
        source
      })),
    ...(ownerShare > 0 ? [allocation({ externalPaymentId: paymentId, category: 'owner_share', amountKopecks: ownerShare, currency: normalizedCurrency, source })] : [])
  ];
  return Object.freeze(rows);
}

function providerWeightsValue(value) {
  return providerWeights(value);
}

export function summarizeFinanceAllocations(allocations) {
  if (!Array.isArray(allocations)) throw new TypeError('allocations must be an array.');
  const totals = {
    gross: 0,
    paymentFee: 0,
    referralLiability: 0,
    apiReserve: 0,
    ownerShare: 0
  };
  for (const item of allocations) {
    if (!item || !CATEGORIES.includes(item.category)) throw new TypeError('allocation category is invalid.');
    const amount = nonNegativeInteger(item.amountKopecks, 'allocation amount');
    if (item.category === 'gross') totals.gross += amount;
    if (item.category === 'payment_fee') totals.paymentFee += amount;
    if (item.category === 'referral_liability') totals.referralLiability += amount;
    if (item.category === 'api_reserve') totals.apiReserve += amount;
    if (item.category === 'owner_share') totals.ownerShare += amount;
  }
  const grossMargin = totals.gross - totals.paymentFee - totals.apiReserve;
  return Object.freeze({
    ...totals,
    grossMargin,
    grossMarginPercent: totals.gross > 0
      ? (grossMargin / totals.gross) * 100
      : 0
  });
}

export function requiredFinanceReserveCarry(options = {}) {
  const gross = positiveInteger(options.amountKopecks, 'payment amount');
  const probe = createFinanceAllocations({ ...options, reserveCarryInKopecks: gross });
  const owner = summarizeFinanceAllocations(probe).ownerShare;
  return Math.max(0, gross - owner);
}
