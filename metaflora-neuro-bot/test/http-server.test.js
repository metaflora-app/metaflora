import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { Readable } from 'node:stream';
import test from 'node:test';

import { createHttpHandler } from '../src/http-server.js';

const TBANK_CALLBACK_SECRET = 'callback-secret-with-at-least-32-bytes';
const CRYPTO_CALLBACK_SECRET = 'crypto-shared-secret-with-at-least-32-bytes';

function signedTBankHeaders(body, timestamp) {
  const signature = createHmac('sha256', TBANK_CALLBACK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  return {
    'content-type': 'application/json',
    'x-metaflora-timestamp': timestamp,
    'x-metaflora-signature': `sha256=${signature}`
  };
}

function signedCryptoHeaders(body, timestamp) {
  const signature = createHmac('sha256', CRYPTO_CALLBACK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  return {
    'content-type': 'application/json',
    'x-metaflora-timestamp': timestamp,
    'x-metaflora-signature': `sha256=${signature}`
  };
}

async function request(handler, { method = 'GET', url = '/', contentType, headers = {}, body = '' } = {}) {
  const source = Readable.from(body ? [Buffer.from(body)] : []);
  source.method = method;
  source.url = url;
  source.headers = { ...(contentType ? { 'content-type': contentType } : {}), ...headers };
  let status = null;
  let responseHeaders = {};
  const chunks = [];
  const response = {
    writeHead(value, valueHeaders = {}) {
      status = value;
      responseHeaders = valueHeaders;
    },
    end(value = '') {
      chunks.push(Buffer.from(value));
    }
  };
  await handler(source, response);
  return {
    status,
    headers: responseHeaders,
    text: Buffer.concat(chunks).toString('utf8'),
    json() {
      return JSON.parse(this.text);
    }
  };
}

test('HTTP handler exposes health and payment return endpoints', async () => {
  const handler = createHttpHandler({
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890'
  });
  const health = await request(handler, { url: '/health' });
  assert.equal(health.status, 200);
  assert.deepEqual(health.json(), { ok: true });

  const returned = await request(handler, { url: '/payments/return' });
  assert.equal(returned.status, 200);
  assert.match(returned.text, /вернуться в Telegram/i);
});

test('generated media route serves the stored bytes without exposing a provider URL', async () => {
  const token = 'A'.repeat(32);
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    mediaStorage: {
      async read(value) {
        assert.equal(value, token);
        return {
          data: Buffer.from('png-bytes'),
          contentType: 'image/png',
          size: 9,
          fileName: 'result.png'
        };
      }
    }
  });
  const response = await request(handler, { url: `/media/${token}` });

  assert.equal(response.status, 200);
  assert.equal(response.headers['content-type'], 'image/png');
  assert.equal(response.headers['content-length'], '9');
  assert.match(response.headers['content-disposition'], /inline/);
  assert.equal(response.text, 'png-bytes');
});

test('short generated media route serves the same stored bytes', async () => {
  const shortCode = 'Ab12_cd3';
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    mediaStorage: {
      async readShort(value) {
        assert.equal(value, shortCode);
        return {
          data: Buffer.from('short-png'),
          contentType: 'image/png',
          size: 9,
          fileName: 'result.png'
        };
      }
    }
  });
  const response = await request(handler, { url: `/f/${shortCode}` });

  assert.equal(response.status, 200);
  assert.equal(response.headers['content-type'], 'image/png');
  assert.equal(response.headers['content-length'], '9');
  assert.equal(response.text, 'short-png');
});

test('YooKassa webhook is parsed and processed before returning success', async () => {
  const received = [];
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: {
      async processWebhook(event) {
        received.push(event);
        return { status: 'processed' };
      }
    }
  });
  const response = await request(handler, {
    method: 'POST',
    url: '/webhooks/legacy-payment/test_token_1234567890',
    contentType: 'application/json',
    body: JSON.stringify({
      type: 'notification',
      event: 'payment.succeeded',
      object: { id: 'payment-1' }
    })
  });
  assert.equal(response.status, 200);
  assert.deepEqual(response.json(), { ok: true });
  assert.equal(received.length, 1);
});

test('T-Business payout webhook is processed before the mandatory OK acknowledgement', async () => {
  const received = [];
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    tbankPayoutWebhookPath: '/webhooks/tbank/payouts/webhook_token_1234567890',
    payoutService: { async processNotification(payload) { received.push(payload); return { status: 'succeeded' }; } }
  });
  const payload = { TerminalKey: 'terminal', Token: 'signed-by-provider' };
  const response = await request(handler, {
    method: 'POST',
    url: '/webhooks/tbank/payouts/webhook_token_1234567890',
    contentType: 'application/json',
    body: JSON.stringify(payload)
  });
  assert.equal(response.status, 200);
  assert.equal(response.text, 'OK');
  assert.deepEqual(received, [payload]);
});

