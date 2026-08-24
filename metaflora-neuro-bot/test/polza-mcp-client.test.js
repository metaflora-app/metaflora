import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DirectChargeUnavailableError,
  createPolzaMcpClient
} from '../src/polza-mcp-client.js';

function scriptedTransport(responses) {
  const calls = [];
  const queue = [...responses];
  return {
    calls,
    transport: {
      async request(method, params) {
        calls.push({ method, params });
        const response = queue.shift();
        if (response instanceof Error) throw response;
        if (response === undefined) throw new Error(`unexpected MCP request: ${method}`);
        return response;
      }
    }
  };
}

test('Polza MCP client discovers tools and never logs the bearer token', async () => {
  const scripted = scriptedTransport([{ tools: [{ name: 'get_balance' }] }]);
  const logs = [];
  const client = createPolzaMcpClient({
    token: 'mcp-secret-token',
    transport: scripted.transport,
    logger: { warn: (...args) => logs.push(args), error: (...args) => logs.push(args) }
  });

  assert.deepEqual(await client.discoverTools(), [{ name: 'get_balance' }]);
  assert.deepEqual(scripted.calls, [{ method: 'tools/list', params: {} }]);
  assert.equal(JSON.stringify(logs).includes('mcp-secret-token'), false);
});

test('direct charge fails closed when the discovered tool or confirmed params are absent', async () => {
  const scripted = scriptedTransport([{ tools: [{ name: 'get_balance' }, { name: 'create_topup_link' }] }]);
  const client = createPolzaMcpClient({
    token: 'mcp-secret-token',
    transport: scripted.transport,
    billing: { danger: true }
  });

  await assert.rejects(
    () => client.charge({
      provider: 'polza',
      allocationKey: 'payment-1:api_reserve:polza',
      paymentId: 'payment-1',
      amountKopecks: 10_000,
      currency: 'RUB',
      idempotencyKey: 'provider-topup:polza:payment-1'
    }),
    DirectChargeUnavailableError
  );
  assert.deepEqual(scripted.calls.map(({ method }) => method), []);
});

test('fixed charge_from_card contracts fail before any MCP call because the billable amount is absent', async () => {
  const scripted = scriptedTransport([{ tools: [{ name: 'charge_from_card' }] }]);
  const client = createPolzaMcpClient({
    token: 'mcp-secret-token',
    transport: scripted.transport,
    billing: { danger: true },
    directChargeContract: {
      toolName: 'charge_from_card',
      supportsCustomAmount: false,
      buildArguments: ({ idempotencyKey }) => ({
        idempotencyKey,
        confirm: true
      })
    }
  });

  await assert.rejects(
    () => client.charge({
      provider: 'polza',
      allocationKey: 'payment-1:api_reserve:polza',
      paymentId: 'payment-1',
      amountKopecks: 10_000,
      currency: 'RUB',
      idempotencyKey: 'provider-topup:polza:payment-1'
    }),
    DirectChargeUnavailableError
  );
  assert.deepEqual(scripted.calls, []);
});

test('billing.danger must be explicitly enabled before a confirmed direct-charge tool can run', async () => {
  const scripted = scriptedTransport([{ tools: [{ name: 'charge_card' }] }]);
  const client = createPolzaMcpClient({
    token: 'mcp-secret-token',
    transport: scripted.transport,
    billing: { danger: false },
    directChargeContract: {
      toolName: 'charge_card',
      supportsCustomAmount: true,
      buildArguments: () => ({ amount: '100.00', currency: 'RUB', idempotency_key: 'stable-key' })
    }
  });

  await assert.rejects(
    () => client.charge({
      provider: 'polza',
      allocationKey: 'allocation-1',
      paymentId: 'payment-1',
      amountKopecks: 10_000,
      currency: 'RUB',
      idempotencyKey: 'stable-key'
    }),
    DirectChargeUnavailableError
  );
  assert.deepEqual(scripted.calls, []);
});

test('confirmed charge uses only the supplied contract and returns a transaction id', async () => {
  const scripted = scriptedTransport([
    { tools: [{
      name: 'charge_card',
      inputSchema: {
        type: 'object',
        required: ['amount', 'currency', 'idempotency_key']
      }
    }] },
    { content: [{ type: 'text', text: JSON.stringify({ transaction_id: 'tx-1' }) }] }
  ]);
  const client = createPolzaMcpClient({
    token: 'mcp-secret-token',
    transport: scripted.transport,
    billing: { danger: true },
    directChargeContract: {
      toolName: 'charge_card',
      supportsCustomAmount: true,
      buildArguments: ({ amountKopecks, currency, idempotencyKey }) => ({
        amount: (amountKopecks / 100).toFixed(2),
        currency,
        idempotency_key: idempotencyKey
      })
    }
  });

  const result = await client.charge({
    provider: 'polza',
    allocationKey: 'payment-1:api_reserve:polza',
    paymentId: 'payment-1',
    amountKopecks: 10_000,
    currency: 'RUB',
    idempotencyKey: 'provider-topup:polza:payment-1:allocation'
  });

  assert.deepEqual(result, { transactionId: 'tx-1' });
  assert.deepEqual(scripted.calls[1], {
    method: 'tools/call',
    params: {
      name: 'charge_card',
      arguments: {
        amount: '100.00',
        currency: 'RUB',
        idempotency_key: 'provider-topup:polza:payment-1:allocation'
      }
    }
  });
});

