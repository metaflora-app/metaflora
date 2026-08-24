const defineProvider = (definition) =>
  Object.freeze({
    frozen: false,
    ...definition,
    capabilities: Object.freeze([...definition.capabilities]),
    requiredEnv: Object.freeze([...definition.requiredEnv]),
  });

export const PROVIDER_DEFINITIONS = Object.freeze([
  defineProvider({
    id: "polza",
    label: "Polza",
    capabilities: ["text", "image", "video", "music", "voice"],
    requiredEnv: ["POLZA_API_KEY"],
    priority: 1,
    topUpUrl: "https://polza.ai/balance",
    probeSupported: true,
    balanceSupported: true,
  }),
  defineProvider({
    id: "routerai",
    label: "RouterAI",
    capabilities: ["text", "image", "video", "music", "voice"],
    requiredEnv: ["ROUTERAI_API_KEY"],
    priority: 2,
    topUpUrl: "https://routerai.ru/settings/billing",
    // RouterAI documents its OpenAI-compatible inference endpoint, but does
    // not document a side-effect-free credential/balance probe. Do not turn
    // an inferred endpoint into a production health check.
    probeSupported: false,
    balanceSupported: false,
  }),
  defineProvider({
    id: "gptunnel",
    label: "GPTunnel",
    capabilities: ["text", "image", "video", "music", "voice"],
    requiredEnv: [],
    priority: 99,
    topUpUrl: null,
    probeSupported: false,
    balanceSupported: false,
    frozen: true,
  }),
  defineProvider({
    id: "openrouter",
    label: "OpenRouter",
    capabilities: ["text"],
    requiredEnv: ["OPENROUTER_API_KEY"],
    priority: 100,
    topUpUrl: "https://openrouter.ai/credits",
    probeSupported: false,
    balanceSupported: false,
    frozen: true,
  }),
  defineProvider({
    id: "fal",
    label: "fal.ai",
    capabilities: ["image", "video", "audio"],
    requiredEnv: ["FAL_KEY"],
    priority: 101,
    topUpUrl: "https://fal.ai/dashboard/billing",
    probeSupported: false,
    balanceSupported: false,
    frozen: true,
  }),
  defineProvider({
    id: "replicate",
    label: "Replicate",
    capabilities: ["image", "video", "audio"],
    requiredEnv: ["REPLICATE_API_TOKEN"],
    priority: 102,
    topUpUrl: "https://replicate.com/account/billing",
    probeSupported: false,
    balanceSupported: false,
    frozen: true,
  }),
  defineProvider({
    id: "elevenlabs",
    label: "ElevenLabs",
    capabilities: ["voice", "music"],
    requiredEnv: ["ELEVENLABS_API_KEY"],
    priority: 103,
    topUpUrl: "https://elevenlabs.io/app/subscription",
    probeSupported: false,
    balanceSupported: false,
    frozen: true,
  }),
  defineProvider({
    id: "suno",
    label: "Suno",
    capabilities: ["music"],
    requiredEnv: [],
    priority: 104,
    topUpUrl: null,
    probeSupported: false,
    balanceSupported: false,
    frozen: true,
  }),
]);

// Historical integrations remain in old audit rows only. They are intentionally
// excluded from routing, health checks, automatic top-ups, and the active CRM view.
export const FROZEN_PROVIDER_IDS = Object.freeze([
  "gptunnel",
  "openrouter",
  "elevenlabs",
  "replicate",
  "fal",
  "suno",
]);

const hasUsableValue = (value) =>
  typeof value === "string" && value.trim().length > 0;

const DEFAULT_API_RESERVE_PERCENT = 46.5;
const DEFAULT_PROVIDER_WEIGHTS = Object.freeze({ polza: 349, routerai: 116 });
const PRIMARY_PROVIDER_BUFFER_PERCENT = 5;
const PROVIDER_MINIMUMS_KOPECKS = Object.freeze({ routerai: 10_000 });
const MCP_FUNDING_TOKEN_ENV_NAMES = Object.freeze([
  "MCP_FUNDING_TOKEN",
  "MCP_FUNDING_WORKER_TOKEN",
  "POLZA_MCP_TOKEN",
]);

