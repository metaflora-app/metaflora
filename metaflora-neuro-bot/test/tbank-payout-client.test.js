import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';

import { createTBankPayoutClient } from '../src/tbank-payout-client.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const credentials = {
  terminalKey: '123456789000E2C',
  privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
  certificateSerialNumber: '2613832945',
  notificationPassword: 'notification-secret-that-is-long-enough'
};

function okJson(body) {
  return { ok: true, status: 200, headers: { get: () => null }, json: async () => body };
}

test('T-Business SBP payout follows Init then Payment with signed idempotent OrderId', async () => {
  const calls = [];
  const client = createTBankPayoutClient({
    ...credentials,
    fetchImpl: async (url, request) => {
      const body = JSON.parse(request.body);
      calls.push({ url, body });
      if (url.endsWith('/a2c/sbp/v2/Init')) {
        return okJson({ Success: true, Status: 'CHECKED', PaymentId: '2353039', OrderId: body.OrderId });
      }
      return okJson({ Success: true, Status: 'COMPLETING', PaymentId: body.PaymentId });
    }
  });

  const result = await client.createPayout({
    idempotenceKey: 'payout:withdrawal-123',
    amountKopecks: 150_000,
    method: 'sbp',
    phone: '79012345678',
    bankId: '100000000004',
    description: 'партнёрское вознаграждение'
  });

  assert.equal(result.id, '2353039');
  assert.equal(result.status, 'pending');
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /\/a2c\/sbp\/v2\/Init$/u);
  assert.equal(calls[0].body.OrderId, 'payout:withdrawal-123');
  assert.equal(calls[0].body.PhoneNumber, '79012345678');
  assert.equal(calls[0].body.SbpMemberId, 100000000004);
  assert.equal(calls[0].body.Amount, 150_000);
  assert.equal(calls[0].body.X509SerialNumber, '2613832945');
  assert.match(calls[0].body.DigestValue, /^[A-Za-z0-9+/]+=*$/u);
  assert.match(calls[0].body.SignatureValue, /^[A-Za-z0-9+/]+=*$/u);
  assert.equal(calls[1].body.PaymentId, '2353039');
});

test('T-Business maps UUID withdrawal keys into the provider 36-character OrderId limit', async () => {
  const orders = [];
  const client = createTBankPayoutClient({
    ...credentials,
    fetchImpl: async (url, request) => {
      const body = JSON.parse(request.body);
      if (url.endsWith('/Init')) orders.push(body.OrderId);
      return okJson(url.endsWith('/Init')
        ? { Success: true, ErrorCode: '0', Status: 'CHECKED', PaymentId: '2353039' }
        : { Success: true, ErrorCode: '0', Status: 'COMPLETING', PaymentId: '2353039' });
    }
  });
  await client.createPayout({
    idempotenceKey: 'payout:123e4567-e89b-12d3-a456-426614174000',
    amountKopecks: 100_000, method: 'sbp', phone: '79012345678', bankId: '100000000004'
  });
  assert.deepEqual(orders, ['p_123e4567e89b12d3a456426614174000']);
});

test('T-Business payout status and bank directory are normalized', async () => {
  const client = createTBankPayoutClient({
    ...credentials,
    fetchImpl: async (url) => url.endsWith('/a2c/sbp/GetState')
      ? okJson({ Success: true, Status: 'COMPLETED', PaymentId: '2353039', Amount: 150_000 })
      : okJson({ Success: true, Members: [{ MemberId: '100000000027', MemberNameRus: 'Тест Банк' }] })
  });

  assert.deepEqual(await client.getPayout('2353039'), {
    id: '2353039', status: 'succeeded', amount: { value: '1500.00', currency: 'RUB' }, errorCode: null
  });
  assert.deepEqual(await client.getSbpBanks(), [{ bank_id: '100000000027', name: 'Тест Банк' }]);
});

test('an unfamiliar provider status remains pending instead of releasing the payout', async () => {
  const client = createTBankPayoutClient({
    ...credentials,
    fetchImpl: async () => okJson({ Success: true, Status: 'BANK_REVIEW', PaymentId: '2353039', Amount: 150_000 })
  });

  assert.equal((await client.getPayout('2353039')).status, 'pending');
});

test('T-Business rejects card payouts because tokenized-card payouts are unsupported', async () => {
  const client = createTBankPayoutClient({ ...credentials, fetchImpl: async () => assert.fail('no request') });
  await assert.rejects(() => client.createPayout({
    idempotenceKey: 'payout:withdrawal-123', amountKopecks: 100_000, method: 'bank_card', payoutToken: 'safe.token-123456789'
  }), /SBP/u);
});

test('T-Business webhook token is verified in constant-time compatible form and payload is normalized', () => {
  const client = createTBankPayoutClient({ ...credentials, fetchImpl: async () => assert.fail('no request') });
  const payload = {
    TerminalKey: credentials.terminalKey,
    OrderId: 'payout:withdrawal-123',
    Success: true,
    Status: 'COMPLETED',
    PaymentId: '2353039',
    ErrorCode: '0',
    Amount: 150000,
    SbpId: 'extra-field-does-not-participate'
  };
  payload.Token = createHash('sha256').update([
    payload.Amount, payload.ErrorCode, payload.OrderId, credentials.notificationPassword,
    payload.PaymentId, payload.Status, payload.Success, payload.TerminalKey
  ].join('')).digest('hex');

  assert.deepEqual(client.verifyNotification(payload), {
    id: '2353039', orderId: 'payout:withdrawal-123', withdrawalId: 'withdrawal-123',
    status: 'succeeded', amountKopecks: 150000, errorCode: null
  });
  assert.throws(() => client.verifyNotification({ ...payload, Token: '0'.repeat(64) }), /signature/u);
  assert.throws(() => client.verifyNotification({ ...payload, TerminalKey: 'attacker' }), /terminal/u);
});

test('T-Business client rejects provider errors without leaking response details', async () => {
  const client = createTBankPayoutClient({
    ...credentials,
    fetchImpl: async () => okJson({ Success: false, ErrorCode: 'SBP_001', Details: 'sensitive' })
  });
  await assert.rejects(() => client.getPayout('2353039'), (error) => {
    assert.equal(error.name, 'TBankPayoutApiError');
    assert.equal(error.code, 'SBP_001');
    assert.doesNotMatch(error.message, /sensitive/u);
    return true;
  });
});
