import assert from "node:assert/strict";
import { test } from "node:test";
import { authorizeBasicAuth, createCrmRequestHandler } from "./http-app.js";
import {
  MetacoinAdjustmentError,
  MetacoinAdjustmentMigrationRequiredError,
  SubscriptionChangeError,
} from "./supabase-crm.js";

function createResponse() {
  const headers = {};
  return {
    body: "",
    headers,
    status: 0,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    writeHead(status, nextHeaders = {}) {
      this.status = status;
      Object.assign(headers, nextHeaders);
    },
    end(chunk = "") {
      this.body += chunk;
    },
  };
}

function adminHeaders(overrides = {}) {
  const token = Buffer.from("admin:password").toString("base64");
  return {
    authorization: `Basic ${token}`,
    "content-type": "application/json",
    origin: "https://crm.metaflora.ru",
    "x-csrf-token": "csrf-test-token",
    ...overrides,
  };
}

function createJsonRequest(body, overrides = {}) {
  const chunks = Array.isArray(body)
    ? body
    : [Buffer.from(typeof body === "string" ? body : JSON.stringify(body))];
  return {
    method: "POST",
    url: "/api/admin/metacoins/adjust",
    headers: adminHeaders(),
    async *[Symbol.asyncIterator]() {
      yield* chunks;
    },
    ...overrides,
  };
}

test("validates HTTP basic credentials", () => {
  const token = Buffer.from("admin:correct-password").toString("base64");
  assert.equal(
    authorizeBasicAuth(`Basic ${token}`, "admin", "correct-password"),
    true,
  );
  assert.equal(authorizeBasicAuth(`Basic ${token}`, "admin", "wrong"), false);
  assert.equal(authorizeBasicAuth(undefined, "admin", "correct-password"), false);
});

test("health endpoint stays available without admin credentials", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    now: () => new Date("2026-07-30T00:00:00.000Z"),
  });
  const response = createResponse();
  await handler({ method: "GET", url: "/api/health", headers: {} }, response);
  assert.equal(response.status, 200);
  assert.match(response.body, /2026-07-30T00:00:00.000Z/);
});

test("promo creation is admin-only, CSRF-protected, and accepts only supported rewards", async () => {
  const created = [];
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    createPromo: async (promo) => {
      created.push(promo);
      return { id: promo.code, ...promo, status: "active" };
    },
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
    productModelIds: ["gpt_56_luna", "gpt_56_terra"],
    staticRoot: "/definitely/missing-promo-static-root",
  });
  const validBody = {
    code: "MODELS42",
    rewardType: "discount_percent",
    rewardValue: 42,
    modelIds: ["gpt_56_luna", "gpt_56_terra"],
  };

  const anonymous = createResponse();
  await handler(createJsonRequest(validBody, {
    url: "/api/admin/promos",
    headers: { "content-type": "application/json" },
  }), anonymous);
  assert.equal(anonymous.status, 401);

  const wrongCsrf = createResponse();
  await handler(createJsonRequest(validBody, {
    url: "/api/admin/promos",
    headers: adminHeaders({ "x-csrf-token": "wrong" }),
  }), wrongCsrf);
  assert.equal(wrongCsrf.status, 403);

  for (const invalidBody of [
    { code: "ZERO", rewardType: "metacoins", rewardValue: 0, modelIds: [] },
    { code: "OVER100", rewardType: "discount_percent", rewardValue: 101, modelIds: ["gpt_56_luna"] },
    { code: "UNKNOWN", rewardType: "discount_percent", rewardValue: 25, modelIds: ["invented-model"] },
    { code: "NOSCOPE", rewardType: "discount_percent", rewardValue: 25, modelIds: [] },
  ]) {
    const response = createResponse();
    await handler(createJsonRequest(invalidBody, { url: "/api/admin/promos" }), response);
    assert.equal(response.status, 422);
  }

  const response = createResponse();
  await handler(createJsonRequest(validBody, { url: "/api/admin/promos" }), response);
  assert.equal(response.status, 201);
  assert.deepEqual(created, [validBody]);
});

test("promo creation accepts an arbitrary positive metacoin grant", async () => {
  let captured = null;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    createPromo: async (promo) => {
      captured = promo;
      return { id: promo.code, ...promo, status: "active" };
    },
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
    staticRoot: "/definitely/missing-promo-static-root",
  });
  const response = createResponse();
  await handler(createJsonRequest({
    code: "COINS375",
    rewardType: "metacoins",
    rewardValue: 375,
    modelIds: [],
  }, { url: "/api/admin/promos" }), response);

  assert.equal(response.status, 201);
  assert.deepEqual(captured, {
    code: "COINS375",
    rewardType: "metacoins",
    rewardValue: 375,
    modelIds: [],
  });
});

