import test from 'node:test';
import assert from 'node:assert/strict';

import { loadConfig, validateRuntimeStorage } from '../src/config.js';

test('ElevenLabs key is read from its dedicated environment variable', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    ELEVENLABS_API_KEY: 'elevenlabs-token'
  });

  assert.equal(config.providerKeys.elevenlabs, 'elevenlabs-token');
});

test('owner metered access is an explicit opt-in instead of an implicit billing bypass', () => {
  assert.equal(loadConfig({ METAFLORA_ENV_FILE: '/definitely/missing' }).ownerMeteredAccess, false);
  assert.equal(loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    OWNER_METERED_ACCESS: 'true'
  }).ownerMeteredAccess, true);
});

test('voice profile secrets are read only from dedicated environment variables', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    VOICE_PROFILE_ENCRYPTION_KEY: 'profile-key',
    VOICE_SAMPLE_HMAC_KEY: 'sample-key',
    VOICE_SAMPLE_HMAC_KEY_ID: 'voice-samples-2026-07'
  });

  assert.deepEqual(config.voiceSecurity, {
    profileEncryptionKey: 'profile-key',
    sampleHmacKey: 'sample-key',
    sampleHmacKeyId: 'voice-samples-2026-07'
  });
});

test('Railway runtime requires the persistent volume at /data', () => {
  const config = { appDatabasePath: '/data/metaflora.sqlite' };

  assert.throws(
    () => validateRuntimeStorage(config, { RAILWAY_PROJECT_ID: 'project' }),
    /volume/i
  );
  assert.throws(
    () => validateRuntimeStorage(config, {
      RAILWAY_PROJECT_ID: 'project',
      RAILWAY_VOLUME_MOUNT_PATH: '/tmp'
    }),
    /\/data/
  );
});

test('Railway database must live inside the mounted volume', () => {
  assert.throws(
    () => validateRuntimeStorage(
      { appDatabasePath: '/app/metaflora.sqlite' },
      {
        RAILWAY_PROJECT_ID: 'project',
        RAILWAY_VOLUME_MOUNT_PATH: '/data'
      }
    ),
    /APP_DATABASE_PATH/
  );
});

test('local runtime does not require a Railway volume', () => {
  assert.doesNotThrow(() => validateRuntimeStorage(
    { appDatabasePath: '/tmp/metaflora.sqlite' },
    {}
  ));
});

test('Supabase history storage uses dedicated environment variables', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    SUPABASE_DATABASE_URL: 'postgresql://bot:secret@db.example.test:5432/postgres',
    SUPABASE_STORAGE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
    SUPABASE_HISTORY_SCHEMA: 'neuro'
  });

  assert.deepEqual(config.historyStorage, {
    databaseUrl: 'postgresql://bot:secret@db.example.test:5432/postgres',
    storageUrl: 'https://project.supabase.co',
    serviceRoleKey: 'service-role-secret',
    schema: 'neuro',
    enabled: true
  });
});

test('Supabase history storage stays disabled without a database URL', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret'
  });

  assert.equal(config.historyStorage.enabled, false);
  assert.equal(config.historyStorage.databaseUrl, '');
});

test('YooKassa shop credentials and public URLs use dedicated environment variables', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    YOOKASSA_SHOP_ID: '1419483',
    YOOKASSA_SECRET_KEY: 'live-secret',
    YOOKASSA_WEBHOOK_TOKEN: 'webhook_token_1234567890',
    PUBLIC_BASE_URL: 'https://bot.example',
    PORT: '8080'
  });

  assert.deepEqual(config.yookassa, {
    shopId: '1419483',
    secretKey: 'live-secret',
    webhookToken: 'webhook_token_1234567890',
    webhookPath: '/webhooks/yookassa/webhook_token_1234567890',
    returnUrl: 'https://bot.example/payments/return',
    enabled: true
  });
  assert.equal(config.http.port, 8080);
});

