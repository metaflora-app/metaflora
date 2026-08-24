import assert from 'node:assert/strict';
import test from 'node:test';

import { decryptPayoutData, encryptPayoutData } from '../src/payout-crypto.js';

test('payout details are encrypted, round-trip, and do not contain plaintext', () => {
  const value = { method: 'bank_card', payoutToken: 'synonym.token-1234567890', last4: '1111' };
  const encrypted = encryptPayoutData(value, 'test-payout-encryption-key');

  assert.match(encrypted, /^v1:/u);
  assert.doesNotMatch(encrypted, /synonym|1111/u);
  assert.deepEqual(decryptPayoutData(encrypted, 'test-payout-encryption-key'), value);
});

test('payout details reject a wrong key or tampering', () => {
  const encrypted = encryptPayoutData({ method: 'sbp', phone: '79990000000' }, 'test-payout-encryption-key');

  assert.throws(
    () => decryptPayoutData(encrypted, 'wrong-key'),
    /decrypt|auth|invalid/i
  );
  assert.throws(
    () => decryptPayoutData(`${encrypted}x`, 'test-payout-encryption-key'),
    /decrypt|auth|invalid/i
  );
});
