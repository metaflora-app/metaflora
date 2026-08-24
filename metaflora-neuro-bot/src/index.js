import { createClient } from '@supabase/supabase-js';

import { createUpdateHandler, registerBotCommands } from './bot.js';
import { loadConfig, requireTelegramToken, validateRuntimeStorage } from './config.js';
import { runPolling } from './polling.js';
import { checkProviderHealth } from './provider-router.js';
import { createReferralService } from './referral-service.js';
import { createSupabaseBackedReferralService } from './referral-supabase-service.js';
import { SupabaseReferralRepository } from './supabase-referral-repository.js';
import { AppStateRepository } from './app-state-repository.js';
import { TelegramClient } from './telegram.js';
import { createElevenLabsClient } from './elevenlabs-client.js';
import { ElevenLabsVoiceService } from './elevenlabs-voice-service.js';
import { setCuratedVoices } from './voice-library.js';
import { VoiceProfileStore } from './voice-profile-store.js';
import { createHistoryRepository } from './history-factory.js';
import { createHistoryService } from './history-service.js';
import { createProviderAuditedFetch } from './api-audit.js';
import { createYooKassaClient } from './yookassa-client.js';
import { createPayoutService } from './payout-service.js';
import { createTBankPayoutClient } from './tbank-payout-client.js';
import { createReferralPayoutWorkerRuntime } from './referral-payout-worker-runtime.js';
import { createPaymentService } from './payment-service.js';
import { createTBankPaymentService } from './tbank-payment-service.js';
import { createCryptoUsdcPaymentService } from './crypto-usdc-payment-service.js';
import { createPaymentRailRegistry } from './payment-rail-registry.js';
import { startHttpServer } from './http-server.js';
import { createLifecycleNotificationService } from './lifecycle-notifications.js';
import { createAgentPetService } from './agentpet-service.js';
import { createAvatarStorage } from './avatar-storage.js';
import { createTelegramAvatarService } from './telegram-avatar-service.js';
import { createGeneratedMediaStorage } from './generated-media-storage.js';
import { loadMenuMedia } from './menu-media.js';
import { processCrmUserNotifications } from './crm-notification-worker.js';
import { createPolzaMcpClient } from './polza-mcp-client.js';
import { ProviderFundingWorker } from './provider-funding-worker.js';
import { createDirectChargeContract } from './provider-funding-config.js';
import { createCrmBrowserFundingClient } from './crm-browser-funding-client.js';
import { CryptoUsdcFundingWorker } from './crypto-usdc-funding-worker.js';
import { createCryptoUsdcSettlementClient } from './crypto-usdc-settlement-client.js';
import { createAudioWorkflowExecutor } from './audio-workflow-executor.js';
import { DurableAudioWorkflowStageStore } from './audio-workflow-stage-store.js';
import { getAudioWorkflowById } from './audio-workflow-catalog.js';
import { createMusicRuntime } from './music-runtime.js';
import { falUploader } from './tool-executor.js';

const config = loadConfig();
validateRuntimeStorage(config);
const historyRepository = createHistoryRepository(config.historyStorage);
const providerFetch = createProviderAuditedFetch({
  repository: historyRepository,
  onError: (error, context) => {
    console.error(`api audit error action=${context?.action ?? 'unknown'}: ${error.message}`);
  }
});
const generatedMediaStorage = config.generatedMedia.publicBaseUrl
  ? createGeneratedMediaStorage({
    rootPath: config.generatedMedia.rootPath,
    publicBaseUrl: config.generatedMedia.publicBaseUrl,
    shortBaseUrl: config.generatedMedia.shortBaseUrl,
    maxBytes: config.generatedMedia.maxBytes,
    fetchImpl: providerFetch
  })
  : null;
