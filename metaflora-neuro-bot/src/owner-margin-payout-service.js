import { createHash } from 'node:crypto';

const PAYMENT_ID = /^[A-Za-z0-9_-]{1,128}$/u;
const PAYOUT_ID = /^[A-Za-z0-9_-]{1,128}$/u;
const PAYOUT_TOKEN = /^[A-Za-z0-9_.-]{16,256}$/u;

function paymentId(value) {
  const normalized = String(value ?? '').trim();
  if (!PAYMENT_ID.test(normalized)) throw new TypeError('payment id is invalid.');
  return normalized;
}

function ownerShare(value) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError('owner share amount is invalid.');
  }
  return value;
}

function payoutId(value) {
  const normalized = String(value ?? '').trim();
  if (!PAYOUT_ID.test(normalized)) throw new TypeError('external payout id is invalid.');
  return normalized;
}

function payoutToken(value) {
  const normalized = String(value ?? '').trim();
  if (!PAYOUT_TOKEN.test(normalized)) throw new TypeError('owner payout token is invalid.');
  return normalized;
}

function errorCode(error) {
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599) {
    return `yookassa_http_${error.status}`;
  }
  if (error?.name === 'YooKassaTimeoutError') return 'yookassa_timeout';
  if (error?.name === 'YooKassaNetworkError') return 'yookassa_network';
  return 'provider_error';
}

function normalizedStatus(value) {
  const status = String(value ?? '').trim().toLowerCase();
  if (status === 'succeeded') return 'succeeded';
  if (['canceled', 'cancelled'].includes(status)) return 'canceled';
  if (['pending', 'processing', 'waiting_for_capture'].includes(status)) return 'pending';
  return 'failed';
}

function publicResult({
  paymentId: sourcePaymentId,
  ownerShareKopecks,
  status,
  externalPayoutId = null,
  reason = null,
  errorCode: sourceErrorCode = null,
  idempotencyKey
}) {
  return Object.freeze({
    paymentId: sourcePaymentId,
    ownerShareKopecks,
    status,
    externalPayoutId,
    reason,
    errorCode: sourceErrorCode,
    idempotencyKey
  });
}

export function ownerMarginPayoutIdempotencyKey(sourcePaymentId) {
  const normalized = paymentId(sourcePaymentId);
  const digest = createHash('sha256').update(normalized).digest('hex').slice(0, 40);
  return `owner_margin_${digest}`;
}

/**
 * Sends only the already calculated owner_share allocation through the real
 * YooKassa Payouts API. It never reports success without a provider response.
 * Provider credentials and the card token are deliberately kept outside this
 * module, in Railway secrets.
 */
export function createOwnerMarginPayoutService({
  client = null,
  ownerPayoutToken = null,
  enabled = false
} = {}) {
  const state = new Map();

  async function poll({
    sourcePaymentId,
    amountKopecks,
    externalPayoutId,
    idempotencyKey
  }) {
    try {
      if (typeof client?.getPayout !== 'function') {
        return publicResult({
          paymentId: sourcePaymentId,
          ownerShareKopecks: amountKopecks,
          status: 'failed',
          externalPayoutId,
          errorCode: 'not_configured',
          idempotencyKey
        });
      }
      const response = await client.getPayout(externalPayoutId);
      const status = normalizedStatus(response?.status);
      const result = publicResult({
        paymentId: sourcePaymentId,
        ownerShareKopecks: amountKopecks,
        status,
        externalPayoutId,
        errorCode: status === 'failed' ? 'provider_error' : null,
        idempotencyKey
      });
      state.set(sourcePaymentId, result);
      return result;
    } catch (error) {
      return publicResult({
        paymentId: sourcePaymentId,
        ownerShareKopecks: amountKopecks,
        status: 'failed',
        externalPayoutId,
        errorCode: errorCode(error),
        idempotencyKey
      });
    }
  }

  async function processOwnerMarginPayout({
    paymentId: sourcePaymentId,
    ownerShareKopecks: sourceOwnerShareKopecks,
    externalPayoutId: sourceExternalPayoutId = null
  } = {}) {
    const normalizedPaymentId = paymentId(sourcePaymentId);
    const amountKopecks = ownerShare(sourceOwnerShareKopecks);
    const idempotencyKey = ownerMarginPayoutIdempotencyKey(normalizedPaymentId);
    const existingPayoutId = sourceExternalPayoutId
      ? payoutId(sourceExternalPayoutId)
      : state.get(normalizedPaymentId)?.externalPayoutId ?? null;

    if (!enabled) {
      return publicResult({
        paymentId: normalizedPaymentId,
        ownerShareKopecks: amountKopecks,
        status: 'queued',
        reason: 'disabled',
        idempotencyKey
      });
    }
    if (existingPayoutId) {
      return poll({
        sourcePaymentId: normalizedPaymentId,
        amountKopecks,
        externalPayoutId: existingPayoutId,
        idempotencyKey
      });
    }
    if (typeof client?.createPayout !== 'function' || !ownerPayoutToken) {
      return publicResult({
        paymentId: normalizedPaymentId,
        ownerShareKopecks: amountKopecks,
        status: 'failed',
        errorCode: 'not_configured',
        idempotencyKey
      });
    }
    const token = payoutToken(ownerPayoutToken);
    try {
      const response = await client.createPayout({
        idempotenceKey: idempotencyKey,
        amountKopecks,
        method: 'bank_card',
        payoutToken: token,
        description: 'доля владельца',
        metadata: {
          paymentId: normalizedPaymentId,
          payoutType: 'owner_margin'
        }
      });
      if (!response?.id) throw new Error('YooKassa returned no payout id.');
      const providerStatus = normalizedStatus(response.status);
      const result = publicResult({
        paymentId: normalizedPaymentId,
        ownerShareKopecks: amountKopecks,
        status: providerStatus === 'pending' ? 'submitted' : providerStatus,
        externalPayoutId: String(response.id),
        errorCode: providerStatus === 'failed' ? 'provider_error' : null,
        idempotencyKey
      });
      state.set(normalizedPaymentId, result);
      return result;
    } catch (error) {
      return publicResult({
        paymentId: normalizedPaymentId,
        ownerShareKopecks: amountKopecks,
        status: 'failed',
        errorCode: errorCode(error),
        idempotencyKey
      });
    }
  }

  return Object.freeze({ processOwnerMarginPayout });
}
