import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REFERRAL_LEVELS,
  buildReferralCode,
  levelForPaidReferrals,
  parseReferralPayload,
  referralPayload,
  referralPurchaseEconomics
} from '../src/referral-program.js';

test('cash tier is applied to contribution margin while preserving at least 30 percent owner margin', () => {
  const classic = referralPurchaseEconomics({
    amountKopecks: 100_000,
    paymentFeeKopecks: 3_500,
    apiLiabilityKopecks: 46_500,
    percent: 25
  });
  const platinum = referralPurchaseEconomics({
    amountKopecks: 100_000,
    paymentFeeKopecks: 3_500,
    apiLiabilityKopecks: 46_500,
    percent: 40
  });

  assert.equal(classic.rewardKopecks, 12_500);
  assert.equal(classic.ownerMarginKopecks, 37_500);
  assert.equal(platinum.rewardKopecks, 20_000);
  assert.equal(platinum.ownerMarginKopecks, 30_000);
});

test('extra metacoin liability reduces reward before it can consume the owner floor', () => {
  const result = referralPurchaseEconomics({
    amountKopecks: 100_000,
    paymentFeeKopecks: 3_500,
    apiLiabilityKopecks: 55_000,
    percent: 40
  });

  assert.equal(result.nominalRewardKopecks, 16_600);
  assert.equal(result.rewardKopecks, 11_500);
  assert.equal(result.ownerMarginKopecks, 30_000);
  assert.equal(result.capped, true);
});

test('referral levels follow the approved paid-referral thresholds', () => {
  assert.deepEqual(REFERRAL_LEVELS.map(({ name, minimumPaidReferrals, percent }) => ({
    name,
    minimumPaidReferrals,
    percent
  })), [
    { name: 'классика', minimumPaidReferrals: 0, percent: 25 },
    { name: 'серебро', minimumPaidReferrals: 3, percent: 30 },
    { name: 'золото', minimumPaidReferrals: 10, percent: 35 },
    { name: 'платина', minimumPaidReferrals: 25, percent: 40 }
  ]);
  assert.equal(levelForPaidReferrals(2).name, 'классика');
  assert.equal(levelForPaidReferrals(3).name, 'серебро');
  assert.equal(levelForPaidReferrals(10).name, 'золото');
  assert.equal(levelForPaidReferrals(25).name, 'платина');
});

test('referral code contains a readable username and an opaque token without Telegram id', () => {
  const code = buildReferralCode({
    telegramId: '994500304',
    username: 'mishchenko_is',
    randomToken: 'K7m4Q2x9Qa12'
  });

  assert.equal(code, 'mishchenko_is_K7m4Q2x9Qa12');
  assert.doesNotMatch(code, /994500304/);
  assert.match(code, /^[A-Za-z0-9_-]{1,60}$/);
  assert.equal(referralPayload(code), `ref_${code}`);
  assert.equal(parseReferralPayload(`ref_${code}`), code);
});

test('long and invalid usernames are normalized within Telegram deep-link limit', () => {
  const code = buildReferralCode({
    telegramId: '42',
    username: 'Очень-длинный ник with spaces !!! abcdefghijklmnopqrstuvwxyz',
    randomToken: 'AbCdEf123456'
  });
  const payload = referralPayload(code);

  assert.ok(payload.length <= 64);
  assert.match(payload, /^[A-Za-z0-9_-]+$/);
  assert.match(code, /^user_/);
  assert.equal(parseReferralPayload('ref_bad payload'), null);
  assert.equal(parseReferralPayload('other_code'), null);
});
