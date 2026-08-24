import assert from "node:assert/strict";
import test from "node:test";

import { createProviderProbeService } from "./provider-probes.js";

const ENV = Object.freeze({
  POLZA_API_KEY: "polza-secret",
  ROUTERAI_API_KEY: "routerai-secret",
  PROVIDER_LOW_BALANCE_POLZA: "900",
});

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

test("safe probes authenticate Polza and expose RouterAI as unsupported without network guessing", async () => {
  const calls = [];
  const service = createProviderProbeService({
    env: ENV,
    now: () => "2026-07-30T06:30:00.000Z",
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), headers: options.headers });
      if (String(url).includes("polza.ai/api/v1/balance")) {
        return jsonResponse(200, { amount: "912.75" });
      }
      return jsonResponse(200, { data: [] });
    },
  });

  const result = await service.probeAll();
  const routerai = result.find(({ id }) => id === "routerai");
  const serialized = JSON.stringify(result);

  assert.equal(result[0].id, "polza");
  assert.equal(result[0].probeStatus, "ok");
  assert.equal(result[0].health, "healthy");
  assert.deepEqual(result[0].balance, {
    available: 912.75,
    limit: null,
    used: null,
    unit: "RUB",
  });
  assert.equal(result.length, 2);
  assert.equal(result[0].lowBalance, false);
  assert.equal(routerai.probeStatus, "unsupported");
  assert.equal(routerai.health, "unknown");
  assert.equal(routerai.balance, null);
  assert.equal(routerai.lowBalance, false);
  assert.deepEqual(
    calls.map(({ url }) => url),
    [
      "https://polza.ai/api/v1/balance",
    ],
  );
  for (const secret of Object.values(ENV).filter((value) => value.includes("secret"))) {
    assert.equal(serialized.includes(secret), false);
  }
});

test("reads RouterAI balance through the trusted funding agent when configured", async () => {
  const calls = [];
  const service = createProviderProbeService({
    env: {
      POLZA_API_KEY: "polza-test",
      ROUTERAI_API_KEY: "router-test",
      ROUTERAI_BROWSER_CONNECTOR_URL: "https://funding.example.test",
      ROUTERAI_BROWSER_CONNECTOR_TOKEN: "connector-test",
    },
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options });
      if (String(url).includes("provider-funding/balance")) {
        return new Response(JSON.stringify({ success: true, data: { balanceKopecks: 12_345, currency: "RUB" } }), { status: 200 });
      }
      return new Response(JSON.stringify({ amount: 100 }), { status: 200 });
    },
  });

  const routerai = (await service.probeAll()).find(({ id }) => id === "routerai");
  assert.equal(routerai.probeStatus, "ok");
  assert.deepEqual(routerai.balance, { available: 123.45, limit: null, used: null, unit: "RUB" });
  assert.equal(calls.some(({ options }) => options.headers?.Authorization === "Bearer connector-test"), true);
});

test("uses the dedicated read-only RouterAI visualization key for the credits endpoint", async () => {
  const calls = [];
  const service = createProviderProbeService({
    env: {
      POLZA_API_KEY: "polza-test",
      ROUTERAI_VISUALIZATION_API_KEY: "visualization-only-secret",
    },
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (String(url).includes("routerai.ru/api/v1/credits")) {
        return jsonResponse(200, { data: { total_credits: 150.5, total_usage: 24.25 } });
      }
      return jsonResponse(200, { amount: 100 });
    },
  });

  const routerai = (await service.probeAll()).find(({ id }) => id === "routerai");
  assert.equal(routerai.probeStatus, "ok");
  assert.equal(routerai.health, "healthy");
  assert.deepEqual(routerai.balance, { available: 126.25, limit: 150.5, used: 24.25, unit: "RUB" });
  const creditsCall = calls.find(({ url }) => url.includes("routerai.ru/api/v1/credits"));
  assert.equal(creditsCall.options.method, "GET");
  assert.equal(creditsCall.options.headers.Authorization, "Bearer visualization-only-secret");
  assert.equal(JSON.stringify(routerai).includes("visualization-only-secret"), false);
});

test("probe snapshots are cached briefly to protect provider APIs", async () => {
  let requests = 0;
  let clock = 1_000;
  const service = createProviderProbeService({
    env: ENV,
    cacheTtlMs: 60_000,
    nowMs: () => clock,
    fetchImpl: async () => {
      requests += 1;
      return jsonResponse(200, { data: [], character_count: 0, character_limit: 10_000 });
    },
  });

  const first = await service.probeAll();
  const second = await service.probeAll();
  clock += 60_001;
  const third = await service.probeAll();

  assert.equal(first, second);
  assert.notEqual(second, third);
  assert.equal(requests, 2);
});

test("concurrent dashboard reads share one provider probe cycle", async () => {
  let requests = 0;
  let releaseRequests;
  const pending = new Promise((resolve) => {
    releaseRequests = resolve;
  });
  const service = createProviderProbeService({
    env: ENV,
    fetchImpl: async () => {
      requests += 1;
      await pending;
      return jsonResponse(200, {
        data: [],
        character_count: 0,
        character_limit: 10_000,
      });
    },
  });

  const firstRead = service.probeAll();
  const secondRead = service.probeAll();
  releaseRequests();
  const [first, second] = await Promise.all([firstRead, secondRead]);

  assert.equal(requests, 1);
  assert.equal(first, second);
});

test("probe alerts classify Polza auth failure without probing unsupported RouterAI", async () => {
  const service = createProviderProbeService({
    env: ENV,
    fetchImpl: async (url) => {
      const value = String(url);
      if (value.includes("polza.ai")) return jsonResponse(401, {});
      return jsonResponse(200, { character_count: 0, character_limit: 10_000 });
    },
  });

  const byId = new Map((await service.probeAll()).map((item) => [item.id, item]));

  assert.equal(byId.get("polza").alerts[0].code, "provider_auth_failed");
  assert.equal(byId.get("routerai").probeStatus, "unsupported");
  assert.deepEqual(byId.get("routerai").alerts, []);
  assert.equal(byId.get("polza").health, "down");
});

test("balance probes reject a successful HTTP response with an invalid provider payload", async () => {
  const service = createProviderProbeService({
    env: ENV,
    fetchImpl: async (url) => {
      const value = String(url);
      if (value.includes("polza.ai/api/v1/balance")) {
        return jsonResponse(200, { amount: "not-a-number" });
      }
      return jsonResponse(200, {
        data: { total_credits: 20, total_usage: 1 },
        character_count: 0,
        character_limit: 10_000,
      });
    },
  });

  const byId = new Map((await service.probeAll()).map((item) => [item.id, item]));

  assert.equal(byId.get("polza").probeStatus, "failed");
  assert.equal(byId.get("polza").health, "down");
  assert.equal(byId.get("polza").alerts[0].code, "provider_invalid_response");
  assert.equal(byId.get("routerai").probeStatus, "unsupported");
  assert.equal(byId.get("routerai").health, "unknown");
});
