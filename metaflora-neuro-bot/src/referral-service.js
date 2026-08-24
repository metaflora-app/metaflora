import { randomUUID } from 'node:crypto';

import {
  MINIMUM_WITHDRAWAL_KOPECKS,
  REFERRAL_BONUS_PERCENT,
  buildReferralCode,
  generateReferralToken,
  levelForPaidReferrals,
  metacoinBonus,
  referralPayload,
  referralPurchaseEconomics
} from './referral-program.js';
import {
  getMetacoinPackage,
  getSubscriptionOffer,
  getSubscriptionPlan,
  isPaidSubscriptionActive
} from './billing-catalog.js';
import {
  METACOIN_BALANCE_CONTRACT,
  ReferralRepository
} from './referral-repository.js';
import { decryptPayoutData, encryptPayoutData } from './payout-crypto.js';

function safeUsername(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_]{5,32}$/.test(value) ? value : '';
}

function safeName(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80);
}

function validPaymentId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(value);
}

function isoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new TypeError('Invalid date.');
  return date.toISOString();
}

function addDays(iso, days) {
  return new Date(new Date(iso).valueOf() + days * 86_400_000).toISOString();
}

function validCard(number) {
  if (!/^\d{16,19}$/.test(number)) return false;
  let sum = 0;
  let double = false;
  for (let index = number.length - 1; index >= 0; index -= 1) {
    let digit = Number(number[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function payoutMethod(value, destination) {
  if (value === undefined || value === null || value === '') {
    const compact = String(destination ?? '').trim().replace(/[\s()-]/g, '');
    if (/^(?:\+7|7|8)\d{10}$/u.test(compact)) return 'sbp';
    if (validCard(compact)) return 'bank_card';
  }
  const method = String(value ?? '').trim();
  if (!['sbp', 'bank_card'].includes(method)) {
    throw new Error('реквизиты: доступны только выплаты на СБП или российскую банковскую карту.');
  }
  return method;
}

function payoutDestination(value, method) {
  const source = String(value ?? '').trim();
  const compact = source.replace(/[\s()-]/g, '');
  if (method === 'sbp' && /^(?:\+7|7|8)\d{10}$/u.test(compact)) return compact;
  if (method === 'bank_card' && validCard(compact)) return compact;
  throw new Error('Укажи корректные реквизиты для выбранного способа: телефон СБП или номер российской карты.');
}

function normalizePhone(value) {
  const compact = String(value ?? '').trim().replace(/[\s()-]/g, '');
  if (/^8\d{10}$/u.test(compact)) return `7${compact.slice(1)}`;
  if (/^\+7\d{10}$/u.test(compact)) return compact.slice(1);
  if (/^7\d{10}$/u.test(compact)) return compact;
  throw new Error('Укажи корректный номер телефона для СБП.');
}

function payoutToken(value) {
  const token = String(value ?? '').trim();
  if (!/^[A-Za-z0-9_.-]{16,256}$/u.test(token)) throw new Error('YooKassa не вернула безопасный токен карты.');
  return token;
}

function cardPart(value, length, label) {
  const part = String(value ?? '').trim();
  if (!new RegExp(`^\\d{${length}}$`, 'u').test(part)) throw new Error(`${label} карты не прошла проверку.`);
  return part;
}

function safeBankId(value) {
  const id = String(value ?? '').trim();
  if (!/^[A-Za-z0-9_-]{6,64}$/u.test(id)) throw new Error('YooKassa не вернула корректный банк СБП.');
  return id;
}

function safeBankName(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/gu, '').slice(0, 120);
}

function destinationHintFor(method, data) {
  if (method === 'bank_card') return `•••• ${data.last4}`;
  return `+7••• •••-${data.phone.slice(-4)}`;
}

export function createReferralService({
  databasePath = ':memory:',
  botUsername = 'neuro_metaflora_bot',
  now = () => new Date(),
  randomToken = generateReferralToken,
  holdDays = 3,
  payoutEncryptionKey = '',
  payoutSetupTtlMinutes = 15
} = {}) {
  if (!/^[A-Za-z0-9_]{5,32}$/.test(botUsername)) throw new TypeError('Invalid bot username.');
  if (!Number.isInteger(holdDays) || holdDays < 0 || holdDays > 90) throw new TypeError('Invalid hold period.');
  if (!Number.isInteger(payoutSetupTtlMinutes) || payoutSetupTtlMinutes < 5 || payoutSetupTtlMinutes > 60) {
    throw new TypeError('Invalid payout setup lifetime.');
  }
  const repository = new ReferralRepository(databasePath);
  const securePayoutKey = String(payoutEncryptionKey ?? '').trim();

  function registerUser(telegramUser) {
    const telegramId = String(telegramUser?.id ?? '');
    const username = safeUsername(telegramUser?.username);
    const firstName = safeName(telegramUser?.first_name);
    const timestamp = isoDate(now());
    const existing = repository.findUser(telegramId);
    if (existing) return repository.updateUser({ telegramId, username, firstName, now: timestamp });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const referralCode = buildReferralCode({
        username,
        randomToken: attempt === 0 ? randomToken() : generateReferralToken()
      });
      try {
        return repository.insertUser({
          telegramId,
          username,
          firstName,
          referralCode,
          now: timestamp
        });
      } catch (error) {
        if (!String(error.message).includes('UNIQUE constraint failed')) throw error;
      }
    }
    throw new Error('Could not create a unique referral code.');
  }

  function bindReferral(telegramId, referralCode) {
    const user = repository.findUser(telegramId);
    if (!user) throw new Error('User must be registered before referral binding.');
    if (user.referrerId) return Object.freeze({ status: 'already_bound', referrerId: user.referrerId });
    if (user.startedAt) return Object.freeze({ status: 'already_started' });
    const inviter = repository.findUserByReferralCode(referralCode);
    if (!inviter) return Object.freeze({ status: 'invalid_code' });
    if (inviter.telegramId === user.telegramId) return Object.freeze({ status: 'self_referral' });
    const bound = repository.bindReferrer({
      telegramId: user.telegramId,
      referrerId: inviter.telegramId,
      now: isoDate(now())
    });
    const latest = bound ? null : repository.findUser(user.telegramId);
    return Object.freeze({
      status: bound ? 'bound' : latest?.referrerId ? 'already_bound' : 'already_started',
      referrerId: bound ? inviter.telegramId : latest?.referrerId ?? null
    });
  }

  function processStart(telegramUser, referralCode = '') {
    const user = registerUser(telegramUser);
    return repository.transaction(() => {
      const current = repository.findUser(user.telegramId);
      if (current.startedAt) return Object.freeze({ status: 'already_started' });
      if (!referralCode) {
        repository.markStarted(user.telegramId, isoDate(now()));
        return Object.freeze({ status: 'started' });
      }
      const inviter = repository.findUserByReferralCode(referralCode);
      if (!inviter) {
        repository.markStarted(user.telegramId, isoDate(now()));
        return Object.freeze({ status: 'invalid_code' });
      }
      if (inviter.telegramId === user.telegramId) {
        repository.markStarted(user.telegramId, isoDate(now()));
        return Object.freeze({ status: 'self_referral' });
      }
      const timestamp = isoDate(now());
      const bound = repository.bindReferrer({
        telegramId: user.telegramId,
        referrerId: inviter.telegramId,
        now: timestamp
      });
      if (!bound) repository.markStarted(user.telegramId, timestamp);
      return Object.freeze({
        status: bound ? 'bound' : 'already_started',
        referrerId: bound ? inviter.telegramId : null
      });
    });
  }

  function referralUrl(telegramId) {
    const user = repository.findUser(telegramId);
    if (!user) throw new Error('Referral user not found.');
    return `https://t.me/${botUsername}?start=${referralPayload(user.referralCode)}`;
  }

  function recordPayment({
    paymentId,
    telegramId,
    amountKopecks,
    baseMetacoins,
    paymentFeeKopecks = Math.round(amountKopecks * 0.035),
    apiLiabilityKopecks = Math.round(amountKopecks * 0.465),
    confirmedAt = now()
  }) {
    if (!validPaymentId(paymentId)) throw new TypeError('Invalid payment id.');
    if (!Number.isSafeInteger(amountKopecks) || amountKopecks <= 0) throw new TypeError('Invalid payment amount.');
    if (!Number.isSafeInteger(baseMetacoins) || baseMetacoins < 0) throw new TypeError('Invalid metacoin amount.');
    const user = repository.findUser(telegramId);
    if (!user) throw new Error('Payment user is not registered.');
    return repository.transaction(() => {
      const timestamp = isoDate(confirmedAt);
      const existing = repository.payment(paymentId);
      if (existing) {
        const samePayload = existing.telegram_id === String(telegramId)
          && Number(existing.amount_kopecks) === amountKopecks
          && Number(existing.base_metacoins) === baseMetacoins
          && existing.confirmed_at === timestamp;
        if (!samePayload) throw new Error('Payment id collision with a different payload.');
        const bonusMetacoins = Number(existing.bonus_metacoins ?? 0);
        const earning = repository.paymentEarningDetails?.(paymentId);
        return Object.freeze({
          status: 'duplicate',
          paymentId,
          bonusMetacoins,
          friendBonusMetacoins: 0,
          inviterBonusMetacoins: bonusMetacoins,
          referralEarningKopecks: earning?.amountKopecks ?? repository.paymentEarning?.(paymentId) ?? 0,
          referralPercent: earning?.percent ?? 0
        });
      }
      const isFirstPayment = repository.paymentCount(user.telegramId) === 0;
      const availableBoost = repository.availableBoost(user.telegramId);
      const inviterBonusMetacoins = availableBoost
        ? metacoinBonus(baseMetacoins, availableBoost.percent)
        : 0;
      const friendBonusMetacoins = isFirstPayment && user.referrerId
        ? metacoinBonus(baseMetacoins)
        : 0;
      const totalBonusMetacoins = friendBonusMetacoins + inviterBonusMetacoins;

      repository.insertPayment({
        paymentId,
        telegramId: user.telegramId,
        amountKopecks,
        baseMetacoins,
        bonusMetacoins: totalBonusMetacoins,
        isFirstPayment,
        confirmedAt: timestamp
      });
      repository.addMetacoins(user.telegramId, baseMetacoins + totalBonusMetacoins);
      if (availableBoost) {
        repository.consumeBoost({ boostId: availableBoost.id, paymentId, now: timestamp });
      }

      let inviterBoostCreated = false;
      let referralEarningKopecks = 0;
      let referralPercent = 0;
      if (user.referrerId) {
        if (isFirstPayment) {
          repository.createBoost({
            telegramId: user.referrerId,
            sourceTelegramId: user.telegramId,
            sourcePaymentId: paymentId,
            percent: REFERRAL_BONUS_PERCENT,
            now: timestamp
          });
          inviterBoostCreated = true;
        }
        const paidReferrals = repository.paidReferralCount(user.referrerId);
        const level = levelForPaidReferrals(paidReferrals);
        referralPercent = level.percent;
        const economics = referralPurchaseEconomics({
          amountKopecks,
          paymentFeeKopecks,
          apiLiabilityKopecks,
          percent: referralPercent
        });
        referralEarningKopecks = economics.rewardKopecks;
        repository.createEarning({
          paymentId,
          partnerId: user.referrerId,
          referralId: user.telegramId,
          amountKopecks: referralEarningKopecks,
          percent: referralPercent,
          now: timestamp,
          availableAt: addDays(timestamp, holdDays)
        });
      }

      return Object.freeze({
        status: 'recorded',
        paymentId,
        bonusMetacoins: totalBonusMetacoins,
        friendBonusMetacoins,
        inviterBonusMetacoins,
        inviterBoostCreated,
        referralEarningKopecks,
        referralPercent,
        contributionMarginKopecks: user.referrerId
          ? Math.max(0, amountKopecks - paymentFeeKopecks - apiLiabilityKopecks)
          : 0
      });
    });
  }

  function previewPaymentBonuses({ telegramId, baseMetacoins }) {
    if (!Number.isSafeInteger(baseMetacoins) || baseMetacoins < 0) throw new TypeError('Invalid metacoin amount.');
    const user = repository.findUser(telegramId);
    if (!user) throw new Error('Payment user is not registered.');
    const isFirstPayment = repository.paymentCount(user.telegramId) === 0;
    const availableBoost = repository.availableBoost(user.telegramId);
    const inviterBonusMetacoins = availableBoost
      ? metacoinBonus(baseMetacoins, availableBoost.percent)
      : 0;
    const friendBonusMetacoins = isFirstPayment && user.referrerId
      ? metacoinBonus(baseMetacoins)
      : 0;
    return Object.freeze({
      isFirstPayment,
      friendBonusMetacoins,
      inviterBonusMetacoins,
      totalBonusMetacoins: friendBonusMetacoins + inviterBonusMetacoins
    });
  }

  function activateSubscription({
    paymentId,
    telegramId,
    planId,
    durationMonths,
    durationDays,
    priceKopecks,
    metacoins,
    creditedMetacoins = metacoins,
    remainingPlanMetacoinsBefore = 0,
    upgradeReservationId = null,
    paymentFeeKopecks = Math.round(priceKopecks * 0.035),
    apiLiabilityKopecks = Math.round(priceKopecks * 0.465),
    activatedAt = now()
  }) {
    if (!validPaymentId(paymentId)) throw new TypeError('Invalid payment id.');
    if (!/^[a-z][a-z0-9_]{1,31}$/u.test(String(planId))) throw new TypeError('Invalid plan id.');
    if (![1, 3].includes(durationMonths)) throw new TypeError('Invalid subscription duration.');
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 366) {
      throw new TypeError('Invalid subscription day count.');
    }
    if (!Number.isSafeInteger(priceKopecks) || priceKopecks <= 0) {
      throw new TypeError('Invalid subscription price.');
    }
    if (!Number.isSafeInteger(metacoins) || metacoins <= 0) {
      throw new TypeError('Invalid subscription metacoin amount.');
    }
    if (!Number.isSafeInteger(creditedMetacoins) || creditedMetacoins <= 0 || creditedMetacoins > metacoins) {
      throw new TypeError('Invalid credited subscription metacoin amount.');
    }
    if (!Number.isSafeInteger(remainingPlanMetacoinsBefore)
      || remainingPlanMetacoinsBefore < 0
      || remainingPlanMetacoinsBefore + creditedMetacoins !== metacoins) {
      throw new TypeError('Invalid subscription target-balance transition.');
    }
    const existing = repository.subscriptionPayment(paymentId);
    if (existing) {
      const samePayload = existing.telegram_id === String(telegramId)
        && existing.plan_id === planId
        && Number(existing.duration_months) === durationMonths
        && Number(existing.price_kopecks) === priceKopecks
        && Number(existing.metacoins) === metacoins
        && Number(existing.credited_metacoins ?? existing.metacoins) === creditedMetacoins
        && Number(existing.remaining_metacoins_before ?? 0) === remainingPlanMetacoinsBefore
        && existing.activated_at === isoDate(activatedAt);
      if (!samePayload) throw new Error('Subscription payment id collision with a different payload.');
      return Object.freeze({
        status: 'duplicate',
        paymentId,
        startsAt: existing.starts_at ?? existing.activated_at,
        expiresAt: existing.expires_at
      });
    }
    const account = repository.readAccount(telegramId);
    if (!account) throw new Error('Subscription user is not registered.');
    const timestamp = isoDate(activatedAt);
    if (account.subscriptionPlanId === planId && isPaidSubscriptionActive(account, timestamp)) {
      throw new Error('This subscription is already active.');
    }
    const currentExpiry = account.subscriptionPlanId === planId
      ? new Date(account.subscriptionExpiresAt ?? 0)
      : new Date(0);
    const startsAt = currentExpiry.valueOf() > new Date(timestamp).valueOf()
      ? currentExpiry.toISOString()
      : timestamp;
    const expiresAt = addDays(startsAt, durationDays);
    return repository.transaction(() => {
      const user = repository.findUser(telegramId);
      const isFirstPayment = repository.paymentCount(user.telegramId) === 0;
      const availableBoost = repository.availableBoost(user.telegramId);
      const inviterBonusMetacoins = availableBoost
        ? metacoinBonus(creditedMetacoins, availableBoost.percent)
        : 0;
      const friendBonusMetacoins = isFirstPayment && user.referrerId
        ? metacoinBonus(creditedMetacoins)
        : 0;
      const totalBonusMetacoins = friendBonusMetacoins + inviterBonusMetacoins;
      const activated = repository.activateSubscription({
        paymentId,
        telegramId,
        planId,
        durationMonths,
        priceKopecks,
        metacoins,
        creditedMetacoins,
        remainingPlanMetacoinsBefore,
        upgradeReservationId,
        activatedAt: timestamp,
        startsAt,
        expiresAt
      });
      repository.insertPayment({
        paymentId,
        telegramId: user.telegramId,
        amountKopecks: priceKopecks,
        baseMetacoins: creditedMetacoins,
        bonusMetacoins: totalBonusMetacoins,
        isFirstPayment,
        confirmedAt: timestamp
      });
      repository.addMetacoins(user.telegramId, totalBonusMetacoins);
      if (availableBoost) repository.consumeBoost({ boostId: availableBoost.id, paymentId, now: timestamp });

      let inviterBoostCreated = false;
      let referralEarningKopecks = 0;
      let referralPercent = 0;
      if (user.referrerId) {
        if (isFirstPayment) {
          repository.createBoost({
            telegramId: user.referrerId,
            sourceTelegramId: user.telegramId,
            sourcePaymentId: paymentId,
            percent: REFERRAL_BONUS_PERCENT,
            now: timestamp
          });
          inviterBoostCreated = true;
        }
        const level = levelForPaidReferrals(repository.paidReferralCount(user.referrerId));
        referralPercent = level.percent;
        referralEarningKopecks = referralPurchaseEconomics({
          amountKopecks: priceKopecks,
          paymentFeeKopecks,
          apiLiabilityKopecks,
          percent: referralPercent
        }).rewardKopecks;
        repository.createEarning({
          paymentId,
          partnerId: user.referrerId,
          referralId: user.telegramId,
          amountKopecks: referralEarningKopecks,
          percent: referralPercent,
          now: timestamp,
          availableAt: addDays(timestamp, holdDays)
        });
      }
      return Object.freeze({
        ...activated,
        bonusMetacoins: totalBonusMetacoins,
        friendBonusMetacoins,
        inviterBonusMetacoins,
        inviterBoostCreated,
        referralEarningKopecks,
        referralPercent
      });
    });
  }

  function fulfillCryptoEntitlement({
    orderId,
    telegramId,
    kind,
    productId,
    durationMonths = 1,
    durationDays = 0,
    metacoins,
    amountUsdcMicros,
    paymentRail,
    fundingProvider,
    confirmedAt
  }) {
    if (!/^mfc_[a-f0-9]{32}$/u.test(String(orderId))) throw new TypeError('Invalid crypto order id.');
    if (!Number.isSafeInteger(amountUsdcMicros) || amountUsdcMicros <= 0) {
      throw new TypeError('Invalid USDC amount.');
    }
    if (paymentRail !== 'crypto_usdc' || fundingProvider !== 'openrouter') {
      throw new TypeError('Invalid crypto entitlement provenance.');
    }
    const timestamp = isoDate(confirmedAt);
    let startsAt = null;
    let expiresAt = null;
    if (kind === 'package') {
      const item = getMetacoinPackage(productId);
      if (!item || durationMonths !== 1 || durationDays !== 0 || metacoins !== item.metacoins) {
        throw new Error('Crypto package snapshot does not match the catalog.');
      }
    } else if (kind === 'tariff') {
      const offer = getSubscriptionOffer(productId, durationMonths);
      if (!offer || durationDays !== offer.durationDays || metacoins !== offer.metacoins) {
        throw new Error('Crypto tariff snapshot does not match the catalog.');
      }
      const current = repository.readAccount(telegramId);
      if (!current) throw new Error('Crypto entitlement user is not registered.');
      if (!repository.cryptoEntitlement(orderId) && isPaidSubscriptionActive(current, timestamp)) {
        throw new Error('Crypto subscription upgrades and renewals are not supported.');
      }
      startsAt = timestamp;
      expiresAt = addDays(startsAt, durationDays);
    } else {
      throw new TypeError('Invalid crypto product kind.');
    }
    return repository.transaction(() => repository.fulfillCryptoEntitlement({
      orderId,
      telegramId,
      kind,
      productId,
      durationMonths,
      amountUsdcMicros,
      metacoins,
      paymentRail,
      fundingProvider,
      confirmedAt: timestamp,
      startsAt,
      expiresAt
    }));
  }

  function reservePlanUpgrade(value) {
    const normalized = {
      ...value,
      currentDurationMonths: value?.currentDurationMonths ?? value?.durationMonths
    };
    if (!/^[A-Za-z0-9_-]{1,128}$/u.test(String(value?.reservationId ?? ''))) {
      throw new TypeError('Invalid upgrade reservation id.');
    }
    if (!/^[a-z][a-z0-9_]{1,31}$/u.test(String(value?.fromPlanId ?? ''))
      || !/^[a-z][a-z0-9_]{1,31}$/u.test(String(value?.targetPlanId ?? ''))) {
      throw new TypeError('Invalid upgrade reservation plan.');
    }
    if (![1, 3].includes(normalized.durationMonths)
      || ![1, 3].includes(normalized.currentDurationMonths)
      || !Number.isSafeInteger(normalized.remainingPlanMetacoins)
      || normalized.remainingPlanMetacoins < 0) {
      throw new TypeError('Invalid upgrade reservation allowance.');
    }
    const timestamp = isoDate(now());
    return repository.transaction(() => repository.reservePlanUpgrade({
      ...normalized,
      now: timestamp,
      expiresAt: new Date(new Date(timestamp).valueOf() + 30 * 60 * 1000).toISOString()
    }));
  }

  function releasePlanUpgrade({ reservationId, telegramId }) {
    if (!/^[A-Za-z0-9_-]{1,128}$/u.test(String(reservationId ?? ''))) {
      throw new TypeError('Invalid upgrade reservation id.');
    }
    return repository.transaction(() => repository.releasePlanUpgrade({
      reservationId,
      telegramId,
      now: isoDate(now())
    }));
  }

  function releaseExpiredPlanUpgrades() {
    return repository.transaction(() => repository.releaseExpiredPlanUpgrades({ now: isoDate(now()) }));
  }

  function account(telegramId) {
    const stats = repository.readAccount(telegramId);
    if (!stats) throw new Error('Referral user not found.');
    return Object.freeze({
      ...stats,
      referralUrl: referralUrl(telegramId),
      level: levelForPaidReferrals(stats.paidReferrals)
    });
  }

  function prepareWithdrawal({ telegramId, amountKopecks, method, destination }) {
    if (!Number.isSafeInteger(amountKopecks) || amountKopecks < MINIMUM_WITHDRAWAL_KOPECKS) {
      throw new Error('Минимальная сумма вывода — 1 000 ₽.');
    }
    const payoutRoute = payoutMethod(method, destination);
    const safeDestination = payoutDestination(destination, payoutRoute);
    const destinationHint = payoutRoute === 'bank_card'
      ? `•••• ${safeDestination.slice(-4)}`
      : `+7••• •••-${safeDestination.slice(-4)}`;
    const encryptedDestination = securePayoutKey
      ? encryptPayoutData({
        method: payoutRoute,
        legacyDestination: safeDestination
      }, securePayoutKey)
      : null;

    return Object.freeze({
      withdrawalId: randomUUID(), telegramId: String(telegramId), amountKopecks,
      method: payoutRoute, destination: destinationHint, destinationHint,
      destinationEncrypted: encryptedDestination,
      payoutData: Object.freeze({ method: payoutRoute, legacyDestination: safeDestination }),
      payoutIdempotencyKey: `payout:${randomUUID()}`, now: isoDate(now())
    });
  }

  function commitWithdrawal(prepared) {
    return repository.transaction(() => {
      const { telegramId, amountKopecks } = prepared;
      const current = account(telegramId);
      if (amountKopecks > current.availableKopecks) throw new Error('На балансе недостаточно средств.');
      return repository.createWithdrawal(prepared);
    });
  }

  function requestWithdrawal(value) {
    return commitWithdrawal(prepareWithdrawal(value));
  }

  function createPayoutSetup({ telegramId, amountKopecks, method = 'sbp', expiresAt }) {
    if (!securePayoutKey) throw new Error('Автоматические выплаты ещё не включены.');
    if (!Number.isSafeInteger(amountKopecks) || amountKopecks < MINIMUM_WITHDRAWAL_KOPECKS) {
      throw new Error('Минимальная сумма вывода — 1 000 ₽.');
    }
    const payoutRoute = payoutMethod(method);
    const timestamp = isoDate(now());
    const expiry = expiresAt ? isoDate(expiresAt) : addDays(timestamp, payoutSetupTtlMinutes / (24 * 60));
    if (new Date(expiry).valueOf() <= new Date(timestamp).valueOf()) throw new Error('Ссылка для реквизитов уже истекла.');
    const current = account(telegramId);
    if (amountKopecks > current.availableKopecks) throw new Error('На балансе недостаточно средств.');
    const setupToken = randomUUID().replace(/-/gu, '');
    repository.createPayoutSetup({
      setupToken,
      telegramId,
      amountKopecks,
      method: payoutRoute,
      expiresAt: expiry,
      now: timestamp
    });
    return getPayoutSetup(setupToken);
  }

  function getPayoutSetup(setupToken) {
    const setup = repository.getPayoutSetup(setupToken);
    if (!setup) return null;
    return Object.freeze({
      setupToken: setup.setup_token,
      telegramId: setup.telegram_id,
      amountKopecks: Number(setup.amount_kopecks),
      method: setup.payout_method,
      status: setup.status,
      expiresAt: setup.expires_at
    });
  }

  function preparePayoutSetupCompletion({ setupToken, destinationData }) {
    if (!securePayoutKey) throw new Error('Автоматические выплаты ещё не включены.');
    const setup = repository.getPayoutSetup(setupToken);
    if (!setup) throw new Error('Ссылка для реквизитов не найдена.');
    const method = setup.payout_method;
    const data = method === 'bank_card'
      ? {
        method,
        payoutToken: payoutToken(destinationData?.payoutToken),
        first6: cardPart(destinationData?.first6, 6, 'Первые шесть цифр'),
        last4: cardPart(destinationData?.last4, 4, 'Последние четыре цифры'),
        issuerName: safeBankName(destinationData?.issuerName)
      }
      : {
        method,
        phone: normalizePhone(destinationData?.phone),
        bankId: safeBankId(destinationData?.bankId),
        bankName: safeBankName(destinationData?.bankName)
      };
    return Object.freeze({
      setupToken,
      withdrawalId: randomUUID(),
      telegramId: setup.telegram_id,
      amountKopecks: Number(setup.amount_kopecks),
      method,
      destinationHint: destinationHintFor(method, data),
      payoutData: Object.freeze({ ...data }),
      destinationEncrypted: encryptPayoutData(data, securePayoutKey),
      payoutIdempotencyKey: `payout:${randomUUID()}`,
      now: isoDate(now())
    });
  }

  function commitPayoutSetupCompletion(prepared) {
    return repository.transaction(() => {
      const current = account(prepared.telegramId);
      if (prepared.amountKopecks > current.availableKopecks) throw new Error('На балансе недостаточно средств.');
      const setup = repository.getPayoutSetup(prepared.setupToken);
      if (!setup || setup.telegram_id !== prepared.telegramId || Number(setup.amount_kopecks) !== prepared.amountKopecks) {
        throw new Error('Ссылка для реквизитов не найдена.');
      }
      const consumed = repository.consumePayoutSetup({ setupToken: prepared.setupToken, now: prepared.now });
      return repository.createWithdrawal({
        withdrawalId: prepared.withdrawalId,
        telegramId: consumed.telegram_id,
        amountKopecks: Number(consumed.amount_kopecks),
        method: prepared.method,
        destination: prepared.destinationHint,
        destinationHint: prepared.destinationHint,
        destinationEncrypted: prepared.destinationEncrypted,
        payoutIdempotencyKey: prepared.payoutIdempotencyKey,
        now: prepared.now
      });
    });
  }

  function completePayoutSetup(value) {
    return commitPayoutSetupCompletion(preparePayoutSetupCompletion(value));
  }

  function getWithdrawalPayoutData(withdrawalId) {
    if (!securePayoutKey) return null;
    const row = repository.getWithdrawalPayoutData(withdrawalId);
    if (!row?.destination_encrypted) return null;
    const data = decryptPayoutData(row.destination_encrypted, securePayoutKey);
    if (data.method === 'bank_card' && data.payoutToken) {
      return Object.freeze({ method: 'bank_card', payoutToken: data.payoutToken });
    }
    if (data.method === 'sbp' && data.phone && data.bankId) {
      return Object.freeze({ method: 'sbp', phone: data.phone, bankId: data.bankId });
    }
    return null;
  }

  function markWithdrawalPayoutAttempt(value) {
    return repository.transaction(() => repository.markWithdrawalPayoutAttempt(value));
  }

  function claimWithdrawalForPayout(value) {
    return repository.transaction(() => repository.claimWithdrawalForPayout(value));
  }

  function markWithdrawalPayoutSubmitted(value) {
    return repository.transaction(() => repository.markWithdrawalPayoutSubmitted(value));
  }

  function markWithdrawalPayoutResult(value) {
    return repository.transaction(() => repository.markWithdrawalPayoutResult(value));
  }

  function markWithdrawalForManualReview(value) {
    return repository.transaction(() => repository.markWithdrawalForManualReview(value));
  }

  function markWithdrawalPaid(withdrawalId) {
    return repository.transaction(() => repository.transitionWithdrawal({
      withdrawalId,
      status: 'paid',
      now: isoDate(now())
    }));
  }

  function rejectWithdrawal(withdrawalId) {
    return repository.transaction(() => repository.transitionWithdrawal({
      withdrawalId,
      status: 'rejected',
      now: isoDate(now())
    }));
  }

  function grantPromoMetacoins({ telegramId, promoCode, amount }) {
    if (!/^[A-Z0-9_-]{3,32}$/.test(String(promoCode))) throw new TypeError('Invalid promo code.');
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new TypeError('Invalid metacoin amount.');
    return repository.transaction(() => repository.grantPromoMetacoins({
      telegramId,
      promoCode,
      amount,
      now: isoDate(now())
    }));
  }

  function debitMetacoins({ telegramId, amount, requestKey }) {
    return repository.debitMetacoins({
      telegramId,
      amount,
      requestKey,
      now: isoDate(now())
    });
  }

  function reserveMetacoins({ telegramId, amount, requestKey }) {
    return repository.reserveMetacoins({
      telegramId,
      amount,
      requestKey,
      now: isoDate(now())
    });
  }

  function commitMetacoins({ telegramId, amount, requestKey }) {
    return repository.commitMetacoins({
      telegramId,
      amount,
      requestKey,
      now: isoDate(now())
    });
  }

  function releaseMetacoins({ telegramId, amount, requestKey }) {
    return repository.releaseMetacoins({
      telegramId,
      amount,
      requestKey,
      now: isoDate(now())
    });
  }

  function applyAdminMetacoinAdjustment({ actionId, telegramId, delta, reason = '', now: appliedAt = now() }) {
    if (!validPaymentId(actionId)) throw new TypeError('Invalid CRM action id.');
    if (!Number.isSafeInteger(delta) || delta === 0) throw new TypeError('Invalid CRM metacoin delta.');
    return repository.applyAdminMetacoinAdjustment({
      actionId,
      telegramId,
      delta,
      reason,
      now: isoDate(appliedAt)
    });
  }

  function applyAdminSubscription({
    actionId,
    telegramId,
    planId,
    durationMonths,
    metacoins,
    expiresAt,
    reason = '',
    now: appliedAt = now()
  }) {
    if (!validPaymentId(actionId)) throw new TypeError('Invalid CRM action id.');
    if (!Number.isInteger(durationMonths) || ![1, 3].includes(durationMonths)) {
      throw new TypeError('Invalid CRM subscription duration.');
    }
    if (!Number.isSafeInteger(metacoins) || metacoins < 0) {
      throw new TypeError('Invalid CRM subscription metacoins.');
    }
    return repository.applyAdminSubscription({
      actionId,
      telegramId,
      planId,
      durationMonths,
      metacoins,
      expiresAt: isoDate(expiresAt),
      reason,
      now: isoDate(appliedAt)
    });
  }

  return Object.freeze({
    balanceContract: METACOIN_BALANCE_CONTRACT,
    registerUser,
    bindReferral,
    processStart,
    markStarted: (telegramId) => repository.markStarted(telegramId, isoDate(now())),
    referralUrl,
    recordPayment,
    previewPaymentBonuses,
    activateSubscription,
    fulfillCryptoEntitlement,
    reservePlanUpgrade,
    releasePlanUpgrade,
    releaseExpiredPlanUpgrades,
    releaseDueEarnings: () => repository.releaseDueEarnings(isoDate(now())),
    requestWithdrawal,
    prepareWithdrawal,
    commitWithdrawal,
    createPayoutSetup,
    getPayoutSetup,
    completePayoutSetup,
    preparePayoutSetupCompletion,
    commitPayoutSetupCompletion,
    getWithdrawalPayoutData,
    markWithdrawalPayoutAttempt,
    claimWithdrawalForPayout,
    markWithdrawalPayoutSubmitted,
    markWithdrawalPayoutResult,
    markWithdrawalForManualReview,
    getWithdrawal: (withdrawalId) => repository.getWithdrawal(withdrawalId),
    listPendingWithdrawals: (limit) => repository.listPendingWithdrawals(limit),
    markWithdrawalPaid,
    rejectWithdrawal,
    grantPromoMetacoins,
    applyAdminMetacoinAdjustment,
    applyAdminSubscription,
    debitMetacoins,
    reserveMetacoins,
    commitMetacoins,
    releaseMetacoins,
    account,
    getUser: (telegramId) => repository.findUser(telegramId),
    listReferrals: (telegramId, limit) => repository.listReferrals(telegramId, limit),
    listEarnings: (telegramId, limit) => repository.listEarnings(telegramId, limit),
    close: () => repository.close()
  });
}