test("Telegram OTP endpoints issue a secure session cookie without Basic auth", async () => {
  const calls = [];
  const otpAuthService = {
    requestCode: async ({ clientKey }) => {
      calls.push(["request", clientKey]);
      return {
        challengeId: "challenge-1",
        expiresAt: "2026-07-30T00:05:00.000Z",
      };
    },
    verifyCode: async ({ challengeId, code, clientKey }) => {
      calls.push(["verify", challengeId, code, clientKey]);
      return {
        sessionToken: "session-secret",
        expiresAt: "2026-07-30T08:00:00.000Z",
      };
    },
    isSessionValid: (token) => token === "session-secret",
    revokeSession: (token) => calls.push(["revoke", token]),
  };
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({ users: [] }),
    otpAuthService,
  });

  const requestResponse = createResponse();
  await handler(
    createJsonRequest(
      {},
      {
        url: "/api/auth/request-code",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.4" },
      },
    ),
    requestResponse,
  );
  assert.equal(requestResponse.status, 200);
  assert.deepEqual(JSON.parse(requestResponse.body).data, {
    challengeId: "challenge-1",
    expiresAt: "2026-07-30T00:05:00.000Z",
  });

  const verifyResponse = createResponse();
  await handler(
    createJsonRequest(
      { challengeId: "challenge-1", code: "123456" },
      {
        url: "/api/auth/verify",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.4" },
      },
    ),
    verifyResponse,
  );
  assert.equal(verifyResponse.status, 200);
  assert.match(verifyResponse.headers["set-cookie"], /^crm_session=session-secret;/);
  assert.match(verifyResponse.headers["set-cookie"], /HttpOnly/);
  assert.match(verifyResponse.headers["set-cookie"], /Secure/);
  assert.match(verifyResponse.headers["set-cookie"], /SameSite=Strict/);

  const dashboardResponse = createResponse();
  await handler(
    {
      method: "GET",
      url: "/api/dashboard",
      headers: { cookie: "crm_session=session-secret" },
    },
    dashboardResponse,
  );
  assert.equal(dashboardResponse.status, 200);
  assert.deepEqual(calls, [
    ["request", "203.0.113.4"],
    ["verify", "challenge-1", "123456", "203.0.113.4"],
  ]);
});

test("OTP mode returns JSON 401 without triggering a browser Basic-auth dialog", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    otpAuthService: {
      requestCode: async () => ({}),
      verifyCode: async () => ({}),
      isSessionValid: () => false,
      revokeSession: () => {},
    },
  });
  const response = createResponse();
  await handler({ method: "GET", url: "/api/dashboard", headers: {} }, response);
  assert.equal(response.status, 401);
  assert.equal(response.headers["www-authenticate"], undefined);
});

test("readiness requires admin access and hides dashboard data", async () => {
  let checks = 0;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => {
      checks += 1;
      return { users: [{ id: "private-user" }] };
    },
    adminUsername: "admin",
    adminPassword: "password",
    now: () => new Date("2026-07-30T00:00:00.000Z"),
  });
  const anonymousResponse = createResponse();
  await handler(
    { method: "GET", url: "/api/readiness", headers: {} },
    anonymousResponse,
  );
  assert.equal(anonymousResponse.status, 401);
  assert.equal(checks, 0);

  const response = createResponse();
  const token = Buffer.from("admin:password").toString("base64");
  await handler(
    {
      method: "GET",
      url: "/api/readiness",
      headers: { authorization: `Basic ${token}` },
    },
    response,
  );
  assert.equal(response.status, 200);
  assert.equal(checks, 1);
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: {
      status: "ready",
      checkedAt: "2026-07-30T00:00:00.000Z",
    },
  });
  assert.doesNotMatch(response.body, /private-user/);
});

test("readiness reports a generic unavailable state", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => {
      throw new Error("private database detail");
    },
    adminUsername: "admin",
    adminPassword: "password",
  });
  const response = createResponse();
  const token = Buffer.from("admin:password").toString("base64");
  const originalError = console.error;
  console.error = () => {};
  try {
    await handler(
      {
        method: "GET",
        url: "/api/readiness",
        headers: { authorization: `Basic ${token}` },
      },
      response,
    );
  } finally {
    console.error = originalError;
  }

  assert.equal(response.status, 503);
  assert.doesNotMatch(response.body, /database detail/);
});

