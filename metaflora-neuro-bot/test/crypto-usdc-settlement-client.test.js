import test from 'node:test';
import assert from 'node:assert/strict';
import { createCryptoUsdcSettlementClient } from '../src/crypto-usdc-settlement-client.js';

const sale = Object.freeze({
  id: '11111111-1111-4111-8111-111111111111',
  claimToken: '22222222-2222-4222-8222-222222222222',
  requestKey: 'crypto-usdc:mfc_0123456789abcdef0123456789abcdef',
  orderId: 'mfc_0123456789abcdef0123456789abcdef',
  sourceTransactionHash: `0x${'a'.repeat(64)}`,
  amountUsdcMicros: 12_500_000,
  openrouterCreditMicrousd: 5_000_000,
  openrouterUsdcMicros: 5_250_000,
  gasReserveUsdcMicros: 250_000,
  ownerUsdcMicros: 7_000_000,
  currency: 'USDC',
  chain: 'base'
});

test('settlement client sends one exact authenticated USDC sale', async () => {
  let captured;
  const client = createCryptoUsdcSettlementClient({
    baseUrl: 'https://funding.example.test',
    token: 'internal-secret',
    fetchImpl: async (url, options) => {
      captured = { url: String(url), options };
      return new Response(JSON.stringify({ success: true, data: {
        openrouterFundedUsdcMicros: 5_250_000,
        ownerPaidUsdcMicros: 7_000_000,
        ownerTransactionHash: `0x${'b'.repeat(64)}`,
        openrouterTransactionId: 'or_tx_123'
      }}), { status: 200, headers: { 'content-type': 'application/json' } });
    }
  });

  const result = await client.settleCryptoSale(sale);
  assert.equal(captured.url, 'https://funding.example.test/api/internal/provider-funding/settle-usdc');
  assert.equal(captured.options.headers.Authorization, 'Bearer internal-secret');
  assert.deepEqual(JSON.parse(captured.options.body), sale);
  assert.equal(result.openrouterFundedUsdcMicros, 5_250_000);
});

test('settlement client fails closed on unknown connector result', async () => {
  const client = createCryptoUsdcSettlementClient({
    baseUrl: 'https://funding.example.test',
    token: 'internal-secret',
    fetchImpl: async () => new Response(
      '{"success":false,"error":"settlement_result_unknown"}',
      { status: 502, headers: { 'content-type': 'application/json' } }
    )
  });
  await assert.rejects(() => client.settleCryptoSale(sale), { code: 'settlement_result_unknown' });
});
