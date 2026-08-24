function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new TypeError(`${label} is invalid.`);
  return number;
}

function identifier(value, label) {
  const normalized = text(value);
  if (!normalized || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,254}$/.test(normalized)) {
    throw new TypeError(`${label} is invalid.`);
  }
  return normalized;
}

function cleanProvider(value) {
  const provider = text(value).toLowerCase();
  if (!['polza', 'gptunnel', 'routerai'].includes(provider)) {
    throw new TypeError('provider funding provider is invalid.');
  }
  return provider;
}

function requestPayload(value, kind = 'charge', expectedProvider = 'polza') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('provider funding request is required.');
  }
  const provider = cleanProvider(value.provider ?? expectedProvider);
  if (provider !== expectedProvider) {
    throw new TypeError('provider funding provider is invalid.');
  }
  if (kind === 'charge') {
    return Object.freeze({
      provider,
      allocationKey: identifier(value.allocationKey, 'allocationKey'),
      paymentId: identifier(value.paymentId, 'paymentId'),
      amountKopecks: positiveInteger(value.amountKopecks, 'amountKopecks'),
      currency: 'RUB',
      idempotencyKey: identifier(value.idempotencyKey, 'idempotencyKey')
    });
  }
  if (kind === 'verify') {
    return Object.freeze({
      provider,
      transactionId: identifier(value.transactionId, 'transactionId'),
      expectedAmountKopecks: positiveInteger(value.expectedAmountKopecks, 'expectedAmountKopecks'),
      currency: 'RUB'
    });
  }
  return Object.freeze({ provider });
}

function batchRequestPayload(value, expectedProvider = 'polza') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('provider funding batch is required.');
  }
  const provider = cleanProvider(value.provider || expectedProvider);
  if (provider !== expectedProvider) throw new TypeError('provider funding batch provider is invalid.');
  const requests = Array.isArray(value.requests) ? value.requests.map((item) => requestPayload(item, 'charge', provider)) : [];
  if (requests.length < 2 || requests.length > 50) {
    throw new TypeError('provider funding batch size is invalid.');
  }
  const amountKopecks = positiveInteger(value.amountKopecks, 'batch amountKopecks');
  if (requests.reduce((total, item) => total + item.amountKopecks, 0) !== amountKopecks) {
    throw new TypeError('provider funding batch amount does not match its requests.');
  }
  const batchId = identifier(value.batchId, 'batchId');
  const idempotencyKey = identifier(value.idempotencyKey, 'batch idempotencyKey');
  return Object.freeze({
    provider,
    batchId,
    amountKopecks,
    currency: 'RUB',
    idempotencyKey,
    requests: Object.freeze(requests)
  });
}

function responseErrorCode(body, status) {
  const value = text(body?.error).toLowerCase();
  if (/^[a-z][a-z0-9_-]{1,63}$/.test(value)) return value;
  return status >= 500 ? 'crm_funding_unavailable' : 'crm_funding_rejected';
}

export class CrmBrowserFundingError extends Error {
  constructor(code = 'crm_funding_failed', message = 'CRM browser funding failed.', {
    retryable = false,
    userActionRequired = false,
    externalChargeStarted = null,
    retryAfterSeconds = null
  } = {}) {
    super(message);
    this.name = 'CrmBrowserFundingError';
    this.code = code;
    this.retryable = retryable;
    this.userActionRequired = userActionRequired;
    if (externalChargeStarted === false) this.externalChargeStarted = false;
    if (Number.isSafeInteger(retryAfterSeconds) && retryAfterSeconds > 0) {
      this.retryAfterSeconds = Math.min(retryAfterSeconds, 86_400);
    }
  }
}