test("malformed percent-encoded paths return 400 without throwing", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
  });
  const response = createResponse();
  const token = Buffer.from("admin:password").toString("base64");

  await handler(
    {
      method: "GET",
      url: "/%E0%A4%A",
      headers: { authorization: `Basic ${token}` },
    },
    response,
  );

  assert.equal(response.status, 400);
  assert.match(response.body, /invalid request path/);
});

test("dashboard rejects anonymous requests", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
  });
  const response = createResponse();
  await handler({ method: "GET", url: "/api/dashboard", headers: {} }, response);
  assert.equal(response.status, 401);
  assert.equal(response.headers["www-authenticate"], undefined);
});

test("dashboard returns the safe adapter payload", async () => {
  const dashboard = { users: [{ id: "user-1" }] };
  const handler = createCrmRequestHandler({
    getDashboardData: async () => dashboard,
    adminUsername: "admin",
    adminPassword: "password",
  });
  const response = createResponse();
  const token = Buffer.from("admin:password").toString("base64");
  await handler(
    {
      method: "GET",
      url: "/api/dashboard",
      headers: { authorization: `Basic ${token}` },
    },
    response,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: dashboard,
  });
});

test("product catalog is admin-only and returns the versioned safe manifest", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
  });
  const anonymousResponse = createResponse();
  await handler({ method: "GET", url: "/api/product-catalog", headers: {} }, anonymousResponse);
  assert.equal(anonymousResponse.status, 401);

  const response = createResponse();
  await handler(
    { method: "GET", url: "/api/product-catalog", headers: adminHeaders() },
    response,
  );
  const body = JSON.parse(response.body);
  assert.equal(response.status, 200);
  assert.equal(body.data.schemaVersion, "1.2.0");
  assert.equal(body.data.entertainmentProfile.ready, 15);
  assert.equal(body.data.entertainmentProfile.quizReady, true);
  assert.deepEqual(body.data.summary, { models: 393, agents: 50, tools: 42, workflows: 30, voices: 80, entertainments: 15 });
  assert.equal(JSON.stringify(body).includes("systemPrompt"), false);
  assert.equal(JSON.stringify(body).includes("providerModelId"), false);
  assert.equal(JSON.stringify(body).includes("voiceId"), false);
});

test("dashboard hides internal adapter failures", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => {
      throw new Error("secret service-role detail");
    },
    adminUsername: "admin",
    adminPassword: "password",
  });
  const response = createResponse();
  const token = Buffer.from("admin:password").toString("base64");
  const originalError = console.error;
  console.error = () => {};
  try {
    await handler(
      {
        method: "GET",
        url: "/api/dashboard",
        headers: { authorization: `Basic ${token}` },
      },
      response,
    );
  } finally {
    console.error = originalError;
  }
  assert.equal(response.status, 503);
  assert.doesNotMatch(response.body, /service-role/);
});

test("authenticated session bootstrap exposes only the CSRF token to the same-origin client", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
  });
  const anonymousResponse = createResponse();
  await handler(
    { method: "GET", url: "/api/session", headers: {} },
    anonymousResponse,
  );
  assert.equal(anonymousResponse.status, 401);

  const response = createResponse();
  await handler(
    { method: "GET", url: "/api/session", headers: adminHeaders() },
    response,
  );
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: { csrfToken: "csrf-test-token" },
  });
  assert.equal(JSON.stringify(response.body).includes("password"), false);
});

test("session bootstrap fails closed when CSRF is not configured", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
  });
  const response = createResponse();
  await handler(
    { method: "GET", url: "/api/session", headers: adminHeaders() },
    response,
  );
  assert.equal(response.status, 503);
  assert.doesNotMatch(response.body, /undefined|null/);
});

test("user details endpoint requires admin access and returns the safe projection", async () => {
  const userId = "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f";
  let capturedUserId = null;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    getUserDetails: async (value) => {
      capturedUserId = value;
      return {
        user: { id: value, name: "Ирина Волкова" },
        avatarUrl: null,
        payments: [],
        ledgerEntries: [],
        generations: [],
        providerCalls: [],
        audit: [],
      };
    },
    adminUsername: "admin",
    adminPassword: "password",
  });

  const anonymousResponse = createResponse();
  await handler(
    { method: "GET", url: `/api/users/${userId}/details`, headers: {} },
    anonymousResponse,
  );
  assert.equal(anonymousResponse.status, 401);
  assert.equal(capturedUserId, null);

  const response = createResponse();
  await handler(
    {
      method: "GET",
      url: `/api/users/${userId}/details`,
      headers: adminHeaders(),
    },
    response,
  );
  assert.equal(response.status, 200);
  assert.equal(capturedUserId, userId);
  assert.equal(JSON.parse(response.body).data.avatarUrl, null);
});

