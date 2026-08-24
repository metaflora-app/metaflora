import assert from "node:assert/strict";
import test from "node:test";

import {
  PROVIDER_DEFINITIONS,
  getFinanceConfiguration,
  getProviderConfiguration,
  getProviderConfigurationSummary,
} from "./provider-config.js";

const COMPLETE_ENV = Object.freeze({
  ROUTERAI_API_KEY: "routerai-secret",
  POLZA_API_KEY: "polza-secret",
});

test("provider registry exposes only Polza and RouterAI in the active routing contour", () => {
  assert.deepEqual(
    PROVIDER_DEFINITIONS.filter(({ frozen }) => !frozen).map(({ id }) => id),
    ["polza", "routerai"],
  );
  assert.deepEqual(
    PROVIDER_DEFINITIONS.filter(({ frozen }) => frozen).map(({ id }) => id),
    ["gptunnel", "openrouter", "fal", "replicate", "elevenlabs", "suno"],
  );
});

test("configuration status reports readiness without exposing secret values", () => {
  const configuration = getProviderConfiguration(COMPLETE_ENV);
  const serialized = JSON.stringify(configuration);

  assert.equal(
    configuration
      .filter(({ frozen }) => !frozen)
      .every(({ configured }) => configured),
    true,
  );
  assert.equal(serialized.includes("openrouter-secret"), false);
});

test("RouterAI connector credentials enable balance diagnostics but never impersonate the runtime API key", () => {
  const connectorSecret = "routerai-connector-secret-must-not-leak";
  const configuration = getProviderConfiguration({
    POLZA_API_KEY: "polza-secret",
    ROUTERAI_BROWSER_CONNECTOR_TOKEN: connectorSecret,
  });
  const routerai = configuration.find(({ id }) => id === "routerai");

  assert.equal(routerai.configured, false);
  assert.deepEqual(routerai.missing, ["ROUTERAI_API_KEY"]);
  assert.equal(routerai.balanceSupported, false);
  assert.equal(JSON.stringify(configuration).includes(connectorSecret), false);
  assert.equal(JSON.stringify(routerai).includes("secret"), false);
});

test("blank values are treated as missing and only environment names are returned", () => {
  const configuration = getProviderConfiguration({
    POLZA_API_KEY: "   ",
  });
  const polza = configuration.find(({ id }) => id === "polza");

  assert.deepEqual(polza, {
    id: "polza",
    label: "Polza",
    capabilities: ["text", "image", "video", "music", "voice"],
    configured: false,
    missing: ["POLZA_API_KEY"],
    source: "environment",
    priority: 1,
    topUpUrl: "https://polza.ai/balance",
    probeSupported: true,
    balanceSupported: true,
    frozen: false,
  });
});

test("configuration summary counts configured and incomplete providers", () => {
  assert.deepEqual(getProviderConfigurationSummary(COMPLETE_ENV), {
    total: 2,
    configured: 2,
    incomplete: 0,
    providers: getProviderConfiguration(COMPLETE_ENV),
  });
});

test("Polza exposes balance while RouterAI probe remains explicitly unsupported", () => {
  const configuration = new Map(
    getProviderConfiguration(COMPLETE_ENV).map((provider) => [
      provider.id,
      provider,
    ]),
  );

  assert.equal(configuration.get("polza").probeSupported, true);
  assert.equal(configuration.get("polza").balanceSupported, true);
  assert.equal(configuration.get("routerai").probeSupported, false);
  assert.equal(configuration.get("routerai").balanceSupported, false);
});

test("enables RouterAI browser balance only with a complete trusted connector", () => {
  const configuration = getProviderConfiguration({
    ROUTERAI_API_KEY: "router-test",
    ROUTERAI_BROWSER_CONNECTOR_URL: "https://funding.example.test",
    ROUTERAI_BROWSER_CONNECTOR_TOKEN: "connector-test",
  });
  const routerai = configuration.find(({ id }) => id === "routerai");
  assert.equal(routerai.probeSupported, true);
  assert.equal(routerai.balanceSupported, true);
});