const telegram = new TelegramClient(requireTelegramToken(config), fetch, {
  auditRepository: historyRepository,
  onAuditError: (error, context) => {
    console.error(`telegram audit error action=${context?.action ?? 'unknown'}: ${error.message}`);
  }
});
const avatarService = createTelegramAvatarService({
  telegram,
  repository: historyRepository,
  storage: createAvatarStorage(config.historyStorage),
  onError: (_error, context) => {
    console.error(
      `avatar sync error action=${context?.action ?? 'unknown'}`
      + ` code=${context?.errorCode ?? 'telegram_avatar_sync_failed'}`
    );
  }
});
const historyService = createHistoryService({
  repository: historyRepository,
  avatarService,
  onError: (error, context) => {
    console.error(`history error action=${context?.action ?? 'unknown'}: ${error.message}`);
  }
});
const shutdown = new AbortController();
function escapeTelegramHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function payoutAmountText(amountKopecks) {
  return (Number(amountKopecks || 0) / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

const selectedPayoutConfig = config.tbankPayouts.enabled ? config.tbankPayouts : config.yookassaPayouts;
const referralSupabaseClient = config.historyStorage.enabled
  && config.historyStorage.storageUrl
  && config.historyStorage.serviceRoleKey
  ? createClient(config.historyStorage.storageUrl, config.historyStorage.serviceRoleKey, {
    db: { schema: 'neuro' },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
  : null;
const referralAuthorityRepository = referralSupabaseClient
  ? new SupabaseReferralRepository(referralSupabaseClient)
  : null;
const localReferralService = createReferralService({
  databasePath: config.referralDatabasePath,
  botUsername: config.botUsername,
  holdDays: config.referralHoldDays,
  payoutEncryptionKey: selectedPayoutConfig.encryptionKey,
  payoutSetupTtlMinutes: selectedPayoutConfig.setupTtlMinutes
});
const referralService = referralAuthorityRepository
  ? createSupabaseBackedReferralService({
    service: localReferralService,
    repository: referralAuthorityRepository,
    payoutEncryptionKey: selectedPayoutConfig.encryptionKey,
    holdDays: config.referralHoldDays,
    onError: logError
  })
  : localReferralService;
const upgradeReservationCleanupTimer = setInterval(() => {
  try {
    referralService.releaseExpiredPlanUpgrades();
  } catch (error) {
    console.error('upgrade reservation cleanup failed', error);
  }
}, 60_000);
upgradeReservationCleanupTimer.unref();
const yookassaPaymentService = config.yookassa.enabled
  ? createPaymentService({
    client: createYooKassaClient({
      shopId: config.yookassa.shopId,
      secretKey: config.yookassa.secretKey
    }),
    referralService,
    referralOfferTrackingSecret: config.referralPayout.offerTrackingSecret,
    referralOfferUrl: config.referralPayout.offerUrl,
    referralOfferDocumentSha256: config.referralPayout.offerDocumentSha256,
    auditRepository: historyRepository,
    financePolicy: config.finance,
    returnUrl: config.yookassa.returnUrl,
    onAuditError: (error, context) => {
      console.error(`payment audit error action=${context?.action ?? 'unknown'}: ${error.message}`);
    },
    notify: ({ telegramChatId, message }) => telegram.sendMessage(
      telegramChatId,
      message
    )
  })
  : null;
const tbankPaymentService = config.tbank.enabled
  ? createTBankPaymentService({
    referralService,
    auditRepository: historyRepository,
    gatewayUrl: config.tbank.gatewayUrl,
    checkoutSecret: config.tbank.checkoutSecret,
    ticketTtlSeconds: config.tbank.ticketTtlSeconds,
    financePolicy: config.finance,
    notify: ({ telegramChatId, message }) => telegram.sendMessage(telegramChatId, message)
  })
  : null;
const paymentService = tbankPaymentService ?? yookassaPaymentService;
const cryptoUsdcPaymentService = config.cryptoUsdc.enabled
  ? createCryptoUsdcPaymentService({
    repository: historyRepository,
    referralService,
    gatewayUrl: config.cryptoUsdc.gatewayUrl,
    quoteSecret: config.cryptoUsdc.quoteSecret,
    prices: config.cryptoUsdc.prices,
    ticketTtlSeconds: config.cryptoUsdc.ticketTtlSeconds
  })
  : null;
const paymentRails = createPaymentRailRegistry({
  sbp: paymentService,
  cryptoUsdc: cryptoUsdcPaymentService
});
const cryptoUsdcSettlementClient = config.cryptoUsdc.fundingWorker.enabled
  ? createCryptoUsdcSettlementClient({
    baseUrl: config.cryptoUsdc.fundingWorker.connectorUrl,
    token: config.cryptoUsdc.fundingWorker.connectorToken
  })
  : null;
const cryptoUsdcFundingWorker = cryptoUsdcSettlementClient
  && typeof historyRepository.claimCryptoUsdcFundingRequests === 'function'
  ? new CryptoUsdcFundingWorker({
    repository: historyRepository,
    connector: cryptoUsdcSettlementClient,
    enabled: config.cryptoUsdc.fundingWorker.enabled,
    killSwitch: config.cryptoUsdc.fundingWorker.killSwitch,
    maxConcurrency: config.cryptoUsdc.fundingWorker.maxConcurrency,
    leaseSeconds: config.cryptoUsdc.fundingWorker.leaseSeconds
  })
  : null;
const directChargeContract = createDirectChargeContract({
  toolName: config.providerFunding.directChargeTool,
  argumentsTemplate: config.providerFunding.directChargeArguments
});
const providerFundingClient = config.providerFunding.token
  ? createPolzaMcpClient({
    token: config.providerFunding.token,
    endpoint: config.providerFunding.endpoint,
    billing: { danger: config.providerFunding.billingDanger },
    directChargeContract
  })
  : null;
const polzaBrowserFundingClient = config.providerFunding.browserFundingEnabled
  && config.providerFunding.browserConnectorUrl
  && config.providerFunding.browserConnectorToken
  ? createCrmBrowserFundingClient({
    baseUrl: config.providerFunding.browserConnectorUrl,
      token: config.providerFunding.browserConnectorToken
  })
  : null;
const gptunnelBrowserFundingClient = config.providerFunding.gptunnelBrowserFundingEnabled
  && config.providerFunding.gptunnelBrowserConnectorUrl
  && config.providerFunding.gptunnelBrowserConnectorToken
  ? createCrmBrowserFundingClient({
    baseUrl: config.providerFunding.gptunnelBrowserConnectorUrl,
    token: config.providerFunding.gptunnelBrowserConnectorToken,
    provider: 'gptunnel'
  })
  : null;
const routeraiBrowserFundingClient = config.providerFunding.routeraiBrowserFundingEnabled
  && !config.providerFunding.routeraiBrowserFundingKillSwitch
  && config.providerFunding.routeraiBrowserConnectorUrl
  && config.providerFunding.routeraiBrowserConnectorToken
  ? createCrmBrowserFundingClient({
    baseUrl: config.providerFunding.routeraiBrowserConnectorUrl,
    token: config.providerFunding.routeraiBrowserConnectorToken,
    provider: 'routerai'
  })
  : null;
const polzaFundingProvider = polzaBrowserFundingClient ?? (
  providerFundingClient
  && directChargeContract
  && directChargeContract.supportsCustomAmount === true
    ? providerFundingClient
    : null
);
const polzaFundingReady = polzaBrowserFundingClient
  ? false
  : Boolean(
    providerFundingClient
    && directChargeContract
    && directChargeContract.supportsCustomAmount === true
    && config.providerFunding.billingDanger
  );
const fundingProviders = Object.freeze({
  ...(polzaFundingProvider ? { polza: polzaFundingProvider } : {}),
  ...(gptunnelBrowserFundingClient ? { gptunnel: gptunnelBrowserFundingClient } : {}),
  ...(routeraiBrowserFundingClient ? { routerai: routeraiBrowserFundingClient } : {})
});
const providerFundingWorker = Object.keys(fundingProviders).length > 0
  && typeof historyRepository.claimProviderTopupRequests === 'function'
  ? new ProviderFundingWorker({
    repository: historyRepository,
    providers: fundingProviders,
    provider: Object.keys(fundingProviders),
    enabled: config.providerFunding.enabled,
    killSwitch: config.providerFunding.killSwitch,
    billing: { danger: config.providerFunding.billingDanger },
    fundingReady: false,
    caps: config.providerFunding.caps,
    routeraiMaxConcurrency: config.providerFunding.routeraiMaxConcurrency,
    logger: {
      warn: (event, context) => console.warn(JSON.stringify({
        level: 'warn',
        event: `provider_funding.${event}`,
        ...context
      })),
      error: (event, context) => console.error(JSON.stringify({
        level: 'error',
        event: `provider_funding.${event}`,
        ...context
      }))
    }
  })
  : null;
if (providerFundingWorker && Object.hasOwn(fundingProviders, 'polza')) {
  providerFundingWorker.setProviderReady('polza', polzaFundingReady);
}
const payoutClient = config.tbankPayouts.enabled
  ? createTBankPayoutClient({
    terminalKey: config.tbankPayouts.terminalKey,
    privateKeyPem: config.tbankPayouts.privateKeyPem,
    certificateSerialNumber: config.tbankPayouts.certificateSerialNumber,
    notificationPassword: config.tbankPayouts.notificationPassword
  })
  : config.yookassaPayouts.agentId && config.yookassaPayouts.secretKey
    ? createYooKassaClient({
    shopId: config.yookassaPayouts.agentId,
    secretKey: config.yookassaPayouts.secretKey
  })
    : null;
const payoutProviderName = config.tbankPayouts.enabled ? 'tbank_mass_payouts' : 'yookassa_payouts';
const automaticPayoutsEnabled = Boolean(
  (config.yookassaPayouts.enabled || config.tbankPayouts.enabled)
  && payoutClient
  && selectedPayoutConfig.encryptionKey
);
const payoutService = selectedPayoutConfig.encryptionKey
  ? createPayoutService({
    client: payoutClient,
    referralService,
    enabled: automaticPayoutsEnabled,
    maxAttempts: config.tbankPayouts.enabled ? config.tbankPayouts.maxAttempts : 5,
    retryBaseMs: config.tbankPayouts.enabled ? config.tbankPayouts.retryBaseMs : 60_000,
    onPayoutChanged: async (payout) => {
      try {
        await historyRepository.recordFinancePayout?.({
          withdrawalId: payout.withdrawalId,
          telegramUserId: payout.telegramUserId,
          amountKopecks: payout.amountKopecks,
          method: payout.method,
          provider: payoutProviderName,
          externalPayoutId: payout.externalPayoutId,
          payoutFeeKopecks: payout.payoutFeeKopecks,
          status: payout.status,
          payoutStatus: payout.payoutStatus,
          destinationHint: payout.destinationHint,
          errorCode: payout.errorCode,
          processedAt: payout.processedAt ?? payout.attemptedAt
        });
      } catch (error) {
        console.error(`payout finance audit error: ${error.message}`);
      }

      const statusText = {
        succeeded: 'выплата завершена',
        canceled: 'выплата отменена',
        failed: 'выплата не прошла'
      }[payout.status];
      if (!statusText) return;

      const amount = payoutAmountText(payout.amountKopecks);
      const reason = payout.errorCode
        ? `\nкод провайдера: <code>${escapeTelegramHtml(payout.errorCode)}</code>`
        : '';
      if (payout.telegramUserId) {
        try {
          await telegram.sendMessage(payout.telegramUserId, {
            text: `${payout.status === 'succeeded' ? '✅' : '⚠️'} ${statusText}\n\nсумма: <b>${amount} ₽</b>${reason}`,
            parse_mode: 'HTML'
          });
        } catch (error) {
          console.error(`payout user notification error: ${error.message}`);
        }
      }
      if (config.botOwnerId) {
        try {
          await telegram.sendMessage(config.botOwnerId, {
            text: `💸 ${statusText}\n\nзаявка: <code>${escapeTelegramHtml(payout.withdrawalId)}</code>\nсумма: <b>${amount} ₽</b>\nспособ: ${payout.method === 'bank_card' ? 'российская карта' : 'СБП'}${reason}`,
            parse_mode: 'HTML'
          });
        } catch (error) {
          console.error(`payout owner notification error: ${error.message}`);
        }
      }
    }
  })
  : null;
const referralPayoutWorker = config.tbankPayouts.enabled
  && referralSupabaseClient
  && payoutClient
  && selectedPayoutConfig.encryptionKey
  ? createReferralPayoutWorkerRuntime({
    supabaseClient: referralSupabaseClient,
    tbankClient: payoutClient,
    encryptionKey: selectedPayoutConfig.encryptionKey,
    workerId: `metaflora-referral-payout-${process.pid}`,
    enabled: automaticPayoutsEnabled,
    maxAttempts: config.tbankPayouts.maxAttempts,
    retryBaseMs: config.tbankPayouts.retryBaseMs,
    logger: {
      warn: (event, context) => console.warn(JSON.stringify({
        level: 'warn',
        event: `referral_payout.${event}`,
        ...context
      })),
      error: (event, context) => console.error(JSON.stringify({
        level: 'error',
        event: `referral_payout.${event}`,
        ...context
      }))
    }
  })
  : null;
const tbankPayoutNotificationService = referralPayoutWorker
  ? Object.freeze({
    processNotification: (payload) => referralPayoutWorker.repository.reconcileTBankNotification(payload, payoutClient)
  })
  : null;
console.info(`YooKassa checkout ${yookassaPaymentService ? 'enabled' : 'disabled'}.`);
console.info(`T-Bank/SBP checkout ${tbankPaymentService ? 'enabled' : 'disabled'}.`);
console.info(`${config.tbankPayouts.enabled ? 'T-Business' : 'YooKassa'} payouts ${automaticPayoutsEnabled ? 'enabled' : 'disabled'}; referral queue ${referralPayoutWorker ? 'supabase' : 'local'}.`);
console.info(JSON.stringify({
  level: 'info',
  event: 'provider_funding.worker_configured',
  enabled: providerFundingWorker?.enabled === true,
  readiness: (polzaBrowserFundingClient || gptunnelBrowserFundingClient || routeraiBrowserFundingClient)
    ? 'pending_browser_probe'
    : polzaFundingReady ? 'ready' : 'not_ready',
  route: (polzaBrowserFundingClient || gptunnelBrowserFundingClient || routeraiBrowserFundingClient)
    ? 'persistent_browser_saved_card'
    : providerFundingClient ? 'direct_mcp' : 'none',
  mcpTokenConfigured: Boolean(providerFundingClient),
  directChargeConfigured: Boolean(directChargeContract),
}));
const agentPetService = config.providerKeys.openrouter
  ? createAgentPetService({ providerKeys: config.providerKeys })
  : null;
const stateRepository = new AppStateRepository(config.appDatabasePath);
async function syncPromoCatalog() {
  if (!referralSupabaseClient) return;
  const { data, error } = await referralSupabaseClient.schema('neuro').from('promo_codes')
    .select('code,reward_type,reward_value,max_uses,applicable_product_ids,expires_at,active,created_by,created_at');
  if (error) throw new Error(`promo catalog sync failed: ${error.code ?? 'unknown'}`);
  for (const row of data ?? []) {
    if (!['metacoins', 'discount_percent'].includes(row.reward_type)) continue;
    try {
      stateRepository.syncPromo({
        code: row.code,
        rewardType: row.reward_type,
        rewardValue: Number(row.reward_value),
        modelIds: row.applicable_product_ids ?? [],
        maxUses: Number(row.max_uses) || 1_000_000,
        expiresAt: row.expires_at,
        active: row.active,
        createdBy: row.created_by,
        createdAt: row.created_at,
      });
    } catch (error) {
      console.warn(JSON.stringify({ level: 'warn', event: 'promo.catalog.row_rejected', code: String(row.code ?? '').slice(0, 32), reason: error.message }));
    }
  }
}
await syncPromoCatalog().catch((error) => console.error(JSON.stringify({ level: 'error', event: 'promo.catalog.sync_failed', message: error.message })));
const promoSyncTimer = setInterval(() => {
  syncPromoCatalog().catch((error) => console.error(JSON.stringify({ level: 'error', event: 'promo.catalog.sync_failed', message: error.message })));
}, 30_000);
promoSyncTimer.unref?.();
const lifecycleService = config.historyStorage.enabled
  ? createLifecycleNotificationService({
    repository: historyRepository,
    telegram,
    onError: (error, context) => {
      console.error(`lifecycle notification error action=${context?.action ?? 'unknown'}: ${error.message}`);
    }
  })
  : null;
const voiceRuntimeConfigured = Boolean(
  config.providerKeys.elevenlabs
  && config.voiceSecurity.profileEncryptionKey
  && config.voiceSecurity.sampleHmacKey
);
const voiceProfileStore = voiceRuntimeConfigured
  ? new VoiceProfileStore(config.appDatabasePath, {
    encryptionKey: config.voiceSecurity.profileEncryptionKey
  })
  : null;
const voiceService = voiceRuntimeConfigured
  ? new ElevenLabsVoiceService({
    client: createElevenLabsClient({
      apiKey: config.providerKeys.elevenlabs,
      fetchImpl: providerFetch
    }),
    profileStore: voiceProfileStore,
    sampleHmacKey: config.voiceSecurity.sampleHmacKey,
    sampleHmacKeyId: config.voiceSecurity.sampleHmacKeyId
  })
  : null;
const musicRuntime = config.providerKeys.polza || config.providerKeys.fal || config.providerKeys.replicate
  ? createMusicRuntime({
    falKey: config.providerKeys.fal,
    polzaKey: config.providerKeys.polza,
    replicateToken: config.providerKeys.replicate,
    fetchImpl: providerFetch
  })
  : null;
const audioMediaUploader = config.providerKeys.fal ? falUploader(config.providerKeys.fal) : null;
const audioRuntimeConfigured = Boolean(voiceService || musicRuntime);
const audioWorkflowStageStore = audioRuntimeConfigured
  ? new DurableAudioWorkflowStageStore(config.appDatabasePath)
  : null;
const audioWorkflowTelegramId = (requestKey) => {
  const match = /^(?:audio-dub|music):([1-9]\d{0,19}):/u.exec(String(requestKey ?? ''));
  if (!match) throw new TypeError('Invalid audio workflow request owner.');
  return match[1];
};
const audioWorkflowBilling = audioRuntimeConfigured ? Object.freeze({
  async quote({ workflowId, settings }) {
    const workflow = getAudioWorkflowById(workflowId);
    if (!workflow) throw new RangeError('Unknown audio workflow.');
    const exact = Number(settings?.quotedMetacoins);
    return { currency: 'METACOIN', total: Number.isSafeInteger(exact) && exact > 0 ? exact : workflow.pricing.max };
  },
  async reserve({ requestKey, total }) {
    const telegramId = audioWorkflowTelegramId(requestKey);
    const result = referralService.reserveMetacoins({ telegramId, amount: total, requestKey });
    if (!['reserved', 'duplicate'].includes(result?.status)) throw new Error('Insufficient metacoins.');
    return { id: requestKey };
  },
  async settle({ reservationId, total }) {
    const telegramId = audioWorkflowTelegramId(reservationId);
    referralService.commitMetacoins({ telegramId, amount: total, requestKey: reservationId });
  },
  async release({ reservationId, total }) {
    const telegramId = audioWorkflowTelegramId(reservationId);
    referralService.releaseMetacoins({ telegramId, amount: total, requestKey: reservationId });
  }
}) : null;
const audioWorkflowExecutor = audioRuntimeConfigured ? createAudioWorkflowExecutor({
  toolExecutor: async () => { throw new Error('Tool audio route is not connected here.'); },
  elevenService: voiceService ?? Object.freeze({}),
  musicExecutor: musicRuntime,
  llm: async () => { throw new Error('Composite audio route is not connected here.'); },
  billing: audioWorkflowBilling,
  stageStore: audioWorkflowStageStore
}) : null;
let closed = false;
let httpServer = null;
let lifecycleTimer = null;
let providerFundingTimer = null;
let cryptoUsdcFundingTimer = null;
let providerFundingReadinessPromise = null;
let providerFundingReadinessCheckedAt = 0;
let providerFundingLastReady = Object.freeze({
  polza: polzaFundingReady,
  gptunnel: false,
  routerai: false
});

function closeResources() {
  if (closed) return;
  closed = true;
  telegram.close();
  audioWorkflowStageStore?.close();
  stateRepository.close();
  voiceProfileStore?.close();
  referralService.close();
  httpServer?.close();
  void referralPayoutWorker?.stop?.();
  if (lifecycleTimer) clearTimeout(lifecycleTimer);
  if (providerFundingTimer) clearTimeout(providerFundingTimer);
  if (cryptoUsdcFundingTimer) clearTimeout(cryptoUsdcFundingTimer);
  void historyService.close();
}

async function refreshProviderFundingReadiness({ force = false } = {}) {
  if ((!polzaBrowserFundingClient && !gptunnelBrowserFundingClient && !routeraiBrowserFundingClient)
    || !providerFundingWorker) return;
  const now = Date.now();
  if (!force && now - providerFundingReadinessCheckedAt < 60_000) return;
  if (providerFundingReadinessPromise) return providerFundingReadinessPromise;
  providerFundingReadinessCheckedAt = now;
  const clients = Object.freeze({
    ...(polzaBrowserFundingClient ? { polza: polzaBrowserFundingClient } : {}),
    ...(gptunnelBrowserFundingClient ? { gptunnel: gptunnelBrowserFundingClient } : {}),
    ...(routeraiBrowserFundingClient ? { routerai: routeraiBrowserFundingClient } : {})
  });
  providerFundingReadinessPromise = Promise.all(Object.entries(clients).map(async ([provider, client]) => {
    try {
      const status = await client.getStatus();
      const ready = status.persistent === true
        && status.authorization === 'authorized'
        && status.automation === 'ready'
        && status.cardEnrollment === 'ready'
        && status.loginPerPayment === false;
      if (ready) providerFundingLastReady = Object.freeze({ ...providerFundingLastReady, [provider]: true });
      const hardBlocked = status.authorization !== 'authorized'
        || status.loginPerPayment !== false
        || status.cardEnrollment === 'required_once'
        || ['blocked_until_authorization', 'blocked_until_user_action'].includes(status.automation);
      if (hardBlocked) providerFundingLastReady = Object.freeze({ ...providerFundingLastReady, [provider]: false });
      const transientProbe = status.authorization === 'authorized'
        && status.loginPerPayment === false
        && status.automation === 'unknown'
        && status.cardEnrollment === 'unknown'
        && Boolean(status.probeErrorCode);
      const effectiveReady = ready || (providerFundingLastReady[provider] === true && transientProbe);
      providerFundingWorker.setProviderReady(provider, effectiveReady);
      console.info(JSON.stringify({
        level: 'info',
        event: 'provider_funding.browser_status',
        provider,
        authorization: status.authorization,
        cardEnrollment: status.cardEnrollment,
        automation: status.automation,
        ready: effectiveReady,
        cached: effectiveReady && !ready,
        probeErrorCode: status.probeErrorCode || null
      }));
    } catch (error) {
      providerFundingWorker.setProviderReady(provider, false);
      console.error(JSON.stringify({
        level: 'error',
        event: 'provider_funding.browser_status_failed',
        provider,
        errorCode: error?.code || 'status_unavailable'
      }));
    }
  }))
    .finally(() => {
      providerFundingReadinessPromise = null;
    });
  return providerFundingReadinessPromise;
}

function startLifecycleWorker() {
  if (!lifecycleService
    && !referralService?.releaseDueEarnings) return;
  const run = async () => {
    if (closed || shutdown.signal.aborted) return;
    try {
      await lifecycleService?.runDueNotifications();
      await referralService?.releaseDueEarnings?.();
      if (!referralPayoutWorker) {
        await payoutService?.processPendingWithdrawals?.();
      }
      await processCrmUserNotifications({
        repository: historyRepository,
        referralService,
        telegram,
        logger: logError
      });
    } catch (error) {
      logError(error, { action: 'lifecycle_notification_worker' });
    }
    if (!closed && !shutdown.signal.aborted) {
      lifecycleTimer = setTimeout(run, 60_000);
      lifecycleTimer.unref?.();
    }
  };
  void run();
}

function startProviderFundingWorker() {
  if (!providerFundingWorker) return;
  const run = async () => {
    if (closed || shutdown.signal.aborted) return;
    try {
      await refreshProviderFundingReadiness();
      const result = await providerFundingWorker.run();
      if (result.claimed > 0 || result.status !== 'disabled') {
        console.info(`Provider funding run: ${JSON.stringify(result)}.`);
      }
    } catch (error) {
      console.error(`provider funding worker error: ${error.message}`);
    } finally {
      if (!closed && !shutdown.signal.aborted) {
        providerFundingTimer = setTimeout(run, config.providerFunding.intervalMs);
        providerFundingTimer.unref?.();
      }
    }
  };
  void run();
}

function startCryptoUsdcFundingWorker() {
  if (!cryptoUsdcFundingWorker) return;
  const run = async () => {
    if (closed || shutdown.signal.aborted) return;
    try {
      const result = await cryptoUsdcFundingWorker.run();
      if (result.claimed > 0) {
        console.info(`Crypto USDC funding run: ${JSON.stringify(result)}.`);
      }
    } catch (error) {
      console.error(`crypto USDC funding worker error: ${error.message}`);
    } finally {
      if (!closed && !shutdown.signal.aborted) {
        cryptoUsdcFundingTimer = setTimeout(run, config.cryptoUsdc.fundingWorker.intervalMs);
        cryptoUsdcFundingTimer.unref?.();
      }
    }
  };
  void run();
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    console.log(`Received ${signal}, stopping polling.`);
    shutdown.abort();
    telegram.close();
  });
}

function logError(error, context) {
  const labels = [
    context?.update_id ? `update=${context.update_id}` : '',
    context?.chatId ? `chat=${context.chatId}` : '',
    context?.action ? `action=${context.action}` : '',
    context?.modelId ? `model=${context.modelId}` : '',
    context?.requestKey ? `request=${context.requestKey}` : ''
  ].filter(Boolean);
  const suffix = labels.length > 0 ? ` ${labels.join(' ')}` : '';
  const chain = [];
  let current = error;
  for (let depth = 0; current && depth < 3; depth += 1) {
    const name = current.name || 'Error';
    const code = current.code ? ` code=${current.code}` : '';
    const message = String(current.message || 'unknown error')
      .replace(/https?:\/\/\S+/gu, '[url]')
      .replace(/bot\d+:[A-Za-z0-9_-]+/gu, '[token]')
      .replace(/[\u0000-\u001f]/gu, ' ')
      .slice(0, 320);
    chain.push(`${name}${code}: ${message}`);
    current = current.cause;
  }
  console.error(`telegram error${suffix}: ${chain.join(' <- ') || 'unknown error'}`);
}

async function start() {
  const menuMedia = await loadMenuMedia();
  httpServer = await startHttpServer({
    port: config.http.port,
    webhookPath: config.yookassa.webhookPath || '/webhooks/yookassa/disabled_webhook_route',
    paymentService: yookassaPaymentService ?? {
      async processWebhook() {
        return Object.freeze({ status: 'ignored' });
      }
    },
    tbankPaymentService,
    tbankCallbackSecret: config.tbank.callbackSecret,
    cryptoUsdcPaymentService,
    cryptoUsdcSharedSecret: config.cryptoUsdc.callbackSecret,
    agentPetService,
    mediaStorage: generatedMediaStorage,
    referralService,
    payoutService,
    tbankPayoutAuthorityEnabled: config.tbankPayouts.enabled,
    tbankPayoutNotificationService,
    tbankPayoutWebhookPath: config.tbankPayouts.webhookPath,
    payoutAgentId: config.tbankPayouts.enabled ? '' : config.yookassaPayouts.agentId,
    onPayoutSetupCompleted: async (withdrawal) => {
      const audit = historyRepository.recordFinancePayout?.({
        withdrawalId: withdrawal.withdrawalId,
        telegramUserId: withdrawal.telegramId,
        amountKopecks: withdrawal.amountKopecks,
        method: withdrawal.method,
        provider: payoutProviderName,
        status: 'pending',
        destinationHint: withdrawal.destinationHint
      });
      if (audit) {
        await audit.catch((error) => {
          console.error(`payout setup audit error: ${error.message}`);
        });
      }
      if (config.botOwnerId) {
        await telegram.sendMessage(config.botOwnerId, {
          text: `💸 новая заявка на выплату\n\nзаявка: <code>${String(withdrawal.withdrawalId)}</code>\nсумма: <b>${(withdrawal.amountKopecks / 100).toLocaleString('ru-RU')} ₽</b>\nспособ: ${withdrawal.method === 'bank_card' ? 'российская карта' : 'СБП'}\nреквизиты: <code>${String(withdrawal.destinationHint ?? 'скрыто')}</code>\n\nзаявка передана в автоматическую очередь ${config.tbankPayouts.enabled ? 'Т‑Бизнеса' : 'YooKassa'}.`,
          parse_mode: 'HTML'
        });
      }
      await telegram.sendMessage(withdrawal.telegramId, {
        text: `✅ заявка на вывод создана\n\nсумма: <b>${(withdrawal.amountKopecks / 100).toLocaleString('ru-RU')} ₽</b>\n\nреквизиты сохранены в защищённом виде. бот сообщит, когда выплата завершится.`,
        parse_mode: 'HTML'
      });
    },
    onError: logError
  });
  console.log(`HTTP server listening on port ${config.http.port}.`);

  if (voiceService) {
    try {
      const voices = await voiceService.refreshCuratedCatalog();
      setCuratedVoices(voices);
      console.log(`Voice catalog loaded: ${voices.length}.`);
    } catch (error) {
      logError(error, { action: 'voice-catalog' });
    }
  }

  try {
    await registerBotCommands(telegram);
    console.log('Telegram commands registered.');
  } catch (error) {
    logError(error);
  }

  const health = await checkProviderHealth(config.providerKeys, providerFetch);
  console.log(`Provider health: ${Object.entries(health).map(([name, state]) => `${name}=${state}`).join(', ') || 'no keys configured'}`);
  if (providerFundingClient) {
    try {
      const tools = await providerFundingClient.discoverTools();
      const directChargeAvailable = Boolean(
        directChargeContract && tools.some(({ name }) => name === directChargeContract.toolName)
      );
      console.log(
        `Polza MCP tools discovered: ${tools.length}; direct-charge tool `
        + `${directChargeAvailable ? 'available' : 'not available'}.`
      );
    } catch (error) {
      console.error(`Polza MCP discovery failed: ${error.message}`);
    }
  }

  const handleUpdate = createUpdateHandler({
    telegram,
    config,
    referralService,
    stateRepository,
    voiceService,
    audioWorkflowExecutor,
    historyService,
    entertainmentSessionRepository: historyRepository,
    paymentService,
    paymentRails,
    lifecycleService,
    mediaStorage: generatedMediaStorage,
    menuMedia,
    providerFetch,
    uploadMedia: audioMediaUploader,
    payoutSetupBaseUrl: config.publicBaseUrl,
    onError: logError
  });
  startLifecycleWorker();
  referralPayoutWorker?.start?.();
  startProviderFundingWorker();
  startCryptoUsdcFundingWorker();
  try {
    await runPolling({
      telegram,
      handleUpdate,
      onError: logError,
      signal: shutdown.signal
    });
  } finally {
    closeResources();
  }
}

start().catch((error) => {
  closeResources();
  console.error(`fatal startup error: ${error.message}`);
  process.exitCode = 1;
});