test("user details endpoint validates ids, handles missing users, and fails closed", async () => {
  for (const [url, getUserDetails, expectedStatus] of [
    ["/api/users/not-a-uuid/details", async () => ({}), 400],
    [
      "/api/users/2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f/details",
      async () => null,
      404,
    ],
    [
      "/api/users/2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f/details",
      async () => {
        throw new Error("private Supabase detail");
      },
      503,
    ],
  ]) {
    const handler = createCrmRequestHandler({
      getDashboardData: async () => ({}),
      getUserDetails,
      adminUsername: "admin",
      adminPassword: "password",
    });
    const response = createResponse();
    const originalError = console.error;
    console.error = () => {};
    try {
      await handler(
        { method: "GET", url, headers: adminHeaders() },
        response,
      );
    } finally {
      console.error = originalError;
    }
    assert.equal(response.status, expectedStatus);
    assert.doesNotMatch(response.body, /private Supabase detail/);
  }
});

test("metacoin adjustment requires a matching Origin and CSRF token", async () => {
  let calls = 0;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adjustMetacoins: async () => {
      calls += 1;
    },
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
  });
  const command = {
    userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    direction: "credit",
    amount: 250,
    reason: "компенсация за недоступную генерацию",
    idempotencyKey: "crm-adjustment-20260730-0001",
  };

  for (const headers of [
    adminHeaders({ origin: "https://attacker.example" }),
    adminHeaders({ "x-csrf-token": "wrong-token" }),
    adminHeaders({ origin: "" }),
  ]) {
    const response = createResponse();
    await handler(createJsonRequest(command, { headers }), response);
    assert.equal(response.status, 403);
  }
  assert.equal(calls, 0);
});

test("metacoin adjustment validates JSON schema and rejects unknown fields", async () => {
  let calls = 0;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adjustMetacoins: async () => {
      calls += 1;
    },
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
  });
  const invalidCommands = [
    {
      userId: "not-a-uuid",
      direction: "credit",
      amount: 250,
      reason: "компенсация",
      idempotencyKey: "crm-adjustment-20260730-0001",
    },
    {
      userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
      direction: "credit",
      amount: -1,
      reason: "компенсация",
      idempotencyKey: "crm-adjustment-20260730-0001",
    },
    {
      userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
      direction: "credit",
      amount: 250,
      reason: "",
      idempotencyKey: "crm-adjustment-20260730-0001",
    },
    {
      userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
      direction: "credit",
      amount: 250,
      reason: "компенсация",
      idempotencyKey: "crm-adjustment-20260730-0001",
      isAdmin: true,
    },
  ];

  for (const command of invalidCommands) {
    const response = createResponse();
    await handler(createJsonRequest(command), response);
    assert.equal(response.status, 400);
  }
  const malformedResponse = createResponse();
  await handler(createJsonRequest("{not-json"), malformedResponse);
  assert.equal(malformedResponse.status, 400);
  assert.equal(calls, 0);
});

test("metacoin adjustment forwards a validated admin command and returns its audit result", async () => {
  let captured;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adjustMetacoins: async (command) => {
      captured = command;
      return {
        ledgerId: "ledger-adjustment-1",
        balanceBefore: 720,
        balanceAfter: 970,
        delta: 250,
        duplicate: false,
      };
    },
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
  });
  const response = createResponse();
  await handler(
    createJsonRequest({
      userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
      direction: "credit",
      amount: 250,
      reason: "компенсация за недоступную генерацию",
      idempotencyKey: "crm-adjustment-20260730-0001",
    }),
    response,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(captured, {
    userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    direction: "credit",
    amount: 250,
    reason: "компенсация за недоступную генерацию",
    idempotencyKey: "crm-adjustment-20260730-0001",
    actor: "admin",
  });
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: {
      ledgerId: "ledger-adjustment-1",
      balanceBefore: 720,
      balanceAfter: 970,
      delta: 250,
      duplicate: false,
    },
  });
});

