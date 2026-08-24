import { getSubscriptionPlan } from './billing-catalog.js';

function asNonNegativeSafeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer.`);
  }
  return value;
}

function asTimestamp(value, label) {
  const timestamp = new Date(value).valueOf();
  if (!Number.isFinite(timestamp)) throw new TypeError(`${label} must be a valid date.`);
  return timestamp;
}

function decision(allowed, reason, debitMetacoins) {
  return Object.freeze({ allowed, reason, debitMetacoins });
}

export function decideModelAccess({
  account,
  modelId,
  priceMetacoins,
  freeModelIds,
  now = new Date()
}) {
  if (!account || typeof account !== 'object') throw new TypeError('account is required.');
  if (typeof modelId !== 'string' || modelId.length === 0) throw new TypeError('modelId is required.');
  if (!freeModelIds || typeof freeModelIds[Symbol.iterator] !== 'function') {
    throw new TypeError('freeModelIds must be iterable.');
  }

  const price = asNonNegativeSafeInteger(priceMetacoins, 'priceMetacoins');
  const balance = asNonNegativeSafeInteger(account.metacoinBalance, 'account.metacoinBalance');
  const isAllowlistedFreeModel = new Set(freeModelIds).has(modelId);

  if (isAllowlistedFreeModel) return decision(true, null, 0);
  const plan = getSubscriptionPlan(account.subscriptionPlanId);
  if (!plan || plan.priceKopecks === 0) {
    return decision(false, 'tariff_required', price);
  }

  const currentTimestamp = asTimestamp(now, 'now');
  const expirationTimestamp = account.subscriptionExpiresAt
    ? asTimestamp(account.subscriptionExpiresAt, 'account.subscriptionExpiresAt')
    : Number.NEGATIVE_INFINITY;
  if (expirationTimestamp <= currentTimestamp) {
    return decision(false, 'tariff_expired', price);
  }
  if (balance < price) {
    return decision(false, 'insufficient_metacoins', price);
  }
  return decision(true, null, price);
}
