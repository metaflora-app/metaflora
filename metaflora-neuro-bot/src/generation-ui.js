function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

const CATEGORY_COPY = Object.freeze({
  llm: Object.freeze({ action: 'готовлю ответ', icon: '💬', done: 'ответ готов', defaultSeconds: 30 }),
  image: Object.freeze({ action: 'рисую изображение', icon: '✍️', done: 'изображение готово', defaultSeconds: 120 }),
  video: Object.freeze({ action: 'собираю видео', icon: '🎬', done: 'ролик готов', defaultSeconds: 300 }),
  audio: Object.freeze({ action: 'обрабатываю аудио', icon: '🎧', done: 'аудио готово', defaultSeconds: 180 }),
  music: Object.freeze({ action: 'собираю музыку', icon: '🎵', done: 'музыка готова', defaultSeconds: 180 }),
  voice: Object.freeze({ action: 'озвучиваю текст', icon: '🎙️', done: 'готовый MP3', defaultSeconds: 60 }),
  document: Object.freeze({ action: 'обрабатываю файл', icon: '📄', done: 'файл готов', defaultSeconds: 120 }),
  '3d': Object.freeze({ action: 'собираю 3D-модель', icon: '🧊', done: '3D-модель готова', defaultSeconds: 240 }),
  photo: Object.freeze({ action: 'обрабатываю изображение', icon: '🛠️', done: 'изображение готово', defaultSeconds: 120 }),
  tool: Object.freeze({ action: 'обрабатываю материал', icon: '🛠️', done: 'результат готов', defaultSeconds: 120 }),
  agent: Object.freeze({ action: 'разбираю задачу', icon: '🧠', done: 'ответ готов', defaultSeconds: 120 })
});

function copyFor(category) {
  return CATEGORY_COPY[category] ?? CATEGORY_COPY.tool;
}

function subjectLabel(category, subjectType) {
  if (subjectType === 'agent' || category === 'agent') return 'ИИ-агент';
  if (subjectType === 'tool' || category === 'tool') return 'ИИ-инструмент';
  return 'модель';
}

function operationFor(category, name, taskLabel) {
  const fallback = copyFor(category);
  const normalizedName = String(name ?? '').toLowerCase();
  if (typeof taskLabel === 'string' && taskLabel.trim()) {
    return Object.freeze({ action: taskLabel.trim(), icon: fallback.icon });
  }

  if (category === 'llm') {
    if (/(codex|code|код|developer|разработ)/u.test(normalizedName)) {
      return Object.freeze({ action: 'пишу и проверяю код', icon: '💻' });
    }
    if (/(search|research|researcher|sonar|поиск|исслед)/u.test(normalizedName)) {
      return Object.freeze({ action: 'ищу и проверяю источники', icon: '🔎' });
    }
    if (/(vision|vl|gemini|изображ|файл|document)/u.test(normalizedName)) {
      return Object.freeze({ action: 'разбираю материалы', icon: '🧩' });
    }
    return Object.freeze({ action: 'формулирую ответ', icon: '💬' });
  }

  if (category === 'image') {
    if (/(upscal|enhanc|качест)/u.test(normalizedName)) {
      return Object.freeze({ action: 'повышаю качество изображения', icon: '🔍' });
    }
    if (/(edit|remix|banana\s+pro|редакт|измен)/u.test(normalizedName)) {
      return Object.freeze({ action: 'редактирую изображение', icon: '🎨' });
    }
    return Object.freeze({ action: 'рисую изображение', icon: '✍️' });
  }

  if (category === 'video') {
    if (/(lip\s*sync|lipsync|говорящ|озвуч|синхрон)/u.test(normalizedName)) {
      return Object.freeze({ action: 'синхронизирую речь и видео', icon: '🎬' });
    }
    if (/(upscal|enhanc|качест)/u.test(normalizedName)) {
      return Object.freeze({ action: 'повышаю качество видео', icon: '🔍' });
    }
    if (/(image\s*to\s*video|animate|ожив|картин)/u.test(normalizedName)) {
      return Object.freeze({ action: 'оживляю изображение', icon: '🎞️' });
    }
    return Object.freeze({ action: 'собираю видео', icon: '🎬' });
  }

  if (category === 'audio' || category === 'music') {
    if (/(music|музык|suno|udio)/u.test(normalizedName)) {
      return Object.freeze({ action: 'собираю музыку', icon: '🎵' });
    }
    if (/(speech\s*to\s*text|stt|transcrib|расшифров)/u.test(normalizedName)) {
      return Object.freeze({ action: 'расшифровываю аудио', icon: '📝' });
    }
    if (/(clone|voice|голос)/u.test(normalizedName)) {
      return Object.freeze({ action: 'создаю голос', icon: '🗣️' });
    }
    if (/(stem|isolation|раздел)/u.test(normalizedName)) {
      return Object.freeze({ action: 'разделяю аудиодорожки', icon: '🎚️' });
    }
    return Object.freeze({ action: 'обрабатываю аудио', icon: '🎧' });
  }

  if (category === 'voice') {
    if (/(clone|voice\s*change|измен)/u.test(normalizedName)) {
      return Object.freeze({ action: 'меняю голос', icon: '🗣️' });
    }
    return Object.freeze({ action: 'озвучиваю текст', icon: '🎙️' });
  }

  if (category === 'document') {
    if (/(table|таблиц|spreadsheet)/u.test(normalizedName)) {
      return Object.freeze({ action: 'разбираю таблицу', icon: '📊' });
    }
    if (/(ocr|распозна|text)/u.test(normalizedName)) {
      return Object.freeze({ action: 'распознаю текст', icon: '🔎' });
    }
    return Object.freeze({ action: 'читаю документ', icon: '📄' });
  }

  if (category === '3d') {
    if (/(image|картин)/u.test(normalizedName)) {
      return Object.freeze({ action: 'собираю 3D-модель по изображению', icon: '🧊' });
    }
    return Object.freeze({ action: 'собираю 3D-модель', icon: '🧊' });
  }

  if (category === 'photo') {
    if (/(remove[_\s-]?bg|background|фон)/u.test(normalizedName)) {
      return Object.freeze({ action: 'убираю фон', icon: '🛠️' });
    }
    if (/(remove[_\s-]?object|object\s*remove|объект)/u.test(normalizedName)) {
      return Object.freeze({ action: 'удаляю объект', icon: '🧹' });
    }
    if (/(upscal|restore|face|восстанов|качеств)/u.test(normalizedName)) {
      return Object.freeze({ action: 'восстанавливаю изображение', icon: '🧽' });
    }
    if (/(ocr|распозна)/u.test(normalizedName)) {
      return Object.freeze({ action: 'читаю текст на изображении', icon: '🔎' });
    }
    return Object.freeze({ action: 'обрабатываю изображение', icon: '🛠️' });
  }

  if (category === 'agent') {
    if (/(research|fact|исслед|факт)/u.test(normalizedName)) {
      return Object.freeze({ action: 'проверяю источники', icon: '🔎' });
    }
    if (/(analyst|аналит)/u.test(normalizedName)) {
      return Object.freeze({ action: 'собираю выводы', icon: '📊' });
    }
    if (/(writer|copy|текст|редактор)/u.test(normalizedName)) {
      return Object.freeze({ action: 'готовлю текст', icon: '✍️' });
    }
    return Object.freeze({ action: 'разбираю задачу', icon: '🧠' });
  }

  return Object.freeze({ action: fallback.action, icon: fallback.icon });
}