test("subscription change forwards a validated admin command and returns its audit result", async () => {
  let captured;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    changeSubscription: async (command) => {
      captured = command;
      return {
        actionId: "action-subscription-1",
        subscriptionId: "subscription-1",
        ledgerId: "ledger-1",
        planId: "author",
        metacoins: 300,
        balanceBefore: 670,
        balanceAfter: 970,
        startsAt: "2026-08-04T00:00:00.000Z",
        expiresAt: "2026-09-03T00:00:00.000Z",
        duplicate: false,
      };
    },
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
  });
  const response = createResponse();
  await handler(
    createJsonRequest(
      {
        userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
        planId: "author",
        durationMonths: 1,
        reason: "ручная компенсация",
        idempotencyKey: "crm-subscription-20260804-0001",
      },
      { url: "/api/admin/subscriptions/change" },
    ),
    response,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(captured, {
    userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    planId: "author",
    durationMonths: 1,
    reason: "ручная компенсация",
    idempotencyKey: "crm-subscription-20260804-0001",
    actor: "admin",
  });
  assert.equal(JSON.parse(response.body).data.planId, "author");
});

test("subscription change reports safe conflicts and never exposes provider details", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    changeSubscription: async () => {
      throw new SubscriptionChangeError("idempotency_conflict");
    },
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
  });
  const response = createResponse();
  await handler(
    createJsonRequest(
      {
        userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
        planId: "author",
        durationMonths: 1,
        reason: "ручная компенсация",
        idempotencyKey: "crm-subscription-20260804-0002",
      },
      { url: "/api/admin/subscriptions/change" },
    ),
    response,
  );

  assert.equal(response.status, 409);
  assert.doesNotMatch(response.body, /service.role|postgres|rpc/i);
});

test("manual provider probe executes a real protected adapter check", async () => {
  let capturedProviderId = null;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    probeProvider: async (providerId) => {
      capturedProviderId = providerId;
      return {
        id: providerId,
        name: "Polza",
        probeStatus: "ok",
        health: "healthy",
      };
    },
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
  });
  const response = createResponse();
  await handler(
    createJsonRequest(
      { providerId: "polza" },
      { url: "/api/admin/providers/probe" },
    ),
    response,
  );

  assert.equal(response.status, 200);
  assert.equal(capturedProviderId, "polza");
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: {
      id: "polza",
      name: "Polza",
      probeStatus: "ok",
      health: "healthy",
    },
  });
});

test("metacoin adjustment reports insufficient balance, conflicts, and missing migration", async () => {
  for (const [error, expectedStatus] of [
    [new MetacoinAdjustmentError("insufficient_balance"), 409],
    [new MetacoinAdjustmentError("idempotency_conflict"), 409],
    [new MetacoinAdjustmentMigrationRequiredError(), 503],
  ]) {
    const handler = createCrmRequestHandler({
      getDashboardData: async () => ({}),
      adjustMetacoins: async () => {
        throw error;
      },
      adminUsername: "admin",
      adminPassword: "password",
      csrfToken: "csrf-test-token",
      allowedOrigins: ["https://crm.metaflora.ru"],
    });
    const response = createResponse();
    const originalError = console.error;
    console.error = () => {};
    try {
      await handler(
        createJsonRequest({
          userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
          direction: "debit",
          amount: 250,
          reason: "ручная корректировка",
          idempotencyKey: "crm-adjustment-20260730-0002",
        }),
        response,
      );
    } finally {
      console.error = originalError;
    }
    assert.equal(response.status, expectedStatus);
    assert.doesNotMatch(response.body, /Postgres|service.role|rpc/i);
  }
});

test("metacoin adjustment fails closed when the write adapter is not configured", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
  });
  const response = createResponse();

  await handler(
    createJsonRequest({
      userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
      direction: "credit",
      amount: 250,
      reason: "ручная корректировка",
      idempotencyKey: "crm-adjustment-20260730-0003",
    }),
    response,
  );

  assert.equal(response.status, 503);
});

test("agent status requires admin access and reports fail-closed configuration safely", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    agentService: {
      getStatus: async () => ({
        connected: false,
        status: "configuration_required",
        mode: "supervised",
        capabilities: ["diagnostics", "incident_analysis", "repair_planning"],
      }),
    },
  });
  const anonymousResponse = createResponse();
  await handler(
    { method: "GET", url: "/api/agent/status", headers: {} },
    anonymousResponse,
  );
  assert.equal(anonymousResponse.status, 401);

  const response = createResponse();
  const token = Buffer.from("admin:password").toString("base64");
  await handler(
    {
      method: "GET",
      url: "/api/agent/status",
      headers: { authorization: `Basic ${token}` },
    },
    response,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: {
      connected: false,
      status: "configuration_required",
      mode: "supervised",
      capabilities: ["diagnostics", "incident_analysis", "repair_planning"],
    },
  });
  assert.doesNotMatch(response.body, /secret|sk-|bearer/i);
});