function finitePercent(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : fallback;
}

function booleanFlag(value) {
  return String(value ?? "").trim().toLowerCase() === "true";
}

function normalizeWorkerResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const allocationKey = String(value.allocationKey ?? "").trim();
  const paymentId = String(value.paymentId ?? "").trim();
  const status = String(value.status ?? "").trim().toLowerCase();
  const provider = String(value.provider ?? "").trim().toLowerCase();
  const amountKopecks = Number(value.amountKopecks);
  if (!/^[a-z][a-z0-9_-]{1,48}$/.test(provider)
    || !["queued", "processing", "succeeded", "failed", "manual"].includes(status)
    || !Number.isInteger(amountKopecks)
    || amountKopecks <= 0) {
    return null;
  }
  return Object.freeze({
    ...(allocationKey ? { allocationKey } : {}),
    ...(paymentId ? { paymentId } : {}),
    status,
    provider,
    amountKopecks,
  });
}

function getMcpFundingWorkerConfiguration(env, workerResult) {
  const tokenConfigured = MCP_FUNDING_TOKEN_ENV_NAMES.some((environmentName) =>
    hasUsableValue(env[environmentName]),
  );
  const workerEnabled = booleanFlag(
    env.MCP_FUNDING_WORKER_ENABLED
      ?? env.MCP_FUNDING_ENABLED
      ?? env.ENABLE_PROVIDER_FUNDING_WORKER,
  );
  const billingDanger = booleanFlag(
    env.MCP_FUNDING_BILLING_DANGER
      ?? env.POLZA_MCP_BILLING_DANGER,
  );
  const tokenStatus = tokenConfigured ? "токен настроен" : "токен не настроен";
  const workerStatus = workerEnabled ? "worker включён" : "worker выключен";
  const billingStatus = billingDanger ? "billing danger включён" : "billing danger выключен";
  const ready = tokenConfigured
    && workerEnabled
    && billingDanger
    && workerResult?.status === "succeeded";
  const resultStatus = workerResult
    ? `worker result: ${workerResult.status}`
    : "ожидается результат queue/worker";

  return Object.freeze({
    id: "mcp_funding_worker",
    label: "MCP funding worker",
    tokenConfigured,
    workerEnabled,
    billingDanger,
    ready,
    status: `${tokenStatus}; ${workerStatus}; ${billingStatus}; ${resultStatus}`,
    workerResult,
    note: ready
      ? "готовность подтверждена фактическим результатом funding worker"
      : "готовность не подтверждается без фактического результата queue/worker",
  });
}

function isDirectChargeContractConfigured(env) {
  return hasUsableValue(env.POLZA_MCP_DIRECT_CHARGE_TOOL)
    && hasUsableValue(env.POLZA_MCP_DIRECT_CHARGE_ARGUMENTS_JSON);
}

function getBrowserFundingConfiguration(env) {
  const enabled = String(env.POLZA_BROWSER_FUNDING_ENABLED ?? "").trim().toLowerCase() === "true";
  const autoSubmit = String(env.POLZA_BROWSER_AUTO_SUBMIT ?? "").trim().toLowerCase() === "true";
  const mcpTokenConfigured = hasUsableValue(env.POLZA_MCP_TOKEN);
  const connectorTokenConfigured = hasUsableValue(env.POLZA_BROWSER_CONNECTOR_TOKEN);
  const profileConfigured = hasUsableValue(env.RAILWAY_VOLUME_MOUNT_PATH)
    && hasUsableValue(env.HERMES_BROWSER_PROFILE_DIR);
  const ready = enabled && autoSubmit && mcpTokenConfigured && connectorTokenConfigured && profileConfigured;
  return Object.freeze({
    id: "polza_persistent_browser",
    label: "Polza persistent browser connector",
    enabled,
    autoSubmit,
    mcpTokenConfigured,
    connectorTokenConfigured,
    profileConfigured,
    ready,
    status: ready
      ? "настроен; готовность подтверждается только реальным verify после оплаты"
      : enabled
        ? "не готов: требуется постоянный профиль, MCP-токен, внутренний токен и включённая отправка"
        : "выключен",
    loginPerPayment: false,
    note: "однократная авторизация профиля; далее custom-amount checkout без повторного входа",
  });
}