test('YooKassa stays disabled without a strong webhook token', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    YOOKASSA_SHOP_ID: '1419483',
    YOOKASSA_SECRET_KEY: 'live-secret',
    YOOKASSA_WEBHOOK_TOKEN: 'short',
    PUBLIC_BASE_URL: 'https://bot.example'
  });

  assert.equal(config.yookassa.enabled, false);
});

test('T-Bank checkout uses the shared gateway secrets', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    TBANK_CHECKOUT_ENABLED: 'true',
    PAYMENT_GATEWAY_URL: 'https://pay.example/checkout',
    PAYMENT_CHECKOUT_SECRET: 'checkout-secret-with-at-least-32-bytes',
    PAYMENT_CALLBACK_SECRET: 'callback-secret-with-at-least-32-bytes'
  });

  assert.deepEqual(config.tbank, {
    enabled: true,
    gatewayUrl: 'https://pay.example/checkout',
    checkoutSecret: 'checkout-secret-with-at-least-32-bytes',
    callbackSecret: 'callback-secret-with-at-least-32-bytes',
    callbackPath: '/internal/tbank/confirmed',
    ticketTtlSeconds: 900
  });
  assert.equal('telegramStars' in config, false);
});

test('T-Bank checkout fails closed when enabled with weak secrets or an unsafe URL', () => {
  assert.throws(() => loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    TBANK_CHECKOUT_ENABLED: 'true',
    PAYMENT_GATEWAY_URL: 'http://pay.example/checkout',
    PAYMENT_CHECKOUT_SECRET: 'short',
    PAYMENT_CALLBACK_SECRET: 'short'
  }), /T-Bank|PAYMENT_/i);
});

test('crypto USDC checkout is enabled only with a safe gateway, strong shared secret and micros prices', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    CRYPTO_USDC_CHECKOUT_ENABLED: 'true',
    CRYPTO_USDC_GATEWAY_URL: 'https://crypto-pay.example/checkout',
    CRYPTO_USDC_QUOTE_SECRET: 'crypto-quote-secret-with-at-least-32-bytes',
    CRYPTO_USDC_CALLBACK_SECRET: 'crypto-callback-secret-with-at-least-32-bytes',
    CRYPTO_USDC_PRICES_JSON: '{"package:coins_150":{"amountUsdcMicros":12500000,"openrouterCreditMicrousd":5000000,"openrouterUsdcMicros":5250000,"gasReserveUsdcMicros":250000},"plan:author:1":{"amountUsdcMicros":75000000,"openrouterCreditMicrousd":30000000,"openrouterUsdcMicros":31500000,"gasReserveUsdcMicros":250000}}',
    SUPABASE_DATABASE_URL: 'postgresql://bot:secret@db.example.test:5432/postgres'
  });

  assert.deepEqual(config.cryptoUsdc, {
    enabled: true,
    gatewayUrl: 'https://crypto-pay.example/checkout',
    quoteSecret: 'crypto-quote-secret-with-at-least-32-bytes',
    callbackSecret: 'crypto-callback-secret-with-at-least-32-bytes',
    prices: {
      'package:coins_150': { amountUsdcMicros: 12_500_000, openrouterCreditMicrousd: 5_000_000, openrouterUsdcMicros: 5_250_000, gasReserveUsdcMicros: 250_000, ownerUsdcMicros: 7_000_000 },
      'plan:author:1': { amountUsdcMicros: 75_000_000, openrouterCreditMicrousd: 30_000_000, openrouterUsdcMicros: 31_500_000, gasReserveUsdcMicros: 250_000, ownerUsdcMicros: 43_250_000 }
    },
    callbackPath: '/internal/crypto-usdc/confirmed',
    ticketTtlSeconds: 900,
    fundingWorker: {
      enabled: false, killSwitch: false, connectorUrl: '', connectorToken: '',
      intervalMs: 2_000, maxConcurrency: 16, leaseSeconds: 300
    }
  });
});

