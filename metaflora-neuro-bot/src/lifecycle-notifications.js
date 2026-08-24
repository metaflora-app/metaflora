const TELEGRAM_ID = /^[1-9]\d{0,19}$/u;
const PAYMENT_ID = /^[A-Za-z0-9_-]{1,128}$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const PAYMENT_SCENARIOS = new Set([
  'payment_abandoned_20m',
  'payment_abandoned_24h'
]);

function telegramId(value, label) {
  const normalized = String(value ?? '');
  if (!TELEGRAM_ID.test(normalized)) throw new TypeError(`${label} is invalid.`);
  return normalized;
}

function paymentId(value) {
  const normalized = String(value ?? '');
  if (!PAYMENT_ID.test(normalized)) throw new TypeError('payment id is invalid.');
  return normalized;
}

function notificationId(value) {
  const normalized = String(value ?? '');
  if (!UUID.test(normalized)) throw new TypeError('notification id is invalid.');
  return normalized;
}

function isoAt(date, milliseconds) {
  return new Date(date.getTime() + milliseconds).toISOString();
}

function navigationRows() {
  return [
    [{ text: '🧯 поддержка', callback_data: 'task:support' }],
    [
      { text: '👤 профиль', callback_data: 'task:profile' },
      { text: '🏠 главное меню', callback_data: 'task:menu' }
    ]
  ];
}

export function buildLifecycleNotificationMessage(scenario) {
  const definitions = {
    payment_abandoned_20m: {
      text: '💸 <b>оплата не завершилась</b>\n\nповторно ничего не списывали.\n\nесли банк отклонил платёж или страница закрылась, напиши в поддержку. разберём конкретно твой случай.',
      keyboard: navigationRows()
    },
    payment_abandoned_24h: {
      text: '💸 <b>оплата всё ещё не завершилась</b>\n\nесли с оплатой что-то мешает, напиши в поддержку. проверим платёж и подскажем, что сделать дальше.',
      keyboard: navigationRows()
    },
    newcomer_after_24h: {
      text: '<b>на тарифе «новичок» уже доступно:</b>\n\nбесплатные запросы к моделям для текста, изображений, видео, музыки и озвучки.\n\nвыбери нужный раздел в главном меню. в карточке сразу видны возможности модели и её стоимость.',
      keyboard: [
        [{ text: '👤 профиль', callback_data: 'task:profile' }],
        [{ text: '🏠 главное меню', callback_data: 'task:menu' }]
      ]
    }
  };
  const definition = definitions[scenario];
  if (!definition) throw new TypeError('Unknown lifecycle notification scenario.');
  return Object.freeze({
    text: definition.text,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: definition.keyboard }
  });
}

function result() {
  return { claimed: 0, sent: 0, cancelled: 0, failed: 0 };
}

export function createLifecycleNotificationService({
  repository,
  telegram,
  now = () => new Date(),
  onError = () => {}
} = {}) {
  if (!repository) throw new TypeError('Lifecycle notification repository is required.');
  if (!telegram?.sendMessage) throw new TypeError('Telegram client is required.');

  const schedulePaymentAbandonmentReminders = async ({
    paymentId: sourcePaymentId,
    telegramUserId,
    telegramChatId
  }) => {
    const current = now();
    if (Number.isNaN(current.valueOf())) throw new TypeError('clock returned an invalid date.');
    await repository.schedulePaymentAbandonmentReminders({
      paymentId: paymentId(sourcePaymentId),
      telegramUserId: telegramId(telegramUserId, 'telegram user id'),
      telegramChatId: telegramId(telegramChatId, 'telegram chat id'),
      firstDueAt: isoAt(current, 20 * 60 * 1_000),
      secondDueAt: isoAt(current, 24 * 60 * 60 * 1_000)
    });
  };

  const scheduleNewcomerReminder = async ({ telegramUserId, telegramChatId }) => {
    const current = now();
    if (Number.isNaN(current.valueOf())) throw new TypeError('clock returned an invalid date.');
    await repository.scheduleNewcomerReminder({
      telegramUserId: telegramId(telegramUserId, 'telegram user id'),
      telegramChatId: telegramId(telegramChatId, 'telegram chat id'),
      dueAt: isoAt(current, 24 * 60 * 60 * 1_000)
    });
  };

  const cancel = async (item, reason) => {
    await repository.cancelLifecycleNotification(notificationId(item.id), String(reason).slice(0, 500));
  };

  const processItem = async (item, totals) => {
    const id = notificationId(item.id);
    const scenario = String(item.scenario ?? '');
    const userId = telegramId(item.telegramUserId, 'telegram user id');
    const chatId = telegramId(item.telegramChatId, 'telegram chat id');

    if (PAYMENT_SCENARIOS.has(scenario)) {
      await cancel(item, 'payment_reminders_disabled');
      totals.cancelled += 1;
      return;
    } else if (scenario === 'newcomer_after_24h') {
      const eligibility = await repository.getNewcomerReminderEligibility({ telegramUserId: userId });
      if (!eligibility?.eligible) {
        await cancel(item, eligibility?.reason ?? 'not_eligible');
        totals.cancelled += 1;
        return;
      }
    } else {
      await cancel(item, 'unknown_scenario');
      totals.cancelled += 1;
      return;
    }

    // The delivery is deliberately marked first. A missed reminder is preferable to
    // a duplicate message if Telegram accepts the request but its response is lost.
    const marked = await repository.markLifecycleNotificationSent(id);
    if (!marked) {
      totals.cancelled += 1;
      return;
    }
    try {
      await telegram.sendMessage(
        chatId,
        buildLifecycleNotificationMessage(scenario)
      );
      totals.sent += 1;
    } catch (error) {
      await cancel(item, `delivery_failed: ${String(error?.message ?? error).slice(0, 450)}`);
      totals.failed += 1;
      onError(error, { action: 'lifecycle_notification_delivery', scenario, chatId });
    }
  };

  return Object.freeze({
    schedulePaymentAbandonmentReminders,
    scheduleNewcomerReminder,
    async runDueNotifications({ limit = 20 } = {}) {
      const rows = await repository.claimDueLifecycleNotifications({ limit });
      const totals = result();
      for (const item of rows ?? []) {
        totals.claimed += 1;
        try {
          await processItem(item, totals);
        } catch (error) {
          totals.failed += 1;
          onError(error, {
            action: 'lifecycle_notification_process',
            notificationId: item?.id ?? null,
            scenario: item?.scenario ?? null
          });
          try {
            await cancel(item, `processing_failed: ${String(error?.message ?? error).slice(0, 450)}`);
          } catch (cancelError) {
            onError(cancelError, {
              action: 'lifecycle_notification_cancel',
              notificationId: item?.id ?? null
            });
          }
        }
      }
      return Object.freeze(totals);
    }
  });
}