test('explicit config tool and argument template expand the stable idempotency identity', async () => {
  const scripted = scriptedTransport([
    { tools: [{ name: 'charge_card' }] },
    { content: [{ type: 'text', text: JSON.stringify({ transaction_id: 'tx-template-1' }) }] }
  ]);
  const client = createPolzaMcpClient({
    token: 'mcp-secret-token',
    transport: scripted.transport,
    billingDanger: true,
    directChargeTool: 'charge_card',
    directChargeArguments: {
      amount: '${amount_rubles}',
      currency: '${currency}',
      idempotency_key: '${idempotency_key}',
      allocation_key: '${allocation_key}',
      payment_id: '${payment_id}'
    }
  });

  assert.deepEqual(await client.charge({
    provider: 'polza',
    allocationKey: 'payment-1:api_reserve:polza',
    paymentId: 'payment-1',
    amountKopecks: 10_000,
    currency: 'RUB',
    idempotencyKey: 'provider-topup:polza:payment-1:allocation'
  }), { transactionId: 'tx-template-1' });
  assert.deepEqual(scripted.calls[1].params.arguments, {
    amount: '100.00',
    currency: 'RUB',
    idempotency_key: 'provider-topup:polza:payment-1:allocation',
    allocation_key: 'payment-1:api_reserve:polza',
    payment_id: 'payment-1'
  });
});

test('direct charge fails closed when the confirmed argument contract drops the idempotency key', async () => {
  const scripted = scriptedTransport([
    { tools: [{ name: 'charge_card' }] }
  ]);
  const client = createPolzaMcpClient({
    token: 'mcp-secret-token',
    transport: scripted.transport,
    billingDanger: true,
    directChargeContract: {
      toolName: 'charge_card',
      supportsCustomAmount: true,
      buildArguments: ({ amountKopecks, currency }) => ({
        amount: (amountKopecks / 100).toFixed(2),
        currency
      })
    }
  });

  await assert.rejects(
    () => client.charge({
      provider: 'polza',
      allocationKey: 'allocation-1',
      paymentId: 'payment-1',
      amountKopecks: 10_000,
      currency: 'RUB',
      idempotencyKey: 'provider-topup:polza:payment-1:allocation-1'
    }),
    DirectChargeUnavailableError
  );
  assert.deepEqual(scripted.calls.map(({ method }) => method), ['tools/list']);
});

test('transaction and balance verification require discovered read tools', async () => {
  const scripted = scriptedTransport([
    { tools: [{ name: 'get_transaction_history' }, { name: 'get_balance' }] },
    { content: [{ type: 'text', text: JSON.stringify({
      transactions: [{ id: 'tx-1', amount_kopecks: 10_000, currency: 'RUB' }]
    }) }] },
    { content: [{ type: 'text', text: JSON.stringify({ amount: '250.00', currency: 'RUB' }) }] }
  ]);
  const client = createPolzaMcpClient({
    token: 'mcp-secret-token',
    transport: scripted.transport
  });

  const transaction = await client.verifyTransaction({
    transactionId: 'tx-1',
    expectedAmountKopecks: 10_000,
    currency: 'RUB'
  });
  const balance = await client.getBalance();

  assert.deepEqual(transaction, {
    transactionId: 'tx-1',
    amountKopecks: 10_000,
    currency: 'RUB'
  });
  assert.deepEqual(balance, { balanceKopecks: 25_000, currency: 'RUB' });
  assert.deepEqual(scripted.calls.map(({ method }) => method), [
    'tools/list',
    'tools/call',
    'tools/call'
  ]);
});

test('Polza balance verification accepts the live MCP balance field', async () => {
  const scripted = scriptedTransport([
    { tools: [{ name: 'get_balance' }] },
    { content: [{ type: 'text', text: JSON.stringify({
      organizationId: 'org-1',
      balance: 100,
      reservedAmount: 0,
      currency: 'RUB'
    }) }] }
  ]);
  const client = createPolzaMcpClient({
    token: 'mcp-secret-token',
    transport: scripted.transport
  });

  assert.deepEqual(await client.getBalance(), {
    balanceKopecks: 10_000,
    currency: 'RUB'
  });
});

test('HTTP MCP transport initializes once, keeps the token in the header, and then discovers tools', async () => {
  const calls = [];
  const responses = [
    new Response(JSON.stringify({ result: { protocolVersion: '2025-06-18' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }),
    new Response('', { status: 202 }),
    new Response(JSON.stringify({ result: { tools: [{ name: 'get_balance' }] } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  ];
  const client = createPolzaMcpClient({
    token: 'mcp-secret-token',
    endpoint: 'https://polza.ai/api/mcp',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return responses.shift();
    }
  });

  assert.deepEqual(await client.discoverTools(), [{ name: 'get_balance' }]);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer mcp-secret-token');
  assert.equal(calls[0].url.includes('mcp-secret-token'), false);
  assert.equal(calls[0].init.body.includes('mcp-secret-token'), false);
  assert.equal(JSON.parse(calls[1].init.body).method, 'notifications/initialized');
  assert.equal(JSON.parse(calls[2].init.body).method, 'tools/list');
});
