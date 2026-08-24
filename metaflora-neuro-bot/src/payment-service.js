import {
  calculatePlanUpgrade,
  getMetacoinPackage,
  getSubscriptionOffer,
  getSubscriptionPlan,
  isPaidSubscriptionActive
} from './billing-catalog.js';
import {
  buildPaymentFailureMessage,
  buildMetacoinPurchaseSuccessMessage,
  buildPlanPurchaseSuccessMessage
} from './billing-ui.js';
import { createFinanceAllocations, requiredFinanceReserveCarry, summarizeFinanceAllocations } from './finance-ledger.js';
import { FINANCE_POLICY } from './finance-policy.js';
import { walletEntriesForAllocations } from './finance-wallet.js';

const TELEGRAM_ID = /^[1-9]\d{0,19}$/u;
const PRODUCT_ID = /^[a-z][a-z0-9_]{1,63}$/u;
const PAYMENT_ID = /^[A-Za-z0-9_-]{1,128}$/u;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{1,64}$/u;

function integer(value, label, { positive = false } = {}) {
  const number = typeof value === 'string' && /^\d+$/u.test(value) ? Number(value) : value;
  if (!Number.isSafeInteger(number) || (positive ? number <= 0 : number < 0)) {
    throw new TypeError(`${label} is invalid.`);
  }
  return number;
}

function telegramId(value, label) {
  const id = String(value ?? '');
  if (!TELEGRAM_ID.test(id)) throw new TypeError(`${label} is invalid.`);
  return id;
}

function productId(value) {
  const id = String(value ?? '');
  if (!PRODUCT_ID.test(id)) throw new TypeError('product id is invalid.');
  return id;
}

function idempotencyKey(value) {
  const key = String(value ?? '');
  if (!IDEMPOTENCY_KEY.test(key)) throw new TypeError('idempotency key is invalid.');
  return key;
}

function requiredReceiptEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new Error('A real customer email is required to issue the YooKassa receipt.');
  }
  return email;
}

export class ActiveSubscriptionError extends Error {
  constructor(planId) {
    super(`The ${String(planId)} subscription is already active.`);
    this.name = 'ActiveSubscriptionError';
    this.code = 'active_subscription';
  }
}

function paymentId(value) {
  const id = String(value ?? '');
  if (!PAYMENT_ID.test(id)) throw new TypeError('payment id is invalid.');
  return id;
}

function confirmationUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('YooKassa did not return a payment URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('YooKassa returned an unsafe payment URL.');
  }
  return url.toString();
}

function kopecksFromProvider(amount) {
  if (amount?.currency !== 'RUB' || !/^\d+\.\d{2}$/u.test(String(amount?.value ?? ''))) {
    throw new Error('Payment amount is invalid.');
  }
  const [rubles, kopecks] = amount.value.split('.');
  const result = Number(rubles) * 100 + Number(kopecks);
  return integer(result, 'payment amount', { positive: true });
}

function discountFor(promo, amountKopecks) {
  if (!promo?.active || promo.rewardType !== 'discount_percent' || promo.modelIds?.length) return 0;
  const percent = Math.min(100, Math.max(0, Number(promo.rewardValue) || 0));
  return Math.round(amountKopecks * percent / 100);
}

function quotePackage(sourceProductId, promo) {
  const item = getMetacoinPackage(productId(sourceProductId));
  if (!item) throw new Error('Unknown metacoin package.');
  const discountKopecks = discountFor(promo, item.priceKopecks);
  return Object.freeze({
    kind: 'package',
    productId: item.id,
    amountKopecks: item.priceKopecks - discountKopecks,
    metacoins: item.metacoins,
    durationMonths: 1,
    durationDays: 0,
    description: `${item.metacoins.toLocaleString('ru-RU')} метакоинов`
  });
}

