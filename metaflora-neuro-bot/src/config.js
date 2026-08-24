import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { FINANCE_POLICY } from './finance-policy.js';

const POLZA_MCP_ENDPOINT = 'https://polza.ai/api/mcp';

function parseJsonObject(value, label) {
  const source = String(value ?? '').trim();
  if (!source) return null;
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return Object.freeze(parsed);
}

function decodeBase64Secret(value, label, maximumBytes = 32_768) {
  const source = String(value ?? '').trim();
  if (!source) return '';
  if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(source)) throw new Error(`${label} must be valid base64.`);
  const decoded = Buffer.from(source, 'base64');
  if (!decoded.length || decoded.length > maximumBytes || decoded.toString('base64').replace(/=+$/u, '') !== source.replace(/=+$/u, '')) {
    throw new Error(`${label} must be valid base64.`);
  }
  return decoded.toString('utf8');
}

function boundedInteger(value, fallback, { minimum, maximum, label }) {
  const raw = String(value ?? '').trim();
  const parsed = Number.parseInt(raw || String(fallback), 10);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
  return parsed;
}

function parseEnvFile(source) {
  return Object.fromEntries(source
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }));
}

function parseProviderWeights(value) {
  const source = String(value ?? '').trim();
  if (!source) return FINANCE_POLICY.legacyProviderWeights ?? FINANCE_POLICY.providerWeights;
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('API_RESERVE_PROVIDER_WEIGHTS_JSON must be valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('API_RESERVE_PROVIDER_WEIGHTS_JSON must be an object.');
  }
  const entries = Object.entries(parsed)
    .map(([provider, weight]) => [String(provider).trim().toLowerCase(), Number(weight)])
    .filter(([, weight]) => weight > 0);
  if (!entries.length || entries.some(([provider, weight]) => !/^[a-z][a-z0-9_-]{1,48}$/.test(provider) || !Number.isFinite(weight))) {
    throw new Error('API_RESERVE_PROVIDER_WEIGHTS_JSON contains invalid providers.');
  }
  return Object.freeze(Object.fromEntries(entries));
}

function normalizePublicBaseUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('PUBLIC_BASE_URL must be a valid HTTPS URL.');
  }
  if (
    url.protocol !== 'https:'
    || url.username
    || url.password
    || url.search
    || url.hash
    || /(?:^|\.)supabase\.co$/iu.test(url.hostname)
  ) {
    throw new Error('PUBLIC_BASE_URL must be a public HTTPS bot URL.');
  }
  return url.toString().replace(/\/+$/u, '');
}