test("finance configuration exposes payout readiness without exposing secrets", () => {
  const configuration = getFinanceConfiguration({
    YOOKASSA_PAYOUTS_ENABLED: "true",
    YOOKASSA_PAYOUT_AGENT_ID: "payout-agent-secret",
    YOOKASSA_PAYOUT_SECRET_KEY: "payout-secret-key",
    PAYMENT_FEE_PERCENT: "3.5",
    API_RESERVE_PERCENT: "12",
    API_RESERVE_PROVIDER_WEIGHTS_JSON: '{"polza":349,"routerai":116}',
  });

  assert.deepEqual(configuration, {
    payout: {
      id: "yookassa_payouts",
      label: "ЮKassa Payouts API",
      enabled: true,
      credentialsConfigured: true,
      ready: true,
      status: "готова к тестовой выплате",
      methods: ["card_ru", "sbp"],
      activation: "проведи тестовую выплату на небольшую сумму",
    },
    apiReserve: {
      percent: 12,
      allocationMode: "product_aware_dual_primary_liability",
      primaryProviderBufferPercent: 5,
      providerMinimumsKopecks: { routerai: 10_000 },
      legacyProviderWeights: { polza: 349, routerai: 116 },
    },
    mcpFundingWorker: {
      id: "mcp_funding_worker",
      label: "MCP funding worker",
      tokenConfigured: false,
      workerEnabled: false,
      billingDanger: false,
      ready: false,
      status: "токен не настроен; worker выключен; billing danger выключен; ожидается результат queue/worker",
      workerResult: null,
      note: "готовность не подтверждается без фактического результата queue/worker",
    },
    routerAiBrowserFunding: {
      id: "routerai_persistent_browser",
      label: "RouterAI persistent browser worker",
      enabled: false,
      killSwitch: false,
      profileConfigured: false,
      configured: false,
      ready: false,
      minimumAmount: 100,
      minimumCurrency: "RUB",
      loginPerPayment: false,
      status: "выключен",
      note: "однократная авторизация в постоянном профиле; каждая доля от 100 ₽ отправляется отдельно, без накопления",
    },
    providerTopups: {
      mode: "yookassa_confirmed_queue",
      automatic: false,
      status: "очередь создаётся после payment.succeeded; внешний шлюз не подключён",
      confirmationGate: "yookassa_payment_succeeded",
      fundingGateway: "не настроен",
      note: "CRM фиксирует оплату и создаёт заявку. Для реального списания бизнес-карты нужен внешний банк/эквайер или API автопополнения провайдера; CRM не хранит PAN/CVV",
      providers: [
        {
          id: "polza",
          label: "Polza",
          mode: "provider_dashboard",
          status: "нужен внешний шлюз оплаты",
          minimumAmount: 100,
          minimumCurrency: "RUB",
          fundingMethods: ["sbp_saved_account", "sbp", "bank_card", "invoice"],
          invoiceMinimumAmount: 5_000,
          invoiceMinimumCurrency: "RUB",
          note: "карта и СБП доступны в кабинете; счёт для юрлица на скриншоте — от 5 000 ₽. CRM не может списывать бизнес-карту без отдельного шлюза",
          topUpUrl: "https://polza.ai/balance",
        },
        {
          id: "routerai",
          label: "RouterAI",
          mode: "persistent_browser_saved_card",
          executionOwner: "external_funding_agent",
          crmChargeSupported: false,
          status: "выключен",
          minimumAmount: 100,
          minimumCurrency: "RUB",
          fundingMethods: ["saved_bank_card", "sbp"],
          note: "исполняет отдельный funding-agent; CRM только наблюдает статусы. Worker использует постоянный профиль и сохранённую карту; доля меньше 100 ₽ отклоняется, а не накапливается",
          topUpUrl: "https://routerai.ru/settings/billing",
        },
      ],
    },
  });
  const serialized = JSON.stringify(configuration);
  assert.equal(serialized.includes("payout-agent-secret"), false);
  assert.equal(serialized.includes("payout-secret-key"), false);
});

test("finance configuration exposes T-Business payouts without exposing secrets", () => {
  const configuration = getFinanceConfiguration({
    TBANK_PAYOUTS_ENABLED: "true",
    TBANK_PAYOUT_TERMINAL_KEY: "terminal-secret",
    TBANK_PAYOUT_PRIVATE_KEY_BASE64: "private-key-secret",
    TBANK_PAYOUT_CERT_SERIAL: "cert-secret",
    TBANK_PAYOUT_NOTIFICATION_PASSWORD: "notification-secret",
    PAYMENT_FEE_PERCENT: "3.5",
    API_RESERVE_PERCENT: "12",
  });

  assert.equal(configuration.payout.id, "tbank_mass_payouts");
  assert.equal(configuration.payout.label, "Т‑Бизнес массовые выплаты");
  assert.deepEqual(configuration.payout.methods, ["sbp"]);
  assert.equal(configuration.payout.ready, true);
  const serialized = JSON.stringify(configuration);
  assert.equal(serialized.includes("terminal-secret"), false);
  assert.equal(serialized.includes("private-key-secret"), false);
  assert.equal(serialized.includes("cert-secret"), false);
  assert.equal(serialized.includes("notification-secret"), false);
});