test('crypto USDC settlement worker requires an HTTPS connector and strong token', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    CRYPTO_USDC_FUNDING_WORKER_ENABLED: 'true',
    CRYPTO_USDC_FUNDING_CONNECTOR_URL: 'https://funding.example.test',
    CRYPTO_USDC_FUNDING_CONNECTOR_TOKEN: 'x'.repeat(32),
    CRYPTO_USDC_FUNDING_INTERVAL_MS: '2000',
    CRYPTO_USDC_FUNDING_MAX_CONCURRENCY: '12',
    DATABASE_URL: 'postgres://user:password@db.example.test:5432/postgres',
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key'
  });
  assert.deepEqual(config.cryptoUsdc.fundingWorker, {
    enabled: true,
    killSwitch: false,
    connectorUrl: 'https://funding.example.test/',
    connectorToken: 'x'.repeat(32),
    intervalMs: 2_000,
    maxConcurrency: 12,
    leaseSeconds: 300
  });
  assert.throws(() => loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    CRYPTO_USDC_FUNDING_WORKER_ENABLED: 'true',
    CRYPTO_USDC_FUNDING_CONNECTOR_URL: 'http://funding.example.test',
    CRYPTO_USDC_FUNDING_CONNECTOR_TOKEN: 'weak'
  }), /CRYPTO_USDC(?: funding worker requires|_FUNDING_CONNECTOR_URL)/u);
});

test('crypto USDC checkout fails closed when any required gateway setting is incomplete', () => {
  assert.throws(() => loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    CRYPTO_USDC_CHECKOUT_ENABLED: 'true',
    CRYPTO_USDC_GATEWAY_URL: 'http://crypto-pay.example/checkout',
    CRYPTO_USDC_QUOTE_SECRET: 'short',
    CRYPTO_USDC_CALLBACK_SECRET: 'short',
    CRYPTO_USDC_PRICES_JSON: '{}'
  }), /CRYPTO_USDC/i);
});

test('crypto USDC catalog hides allocations below the OpenRouter minimum or above gross', () => {
  const base = {
    METAFLORA_ENV_FILE: '/definitely/missing',
    CRYPTO_USDC_CHECKOUT_ENABLED: 'true',
    CRYPTO_USDC_GATEWAY_URL: 'https://crypto-pay.example/checkout',
    CRYPTO_USDC_QUOTE_SECRET: 'crypto-quote-secret-with-at-least-32-bytes',
    CRYPTO_USDC_CALLBACK_SECRET: 'crypto-callback-secret-with-at-least-32-bytes',
    SUPABASE_DATABASE_URL: 'postgresql://bot:secret@db.example.test:5432/postgres'
  };
  assert.throws(() => loadConfig({
    ...base,
    CRYPTO_USDC_PRICES_JSON: '{"package:coins_150":{"amountUsdcMicros":12500000,"openrouterCreditMicrousd":5000000,"openrouterUsdcMicros":4990000,"gasReserveUsdcMicros":250000}}'
  }), /OpenRouter credits\/funding/i);
  assert.throws(() => loadConfig({
    ...base,
    CRYPTO_USDC_PRICES_JSON: '{"package:coins_150":{"amountUsdcMicros":5000000,"openrouterCreditMicrousd":5000000,"openrouterUsdcMicros":5250000,"gasReserveUsdcMicros":250000}}'
  }), /OpenRouter credits\/funding/i);
});

test('payout and finance settings stay separate from checkout credentials', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    PUBLIC_BASE_URL: 'https://bot.example',
    YOOKASSA_PAYOUTS_ENABLED: 'true',
    YOOKASSA_PAYOUT_AGENT_ID: 'payout-agent-123',
    YOOKASSA_PAYOUT_SECRET_KEY: 'payout-secret',
    PAYOUT_ENCRYPTION_KEY: 'payout-encryption-key',
    PAYOUT_SETUP_TTL_MINUTES: '22',
    PAYMENT_FEE_PERCENT: '3.5',
    API_RESERVE_PERCENT: '12',
    API_RESERVE_PROVIDER_WEIGHTS_JSON: '{"polza":2,"gptunnel":1}'
  });

  assert.deepEqual(config.yookassaPayouts, {
    agentId: 'payout-agent-123',
    secretKey: 'payout-secret',
    enabled: true,
    encryptionKey: 'payout-encryption-key',
    setupTtlMinutes: 22
  });
  assert.deepEqual(config.finance, {
    paymentFeePercent: 3.5,
    apiReservePercent: 12,
    providerWeights: { polza: 2, gptunnel: 1 },
    enforceExactGrossMargin: false,
    targetGrossMarginPercent: 40
  });
});

