import assert from 'node:assert/strict';
import test from 'node:test';

import { processCrmUserNotifications } from '../src/crm-notification-worker.js';

const notificationId = '00000000-0000-4000-8000-000000000001';

test('CRM notification worker applies a change, sends the bot message and acknowledges it', async () => {
  const calls = [];
  const repository = {
    async claimCrmUserNotifications() {
      return [{
        id: notificationId,
        telegramUserId: '10',
        kind: 'metacoins_adjusted',
        payload: { actionId: 'crm-action-0001', delta: 50, reason: 'компенсация' }
      }];
    },
    async markCrmUserNotificationSent(id) { calls.push(['sent', id]); return true; },
    async markCrmUserNotificationFailed(id, error) { calls.push(['failed', id, error]); return true; }
  };
  const referralService = {
    applyAdminMetacoinAdjustment(payload) {
      calls.push(['apply', payload]);
      return { status: 'applied', actionId: payload.actionId, balanceAfter: 150 };
    }
  };
  const telegram = {
    async sendMessage(chatId, message) { calls.push(['send', chatId, message]); }
  };

  const processed = await processCrmUserNotifications({ repository, referralService, telegram });

  assert.equal(processed, 1);
  assert.equal(calls[0][0], 'apply');
  assert.equal(calls[1][0], 'send');
  assert.equal(calls[1][1], '10');
  assert.match(calls[1][2].text, /метакоины начислены/u);
  assert.deepEqual(calls[2], ['sent', notificationId]);
});

test('CRM notification worker returns failed items to the queue when application or delivery fails', async () => {
  const calls = [];
  const repository = {
    async claimCrmUserNotifications() {
      return [{
        id: notificationId,
        telegramUserId: '10',
        kind: 'subscription_changed',
        payload: { actionId: 'crm-plan-0001', planName: 'автор' }
      }];
    },
    async markCrmUserNotificationSent(id) { calls.push(['sent', id]); return true; },
    async markCrmUserNotificationFailed(id, error) { calls.push(['failed', id, error]); return true; }
  };
  const referralService = {
    applyAdminSubscription() { throw new Error('local account unavailable'); }
  };
  const telegram = { async sendMessage() { calls.push(['send']); } };

  const processed = await processCrmUserNotifications({ repository, referralService, telegram });

  assert.equal(processed, 0);
  assert.deepEqual(calls, [['failed', notificationId, 'local account unavailable']]);
});