function estimatedSecondsFor(category, name, estimatedSeconds) {
  if (Number.isSafeInteger(estimatedSeconds) && estimatedSeconds > 0) return estimatedSeconds;
  const copy = copyFor(category);
  const normalizedName = String(name ?? '').toLowerCase();
  if (category === 'image' && /nano\s+banana/u.test(normalizedName)) return 120;
  if (category === 'video' && /(minimax|seedance|kling|veo|sora)/u.test(normalizedName)) return 300;
  return copy.defaultSeconds;
}

function minuteWord(value) {
  if (value % 10 === 1 && value % 100 !== 11) return 'минута';
  if ([2, 3, 4].includes(value % 10) && ![12, 13, 14].includes(value % 100)) return 'минуты';
  return 'минут';
}

function formatEstimate(seconds) {
  const roundedSeconds = Math.max(10, Math.round(seconds / 10) * 10);
  if (roundedSeconds < 60) return `~${roundedSeconds} секунд`;
  const minutes = Math.max(1, Math.round(roundedSeconds / 60));
  return `~${minutes} ${minuteWord(minutes)}`;
}

function promptPreview(value) {
  const prompt = String(value ?? '').replace(/\s+/gu, ' ').trim();
  if (!prompt) return '';
  return prompt.length > 640 ? `${prompt.slice(0, 639).trimEnd()}…` : prompt;
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

export function buildGenerationStatusMessage({
  category,
  name,
  subjectType,
  taskLabel,
  estimatedSeconds
} = {}) {
  const copy = copyFor(category);
  const subject = subjectLabel(category, subjectType);
  const operation = operationFor(category, name, taskLabel);
  const estimate = formatEstimate(estimatedSecondsFor(category, name, estimatedSeconds));
  return Object.freeze({
    text: `<b>${subject}: ${escapeHtml(name)}</b>\n\n${operation.icon} ${escapeHtml(operation.action)} (~${estimate.replace(/^~/u, '')})`,
    parse_mode: 'HTML'
  });
}

export function buildGeneratedMediaCaption({ category, name, prompt, chargedMetacoins } = {}) {
  const copy = copyFor(category);
  const originalPrompt = promptPreview(prompt);
  const promptLine = originalPrompt
    ? `\n\n<b>исходный промпт:</b>\n${escapeHtml(originalPrompt)}`
    : '';
  const charged = Number.isSafeInteger(chargedMetacoins) && chargedMetacoins >= 0
    ? `\n\n<b>списано:</b> 🪙 ${chargedMetacoins.toLocaleString('ru-RU')} метакоинов`
    : '';
  return `<b>${copy.done}</b>\n${escapeHtml(name)}${promptLine}${charged}`;
}

export function buildGenerationResultRows({
  regenerateCallbackData,
  settingsCallbackData,
  newActionButton = null,
  downloadUrl
} = {}) {
  const rows = [];
  const trustedUrl = trustedDownloadUrl(downloadUrl);
  if (trustedUrl) rows.push([{ text: '🔗 прямая ссылка', url: trustedUrl }]);
  if (
    newActionButton
    && typeof newActionButton === 'object'
    && typeof newActionButton.text === 'string'
    && typeof newActionButton.callback_data === 'string'
  ) {
    rows.push([{
      text: newActionButton.text,
      callback_data: newActionButton.callback_data
    }]);
  }
  if (typeof regenerateCallbackData === 'string' && regenerateCallbackData) {
    rows.push([{ text: '🔁 перегенерировать', callback_data: regenerateCallbackData }]);
  }
  if (typeof settingsCallbackData === 'string' && settingsCallbackData) {
    rows.push([{ text: '⚙️ параметры', callback_data: settingsCallbackData }]);
  }
  return Object.freeze(rows.map((row) => Object.freeze(row.map((button) => Object.freeze(button)))));
}
