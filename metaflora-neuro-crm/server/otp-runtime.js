import { createTelegramGatewayOtpService } from "./otp-auth-service.js";

export function createOtpRuntime({
  env = process.env,
  isProduction = false,
  warn = console.warn,
} = {}) {
  try {
    return createTelegramGatewayOtpService({ env });
  } catch (error) {
    if (isProduction) throw error;
    warn(
      JSON.stringify({
        level: "warn",
        event: "crm.otp.disabled",
        message: error instanceof Error ? error.message : "unknown error",
      }),
    );
    return null;
  }
}
