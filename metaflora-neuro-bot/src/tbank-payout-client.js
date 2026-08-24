import { createHash, sign, timingSafeEqual } from 'node:crypto';

const DEFAULT_BASE_URL = 'https://securepay.tinkoff.ru';
const DEFAULT_TIMEOUT_MS = 15_000;
const SAFE_ID = /^[A-Za-z0-9_.:-]{1,128}$/u;
const PAYMENT_ID = /^[A-Za-z0-9_-]{1,128}$/u;
const TERMINAL_KEY = /^[A-Za-z0-9_-]{8,32}$/u;

export class TBankPayoutApiError extends Error {
  constructor(code = 'provider_error', status = null) {
    super('T-Business payout request failed.');
    this.name = 'TBankPayoutApiError';
    this.code = String(code).replace(/[^A-Za-z0-9_.-]/gu, '').slice(0, 64) || 'provider_error';
    this.status = status;
  }
}

export class TBankPayoutTimeoutError extends Error {
  constructor() { super('T-Business payout request timed out.'); this.name = 'TBankPayoutTimeoutError'; }
}

export class TBankPayoutNetworkError extends Error {
  constructor() { super('T-Business payout request failed.'); this.name = 'TBankPayoutNetworkError'; }
}

function required(value, label, maximum = 4096) {
  const text = String(value ?? '').trim();
  if (!text || text.length > maximum) throw new TypeError(`${label} is invalid.`);
  return text;
}

function normalizeBaseUrl(value) {
  const url = new URL(value ?? DEFAULT_BASE_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new TypeError('T-Business payout base URL is invalid.');
  }
  return url.toString().replace(/\/$/u, '');
}

function normalizePhone(value) {
  const phone = String(value ?? '').replace(/[\s()+-]/gu, '');
  if (/^8\d{10}$/u.test(phone)) return `7${phone.slice(1)}`;
  if (!/^7\d{10}$/u.test(phone)) throw new TypeError('payout phone is invalid.');
  return phone;
}

function normalizeBankId(value) {
  const id = String(value ?? '').trim();
  if (!/^\d{6,18}$/u.test(id)) throw new TypeError('SBP member id is invalid.');
  const number = Number(id);
  if (!Number.isSafeInteger(number)) throw new TypeError('SBP member id is invalid.');
  return number;
}

function normalizeAmount(value) {
  if (!Number.isSafeInteger(value) || value < 100 || value > 100_000_000_00) {
    throw new TypeError('payout amount is invalid.');
  }
  return value;
}

function normalizedStatus(value) {
  switch (String(value ?? '').toUpperCase()) {
    case 'COMPLETED': return 'succeeded';
    case 'REJECTED': case 'CANCELED': case 'CANCELLED': return 'canceled';
    case 'CHECKED': case 'COMPLETING': case 'FORM_SHOWED': return 'pending';
    default: return 'pending';
  }
}

function orderId(value) {
  const source = String(value ?? '');
  const uuid = source.match(/^payout:([a-f0-9]{8})-([a-f0-9]{4})-([a-f0-9]{4})-([a-f0-9]{4})-([a-f0-9]{12})$/iu);
  if (uuid) return `p_${uuid.slice(1).join('').toLowerCase()}`;
  if (!SAFE_ID.test(source) || source.length > 36) throw new TypeError('idempotence key is invalid.');
  return source;
}

function withdrawalIdFromOrder(value) {
  const source = String(value ?? '');
  const compactUuid = source.match(/^p_([a-f0-9]{32})$/u)?.[1];
  if (compactUuid) {
    return `${compactUuid.slice(0, 8)}-${compactUuid.slice(8, 12)}-${compactUuid.slice(12, 16)}-${compactUuid.slice(16, 20)}-${compactUuid.slice(20)}`;
  }
  return source.match(/^payout:([A-Za-z0-9_-]{8,128})$/u)?.[1] ?? null;
}

function signableEntries(payload) {
  return Object.entries(payload)
    .filter(([key, value]) => !['DATA', 'DigestValue', 'SignatureValue', 'X509SerialNumber', 'Token'].includes(key)
      && value !== undefined && value !== null && typeof value !== 'object')
    .sort(([left], [right]) => left.localeCompare(right, 'en', { sensitivity: 'variant' }));
}

function signedBody(payload, { privateKeyPem, certificateSerialNumber }) {
  const source = signableEntries(payload).map(([, value]) => String(value)).join('');
  const digest = createHash('sha256').update(source).digest();
  return Object.freeze({
    ...payload,
    DigestValue: digest.toString('base64'),
    SignatureValue: sign('RSA-SHA256', Buffer.from(source), privateKeyPem).toString('base64'),
    X509SerialNumber: certificateSerialNumber
  });
}

function timeoutSignal(milliseconds) {
  return AbortSignal.timeout(milliseconds);
}

