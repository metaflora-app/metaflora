import { createHmac } from 'node:crypto';

import { getMetacoinPackage, getSubscriptionOffer, getSubscriptionPlan } from './billing-catalog.js';

const TELEGRAM_ID = /^[1-9]\d{0,19}$/u;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{1,64}$/u;
const ORDER_ID = /^mfc_[a-f0-9]{32}$/u;
const CALLBACK_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,219}$/u;
const TRANSACTION_HASH = /^0x[a-fA-F0-9]{64}$/u;
const MAX_TICKET_TTL_SECONDS = 15 * 60;

function strongSecret(value) {
  const secret = String(value ?? '');
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new TypeError('Crypto USDC shared secret must contain at least 32 bytes.');
  }
  return secret;
}

function safeGatewayUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError('Crypto USDC gateway URL is invalid.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new TypeError('Crypto USDC gateway URL must be a safe HTTPS URL.');
  }
  return url;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new TypeError(`${label} is invalid.`);
  return number;
}

function identifier(value, pattern, label) {
  const normalized = String(value ?? '');
  if (!pattern.test(normalized)) throw new TypeError(`${label} is invalid.`);
  return normalized;
}

function productSnapshot({ kind, productId, durationMonths = 1 }) {
  if (kind === 'package') {
    const item = getMetacoinPackage(productId);
    if (!item) throw new TypeError('Crypto USDC product is invalid.');
    return Object.freeze({
      kind,
      productId: item.id,
      productName: `${item.metacoins.toLocaleString('ru-RU')} метакоинов`,
      durationMonths: 1,
      metacoins: item.metacoins
    });
  }
  if (kind === 'plan') {
    const offer = getSubscriptionOffer(productId, positiveInteger(durationMonths, 'duration months'));
    if (!offer) throw new TypeError('Crypto USDC product is invalid.');
    return Object.freeze({
      kind: 'tariff',
      productId: offer.planId,
      productName: `Тариф «${getSubscriptionPlan(offer.planId).name}»`,
      durationMonths: offer.months,
      metacoins: offer.metacoins
    });
  }
  throw new TypeError('Crypto USDC product kind is invalid.');
}

function normalizedPrices(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new TypeError('Crypto USDC prices are required.');
  }
  const entries = Object.entries(source).map(([key, value]) => {
    if (!/^(?:package:[a-z][a-z0-9_]{1,63}|plan:[a-z][a-z0-9_]{1,63}:(?:1|3))$/u.test(key)) {
      throw new TypeError('Crypto USDC price key is invalid.');
    }
    const amount = positiveInteger(value?.amountUsdcMicros, 'Crypto USDC price');
    const openrouterCredit = positiveInteger(value?.openrouterCreditMicrousd, 'OpenRouter credit allocation');
    const openrouter = positiveInteger(value?.openrouterUsdcMicros, 'OpenRouter USDC allocation');
    const gasReserve = positiveInteger(value?.gasReserveUsdcMicros, 'USDC gas reserve');
    const owner = Number(value?.ownerUsdcMicros);
    if (amount % 10_000 !== 0 || openrouterCredit % 10_000 !== 0 || openrouterCredit < 5_000_000
      || openrouter % 10_000 !== 0 || openrouter < 5_250_000 || gasReserve % 10_000 !== 0
      || gasReserve < 10_000 || !Number.isSafeInteger(owner) || owner < 0
      || openrouter + gasReserve + owner !== amount) {
      throw new TypeError('Crypto USDC allocation must include exact OpenRouter credits/funding, gas reserve and owner share.');
    }
    return [key, Object.freeze({
      amountUsdcMicros: amount,
      openrouterCreditMicrousd: openrouterCredit,
      openrouterUsdcMicros: openrouter,
      gasReserveUsdcMicros: gasReserve,
      ownerUsdcMicros: owner
    })];
  });
  if (!entries.length) throw new TypeError('Crypto USDC prices are required.');
  return Object.freeze(Object.fromEntries(entries));
}

function priceKey(product) {
  return product.kind === 'tariff'
    ? `plan:${product.productId}:${product.durationMonths}`
    : `package:${product.productId}`;
}

function orderIdFor(userId, idempotencyKey, secret) {
  return `mfc_${createHmac('sha256', secret)
    .update(`${userId}:${idempotencyKey}:crypto_usdc`)
    .digest('hex')
    .slice(0, 32)}`;
}

function signedQuote(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

function confirmedCallback(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Crypto USDC callback is invalid.');
  }
  if (value.provider !== 'base_usdc') throw new TypeError('Crypto USDC provider is invalid.');
  if (value.status !== 'COMPLETED') {
    throw new TypeError('Crypto USDC callback is not completed.');
  }
  if (value.currency !== 'USDC') throw new TypeError('Crypto USDC currency is invalid.');
  if (value.network !== 'base') throw new TypeError('Crypto USDC network is invalid.');
  const amountUsdcMicros = positiveInteger(value.amountUsdcMicros, 'USDC amount');
  const payableAmountUsdcMicros = positiveInteger(value.payableAmountUsdcMicros, 'USDC payable amount');
  const overpaymentUsdcMicros = positiveInteger(value.overpaymentUsdcMicros, 'USDC overpayment');
  if (overpaymentUsdcMicros >= 10_000
    || payableAmountUsdcMicros !== amountUsdcMicros + overpaymentUsdcMicros) {
    throw new TypeError('Crypto USDC payable amount and overpayment are invalid.');
  }
  return Object.freeze({
    callbackId: identifier(value.eventId, CALLBACK_ID, 'event id'),
    orderId: identifier(value.orderId, ORDER_ID, 'order id'),
    paymentId: identifier(value.checkoutId, ORDER_ID, 'checkout id'),
    transactionHash: identifier(value.transactionHash, TRANSACTION_HASH, 'transaction hash').toLowerCase(),
    amountUsdcMicros,
    payableAmountUsdcMicros,
    overpaymentUsdcMicros,
    currency: 'USDC',
    chain: 'base',
    status: 'COMPLETED',
    chainStatus: 'confirmed'
  });
}

