import { randomUUID } from 'node:crypto';

import { encryptPayoutData } from './payout-crypto.js';

function isoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new TypeError('Invalid date.');
  return date.toISOString();
}

function addDays(value, days) {
  const date = new Date(isoDate(value));
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString();
}

function integer(value, fallback = 0) {
  return Number.isSafeInteger(value) ? value : fallback;
}

function estimateReferralBonusLiability({
  apiLiabilityKopecks,
  baseMetacoins,
  bonusMetacoins
}) {
  const totalMetacoins = baseMetacoins + bonusMetacoins;
  if (totalMetacoins <= 0 || bonusMetacoins <= 0 || apiLiabilityKopecks <= 0) return 0;
  return Math.round(apiLiabilityKopecks * (bonusMetacoins / totalMetacoins));
}

export function createSupabaseBackedReferralService({
  service,
  repository,
  payoutEncryptionKey,
  holdDays = 14,
  onError
} = {}) {
  if (!service || !repository) throw new TypeError('Referral service and Supabase repository are required.');
  const encryptionKey = String(payoutEncryptionKey ?? '');

  async function mirrorEarning({
    args,
    result,
    amountKopecks,
    baseMetacoins,
    confirmedAt
  }) {
    if (!result || integer(result.referralEarningKopecks) <= 0) return;
    const referred = service.getUser?.(args.telegramId);
    if (!referred?.referrerId) return;

    const paymentFeeKopecks = integer(args.paymentFeeKopecks);
    const apiLiabilityKopecks = integer(args.apiLiabilityKopecks);
    const bonusMetacoins = integer(result.friendBonusMetacoins) + integer(result.inviterBonusMetacoins);
    const contributionAmountKopecks = Math.max(0, amountKopecks - paymentFeeKopecks - apiLiabilityKopecks);
    const rewardAmountKopecks = integer(result.referralEarningKopecks);

    await repository.recordEarning({
      paymentKey: args.paymentId,
      referrerTelegramId: referred.referrerId,
      referredTelegramId: referred.telegramId ?? String(args.telegramId),
      grossAmountKopecks: amountKopecks,
      paymentFeeKopecks,
      apiLiabilityKopecks,
      referralBonusLiabilityKopecks: estimateReferralBonusLiability({
        apiLiabilityKopecks,
        baseMetacoins,
        bonusMetacoins
      }),
      contributionAmountKopecks,
      rewardAmountKopecks,
      ownerRemainderKopecks: Math.max(0, contributionAmountKopecks - rewardAmountKopecks),
      inviteeBonusMetacoins: integer(result.friendBonusMetacoins),
      inviterBonusMetacoins: integer(result.inviterBonusMetacoins),
      percent: integer(result.referralPercent),
      availableAt: addDays(confirmedAt, holdDays),
      metadata: {
        source: 'telegram_payment_webhook',
        localStatus: result.status,
        baseMetacoins,
        totalBonusMetacoins: bonusMetacoins
      }
    });
  }

  async function mirrorRelation({ referredTelegramId, referrerTelegramId, referralCode }) {
    if (!referrerTelegramId) return;
    await repository.bindRelation({
      referredTelegramId,
      referrerTelegramId,
      referralCode: referralCode || 'unknown',
      referredAt: new Date()
    });
  }

  return Object.freeze({
    ...service,

    async bindReferral(telegramId, referralCode) {
      const result = service.bindReferral(telegramId, referralCode);
      if (result?.status === 'bound') {
        await mirrorRelation({
          referredTelegramId: telegramId,
          referrerTelegramId: result.referrerId,
          referralCode
        });
      }
      return result;
    },

    async processStart(telegramUser, referralCode = '') {
      const result = service.processStart(telegramUser, referralCode);
      if (result?.status === 'bound') {
        await mirrorRelation({
          referredTelegramId: telegramUser?.id,
          referrerTelegramId: result.referrerId,
          referralCode
        });
      }
      return result;
    },

    async recordPayment(args) {
      const result = service.recordPayment(args);
      await mirrorEarning({
        args,
        result,
        amountKopecks: args.amountKopecks,
        baseMetacoins: args.baseMetacoins,
        confirmedAt: args.confirmedAt ?? new Date()
      });
      return result;
    },

    async activateSubscription(args) {
      const result = service.activateSubscription(args);
      await mirrorEarning({
        args: {
          ...args,
          amountKopecks: args.priceKopecks,
          baseMetacoins: args.creditedMetacoins ?? args.metacoins
        },
        result,
        amountKopecks: args.priceKopecks,
        baseMetacoins: args.creditedMetacoins ?? args.metacoins,
        confirmedAt: args.activatedAt ?? new Date()
      });
      return result;
    },

    async account(telegramId) {
      const [local, authority] = await Promise.all([
        Promise.resolve(service.account(telegramId)),
        repository.readAccount(telegramId)
      ]);
      if (!authority) throw new Error('Supabase referral account is unavailable.');
      return Object.freeze({
        ...local,
        availableKopecks: integer(authority.available_kopecks),
        pendingKopecks: integer(authority.pending_kopecks),
        reservedKopecks: integer(authority.reserved_kopecks),
        lifetimeKopecks: integer(authority.lifetime_kopecks)
      });
    },

    async listReferrals(telegramId, limit) {
      return await repository.listReferrals(telegramId, limit);
    },

    async listEarnings(telegramId, limit) {
      return await repository.listEarnings(telegramId, limit);
    },

    async releaseDueEarnings() {
      return await repository.releaseDueEarnings();
    },

    async getPartnerOnboarding(telegramId) {
      return await repository.getPartnerOnboarding(telegramId);
    },

    async acceptPartnerOffer(value) {
      return await repository.acceptPartnerOffer(value);
    },

    async recordPartnerOfferOpen(value) {
      return await repository.recordPartnerOfferOpen(value);
    },

    async upsertPartnerProfile(value) {
      return await repository.upsertPartnerProfile(value);
    },

    async completePayoutSetup({ setupToken, destinationData }) {
      if (encryptionKey.length < 16) throw new Error('Payout encryption is unavailable.');
      const prepared = service.preparePayoutSetupCompletion({ setupToken, destinationData });
      if (prepared?.method === 'sbp') {
        const payoutData = prepared.payoutData;
        if (!payoutData?.phone || !payoutData?.bankId) throw new Error('SBP payout destination is unavailable.');
        await repository.reserveWithdrawal({
          withdrawalId: prepared.withdrawalId,
          telegramId: prepared.telegramId,
          amountKopecks: prepared.amountKopecks,
          payoutMethod: 'sbp',
          destinationEncrypted: encryptPayoutData(payoutData, encryptionKey),
          destinationHint: prepared.destinationHint,
          idempotencyKey: prepared.payoutIdempotencyKey ?? `payout:${prepared.withdrawalId || randomUUID()}`
        });
      }
      return service.commitPayoutSetupCompletion(prepared);
    },

    async requestWithdrawal(value) {
      if (encryptionKey.length < 16) throw new Error('Payout encryption is unavailable.');
      const prepared = service.prepareWithdrawal(value);
      await repository.reserveWithdrawal({
        withdrawalId: prepared.withdrawalId,
        telegramId: prepared.telegramId,
        amountKopecks: prepared.amountKopecks,
        payoutMethod: prepared.method,
        destinationEncrypted: encryptPayoutData(prepared.payoutData, encryptionKey),
        destinationHint: prepared.destinationHint,
        idempotencyKey: prepared.payoutIdempotencyKey
      });
      return service.commitWithdrawal(prepared);
    }
  });
}