function getRouterAiBrowserFundingConfiguration(env) {
  const enabled = booleanFlag(env.ROUTERAI_BROWSER_FUNDING_ENABLED);
  const killSwitch = booleanFlag(env.ROUTERAI_BROWSER_FUNDING_KILL_SWITCH);
  const profileConfigured = hasUsableValue(env.RAILWAY_VOLUME_MOUNT_PATH)
    && hasUsableValue(env.HERMES_BROWSER_PROFILE_DIR);
  const configured = enabled && !killSwitch && profileConfigured;
  // Configuration alone cannot prove that RouterAI cookies are still valid,
  // that the saved card is selectable, or that a charge was reconciled.
  // Runtime readiness belongs to the funding worker status endpoint.
  const ready = false;
  return Object.freeze({
    id: "routerai_persistent_browser",
    label: "RouterAI persistent browser worker",
    enabled,
    killSwitch,
    profileConfigured,
    configured,
    ready,
    minimumAmount: 100,
    minimumCurrency: "RUB",
    loginPerPayment: false,
    status: configured
      ? "настроен; runtime-готовность подтверждается только статусом funding-worker"
      : enabled
        ? killSwitch
          ? "контур остановлен kill switch"
          : "не готов: постоянный профиль должен находиться на Railway Volume"
        : "выключен",
    note: "однократная авторизация в постоянном профиле; каждая доля от 100 ₽ отправляется отдельно, без накопления",
  });
}

function positiveProviderWeights(value) {
  const source = String(value ?? "").trim();
  if (!source) return { ...DEFAULT_PROVIDER_WEIGHTS };
  try {
    const parsed = JSON.parse(source);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ...DEFAULT_PROVIDER_WEIGHTS };
    const entries = Object.entries(parsed)
      .map(([provider, weight]) => [String(provider).trim().toLowerCase(), Number(weight)])
      .filter(([provider, weight]) => /^[a-z][a-z0-9_-]{1,48}$/.test(provider) && Number.isFinite(weight) && weight > 0);
    return entries.length ? Object.fromEntries(entries) : { ...DEFAULT_PROVIDER_WEIGHTS };
  } catch {
    return { ...DEFAULT_PROVIDER_WEIGHTS };
  }
}

