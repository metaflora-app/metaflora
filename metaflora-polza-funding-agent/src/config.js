import path from "node:path";

function required(name) {
  const value = String(process.env[name] ?? "").trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function positive(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} is invalid`);
  return value;
}

function optional(name) {
  return String(process.env[name] ?? "").trim();
}

export function loadConfig() {
  const port = positive("PORT", 3000);
  const profileDir = String(process.env.BROWSER_PROFILE_DIR || "/data/polza-profile");
  const railwayEnvironmentId = optional("RAILWAY_ENVIRONMENT_ID");
  const relativeToDataVolume = path.relative("/data", path.resolve(profileDir));
  if (railwayEnvironmentId && (!relativeToDataVolume || relativeToDataVolume.startsWith("..") || path.isAbsolute(relativeToDataVolume))) {
    throw new Error("BROWSER_PROFILE_DIR must use a persistent /data volume on Railway");
  }
  const baseSmartWalletOwnerPrivateKey = optional("BASE_SMART_WALLET_OWNER_PRIVATE_KEY");
  const cryptoOwnerPayoutAddress = optional("CRYPTO_OWNER_PAYOUT_ADDRESS");
  const cryptoDirectSettlementEnabled = String(process.env.CRYPTO_DIRECT_SETTLEMENT_ENABLED || "false") === "true";
  if (cryptoDirectSettlementEnabled && (!/^0x[a-fA-F0-9]{64}$/u.test(baseSmartWalletOwnerPrivateKey)
    || !/^0x[a-fA-F0-9]{40}$/u.test(cryptoOwnerPayoutAddress))) {
    throw new Error("Direct USDC settlement requires a Base signer and owner payout address");
  }
  return Object.freeze({
    port,
    releaseId: optional("RELEASE_ID") || "local",
    apiToken: required("FUNDING_AGENT_TOKEN"),
    adminUser: required("FUNDING_ADMIN_USER"),
    adminPassword: required("FUNDING_ADMIN_PASSWORD"),
    mcpToken: required("POLZA_MCP_TOKEN"),
    mcpEndpoint: String(process.env.POLZA_MCP_ENDPOINT || "https://polza.ai/api/mcp"),
    profileDir,
    browserExecutablePath: optional("BROWSER_EXECUTABLE_PATH") || "/usr/bin/google-chrome",
    dashboardUrl: String(process.env.POLZA_DASHBOARD_URL || "https://polza.ai/dashboard"),
    gptunnelEnabled: String(process.env.GPTUNNEL_BROWSER_FUNDING_ENABLED || "false") === "true",
    gptunnelProfileUrl: String(process.env.GPTUNNEL_PROFILE_URL || "https://gptunnel.ru/profile"),
    routerAiEnabled: String(process.env.ROUTERAI_BROWSER_FUNDING_ENABLED || "false") === "true",
    routerAiBillingUrl: String(process.env.ROUTERAI_BILLING_URL || "https://routerai.ru/settings/billing"),
    openRouterEnabled: String(process.env.OPENROUTER_BROWSER_FUNDING_ENABLED || "false") === "true",
    openRouterCreditsUrl: String(process.env.OPENROUTER_CREDITS_URL || "https://openrouter.ai/settings/credits"),
    openRouterManagementKey: optional("OPENROUTER_MANAGEMENT_KEY"),
    openRouterLiveChargingEnabled: String(process.env.OPENROUTER_LIVE_CHARGING_ENABLED || "false") === "true",
    cryptoDirectSettlementEnabled,
    baseSmartWalletOwnerPrivateKey,
    cryptoOwnerPayoutAddress,
    baseRpcUrl: String(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
    baseBundlerUrl: String(process.env.BASE_BUNDLER_URL || "https://public.pimlico.io/v2/8453/rpc"),
    novncTarget: String(process.env.NOVNC_TARGET || "http://127.0.0.1:6080"),
    allowedPaymentHosts: String(process.env.POLZA_PAYMENT_ALLOWED_HOSTS || "polza.ai,yookassa.ru,yoomoney.ru,payanyway.ru,moneta.ru").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean),
    transactionTimeoutMs: positive("FUNDING_TRANSACTION_TIMEOUT_MS", 180000)
  });
}
