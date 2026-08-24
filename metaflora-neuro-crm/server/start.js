import { createServer } from "node:http";
import { createCrmAgentServiceFromEnv } from "./agent-service.js";
import { createCrmRequestHandler } from "./http-app.js";
import { createOtpRuntime } from "./otp-runtime.js";
import { createSupabaseCrmAdapterFromEnv } from "./supabase-crm.js";
import {
  createDiagnosticService,
  startDailyDiagnosticScheduler,
} from "./diagnostic-service.js";
import {
  createPersistentBrowserSessionService,
  preparePersistentBrowserProfile,
} from "./persistent-browser-profile.js";
import {
  createPlaywrightBrowserPaymentAdapter,
  createPolzaBrowserFundingConfig,
  createPolzaBrowserFundingConnector,
} from "./polza-browser-funding.js";
import { createPolzaMcpFundingClient } from "./polza-mcp-funding.js";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const isProduction = process.env.NODE_ENV === "production";
const adminUsername = process.env.CRM_ADMIN_USERNAME?.trim() || "admin";

const otpAuthService = createOtpRuntime({ env: process.env, isProduction });

required("SUPABASE_URL");
required("SUPABASE_SERVICE_ROLE_KEY");
const adapter = createSupabaseCrmAdapterFromEnv(process.env);
const persistentBrowserProfile = await preparePersistentBrowserProfile({ env: process.env });
const browserFundingConfig = createPolzaBrowserFundingConfig(process.env);
let providerFundingConnector = null;
if (
  browserFundingConfig.enabled
  && persistentBrowserProfile.ready
  && process.env.POLZA_MCP_TOKEN?.trim()
) {
  const polzaMcp = createPolzaMcpFundingClient({
    endpoint: process.env.POLZA_MCP_ENDPOINT || "https://polza.ai/api/mcp",
    token: process.env.POLZA_MCP_TOKEN,
  });
  const browserPayment = createPlaywrightBrowserPaymentAdapter({
    profileDir: persistentBrowserProfile.profileDir,
    sessionName: browserFundingConfig.sessionName,
    autoSubmit: browserFundingConfig.autoSubmit,
    cardHint: browserFundingConfig.cardHint || "",
    authorizationUrl: browserFundingConfig.checkoutUrl,
  });
  providerFundingConnector = createPolzaBrowserFundingConnector({
    mcp: polzaMcp,
    browserPayment,
    balanceUrl: browserFundingConfig.checkoutUrl,
    allowedCheckoutHosts: browserFundingConfig.allowedHosts,
    logger: {
      info: (event, context) => console.info(JSON.stringify({ level: "info", event, ...context })),
      warn: (event, context) => console.warn(JSON.stringify({ level: "warn", event, ...context })),
      error: (event, context) => console.error(JSON.stringify({ level: "error", event, ...context })),
    },
  });
}
const browserSessionService = createPersistentBrowserSessionService({
  profileResult: persistentBrowserProfile,
  fundingConnector: providerFundingConnector,
});
console.log(JSON.stringify({
  level: persistentBrowserProfile.ready ? "info" : "warn",
  event: "crm.provider_funding.browser_session",
  persistent: persistentBrowserProfile.persistent,
  storage: persistentBrowserProfile.storage,
  authorization: persistentBrowserProfile.authorization,
  ready: persistentBrowserProfile.ready,
  error: persistentBrowserProfile.error ?? null,
}));
const diagnosticService = createDiagnosticService({
  store: adapter.createDiagnosticStore(),
  allowControlledFailure:
    process.env.CRM_CONTROLLED_FAILURE_ENABLED?.trim().toLowerCase() === "true",
});

const handler = createCrmRequestHandler({
  getDashboardData: () => adapter.getDashboardData(),
  getUserDetails: (userId) => adapter.getUserDetails(userId),
  adjustMetacoins: (command) => adapter.adjustMetacoins(command),
  changeSubscription: (command) => adapter.changeSubscription(command),
  probeProvider: (providerId) => adapter.probeProvider(providerId),
  createPromo: (command) => adapter.createPromo(command),
  adminUsername,
  otpAuthService,
  csrfToken: process.env.CRM_CSRF_TOKEN?.trim() ?? "",
  allowedOrigins: process.env.CRM_ALLOWED_RETURN_ORIGINS ?? "",
  agentService: createCrmAgentServiceFromEnv(process.env, {
    getDashboardData: () => adapter.getDashboardData(),
    getDiagnosticSnapshot: () => diagnosticService.getSnapshot(),
  }),
  browserSessionService,
  providerFundingConnector,
  providerFundingServiceToken: process.env.POLZA_BROWSER_CONNECTOR_TOKEN?.trim() || "",
  diagnosticService,
});

const diagnosticScheduler = startDailyDiagnosticScheduler({
  service: diagnosticService,
  owner: process.env.RAILWAY_REPLICA_ID?.trim() || "crm-diagnostics",
});

const port = Number(process.env.PORT || 3000);
const server = createServer(handler);

server.listen(port, "0.0.0.0", () => {
  console.log(
    JSON.stringify({
      level: "info",
      event: "crm.started",
      port,
      supabaseSchema: process.env.SUPABASE_HISTORY_SCHEMA?.trim() || "neuro",
    }),
  );
});

async function shutdown(signal) {
  console.log(JSON.stringify({ level: "info", event: "crm.stopping", signal }));
  diagnosticScheduler.stop();
  await providerFundingConnector?.close?.().catch(() => {});
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => { void shutdown("SIGINT"); });
process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