export function getFinanceConfiguration(env = process.env, workerContext = {}) {
  const workerResult = normalizeWorkerResult(workerContext?.workerResult ?? workerContext);
  const tbankPayoutsEnabled = String(env.TBANK_PAYOUTS_ENABLED ?? "").trim().toLowerCase() === "true";
  const tbankCredentialsConfigured = (hasUsableValue(env.TBANK_PAYOUT_TERMINAL_KEY)
    && hasUsableValue(env.TBANK_PAYOUT_PRIVATE_KEY_BASE64)
    && hasUsableValue(env.TBANK_PAYOUT_CERT_SERIAL)
    && hasUsableValue(env.TBANK_PAYOUT_NOTIFICATION_PASSWORD))
    || String(env.TBANK_PAYOUT_CREDENTIALS_CONFIGURED ?? "").trim().toLowerCase() === "true";
  const yookassaPayoutsEnabled = String(env.YOOKASSA_PAYOUTS_ENABLED ?? "").trim().toLowerCase() === "true";
  const yookassaCredentialsConfigured = (hasUsableValue(env.YOOKASSA_PAYOUT_AGENT_ID)
    && hasUsableValue(env.YOOKASSA_PAYOUT_SECRET_KEY))
    || String(env.YOOKASSA_PAYOUT_CREDENTIALS_CONFIGURED ?? "").trim().toLowerCase() === "true";
  const payoutProvider = tbankPayoutsEnabled || tbankCredentialsConfigured
    ? Object.freeze({
      id: "tbank_mass_payouts",
      label: "Т‑Бизнес массовые выплаты",
      enabled: tbankPayoutsEnabled,
      credentialsConfigured: tbankCredentialsConfigured,
      methods: Object.freeze(["sbp"]),
      activationReady: "проведи тестовую выплату через СБП",
      activationPending: "подключи массовые выплаты Т‑Бизнеса и добавь payout-реквизиты в Railway",
    })
    : Object.freeze({
      id: "yookassa_payouts",
      label: "ЮKassa Payouts API",
      enabled: yookassaPayoutsEnabled,
      credentialsConfigured: yookassaCredentialsConfigured,
      methods: Object.freeze(["card_ru", "sbp"]),
      activationReady: "проведи тестовую выплату на небольшую сумму",
      activationPending: "включи отдельный договор выплат и добавь payout-реквизиты в Railway",
    });
  const payoutsEnabled = payoutProvider.enabled;
  const credentialsConfigured = payoutProvider.credentialsConfigured;
  const ready = payoutsEnabled && credentialsConfigured;
  const status = ready
    ? "готова к тестовой выплате"
    : payoutsEnabled && !credentialsConfigured
      ? "неполная настройка"
      : credentialsConfigured
        ? "ждёт включения"
        : "отключена";
  const apiReservePercent = finitePercent(env.API_RESERVE_PERCENT, DEFAULT_API_RESERVE_PERCENT);
  const mcpFundingWorker = getMcpFundingWorkerConfiguration(env, workerResult);
  const browserFunding = getBrowserFundingConfiguration(env);
  const routerAiBrowserFunding = getRouterAiBrowserFundingConfiguration(env);
  const browserFundingConfigured = browserFunding.enabled
    || browserFunding.mcpTokenConfigured
    || browserFunding.connectorTokenConfigured
    || browserFunding.profileConfigured;
  const directChargeConfigured = isDirectChargeContractConfigured(env);
  const automaticProviderTopups = Boolean(
    browserFunding.ready
    || (
      mcpFundingWorker.tokenConfigured
      && mcpFundingWorker.workerEnabled
      && mcpFundingWorker.billingDanger
      && directChargeConfigured
    )
  );

  return Object.freeze({
    payout: Object.freeze({
      id: payoutProvider.id,
      label: payoutProvider.label,
      enabled: payoutsEnabled,
      credentialsConfigured,
      ready,
      status,
      methods: payoutProvider.methods,
      activation: ready ? payoutProvider.activationReady : payoutProvider.activationPending,
    }),
    apiReserve: Object.freeze({
      percent: apiReservePercent,
      allocationMode: "product_aware_dual_primary_liability",
      primaryProviderBufferPercent: PRIMARY_PROVIDER_BUFFER_PERCENT,
      providerMinimumsKopecks: PROVIDER_MINIMUMS_KOPECKS,
      legacyProviderWeights: Object.freeze(positiveProviderWeights(env.API_RESERVE_PROVIDER_WEIGHTS_JSON)),
    }),
    mcpFundingWorker,
    ...(browserFundingConfigured ? { browserFunding } : {}),
    routerAiBrowserFunding,
    providerTopups: Object.freeze({
      mode: "yookassa_confirmed_queue",
      automatic: automaticProviderTopups,
      status: automaticProviderTopups
        ? "payment.succeeded ставит заявки в очередь; workers отправляют их в Polza/RouterAI и проверяют результат"
        : "очередь создаётся после payment.succeeded; внешний шлюз не подключён",
      confirmationGate: "yookassa_payment_succeeded",
      fundingGateway: browserFunding.enabled
        ? routerAiBrowserFunding.enabled
          ? "Polza + RouterAI persistent browser workers"
          : "CRM persistent browser custom-amount connector"
        : routerAiBrowserFunding.enabled
          ? "RouterAI persistent browser saved-card worker"
        : directChargeConfigured
          ? "Polza MCP billing.danger"
          : "не настроен",
      note: automaticProviderTopups
        ? browserFunding.ready
          ? "CRM держит постоянный профиль: worker открывает custom-amount ссылку, использует сохранённую карту и сверяет транзакцию и баланс; повторного логина на каждый платёж нет"
          : "очередь создаётся после payment.succeeded; браузерный connector не считается готовым до подтверждения авторизации и тестовой транзакции"
        : "CRM фиксирует оплату и создаёт заявку. Для реального списания бизнес-карты нужен внешний банк/эквайер или API автопополнения провайдера; CRM не хранит PAN/CVV",
      providers: Object.freeze([
        Object.freeze({
          id: "polza",
          label: "Polza",
          mode: browserFunding.enabled ? "persistent_browser_checkout" : "provider_dashboard",
          status: browserFunding.enabled
            ? browserFunding.ready ? "custom-amount connector configured" : "нужен автономный custom-amount connector"
            : "нужен внешний шлюз оплаты",
          minimumAmount: 100,
          minimumCurrency: "RUB",
          fundingMethods: Object.freeze(["sbp_saved_account", "sbp", "bank_card", "invoice"]),
          invoiceMinimumAmount: 5_000,
          invoiceMinimumCurrency: "RUB",
          note: browserFunding.enabled
            ? "подтверждённые резервы Polza накапливаются в очереди; worker атомарно объединяет их и пополняет от 100 ₽ через постоянный браузерный профиль, поэтому логин на каждый платёж не требуется"
            : "карта и СБП доступны в кабинете; счёт для юрлица на скриншоте — от 5 000 ₽. CRM не может списывать бизнес-карту без отдельного шлюза",
          topUpUrl: "https://polza.ai/balance",
        }),
        Object.freeze({
          id: "routerai",
          label: "RouterAI",
          mode: "persistent_browser_saved_card",
          executionOwner: "external_funding_agent",
          crmChargeSupported: false,
          status: routerAiBrowserFunding.status,
          minimumAmount: 100,
          minimumCurrency: "RUB",
          fundingMethods: Object.freeze(["saved_bank_card", "sbp"]),
          note: "исполняет отдельный funding-agent; CRM только наблюдает статусы. Worker использует постоянный профиль и сохранённую карту; доля меньше 100 ₽ отклоняется, а не накапливается",
          topUpUrl: "https://routerai.ru/settings/billing",
        }),
      ]),
    }),
  });
}

