import { metacoinHtml } from './brand-icons.js';

const PAGE_SIZE = 6;

const KIND_LABELS = Object.freeze({
  text: 'текст',
  image: 'изображение',
  video: 'видео',
  audio: 'аудио',
  music: 'музыка',
  voice: 'озвучка',
  document: 'документ',
  '3d': '3D',
  tool: 'ИИ-инструмент',
  agent: 'ИИ-агент'
});

const KIND_ICONS = Object.freeze({
  text: '💬',
  image: '🖼',
  video: '🎬',
  audio: '🎧',
  music: '🎵',
  voice: '🎙',
  document: '📄',
  '3d': '🧊',
  tool: '🛠',
  agent: '🤖'
});

const STATUS_LABELS = Object.freeze({
  queued: 'в очереди',
  running: 'в работе',
  completed: 'готово',
  failed: 'не выполнено',
  cancelled: 'отменено',
  expired: 'срок хранения истёк'
});

const HISTORY_VARIANTS = Object.freeze({
  generation: Object.freeze({
    title: 'история генераций',
    prefix: 'genhist',
    empty: 'запусков пока нет. первая запись появится после обращения к модели, ИИ-инструменту или фото/видео-модели.',
    intro: 'здесь собраны готовые и незавершённые запуски. открой запись, чтобы вспомнить задачу, результат и списание.'
  }),
  task: Object.freeze({
    title: 'история задач',
    prefix: 'taskhist',
    empty: 'задач пока нет. первая запись появится после запуска ИИ-агента.',
    intro: 'здесь собраны задачи для ИИ-агентов. открой запись, чтобы вернуться к исходным данным и результату.'
  })
});

function historyVariant(value) {
  return HISTORY_VARIANTS[value] ?? HISTORY_VARIANTS.generation;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function safePage(value) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 0 ? page : 0;
}

function kindLabel(value) {
  return KIND_LABELS[value] ?? 'генерация';
}

function kindIcon(value) {
  return KIND_ICONS[value] ?? '✨';
}

function subjectLabel(item) {
  return String(item?.subjectLabel ?? item?.title ?? item?.subjectId ?? '')
    .replaceAll('_', ' ')
    .trim()
    .slice(0, 80);
}

function generationHeading(item) {
  const subject = subjectLabel(item);
  return `${kindLabel(item?.kind)}${subject ? ` · ${subject}` : ''}`;
}

