const DEFAULT_BASE_URL = 'https://api.yookassa.ru';
const DEFAULT_TIMEOUT_MS = 15_000;
const SAFE_TOKEN = /^[A-Za-z0-9_-]{1,64}$/u;
const PAYMENT_ID = /^[A-Za-z0-9_-]{1,128}$/u;
const PAYOUT_TOKEN = /^[A-Za-z0-9_.-]{16,256}$/u;
const PAYOUT_ID = /^[A-Za-z0-9_-]{1,128}$/u;
const FORBIDDEN_METADATA_KEY = /^(?:receipt|customer|email|phone|authorization|password|secret|token|api[_-]?key)$/iu;

export class YooKassaApiError extends Error {
  constructor(status, requestId = null) {
    super(`YooKassa request failed with status ${status}.`);
    this.name = 'YooKassaApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

export class YooKassaTimeoutError extends Error {
  constructor() {
    super('YooKassa request timed out.');
    this.name = 'YooKassaTimeoutError';
  }
}

export class YooKassaNetworkError extends Error {
  constructor() {
    super('YooKassa request failed.');
    this.name = 'YooKassaNetworkError';
  }
}

function requiredText(value, label, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0 || text.length > maxLength) {
    throw new TypeError(`${label} is invalid.`);
  }
  return text;
}

function shopId(value) {
  const id = requiredText(value, 'shop id', 32);
  if (!/^\d+$/u.test(id)) throw new TypeError('shop id is invalid.');
  return id;
}

function secretKey(value) {
  return requiredText(value, 'secret key', 256);
}

function safeToken(value, label) {
  const token = String(value ?? '');
  if (!SAFE_TOKEN.test(token)) throw new TypeError(`${label} is invalid.`);
  return token;
}

function paymentId(value) {
  const id = String(value ?? '');
  if (!PAYMENT_ID.test(id)) throw new TypeError('payment id is invalid.');
  return id;
}

function payoutId(value) {
  const id = String(value ?? '');
  if (!PAYOUT_ID.test(id)) throw new TypeError('payout id is invalid.');
  return id;
}

function payoutToken(value) {
  const token = String(value ?? '');
  if (!PAYOUT_TOKEN.test(token)) throw new TypeError('payout token is invalid.');
  return token;
}

function payoutPhone(value) {
  const compact = String(value ?? '').trim().replace(/[\s()-]/g, '');
  if (/^8\d{10}$/u.test(compact)) return `7${compact.slice(1)}`;
  if (/^\+7\d{10}$/u.test(compact)) return compact.slice(1);
  if (/^7\d{10}$/u.test(compact)) return compact;
  throw new TypeError('payout phone is invalid.');
}

function bankId(value) {
  const id = String(value ?? '').trim();
  if (!/^[A-Za-z0-9_-]{6,64}$/u.test(id)) throw new TypeError('bank id is invalid.');
  return id;
}

function payoutMethod(value) {
  const method = String(value ?? '').trim();
  if (!['sbp', 'bank_card'].includes(method)) throw new TypeError('payout method is invalid.');
  return method;
}

function amount(kopecks) {
  if (!Number.isSafeInteger(kopecks) || kopecks <= 0) {
    throw new TypeError('amount is invalid.');
  }
  return Object.freeze({
    value: (kopecks / 100).toFixed(2),
    currency: 'RUB'
  });
}

function httpsUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${label} is invalid.`);
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new TypeError(`${label} is invalid.`);
  }
  return url.toString();
}

function baseUrl(value) {
  return httpsUrl(value, 'YooKassa base URL').replace(/\/$/u, '');
}

function optionalDescription(value) {
  if (value === undefined || value === null) return undefined;
  return requiredText(value, 'description', 128);
}

function description(value) {
  return requiredText(value, 'description', 128);
}

export function normalizeReceiptEmail(value) {
  if (value === undefined || value === null) return undefined;
  const email = requiredText(value, 'receipt email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new TypeError('receipt email is invalid.');
  }
  return email;
}

function receipt(email, itemDescription, itemAmount) {
  if (!email) return undefined;
  return Object.freeze({
    customer: Object.freeze({ email }),
    items: Object.freeze([Object.freeze({
      description: itemDescription,
      quantity: '1.00',
      amount: itemAmount,
      vat_code: 1,
      payment_mode: 'full_payment',
      payment_subject: 'service'
    })])
  });
}

function metadataValue(value, label) {
  if (value === null) return null;
  if (typeof value === 'string') {
    if (value.length > 512) throw new TypeError(`${label} is invalid.`);
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${label} is invalid.`);
    return value;
  }
  if (typeof value === 'boolean') return value;
  throw new TypeError(`${label} is invalid.`);
}