/**
 * Returns configuration health only. Secret values never leave this module.
 */
export function getProviderConfiguration(env = process.env) {
  return PROVIDER_DEFINITIONS.map(
    ({
      id,
      label,
      capabilities,
      requiredEnv,
      priority,
      topUpUrl,
      probeSupported,
      balanceSupported,
      frozen,
    }) => {
      const missing = requiredEnv.filter(
        (environmentName) => !hasUsableValue(env[environmentName]),
      );

      const routerAiBalanceConnectorReady = id === "routerai"
        && (hasUsableValue(env.ROUTERAI_VISUALIZATION_API_KEY)
          || (hasUsableValue(env.ROUTERAI_BROWSER_CONNECTOR_URL ?? env.RAILWAY_SERVICE_METAFLORA_POLZA_FUNDING_AGENT_URL)
            && hasUsableValue(env.ROUTERAI_BROWSER_CONNECTOR_TOKEN ?? env.POLZA_BROWSER_CONNECTOR_TOKEN)));
      return {
        id,
        label,
        capabilities: [...capabilities],
        configured: missing.length === 0,
        missing,
        source: "environment",
        priority,
        topUpUrl,
        probeSupported: probeSupported || routerAiBalanceConnectorReady,
        balanceSupported: balanceSupported || routerAiBalanceConnectorReady,
        frozen,
      };
    },
  );
}

export function getProviderConfigurationSummary(env = process.env) {
  const providers = getProviderConfiguration(env);
  const activeProviders = providers.filter(({ frozen }) => frozen !== true);
  const configured = activeProviders.filter(
    (provider) => provider.configured,
  ).length;

  return {
    total: activeProviders.length,
    configured,
    incomplete: activeProviders.length - configured,
    providers,
  };
}
