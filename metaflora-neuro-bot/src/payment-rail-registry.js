const RAIL_NAMES = Object.freeze(['sbp', 'crypto_usdc']);

export function createPaymentRailRegistry({ sbp = null, cryptoUsdc = null } = {}) {
  const rails = new Map([
    ['sbp', sbp],
    ['crypto_usdc', cryptoUsdc]
  ].filter(([, service]) => Boolean(service)));
  return Object.freeze({
    get(name) {
      return RAIL_NAMES.includes(name) ? rails.get(name) ?? null : null;
    },
    enabledMethods(checkout = null) {
      return RAIL_NAMES.filter((name) => {
        const service = rails.get(name);
        return Boolean(service)
          && (!checkout || typeof service.supportsCheckout !== 'function' || service.supportsCheckout(checkout));
      });
    }
  });
}