function historyButtonLabel(item, absoluteIndex) {
  const subject = subjectLabel(item) || generationHeading(item);
  return `${subject} · ${absoluteIndex}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'дата не сохранилась';
  const day = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Moscow'
  }).format(date);
  const time = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow'
  }).format(date);
  return `${day}, ${time}`;
}

function statusLabel(value) {
  return STATUS_LABELS[value] ?? 'статус уточняется';
}

function outputLabel(item) {
  if (item.status === 'failed') return 'запуск не завершился, метакоины не списаны';
  if (item.status === 'cancelled') return 'запуск отменён';
  if (item.status !== 'completed') return 'результат ещё готовится';
  const output = {
    text: 'ответ сохранён в диалоге',
    image: 'изображение отправлено в чат',
    video: 'видео отправлено в чат',
    audio: 'аудиофайл отправлен в чат',
    music: 'музыка отправлена в чат',
    voice: 'MP3 отправлен в чат',
    document: 'файл отправлен в чат',
    '3d': '3D-файл отправлен в чат'
  };
  return output[item.outputType] ?? output[item.kind] ?? 'результат отправлен в чат';
}

function trustedDownloadUrl(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (/\/media\/[A-Za-z0-9_-]{32}$/u.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function resultUrlFor(item) {
  const metadata = item?.metadata;
  if (!metadata || typeof metadata !== 'object') return null;
  return trustedDownloadUrl(metadata.shortUrl ?? metadata.url ?? metadata.downloadUrl);
}

function navigationRows(backCallback = 'task:profile') {
  return [
    [{ text: '👤 профиль', callback_data: 'task:profile' }],
    [
      { text: '‹ назад', callback_data: backCallback },
      { text: '🏠 главное меню', callback_data: 'task:menu' }
    ]
  ];
}

function listEntry(item, index) {
  const cost = Number.isSafeInteger(item.metacoinsCharged) ? item.metacoinsCharged : 0;
  return `<b>${index + 1}. ${escapeHtml(generationHeading(item))}</b>\n`
    + `${escapeHtml(formatDateTime(item.createdAt))} · ${escapeHtml(statusLabel(item.status))}\n`
    + `списано: ${metacoinHtml()} ${cost.toLocaleString('ru-RU')} метакоинов`;
}

export function buildGenerationHistoryListMessage({
  items = [],
  page = 0,
  total = items.length,
  hasMore = false,
  historyType = 'generation'
} = {}) {
  const variant = historyVariant(historyType);
  const currentPage = safePage(page);
  const safeItems = Array.isArray(items) ? items.slice(0, PAGE_SIZE) : [];
  const body = safeItems.length
    ? `${variant.intro}\n\n${safeItems.map(listEntry).join('\n\n')}`
    : variant.empty;
  const itemRows = safeItems.map((item, index) => [{
    text: historyButtonLabel(item, currentPage * PAGE_SIZE + index + 1),
    callback_data: `${variant.prefix}:item:${item.id}:${currentPage}`
  }]);
  const pagination = [];
  if (currentPage > 0) {
    pagination.push({ text: '‹ раньше', callback_data: `${variant.prefix}:list:${currentPage - 1}` });
  }
  if (hasMore || (currentPage + 1) * PAGE_SIZE < Number(total)) {
    pagination.push({ text: 'дальше ›', callback_data: `${variant.prefix}:list:${currentPage + 1}` });
  }

  return {
    text: `🖌️ <b>${variant.title}</b>\n\n${body}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...itemRows,
        ...(pagination.length ? [pagination] : []),
        ...navigationRows('task:profile')
      ]
    }
  };
}

export function buildGenerationHistoryDetailMessage(item, { page = 0, historyType = 'generation' } = {}) {
  const variant = historyVariant(historyType);
  const cost = Number.isSafeInteger(item?.metacoinsCharged) ? item.metacoinsCharged : 0;
  const prompt = String(item?.prompt ?? item?.promptPreview ?? '')
    .trim()
    .slice(0, 1_200) || 'сообщение без текста';
  const actionRows = [];
  const resultUrl = resultUrlFor(item);
  if (resultUrl) actionRows.push([{ text: '🔗 прямая ссылка', url: resultUrl }]);
  if (
    historyType === 'generation'
    && item?.status === 'completed'
    && item?.kind !== 'text'
    && item?.kind !== 'agent'
  ) {
    actionRows.push([{ text: '🔁 перегенерировать', callback_data: `${variant.prefix}:repeat:${item.id}` }]);
  }
  return {
    text: `${kindIcon(item?.kind)} <b>${escapeHtml(generationHeading(item))}</b>\n\n`
      + `${escapeHtml(formatDateTime(item?.createdAt))}\n\n`
      + `<b>исходный промпт:</b>\n${escapeHtml(prompt)}\n\n`
      + `<b>статус:</b> ${escapeHtml(statusLabel(item?.status))}\n`
      + `<b>результат:</b> ${escapeHtml(outputLabel(item))}\n\n`
      + `<b>стоимость: ${metacoinHtml()} ${cost.toLocaleString('ru-RU')} метакоинов</b>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...actionRows,
        [{
          text: '‹ назад к истории',
          callback_data: `${variant.prefix}:list:${safePage(page)}`
        }],
        [{ text: '👤 профиль', callback_data: 'task:profile' }],
        [{ text: '🏠 главное меню', callback_data: 'task:menu' }]
      ]
    }
  };
}

export function buildGenerationHistoryUnavailableMessage({ historyType = 'generation' } = {}) {
  const variant = historyVariant(historyType);
  return {
    text: '<b>история временно не загрузилась</b>\n\nпопробуй открыть её ещё раз. баланс и сохранённые результаты от этой ошибки не меняются.',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'повторить', callback_data: `${variant.prefix}:list:0` }],
        ...navigationRows('task:profile')
      ]
    }
  };
}

export const GENERATION_HISTORY_PAGE_SIZE = PAGE_SIZE;