test('T-Business payout credentials fail closed and use a dedicated signed webhook path', () => {
  const privateKey = Buffer.from('-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----').toString('base64');
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    PUBLIC_BASE_URL: 'https://bot.example',
    TBANK_PAYOUTS_ENABLED: 'true',
    TBANK_PAYOUT_TERMINAL_KEY: '123456789000E2C',
    TBANK_PAYOUT_PRIVATE_KEY_BASE64: privateKey,
    TBANK_PAYOUT_CERT_SERIAL: '2613832945',
    TBANK_PAYOUT_NOTIFICATION_PASSWORD: 'notification-secret-that-is-long-enough',
    TBANK_PAYOUT_WEBHOOK_TOKEN: 'webhook_token_1234567890',
    PAYOUT_ENCRYPTION_KEY: 'payout-encryption-key'
  });
  assert.deepEqual(config.tbankPayouts, {
    terminalKey: '123456789000E2C',
    privateKeyPem: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
    certificateSerialNumber: '2613832945',
    notificationPassword: 'notification-secret-that-is-long-enough',
    webhookPath: '/webhooks/tbank/payouts/webhook_token_1234567890',
    enabled: true,
    encryptionKey: 'payout-encryption-key',
    setupTtlMinutes: 15,
    maxAttempts: 5,
    retryBaseMs: 60000
  });
  assert.throws(() => loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing', PUBLIC_BASE_URL: 'https://bot.example',
    TBANK_PAYOUTS_ENABLED: 'true', PAYOUT_ENCRYPTION_KEY: 'payout-encryption-key'
  }), /T-Business payouts require/u);
});

test('finance defaults reserve the full provider budget and keep a RouterAI fallback slice', () => {
  const config = loadConfig({ METAFLORA_ENV_FILE: '/definitely/missing' });

  assert.deepEqual(config.finance, {
    paymentFeePercent: 3.5,
    apiReservePercent: 56.5,
    providerWeights: { polza: 60, routerai: 505 },
    enforceExactGrossMargin: false,
    targetGrossMarginPercent: 40
  });
});

test('RouterAI model API key is read only from ROUTERAI_API_KEY', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    ROUTERAI_API_KEY: 'routerai-model-key',
    GPTUNNEL_API_KEY: 'historical-key'
  });
  assert.equal(config.providerKeys.routerai, 'routerai-model-key');
  assert.equal(config.providerKeys.gptunnel, 'historical-key');
});