function quotePlan(sourceProductId, durationMonths, account, promo, at = new Date()) {
  const id = productId(sourceProductId);
  const offer = getSubscriptionOffer(
    id,
    integer(durationMonths, 'duration months', { positive: true })
  );
  const target = getSubscriptionPlan(id);
  if (!offer || !target || target.priceKopecks === 0) throw new Error('Unknown paid plan.');
  const current = getSubscriptionPlan(account?.subscriptionPlanId)
    ?? getSubscriptionPlan('newcomer');
  if (target.id === current.id && isPaidSubscriptionActive(account, at)) {
    throw new ActiveSubscriptionError(target.id);
  }
  let amountKopecks = offer.priceKopecks;
  let isUpgrade = false;
  let metacoinsGranted = offer.metacoins;
  let remainingPlanMetacoinsBefore = 0;
  let upgradeFromPlanId = null;
  let metacoinBalanceBefore = Number(account?.metacoinBalance ?? 0);
  let subscriptionMetacoinsTotalBefore = Number(account?.subscriptionMetacoinsTotal ?? 0);
  const hasRecognizedActivePaidSubscription = current.priceKopecks > 0
    && isPaidSubscriptionActive(account, at);
  if (target.id !== current.id
    && target.priceKopecks > current.priceKopecks
    && hasRecognizedActivePaidSubscription) {
    const upgrade = calculatePlanUpgrade({
      currentPlanId: current.id,
      targetPlanId: target.id,
      remainingPlanMetacoins: account?.subscriptionMetacoinsRemaining ?? 0,
      currentSubscriptionMetacoinsTotal: account?.subscriptionMetacoinsTotal,
      currentSubscriptionPriceKopecks: account?.subscriptionPriceKopecks,
      currentDurationMonths: account?.subscriptionDurationMonths ?? durationMonths,
      targetDurationMonths: offer.months
    });
    amountKopecks = Math.max(0, amountKopecks - upgrade.creditKopecks);
    isUpgrade = true;
    metacoinsGranted = upgrade.metacoinsGranted;
    remainingPlanMetacoinsBefore = upgrade.remainingPlanMetacoins;
    upgradeFromPlanId = current.id;
  }
  amountKopecks -= discountFor(promo, amountKopecks);
  if (amountKopecks <= 0) throw new Error('A zero-value checkout cannot be sent to YooKassa.');
  return Object.freeze({
    kind: 'plan',
    productId: target.id,
    amountKopecks,
    metacoins: offer.metacoins,
    metacoinsGranted,
    remainingPlanMetacoinsBefore,
    upgradeFromPlanId,
    metacoinBalanceBefore,
    subscriptionMetacoinsTotalBefore,
    currentDurationMonthsBefore: Number(account?.subscriptionDurationMonths ?? offer.months),
    durationMonths: offer.months,
    durationDays: offer.durationDays,
    description: `тариф «${target.name}» на ${offer.months === 3 ? '3 месяца' : '1 месяц'}`,
    isUpgrade
  });
}

export function quoteFor({ kind, productId: sourceProductId, durationMonths = 1, account, promo, now = new Date() }) {
  if (kind === 'package') return quotePackage(sourceProductId, promo);
  if (kind === 'plan') return quotePlan(sourceProductId, durationMonths, account, promo, now);
  throw new TypeError('payment kind is invalid.');
}

function verifiedMetadata(providerPayment) {
  const metadata = providerPayment?.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Payment metadata is missing.');
  }
  const kind = metadata.productKind;
  if (!['package', 'plan'].includes(kind)) throw new Error('Payment product kind is invalid.');
  return Object.freeze({
    kind,
    productId: productId(metadata.productId),
    telegramUserId: telegramId(metadata.telegramUserId, 'telegram user id'),
    telegramChatId: telegramId(metadata.telegramChatId, 'telegram chat id'),
    amountKopecks: integer(metadata.amountKopecks, 'metadata amount', { positive: true }),
    metacoins: integer(metadata.metacoins, 'metadata metacoins', { positive: true }),
    metacoinsGranted: integer(metadata.metacoinsGranted ?? metadata.metacoins, 'metadata granted metacoins', { positive: true }),
    remainingPlanMetacoinsBefore: integer(metadata.remainingPlanMetacoinsBefore ?? '0', 'metadata remaining metacoins'),
    upgradeFromPlanId: metadata.upgradeFromPlanId ? productId(metadata.upgradeFromPlanId) : null,
    upgradeReservationId: metadata.upgradeReservationId ? String(metadata.upgradeReservationId) : null,
    metacoinBalanceBefore: integer(metadata.metacoinBalanceBefore ?? '0', 'metadata balance before'),
    subscriptionMetacoinsTotalBefore: integer(metadata.subscriptionMetacoinsTotalBefore ?? '0', 'metadata subscription total before'),
    durationMonths: integer(metadata.durationMonths ?? '1', 'metadata duration', { positive: true }),
    durationDays: integer(metadata.durationDays ?? '0', 'metadata duration days'),
    testOnly: metadata.testOnly === 'true',
    isUpgrade: metadata.isUpgrade === 'true'
  });
}

