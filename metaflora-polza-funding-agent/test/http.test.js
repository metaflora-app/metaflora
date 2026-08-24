import test from "node:test";
import assert from "node:assert/strict";
import { createServer, safeErrorDiagnostic } from "../src/http.js";

test("public health exposes only safe release and provider capability metadata", async (context) => {
  const config = {
    novncTarget: "http://127.0.0.1:9",
    adminUser: "admin",
    adminPassword: "strong-password",
    apiToken: "funding-secret-token",
    releaseId: "neuro-features-2026-08-13"
  };
  const server = createServer({
    config,
    browser: {},
    mcp: {},
    providers: { routerai: { browser: {} }, polza: { browser: {} } }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "metaflora-polza-funding-agent",
    version: "1.0.0",
    releaseId: "neuro-features-2026-08-13",
    fundingProviders: ["polza", "routerai"]
  });
});

test("state-changing funding operations reject non-POST methods", async (context) => {
  const config = { novncTarget: "http://127.0.0.1:9", adminUser: "admin", adminPassword: "strong-password", apiToken: "funding-secret-token" };
  const server = createServer({ config, browser: {}, mcp: {}, providers: { polza: { browser: { async charge() { throw new Error("must not run"); } } } } });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/internal/provider-funding/charge`, {
    headers: { Authorization: "Bearer funding-secret-token" }
  });
  assert.equal(response.status, 405);
  assert.equal((await response.json()).error, "method_not_allowed");
});

test("funding diagnostics redact secrets, URLs and long card-like numbers", () => {
  assert.deepEqual(safeErrorDiagnostic(new TypeError(
    "locator failed Bearer secret-token at https://routerai.ru/pay/42 card 2200123412340207"
  )), {
    errorName: "TypeError",
    errorMessage: "locator failed Bearer <redacted> at <url> card <redacted>"
  });
});

test("internal funding API dispatches each request to the explicitly named provider", async (context) => {
  const calls = [];
  const provider = (name) => ({
    browser: {
      async status() { calls.push([name, "status"]); return { authorization: "authorized" }; },
      async charge(input) { calls.push([name, "charge", input.amountKopecks]); return { transactionId: `${name}-tx` }; }
    },
    ledger: {
      async getBalance() { calls.push([name, "balance"]); return { balanceKopecks: 5200, currency: "RUB" }; },
      async verifyTransaction(input) { calls.push([name, "verify", input.transactionId]); return { transactionId: input.transactionId, amountKopecks: input.expectedAmountKopecks, currency: "RUB" }; }
    }
  });
  const config = {
    novncTarget: "http://127.0.0.1:9",
    adminUser: "admin",
    adminPassword: "strong-password",
    apiToken: "funding-secret-token"
  };
  const server = createServer({
    config,
    browser: provider("legacy").browser,
    mcp: provider("legacy").ledger,
    providers: { polza: provider("polza"), gptunnel: provider("gptunnel") }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${origin}/api/internal/provider-funding/charge`, {
    method: "POST",
    headers: { Authorization: "Bearer funding-secret-token", "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "gptunnel", amountKopecks: 5200, idempotencyKey: "one" })
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { transactionId: "gptunnel-tx" } });
  assert.deepEqual(calls, [["gptunnel", "charge", 5200]]);
});

test("internal funding API rejects unknown providers without falling back to Polza", async (context) => {
  const config = {
    novncTarget: "http://127.0.0.1:9",
    adminUser: "admin",
    adminPassword: "strong-password",
    apiToken: "funding-secret-token"
  };
  const server = createServer({ config, browser: {}, mcp: {} });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/internal/provider-funding/status`, {
    method: "POST",
    headers: { Authorization: "Bearer funding-secret-token", "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "other" })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "funding_agent_error");
});

test("internal funding API dispatches RouterAI allocations without provider fallback", async (context) => {
  const calls = [];
  const routerai = {
    browser: {
      async charge(input) {
        calls.push(input);
        return { transactionId: "routerai-one", amountKopecks: input.amountKopecks, currency: "RUB" };
      }
    }
  };
  const config = {
    novncTarget: "http://127.0.0.1:9",
    adminUser: "admin",
    adminPassword: "strong-password",
    apiToken: "funding-secret-token"
  };
  const server = createServer({ config, browser: {}, mcp: {}, providers: { routerai } });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/internal/provider-funding/charge`, {
    method: "POST",
    headers: { Authorization: "Bearer funding-secret-token", "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "routerai", amountKopecks: 10000, idempotencyKey: "sale:routerai" })
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: { transactionId: "routerai-one", amountKopecks: 10000, currency: "RUB" }
  });
  assert.deepEqual(calls, [{ amountKopecks: 10000, idempotencyKey: "sale:routerai" }]);
});

