import assert from "node:assert/strict";
import { test } from "node:test";
import { createTelegramGatewayOtpService } from "./otp-auth-service.js";

const ENV = Object.freeze({
  TELEGRAM_GATEWAY_TOKEN: "gateway-test-token",
  TELEGRAM_GATEWAY_PHONE_NUMBER: "+79990000000",
  TELEGRAM_GATEWAY_CALLBACK_URL: "https://crm.example.com/api/auth/callback",
});

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("requests a fresh Telegram-generated code without exposing gateway identifiers", async () => {
  const requests = [];
  const service = createTelegramGatewayOtpService({
    env: ENV,
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return response({ ok: true, result: { request_id: "telegram-request-1" } });
    },
    randomId: () => "public-challenge-1",
    nowMs: () => 1_000,
  });

  const result = await service.requestCode({ clientKey: "client-1" });

  assert.deepEqual(result, {
    challengeId: "public-challenge-1",
    expiresAt: new Date(301_000).toISOString(),
  });
  assert.equal(requests[0].url, "https://gatewayapi.telegram.org/sendVerificationMessage");
  const payload = JSON.parse(requests[0].options.body);
  assert.equal(payload.phone_number, "+79990000000");
  assert.equal(payload.code_length, 6);
  assert.equal(Object.hasOwn(payload, "code"), false);
  assert.equal(requests[0].options.headers.authorization, "Bearer gateway-test-token");
  assert.doesNotMatch(JSON.stringify(result), /telegram-request-1|token|\+7999/);
});

test("valid code creates a one-use session and rejects replay", async () => {
  let now = 1_000;
  const replies = [
    { ok: true, result: { request_id: "telegram-request-1" } },
    {
      ok: true,
      result: {
        request_id: "telegram-request-1",
        verification_status: { status: "code_valid" },
      },
    },
  ];
  const service = createTelegramGatewayOtpService({
    env: ENV,
    fetchImpl: async () => response(replies.shift()),
    randomId: (() => {
      const ids = ["challenge-1", "session-1"];
      return () => ids.shift();
    })(),
    nowMs: () => now,
  });
  await service.requestCode({ clientKey: "client-1" });

  const verified = await service.verifyCode({
    challengeId: "challenge-1",
    code: "123456",
    clientKey: "client-1",
  });

  assert.deepEqual(verified, {
    sessionToken: "session-1",
    expiresAt: new Date(28_801_000).toISOString(),
  });
  assert.equal(service.isSessionValid("session-1"), true);
  await assert.rejects(
    service.verifyCode({
      challengeId: "challenge-1",
      code: "123456",
      clientKey: "client-1",
    }),
    /challenge is invalid/i,
  );
  service.revokeSession("session-1");
  assert.equal(service.isSessionValid("session-1"), false);
  now = 30_000_000;
});

test("invalid codes are bounded and rate limiting fails closed", async () => {
  let calls = 0;
  const service = createTelegramGatewayOtpService({
    env: ENV,
    fetchImpl: async (_url, options) => {
      calls += 1;
      if (options.body.includes("phone_number")) {
        return response({ ok: true, result: { request_id: `request-${calls}` } });
      }
      return response({
        ok: true,
        result: { verification_status: { status: "code_invalid" } },
      });
    },
    randomId: (() => {
      let index = 0;
      return () => `id-${++index}`;
    })(),
    nowMs: () => 1_000,
    requestLimit: 2,
  });

  await service.requestCode({ clientKey: "client-1" });
  await service.requestCode({ clientKey: "client-1" });
  await assert.rejects(
    service.requestCode({ clientKey: "client-1" }),
    /too many code requests/i,
  );
  await assert.rejects(
    service.verifyCode({
      challengeId: "id-1",
      code: "000000",
      clientKey: "client-1",
    }),
    /code is invalid/i,
  );
});

test("configuration is validated without returning secret values", () => {
  assert.throws(
    () =>
      createTelegramGatewayOtpService({
        env: { TELEGRAM_GATEWAY_TOKEN: "", TELEGRAM_GATEWAY_PHONE_NUMBER: "123" },
      }),
    /TELEGRAM_GATEWAY_TOKEN is required/,
  );
  assert.throws(
    () =>
      createTelegramGatewayOtpService({
        env: {
          TELEGRAM_GATEWAY_TOKEN: "token",
          TELEGRAM_GATEWAY_PHONE_NUMBER: "89990000000",
        },
      }),
    /E.164/,
  );
});