export function createTBankPayoutClient({
  terminalKey: sourceTerminalKey,
  privateKeyPem: sourcePrivateKey,
  publicKeyPem: sourcePublicKey,
  certificateSerialNumber: sourceSerial,
  notificationPassword: sourceNotificationPassword,
  fetchImpl = globalThis.fetch,
  baseUrl = DEFAULT_BASE_URL,
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  const terminalKey = required(sourceTerminalKey, 'terminal key', 32);
  if (!TERMINAL_KEY.test(terminalKey)) throw new TypeError('terminal key is invalid.');
  const privateKeyPem = required(sourcePrivateKey, 'private key', 16_384);
  const publicKeyPem = sourcePublicKey ? required(sourcePublicKey, 'public key', 16_384) : '';
  const certificateSerialNumber = required(sourceSerial, 'certificate serial number', 128);
  if (!/^\d{1,128}$/u.test(certificateSerialNumber)) throw new TypeError('certificate serial number is invalid.');
  const notificationPassword = required(sourceNotificationPassword, 'notification password', 256);
  if (Buffer.byteLength(notificationPassword, 'utf8') < 20) throw new TypeError('notification password is too short.');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation is required.');
  const apiBase = normalizeBaseUrl(baseUrl);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120_000) throw new TypeError('timeout is invalid.');

  async function request(path, payload) {
    let response;
    try {
      response = await fetchImpl(`${apiBase}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(signedBody({ TerminalKey: terminalKey, ...payload }, { privateKeyPem, certificateSerialNumber })),
        signal: timeoutSignal(timeoutMs)
      });
    } catch (error) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw new TBankPayoutTimeoutError();
      throw new TBankPayoutNetworkError();
    }
    if (!response?.ok) throw new TBankPayoutApiError(`http_${Number(response?.status ?? 0)}`, Number(response?.status ?? 0));
    let body;
    try { body = await response.json(); } catch { throw new TBankPayoutApiError('invalid_response'); }
    if (!body || typeof body !== 'object' || body.Success !== true || String(body.ErrorCode ?? '0') !== '0') {
      throw new TBankPayoutApiError(body?.ErrorCode ?? 'provider_error');
    }
    return body;
  }

  function normalizeResponse(body) {
    const id = String(body?.PaymentId ?? '');
    if (!PAYMENT_ID.test(id)) throw new TBankPayoutApiError('invalid_payment_id');
    const amount = Number(body?.Amount);
    return Object.freeze({
      id,
      status: normalizedStatus(body.Status),
      ...(Number.isSafeInteger(amount) && amount > 0
        ? { amount: Object.freeze({ value: (amount / 100).toFixed(2), currency: 'RUB' }) }
        : {}),
      errorCode: String(body?.ErrorCode ?? '0') === '0' ? null : String(body.ErrorCode).slice(0, 64)
    });
  }

  return Object.freeze({
    async createPayout({ idempotenceKey, amountKopecks, method, phone, bankId, description } = {}) {
      if (method !== 'sbp') throw new TypeError('T-Business automatic payouts support SBP only.');
      const providerOrderId = orderId(idempotenceKey);
      const init = await request('/a2c/sbp/v2/Init', {
        OrderId: providerOrderId,
        PhoneNumber: normalizePhone(phone),
        SbpMemberId: normalizeBankId(bankId),
        Amount: normalizeAmount(amountKopecks),
        DATA: description ? { PaymentPurposeDetails: required(description, 'description', 210) } : undefined
      });
      const status = normalizedStatus(init.Status);
      if (status !== 'pending') return normalizeResponse(init);
      const paymentId = String(init.PaymentId ?? '');
      if (!PAYMENT_ID.test(paymentId)) throw new TBankPayoutApiError('invalid_payment_id');
      return normalizeResponse(await request('/a2c/sbp/v2/Payment', { PaymentId: paymentId }));
    },

    async getPayout(value) {
      const id = String(value ?? '');
      if (!PAYMENT_ID.test(id)) throw new TypeError('payout id is invalid.');
      return normalizeResponse(await request('/a2c/sbp/GetState', { PaymentId: id }));
    },

    async getSbpBanks() {
      const body = await request('/a2c/sbp/GetSbpMembers', {});
      const members = Array.isArray(body.Members) ? body.Members : [];
      return Object.freeze(members.slice(0, 1_000).map((item) => Object.freeze({
        bank_id: String(item.MemberId ?? ''),
        name: String(item.MemberNameRus ?? item.MemberName ?? '').replace(/[\u0000-\u001f\u007f]/gu, '').slice(0, 120)
      })).filter(({ bank_id: id, name }) => /^\d{6,18}$/u.test(id) && name));
    },

    verifyNotification(payload) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new TypeError('notification payload is invalid.');
      if (payload.TerminalKey !== terminalKey) throw new Error('T-Business notification terminal is invalid.');
      const token = String(payload.Token ?? '').toLowerCase();
      if (!/^[a-f0-9]{64}$/u.test(token)) throw new Error('T-Business notification signature is invalid.');
      const signedNotification = {
        TerminalKey: payload.TerminalKey,
        OrderId: payload.OrderId,
        Success: payload.Success,
        Status: payload.Status,
        PaymentId: payload.PaymentId,
        ErrorCode: payload.ErrorCode,
        Amount: payload.Amount,
        Password: notificationPassword
      };
      const source = signableEntries(signedNotification).map(([, value]) => String(value)).join('');
      const expected = createHash('sha256').update(source).digest('hex');
      if (!timingSafeEqual(Buffer.from(token, 'ascii'), Buffer.from(expected, 'ascii'))) {
        throw new Error('T-Business notification signature is invalid.');
      }
      const providerOrderId = String(payload.OrderId ?? '');
      const withdrawalId = withdrawalIdFromOrder(providerOrderId);
      if (!withdrawalId) throw new Error('T-Business notification order is invalid.');
      const id = String(payload.PaymentId ?? '');
      if (!PAYMENT_ID.test(id)) throw new Error('T-Business notification payout id is invalid.');
      const amountKopecks = Number(payload.Amount);
      if (!Number.isSafeInteger(amountKopecks) || amountKopecks <= 0) throw new Error('T-Business notification amount is invalid.');
      return Object.freeze({
        id, orderId: providerOrderId, withdrawalId, status: normalizedStatus(payload.Status), amountKopecks,
        errorCode: String(payload.ErrorCode ?? '0') === '0' ? null : String(payload.ErrorCode).replace(/[^A-Za-z0-9_.-]/gu, '').slice(0, 64)
      });
    },

    publicKeyPem
  });
}
