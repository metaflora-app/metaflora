import assert from "node:assert/strict";
import test from "node:test";
import { createOtpRuntime } from "./otp-runtime.js";

test("production fails closed when Telegram OTP is unavailable", () => {
  assert.throws(
    () =>
      createOtpRuntime({
        env: { TELEGRAM_GATEWAY_TOKEN: "", TELEGRAM_GATEWAY_PHONE_NUMBER: "" },
        isProduction: true,
      }),
    /TELEGRAM_GATEWAY_TOKEN is required/,
  );
});

test("local development may start without Telegram OTP", () => {
  const runtime = createOtpRuntime({
    env: { TELEGRAM_GATEWAY_TOKEN: "", TELEGRAM_GATEWAY_PHONE_NUMBER: "" },
    isProduction: false,
    warn: () => {},
  });

  assert.equal(runtime, null);
});
