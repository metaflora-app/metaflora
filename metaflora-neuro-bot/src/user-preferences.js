import { cycleSettingValue } from './settings-cycle.js';

const preferences = Object.freeze({
  language: Object.freeze({
    auto: 'автоматически',
    ru: 'русский',
    en: 'english'
  }),
  length: Object.freeze({
    brief: 'краткий',
    normal: 'обычный',
    detailed: 'подробный'
  }),
  reasoning: Object.freeze({
    quick: 'быстро',
    balanced: 'сбалансированно',
    deep: 'глубоко'
  }),
  reasoningSummary: Object.freeze({
    off: 'не показывать',
    brief: 'краткое'
  }),
  documents: Object.freeze({
    auto: 'по необходимости',
    always: 'учитывать все',
    off: 'не учитывать'
  })
});

const titles = Object.freeze({
  language: 'язык ответов',
  length: 'объём ответа',
  reasoning: 'глубина разбора',
  reasoningSummary: 'резюме ответа',
  documents: 'документы'
});

export function defaultUserPreferences() {
  return Object.freeze({
    language: 'auto',
    length: 'normal',
    reasoning: 'balanced',
    reasoningSummary: 'off',
    documents: 'auto'
  });
}

function normalize(source = {}) {
  const defaults = defaultUserPreferences();
  return Object.freeze(Object.fromEntries(
    Object.keys(preferences).map((key) => [
      key,
      preferences[key][source[key]] ? source[key] : defaults[key]
    ])
  ));
}

export function applyUserPreference(source, key, value) {
  const current = normalize(source);
  if (!preferences[key]?.[value]) return current;
  return Object.freeze({ ...current, [key]: value });
}

export function cycleUserPreference(source, key) {
  const current = normalize(source);
  const values = Object.keys(preferences[key] ?? {}).map((value) => ({ value }));
  if (values.length < 2) return current;
  return cycleSettingValue(current, {
    key,
    defaultValue: defaultUserPreferences()[key],
    values
  });
}

export function buildUserSettingsMessage(source, navigation = {}) {
  const current = normalize(source);
  const backData = navigation.backData ?? 'modelcat:llm';
  const backText = navigation.backText ?? '‹ назад к моделям';
  return {
    text: `⚙️ <b>настройки</b>\n\n<b>язык ответов:</b> ${preferences.language[current.language]}\n<b>объём ответа:</b> ${preferences.length[current.length]}\n<b>глубина разбора:</b> ${preferences.reasoning[current.reasoning]}\n<b>резюме ответа:</b> ${preferences.reasoningSummary[current.reasoningSummary]}\n<b>документы:</b> ${preferences.documents[current.documents]}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'изменить язык', callback_data: 'prefs:language' }],
        [{ text: 'изменить объём ответа', callback_data: 'prefs:length' }],
        [{ text: `глубина: ${preferences.reasoning[current.reasoning]}`, callback_data: 'prefcycle:reasoning' }],
        [{ text: `резюме: ${preferences.reasoningSummary[current.reasoningSummary]}`, callback_data: 'prefcycle:reasoningSummary' }],
        [{ text: `документы: ${preferences.documents[current.documents]}`, callback_data: 'prefcycle:documents' }],
        [{ text: '👤 профиль', callback_data: 'task:profile' }],
        [
          { text: backText, callback_data: backData },
          { text: '🏠 главное меню', callback_data: 'task:menu' }
        ]
      ]
    }
  };
}

export function buildUserPreferenceOptions(key, source) {
  const current = normalize(source);
  if (!preferences[key]) return buildUserSettingsMessage(current);
  return {
    text: `⚙️ <b>${titles[key]}</b>\n\nвыбери нужный вариант.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...Object.entries(preferences[key]).map(([value, label]) => [{
          text: `${current[key] === value ? '✓ ' : ''}${label}`,
          callback_data: `prefs:set:${key}:${value}`
        }]),
        [{ text: '‹ назад к настройкам', callback_data: 'task:settings' }],
        [{ text: '👤 профиль', callback_data: 'task:profile' }]
      ]
    }
  };
}

export function preferenceInstructions(source, options = {}) {
  const current = normalize(source);
  const instructions = [];
  if (current.language === 'ru') instructions.push('отвечай на русском языке.');
  if (current.language === 'en') instructions.push('answer in English.');
  if (!options.omitLength && current.length === 'brief') {
    instructions.push('отвечай кратко, оставляй только необходимое.');
  }
  if (!options.omitLength && current.length === 'detailed') {
    instructions.push('отвечай подробно и раскрывай существенные детали.');
  }
  if (current.reasoning === 'quick') instructions.push('дай быстрый практический разбор.');
  if (current.reasoning === 'deep') instructions.push('тщательно проверь допущения, риски и ограничения.');
  if (current.reasoningSummary === 'brief') {
    instructions.push('в конце дай краткое резюме вывода без внутреннего хода анализа.');
  }
  if (current.documents === 'always') instructions.push('учитывай все приложенные документы и ссылайся на них в выводах.');
  if (current.documents === 'off') instructions.push('не используй приложенные документы без прямой просьбы.');
  return instructions.join(' ');
}
