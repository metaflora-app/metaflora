import assert from 'node:assert/strict';
import test from 'node:test';

import { createPolzaMcpClient } from '../src/polza-mcp-client.js';
import { ProviderFundingWorker } from '../src/provider-funding-worker.js';

test('funding worker integrates with the Polza MCP adapter without inventing a direct-charge endpoint', async () => {
  const calls = [];
  const transport = {
    async request(method, params) {
      calls.push({ method, params });
      if (method === 'tools/list') {
        return { tools: [
          { name: 'charge_card' },
          { name: 'get_transaction_history' },
          { name: 'get_balance' }
        ] };
      }
      if (method !== 'tools/call') throw new Error('unexpected MCP method');
      if (params.name === 'charge_card') {
        return { content: [{ type: 'text', text: JSON.stringify({ transaction_id: 'tx-integration-1' }) }] };
      }
      if (params.name === 'get_transaction_history') {
        return { content: [{ type: 'text', text: JSON.stringify({
          transactions: [{ id: 'tx-integration-1', amount_kopecks: 12_000, currency: 'RUB' }]
        }) }] };
      }
      if (params.name === 'get_balance') {
        return { content: [{ type: 'text', text: JSON.stringify({ amount: '300.00', currency: 'RUB' }) }] };
      }
      throw new Error(`unexpected tool: ${params.name}`);
    }
  };
  const provider = createPolzaMcpClient({
    token: 'mcp-secret-token',
    transport,
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
  const completed = [];
  const worker = new ProviderFundingWorker({
    repository: {
      async claimProviderTopupRequests() {
        return [{
          id: 'topup-integration-1',
          allocationKey: 'payment-integration-1:api_reserve:polza',
          paymentId: 'payment-integration-1',
          provider: 'polza',
          amountKopecks: 12_000,
          currency: 'RUB',
          claimToken: 'claim-integration-1',
          attemptCount: 1
        }];
      },
      async getProviderTopupRequest() { return null; },
      async markProviderTopupChargeStarted() { return true; },
      async markProviderTopupSucceeded(input) { completed.push(input); return true; },
      async markProviderTopupFailed() { throw new Error('must not fail'); }
    },
    providers: { polza: provider },
    enabled: true,
    billing: { danger: true }
  });

  const result = await worker.run();

  assert.equal(result.succeeded, 1);
  assert.deepEqual(calls.map(({ method, params }) => [method, params?.name ?? null]), [
    ['tools/list', null],
    ['tools/call', 'charge_card'],
    ['tools/call', 'get_transaction_history'],
    ['tools/call', 'get_balance']
  ]);
  assert.equal(completed[0].observedTransactionId, 'tx-integration-1');
  assert.equal(completed[0].observedBalanceKopecks, 30_000);
});