function normalizeHttpsServiceUrl(value, label) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL.`);
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error(`${label} must be a safe HTTPS URL.`);
  }
  return url.toString();
}

function parseCryptoUsdcPrices(value) {
  const parsed = parseJsonObject(value, 'CRYPTO_USDC_PRICES_JSON');
  if (!parsed) return Object.freeze({});
  const entries = Object.entries(parsed).map(([key, allocation]) => {
    const amount = allocation?.amountUsdcMicros;
    const openrouter = allocation?.openrouterUsdcMicros;
    const openrouterCredit = allocation?.openrouterCreditMicrousd;
    const gasReserve = allocation?.gasReserveUsdcMicros;
    if (!/^(?:package:[a-z][a-z0-9_]{1,63}|plan:[a-z][a-z0-9_]{1,63}:(?:1|3))$/u.test(key)
      || !Number.isSafeInteger(amount)
      || amount <= 0
      || amount % 10_000 !== 0
      || !Number.isSafeInteger(openrouter)
      || openrouter < 5_250_000
      || openrouter % 10_000 !== 0
      || !Number.isSafeInteger(openrouterCredit)
      || openrouterCredit < 5_000_000
      || openrouterCredit % 10_000 !== 0
      || !Number.isSafeInteger(gasReserve)
      || gasReserve < 10_000
      || gasReserve % 10_000 !== 0
      || openrouter + gasReserve > amount) {
      throw new Error('CRYPTO_USDC_PRICES_JSON must define cent-aligned gross, OpenRouter credits/funding, gas reserve and owner share.');
    }
    return [key, Object.freeze({
      amountUsdcMicros: amount,
      openrouterCreditMicrousd: openrouterCredit,
      openrouterUsdcMicros: openrouter,
      gasReserveUsdcMicros: gasReserve,
      ownerUsdcMicros: amount - openrouter - gasReserve
    })];
  });
  return Object.freeze(Object.fromEntries(entries));
}

export function loadConfig(environment = process.env) {
  const envPath = environment.METAFLORA_ENV_FILE ?? resolve(process.cwd(), '..', '.env.metaflora-neuro.local');
  let local = {};

  try {
    local = parseEnvFile(readFileSync(envPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const value = (name) => environment[name] ?? local[name] ?? '';
  const referralHoldDays = Number.parseInt(value('REFERRAL_HOLD_DAYS') || '3', 10);
  const historyDatabaseUrl = value('SUPABASE_DATABASE_URL') || value('DATABASE_URL');
  const historyEnabled = Boolean(historyDatabaseUrl || (
    (value('SUPABASE_STORAGE_URL') || value('SUPABASE_URL'))
    && value('SUPABASE_SERVICE_ROLE_KEY')
  ));
  const historySchema = value('SUPABASE_HISTORY_SCHEMA') || 'neuro';
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(historySchema)) {
    throw new Error('SUPABASE_HISTORY_SCHEMA must be a safe PostgreSQL identifier.');
  }
  const port = Number.parseInt(value('PORT') || '3000', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be a valid TCP port.');
  }
  const publicBaseUrl = normalizePublicBaseUrl(
    value('PUBLIC_BASE_URL')
      || (value('RAILWAY_PUBLIC_DOMAIN') ? `https://${value('RAILWAY_PUBLIC_DOMAIN')}` : '')
  );
  const generatedMediaMaxBytes = Number.parseInt(value('GENERATED_MEDIA_MAX_BYTES') || `${100 * 1024 * 1024}`, 10);
  const generatedMediaPath = value('GENERATED_MEDIA_PATH')
    || (value('RAILWAY_PROJECT_ID') ? '/data/generated-media' : resolve(process.cwd(), 'data', 'generated-media'));
  const generatedMediaShortBaseUrl = normalizePublicBaseUrl(
    value('MEDIA_SHORT_BASE_URL') || publicBaseUrl
  );
  const yookassaShopId = value('YOOKASSA_SHOP_ID');
  const yookassaSecretKey = value('YOOKASSA_SECRET_KEY');
  const yookassaWebhookToken = value('YOOKASSA_WEBHOOK_TOKEN');
  const yookassaWebhookTokenValid = /^[A-Za-z0-9_-]{20,128}$/u.test(yookassaWebhookToken);
  const yookassaReturnUrl = value('YOOKASSA_RETURN_URL')
    || (publicBaseUrl ? `${publicBaseUrl}/payments/return` : '');
  const tbankRequested = value('TBANK_CHECKOUT_ENABLED') === 'true';
  const tbankGatewayUrl = normalizeHttpsServiceUrl(value('PAYMENT_GATEWAY_URL'), 'PAYMENT_GATEWAY_URL');
  const tbankCheckoutSecret = value('PAYMENT_CHECKOUT_SECRET');
  const tbankCallbackSecret = value('PAYMENT_CALLBACK_SECRET');
  const tbankTicketTtlSeconds = boundedInteger(value('PAYMENT_TICKET_TTL_SECONDS'), 900, {
    minimum: 60, maximum: 900, label: 'PAYMENT_TICKET_TTL_SECONDS'
  });
  if (tbankRequested && (
    !tbankGatewayUrl
    || Buffer.byteLength(tbankCheckoutSecret, 'utf8') < 32
    || Buffer.byteLength(tbankCallbackSecret, 'utf8') < 32
  )) {
    throw new Error(
      'T-Bank checkout requires PAYMENT_GATEWAY_URL and 32-byte PAYMENT_CHECKOUT_SECRET/PAYMENT_CALLBACK_SECRET.'
    );
  }
  const cryptoUsdcRequested = value('CRYPTO_USDC_CHECKOUT_ENABLED') === 'true';
  const cryptoUsdcGatewayUrl = normalizeHttpsServiceUrl(
    value('CRYPTO_USDC_GATEWAY_URL'),
    'CRYPTO_USDC_GATEWAY_URL'
  );
  const cryptoUsdcQuoteSecret = value('CRYPTO_USDC_QUOTE_SECRET');
  const cryptoUsdcCallbackSecret = value('CRYPTO_USDC_CALLBACK_SECRET');
  const cryptoUsdcPrices = parseCryptoUsdcPrices(value('CRYPTO_USDC_PRICES_JSON'));
  const cryptoUsdcTicketTtlSeconds = boundedInteger(value('CRYPTO_USDC_TICKET_TTL_SECONDS'), 900, {
    minimum: 60, maximum: 900, label: 'CRYPTO_USDC_TICKET_TTL_SECONDS'
  });
  const cryptoUsdcFundingRequested = value('CRYPTO_USDC_FUNDING_WORKER_ENABLED') === 'true';
  const cryptoUsdcFundingConnectorUrl = normalizeHttpsServiceUrl(
    value('CRYPTO_USDC_FUNDING_CONNECTOR_URL'),
    'CRYPTO_USDC_FUNDING_CONNECTOR_URL'
  );
  const cryptoUsdcFundingConnectorToken = value('CRYPTO_USDC_FUNDING_CONNECTOR_TOKEN');
  const cryptoUsdcFundingWorker = Object.freeze({
    enabled: cryptoUsdcFundingRequested,
    killSwitch: value('CRYPTO_USDC_FUNDING_KILL_SWITCH') === 'true',
    connectorUrl: cryptoUsdcFundingConnectorUrl,
    connectorToken: cryptoUsdcFundingConnectorToken,
    intervalMs: boundedInteger(value('CRYPTO_USDC_FUNDING_INTERVAL_MS'), 2_000, {
      minimum: 1_000, maximum: 600_000, label: 'CRYPTO_USDC_FUNDING_INTERVAL_MS'
    }),
    maxConcurrency: boundedInteger(value('CRYPTO_USDC_FUNDING_MAX_CONCURRENCY'), 16, {
      minimum: 1, maximum: 32, label: 'CRYPTO_USDC_FUNDING_MAX_CONCURRENCY'
    }),
    leaseSeconds: boundedInteger(value('CRYPTO_USDC_FUNDING_LEASE_SECONDS'), 300, {
      minimum: 30, maximum: 3_600, label: 'CRYPTO_USDC_FUNDING_LEASE_SECONDS'
    })
  });
  if (cryptoUsdcRequested && (
    !cryptoUsdcGatewayUrl
    || Buffer.byteLength(cryptoUsdcQuoteSecret, 'utf8') < 32
    || Buffer.byteLength(cryptoUsdcCallbackSecret, 'utf8') < 32
    || Object.keys(cryptoUsdcPrices).length === 0
    || !historyEnabled
  )) {
    throw new Error(
      'CRYPTO_USDC checkout requires a safe CRYPTO_USDC_GATEWAY_URL, a 32-byte '
      + 'CRYPTO_USDC_QUOTE_SECRET, CRYPTO_USDC_CALLBACK_SECRET, '
      + 'CRYPTO_USDC_PRICES_JSON in integer USDC micros '
      + 'and persistent Supabase history storage.'
    );
  }
  if (cryptoUsdcFundingRequested && (
    !cryptoUsdcFundingConnectorUrl
    || Buffer.byteLength(cryptoUsdcFundingConnectorToken, 'utf8') < 32
    || !historyEnabled
  )) {
    throw new Error(
      'CRYPTO_USDC funding worker requires an HTTPS CRYPTO_USDC_FUNDING_CONNECTOR_URL, '
      + 'a 32-byte CRYPTO_USDC_FUNDING_CONNECTOR_TOKEN and persistent Supabase history storage.'
    );
  }
  const payoutSetupTtlMinutes = Number.parseInt(value('PAYOUT_SETUP_TTL_MINUTES') || '15', 10);
  const payoutEnabled = value('YOOKASSA_PAYOUTS_ENABLED') === 'true';
  const payoutEncryptionKey = value('PAYOUT_ENCRYPTION_KEY') || value('REFERRAL_PAYOUT_ENCRYPTION_KEY');
  const tbankPayoutRequested = value('TBANK_PAYOUTS_ENABLED') === 'true';
  const tbankPayoutTerminalKey = value('TBANK_PAYOUT_TERMINAL_KEY');
  const tbankPayoutPrivateKeyPem = decodeBase64Secret(
    value('TBANK_PAYOUT_PRIVATE_KEY_BASE64'),
    'TBANK_PAYOUT_PRIVATE_KEY_BASE64'
  );
  const tbankPayoutCertificateSerialNumber = value('TBANK_PAYOUT_CERT_SERIAL');
  const tbankPayoutNotificationPassword = value('TBANK_PAYOUT_NOTIFICATION_PASSWORD');
  const tbankPayoutWebhookToken = value('TBANK_PAYOUT_WEBHOOK_TOKEN');
  const tbankPayoutWebhookTokenValid = /^[A-Za-z0-9_-]{20,128}$/u.test(tbankPayoutWebhookToken);
  const tbankPayoutMaxAttempts = boundedInteger(value('TBANK_PAYOUT_MAX_ATTEMPTS'), 5, {
    minimum: 1, maximum: 20, label: 'TBANK_PAYOUT_MAX_ATTEMPTS'
  });
  const tbankPayoutRetryBaseMs = boundedInteger(value('TBANK_PAYOUT_RETRY_BASE_MS'), 60_000, {
    minimum: 1_000, maximum: 86_400_000, label: 'TBANK_PAYOUT_RETRY_BASE_MS'
  });
  const providerFundingArguments = parseJsonObject(
    value('POLZA_MCP_DIRECT_CHARGE_ARGUMENTS_JSON'),
    'POLZA_MCP_DIRECT_CHARGE_ARGUMENTS_JSON'
  );
  const providerFundingIntervalMs = boundedInteger(
    value('PROVIDER_FUNDING_INTERVAL_MS'),
    30_000,
    { minimum: 1_000, maximum: 600_000, label: 'PROVIDER_FUNDING_INTERVAL_MS' }
  );
  const providerFundingCaps = Object.freeze({
    maxBatchRequests: boundedInteger(value('PROVIDER_FUNDING_MAX_BATCH_REQUESTS'), 10, {
      minimum: 1, maximum: 50, label: 'PROVIDER_FUNDING_MAX_BATCH_REQUESTS'
    }),
    maxBatchKopecks: boundedInteger(value('PROVIDER_FUNDING_MAX_BATCH_KOPECKS'), 5_000_000, {
      minimum: 1, maximum: 10_000_000, label: 'PROVIDER_FUNDING_MAX_BATCH_KOPECKS'
    }),
    maxRequestKopecks: boundedInteger(value('PROVIDER_FUNDING_MAX_REQUEST_KOPECKS'), 1_000_000, {
      minimum: 1, maximum: 1_000_000, label: 'PROVIDER_FUNDING_MAX_REQUEST_KOPECKS'
    }),
    maxConcurrency: boundedInteger(value('PROVIDER_FUNDING_MAX_CONCURRENCY'), 3, {
      minimum: 1, maximum: 8, label: 'PROVIDER_FUNDING_MAX_CONCURRENCY'
    }),
    leaseSeconds: boundedInteger(value('PROVIDER_FUNDING_LEASE_SECONDS'), 300, {
      minimum: 30, maximum: 3_600, label: 'PROVIDER_FUNDING_LEASE_SECONDS'
    }),
    maxAttempts: boundedInteger(value('PROVIDER_FUNDING_MAX_ATTEMPTS'), 5, {
      minimum: 1, maximum: 10, label: 'PROVIDER_FUNDING_MAX_ATTEMPTS'
    })
  });
  if (providerFundingCaps.maxRequestKopecks > providerFundingCaps.maxBatchKopecks) {
    throw new Error('PROVIDER_FUNDING_MAX_REQUEST_KOPECKS cannot exceed PROVIDER_FUNDING_MAX_BATCH_KOPECKS.');
  }
  if ((payoutEnabled || tbankPayoutRequested) && !publicBaseUrl) {
    throw new Error('PUBLIC_BASE_URL is required when payouts are enabled.');
  }
  if ((payoutEnabled || tbankPayoutRequested) && payoutEncryptionKey.length < 16) {
    throw new Error('PAYOUT_ENCRYPTION_KEY must contain at least 16 characters when payouts are enabled.');
  }
  if (payoutEnabled && tbankPayoutRequested) {
    throw new Error('Enable exactly one automatic payout provider.');
  }
  if (tbankPayoutRequested && (
    !/^[A-Za-z0-9_-]{8,32}$/u.test(tbankPayoutTerminalKey)
    || !tbankPayoutPrivateKeyPem.includes('PRIVATE KEY')
    || !/^\d{1,128}$/u.test(tbankPayoutCertificateSerialNumber)
    || Buffer.byteLength(tbankPayoutNotificationPassword, 'utf8') < 20
    || !tbankPayoutWebhookTokenValid
  )) {
    throw new Error(
      'T-Business payouts require terminal key, RSA private key, certificate serial, '
      + 'notification password and a strong webhook token.'
    );
  }
  const paymentFeePercent = Number.parseFloat(value('PAYMENT_FEE_PERCENT') || '3.5');
  const apiReservePercent = Number.parseFloat(value('API_RESERVE_PERCENT') || `${FINANCE_POLICY.apiReservePercent}`);
  if (!Number.isFinite(paymentFeePercent) || paymentFeePercent < 0 || paymentFeePercent > 100) {
    throw new Error('PAYMENT_FEE_PERCENT must be between 0 and 100.');
  }
  if (!Number.isFinite(apiReservePercent) || apiReservePercent < 0 || apiReservePercent > 100) {
    throw new Error('API_RESERVE_PERCENT must be between 0 and 100.');
  }
  const configuredGrossMarginPercent = 100 - paymentFeePercent - apiReservePercent;
  if (
    value('RAILWAY_PROJECT_ID')
    && value('ENFORCE_EXACT_GROSS_MARGIN') !== 'false'
    && Math.abs(configuredGrossMarginPercent - FINANCE_POLICY.targetGrossMarginPercent) > 0.000001
  ) {
    throw new Error(
      `Railway finance policy must keep exactly ${FINANCE_POLICY.targetGrossMarginPercent}% gross margin `
      + `after fees and API reserve; configured ${configuredGrossMarginPercent}%.`
    );
  }
  return {
    telegramBotToken: value('TELEGRAM_BOT_TOKEN'),
    botOwnerId: value('BOT_OWNER_ID'),
    ownerMeteredAccess: value('OWNER_METERED_ACCESS') === 'true',
    botUsername: value('TELEGRAM_BOT_USERNAME') || 'neuro_metaflora_bot',
    publicBaseUrl,
    appDatabasePath: value('APP_DATABASE_PATH') || value('REFERRAL_DATABASE_PATH') || resolve(process.cwd(), '..', 'data', 'metaflora.sqlite'),
    referralDatabasePath: value('APP_DATABASE_PATH') || value('REFERRAL_DATABASE_PATH') || resolve(process.cwd(), '..', 'data', 'metaflora.sqlite'),
    referralHoldDays: Number.isInteger(referralHoldDays) && referralHoldDays >= 0 ? referralHoldDays : 3,
    providerFunding: {
      enabled: value('ENABLE_PROVIDER_FUNDING_WORKER') === 'true',
      killSwitch: value('PROVIDER_FUNDING_KILL_SWITCH') === 'true',
      billingDanger: value('POLZA_MCP_BILLING_DANGER') === 'true',
      token: value('POLZA_MCP_TOKEN'),
      endpoint: value('POLZA_MCP_ENDPOINT') || POLZA_MCP_ENDPOINT,
      directChargeTool: value('POLZA_MCP_DIRECT_CHARGE_TOOL'),
      directChargeArguments: providerFundingArguments,
      browserConnectorUrl: value('POLZA_BROWSER_CONNECTOR_URL'),
      browserConnectorToken: value('POLZA_BROWSER_CONNECTOR_TOKEN'),
      browserFundingEnabled: value('POLZA_BROWSER_FUNDING_ENABLED') === 'true',
      browserAutoSubmit: value('POLZA_BROWSER_AUTO_SUBMIT') === 'true',
      gptunnelBrowserConnectorUrl: value('GPTUNNEL_BROWSER_CONNECTOR_URL')
        || value('POLZA_BROWSER_CONNECTOR_URL'),
      gptunnelBrowserConnectorToken: value('GPTUNNEL_BROWSER_CONNECTOR_TOKEN')
        || value('POLZA_BROWSER_CONNECTOR_TOKEN'),
      gptunnelBrowserFundingEnabled: value('GPTUNNEL_BROWSER_FUNDING_ENABLED') === 'true',
      routeraiBrowserConnectorUrl: value('ROUTERAI_BROWSER_CONNECTOR_URL')
        || value('POLZA_BROWSER_CONNECTOR_URL'),
      routeraiBrowserConnectorToken: value('ROUTERAI_BROWSER_CONNECTOR_TOKEN')
        || value('POLZA_BROWSER_CONNECTOR_TOKEN'),
      routeraiBrowserFundingEnabled: value('ROUTERAI_BROWSER_FUNDING_ENABLED') === 'true',
      routeraiBrowserFundingKillSwitch: value('ROUTERAI_BROWSER_FUNDING_KILL_SWITCH') === 'true',
      routeraiMaxConcurrency: boundedInteger(value('ROUTERAI_FUNDING_MAX_CONCURRENCY'), 8, {
        minimum: 1, maximum: 8, label: 'ROUTERAI_FUNDING_MAX_CONCURRENCY'
      }),
      intervalMs: providerFundingIntervalMs,
      caps: providerFundingCaps
    },
    providerTestMode: value('PROVIDER_TEST_MODE') !== 'false',
    enablePaidProviderCalls: value('ENABLE_PAID_PROVIDER_CALLS') === 'true',
    enableAgentProviderCalls: value('ENABLE_AGENT_PROVIDER_CALLS') === 'true',
    enableFreeLlmTestCalls: value('ENABLE_FREE_LLM_TEST_CALLS') === 'true',
    paymentLinks: {
      checkoutUrl: value('YOOKASSA_CHECKOUT_URL')
    },
    http: { port },
    generatedMedia: {
      rootPath: generatedMediaPath,
      publicBaseUrl,
      shortBaseUrl: generatedMediaShortBaseUrl,
      maxBytes: Number.isSafeInteger(generatedMediaMaxBytes) && generatedMediaMaxBytes > 0
        ? generatedMediaMaxBytes
        : 100 * 1024 * 1024
    },
    yookassa: {
      shopId: yookassaShopId,
      secretKey: yookassaSecretKey,
      webhookToken: yookassaWebhookToken,
      webhookPath: yookassaWebhookTokenValid
        ? `/webhooks/yookassa/${yookassaWebhookToken}`
        : '',
      returnUrl: yookassaReturnUrl,
      enabled: Boolean(
        yookassaShopId
        && yookassaSecretKey
        && yookassaReturnUrl
        && yookassaWebhookTokenValid
      )
    },
    tbank: {
      enabled: tbankRequested,
      gatewayUrl: tbankGatewayUrl,
      checkoutSecret: tbankCheckoutSecret,
      callbackSecret: tbankCallbackSecret,
      callbackPath: '/internal/tbank/confirmed',
      ticketTtlSeconds: tbankTicketTtlSeconds
    },
    cryptoUsdc: {
      enabled: cryptoUsdcRequested,
      gatewayUrl: cryptoUsdcGatewayUrl,
      quoteSecret: cryptoUsdcQuoteSecret,
      callbackSecret: cryptoUsdcCallbackSecret,
      prices: cryptoUsdcPrices,
      callbackPath: '/internal/crypto-usdc/confirmed',
      ticketTtlSeconds: cryptoUsdcTicketTtlSeconds,
      fundingWorker: cryptoUsdcFundingWorker
    },
    yookassaPayouts: {
      agentId: value('YOOKASSA_PAYOUT_AGENT_ID'),
      secretKey: value('YOOKASSA_PAYOUT_SECRET_KEY'),
      enabled: payoutEnabled,
      encryptionKey: payoutEncryptionKey,
      setupTtlMinutes: Number.isInteger(payoutSetupTtlMinutes) && payoutSetupTtlMinutes >= 5 && payoutSetupTtlMinutes <= 60
        ? payoutSetupTtlMinutes
        : 15
    },
    tbankPayouts: {
      terminalKey: tbankPayoutTerminalKey,
      privateKeyPem: tbankPayoutPrivateKeyPem,
      certificateSerialNumber: tbankPayoutCertificateSerialNumber,
      notificationPassword: tbankPayoutNotificationPassword,
      webhookPath: tbankPayoutWebhookTokenValid
        ? `/webhooks/tbank/payouts/${tbankPayoutWebhookToken}`
        : '',
      enabled: tbankPayoutRequested,
      encryptionKey: payoutEncryptionKey,
      setupTtlMinutes: Number.isInteger(payoutSetupTtlMinutes) && payoutSetupTtlMinutes >= 5 && payoutSetupTtlMinutes <= 60
        ? payoutSetupTtlMinutes
        : 15,
      maxAttempts: tbankPayoutMaxAttempts,
      retryBaseMs: tbankPayoutRetryBaseMs
    },
    finance: {
      paymentFeePercent,
      apiReservePercent,
      providerWeights: parseProviderWeights(value('API_RESERVE_PROVIDER_WEIGHTS_JSON')),
      enforceExactGrossMargin: Boolean(value('RAILWAY_PROJECT_ID'))
        && value('ENFORCE_EXACT_GROSS_MARGIN') !== 'false',
      targetGrossMarginPercent: FINANCE_POLICY.targetGrossMarginPercent
    },
    historyStorage: {
      databaseUrl: historyDatabaseUrl,
      storageUrl: value('SUPABASE_STORAGE_URL') || value('SUPABASE_URL'),
      serviceRoleKey: value('SUPABASE_SERVICE_ROLE_KEY'),
      schema: historySchema,
      enabled: historyEnabled
    },
    legalConsent: {
      enabled: historyEnabled && value('LEGAL_CONSENT_ENABLED') !== 'false',
      version: value('LEGAL_DOCUMENT_VERSION') || '2026-07-27',
      urls: {
        personalData: value('LEGAL_URL_PERSONAL_DATA') || value('LEGAL_CONSENT_URL'),
        agreement: value('LEGAL_URL_AGREEMENT') || value('LEGAL_AGREEMENT_URL'),
        privacy: value('LEGAL_URL_PRIVACY') || value('LEGAL_PRIVACY_URL'),
        rules: value('LEGAL_URL_RULES') || value('LEGAL_RULES_URL')
      }
    },
    referralPayout: {
      offerVersion: value('REFERRAL_OFFER_VERSION') || 'partner-program-2026-08-14',
      offerUrl: value('REFERRAL_OFFER_URL') || 'https://legal.metaflora.ru/partnerskaya-oferta',
      offerDocumentSha256: (
        value('REFERRAL_OFFER_DOCUMENT_SHA256')
        || 'eff0c43fc0619874fdff2a5871aba4646af812d96e560cae9b01c5aa800c4018'
      ).toLowerCase(),
      offerTrackingSecret: value('REFERRAL_OFFER_TRACKING_SECRET')
    },
    voiceSecurity: {
      profileEncryptionKey: value('VOICE_PROFILE_ENCRYPTION_KEY'),
      sampleHmacKey: value('VOICE_SAMPLE_HMAC_KEY'),
      sampleHmacKeyId: value('VOICE_SAMPLE_HMAC_KEY_ID') || 'voice-samples-2026-07'
    },
    providerKeys: {
      polza: value('POLZA_API_KEY'),
      openrouter: value('OPENROUTER_API_KEY'),
      requesty: value('REQUESTY_API_KEY'),
      fal: value('FAL_KEY'),
      kie: value('KIE_API_KEY'),
      gptunnel: value('GPTUNNEL_API_KEY'),
      routerai: value('ROUTERAI_API_KEY'),
      replicate: value('REPLICATE_API_TOKEN'),
      elevenlabs: value('ELEVENLABS_API_KEY')
    }
  };
}

export function requireTelegramToken(config) {
  if (!config.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required to start polling.');
  }
  return config.telegramBotToken;
}

export function validateRuntimeStorage(config, environment = process.env) {
  if (!environment.RAILWAY_PROJECT_ID) return;
  if (environment.RAILWAY_VOLUME_MOUNT_PATH !== '/data') {
    throw new Error('Railway volume must be attached at /data.');
  }
  const databasePath = resolve(config.appDatabasePath);
  if (!databasePath.startsWith('/data/')) {
    throw new Error('APP_DATABASE_PATH must point inside the Railway /data volume.');
  }
  if (config.generatedMedia?.rootPath) {
    const generatedMediaPath = resolve(config.generatedMedia.rootPath);
    if (!generatedMediaPath.startsWith('/data/')) {
      throw new Error('GENERATED_MEDIA_PATH must point inside the Railway /data volume.');
    }
  }
  if (config.generatedMedia && !config.generatedMedia.publicBaseUrl) {
    throw new Error('PUBLIC_BASE_URL or RAILWAY_PUBLIC_DOMAIN is required for generated media links.');
  }
}
