import {
  VOICE_LIBRARY_COUNT,
  getCuratedVoice,
  isVoiceLibraryReady,
  listCuratedVoices
} from './voice-library.js';
import { buildModelButton, metacoinHtml } from './brand-icons.js';
import { providerCostUsdToMetacoins } from './model-pricing.js';

const PAGE_SIZE = 8;
export const VOICE_TTS_METACOINS_PER_1000 = providerCostUsdToMetacoins(0.12);
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const navigationRows = (backData, backText = '‹ назад') => [
  [{ text: '👤 профиль', callback_data: 'task:profile' }],
  [
    { text: backText, callback_data: backData },
    { text: '🏠 главное меню', callback_data: 'task:menu' }
  ]
];

function unavailableMessage(profiles = []) {
  const ownedRows = ownedVoiceRows(Array.isArray(profiles) ? profiles : []);
  return {
    text: `<b>🎙️ библиотека голосов</b>\n\nкаталог готовых голосов временно недоступен.${ownedRows.length ? `\n\n<b>личные голоса: ${ownedRows.length}</b>` : ''}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...ownedRows,
        ...navigationRows('audiostudio:voice', '‹ назад к голосу')
      ]
    }
  };
}

const profileId = (value) => /^vp_[a-f0-9-]{36}$/u.test(String(value ?? ''))
  ? String(value)
  : null;

const ownedVoiceRows = (profiles) => profiles
  .filter((profile) => profileId(profile?.profileId))
  .slice(0, 10)
  .map((profile) => [{
    text: `🎤 ${String(profile.name ?? 'мой голос').slice(0, 48)}`,
    callback_data: `ownedvoice:${profile.profileId}`
  }]);

export function buildVoiceLibraryMessage({ page = 0, profiles = [] } = {}) {
  if (!isVoiceLibraryReady()) return unavailableMessage(profiles);

  const totalPages = Math.ceil(VOICE_LIBRARY_COUNT / PAGE_SIZE);
  const safePage = Math.min(totalPages - 1, Math.max(0, Number.parseInt(page, 10) || 0));
  const voices = listCuratedVoices({ offset: safePage * PAGE_SIZE, limit: PAGE_SIZE });
  const voiceRows = Array.from({ length: Math.ceil(voices.length / 2) }, (_, index) =>
    voices.slice(index * 2, index * 2 + 2).map((voice) => ({
      ...buildModelButton({
        id: voice.id,
        name: voice.name,
        brand: 'elevenlabs'
      }),
      callback_data: `voicecard:${voice.id}`
    }))
  );
  const pagination = [
    ...(safePage > 0 ? [{ text: '‹ назад', callback_data: `voicelib:${safePage - 1}` }] : []),
    { text: `${safePage + 1} из ${totalPages}`, callback_data: `voicelib:${safePage}` },
    ...(safePage < totalPages - 1 ? [{
      text: 'дальше ›',
      callback_data: `voicelib:${safePage + 1}`,
      style: 'primary'
    }] : [])
  ];
  const ownedRows = ownedVoiceRows(Array.isArray(profiles) ? profiles : []);
  return {
    text: `<b>🎙️ библиотека голосов</b>\n\nздесь ${VOICE_LIBRARY_COUNT} голосов с живыми превью — для роликов, рекламы, подкастов, обучения и аудиокниг.${ownedRows.length ? `\n\n<b>личные голоса: ${ownedRows.length}</b>` : ''}\n\nоткрой карточку, послушай подачу и выбери вариант под свою задачу.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...ownedRows,
        ...voiceRows,
        pagination,
        ...navigationRows('audiostudio:voice', '‹ назад к голосу')
      ]
    }
  };
}

