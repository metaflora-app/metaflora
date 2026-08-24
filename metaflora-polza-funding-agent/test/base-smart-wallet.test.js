import assert from "node:assert/strict";
import test from "node:test";

import { BASE_USDC, CIRCLE_PAYMASTER_V07, createBaseSmartWallet } from "../src/base-smart-wallet.js";

const OWNER = `0x${"1".repeat(40)}`;
const RECIPIENT = `0x${"2".repeat(40)}`;
const TX = `0x${"a".repeat(64)}`;

test("uses Circle Paymaster v0.7 on Base mainnet", () => {
  assert.equal(CIRCLE_PAYMASTER_V07, "0x6C973eBe80dCD8660841D4356bf15c32460271C9");
});

test("derives a counterfactual Base account without requiring ETH or an initial transaction", async () => {
  const wallet = await createBaseSmartWallet({
    ownerPrivateKey: `0x${"3".repeat(64)}`,
    createRuntime: async () => ({
      account: { address: OWNER },
      usdc: { async balanceOf() { return 0n; } },
      async send() { throw new Error("not used"); }
    })
  });
  assert.equal(wallet.address, OWNER);
  assert.equal(await wallet.getUsdcBalanceMicros(), 0);
  assert.equal(wallet.gasAsset, "USDC");
});

test("executes an exact USDC payout and returns the mined Base transaction", async () => {
  const sent = [];
  const wallet = await createBaseSmartWallet({
    ownerPrivateKey: `0x${"3".repeat(64)}`,
    createRuntime: async () => ({
      account: { address: OWNER }, usdc: { async balanceOf() { return 9_000_000n; } },
      async send(calls) { sent.push(calls); return { userOperationHash: `0x${"b".repeat(64)}`, transactionHash: TX }; }
    })
  });
  const result = await wallet.transferUsdc({ recipient: RECIPIENT, amountUsdcMicros: 7_250_000, idempotencyKey: "owner:mfc_123" });
  assert.equal(result.transactionHash, TX);
  assert.deepEqual(sent[0], [{ token: BASE_USDC, recipient: RECIPIENT, amount: 7_250_000n }]);
});

test("settles OpenRouter and owner shares atomically in one user operation", async () => {
  const sent = [];
  const wallet = await createBaseSmartWallet({
    ownerPrivateKey: `0x${"3".repeat(64)}`,
    createRuntime: async () => ({
      account: { address: OWNER }, usdc: { async balanceOf() { return 13_000_000n; } },
      async send(calls) { sent.push(calls); return { userOperationHash: `0x${"b".repeat(64)}`, transactionHash: TX }; }
    })
  });
  const secondRecipient = `0x${"4".repeat(40)}`;
  const result = await wallet.transferUsdcBatch({
    transfers: [
      { recipient: RECIPIENT, amountUsdcMicros: 5_250_000 },
      { recipient: secondRecipient, amountUsdcMicros: 7_500_000 }
    ],
    idempotencyKey: "sale:mfc_123"
  });
  assert.equal(result.transactionHash, TX);
  assert.deepEqual(sent[0], [
    { token: BASE_USDC, recipient: RECIPIENT, amount: 5_250_000n },
    { token: BASE_USDC, recipient: secondRecipient, amount: 7_500_000n }
  ]);
});

test("rejects invalid keys, destinations, zero amounts and insufficient USDC before submission", async () => {
  await assert.rejects(() => createBaseSmartWallet({ ownerPrivateKey: "secret" }), /private key/i);
  const wallet = await createBaseSmartWallet({ ownerPrivateKey: `0x${"3".repeat(64)}`, createRuntime: async () => ({
    account: { address: OWNER }, usdc: { async balanceOf() { return 10n; } }, async send() { throw new Error("must not send"); }
  }) });
  await assert.rejects(() => wallet.transferUsdc({ recipient: "bad", amountUsdcMicros: 1, idempotencyKey: "x" }), /recipient/i);
  await assert.rejects(() => wallet.transferUsdc({ recipient: RECIPIENT, amountUsdcMicros: 11, idempotencyKey: "x" }), /insufficient/i);
});
