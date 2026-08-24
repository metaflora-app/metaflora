import { createCipheriv, createHash, createHmac, randomBytes } from 'node:crypto';

import { quoteFor } from './payment-service.js';
import {
  buildMetacoinPurchaseSuccessMessage,
  buildPlanPurchaseSuccessMessage
} from './billing-ui.js';
import { createFinanceAllocations, summarizeFinanceAllocations } from './finance-ledger.js';
import { FINANCE_POLICY, financePolicyForProduct } from './finance-policy.js';
import { walletEntriesForAllocations } from './finance-wallet.js';

const TELEGRAM_ID = /^[1-9]\d{0,19}$/u;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{1,64}$/u;
const PROVIDER_PAYMENT_ID = /^[A-Za-z0-9_-]{1,128}$/u;
const ORDER_ID = /^mf_[a-f0-9]{32}$/u;
const MAX_TICKET_TTL_SECONDS = 15 * 60;
const REQUIRED_AUDIT_METHODS = Object.freeze([
  'recordPaymentCreated',
  'getPaymentCheckoutRecord',
  'claimPaymentWebhook',
  'updatePaymentWebhookStatus',
  'updatePaymentStatus',
  'recordPaymentFulfilled',
  'recordSubscriptionActivated',
  'recordFinanceAllocations',
  'recordWalletEntries',
  'recordTBankPaymentConfirmation'
]);

function nonEmptySecret(value, label) {
  const secret = String(value ?? '');
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new TypeError(`${label} must contain at least 32 bytes.`);
  }
  return secret;
}

function telegramId(value, label) {
  const id = String(value ?? '');
  if (!TELEGRAM_ID.test(id)) throw new TypeError(`${label} is invalid.`);
  return id;
}

function safeIdentifier(value, pattern, label) {
  const result = String(value ?? '');
  if (!pattern.test(result)) throw new TypeError(`${label} is invalid.`);
  return result;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new TypeError(`${label} is invalid.`);
  return number;
}

function receiptEmail(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const email = String(value).trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new TypeError('Receipt e-mail is invalid.');
  }
  return email;
}

function receiptPhone(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const source = String(value).trim();
  const digits = source.replace(/\D/gu, '');
  const normalized = digits.length === 11 && digits.startsWith('8')
    ? `+7${digits.slice(1)}`
    : `+${digits}`;
  if (!/^\+[1-9]\d{9,14}$/u.test(normalized)) throw new TypeError('Receipt phone is invalid.');
  return normalized;
}

function checkoutUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError('T-Bank gateway URL is invalid.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new TypeError('T-Bank gateway URL must be a safe HTTPS URL.');
  }
  return url;
}

function hmac(value, secret, encoding = 'base64url') {
  return createHmac('sha256', secret).update(value).digest(encoding);
}

function orderIdFor({ telegramUserId, idempotencyKey }, secret) {
  return `mf_${hmac(`${telegramUserId}:${idempotencyKey}`, secret, 'hex').slice(0, 32)}`;
}

export function buildTBankCheckoutTicket(payload, secret) {
  const key = createHash('sha256').update(secret, 'utf8').digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final()
  ]);
  return `v1.${iv.toString('base64url')}.${ciphertext.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}`;
}

function metadataFromCheckout(record) {
  const checkout = record?.providerPayload?.checkout;
  if (!checkout || typeof checkout !== 'object' || Array.isArray(checkout)) {
    throw new Error('Local T-Bank checkout metadata is missing.');
  }
  const kind = checkout.productKind;
  if (!['package', 'plan'].includes(kind)) throw new Error('Local T-Bank product kind is invalid.');
  const durationMonths = positiveInteger(checkout.durationMonths ?? 1, 'duration months');
  const durationDays = Number(checkout.durationDays ?? 0);
  if (!Number.isSafeInteger(durationDays) || durationDays < 0) {
    throw new TypeError('duration days is invalid.');
  }
  const remainingPlanMetacoinsBefore = Number(checkout.remainingPlanMetacoinsBefore ?? 0);
  if (!Number.isSafeInteger(remainingPlanMetacoinsBefore) || remainingPlanMetacoinsBefore < 0) {
    throw new TypeError('remaining metacoins is invalid.');
  }
  return Object.freeze({
    kind,
    productId: String(record.productId),
    telegramUserId: telegramId(record.telegramUserId, 'telegram user id'),
    telegramChatId: telegramId(checkout.telegramChatId, 'telegram chat id'),
    amountKopecks: positiveInteger(record.amountKopecks, 'payment amount'),
    metacoins: positiveInteger(record.baseMetacoins, 'metacoins'),
    metacoinsGranted: positiveInteger(checkout.metacoinsGranted ?? record.baseMetacoins, 'granted metacoins'),
    remainingPlanMetacoinsBefore,
    upgradeFromPlanId: checkout.upgradeFromPlanId ? String(checkout.upgradeFromPlanId) : null,
    upgradeReservationId: checkout.upgradeReservationId ? String(checkout.upgradeReservationId) : null,
    metacoinBalanceBefore: Number(checkout.metacoinBalanceBefore ?? 0),
    subscriptionMetacoinsTotalBefore: Number(checkout.subscriptionMetacoinsTotalBefore ?? 0),
    durationMonths,
    durationDays,
    testOnly: checkout.testOnly === true,
    isUpgrade: checkout.isUpgrade === true
  });
}

function callbackPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('T-Bank callback is invalid.');
  }
  if (value.provider !== 'tbank') throw new TypeError('T-Bank callback provider is invalid.');
  return Object.freeze({
    provider: 'tbank',
    status: String(value.status ?? ''),
    paymentId: safeIdentifier(value.paymentId, PROVIDER_PAYMENT_ID, 'provider payment id'),
    orderId: safeIdentifier(value.orderId, ORDER_ID, 'order id'),
    amountKopecks: positiveInteger(value.amountKopecks, 'callback amount'),
    terminalKey: String(value.terminalKey ?? '').slice(0, 128)
  });
}

function assertAuditRepository(repository) {
  if (!repository || REQUIRED_AUDIT_METHODS.some((method) => typeof repository[method] !== 'function')) {
    throw new TypeError('A complete persistent T-Bank payment audit repository is required.');
  }
}

function auditProviderPaymentMatches(record, callback) {
  const prior = record.providerPayload?.providerPaymentId;
  if (prior && String(prior) !== callback.paymentId) {
    throw new Error('T-Bank provider payment id conflicts with the local payment.');
  }
}

export function createTBankPaymentService({
  referralService,
  auditRepository,
  gatewayUrl,
  checkoutSecret,
  ticketTtlSeconds = MAX_TICKET_TTL_SECONDS,
  now = () => new Date(),
  notify = async () => {},
  financePolicy = FINANCE_POLICY
} = {}) {
  if (!referralService?.account) throw new TypeError('Referral service is required.');
  assertAuditRepository(auditRepository);
  const secret = nonEmptySecret(checkoutSecret, 'T-Bank checkout secret');
  const gateway = checkoutUrl(gatewayUrl);
  if (!Number.isSafeInteger(ticketTtlSeconds)
    || ticketTtlSeconds < 60
    || ticketTtlSeconds > MAX_TICKET_TTL_SECONDS) {
    throw new TypeError('T-Bank ticket TTL must be between 60 and 900 seconds.');
  }
  return Object.freeze({
    async createCheckout({
      kind,
      productId,
      durationMonths = 1,
      telegramUserId,
      telegramChatId,
      idempotencyKey,
      receiptEmail: sourceEmail,
      receiptPhone: sourcePhone,
      expectedAmountKopecks,
      promo = null
    }) {
      const userId = telegramId(telegramUserId, 'telegram user id');
      const chatId = telegramId(telegramChatId, 'telegram chat id');
      const key = safeIdentifier(idempotencyKey, IDEMPOTENCY_KEY, 'idempotency key');
      const email = receiptEmail(sourceEmail);
      const phone = receiptPhone(sourcePhone);
      if (!email && !phone) throw new TypeError('Receipt contact e-mail or phone is required.');
      const quote = quoteFor({
        kind,
        productId,
        durationMonths,
        account: await referralService.account(userId),
        promo,
        now: now()
      });
      if (expectedAmountKopecks !== undefined
        && integer(expectedAmountKopecks, 'expected amount', { positive: true }) !== quote.amountKopecks) {
        const error = new Error('Checkout quote changed before payment creation.');
        error.code = 'checkout_quote_changed';
        throw error;
      }
      const orderId = orderIdFor({ telegramUserId: userId, idempotencyKey: key }, secret);
      const upgradeReservationId = quote.isUpgrade ? orderId : null;
      let ownsUpgradeReservation = false;
      if (upgradeReservationId) {
        const reservation = referralService.reservePlanUpgrade({
          reservationId: upgradeReservationId,
          telegramId: userId,
          fromPlanId: quote.upgradeFromPlanId,
          targetPlanId: quote.productId,
          durationMonths: quote.durationMonths,
          currentDurationMonths: quote.currentDurationMonthsBefore,
          remainingPlanMetacoins: quote.remainingPlanMetacoinsBefore
        });
        if (!['reserved', 'duplicate'].includes(reservation?.status)) {
          throw new Error('Upgrade reservation is no longer payable.');
        }
        ownsUpgradeReservation = reservation.status === 'reserved';
      }
      const expiresAt = Math.floor(now().valueOf() / 1000) + ticketTtlSeconds;
      const checkout = Object.freeze({
        productKind: quote.kind,
        telegramChatId: chatId,
        durationMonths: quote.durationMonths,
        durationDays: quote.durationDays,
        isUpgrade: quote.isUpgrade === true,
        metacoinsGranted: quote.metacoinsGranted,
        remainingPlanMetacoinsBefore: quote.remainingPlanMetacoinsBefore,
        upgradeFromPlanId: quote.upgradeFromPlanId,
        upgradeReservationId,
        metacoinBalanceBefore: quote.metacoinBalanceBefore,
        subscriptionMetacoinsTotalBefore: quote.subscriptionMetacoinsTotalBefore,
        expiresAt
      });
      try {
        await auditRepository.recordPaymentCreated({
          provider: 'tbank',
          telegramUserId: userId,
          paymentId: orderId,
          productType: quote.kind === 'plan' ? 'subscription' : 'metacoins',
          productId: quote.productId,
          amountKopecks: quote.amountKopecks,
          baseMetacoins: quote.metacoins,
          receiptEmail: email,
          receiptPhone: phone,
          providerPayload: { checkout }
        });
        const ticket = buildTBankCheckoutTicket({
          paymentId: orderId,
          orderId,
          telegramUserId: userId,
          telegramChatId: chatId,
          productKind: quote.kind,
          productCode: quote.productId,
          productName: quote.description,
          amountKopecks: quote.amountKopecks,
          metacoins: quote.metacoins,
          durationMonths: quote.durationMonths,
          durationDays: quote.durationDays,
          ...(email ? { receiptEmail: email } : {}),
          ...(phone ? { receiptPhone: phone } : {}),
          tax: 'none',
          paymentObject: 'service',
          expiresAt
        }, secret);
        const confirmation = new URL(gateway);
        confirmation.searchParams.set('ticket', ticket);
        return Object.freeze({
          paymentId: orderId,
          confirmationUrl: confirmation.toString(),
          amountKopecks: quote.amountKopecks
        });
      } catch (error) {
        if (upgradeReservationId && ownsUpgradeReservation) {
          referralService.releasePlanUpgrade({ reservationId: upgradeReservationId, telegramId: userId });
        }
        throw error;
      }
    },

    async processCallback(value) {
      if (value?.status !== 'CONFIRMED') return Object.freeze({ status: 'ignored' });
      const callback = callbackPayload(value);
      const localPayment = await auditRepository.getPaymentCheckoutRecord(callback.orderId);
      if (!localPayment) throw new Error('Local payment record is missing.');
      if (localPayment.provider !== 'tbank') throw new Error('Local payment provider does not match T-Bank.');
      if (!['pending', 'succeeded'].includes(localPayment.status)) {
        throw new Error('Local T-Bank payment is not fulfillable.');
      }
      if (Number(localPayment.amountKopecks) !== callback.amountKopecks) {
        throw new Error('T-Bank callback amount mismatch.');
      }
      auditProviderPaymentMatches(localPayment, callback);
      const metadata = metadataFromCheckout(localPayment);
      if (metadata.testOnly) throw new Error('Legacy test tariff payments are no longer accepted.');
      const providerEventId = `CONFIRMED:ORDER:${callback.orderId}`;
      const claim = await auditRepository.claimPaymentWebhook({
        provider: 'tbank',
        providerEventId,
        eventType: 'CONFIRMED',
        paymentId: callback.orderId,
        signatureValid: true,
        payload: callback
      });
      if (!claim.claimed) return Object.freeze({ status: 'duplicate' });

      const confirmedAt = now();
      try {
        let result;
        let message;
        const accountBeforePayment = await referralService.account(metadata.telegramUserId);
        const referralBaseMetacoins = metadata.kind === 'plan'
          ? metadata.metacoinsGranted
          : metadata.metacoins;
        const bonusPreview = referralService.previewPaymentBonuses?.({
          telegramId: metadata.telegramUserId,
          baseMetacoins: referralBaseMetacoins
        }) ?? { totalBonusMetacoins: 0 };
        const productFinancePolicy = financePolicyForProduct({
          kind: metadata.kind,
          productId: metadata.productId,
          durationMonths: metadata.durationMonths ?? 1
        });
        const referralCostProbe = summarizeFinanceAllocations(createFinanceAllocations({
          externalPaymentId: `${callback.orderId}:referral-cost`,
          amountKopecks: callback.amountKopecks,
          referralEarningKopecks: 0,
          paymentFeePercent: financePolicy.paymentFeePercent ?? FINANCE_POLICY.paymentFeePercent,
          apiReservePercent: financePolicy.apiReservePercent ?? FINANCE_POLICY.apiReservePercent,
          providerWeights: financePolicy.providerWeights,
          metacoinsGranted: referralBaseMetacoins + Number(bonusPreview.totalBonusMetacoins ?? 0),
          enforceExactGrossMargin: financePolicy.enforceExactGrossMargin === true,
          targetGrossMarginPercent: productFinancePolicy.targetGrossMarginPercent,
          polzaReservePercent: productFinancePolicy.polzaReservePercent,
          routeraiReservePercent: productFinancePolicy.routeraiReservePercent,
          allocateRemainingToRouter: productFinancePolicy.allocateRemainingToRouter,
          ...(metadata.isUpgrade ? {
            providerMinimumsKopecks: financePolicy.providerMinimumsKopecks
              ?? FINANCE_POLICY.providerMinimumsKopecks,
            allowOwnerShareForProviderMinimums: true
          } : {}),
          source: 'referral_cost_probe'
        }));
        if (metadata.isUpgrade && metadata.upgradeFromPlanId && !metadata.upgradeReservationId && (
          accountBeforePayment.subscriptionPlanId !== metadata.upgradeFromPlanId
          || accountBeforePayment.subscriptionMetacoinsRemaining !== metadata.remainingPlanMetacoinsBefore
          || accountBeforePayment.subscriptionDurationMonths !== metadata.durationMonths
        )) {
          throw new Error('Subscription balance changed after the upgrade checkout was created.');
        }
        if (metadata.kind === 'package') {
        result = await referralService.recordPayment({
          paymentId: callback.orderId,
          telegramId: metadata.telegramUserId,
          amountKopecks: callback.amountKopecks,
          baseMetacoins: metadata.metacoins,
          paymentFeeKopecks: referralCostProbe.paymentFee,
          apiLiabilityKopecks: referralCostProbe.apiReserve,
          confirmedAt
        });
        message = buildMetacoinPurchaseSuccessMessage({
          packageId: metadata.productId,
          creditedMetacoins: metadata.metacoins,
          balanceMetacoins: (await referralService.account(metadata.telegramUserId)).metacoinBalance,
          receiptEmail: localPayment.receiptEmail
        });
        } else {
        result = await referralService.activateSubscription({
          paymentId: callback.orderId,
          telegramId: metadata.telegramUserId,
          planId: metadata.productId,
          durationMonths: metadata.durationMonths,
          durationDays: metadata.durationDays,
          priceKopecks: callback.amountKopecks,
          metacoins: metadata.metacoins,
          creditedMetacoins: metadata.metacoinsGranted,
          remainingPlanMetacoinsBefore: metadata.remainingPlanMetacoinsBefore,
          upgradeReservationId: metadata.upgradeReservationId,
          paymentFeeKopecks: referralCostProbe.paymentFee,
          apiLiabilityKopecks: referralCostProbe.apiReserve,
          activatedAt: confirmedAt
        });
        message = buildPlanPurchaseSuccessMessage({
          planId: metadata.productId,
          durationMonths: metadata.durationMonths,
          creditedMetacoins: metadata.metacoinsGranted,
          balanceMetacoins: (await referralService.account(metadata.telegramUserId)).metacoinBalance,
          expiresAt: result.expiresAt,
          operation: 'activated',
          receiptEmail: localPayment.receiptEmail
        });
        }

      await auditRepository.updatePaymentStatus({
        provider: 'tbank',
        paymentId: callback.orderId,
        status: 'succeeded',
        providerPayload: {
          ...localPayment.providerPayload,
          providerPaymentId: callback.paymentId,
          confirmation: callback
        },
        paidAt: confirmedAt
      });
      const account = await referralService.account(metadata.telegramUserId);
      const bonusMetacoins = Number(result.bonusMetacoins ?? 0);
      if (metadata.kind === 'package') {
        await auditRepository.recordPaymentFulfilled({
          telegramUserId: metadata.telegramUserId,
          paymentId: callback.orderId,
          metacoins: metadata.metacoins + bonusMetacoins,
          bonusMetacoins,
          balanceAfter: account.metacoinBalance
        });
      } else {
        await auditRepository.recordSubscriptionActivated({
          telegramUserId: metadata.telegramUserId,
          paymentId: callback.orderId,
          planId: metadata.productId,
          startsAt: result.startsAt,
          expiresAt: result.expiresAt,
          priceKopecks: callback.amountKopecks,
          metacoins: metadata.metacoinsGranted,
          ...(metadata.isUpgrade ? {
            subscriptionMetacoinsTotal: metadata.metacoins,
            subscriptionMetacoinsTotalBefore: metadata.subscriptionMetacoinsTotalBefore,
            fromPlanId: metadata.upgradeFromPlanId,
            durationMonths: metadata.durationMonths,
            remainingPlanMetacoinsBefore: metadata.remainingPlanMetacoinsBefore,
            balanceBefore: metadata.metacoinBalanceBefore
          } : {}),
          balanceAfter: account.metacoinBalance
        });
      }
      const financeInput = {
        externalPaymentId: callback.orderId,
        amountKopecks: callback.amountKopecks,
        currency: 'RUB',
        referralEarningKopecks: Number(result.referralEarningKopecks ?? 0),
        paymentFeePercent: financePolicy.paymentFeePercent ?? FINANCE_POLICY.paymentFeePercent,
        apiReservePercent: financePolicy.apiReservePercent ?? FINANCE_POLICY.apiReservePercent,
        providerWeights: financePolicy.providerWeights,
        metacoinsGranted: (metadata.kind === 'plan'
          ? metadata.metacoinsGranted
          : metadata.metacoins) + bonusMetacoins,
        enforceExactGrossMargin: financePolicy.enforceExactGrossMargin === true,
        ...(metadata.isUpgrade ? {
          providerMinimumsKopecks: financePolicy.providerMinimumsKopecks
            ?? FINANCE_POLICY.providerMinimumsKopecks,
          allowOwnerShareForProviderMinimums: true
        } : {}),
        targetGrossMarginPercent: productFinancePolicy.targetGrossMarginPercent,
        polzaReservePercent: productFinancePolicy.polzaReservePercent,
        routeraiReservePercent: productFinancePolicy.routeraiReservePercent,
        allocateRemainingToRouter: productFinancePolicy.allocateRemainingToRouter,
        source: 'tbank_payment_callback'
      };
      const reserveCarryInKopecks = 0;
      const allocations = createFinanceAllocations({ ...financeInput, reserveCarryInKopecks });
      await auditRepository.recordFinanceAllocations({
        externalPaymentId: callback.orderId,
        telegramUserId: metadata.telegramUserId,
        allocations,
        autoTopUp: true,
        metadata: {
          provider: 'tbank',
          productType: metadata.kind === 'plan' ? 'subscription' : 'metacoins',
          productId: metadata.productId,
          confirmationSource: 'tbank',
          confirmationEvent: 'CONFIRMED',
          confirmationStatus: 'succeeded',
          upgrade: metadata.isUpgrade
          ,reserveCarryInKopecks
        },
        occurredAt: confirmedAt
      });
      await auditRepository.recordWalletEntries({
        externalPaymentId: callback.orderId,
        telegramUserId: metadata.telegramUserId,
        entries: walletEntriesForAllocations({
          externalPaymentId: callback.orderId,
          telegramUserId: metadata.telegramUserId,
          allocations
        }),
        occurredAt: confirmedAt
      });
      await auditRepository.recordTBankPaymentConfirmation({
        externalEventId: providerEventId,
        paymentId: callback.orderId,
        amountKopecks: callback.amountKopecks,
        currency: 'RUB',
        event: 'CONFIRMED',
        status: 'succeeded',
        confirmedAt,
        metadata: {
          productType: metadata.kind === 'plan' ? 'subscription' : 'metacoins',
          productId: metadata.productId,
          telegramUserId: metadata.telegramUserId,
          providerPaymentId: callback.paymentId
        }
      });
      await notify({
        telegramUserId: metadata.telegramUserId,
        telegramChatId: metadata.telegramChatId,
        message
      });
        await auditRepository.updatePaymentWebhookStatus({
          provider: 'tbank', providerEventId, status: 'processed'
        });
        return Object.freeze({ status: result.status === 'duplicate' ? 'duplicate' : 'processed' });
      } catch (error) {
        await auditRepository.updatePaymentWebhookStatus({
          provider: 'tbank',
          providerEventId,
          status: 'failed',
          errorMessage: String(error?.message ?? error).slice(0, 1_000)
        }).catch(() => {});
        throw error;
      }
    }
  });
}
