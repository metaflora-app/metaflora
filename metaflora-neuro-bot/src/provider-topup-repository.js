export const PROVIDER_TOPUP_REPOSITORY_METHODS = Object.freeze([
  'claimProviderTopupRequests',
  'getProviderTopupRequest',
  'markProviderTopupChargeStarted',
  'markProviderTopupSucceeded',
  'markProviderTopupFailed'
]);

export function isProviderTopupRepository(value) {
  return Boolean(value)
    && PROVIDER_TOPUP_REPOSITORY_METHODS.every((method) => typeof value[method] === 'function');
}