test("reports MCP funding worker configuration without exposing its token or claiming readiness", () => {
  const secret = "mcp-funding-worker-secret";
  const configuration = getFinanceConfiguration({
    MCP_FUNDING_TOKEN: secret,
    MCP_FUNDING_WORKER_ENABLED: "true",
  });

  assert.deepEqual(configuration.mcpFundingWorker, {
    id: "mcp_funding_worker",
    label: "MCP funding worker",
    tokenConfigured: true,
    workerEnabled: true,
    billingDanger: false,
    ready: false,
    status: "токен настроен; worker включён; billing danger выключен; ожидается результат queue/worker",
    workerResult: null,
    note: "готовность не подтверждается без фактического результата queue/worker",
  });
  assert.equal(JSON.stringify(configuration).includes(secret), false);
  assert.equal(configuration.mcpFundingWorker.ready, false);
});

test("exposes product-aware reserve policy without legacy test tariffs", () => {
  const finance = getFinanceConfiguration({});
  assert.equal("testOnlyTariff" in finance, false);
  assert.equal(finance.apiReserve.allocationMode, "product_aware_dual_primary_liability");
  assert.equal(finance.apiReserve.primaryProviderBufferPercent, 5);
  assert.deepEqual(finance.apiReserve.providerMinimumsKopecks, { routerai: 10_000 });
  assert.deepEqual(finance.apiReserve.legacyProviderWeights, { polza: 349, routerai: 116 });
});

test("accepts readiness from an explicit successful generic funding result", () => {
  const configuration = getFinanceConfiguration({
    MCP_FUNDING_TOKEN: "mcp-secret",
    MCP_FUNDING_WORKER_ENABLED: "true",
    POLZA_MCP_BILLING_DANGER: "true",
  }, {
    workerResult: {
      allocationKey: "pay-1:api_reserve:polza",
      paymentId: "pay-1",
      status: "succeeded",
      provider: "polza",
      amountKopecks: 11_282,
    },
  });

  assert.equal("testOnlyTariff" in configuration, false);
  assert.equal(configuration.mcpFundingWorker.ready, true);
  assert.equal(configuration.mcpFundingWorker.workerResult.status, "succeeded");
  assert.equal(JSON.stringify(configuration).includes("mcp-secret"), false);
});

test("recognizes the bot funding environment names without returning the MCP token", () => {
  const secret = "polza-mcp-secret";
  const configuration = getFinanceConfiguration({
    POLZA_MCP_TOKEN: secret,
    ENABLE_PROVIDER_FUNDING_WORKER: "true",
    POLZA_MCP_BILLING_DANGER: "true",
  });

  assert.equal(configuration.mcpFundingWorker.tokenConfigured, true);
  assert.equal(configuration.mcpFundingWorker.workerEnabled, true);
  assert.equal(configuration.mcpFundingWorker.billingDanger, true);
  assert.equal(configuration.mcpFundingWorker.ready, false);
  assert.match(configuration.mcpFundingWorker.status, /ожидается результат queue\/worker/u);
  assert.equal(JSON.stringify(configuration).includes(secret), false);
});

test("marks provider top-ups automatic only when the complete Polza worker contract is configured", () => {
  const configuration = getFinanceConfiguration({
    POLZA_MCP_TOKEN: "secret",
    ENABLE_PROVIDER_FUNDING_WORKER: "true",
    POLZA_MCP_BILLING_DANGER: "true",
    POLZA_MCP_DIRECT_CHARGE_TOOL: "billing.charge",
    POLZA_MCP_DIRECT_CHARGE_ARGUMENTS_JSON: '{"amount":"${amount_kopecks}"}',
  });

  assert.equal(configuration.providerTopups.automatic, true);
  assert.equal(configuration.providerTopups.fundingGateway, "Polza MCP billing.danger");
  assert.match(configuration.providerTopups.status, /workers отправляют/u);
  assert.equal(JSON.stringify(configuration).includes("secret"), false);
});

test("does not claim RouterAI automatic readiness from environment configuration alone", () => {
  const configuration = getFinanceConfiguration({
    ROUTERAI_BROWSER_FUNDING_ENABLED: "true",
    ROUTERAI_BROWSER_FUNDING_KILL_SWITCH: "false",
    RAILWAY_VOLUME_MOUNT_PATH: "/data",
    HERMES_BROWSER_PROFILE_DIR: "/data/browser-profile",
  });

  assert.equal(configuration.routerAiBrowserFunding.configured, true);
  assert.equal(configuration.routerAiBrowserFunding.ready, false);
  assert.equal(configuration.routerAiBrowserFunding.loginPerPayment, false);
  assert.equal(configuration.routerAiBrowserFunding.minimumAmount, 100);
  assert.equal(configuration.providerTopups.automatic, false);
  assert.equal(
    configuration.providerTopups.fundingGateway,
    "RouterAI persistent browser saved-card worker",
  );
});
