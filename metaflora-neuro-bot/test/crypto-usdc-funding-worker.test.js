import assert from 'node:assert/strict';
import test from 'node:test';

import { CryptoUsdcFundingWorker } from '../src/crypto-usdc-funding-worker.js';

const HASH = `0x${'a'.repeat(64)}`;
const job = (id = '1') => ({
  id, claimToken: `00000000-0000-4000-8000-00000000000${id}`,
  requestKey: `crypto_usdc:mfc_${id.padStart(32, '0')}`,
  orderId: `mfc_${id.padStart(32, '0')}`, sourceTransactionHash: HASH,
  amountUsdcMicros: 12_500_000, openrouterCreditMicrousd: 5_000_000,
  openrouterUsdcMicros: 5_250_000, gasReserveUsdcMicros: 250_000,
  ownerUsdcMicros: 7_000_000, currency: 'USDC', chain: 'base'
});

test('settles every claimed sale independently and verifies both destinations', async () => {
  const calls = [];
  const repository = {
    async claimCryptoUsdcFundingRequests() { return [job('1'), job('2')]; },
    async markCryptoUsdcFundingStarted(value) { calls.push(['started', value]); return true; },
    async markCryptoUsdcFundingCompleted(value) { calls.push(['completed', value]); return true; },
    async markCryptoUsdcFundingManual() { throw new Error('unexpected manual'); }
  };
  const connector = { async settleCryptoSale(value) {
    calls.push(['settle', value]);
    return { openrouterTransactionId: `or-${value.orderId}`,
      openrouterFundedUsdcMicros: value.openrouterUsdcMicros,
      ownerTransactionHash: HASH, ownerPaidUsdcMicros: value.ownerUsdcMicros };
  } };
  const worker = new CryptoUsdcFundingWorker({ repository, connector, enabled: true, maxConcurrency: 8 });
  assert.deepEqual(await worker.run(), { claimed: 2, completed: 2, manual: 0 });
  assert.equal(calls.filter(([type]) => type === 'settle').length, 2);
  assert.equal(calls.filter(([type]) => type === 'completed').length, 2);
});

test('never retries automatically after external settlement was marked started', async () => {
  const manual = [];
  const repository = {
    async claimCryptoUsdcFundingRequests() { return [job('3')]; },
    async markCryptoUsdcFundingStarted() { return true; },
    async markCryptoUsdcFundingCompleted() { throw new Error('unexpected completion'); },
    async markCryptoUsdcFundingManual(value) { manual.push(value); return true; }
  };
  const connector = { async settleCryptoSale() { throw Object.assign(new Error('unknown'), { code: 'settlement_result_unknown' }); } };
  const worker = new CryptoUsdcFundingWorker({ repository, connector, enabled: true });
  assert.deepEqual(await worker.run(), { claimed: 1, completed: 0, manual: 1 });
  assert.equal(manual[0].errorCode, 'settlement_result_unknown');
});

test('is inert behind its dedicated kill switch', async () => {
  let claimed = false;
  const worker = new CryptoUsdcFundingWorker({ repository: {
    async claimCryptoUsdcFundingRequests() { claimed = true; return []; }
  }, connector: {}, enabled: true, killSwitch: true });
  assert.deepEqual(await worker.run(), { claimed: 0, completed: 0, manual: 0 });
  assert.equal(claimed, false);
});

test('rejects a crypto order whose OpenRouter funding is below the required 5.25 USDC', async () => {
  let started = false;
  const worker = new CryptoUsdcFundingWorker({ repository: {
    async claimCryptoUsdcFundingRequests() {
      return [{
        ...job('4'),
        amountUsdcMicros: 12_499_999,
        openrouterUsdcMicros: 5_249_999
      }];
    },
    async markCryptoUsdcFundingStarted() { started = true; return true; }
  }, connector: {}, enabled: true });
  await assert.rejects(worker.run(), /Crypto USDC funding job is invalid/);
  assert.equal(started, false);
});
