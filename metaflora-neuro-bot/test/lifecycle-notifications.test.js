import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLifecycleNotificationMessage,
  createLifecycleNotificationService
} from '../src/lifecycle-notifications.js';

function notification(overrides = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    scenario: 'payment_abandoned_20m',
    telegramUserId: '123456789',
    telegramChatId: '123456789',
    paymentId: 'payment_1',
    ...overrides
  };
}

test('lifecycle copy keeps the selected scenarios short and uses existing navigation', () => {
  const failed = buildLifecycleNotificationMessage('payment_abandoned_20m');
  const later = buildLifecycleNotificationMessage('payment_abandoned_24h');
  const newcomer = buildLifecycleNotificationMessage('newcomer_after_24h');

  assert.match(failed.text, /<b>оплата не завершилась<\/b>/);
  assert.match(failed.text, /повторно ничего не списывали/);
  assert.match(later.text, /<b>оплата всё ещё не завершилась<\/b>/);
  assert.match(newcomer.text, /<b>на тарифе «новичок» уже доступно:<\/b>/);
  assert.match(newcomer.text, /текста, изображений, видео, музыки и озвучки/);

  for (const message of [failed, later, newcomer]) {
    const buttons = message.reply_markup.inline_keyboard.flat();
    assert.equal(message.parse_mode, 'HTML');
    assert.ok(buttons.some(({ callback_data }) => callback_data === 'task:menu'));
    assert.ok(buttons.every(({ text }) => !/^инструкция|помощник/i.test(text)));
    assert.doesNotMatch(message.text, /запуск/iu);
  }
});

test('legacy abandoned-payment cards point to support rather than another sales screen', () => {
  for (const scenario of ['payment_abandoned_20m', 'payment_abandoned_24h']) {
    const message = buildLifecycleNotificationMessage(scenario);
    const actions = message.reply_markup.inline_keyboard.flat();
    assert.ok(actions.some(
      ({ text, callback_data }) => text === '🧯 поддержка' && callback_data === 'task:support'
    ));
    assert.ok(!actions.some(({ callback_data }) => callback_data === 'billing:plans:profile'));
  }
});

test('newcomer reminder is scheduled once with a durable 24-hour due date', async () => {
  const calls = [];
  const service = createLifecycleNotificationService({
    repository: {
      async scheduleNewcomerReminder(value) { calls.push(value); }
    },
    telegram: { async sendMessage() {} },
    now: () => new Date('2026-07-27T10:00:00.000Z')
  });

  await service.scheduleNewcomerReminder({
    telegramUserId: '123456789',
    telegramChatId: '123456789'
  });

  assert.deepEqual(calls, [{
    telegramUserId: '123456789',
    telegramChatId: '123456789',
    dueAt: '2026-07-28T10:00:00.000Z'
  }]);
});

test('payment reminders replace older pending checkout reminders for the same user', async () => {
  const calls = [];
  const service = createLifecycleNotificationService({
    repository: {
      async schedulePaymentAbandonmentReminders(value) { calls.push(value); }
    },
    telegram: { async sendMessage() {} },
    now: () => new Date('2026-07-27T10:00:00.000Z')
  });

  await service.schedulePaymentAbandonmentReminders({
    paymentId: 'payment_123',
    telegramUserId: '123456789',
    telegramChatId: '123456789'
  });

  assert.deepEqual(calls, [{
    paymentId: 'payment_123',
    telegramUserId: '123456789',
    telegramChatId: '123456789',
    firstDueAt: '2026-07-27T10:20:00.000Z',
    secondDueAt: '2026-07-28T10:00:00.000Z'
  }]);
});

test('worker cancels legacy pending payment reminders instead of sending a second failure card', async () => {
  const events = [];
  const service = createLifecycleNotificationService({
    repository: {
      async claimDueLifecycleNotifications() {
        return [notification()];
      },
      async getPaymentRecord() { throw new Error('must not inspect disabled reminder'); },
      async markLifecycleNotificationSent() { throw new Error('must not send disabled reminder'); },
      async cancelLifecycleNotification(id, reason) { events.push(['cancelled', id, reason]); }
    },
    telegram: {
      async sendMessage() { throw new Error('must not send disabled reminder'); }
    }
  });

  const result = await service.runDueNotifications();

  assert.deepEqual(result, { claimed: 1, sent: 0, cancelled: 1, failed: 0 });
  assert.deepEqual(events, [[
    'cancelled',
    '11111111-1111-4111-8111-111111111111',
    'payment_reminders_disabled'
  ]]);
});

test('worker cancels a payment reminder after payment and newcomer reminder after a paid plan', async () => {
  const cancelled = [];
  const service = createLifecycleNotificationService({
    repository: {
      async claimDueLifecycleNotifications() {
        return [
          notification({ id: '11111111-1111-4111-8111-111111111111' }),
          notification({
            id: '22222222-2222-4222-8222-222222222222',
            scenario: 'newcomer_after_24h',
            paymentId: null
          })
        ];
      },
      async getPaymentRecord() { return { status: 'succeeded', telegramUserId: '123456789' }; },
      async getNewcomerReminderEligibility() { return { eligible: false, reason: 'paid_plan' }; },
      async markLifecycleNotificationSent() { throw new Error('must not send'); },
      async cancelLifecycleNotification(id, reason) { cancelled.push([id, reason]); }
    },
    telegram: { async sendMessage() { throw new Error('must not send'); } }
  });

  const result = await service.runDueNotifications();

  assert.deepEqual(result, { claimed: 2, sent: 0, cancelled: 2, failed: 0 });
  assert.deepEqual(cancelled, [
    ['11111111-1111-4111-8111-111111111111', 'payment_reminders_disabled'],
    ['22222222-2222-4222-8222-222222222222', 'paid_plan']
  ]);
});

test('worker never attempts Telegram delivery for a legacy payment reminder', async () => {
  const cancelled = [];
  const service = createLifecycleNotificationService({
    repository: {
      async claimDueLifecycleNotifications() { return [notification()]; },
      async getPaymentRecord() { throw new Error('must not inspect disabled reminder'); },
      async markLifecycleNotificationSent() { return true; },
      async cancelLifecycleNotification(id, reason) { cancelled.push([id, reason]); }
    },
    telegram: { async sendMessage() { throw new Error('must not send'); } }
  });

  const result = await service.runDueNotifications();

  assert.deepEqual(result, { claimed: 1, sent: 0, cancelled: 1, failed: 0 });
  assert.deepEqual(cancelled, [[
    '11111111-1111-4111-8111-111111111111',
    'payment_reminders_disabled'
  ]]);
});
