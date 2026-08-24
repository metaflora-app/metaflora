const PLACEHOLDERS = Object.freeze({
  amount_kopecks: ({ amountKopecks }) => amountKopecks,
  amount_rubles: ({ amountKopecks }) => (amountKopecks / 100).toFixed(2),
  currency: ({ currency }) => currency,
  idempotency_key: ({ idempotencyKey }) => idempotencyKey,
  payment_id: ({ paymentId }) => paymentId,
  allocation_key: ({ allocationKey }) => allocationKey,
  provider: ({ provider }) => provider
});

function plainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value;
}

function validateRequest(request) {
  const source = plainObject(request, 'funding request');
  if (!Number.isSafeInteger(source.amountKopecks) || source.amountKopecks <= 0) {
    throw new TypeError('Funding amount is invalid.');
  }
  if (!/^[A-Z]{3}$/u.test(String(source.currency ?? ''))) throw new TypeError('Funding currency is invalid.');
  for (const key of ['idempotencyKey', 'paymentId', 'allocationKey', 'provider']) {
    if (!String(source[key] ?? '').trim()) throw new TypeError(`Funding ${key} is required.`);
  }
  return source;
}

function render(value, request) {
  if (Array.isArray(value)) return value.map((item) => render(item, request));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, render(child, request)]));
  }
  if (typeof value !== 'string') return value;
  const exact = value.match(/^\$\{([a-z_]+)\}$/u);
  if (exact) {
    const builder = PLACEHOLDERS[exact[1]];
    if (!builder) throw new TypeError('Direct charge contains an unknown placeholder.');
    return builder(request);
  }
  const expanded = value.replace(/\$\{([a-z_]+)\}/gu, (_match, name) => {
    const builder = PLACEHOLDERS[name];
    if (!builder) throw new TypeError('Direct charge contains an unknown placeholder.');
    return String(builder(request));
  });
  if (expanded.includes('${')) throw new TypeError('Direct charge contains an unresolved placeholder.');
  return expanded;
}

function containsAmountPlaceholder(value) {
  if (Array.isArray(value)) return value.some(containsAmountPlaceholder);
  if (value && typeof value === 'object') {
    return Object.values(value).some(containsAmountPlaceholder);
  }
  return typeof value === 'string'
    && /\$\{amount_(?:kopecks|rubles)\}/u.test(value);
}

export function createDirectChargeContract({ toolName, argumentsTemplate } = {}) {
  const normalizedToolName = String(toolName ?? '').trim();
  if (!normalizedToolName || !/^[A-Za-z][A-Za-z0-9_.:/-]{0,127}$/u.test(normalizedToolName)) return null;
  const template = plainObject(argumentsTemplate, 'direct charge arguments template');
  return Object.freeze({
    toolName: normalizedToolName,
    supportsCustomAmount: containsAmountPlaceholder(template),
    buildArguments(request) {
      const rendered = render(template, validateRequest(request));
      return Object.freeze(plainObject(rendered, 'direct charge arguments'));
    },
    validateArguments(args) {
      return Boolean(args && typeof args === 'object' && !Array.isArray(args));
    }
  });
}
