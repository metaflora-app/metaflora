import assert from 'node:assert/strict';
import test from 'node:test';

import {
  walletEntriesForAllocations,
  summarizeWalletEntries
} from '../src/finance-wallet.js';

test('wallet entries reconcile one payment into API reserve and owner share', () => {
  const entries = walletEntriesForAllocations({
    externalPaymentId: 'pay-1',
    telegramUserId: '10',
    allocations: [
      { allocationKey: 'pay-1:gross:all', category: 'gross', provider: null, amountKopecks: 100_000, currency: 'RUB' },
      { allocationKey: 'pay-1:payment_fee:all', category: 'payment_fee', provider: null, amountKopecks: 3_500, currency: 'RUB' },
      { allocationKey: 'pay-1:api_reserve:polza', category: 'api_reserve', provider: 'polza', amountKopecks: 36_500, currency: 'RUB' },
      { allocationKey: 'pay-1:api_reserve:gptunnel', category: 'api_reserve', provider: 'gptunnel', amountKopecks: 10_000, currency: 'RUB' },
      { allocationKey: 'pay-1:owner_share:all', category: 'owner_share', provider: null, amountKopecks: 50_000, currency: 'RUB' }
    ]
  });

  assert.equal(entries.length, 5);
  assert.deepEqual(summarizeWalletEntries(entries), {
    gross: 100_000,
    paymentFee: 3_500,
    apiReserve: 46_500,
    referralLiability: 0,
    ownerShare: 50_000,
    grossMargin: 50_000,
    grossMarginPercent: 50,
    reconciled: true
  });
  assert.equal(entries.find(({ account }) => account === 'api_reserve').direction, 'debit');
  assert.equal(entries.find(({ account }) => account === 'owner_share').direction, 'debit');
});

test('wallet entry keys are deterministic and reject a negative owner split', () => {
  const input = {
    externalPaymentId: 'pay-2',
    allocations: [
      { allocationKey: 'pay-2:gross:all', category: 'gross', amountKopecks: 100, currency: 'RUB' },
      { allocationKey: 'pay-2:owner_share:all', category: 'owner_share', amountKopecks: 100, currency: 'RUB' }
    ]
  };
  assert.deepEqual(walletEntriesForAllocations(input), walletEntriesForAllocations(input));
  assert.throws(
    () => walletEntriesForAllocations({
      externalPaymentId: 'pay-3',
      allocations: [
        { allocationKey: 'pay-3:gross:all', category: 'gross', amountKopecks: 100, currency: 'RUB' },
        { allocationKey: 'pay-3:payment_fee:all', category: 'payment_fee', amountKopecks: 20, currency: 'RUB' },
        { allocationKey: 'pay-3:owner_share:all', category: 'owner_share', amountKopecks: 90, currency: 'RUB' }
      ]
    }),
    /reconcile/i
  );
});