test('T-Business authority webhook reconciles Supabase and never calls the legacy payout service', async () => {
  const calls = [];
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    tbankPayoutWebhookPath: '/webhooks/tbank/payouts/webhook_token_1234567890',
    tbankPayoutAuthorityEnabled: true,
    tbankPayoutNotificationService: {
      async processNotification(payload) { calls.push(['supabase', payload]); return { status: 'paid' }; }
    },
    payoutService: {
      async processNotification(payload) { calls.push(['legacy', payload]); }
    }
  });
  const payload = { TerminalKey: 'terminal', Token: 'signed-by-provider' };
  const response = await request(handler, {
    method: 'POST', url: '/webhooks/tbank/payouts/webhook_token_1234567890',
    contentType: 'application/json', body: JSON.stringify(payload)
  });
  assert.equal(response.status, 200);
  assert.equal(response.text, 'OK');
  assert.deepEqual(calls, [['supabase', payload]]);
});

test('T-Business authority webhook fails closed when Supabase reconciler is unavailable', async () => {
  let legacyCalls = 0;
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    tbankPayoutWebhookPath: '/webhooks/tbank/payouts/webhook_token_1234567890',
    tbankPayoutAuthorityEnabled: true,
    payoutService: { async processNotification() { legacyCalls += 1; } }
  });
  const response = await request(handler, {
    method: 'POST', url: '/webhooks/tbank/payouts/webhook_token_1234567890',
    contentType: 'application/json', body: '{"Token":"valid-shape"}'
  });
  assert.equal(response.status, 503);
  assert.equal(legacyCalls, 0);
});

test('T-Business payout webhook does not acknowledge an invalid notification', async () => {
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    tbankPayoutWebhookPath: '/webhooks/tbank/payouts/webhook_token_1234567890',
    payoutService: { async processNotification() { const error = new Error('invalid signature'); error.statusCode = 401; throw error; } }
  });
  const response = await request(handler, {
    method: 'POST', url: '/webhooks/tbank/payouts/webhook_token_1234567890',
    contentType: 'application/json', body: '{"Token":"bad"}'
  });
  assert.equal(response.status, 401);
  assert.deepEqual(response.json(), { ok: false });
});

test('T-Bank callback verifies raw-body HMAC before processing CONFIRMED', async () => {
  const received = [];
  const nowSeconds = 1_786_269_600;
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    tbankPaymentService: { async processCallback(value) { received.push(value); } },
    tbankCallbackSecret: TBANK_CALLBACK_SECRET,
    now: () => new Date(nowSeconds * 1000)
  });
  const body = JSON.stringify({
    provider: 'tbank', status: 'CONFIRMED', paymentId: '123', orderId: 'mf_order_1',
    amountKopecks: 13_000, terminalKey: 'terminal'
  });
  const response = await request(handler, {
    method: 'POST',
    url: '/internal/tbank/confirmed',
    headers: signedTBankHeaders(body, String(nowSeconds)),
    body
  });

  assert.equal(response.status, 200);
  assert.equal(response.text, 'OK');
  assert.deepEqual(received, [JSON.parse(body)]);
});

test('T-Bank callback rejects forged and stale signatures before payment processing', async () => {
  let calls = 0;
  const nowSeconds = 1_786_269_600;
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    tbankPaymentService: { async processCallback() { calls += 1; } },
    tbankCallbackSecret: TBANK_CALLBACK_SECRET,
    now: () => new Date(nowSeconds * 1000)
  });
  const body = JSON.stringify({ provider: 'tbank', status: 'CONFIRMED' });
  const forged = await request(handler, {
    method: 'POST', url: '/internal/tbank/confirmed',
    headers: {
      ...signedTBankHeaders(body, String(nowSeconds)),
      'x-metaflora-signature': `sha256=${'0'.repeat(64)}`
    },
    body
  });
  const staleTimestamp = String(nowSeconds - 301);
  const stale = await request(handler, {
    method: 'POST', url: '/internal/tbank/confirmed',
    headers: signedTBankHeaders(body, staleTimestamp), body
  });

  assert.equal(forged.status, 403);
  assert.equal(stale.status, 403);
  assert.equal(calls, 0);
});

