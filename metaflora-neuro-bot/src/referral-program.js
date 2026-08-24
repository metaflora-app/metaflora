import { randomBytes } from 'node:crypto';

export const REFERRAL_LEVELS = Object.freeze([
  Object.freeze({ name: 'классика', minimumPaidReferrals: 0, percent: 25 }),
  Object.freeze({ name: 'серебро', minimumPaidReferrals: 3, percent: 30 }),
  Object.freeze({ name: 'золото', minimumPaidReferrals: 10, percent: 35 }),
  Object.freeze({ name: 'платина', minimumPaidReferrals: 25, percent: 40 })
]);

export const REFERRAL_BONUS_PERCENT = 25;
export const MINIMUM_WITHDRAWAL_KOPECKS = 100_000;
export const MINIMUM_OWNER_MARGIN_PERCENT = 30;
const validToken = /^[A-Za-z0-9_-]{8,24}$/;
const validCode = /^[A-Za-z0-9_-]{1,60}$/;

export function levelForPaidReferrals(count) {
  const safeCount = Number.isSafeInteger(count) && count >= 0 ? count : 0;
  const index = REFERRAL_LEVELS.findLastIndex(({ minimumPaidReferrals }) => safeCount >= minimumPaidReferrals);
  const current = REFERRAL_LEVELS[Math.max(index, 0)];
  const nextDefinition = REFERRAL_LEVELS[index + 1];
  return Object.freeze({
    ...current,
    next: nextDefinition
      ? Object.freeze({
          name: nextDefinition.name,
          minimumPaidReferrals: nextDefinition.minimumPaidReferrals,
          remaining: Math.max(0, nextDefinition.minimumPaidReferrals - safeCount)
        })
      : null
  });
}

export function generateReferralToken() {
  return randomBytes(9).toString('base64url');
}

function usernameSlug(username) {
  const value = typeof username === 'string' ? username.toLowerCase() : '';
  return /^[a-z0-9_]{5,32}$/.test(value) ? value.slice(0, 24) : 'user';
}

export function buildReferralCode({ username, randomToken = generateReferralToken() }) {
  if (!validToken.test(randomToken)) throw new TypeError('Invalid referral token.');
  const code = `${usernameSlug(username)}_${randomToken}`;
  if (!validCode.test(code)) throw new TypeError('Invalid referral code.');
  return code;
}

export function referralPayload(code) {
  if (!validCode.test(code)) throw new TypeError('Invalid referral code.');
  return `ref_${code}`;
}

export function parseReferralPayload(payload) {
  if (typeof payload !== 'string' || !payload.startsWith('ref_')) return null;
  const code = payload.slice(4);
  return validCode.test(code) ? code : null;
}

export function referralRewardKopecks(amountKopecks, percent) {
  if (!Number.isSafeInteger(amountKopecks) || amountKopecks <= 0) {
    throw new TypeError('Payment amount must be a positive integer.');
  }
  if (!Number.isSafeInteger(percent) || percent < 0 || percent > 100) {
    throw new TypeError('Referral percent is invalid.');
  }
  return Math.floor((amountKopecks * percent) / 100);
}

/**
 * Applies the public referral tier to the contribution left after the payment
 * fee and the API liability. The reward is capped before the owner's protected
 * share can fall below the configured floor. API liability must already
 * include any extra metacoins credited by referral bonuses.
 */
export function referralPurchaseEconomics({
  amountKopecks,
  paymentFeeKopecks,
  apiLiabilityKopecks,
  percent,
  minimumOwnerMarginPercent = MINIMUM_OWNER_MARGIN_PERCENT
}) {
  if (!Number.isSafeInteger(amountKopecks) || amountKopecks <= 0) {
    throw new TypeError('Payment amount must be a positive integer.');
  }
  for (const [label, value] of [
    ['Payment fee', paymentFeeKopecks],
    ['API liability', apiLiabilityKopecks]
  ]) {
    if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer.`);
  }
  if (!Number.isSafeInteger(percent) || percent < 0 || percent > 100) {
    throw new TypeError('Referral percent is invalid.');
  }
  if (!Number.isFinite(minimumOwnerMarginPercent)
    || minimumOwnerMarginPercent < 0
    || minimumOwnerMarginPercent > 100) {
    throw new TypeError('Owner margin percent is invalid.');
  }
  const contributionMarginKopecks = Math.max(
    0,
    amountKopecks - paymentFeeKopecks - apiLiabilityKopecks
  );
  const nominalRewardKopecks = Math.floor(contributionMarginKopecks * percent / 100);
  const minimumOwnerMarginKopecks = Math.ceil(amountKopecks * minimumOwnerMarginPercent / 100);
  const maximumRewardKopecks = Math.max(
    0,
    contributionMarginKopecks - minimumOwnerMarginKopecks
  );
  const rewardKopecks = Math.min(nominalRewardKopecks, maximumRewardKopecks);
  return Object.freeze({
    amountKopecks,
    contributionMarginKopecks,
    nominalRewardKopecks,
    maximumRewardKopecks,
    rewardKopecks,
    ownerMarginKopecks: contributionMarginKopecks - rewardKopecks,
    minimumOwnerMarginKopecks,
    percent,
    capped: rewardKopecks < nominalRewardKopecks
  });
}

export function metacoinBonus(baseMetacoins, percent = REFERRAL_BONUS_PERCENT) {
  if (!Number.isSafeInteger(baseMetacoins) || baseMetacoins < 0) {
    throw new TypeError('Metacoin amount must be a non-negative integer.');
  }
  return Math.floor((baseMetacoins * percent) / 100);
}
