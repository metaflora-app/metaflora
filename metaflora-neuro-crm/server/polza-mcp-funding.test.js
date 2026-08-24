import assert from "node:assert/strict";
import test from "node:test";

import { createPolzaMcpFundingClient } from "./polza-mcp-funding.js";

test("MCP funding client creates a custom whole-ruble card link", async () => {
  const calls = [];
  const client = createPolzaMcpFundingClient({
    token: "test-token",
    transport: {
      async request(method, params) {
        calls.push({ method, params });
        if (method === "tools/call" && params.name === "create_topup_link") {
          return { structuredContent: { url: "https://polza.ai/checkout/link-1" } };
        }
        return {};
      },
    },
  });

  const result = await client.createTopupLink({ amountRubles: 100, paymentMethod: "CARD" });

  assert.deepEqual(result, { url: "https://polza.ai/checkout/link-1" });
  assert.equal(calls.at(-1).params.name, "create_topup_link");
  assert.deepEqual(calls.at(-1).params.arguments, { amount: 100, paymentMethod: "CARD" });
});

test("MCP funding client verifies exact transaction amount and currency", async () => {
  const client = createPolzaMcpFundingClient({
    token: "test-token",
    transport: {
      async request(_method, params) {
        if (params.name === "get_transaction_history") {
          return {
            structuredContent: {
              transactions: [
                { id: "tx-1", amount: "100.00", currency: "RUB" },
              ],
            },
          };
        }
        if (params.name === "get_balance") {
          return { structuredContent: { amount: "173.50", currency: "RUB" } };
        }
        return {};
      },
    },
  });

  assert.deepEqual(
    await client.verifyTransaction({
      transactionId: "tx-1",
      expectedAmountKopecks: 10_000,
      currency: "RUB",
    }),
    { transactionId: "tx-1", amountKopecks: 10_000, currency: "RUB" },
  );
  assert.deepEqual(await client.getBalance(), { balanceKopecks: 17_350, currency: "RUB" });
});

test("MCP funding client refuses missing token", async () => {
  assert.throws(
    () => createPolzaMcpFundingClient({ token: "" }),
    /token is required/i,
  );
});

test("MCP funding client refuses ambiguous same-amount reconciliation without an operation id", async () => {
  const client = createPolzaMcpFundingClient({
    token: "mcp-test-token",
    transport: {
      async request(method, params) {
        assert.equal(method, "tools/call");
        assert.equal(params.name, "get_transaction_history");
        return {
          structuredContent: {
            transactions: [
              { id: "tx-1", amount_kopecks: 10_000, currency: "RUB", created_at: "2026-08-08T01:00:01.000Z" },
              { id: "tx-2", amount_kopecks: 10_000, currency: "RUB", created_at: "2026-08-08T01:00:02.000Z" },
            ],
          },
        };
      },
    },
  });

  await assert.rejects(
    client.findMatchingTransaction({
      amountKopecks: 10_000,
      currency: "RUB",
      after: "2026-08-08T00:59:00.000Z",
    }),
    (error) => error.code === "ambiguous_transaction",
  );
});

test("MCP tool errors preserve a safe provider reason for server diagnostics", async () => {
  const client = createPolzaMcpFundingClient({
    token: "mcp-test-token",
    transport: {
      async request() {
        return {
          isError: true,
          content: [{
            type: "text",
            text: JSON.stringify({ error: "Превышен rate limit: максимум 3 операции пополнения в час" }),
          }],
        };
      },
    },
  });

  await assert.rejects(
    client.createTopupLink({ amountRubles: 100, paymentMethod: "CARD" }),
    (error) => error.code === "provider_rate_limited"
      && error.retryable === true
      && error.externalChargeStarted === false
      && error.retryAfterSeconds === 3_600
      && error.providerMessage.includes("rate limit")
      && !error.providerMessage.includes("Bearer"),
  );
});
