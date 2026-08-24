import assert from 'node:assert/strict';
import test from 'node:test';

import {
  YooKassaApiError,
  YooKassaTimeoutError,
  createYooKassaClient
} from '../src/yookassa-client.js';

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) }
  });
}

function recorder(responses) {
  const calls = [];
  return {
    calls,
    fetch: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      const response = responses.shift();
      if (!response) throw new Error('unexpected request');
      return response;
    }
  };
}

test('client uses Basic auth, built-in-compatible fetch and keeps secrets out of URLs', async () => {
  assert.throws(
    () => createYooKassaClient({ shopId: '', secretKey: 'secret', fetchImpl: async () => {} }),
    /shop id/i
  );
  assert.throws(
    () => createYooKassaClient({ shopId: '123', secretKey: ' ', fetchImpl: async () => {} }),
    /secret key/i
  );
  assert.throws(
    () => createYooKassaClient({ shopId: '123', secretKey: 'secret', fetchImpl: null }),
    /fetch/i
  );

  const recorded = recorder([jsonResponse({ id: 'payment-1', status: 'pending' })]);
  const client = createYooKassaClient({
    shopId: ' 123456 ',
    secretKey: ' test-secret ',
    fetchImpl: recorded.fetch
  });

  await client.createPayment({
    idempotenceKey: 'order_100',
    amountKopecks: 74_900,
    description: 'тариф автор на 1 месяц',
    returnUrl: 'https://metaflora.example/payments/return',
    metadata: { telegramUserId: '10', productId: 'author' }
  });

  const [{ url, init }] = recorded.calls;
  assert.equal(url, 'https://api.yookassa.ru/v3/payments');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.authorization, `Basic ${Buffer.from('123456:test-secret').toString('base64')}`);
  assert.equal(init.headers['Idempotence-Key'], 'order_100');
  assert.equal(init.headers['content-type'], 'application/json');
  assert.ok(init.signal instanceof AbortSignal);
  assert.doesNotMatch(url, /test-secret|123456/u);
});

test('createPayment sends a strict redirect payment body without receipt or customer data', async () => {
  const recorded = recorder([jsonResponse({ id: 'payment-1', confirmation: { confirmation_url: 'https://pay.test' } })]);
  const client = createYooKassaClient({ shopId: '123456', secretKey: 'secret', fetchImpl: recorded.fetch });

  const result = await client.createPayment({
    idempotenceKey: 'checkout_abc-123',
    amountKopecks: 129_000,
    description: '400 метакоинов',
    returnUrl: 'https://metaflora.example/paid',
    capture: true,
    metadata: {
      telegramUserId: '10',
      productType: 'metacoins',
      productId: 'coins_400'
    }
  });

  assert.equal(result.id, 'payment-1');
  assert.deepEqual(JSON.parse(recorded.calls[0].init.body), {
    amount: { value: '1290.00', currency: 'RUB' },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: 'https://metaflora.example/paid'
    },
    description: '400 метакоинов',
    metadata: {
      telegramUserId: '10',
      productType: 'metacoins',
      productId: 'coins_400'
    }
  });
  assert.doesNotMatch(recorded.calls[0].init.body, /receipt|customer|email|phone/i);
});

test('fiscal receipt rejection never retries checkout with fabricated customer data', async () => {
  const recorded = recorder([jsonResponse({
    type: 'error',
    id: 'invalid_request',
    code: 'invalid_request',
    description: 'Receipt is missing or illegal',
    parameter: 'receipt'
  }, { status: 400, headers: { 'request-id': 'fiscal-400' } })]);
  const client = createYooKassaClient({ shopId: '123456', secretKey: 'secret', fetchImpl: recorded.fetch });

  await assert.rejects(
    () => client.createPayment({
      idempotenceKey: 'checkout_without_contact',
      amountKopecks: 19_900,
      description: '50 метакоинов',
      returnUrl: 'https://metaflora.example/paid'
    }),
    (error) => {
      assert.ok(error instanceof YooKassaApiError);
      assert.equal(error.status, 400);
      assert.equal(error.requestId, 'fiscal-400');
      return true;
    }
  );

  assert.equal(recorded.calls.length, 1);
  assert.doesNotMatch(recorded.calls[0].init.body, /receipt|customer|email|phone/i);
});

