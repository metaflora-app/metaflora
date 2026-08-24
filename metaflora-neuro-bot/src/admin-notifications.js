function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function integer(value, fallback = 0) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : fallback;
}

function formatMetacoins(value) {
  return integer(value).toLocaleString('ru-RU');
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'дата окончания уточняется';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function navigation() {
  return {
    inline_keyboard: [
      [{ text: '👤 профиль', callback_data: 'task:profile' }],
      [{ text: '🏠 главное меню', callback_data: 'task:menu' }]
    ]
  };
}

export function buildAdminMetacoinAdjustmentMessage({
  delta,
  balanceAfter,
  reason = ''
} = {}) {
  const amount = Math.abs(integer(delta));
  const positive = integer(delta) >= 0;
  const action = positive ? 'начислены' : 'списаны';
  const icon = positive ? '🎁' : '🧾';
  const reasonLine = String(reason ?? '').trim()
    ? `\n\n<b>причина:</b> ${escapeHtml(String(reason).trim().slice(0, 500))}`
    : '';
  return {
    text: `${icon} <b>метакоины ${action}</b>\n\n${positive ? 'тебе добавили' : 'с баланса списали'} ${formatMetacoins(amount)} метакоинов.\n<b>теперь на балансе:</b> ${formatMetacoins(balanceAfter)} метакоинов.${reasonLine}\n\nизменение внесено командой МЕТАФЛОРА* нейро. спасибо!`,
    parse_mode: 'HTML',
    reply_markup: navigation()
  };
}

export function buildAdminSubscriptionMessage({
  planName,
  expiresAt,
  metacoins,
  balanceAfter,
  reason = ''
} = {}) {
  const reasonLine = String(reason ?? '').trim()
    ? `\n\n<b>причина:</b> ${escapeHtml(String(reason).trim().slice(0, 500))}`
    : '';
  return {
    text: `🎟 <b>тариф обновлён</b>\n\nтебе подключили тариф «${escapeHtml(planName || 'обновлённый')}».\n<b>действует до:</b> ${formatDate(expiresAt)}\n<b>начислено:</b> ${formatMetacoins(metacoins)} метакоинов\n<b>теперь на балансе:</b> ${formatMetacoins(balanceAfter)} метакоинов.${reasonLine}\n\nдоступ к платному каталогу уже открыт. спасибо!`,
    parse_mode: 'HTML',
    reply_markup: navigation()
  };
}

export function buildCrmUserNotificationMessage(notification = {}) {
  const payload = notification.payload && typeof notification.payload === 'object'
    ? notification.payload
    : {};
  if (notification.kind === 'metacoins_adjusted') {
    return buildAdminMetacoinAdjustmentMessage(payload);
  }
  if (notification.kind === 'subscription_changed') {
    return buildAdminSubscriptionMessage(payload);
  }
  throw new TypeError('Unknown CRM user notification kind.');
}
