import assert from "node:assert/strict";
import test from "node:test";

import {
  PendingPaymentDisabledError,
  ProviderConfigurationError,
  YooKassaRequestError,
  createYooKassaPendingTestPayment,
} from "./yookassa.js";

const ENABLED_ENV = Object.freeze({
  ENABLE_YOOKASSA_PENDING_TESTS: "true",
  YOOKASSA_SHOP_ID: "1419483",
  YOOKASSA_SECRET_KEY: "live-secret-value",
});

const VALID_INPUT = Object.freeze({
  amount: "1.00",
  currency: "RUB",
  description: "проверка CRM без списания",
  idempotenceKey: "crm-test-payment-0001",
  returnUrl: "http://localhost:5173/finance",
  metadata: {
    crmTest: true,
    userId: "test-user-paid",
  },
});

test("pending payment is blocked unless the explicit feature flag is enabled", async () => {
  let fetchCalled = false;

  await assert.rejects(
    () =>
      createYooKassaPendingTestPayment(VALID_INPUT, {
        env: {
          ...ENABLED_ENV,
          ENABLE_YOOKASSA_PENDING_TESTS: "false",
        },
        fetchImpl: async () => {
          fetchCalled = true;
        },
      }),
    PendingPaymentDisabledError,
  );

  assert.equal(fetchCalled, false);
});

test("missing YooKassa credentials fail before any request", async () => {
  await assert.rejects(
    () =>
      createYooKassaPendingTestPayment(VALID_INPUT, {
        env: { ENABLE_YOOKASSA_PENDING_TESTS: "true" },
        fetchImpl: async () => {
          throw new Error("fetch must not be called");
        },
      }),
    ProviderConfigurationError,
  );
});

test("invalid payment input is rejected locally", async () => {
  await assert.rejects(
    () =>
      createYooKassaPendingTestPayment(
        { ...VALID_INPUT, amount: "0.00" },
        { env: ENABLED_ENV, fetchImpl: async () => new Response() },
      ),
    /amount/,
  );

  await assert.rejects(
    () =>
      createYooKassaPendingTestPayment(
        { ...VALID_INPUT, currency: "USD" },
        { env: ENABLED_ENV, fetchImpl: async () => new Response() },
      ),
    /currency/,
  );

  await assert.rejects(
    () =>
      createYooKassaPendingTestPayment(
        {
          ...VALID_INPUT,
          metadata: { ...VALID_INPUT.metadata, crmTest: false },
        },
        { env: ENABLED_ENV, fetchImpl: async () => new Response() },
      ),
    /crmTest/,
  );

  await assert.rejects(
    () =>
      createYooKassaPendingTestPayment(
        {
          ...VALID_INPUT,
          returnUrl: "https://attacker.example/collect",
        },
        { env: ENABLED_ENV, fetchImpl: async () => new Response() },
      ),
    /origin/,
  );

  await assert.rejects(
    () =>
      createYooKassaPendingTestPayment(
        {
          ...VALID_INPUT,
          metadata: { ...VALID_INPUT.metadata, userId: "invalid user id" },
        },
        { env: ENABLED_ENV, fetchImpl: async () => new Response() },
      ),
    /userId/,
  );
});

test("adapter creates an uncaptured pending payment and returns a safe projection", async () => {
  let capturedRequest;
  const result = await createYooKassaPendingTestPayment(VALID_INPUT, {
    env: ENABLED_ENV,
    fetchImpl: async (url, options) => {
      capturedRequest = { url, options };
      return new Response(
        JSON.stringify({
          id: "2f8d-test-payment",
          status: "pending",
          paid: false,
          amount: { value: "1.00", currency: "RUB" },
          created_at: "2026-07-30T12:00:00.000Z",
          confirmation: {
            type: "redirect",
            confirmation_url: "https://yoomoney.ru/checkout/test",
          },
          recipient: { account_id: "secret-account" },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    },
  });

  const body = JSON.parse(capturedRequest.options.body);
  const authorization = capturedRequest.options.headers.Authorization;

  assert.equal(capturedRequest.url, "https://api.yookassa.ru/v3/payments");
  assert.equal(capturedRequest.options.method, "POST");
  assert.equal(body.capture, false);
  assert.deepEqual(body.amount, { value: "1.00", currency: "RUB" });
  assert.equal(body.metadata.crm_test, true);
  assert.equal(body.metadata.crm_user_id, "test-user-paid");
  assert.match(authorization, /^Basic /);
  assert.equal(authorization.includes("live-secret-value"), false);
  assert.deepEqual(result, {
    id: "2f8d-test-payment",
    status: "pending",
    paid: false,
    amount: { value: "1.00", currency: "RUB" },
    createdAt: "2026-07-30T12:00:00.000Z",
  });
  assert.equal(JSON.stringify(result).includes("secret-account"), false);
});

test("provider failures return a generic error without leaking credentials or response bodies", async () => {
  let error;

  try {
    await createYooKassaPendingTestPayment(VALID_INPUT, {
      env: ENABLED_ENV,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            description: "card data and live-secret-value must stay private",
          }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        ),
    });
  } catch (caughtError) {
    error = caughtError;
  }

  assert.equal(error instanceof YooKassaRequestError, true);
  assert.equal(error.statusCode, 401);
  assert.equal(error.message.includes("live-secret-value"), false);
  assert.equal(error.message.includes("card data"), false);
});

test("adapter refuses any response that is already paid or no longer pending", async () => {
  await assert.rejects(
    () =>
      createYooKassaPendingTestPayment(VALID_INPUT, {
        env: ENABLED_ENV,
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              id: "unexpected-paid-payment",
              status: "succeeded",
              paid: true,
              amount: { value: "1.00", currency: "RUB" },
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          ),
      }),
    YooKassaRequestError,
  );
});

test("configured HTTPS CRM origin is allowed in production", async () => {
  let capturedBody;

  await createYooKassaPendingTestPayment(
    {
      ...VALID_INPUT,
      returnUrl: "https://crm.metaflora.ru/finance?payment=test",
    },
    {
      env: {
        ...ENABLED_ENV,
        NODE_ENV: "production",
        CRM_ALLOWED_RETURN_ORIGINS: "https://crm.metaflora.ru",
      },
      fetchImpl: async (_url, options) => {
        capturedBody = JSON.parse(options.body);
        return new Response(
          JSON.stringify({
            id: "configured-origin-payment",
            status: "pending",
            paid: false,
            amount: { value: "1.00", currency: "RUB" },
            created_at: "2026-07-30T12:00:00.000Z",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    },
  );

  assert.equal(
    capturedBody.confirmation.return_url,
    "https://crm.metaflora.ru/finance?payment=test",
  );
});
