import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createReferralOfferTrackingUrl,
  verifyReferralOfferTrackingToken
} from '../src/referral-offer-tracking.js';

test('partner offer tracking token is signed, bounded and bound to user and version', () => {
  const secret = 's'.repeat(48);
  const url = createReferralOfferTrackingUrl({
    publicBaseUrl: 'https://bot.example.test',
    secret,
    telegramId: 42,
    offerVersion: 'partner-program-2026-08-14',
    expiresAt: new Date('2026-08-15T00:00:00.000Z')
  });
  const token = new URL(url).pathname.split('/').at(-1);
  assert.deepEqual(verifyReferralOfferTrackingToken({
    token,
    secret,
    now: new Date('2026-08-14T12:00:00.000Z')
  }), {
    telegramId: '42',
    offerVersion: 'partner-program-2026-08-14',
    expiresAt: '2026-08-15T00:00:00.000Z'
  });
  assert.throws(() => verifyReferralOfferTrackingToken({
    token: `${token.slice(0, -1)}x`,
    secret,
    now: new Date('2026-08-14T12:00:00.000Z')
  }), /Invalid partner offer tracking token/u);
});