async function auditOrThrow(repository, method, value, onAuditError) {
  if (typeof repository?.[method] !== 'function') return;
  try {
    await repository[method](value);
  } catch (error) {
    onAuditError(error, { action: `payment_audit.${method}` });
    throw error;
  }
}

function assertLocalPayment(record, metadata, paymentIdentifier) {
  if (!record) throw new Error('Local payment record is missing.');
  const expectedType = metadata.kind === 'plan' ? 'subscription' : 'metacoins';
  const matches = record.paymentId === paymentIdentifier
    && String(record.telegramUserId) === metadata.telegramUserId
    && record.productType === expectedType
    && record.productId === metadata.productId
    && Number(record.amountKopecks) === metadata.amountKopecks
    && Number(record.baseMetacoins) === metadata.metacoins
    && ['pending', 'succeeded'].includes(record.status);
  if (!matches) throw new Error('Local payment record does not match YooKassa.');
}

function receiptEmailFromProvider(providerPayment) {
  const email = String(providerPayment?.receipt?.customer?.email ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : null;
}

function receiptEmailFromLocalPayment(localPayment) {
  const email = String(localPayment?.receiptEmail ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : null;
}

function paymentFailureReason(providerPayment) {
  const reason = String(providerPayment?.cancellation_details?.reason ?? '').trim().toLowerCase();
  if (reason) return reason;
  return String(providerPayment?.status ?? 'payment_failed').trim().toLowerCase();
}

function paymentFailureBackData(metadata) {
  return metadata.kind === 'plan'
    ? `billing:planinfo:${metadata.productId}:profile`
    : 'billing:packages:balance';
}

export function createPaymentService({
  client,
  referralService,
  auditRepository = null,
  notify = async () => {},
  onAuditError = () => {},
  returnUrl,
  now = () => new Date(),
  financePolicy = {}
} = {}) {
  if (!client?.createPayment && !client?.getPayment) throw new TypeError('YooKassa client is required.');
  if (!referralService) throw new TypeError('Referral service is required.');
  if (auditRepository) {
    const requiredAuditMethods = [
      'recordPaymentCreated',
      'getPaymentRecord',
      'recordPaymentWebhook',
      'getPaymentWebhookStatus',
      'updatePaymentWebhookStatus',
      'updatePaymentStatus',
      'recordSubscriptionActivated'
    ];
    if (requiredAuditMethods.some((method) => typeof auditRepository[method] !== 'function')) {
      throw new TypeError('A complete payment audit repository is required.');
    }
  }
  confirmationUrl(returnUrl);
  return Object.freeze({
    async createCheckout({
      kind,
      productId: sourceProductId,
      durationMonths = 1,
      telegramUserId: sourceTelegramUserId,
      telegramChatId: sourceTelegramChatId,
      idempotencyKey: sourceIdempotencyKey,
      receiptEmail,
      expectedAmountKopecks,
      promo = null
    }) {
      const userId = telegramId(sourceTelegramUserId, 'telegram user id');
      const chatId = telegramId(sourceTelegramChatId, 'telegram chat id');
      const customerEmail = requiredReceiptEmail(receiptEmail);
      const checkoutKey = idempotencyKey(sourceIdempotencyKey);
      const account = await referralService.account(userId);
      const quote = quoteFor({
        kind,
        productId: sourceProductId,
        durationMonths,
        account,
        promo,
        now: now()
      });
      if (expectedAmountKopecks !== undefined
        && integer(expectedAmountKopecks, 'expected amount', { positive: true }) !== quote.amountKopecks) {
        const error = new Error('Checkout quote changed before payment creation.');
        error.code = 'checkout_quote_changed';
        throw error;
      }
      const upgradeReservationId = quote.isUpgrade ? `yu_${userId}_${checkoutKey}` : null;
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
      let response;
      try {
        response = await client.createPayment({
        idempotenceKey: checkoutKey,
        amountKopecks: quote.amountKopecks,
        description: quote.description,
        returnUrl,
        receiptEmail: customerEmail,
        metadata: {
          telegramUserId: userId,
          telegramChatId: chatId,
          productKind: quote.kind,
          productId: quote.productId,
          durationMonths: String(quote.durationMonths),
          durationDays: String(quote.durationDays),
          metacoins: String(quote.metacoins),
          metacoinsGranted: String(quote.metacoinsGranted),
          remainingPlanMetacoinsBefore: String(quote.remainingPlanMetacoinsBefore),
          ...(quote.upgradeFromPlanId ? { upgradeFromPlanId: quote.upgradeFromPlanId } : {}),
          ...(upgradeReservationId ? { upgradeReservationId } : {}),
          ...(quote.isUpgrade ? { metacoinBalanceBefore: String(quote.metacoinBalanceBefore) } : {}),
          ...(quote.isUpgrade ? { subscriptionMetacoinsTotalBefore: String(quote.subscriptionMetacoinsTotalBefore) } : {}),
          amountKopecks: String(quote.amountKopecks),
          ...(quote.isUpgrade ? { isUpgrade: 'true' } : {})
        }
        });
      } catch (error) {
        if (upgradeReservationId && ownsUpgradeReservation) {
          referralService.releasePlanUpgrade({ reservationId: upgradeReservationId, telegramId: userId });
        }
        throw error;
      }
      try {
        const id = paymentId(response?.id);
        const checkoutUrl = confirmationUrl(response?.confirmation?.confirmation_url);
        if (typeof auditRepository?.recordPaymentCreated === 'function') {
          await auditRepository.recordPaymentCreated({
            telegramUserId: userId,
            paymentId: id,
            productType: quote.kind === 'plan' ? 'subscription' : 'metacoins',
            productId: quote.productId,
            amountKopecks: quote.amountKopecks,
            baseMetacoins: quote.metacoins,
            receiptEmail: customerEmail,
            providerPayload: response
          });
        }
        return Object.freeze({
          paymentId: id,
          confirmationUrl: checkoutUrl,
          amountKopecks: quote.amountKopecks
        });
      } catch (error) {
        if (upgradeReservationId && ownsUpgradeReservation) {
          referralService.releasePlanUpgrade({ reservationId: upgradeReservationId, telegramId: userId });
        }
        throw error;
      }
    },

    async processWebhook(event) {
      if (event?.type !== 'notification' || !String(event?.event ?? '').startsWith('payment.')) {
        return Object.freeze({ status: 'ignored' });
      }
      const eventPaymentId = paymentId(event?.object?.id);
      const providerPayment = await client.getPayment(eventPaymentId);
      if (providerPayment?.id !== eventPaymentId) throw new Error('Payment id mismatch.');
      const metadata = verifiedMetadata(providerPayment);
      if (metadata.testOnly) throw new Error('Legacy test tariff payments are no longer accepted.');
      const amountKopecks = kopecksFromProvider(providerPayment.amount);
      if (amountKopecks !== metadata.amountKopecks) throw new Error('Payment amount mismatch.');
      if (event.event !== `payment.${providerPayment.status}`) throw new Error('Payment status mismatch.');

      const providerEventId = `${event.event}:${eventPaymentId}`;
      let localPayment = null;
      if (typeof auditRepository?.getPaymentRecord === 'function') {
        localPayment = await auditRepository.getPaymentRecord(eventPaymentId);
        assertLocalPayment(localPayment, metadata, eventPaymentId);
      }
      if (typeof auditRepository?.getPaymentWebhookStatus === 'function') {
        const webhookStatus = await auditRepository.getPaymentWebhookStatus(providerEventId);
        if (webhookStatus === 'processed' || webhookStatus === 'ignored') {
          return Object.freeze({ status: 'duplicate' });
        }
      }
      if (typeof auditRepository?.recordPaymentWebhook === 'function') {
        await auditRepository.recordPaymentWebhook({
          providerEventId,
          eventType: event.event,
          paymentId: eventPaymentId,
          payload: event
        });
      }
      if (providerPayment.status !== 'succeeded' || providerPayment.paid !== true) {
        await auditOrThrow(auditRepository, 'updatePaymentStatus', {
          paymentId: eventPaymentId,
          status: providerPayment.status === 'canceled' ? 'cancelled' : 'pending',
          providerPayload: providerPayment
        }, onAuditError);
        const terminalFailure = ['canceled', 'failed', 'expired'].includes(providerPayment.status);
        if (terminalFailure) {
          if (metadata.upgradeReservationId) {
            referralService.releasePlanUpgrade({
              reservationId: metadata.upgradeReservationId,
              telegramId: metadata.telegramUserId
            });
          }
          await notify({
            telegramUserId: metadata.telegramUserId,
            telegramChatId: metadata.telegramChatId,
            message: buildPaymentFailureMessage({
              reason: paymentFailureReason(providerPayment),
              backData: paymentFailureBackData(metadata)
            })
          });
        }
        await auditOrThrow(auditRepository, 'updatePaymentWebhookStatus', {
          providerEventId,
          status: 'ignored'
        }, onAuditError);
        return Object.freeze({ status: terminalFailure ? 'failed' : 'ignored' });
      }

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
      const referralCostProbe = summarizeFinanceAllocations(createFinanceAllocations({
        externalPaymentId: `${eventPaymentId}:referral-cost`,
        amountKopecks,
        referralEarningKopecks: 0,
        paymentFeePercent: financePolicy.paymentFeePercent ?? FINANCE_POLICY.paymentFeePercent,
        apiReservePercent: financePolicy.apiReservePercent ?? FINANCE_POLICY.apiReservePercent,
        providerWeights: financePolicy.providerWeights,
        metacoinsGranted: referralBaseMetacoins + Number(bonusPreview.totalBonusMetacoins ?? 0),
        enforceExactGrossMargin: financePolicy.enforceExactGrossMargin === true,
        targetGrossMarginPercent: financePolicy.targetGrossMarginPercent
          ?? FINANCE_POLICY.targetGrossMarginPercent,
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
      const providerReceiptEmail = receiptEmailFromProvider(providerPayment);
      const localReceiptEmail = receiptEmailFromLocalPayment(localPayment);
      if (providerReceiptEmail && localReceiptEmail && providerReceiptEmail !== localReceiptEmail) {
        throw new Error('YooKassa receipt email does not match the checkout record.');
      }
      const receiptEmail = providerReceiptEmail ?? localReceiptEmail;
      if (!receiptEmail) {
        throw new Error('Successful YooKassa payment has no verified receipt email.');
      }
      if (metadata.kind === 'package') {
        result = await referralService.recordPayment({
          paymentId: eventPaymentId,
          telegramId: metadata.telegramUserId,
          amountKopecks,
          baseMetacoins: metadata.metacoins,
          paymentFeeKopecks: referralCostProbe.paymentFee,
          apiLiabilityKopecks: referralCostProbe.apiReserve,
          confirmedAt: providerPayment.captured_at ?? providerPayment.created_at ?? now()
        });
        const account = await referralService.account(metadata.telegramUserId);
        message = buildMetacoinPurchaseSuccessMessage({
          packageId: metadata.productId,
          creditedMetacoins: metadata.metacoins,
          balanceMetacoins: account.metacoinBalance,
          receiptEmail: providerReceiptEmail
        });
      } else {
        result = await referralService.activateSubscription({
          paymentId: eventPaymentId,
          telegramId: metadata.telegramUserId,
          planId: metadata.productId,
          durationMonths: metadata.durationMonths,
          durationDays: metadata.durationDays,
          priceKopecks: amountKopecks,
          metacoins: metadata.metacoins,
          creditedMetacoins: metadata.metacoinsGranted,
          remainingPlanMetacoinsBefore: metadata.remainingPlanMetacoinsBefore,
          upgradeReservationId: metadata.upgradeReservationId,
          paymentFeeKopecks: referralCostProbe.paymentFee,
          apiLiabilityKopecks: referralCostProbe.apiReserve,
          activatedAt: providerPayment.captured_at ?? providerPayment.created_at ?? now()
        });
        const account = await referralService.account(metadata.telegramUserId);
        message = buildPlanPurchaseSuccessMessage({
          planId: metadata.productId,
          durationMonths: metadata.durationMonths,
          creditedMetacoins: metadata.metacoinsGranted,
          balanceMetacoins: account.metacoinBalance,
          expiresAt: result.expiresAt,
          operation: 'activated',
          receiptEmail: providerReceiptEmail
        });
      }
      await auditOrThrow(auditRepository, 'updatePaymentStatus', {
        paymentId: eventPaymentId,
        status: 'succeeded',
        providerPayload: providerPayment,
        paidAt: providerPayment.captured_at ?? providerPayment.created_at ?? now()
      }, onAuditError);
      const accountAfterPayment = await referralService.account(metadata.telegramUserId);
      const bonusMetacoins = Number(result.bonusMetacoins ?? 0)
        || Number(result.friendBonusMetacoins ?? 0) + Number(result.inviterBonusMetacoins ?? 0);
      if (metadata.kind === 'package') {
        await auditOrThrow(auditRepository, 'recordPaymentFulfilled', {
          telegramUserId: metadata.telegramUserId,
          paymentId: eventPaymentId,
          metacoins: metadata.metacoins + bonusMetacoins,
          bonusMetacoins,
          balanceAfter: accountAfterPayment.metacoinBalance
        }, onAuditError);
      }
      if (metadata.kind === 'plan') {
        await auditOrThrow(auditRepository, 'recordSubscriptionActivated', {
          telegramUserId: metadata.telegramUserId,
          paymentId: eventPaymentId,
          planId: metadata.productId,
          startsAt: result.startsAt,
          expiresAt: result.expiresAt,
          priceKopecks: amountKopecks,
          metacoins: metadata.metacoinsGranted,
          ...(metadata.isUpgrade ? {
            subscriptionMetacoinsTotal: metadata.metacoins,
            subscriptionMetacoinsTotalBefore: metadata.subscriptionMetacoinsTotalBefore,
            fromPlanId: metadata.upgradeFromPlanId,
            durationMonths: metadata.durationMonths,
            remainingPlanMetacoinsBefore: metadata.remainingPlanMetacoinsBefore,
            balanceBefore: metadata.metacoinBalanceBefore
          } : {}),
          balanceAfter: accountAfterPayment.metacoinBalance
        }, onAuditError);
      }
      if (typeof auditRepository?.recordFinanceAllocations === 'function') {
        const financeInput = {
          externalPaymentId: eventPaymentId,
          amountKopecks,
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
          targetGrossMarginPercent: financePolicy.targetGrossMarginPercent
            ?? FINANCE_POLICY.targetGrossMarginPercent,
          source: 'payment_webhook'
        };
        const reserveCarryInKopecks = metadata.isUpgrade
          ? requiredFinanceReserveCarry(financeInput)
          : 0;
        const allocations = createFinanceAllocations({ ...financeInput, reserveCarryInKopecks });
        await auditOrThrow(auditRepository, 'recordFinanceAllocations', {
          externalPaymentId: eventPaymentId,
          telegramUserId: metadata.telegramUserId,
          allocations,
          autoTopUp: true,
          metadata: {
            provider: 'yookassa',
            productType: metadata.kind === 'plan' ? 'subscription' : 'metacoins',
            productId: metadata.productId,
            confirmationSource: 'yookassa',
            confirmationEvent: event.event,
            confirmationStatus: 'succeeded',
            upgrade: metadata.isUpgrade
            ,reserveCarryInKopecks
          },
          occurredAt: providerPayment.captured_at ?? providerPayment.created_at ?? now()
        }, onAuditError);
        await auditOrThrow(auditRepository, 'recordWalletEntries', {
          externalPaymentId: eventPaymentId,
          telegramUserId: metadata.telegramUserId,
          entries: walletEntriesForAllocations({
            externalPaymentId: eventPaymentId,
            telegramUserId: metadata.telegramUserId,
            allocations
          }),
          occurredAt: providerPayment.captured_at ?? providerPayment.created_at ?? now()
        }, onAuditError);
        await auditOrThrow(auditRepository, 'recordYooKassaPaymentConfirmation', {
          externalEventId: providerEventId,
          paymentId: eventPaymentId,
          amountKopecks,
          currency: 'RUB',
          event: event.event,
          status: providerPayment.status,
          confirmedAt: providerPayment.captured_at ?? providerPayment.created_at ?? now(),
          metadata: {
            productType: metadata.kind === 'plan' ? 'subscription' : 'metacoins',
            productId: metadata.productId,
            telegramUserId: metadata.telegramUserId
          }
        }, onAuditError);
      }
      if (result.status === 'duplicate') {
        await notify({
          telegramUserId: metadata.telegramUserId,
          telegramChatId: metadata.telegramChatId,
          message
        });
        await auditOrThrow(auditRepository, 'updatePaymentWebhookStatus', {
          providerEventId,
          status: 'processed'
        }, onAuditError);
        return Object.freeze({ status: 'duplicate' });
      }
      await notify({
        telegramUserId: metadata.telegramUserId,
        telegramChatId: metadata.telegramChatId,
        message
      });
      await auditOrThrow(auditRepository, 'updatePaymentWebhookStatus', {
        eventType: event.event,
        providerEventId,
        status: 'processed'
      }, onAuditError);
      return Object.freeze({ status: 'processed' });
    }
  });
}