test("internal funding API accepts the explicit OpenRouter provider", async (context) => {
  const calls = [];
  const openrouter = { browser: { async charge(input) { calls.push(input); return { transactionId: "or-1", amountKopecks: input.amountKopecks, currency: "USD" }; } } };
  const config = { novncTarget: "http://127.0.0.1:9", adminUser: "admin", adminPassword: "strong-password", apiToken: "funding-secret-token" };
  const server = createServer({ config, browser: {}, mcp: {}, providers: { openrouter } });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/internal/provider-funding/charge`, {
    method: "POST", headers: { Authorization: "Bearer funding-secret-token", "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "openrouter", amountKopecks: 500, idempotencyKey: "sale:openrouter" })
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { transactionId: "or-1", amountKopecks: 500, currency: "USD" } });
  assert.deepEqual(calls, [{ amountKopecks: 500, idempotencyKey: "sale:openrouter" }]);
});

test("OpenRouter balance and verification stay provider-scoped and default to USD", async (context) => {
  const calls = [];
  const openrouter = {
    browser: {},
    ledger: {
      async getBalance() {
        return { balanceMicrousd: 12_345_678, balanceKopecks: 1_234, currency: "USD", source: "management_api" };
      },
      async verifyTransaction(input) {
        calls.push(input);
        return { transactionId: input.transactionId, amountKopecks: input.expectedAmountKopecks, currency: input.currency };
      }
    }
  };
  const config = { novncTarget: "http://127.0.0.1:9", adminUser: "admin", adminPassword: "strong-password", apiToken: "funding-secret-token" };
  const server = createServer({ config, browser: {}, mcp: {}, providers: { openrouter } });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const request = (operation, payload) => fetch(`http://127.0.0.1:${server.address().port}/api/internal/provider-funding/${operation}`, {
    method: "POST", headers: { Authorization: "Bearer funding-secret-token", "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "openrouter", ...payload })
  });

  const balance = await request("balance", {});
  assert.deepEqual(await balance.json(), { success: true, data: { balanceMicrousd: 12_345_678, balanceKopecks: 1_234, currency: "USD", source: "management_api" } });
  const verification = await request("verify", { transactionId: "credit-1", expectedAmountKopecks: 500 });
  assert.deepEqual(await verification.json(), { success: true, data: { transactionId: "credit-1", amountKopecks: 500, currency: "USD" } });
  assert.deepEqual(calls, [{ transactionId: "credit-1", expectedAmountKopecks: 500, amountKopecks: 500, currency: "USD" }]);
});

test("USDC settlement uses the dedicated connector and never the RUB charge path", async (context) => {
  const calls = [];
  const settlement = { async settleCryptoSale(value) { calls.push(value); return { openrouterTransactionId: "or-1", ownerTransactionHash: `0x${"a".repeat(64)}` }; } };
  const config = { novncTarget: "http://127.0.0.1:9", adminUser: "admin", adminPassword: "strong-password", apiToken: "funding-secret-token" };
  const server = createServer({ config, browser: {}, mcp: {}, cryptoSettlement: settlement });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const payload = { orderId: `mfc_${"1".repeat(32)}`, amountUsdcMicros: 12_750_000, openrouterCreditMicrousd: 5_000_000,
    openrouterUsdcMicros: 5_250_000, gasReserveUsdcMicros: 250_000, ownerUsdcMicros: 7_250_000, currency: "USDC", chain: "base" };
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/internal/provider-funding/settle-usdc`, {
    method: "POST", headers: { Authorization: "Bearer funding-secret-token", "Content-Type": "application/json" }, body: JSON.stringify(payload)
  });
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [payload]);
});