export function createCryptoUsdcPaymentService({
  repository,
  referralService,
  gatewayUrl,
  quoteSecret,
  prices,
  ticketTtlSeconds = MAX_TICKET_TTL_SECONDS,
  now = () => new Date()
} = {}) {
  if (!repository?.recordCryptoUsdcCheckout
    || !repository?.recordCryptoUsdcCallback
    || !repository?.completeCryptoUsdcFulfillment) {
    throw new TypeError('A persistent Crypto USDC repository is required.');
  }
  if (!referralService?.fulfillCryptoEntitlement) {
    throw new TypeError('A Crypto USDC entitlement service is required.');
  }
  const gateway = safeGatewayUrl(gatewayUrl);
  const secret = strongSecret(quoteSecret);
  const priceCatalog = normalizedPrices(prices);
  if (!Number.isSafeInteger(ticketTtlSeconds)
    || ticketTtlSeconds < 60
    || ticketTtlSeconds > MAX_TICKET_TTL_SECONDS) {
    throw new TypeError('Crypto USDC ticket TTL must be between 60 and 900 seconds.');
  }
  return Object.freeze({
    supportsCheckout({ kind, productId, durationMonths = 1 } = {}) {
      try {
        return Boolean(priceCatalog[priceKey(productSnapshot({ kind, productId, durationMonths }))]);
      } catch {
        return false;
      }
    },
    async createCheckout({
      kind,
      productId,
      durationMonths = 1,
      telegramUserId,
      telegramChatId,
      idempotencyKey
    }) {
      const userId = identifier(telegramUserId, TELEGRAM_ID, 'telegram user id');
      const chatId = identifier(telegramChatId, TELEGRAM_ID, 'telegram chat id');
      const key = identifier(idempotencyKey, IDEMPOTENCY_KEY, 'idempotency key');
      const product = productSnapshot({ kind, productId, durationMonths });
      const configuredAllocation = priceCatalog[priceKey(product)];
      if (!configuredAllocation) throw new Error('An explicit USDC price is not configured for this product.');
      const { amountUsdcMicros, openrouterCreditMicrousd, openrouterUsdcMicros, gasReserveUsdcMicros, ownerUsdcMicros } = configuredAllocation;
      const allocation = Object.freeze({
        amountUsdcMicros,
        openrouterCreditMicrousd,
        openrouterUsdcMicros,
        gasReserveUsdcMicros,
        ownerUsdcMicros,
        currency: 'USDC',
        network: 'base'
      });
      const snapshot = Object.freeze({ product, allocation });
      const orderId = orderIdFor(userId, key, secret);
      const issuedAt = Math.floor(now().valueOf() / 1000);
      if (!Number.isSafeInteger(issuedAt)) throw new Error('Crypto USDC checkout clock is invalid.');
      await repository.recordCryptoUsdcCheckout({
        orderId,
        telegramUserId: userId,
        telegramChatId: chatId,
        amountUsdcMicros,
        currency: 'USDC',
        chain: 'base',
        snapshot
      });
      const quote = signedQuote(Object.freeze({
        quoteId: orderId,
        orderId,
        currency: 'USDC',
        network: 'base',
        product,
        allocation,
        expiresAt: issuedAt + ticketTtlSeconds
      }), secret);
      const confirmation = new URL(gateway);
      confirmation.pathname = '/crypto';
      confirmation.search = '';
      confirmation.searchParams.set('quote', quote);
      return Object.freeze({
        paymentId: orderId,
        orderId,
        amountUsdcMicros,
        currency: 'USDC',
        chain: 'base',
        confirmationUrl: confirmation.toString()
      });
    },
    async processCallback(value) {
      const callback = confirmedCallback(value);
      const confirmation = await repository.recordCryptoUsdcCallback({
        ...callback,
        confirmedAt: now().toISOString()
      });
      if (!['confirmed', 'fulfilled'].includes(confirmation?.status)) {
        throw new Error('Crypto USDC confirmation was not persisted.');
      }
      const entitlement = referralService.fulfillCryptoEntitlement({
        orderId: callback.orderId,
        telegramId: confirmation.telegramUserId,
        kind: confirmation.productKind,
        productId: confirmation.productId,
        durationMonths: confirmation.durationMonths,
        durationDays: confirmation.durationDays,
        metacoins: confirmation.metacoins,
        amountUsdcMicros: callback.amountUsdcMicros,
        paymentRail: 'crypto_usdc',
        fundingProvider: 'openrouter',
        confirmedAt: confirmation.confirmedAt
      });
      const completed = await repository.completeCryptoUsdcFulfillment({
        orderId: callback.orderId,
        entitlementStatus: entitlement.status,
        fulfilledAt: confirmation.confirmedAt
      });
      return Object.freeze({ ...confirmation, ...completed });
    }
  });
}