test("persistent browser session status is admin-only and does not expose profile paths", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    browserSessionService: {
      getStatus: async () => ({
        persistent: true,
        storage: "railway_volume",
        ready: true,
        authorization: "required_once",
        automation: "blocked_until_authorization",
      }),
    },
  });

  const anonymousResponse = createResponse();
  await handler(
    { method: "GET", url: "/api/admin/provider-funding/browser-session", headers: {} },
    anonymousResponse,
  );
  assert.equal(anonymousResponse.status, 401);

  const response = createResponse();
  const token = Buffer.from("admin:password").toString("base64");
  await handler(
    {
      method: "GET",
      url: "/api/admin/provider-funding/browser-session",
      headers: { authorization: `Basic ${token}` },
    },
    response,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: {
      persistent: true,
      storage: "railway_volume",
      ready: true,
      authorization: "required_once",
      automation: "blocked_until_authorization",
    },
  });
  assert.doesNotMatch(response.body, /profileDir|\/data|secret|token/i);
});

test("persistent browser authorization relay is admin-only, CSRF-protected, and keeps the token out of request bodies", async () => {
  const calls = [];
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
    browserSessionService: {
      async beginAuthorization() {
        calls.push(["start"]);
        return {
          token: "a".repeat(64),
          active: true,
          authorization: "required_once",
          automation: "configured_pending_authorization",
          cardEnrollment: "unknown",
          expiresAt: "2026-07-30T00:10:00.000Z",
          viewport: { width: 1280, height: 800 },
          image: "data:image/png;base64,cG5n",
        };
      },
      async getAuthorizationView(token) {
        calls.push(["view", token]);
        return { active: true, authorization: "required_once", image: "data:image/png;base64,cG5n" };
      },
      async authorizationAction(token, action) {
        calls.push(["action", token, action]);
        return { active: true, authorization: "authorized", automation: "ready" };
      },
      async completeAuthorization(token) {
        calls.push(["complete", token]);
        return { active: false, authorization: "authorized", automation: "ready" };
      },
      async cancelAuthorization(token) {
        calls.push(["cancel", token]);
        return { active: false };
      },
    },
  });

  const anonymous = createResponse();
  await handler(
    { method: "GET", url: "/api/admin/provider-funding/authorization/view", headers: {} },
    anonymous,
  );
  assert.equal(anonymous.status, 401);

  const start = createResponse();
  await handler(
    createJsonRequest({}, { url: "/api/admin/provider-funding/authorization/start", headers: adminHeaders() }),
    start,
  );
  assert.equal(start.status, 200);
  assert.equal(JSON.parse(start.body).data.token, "a".repeat(64));

  const relayToken = "a".repeat(64);
  const view = createResponse();
  await handler(
    {
      method: "GET",
      url: "/api/admin/provider-funding/authorization/view",
      headers: { ...adminHeaders(), "x-provider-authorization-token": relayToken },
    },
    view,
  );
  assert.equal(view.status, 200);
  assert.doesNotMatch(view.body, /profileDir|\/data|password/i);

  for (const headers of [
    adminHeaders({ origin: "https://attacker.example", "x-provider-authorization-token": relayToken }),
    adminHeaders({ "x-csrf-token": "wrong", "x-provider-authorization-token": relayToken }),
  ]) {
    const rejected = createResponse();
    await handler(
      createJsonRequest({ type: "press", key: "Enter" }, {
        url: "/api/admin/provider-funding/authorization/action",
        headers,
      }),
      rejected,
    );
    assert.equal(rejected.status, 403);
  }

  const action = createResponse();
  await handler(
    createJsonRequest({ type: "press", key: "Enter" }, {
      url: "/api/admin/provider-funding/authorization/action",
      headers: { ...adminHeaders(), "x-provider-authorization-token": relayToken },
    }),
    action,
  );
  assert.equal(action.status, 200);

  const complete = createResponse();
  await handler(
    createJsonRequest({}, {
      url: "/api/admin/provider-funding/authorization/complete",
      headers: { ...adminHeaders(), "x-provider-authorization-token": relayToken },
    }),
    complete,
  );
  assert.equal(complete.status, 200);
  assert.deepEqual(calls, [
    ["start"],
    ["view", relayToken],
    ["action", relayToken, { type: "press", key: "Enter" }],
    ["complete", relayToken],
  ]);
});