export function buildOwnedVoiceCardMessage(profile) {
  const id = profileId(profile?.profileId);
  if (!id) return buildVoiceLibraryMessage();
  const name = escapeHtml(String(profile?.name ?? 'мой голос').slice(0, 80));
  return {
    text: `<b>🎤 ${name}</b>\n\nэто личный голос: он доступен только в твоём профиле. его можно прослушать, использовать для озвучки или удалить.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '▶️ прослушать', callback_data: `ownedvoicepreview:${id}` }],
        [{ text: '🎙 озвучить этим голосом', callback_data: `ownedvoiceuse:${id}` }],
        [{ text: '🗑 удалить голос', callback_data: `ownedvoicedeleteconfirm:${id}` }],
        ...navigationRows('voicelib:0', '‹ назад к голосам')
      ]
    }
  };
}

export function buildOwnedVoiceTextPrompt(profile) {
  const id = profileId(profile?.profileId);
  if (!id) return buildVoiceLibraryMessage();
  return {
    text: `<b>🎤 ${escapeHtml(String(profile?.name ?? 'мой голос').slice(0, 80))}</b>\n\nпришли текст одним сообщением. бот озвучит его твоим личным голосом и вернёт готовый MP3.\n\n<b>тариф: ${metacoinHtml()} ${VOICE_TTS_METACOINS_PER_1000} метакоинов за каждую начатую тысячу знаков</b>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: navigationRows(`ownedvoice:${id}`, '‹ назад к голосу')
    }
  };
}

export function buildOwnedVoiceDeleteMessage(profile) {
  const id = profileId(profile?.profileId);
  if (!id) return buildVoiceLibraryMessage();
  return {
    text: `<b>удалить «${escapeHtml(String(profile?.name ?? 'мой голос').slice(0, 80))}»?</b>\n\nголос исчезнет из личной библиотеки, а удаление у провайдера будет поставлено в защищённую очередь. отменить это действие нельзя.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'удалить навсегда', callback_data: `ownedvoicedelete:${id}`, style: 'danger' }],
        [{ text: 'отмена', callback_data: `ownedvoice:${id}` }]
      ]
    }
  };
}

function detailRows(voice) {
  const { labels } = voice;
  return [
    labels.language && `<b>язык:</b> ${escapeHtml(labels.language)}`,
    labels.accent && `<b>акцент:</b> ${escapeHtml(labels.accent)}`
  ].filter(Boolean);
}

export function buildVoiceCardMessage(voiceId) {
  const voice = getCuratedVoice(voiceId);
  if (!voice) return buildVoiceLibraryMessage();
  const index = listCuratedVoices().findIndex(({ id }) => id === voice.id);
  const page = Math.max(0, Math.floor(index / PAGE_SIZE));
  const description = voice.description || 'чистая естественная подача без лишней обработки';
  return {
    text: [
      `<b>🎙️ ${escapeHtml(voice.name)}</b>`,
      '',
      escapeHtml(description),
      '',
      ...detailRows(voice),
      '',
      'сначала послушай короткое превью. если подача подходит, выбери озвучку и пришли свой текст👇',
      '',
      `<b>озвучка: ${metacoinHtml()} ${VOICE_TTS_METACOINS_PER_1000} метакоинов за тысячу знаков</b>`
    ].join('\n'),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '▶️ прослушать', callback_data: `voicepreview:${voice.id}` }],
        [{ text: '🎙 озвучить этим голосом', callback_data: `voiceuse:${voice.id}` }],
        ...navigationRows(`voicelib:${page}`, '‹ назад к голосам')
      ]
    }
  };
}

export function calculateVoiceTtsPrice(text) {
  const characters = String(text ?? '').trim().length;
  return Math.max(
    VOICE_TTS_METACOINS_PER_1000,
    Math.ceil(characters / 1_000) * VOICE_TTS_METACOINS_PER_1000
  );
}

export function buildVoiceTextPrompt(voiceId) {
  const voice = getCuratedVoice(voiceId);
  if (!voice) return buildVoiceLibraryMessage();
  return {
    text: `<b>🎙️ ${escapeHtml(voice.name)}</b>\n\nпришли текст одним сообщением. бот сразу озвучит его выбранным голосом и вернёт готовый MP3.\n\n<b>тариф: ${metacoinHtml()} ${VOICE_TTS_METACOINS_PER_1000} метакоинов за каждую начатую тысячу знаков</b>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: navigationRows(`voicecard:${voice.id}`, '‹ назад к голосу')
    }
  };
}

export function buildVoiceEarlyAccessMessage(voiceId) {
  return buildVoiceCardMessage(voiceId);
}