test('createPayment includes a fiscal receipt only when a validated customer email is supplied', async () => {
  const recorded = recorder([jsonResponse({ id: 'payment-2', confirmation: { confirmation_url: 'https://pay.test' } })]);
  const client = createYooKassaClient({ shopId: '123456', secretKey: 'secret', fetchImpl: recorded.fetch });

  await client.createPayment({
    idempotenceKey: 'checkout_receipt_2',
    amountKopecks: 19_900,
    description: '50 метакоинов',
    returnUrl: 'https://metaflora.example/paid',
    receiptEmail: 'buyer@example.com'
  });

  assert.deepEqual(JSON.parse(recorded.calls[0].init.body).receipt, {
    customer: { email: 'buyer@example.com' },
    items: [{
      description: '50 метакоинов',
      quantity: '1.00',
      amount: { value: '199.00', currency: 'RUB' },
      vat_code: 1,
      payment_mode: 'full_payment',
      payment_subject: 'service'
    }]
  });
});

test('temporary tariff receipt carries the exact 140 ruble service line', async () => {
  const recorded = recorder([jsonResponse({ id: 'test-payment-140', confirmation: { confirmation_url: 'https://pay.test' } })]);
  const client = createYooKassaClient({ shopId: '123456', secretKey: 'secret', fetchImpl: recorded.fetch });

  await client.createPayment({
    idempotenceKey: 'test_tariff_receipt_140',
    amountKopecks: 14_000,
    description: 'тариф «тестовый» на 1 месяц',
    returnUrl: 'https://metaflora.example/paid',
    receiptEmail: 'buyer@example.com',
    metadata: {
      productKind: 'plan',
      productId: 'test_140',
      metacoins: '100',
      amountKopecks: '14000'
    }
  });

  const body = JSON.parse(recorded.calls[0].init.body);
  assert.deepEqual(body.receipt.items, [{
    description: 'тариф «тестовый» на 1 месяц',
    quantity: '1.00',
    amount: { value: '140.00', currency: 'RUB' },
    vat_code: 1,
    payment_mode: 'full_payment',
    payment_subject: 'service'
  }]);
  assert.deepEqual(body.metadata, {
    productKind: 'plan',
    productId: 'test_140',
    metacoins: '100',
    amountKopecks: '14000'
  });
});

test('getPayment and refundPayment call the documented resources with idempotent refund', async () => {
  const recorded = recorder([
    jsonResponse({ id: '2f8f0000-0000-0000-0000-000000000001', status: 'succeeded' }),
    jsonResponse({ id: 'refund-1', status: 'succeeded' })
  ]);
  const client = createYooKassaClient({ shopId: '123456', secretKey: 'secret', fetchImpl: recorded.fetch });

  await client.getPayment('2f8f0000-0000-0000-0000-000000000001');
  await client.refundPayment({
    idempotenceKey: 'refund_100',
    paymentId: '2f8f0000-0000-0000-0000-000000000001',
    amountKopecks: 19_900,
    description: 'возврат покупки'
  });

  assert.equal(recorded.calls[0].url, 'https://api.yookassa.ru/v3/payments/2f8f0000-0000-0000-0000-000000000001');
  assert.equal(recorded.calls[0].init.method, 'GET');
  assert.equal(recorded.calls[0].init.headers['Idempotence-Key'], undefined);
  assert.equal(recorded.calls[1].url, 'https://api.yookassa.ru/v3/refunds');
  assert.equal(recorded.calls[1].init.method, 'POST');
  assert.equal(recorded.calls[1].init.headers['Idempotence-Key'], 'refund_100');
  assert.deepEqual(JSON.parse(recorded.calls[1].init.body), {
    payment_id: '2f8f0000-0000-0000-0000-000000000001',
    amount: { value: '199.00', currency: 'RUB' },
    description: 'возврат покупки'
  });
});

test('client rejects unsafe values before sending requests', async () => {
  const recorded = recorder([]);
  const client = createYooKassaClient({ shopId: '123456', secretKey: 'secret', fetchImpl: recorded.fetch });

  assert.rejects(
    () => client.createPayment({
      idempotenceKey: 'bad key with spaces',
      amountKopecks: 100,
      description: 'ok',
      returnUrl: 'https://metaflora.example'
    }),
    /idempotence/i
  );
  assert.rejects(
    () => client.createPayment({
      idempotenceKey: 'ok-key',
      amountKopecks: 0,
      description: 'ok',
      returnUrl: 'https://metaflora.example'
    }),
    /amount/i
  );
  assert.rejects(
    () => client.createPayment({
      idempotenceKey: 'ok-key',
      amountKopecks: 100,
      description: 'ok',
      returnUrl: 'http://metaflora.example'
    }),
    /return url/i
  );
  assert.rejects(
    () => client.getPayment('../secret'),
    /payment id/i
  );
  assert.equal(recorded.calls.length, 0);
});

