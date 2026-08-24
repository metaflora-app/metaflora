import assert from "node:assert/strict";
import test from "node:test";

import { createCryptoUsdcSettlementManager } from "../src/crypto-usdc-settlement.js";

const HASH = `0x${"a".repeat(64)}`;
const INVOICE = `0x${"2".repeat(40)}`;
const OWNER = `0x${"3".repeat(40)}`;

test("funds OpenRouter and pays the owner in one Base user operation", async () => {
  const calls = [];
  const manager = createCryptoUsdcSettlementManager({
    openRouter: {
      async createDirectCryptoInvoice(input) {
        calls.push(["invoice", input]);
        return { invoiceId: "cb-1", recipient: INVOICE, amountUsdcMicros: 5_250_000, creditMicrousd: 5_000_000 };
      },
      async verifyDirectCryptoFunding(input) { calls.push(["verify", input]); return { transactionId: "or-credit-1" }; }
    },
    smartWallet: {
      async getUsdcBalanceMicros() { return 12_750_000; },
      async transferUsdcBatch(input) { calls.push(["transfer", input]); return { transactionHash: HASH }; }
    },
    ownerAddress: OWNER
  });
  const result = await manager.settleCryptoSale({
    orderId: `mfc_${"1".repeat(32)}`,
    amountUsdcMicros: 12_750_000,
    openrouterCreditMicrousd: 5_000_000,
    openrouterUsdcMicros: 5_250_000,
    gasReserveUsdcMicros: 250_000,
    ownerUsdcMicros: 7_250_000,
    currency: "USDC", chain: "base"
  });
  assert.deepEqual(calls[1], ["transfer", {
    transfers: [
      { recipient: INVOICE, amountUsdcMicros: 5_250_000 },
      { recipient: OWNER, amountUsdcMicros: 7_250_000 }
    ],
    idempotencyKey: `settle:mfc_${"1".repeat(32)}`
  }]);
  assert.equal(result.openrouterTransactionId, "or-credit-1");
  assert.equal(result.ownerTransactionHash, HASH);
  assert.equal(result.openrouterFundedUsdcMicros, 5_250_000);
  assert.equal(result.ownerPaidUsdcMicros, 7_250_000);
});

test("fails before any transfer when the invoice does not match", async () => {
  let transfers = 0;
  const manager = createCryptoUsdcSettlementManager({
    openRouter: {
      async createDirectCryptoInvoice() { return { invoiceId: "bad", recipient: INVOICE, amountUsdcMicros: 5_260_000, creditMicrousd: 5_000_000 }; },
      async verifyDirectCryptoFunding() { throw new Error("must not verify"); }
    },
    smartWallet: { async getUsdcBalanceMicros() { return 12_750_000; }, async transferUsdcBatch() { transfers += 1; } },
    ownerAddress: OWNER
  });
  await assert.rejects(() => manager.settleCryptoSale({ orderId: `mfc_${"1".repeat(32)}`, amountUsdcMicros: 12_750_000,
    openrouterCreditMicrousd: 5_000_000, openrouterUsdcMicros: 5_250_000, gasReserveUsdcMicros: 250_000,
    ownerUsdcMicros: 7_250_000, currency: "USDC", chain: "base" }), /invoice/i);
  assert.equal(transfers, 0);
});
