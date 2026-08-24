import { buildCrmUserNotificationMessage } from './admin-notifications.js';

function payloadFor(notification) {
  const source = notification?.payload && typeof notification.payload === 'object'
    ? notification.payload
    : {};
  return Object.freeze({
    ...source,
    actionId: source.actionId ?? notification.id,
    telegramId: notification.telegramUserId
  });
}

export async function processCrmUserNotifications({
  repository,
  referralService,
  telegram,
  logger = () => {}
} = {}) {
  if (typeof repository?.claimCrmUserNotifications !== 'function') return 0;
  const notifications = await repository.claimCrmUserNotifications({ limit: 20 });
  let processed = 0;

  for (const notification of notifications) {
    try {
      const sourcePayload = payloadFor(notification);
      const applied = notification.kind === 'metacoins_adjusted'
        ? referralService.applyAdminMetacoinAdjustment(sourcePayload)
        : notification.kind === 'subscription_changed'
          ? referralService.applyAdminSubscription(sourcePayload)
          : (() => { throw new TypeError('Unknown CRM notification kind.'); })();
      const message = buildCrmUserNotificationMessage({
        kind: notification.kind,
        payload: Object.freeze({ ...sourcePayload, ...applied })
      });
      await telegram.sendMessage(notification.telegramUserId, message);
      await repository.markCrmUserNotificationSent(notification.id);
      processed += 1;
    } catch (error) {
      await repository.markCrmUserNotificationFailed(notification.id, error.message);
      logger(error, { action: 'crm_user_notification', notificationId: notification.id });
    }
  }

  return processed;
}