export function createCrmBrowserFundingClient({
  baseUrl,
  token,
  provider = 'polza',
  fetchImpl = globalThis.fetch,
  timeoutMs = 240_000
} = {}) {
  const normalizedBaseUrl = text(baseUrl);
  const secret = text(token);
  const configuredProvider = cleanProvider(provider);
  if (!normalizedBaseUrl) throw new TypeError('CRM browser funding URL is required.');
  if (!secret) throw new TypeError('CRM browser funding token is required.');
  let origin;
  try {
    origin = new URL(normalizedBaseUrl);
  } catch {
    throw new TypeError('CRM browser funding URL is invalid.');
  }
  if (origin.protocol !== 'https:') throw new TypeError('CRM browser funding URL must use HTTPS.');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl is required.');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 5_000 || timeoutMs > 300_000) {
    throw new RangeError('CRM browser funding timeout is invalid.');
  }

  async function call(operation, payload) {
    let response;
    try {
      response = await fetchImpl(new URL(`/api/internal/provider-funding/${operation}`, origin), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (error) {
      throw new CrmBrowserFundingError('crm_funding_unavailable', 'CRM funding connector is unreachable.', {
        retryable: true
      });
    }
    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    if (!response.ok || body?.success !== true) {
      const code = responseErrorCode(body, response.status);
      throw new CrmBrowserFundingError(code, 'CRM funding connector rejected the operation.', {
        retryable: response.status >= 500 && code !== 'charge_result_unknown',
        userActionRequired: body?.userActionRequired === true,
        externalChargeStarted: body?.externalChargeStarted === false ? false : null,
        retryAfterSeconds: Number.isSafeInteger(Number(body?.retryAfterSeconds))
          ? Number(body.retryAfterSeconds)
          : null
      });
    }
    return body.data ?? {};
  }

  return Object.freeze({
    async charge(request) {
      const result = await call('charge', requestPayload(request, 'charge', configuredProvider));
      const transactionId = identifier(result.transactionId, 'transactionId');
      return Object.freeze({ transactionId });
    },
    async chargeBatch(request) {
      if (configuredProvider === 'routerai') {
        throw new CrmBrowserFundingError(
          'provider_batch_forbidden',
          'RouterAI does not support batch funding.',
          { retryable: false, externalChargeStarted: false }
        );
      }
      const payload = batchRequestPayload(request, configuredProvider);
      const result = await call('charge-batch', payload);
      const transactionId = identifier(result.transactionId, 'transactionId');
      return Object.freeze({ transactionId });
    },
    async verifyTransaction(request) {
      const result = await call('verify', requestPayload(request, 'verify', configuredProvider));
      return Object.freeze({
        transactionId: identifier(result.transactionId, 'transactionId'),
        amountKopecks: positiveInteger(result.amountKopecks, 'amountKopecks'),
        currency: 'RUB'
      });
    },
    async getBalance(request = { provider: configuredProvider }) {
      const result = await call('balance', requestPayload(request, 'balance', configuredProvider));
      return Object.freeze({
        balanceKopecks: Number.isSafeInteger(Number(result.balanceKopecks)) && Number(result.balanceKopecks) >= 0
          ? Number(result.balanceKopecks)
          : (() => { throw new CrmBrowserFundingError('verification_failed', 'Provider balance is invalid.'); })(),
        currency: 'RUB'
      });
    },
    async getStatus() {
      const result = await call('status', { provider: configuredProvider });
      const allowed = (value, fallback) => {
        const normalized = text(value);
        return normalized || fallback;
      };
      return Object.freeze({
        persistent: result.persistent === true,
        profileMode: allowed(result.profileMode, 'persistent'),
        authorization: allowed(result.authorization, 'unknown'),
        automation: allowed(result.automation, 'unknown'),
        cardEnrollment: allowed(result.cardEnrollment, 'unknown'),
        // Readiness requires an explicit connector guarantee that no login is
        // needed per charge; missing/unknown state remains fail-closed.
        loginPerPayment: result.loginPerPayment !== false,
        ...(allowed(result.probeErrorCode, '') ? { probeErrorCode: allowed(result.probeErrorCode, '') } : {})
      });
    }
  });
}
