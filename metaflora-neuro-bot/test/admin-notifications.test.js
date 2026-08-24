import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCrmUserNotificationMessage,
  buildAdminMetacoinAdjustmentMessage,
  buildAdminSubscriptionMessage
} from '../src/admin-notifications.js';

test('CRM metacoin grant message shows the new balance and keeps the reason safe', () => {
  const message = buildAdminMetacoinAdjustmentMessage({
    delta: 250,
    balanceAfter: 970,
    reason: 'компенсация <за задержку>'
  });

  assert.match(message.text, /^🎁 <b>метакоины начислены<\/b>/u);
  assert.match(message.text, /250 метакоинов/u);
  assert.match(message.text, /970 метакоинов/u);
  assert.match(message.text, /компенсация &lt;за задержку&gt;/u);
  assert.match(message.text, /спасибо/u);
});

test('CRM plan message reports manual access and expiration', () => {
  const message = buildAdminSubscriptionMessage({
    planName: 'автор',
    expiresAt: '2026-09-03T00:00:00.000Z',
    metacoins: 300,
    balanceAfter: 1_270,
    reason: 'компенсация за сбой'
  });

  assert.match(message.text, /^🎟 <b>тариф обновлён<\/b>/u);
  assert.match(message.text, /тариф «автор»/u);
  assert.match(message.text, /действует до/u);
  assert.match(message.text, /300 метакоинов/u);
  assert.match(message.text, /1\s?270 метакоинов/u);
});

test('outbox notification dispatch selects only the allowlisted notification kinds', () => {
  const message = buildCrmUserNotificationMessage({
    kind: 'metacoins_adjusted',
    payload: { delta: -20, balanceAfter: 80, reason: 'исправление' }
  });
  assert.match(message.text, /метакоины списаны/u);
  assert.throws(
    () => buildCrmUserNotificationMessage({ kind: 'unknown', payload: {} }),
    /CRM user notification kind/i
  );
});