function metadata(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('metadata is invalid.');
  }
  const entries = Object.entries(value);
  if (entries.length > 32) throw new TypeError('metadata is invalid.');
  return Object.freeze(Object.fromEntries(entries.map(([key, item]) => {
    if (!/^[A-Za-z0-9_-]{1,64}$/u.test(key) || FORBIDDEN_METADATA_KEY.test(key)) {
      throw new TypeError('metadata key is invalid.');
    }
    return [key, metadataValue(item, 'metadata value')];
  })));
}

function booleanOption(value, label, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new TypeError(`${label} must be a boolean.`);
  return value;
}

function timeoutMs(value) {
  if (value === undefined) return DEFAULT_TIMEOUT_MS;
  if (!Number.isSafeInteger(value) || value < 1 || value > 120_000) {
    throw new TypeError('timeout is invalid.');
  }
  return value;
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function timeoutSignal(ms) {
  if (typeof AbortSignal?.timeout === 'function') return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms).unref?.();
  return controller.signal;
}

function isTimeoutError(error) {
  return error?.name === 'TimeoutError' || error?.name === 'AbortError';
}

export function createYooKassaClient({
  shopId: sourceShopId,
  secretKey: sourceSecretKey,
  fetchImpl = globalThis.fetch,
  baseUrl: sourceBaseUrl = DEFAULT_BASE_URL,
  timeoutMs: sourceTimeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  const id = shopId(sourceShopId);
  const key = secretKey(sourceSecretKey);
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation is required.');
  const apiBase = baseUrl(sourceBaseUrl);
  const requestTimeoutMs = timeoutMs(sourceTimeoutMs);
  const authorization = `Basic ${Buffer.from(`${id}:${key}`).toString('base64')}`;

  function url(path) {
    return `${apiBase}${path}`;
  }

  async function request(path, { method = 'GET', idempotenceKey, body } = {}) {
    const headers = { authorization };
    if (idempotenceKey !== undefined) headers['Idempotence-Key'] = safeToken(idempotenceKey, 'idempotence key');
    let payload;
    if (body !== undefined) {
      headers['content-type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetchImpl(url(path), {
        method,
        headers,
        body: payload,
        signal: timeoutSignal(requestTimeoutMs)
      });
    } catch (error) {
      if (isTimeoutError(error)) throw new YooKassaTimeoutError();
      throw new YooKassaNetworkError();
    }

    if (!response?.ok) {
      throw new YooKassaApiError(
        Number(response?.status ?? 0),
        response?.headers?.get?.('request-id') ?? null
      );
    }
    return response.json();
  }

  return Object.freeze({
    async createPayment({
      idempotenceKey,
      amountKopecks,
      description: sourceDescription,
      returnUrl,
      capture = true,
      metadata: sourceMetadata,
      receiptEmail: sourceReceiptEmail
    } = {}) {
      const paymentAmount = amount(amountKopecks);
      const paymentDescription = description(sourceDescription);
      const body = compact({
        amount: paymentAmount,
        capture: booleanOption(capture, 'capture', true),
        confirmation: Object.freeze({
          type: 'redirect',
          return_url: httpsUrl(returnUrl, 'return url')
        }),
        description: paymentDescription,
        metadata: metadata(sourceMetadata),
        receipt: receipt(normalizeReceiptEmail(sourceReceiptEmail), paymentDescription, paymentAmount)
      });
      return request('/v3/payments', { method: 'POST', idempotenceKey, body });
    },

    async getPayment(sourcePaymentId) {
      const id = paymentId(sourcePaymentId);
      return request(`/v3/payments/${encodeURIComponent(id)}`);
    },

    async getSbpBanks() {
      return request('/v3/sbp_banks');
    },

    async createPayout({
      idempotenceKey,
      amountKopecks,
      method,
      payoutToken: sourcePayoutToken,
      phone,
      bankId: sourceBankId,
      description: sourceDescription,
      metadata: sourceMetadata
    } = {}) {
      const payoutRoute = payoutMethod(method);
      const destination = payoutRoute === 'bank_card'
        ? { payout_token: payoutToken(sourcePayoutToken) }
        : {
          payout_destination_data: {
            type: 'sbp',
            phone: payoutPhone(phone),
            bank_id: bankId(sourceBankId)
          }
        };
      const body = compact({
        amount: amount(amountKopecks),
        ...destination,
        description: optionalDescription(sourceDescription),
        metadata: metadata(sourceMetadata)
      });
      return request('/v3/payouts', { method: 'POST', idempotenceKey, body });
    },

    async getPayout(sourcePayoutId) {
      const id = payoutId(sourcePayoutId);
      return request(`/v3/payouts/${encodeURIComponent(id)}`);
    },

    async refundPayment({
      idempotenceKey,
      paymentId: sourcePaymentId,
      amountKopecks,
      description: sourceDescription
    } = {}) {
      const body = compact({
        payment_id: paymentId(sourcePaymentId),
        amount: amount(amountKopecks),
        description: optionalDescription(sourceDescription)
      });
      return request('/v3/refunds', { method: 'POST', idempotenceKey, body });
    }
  });
}