test('removed tariff flag is ignored while provider funding worker settings stay bounded', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    TEST_TARIFF_ENABLED: 'true',
    ENABLE_PROVIDER_FUNDING_WORKER: 'true',
    POLZA_MCP_BILLING_DANGER: 'true',
    POLZA_MCP_TOKEN: 'mcp-token-not-logged',
    POLZA_MCP_DIRECT_CHARGE_TOOL: 'charge_card',
    POLZA_MCP_DIRECT_CHARGE_ARGUMENTS_JSON: '{"amount":"${amount_rubles}","currency":"${currency}","idempotency_key":"${idempotency_key}"}',
    PROVIDER_FUNDING_INTERVAL_MS: '3000',
    PROVIDER_FUNDING_MAX_REQUEST_KOPECKS: '10000'
  });

  assert.equal('testTariff' in config, false);
  assert.equal('testTariffs' in config, false);
  assert.deepEqual(config.providerFunding, {
    enabled: true,
    killSwitch: false,
    billingDanger: true,
    token: 'mcp-token-not-logged',
    endpoint: 'https://polza.ai/api/mcp',
    directChargeTool: 'charge_card',
    directChargeArguments: {
      amount: '${amount_rubles}',
      currency: '${currency}',
      idempotency_key: '${idempotency_key}'
    },
    browserConnectorUrl: '',
    browserConnectorToken: '',
    browserFundingEnabled: false,
    browserAutoSubmit: false,
    gptunnelBrowserConnectorUrl: '',
    gptunnelBrowserConnectorToken: '',
    gptunnelBrowserFundingEnabled: false,
    routeraiBrowserConnectorUrl: '',
    routeraiBrowserConnectorToken: '',
    routeraiBrowserFundingEnabled: false,
    routeraiBrowserFundingKillSwitch: false,
    routeraiMaxConcurrency: 8,
    intervalMs: 3_000,
    caps: {
      maxBatchRequests: 10,
      maxBatchKopecks: 5_000_000,
      maxRequestKopecks: 10_000,
      maxConcurrency: 3,
      leaseSeconds: 300,
      maxAttempts: 5
    }
  });
});

test('RouterAI funding reuses the shared connector only by explicit opt-in and has a dedicated kill switch', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    POLZA_BROWSER_CONNECTOR_URL: 'https://funding-agent.example.test',
    POLZA_BROWSER_CONNECTOR_TOKEN: 'shared-internal-token',
    ROUTERAI_BROWSER_FUNDING_ENABLED: 'true',
    ROUTERAI_BROWSER_FUNDING_KILL_SWITCH: 'true'
  });

  assert.equal(config.providerFunding.routeraiBrowserConnectorUrl, 'https://funding-agent.example.test');
  assert.equal(config.providerFunding.routeraiBrowserConnectorToken, 'shared-internal-token');
  assert.equal(config.providerFunding.routeraiBrowserFundingEnabled, true);
  assert.equal(config.providerFunding.routeraiBrowserFundingKillSwitch, true);
});

test('Railway fails closed when fees and API reserve drift from the exact 40% margin', () => {
  assert.throws(
    () => loadConfig({
      METAFLORA_ENV_FILE: '/definitely/missing',
      RAILWAY_PROJECT_ID: 'project',
      PAYMENT_FEE_PERCENT: '3.5',
      API_RESERVE_PERCENT: '40'
    }),
    /exactly 40% gross margin/i
  );
});

test('enabled automatic payouts fail closed without a public setup URL or encryption key', () => {
  assert.throws(
    () => loadConfig({
      METAFLORA_ENV_FILE: '/definitely/missing',
      YOOKASSA_PAYOUTS_ENABLED: 'true',
      PAYOUT_ENCRYPTION_KEY: 'too-short'
    }),
    /PUBLIC_BASE_URL|encryption key/i
  );
});

test('generated media links use the bot domain and reject Supabase public hosts', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    RAILWAY_PUBLIC_DOMAIN: 'metaflora.example.test',
    RAILWAY_PROJECT_ID: 'project',
    GENERATED_MEDIA_PATH: '/data/generated-media'
  });

  assert.equal(config.generatedMedia.publicBaseUrl, 'https://metaflora.example.test');
  assert.equal(config.generatedMedia.shortBaseUrl, 'https://metaflora.example.test');
  assert.equal(config.generatedMedia.rootPath, '/data/generated-media');
  assert.throws(
    () => loadConfig({
      METAFLORA_ENV_FILE: '/definitely/missing',
      PUBLIC_BASE_URL: 'https://project.supabase.co'
    }),
    /public HTTPS bot URL/i
  );
});

test('generated media can use a separate HTTPS short-link base', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    PUBLIC_BASE_URL: 'https://metaflora.example.test',
    MEDIA_SHORT_BASE_URL: 'https://mfla.example.test'
  });

  assert.equal(config.generatedMedia.shortBaseUrl, 'https://mfla.example.test');
});