test("persistent browser authorization relay rejects malformed actions before the browser is touched", async () => {
  let calls = 0;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
    browserSessionService: {
      async authorizationAction() {
        calls += 1;
        return { active: true };
      },
    },
  });
  const response = createResponse();
  await handler(
    createJsonRequest({ type: "press", key: "Control+L" }, {
      url: "/api/admin/provider-funding/authorization/action",
      headers: { ...adminHeaders(), "x-provider-authorization-token": "a".repeat(64) },
    }),
    response,
  );
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("internal provider-funding charge endpoint requires service auth and returns only verified IDs", async () => {
  const calls = [];
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    providerFundingServiceToken: "service-funding-token",
    providerFundingConnector: {
      charge: async (request) => {
        calls.push(request);
        return { transactionId: "polza-tx-1" };
      },
    },
  });
  const body = {
    provider: "polza",
    allocationKey: "payment-1:reserve:polza",
    paymentId: "payment-1",
    amountKopecks: 10_000,
    currency: "RUB",
    idempotencyKey: "provider-topup:polza:payment-1:reserve",
  };

  const unauthorized = createResponse();
  await handler(
    {
      method: "POST",
      url: "/api/internal/provider-funding/charge",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    unauthorized,
  );
  assert.equal(unauthorized.status, 401);
  assert.equal(calls.length, 0);

  const response = createResponse();
  await handler(
    {
      method: "POST",
      url: "/api/internal/provider-funding/charge",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer service-funding-token",
      },
      body: JSON.stringify(body),
    },
    response,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: { transactionId: "polza-tx-1" },
  });
  assert.deepEqual(calls, [body]);
  assert.doesNotMatch(response.body, /profile|card|secret|token/i);
});

test("internal provider-funding maps manual browser actions to a non-success response", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    providerFundingServiceToken: "service-funding-token",
    providerFundingConnector: {
      async charge() {
        const error = new Error("manual step");
        error.code = "browser_authorization_required";
        error.userActionRequired = true;
        throw error;
      },
    },
  });
  const response = createResponse();
  await handler(
    {
      method: "POST",
      url: "/api/internal/provider-funding/charge",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer service-funding-token",
      },
      body: JSON.stringify({
        provider: "polza",
        allocationKey: "payment-1:reserve:polza",
        paymentId: "payment-1",
        amountKopecks: 10_000,
        currency: "RUB",
        idempotencyKey: "provider-topup:polza:payment-1:reserve",
      }),
    },
    response,
  );
  assert.equal(response.status, 409);
  assert.deepEqual(JSON.parse(response.body), {
    success: false,
    error: "browser_authorization_required",
    userActionRequired: true,
  });
});

test("internal provider-funding status exposes readiness without URLs or secrets", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    providerFundingServiceToken: "service-funding-token",
    providerFundingConnector: {
      async getStatus() {
        return {
          persistent: true,
          profileMode: "persistent",
          authorization: "authorized",
          automation: "ready",
          cardEnrollment: "ready",
          loginPerPayment: false,
          authorizationUrl: "https://example.test/private-login",
          token: "must-not-leak",
        };
      },
    },
  });
  const response = createResponse();
  await handler(
    {
      method: "POST",
      url: "/api/internal/provider-funding/status",
      headers: { authorization: "Bearer service-funding-token" },
      body: "{}",
    },
    response,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: {
      persistent: true,
      profileMode: "persistent",
      authorization: "authorized",
      automation: "ready",
      cardEnrollment: "ready",
      loginPerPayment: false,
    },
  });
  assert.doesNotMatch(response.body, /private-login|token/i);
});

test("agent chat proxies only to the server-side agent service", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
    agentService: {
      chat: async (payload) => ({
        answer: `received:${payload.messages[0].content}`,
        repairPlan: ["Проверить readiness"],
        toolActions: [{ id: "inspect_readiness", mode: "read-only" }],
      }),
    },
  });
  const response = createResponse();
  const token = Buffer.from("admin:password").toString("base64");

  await handler(
    {
      method: "POST",
      url: "/api/agent/chat",
      headers: adminHeaders({ authorization: `Basic ${token}` }),
      body: JSON.stringify({
        messages: [{ role: "user", content: "диагностика" }],
      }),
    },
    response,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: {
      answer: "received:диагностика",
      repairPlan: ["Проверить readiness"],
      toolActions: [{ id: "inspect_readiness", mode: "read-only" }],
    },
  });
});

test("agent chat rejects cross-origin calls before invoking the model", async () => {
  let calls = 0;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
    agentService: {
      chat: async () => {
        calls += 1;
        return { answer: "should not be returned" };
      },
    },
  });
  const response = createResponse();

  await handler(
    {
      method: "POST",
      url: "/api/agent/chat",
      headers: adminHeaders({
        origin: "https://attacker.example",
        "content-type": "text/plain",
      }),
      body: JSON.stringify({
        messages: [{ role: "user", content: "send diagnostics" }],
      }),
    },
    response,
  );

  assert.equal(response.status, 403);
  assert.equal(calls, 0);
});

