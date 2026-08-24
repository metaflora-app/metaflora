import test from "node:test";
import assert from "node:assert/strict";
import { createMcpClient, FundingError } from "../src/mcp.js";

function response(payload, status = 200) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: payload }), { status, headers: { "content-type": "application/json" } });
}

function clientWith(tools) {
  return createMcpClient({
    endpoint: "https://polza.ai/api/mcp",
    token: "test-token",
    fetchImpl: async (_url, options) => {
      const request = JSON.parse(options.body);
      if (request.method === "initialize") return response({ protocolVersion: "2025-06-18" });
      if (request.method === "notifications/initialized") return new Response("", { status: 202 });
      const name = request.params.name;
      const payload = typeof tools[name] === "function" ? tools[name](request.params.arguments) : tools[name];
      return response({ content: [{ type: "text", text: JSON.stringify(payload) }] });
    }
  });
}

test("MCP client verifies successful RUB transactions", async () => {
  const transaction = { id: "tx-new", amount: "100.00", currency: "RUB", status: "succeeded", direction: "topup", created_at: "2026-08-08T01:00:01.000Z" };
  const client = clientWith({
    get_balance: { balance: 173.49823401 },
    get_transaction_history: { transactions: [{ id: "old", amount: "50.00", status: "succeeded", created_at: "2026-08-07T01:00:00.000Z" }, transaction] }
  });
  assert.deepEqual(await client.getBalance(), { balanceKopecks: 17350, currency: "RUB" });
  assert.deepEqual(await client.getTransactionIds(), ["old", "tx-new"]);
  assert.deepEqual(await client.findTransaction({ amountKopecks: 10000, after: "2026-08-08T01:00:00.000Z", excluded: ["old"] }), { transactionId: "tx-new" });
  assert.deepEqual(await client.verifyTransaction({ transactionId: "tx-new", amountKopecks: 10000 }), { transactionId: "tx-new", amountKopecks: 10000, currency: "RUB" });
});

test("MCP client rejects failed or mismatched transactions", async () => {
  const client = clientWith({ get_transaction_history: { transactions: [{ id: "bad", amount: "100.00", currency: "RUB", status: "failed", created_at: "2026-08-08T01:00:01.000Z" }] } });
  assert.equal(await client.findTransaction({ amountKopecks: 10000, after: "2026-08-08T01:00:00.000Z" }), null);
  await assert.rejects(() => client.verifyTransaction({ transactionId: "bad", amountKopecks: 10000 }), (error) => error instanceof FundingError && error.code === "verification_failed");
});

test("MCP 429 is retryable and explicitly before external charge", async () => {
  const client = createMcpClient({ endpoint: "https://polza.ai/api/mcp", token: "test", fetchImpl: async () => new Response("limited", { status: 429 }) });
  await assert.rejects(() => client.getBalance(), (error) => error.code === "provider_rate_limited" && error.retryable && error.externalChargeStarted === false);
});
