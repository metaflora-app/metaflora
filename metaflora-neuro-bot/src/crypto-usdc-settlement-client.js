function text(value, label, maximum = 255) {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.length > maximum) throw new TypeError(`${label} is invalid`);
  return normalized;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new TypeError(`${label} is invalid`);
  return number;
}

function errorCode(body, status) {
  const value = String(body?.error ?? '').trim().toLowerCase();
  if (/^[a-z][a-z0-9_]{1,63}$/u.test(value)) return value;
  return status >= 500 ? 'settlement_unavailable' : 'settlement_rejected';
}

export function createCryptoUsdcSettlementClient({
  baseUrl,
  token,
  fetchImpl = globalThis.fetch,
  timeoutMs = 240_000
} = {}) {
  const secret = text(token, 'settlement token', 512);
  const endpoint = new URL('/api/internal/provider-funding/settle-usdc', text(baseUrl, 'settlement URL', 2_048));
  if (endpoint.protocol !== 'https:') throw new TypeError('settlement URL must use HTTPS');
  if (typeof fetchImpl !== 'function') throw new TypeError('settlement fetch is required');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 5_000 || timeoutMs > 300_000) {
    throw new RangeError('settlement timeout is invalid');
  }

  return Object.freeze({
    async settleCryptoSale(sale) {
      let response;
      try {
        response = await fetchImpl(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${secret}`
          },
          body: JSON.stringify(sale),
          signal: AbortSignal.timeout(timeoutMs)
        });
      } catch (cause) {
        throw Object.assign(new Error('USDC settlement connector is unreachable', { cause }), {
          code: 'settlement_unavailable'
        });
      }
      let body = {};
      try { body = await response.json(); } catch { body = {}; }
      if (!response.ok || body?.success !== true || !body?.data) {
        throw Object.assign(new Error('USDC settlement connector rejected the operation'), {
          code: errorCode(body, response.status)
        });
      }
      return Object.freeze({
        openrouterFundedUsdcMicros: positiveInteger(
          body.data.openrouterFundedUsdcMicros,
          'OpenRouter funded amount'
        ),
        ownerPaidUsdcMicros: positiveInteger(body.data.ownerPaidUsdcMicros, 'owner paid amount'),
        ownerTransactionHash: text(body.data.ownerTransactionHash, 'owner transaction hash', 66),
        openrouterTransactionId: text(body.data.openrouterTransactionId, 'OpenRouter transaction ID', 180)
      });
    }
  });
}