test('payout client creates an SBP payout with a stable idempotence key', async () => {
  const recorded = recorder([jsonResponse({ id: 'payout-1', status: 'pending' })]);
  const client = createYooKassaClient({
    shopId: '123456',
    secretKey: 'secret',
    fetchImpl: recorded.fetch
  });

  await client.createPayout({
    idempotenceKey: 'payout_withdrawal-1',
    amountKopecks: 100_000,
    method: 'sbp',
    phone: '+79990000000',
    bankId: '100000000111',
    description: 'партнёрское вознаграждение',
    metadata: { withdrawalId: 'withdrawal-1' }
  });

  const [{ url, init }] = recorded.calls;
  assert.equal(url, 'https://api.yookassa.ru/v3/payouts');
  assert.equal(init.headers['Idempotence-Key'], 'payout_withdrawal-1');
  assert.deepEqual(JSON.parse(init.body), {
    amount: { value: '1000.00', currency: 'RUB' },
    payout_destination_data: {
      type: 'sbp',
      phone: '79990000000',
      bank_id: '100000000111'
    },
    description: 'партнёрское вознаграждение',
    metadata: { withdrawalId: 'withdrawal-1' }
  });
});

test('payout client uses a YooKassa widget token for card payouts and reads payout status', async () => {
  const recorded = recorder([
    jsonResponse({ id: 'payout-2', status: 'succeeded' }),
    jsonResponse({ id: 'payout-2', status: 'succeeded' })
  ]);
  const client = createYooKassaClient({
    shopId: '123456',
    secretKey: 'secret',
    fetchImpl: recorded.fetch
  });

  await client.createPayout({
    idempotenceKey: 'payout_withdrawal-2',
    amountKopecks: 500,
    method: 'bank_card',
    payoutToken: 'synonym.token-1234567890',
    description: 'партнёрское вознаграждение'
  });
  await client.getPayout('payout-2');

  assert.equal(recorded.calls[1].url, 'https://api.yookassa.ru/v3/payouts/payout-2');
  assert.deepEqual(JSON.parse(recorded.calls[0].init.body), {
    amount: { value: '5.00', currency: 'RUB' },
    payout_token: 'synonym.token-1234567890',
    description: 'партнёрское вознаграждение'
  });
});

test('payout client validates destination data before contacting YooKassa', async () => {
  const recorded = recorder([]);
  const client = createYooKassaClient({
    shopId: '123456',
    secretKey: 'secret',
    fetchImpl: recorded.fetch
  });

  await assert.rejects(
    client.createPayout({
      idempotenceKey: 'payout_bad',
      amountKopecks: 500,
      method: 'bank_card',
      payoutToken: 'too-short'
    }),
    /payout token/i
  );
  await assert.rejects(
    client.createPayout({
      idempotenceKey: 'payout_bad_sbp',
      amountKopecks: 500,
      method: 'sbp',
      phone: '+79990000000'
    }),
    /bank/i
  );
  assert.equal(recorded.calls.length, 0);
});

test('provider and timeout failures are safe and do not leak secrets or response details', async () => {
  const secret = 'super-secret-key';
  const api = createYooKassaClient({
    shopId: '123456',
    secretKey: secret,
    fetchImpl: async () => jsonResponse(
      { description: `provider detail with ${secret}` },
      { status: 401, headers: { 'request-id': 'req-1' } }
    )
  });

  await assert.rejects(
    () => api.getPayment('2f8f0000-0000-0000-0000-000000000001'),
    (error) => {
      assert.ok(error instanceof YooKassaApiError);
      assert.equal(error.status, 401);
      assert.equal(error.requestId, 'req-1');
      assert.doesNotMatch(error.message, /super-secret-key|provider detail/u);
      return true;
    }
  );

  const timeoutClient = createYooKassaClient({
    shopId: '123456',
    secretKey: secret,
    fetchImpl: async () => {
      const error = new Error(`timeout with ${secret}`);
      error.name = 'TimeoutError';
      throw error;
    }
  });

  await assert.rejects(
    () => timeoutClient.getPayment('2f8f0000-0000-0000-0000-000000000001'),
    (error) => {
      assert.ok(error instanceof YooKassaTimeoutError);
      assert.doesNotMatch(error.message, /super-secret-key/u);
      return true;
    }
  );
});
