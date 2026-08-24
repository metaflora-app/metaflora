import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CrmBrowserFundingError,
  createCrmBrowserFundingClient,
} from '../src/crm-browser-funding-client.js';

function request() {
  return {
    provider: 'polza',
    allocationKey: 'payment-1:reserve:polza',
    paymentId: 'payment-1',
    amountKopecks: 10_000,
    currency: 'RUB',
    idempotencyKey: 'provider-topup:polza:payment-1:reserve'
  };
}

test('CRM browser funding client sends the exact queue amount to the internal connector', async () => {
  const calls = [];
  const client = createCrmBrowserFundingClient({
    baseUrl: 'https://crm.example.test/',
    token: 'internal-secret',
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response(JSON.stringify({ success: true, data: { transactionId: 'polza-tx-1' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  });

  assert.deepEqual(await client.charge(request()), { transactionId: 'polza-tx-1' });
  assert.equal(calls[0].url, 'https://crm.example.test/api/internal/provider-funding/charge');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer internal-secret');
  assert.deepEqual(JSON.parse(calls[0].options.body), request());
});

test('CRM browser funding client preserves non-retryable authorization states', async () => {
  const client = createCrmBrowserFundingClient({
    baseUrl: 'https://crm.example.test',
    token: 'internal-secret',
    fetchImpl: async () => new Response(JSON.stringify({
      success: false,
      error: 'browser_authorization_required',
      userActionRequired: true
    }), { status: 409, headers: { 'content-type': 'application/json' } })
  });

  await assert.rejects(
    client.charge(request()),
    (error) => error instanceof CrmBrowserFundingError
      && error.code === 'browser_authorization_required'
      && error.retryable === false
      && error.userActionRequired === true
  );
});

test('CRM browser funding client exposes verification and balance as separate calls', async () => {
  const paths = [];
  const client = createCrmBrowserFundingClient({
    baseUrl: 'https://crm.example.test',
    token: 'internal-secret',
    fetchImpl: async (url) => {
      paths.push(new URL(url).pathname);
      const data = new URL(url).pathname.endsWith('/verify')
        ? { transactionId: 'tx-1', amountKopecks: 10_000, currency: 'RUB' }
        : { balanceKopecks: 17_350, currency: 'RUB' };
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }
  });

  assert.deepEqual(await client.verifyTransaction({
    transactionId: 'tx-1',
    expectedAmountKopecks: 10_000,
    currency: 'RUB'
  }), { transactionId: 'tx-1', amountKopecks: 10_000, currency: 'RUB' });
  assert.deepEqual(await client.getBalance({ provider: 'polza' }), {
    balanceKopecks: 17_350,
    currency: 'RUB'
  });
  assert.deepEqual(paths, [
    '/api/internal/provider-funding/verify',
    '/api/internal/provider-funding/balance'
  ]);
});

test('CRM browser funding client exposes safe persistent-session readiness', async () => {
  const client = createCrmBrowserFundingClient({
    baseUrl: 'https://crm.example.test',
    token: 'internal-secret',
    fetchImpl: async (url) => {
      assert.equal(new URL(url).pathname, '/api/internal/provider-funding/status');
      return new Response(JSON.stringify({
        success: true,
        data: {
          persistent: true,
          profileMode: 'persistent',
          authorization: 'authorized',
          automation: 'ready',
          cardEnrollment: 'ready',
          loginPerPayment: false,
          probeErrorCode: 'tool_call_failed',
          authorizationUrl: 'must-not-be-forwarded'
        }
      }), { status: 200 });
    }
  });

  assert.deepEqual(await client.getStatus(), {
    persistent: true,
    profileMode: 'persistent',
    authorization: 'authorized',
    automation: 'ready',
    cardEnrollment: 'ready',
    loginPerPayment: false,
    probeErrorCode: 'tool_call_failed'
  });
});

test('CRM browser funding readiness fails closed when login-per-payment is not explicit', async () => {
  const client = createCrmBrowserFundingClient({
    baseUrl: 'https://crm.example.test',
    token: 'internal-secret',
    provider: 'routerai',
    fetchImpl: async () => new Response(JSON.stringify({
      success: true,
      data: {
        persistent: true,
        authorization: 'authorized',
        automation: 'ready',
        cardEnrollment: 'ready'
      }
    }), { status: 200 })
  });

  assert.equal((await client.getStatus()).loginPerPayment, true);
});

test('browser funding client scopes every request to its configured GPTunnel connector', async () => {
  const bodies = [];
  const client = createCrmBrowserFundingClient({
    baseUrl: 'https://gptunnel-funding.example.test',
    token: 'internal-secret',
    provider: 'gptunnel',
    fetchImpl: async (_url, options) => {
      bodies.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ success: true, data: { transactionId: 'gptunnel-tx-1' } }), { status: 200 });
    }
  });

  assert.deepEqual(await client.charge({
    provider: 'gptunnel',
    allocationKey: 'payment-1:reserve:gptunnel',
    paymentId: 'payment-1',
    amountKopecks: 5_000,
    currency: 'RUB',
    idempotencyKey: 'provider-topup:gptunnel:payment-1:reserve'
  }), { transactionId: 'gptunnel-tx-1' });
  assert.equal(bodies[0].provider, 'gptunnel');
  await assert.rejects(() => client.charge(request()), /provider is invalid/i);
});

test('browser funding client scopes RouterAI requests and forbids batching before the network', async () => {
  const bodies = [];
  const client = createCrmBrowserFundingClient({
    baseUrl: 'https://routerai-funding.example.test',
    token: 'internal-secret',
    provider: 'routerai',
    fetchImpl: async (_url, options) => {
      bodies.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ success: true, data: { transactionId: 'routerai-tx-1' } }), {
        status: 200
      });
    }
  });

  assert.deepEqual(await client.charge({
    provider: 'routerai',
    allocationKey: 'payment-1:reserve:routerai',
    paymentId: 'payment-1',
    amountKopecks: 10_000,
    currency: 'RUB',
    idempotencyKey: 'provider-topup:routerai:payment-1:reserve'
  }), { transactionId: 'routerai-tx-1' });
  assert.equal(bodies[0].provider, 'routerai');

  await assert.rejects(() => client.chargeBatch({
    provider: 'routerai',
    batchId: 'routerai-batch-1',
    amountKopecks: 20_000,
    currency: 'RUB',
    idempotencyKey: 'provider-topup-batch:routerai:1',
    requests: [
      {
        provider: 'routerai',
        allocationKey: 'payment-2:reserve:routerai',
        paymentId: 'payment-2',
        amountKopecks: 10_000,
        currency: 'RUB',
        idempotencyKey: 'provider-topup:routerai:payment-2:reserve'
      },
      {
        provider: 'routerai',
        allocationKey: 'payment-3:reserve:routerai',
        paymentId: 'payment-3',
        amountKopecks: 10_000,
        currency: 'RUB',
        idempotencyKey: 'provider-topup:routerai:payment-3:reserve'
      }
    ]
  }), /does not support batch funding/i);
  assert.equal(bodies.length, 1);
});