test("agent chat requires explicit approval for non-read-only actions", async () => {
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
    agentService: {
      chat: async () => {
        const error = new Error("approval required");
        error.statusCode = 403;
        throw error;
      },
    },
  });
  const response = createResponse();
  const token = Buffer.from("admin:password").toString("base64");

  await handler(
    {
      method: "POST",
      url: "/api/agent/chat",
      headers: adminHeaders({ authorization: `Basic ${token}` }),
      body: JSON.stringify({
        messages: [{ role: "user", content: "задеплой" }],
        requestedAction: { id: "railway_deploy", mode: "write" },
      }),
    },
    response,
  );

  assert.equal(response.status, 403);
  assert.match(response.body, /approval required/);
});

test("diagnostic endpoints expose the synthetic check and execute only approved allowlisted repairs", async () => {
  const calls = [];
  const diagnosticService = {
    getSnapshot: async () => ({ status: "degraded", checks: [{ id: "synthetic_controlled_canary", status: "failed" }] }),
    injectControlledFailure: async (command) => {
      calls.push(["failure", command]);
      return { applied: true, status: "failed", productionTrafficAffected: false };
    },
    executeRepair: async (command) => {
      calls.push(["repair", command]);
      return { applied: true, status: "healthy", verified: true };
    },
  };
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
    diagnosticService,
  });
  const token = Buffer.from("admin:password").toString("base64");

  const snapshotResponse = createResponse();
  await handler(
    {
      method: "GET",
      url: "/api/agent/diagnostics",
      headers: { authorization: `Basic ${token}` },
    },
    snapshotResponse,
  );
  assert.equal(snapshotResponse.status, 200);
  assert.match(snapshotResponse.body, /synthetic_controlled_canary/);

  const failureResponse = createResponse();
  await handler(
    {
      method: "POST",
      url: "/api/agent/diagnostics/test-failure",
      headers: adminHeaders({ authorization: `Basic ${token}` }),
      body: JSON.stringify({ idempotencyKey: "failure-20260802-0004" }),
    },
    failureResponse,
  );
  assert.equal(failureResponse.status, 200);

  const repairResponse = createResponse();
  await handler(
    {
      method: "POST",
      url: "/api/agent/diagnostics/repair",
      headers: adminHeaders({ authorization: `Basic ${token}` }),
      body: JSON.stringify({
        actionId: "repair_synthetic_canary",
        approval: "ПОДТВЕРЖДАЮ",
        idempotencyKey: "repair-20260802-0002",
      }),
    },
    repairResponse,
  );
  assert.equal(repairResponse.status, 200);
  assert.deepEqual(calls, [
    ["failure", { actor: "admin", idempotencyKey: "failure-20260802-0004" }],
    [
      "repair",
      {
        actionId: "repair_synthetic_canary",
        approval: "ПОДТВЕРЖДАЮ",
        actor: "admin",
        idempotencyKey: "repair-20260802-0002",
      },
    ],
  ]);
});

test("diagnostic write endpoints reject cross-origin and unknown payload fields", async () => {
  let called = false;
  const handler = createCrmRequestHandler({
    getDashboardData: async () => ({}),
    adminUsername: "admin",
    adminPassword: "password",
    csrfToken: "csrf-test-token",
    allowedOrigins: ["https://crm.metaflora.ru"],
    diagnosticService: {
      injectControlledFailure: async () => {
        called = true;
      },
    },
  });
  const token = Buffer.from("admin:password").toString("base64");
  const response = createResponse();
  await handler(
    {
      method: "POST",
      url: "/api/agent/diagnostics/test-failure",
      headers: adminHeaders({
        authorization: `Basic ${token}`,
        origin: "https://attacker.example",
      }),
      body: JSON.stringify({ idempotencyKey: "failure-20260802-0005" }),
    },
    response,
  );
  assert.equal(response.status, 403);

  const unknownResponse = createResponse();
  await handler(
    {
      method: "POST",
      url: "/api/agent/diagnostics/test-failure",
      headers: adminHeaders({ authorization: `Basic ${token}` }),
      body: JSON.stringify({
        idempotencyKey: "failure-20260802-0005",
        command: "rm -rf /",
      }),
    },
    unknownResponse,
  );
  assert.equal(unknownResponse.status, 400);
  assert.equal(called, false);
});