test('crypto callback verifies raw-body HMAC and rejects forged requests', async () => {
  const received = [];
  const nowSeconds = 1_786_269_600;
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    cryptoUsdcPaymentService: { async processCallback(value) { received.push(value); } },
    cryptoUsdcSharedSecret: CRYPTO_CALLBACK_SECRET,
    now: () => new Date(nowSeconds * 1000)
  });
  const body = JSON.stringify({ provider: 'crypto_usdc', status: 'CONFIRMED' });
  const accepted = await request(handler, {
    method: 'POST', url: '/internal/crypto-usdc/confirmed',
    headers: signedCryptoHeaders(body, String(nowSeconds)), body
  });
  const rejected = await request(handler, {
    method: 'POST', url: '/internal/crypto-usdc/confirmed',
    headers: { ...signedCryptoHeaders(body, String(nowSeconds)), 'x-metaflora-signature': `sha256=${'0'.repeat(64)}` },
    body
  });

  assert.equal(accepted.status, 200);
  assert.equal(rejected.status, 403);
  assert.deepEqual(received, [JSON.parse(body)]);
});

test('webhook rejects invalid content without invoking payment processing', async () => {
  let calls = 0;
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: {
      async processWebhook() {
        calls += 1;
      }
    }
  });
  const wrongType = await request(handler, {
    method: 'POST',
    url: '/webhooks/legacy-payment/test_token_1234567890',
    contentType: 'text/plain',
    body: '{}'
  });
  assert.equal(wrongType.status, 415);

  const invalidJson = await request(handler, {
    method: 'POST',
    url: '/webhooks/legacy-payment/test_token_1234567890',
    contentType: 'application/json',
    body: '{'
  });
  assert.equal(invalidJson.status, 400);
  assert.equal(calls, 0);
});

test('webhook rejects the public legacy path before parsing or provider calls', async () => {
  let calls = 0;
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: {
      async processWebhook() {
        calls += 1;
      }
    }
  });
  const response = await request(handler, {
    method: 'POST',
    url: '/webhooks/legacy-payment',
    contentType: 'application/json',
    body: JSON.stringify({
      type: 'notification',
      event: 'payment.succeeded',
      object: { id: 'payment-1' }
    })
  });

  assert.equal(response.status, 404);
  assert.equal(calls, 0);
});

test('AgentPet endpoint analyzes bounded JSON through its dedicated service', async () => {
  const received = [];
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    agentPetService: {
      async analyze(event) {
        received.push(event);
        return {
          state: 'working',
          title: 'Codex работает',
          summary: 'Выполняется безопасный шаг.',
          risk: 'low',
          suggested_action: 'Подожди.'
        };
      }
    }
  });
  const response = await request(handler, {
    method: 'POST',
    url: '/api/agentpet/analyze',
    contentType: 'application/json',
    body: JSON.stringify({
      session_id: 'session-1',
      hook_event_name: 'PreToolUse',
      command: 'git status'
    })
  });

  assert.equal(response.status, 200);
  assert.equal(response.json().state, 'working');
  assert.equal(received.length, 1);
});

test('legacy card payout setup is unavailable in the T-Business-only runtime', async () => {
  const setupToken = 'A'.repeat(32);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    referralService: {
      getPayoutSetup(token) {
        assert.equal(token, setupToken);
        return {
          setupToken,
          amountKopecks: 100_000,
          method: 'bank_card',
          status: 'pending',
          expiresAt
        };
      }
    }
  });

  const page = await request(handler, { url: `/payout/setup/${setupToken}` });
  assert.equal(page.status, 404);
  assert.deepEqual(page.json(), { ok: false, error: 'payout_method_not_supported' });

  const response = await request(handler, {
    method: 'POST',
    url: `/payout/setup/${setupToken}/complete`,
    contentType: 'application/json',
    body: JSON.stringify({ payout_token: 'synonym.token-1234567890', first6: '411111', last4: '1111' })
  });
  assert.equal(response.status, 404);
  assert.deepEqual(response.json(), { ok: false, error: 'payout_method_not_supported' });
});

test('SBP payout setup returns a bounded bank list and never exposes provider credentials', async () => {
  const setupToken = 'B'.repeat(32);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const handler = createHttpHandler({
    webhookPath: '/webhooks/legacy-payment/test_token_1234567890',
    paymentService: { processWebhook: async () => ({ status: 'ignored' }) },
    referralService: {
      getPayoutSetup: () => ({ setupToken, amountKopecks: 100_000, method: 'sbp', status: 'pending', expiresAt })
    },
    payoutService: {
      listSbpBanks: async () => [{ bank_id: '100000000111', name: 'Банк тест', bic: '044525000' }]
    }
  });

  const response = await request(handler, { url: `/payout/setup/${setupToken}/banks` });
  assert.equal(response.status, 200);
  assert.deepEqual(response.json(), { ok: true, banks: [{ bankId: '100000000111', name: 'Банк тест' }] });
});
