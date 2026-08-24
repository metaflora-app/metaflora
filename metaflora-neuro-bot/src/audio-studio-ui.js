import {
  audioWorkflowCategories,
  getAudioWorkflowById,
  listAudioWorkflows
} from './audio-workflow-catalog.js';
import {
  buildAudioWorkflowCardText,
  formatAudioWorkflowPrice
} from './audio-workflow-cards.js';
import { buildModelButton, metacoinHtml } from './brand-icons.js';

const CATEGORY_KINDS = new Set(['music', 'voice']);
const WORKFLOW_BRANDS = Object.freeze({
  music_song: 'suno',
  music_instrumental: 'elevenlabs',
  music_video_score: 'sonilo',
  music_jingle: 'suno',
  music_loop: 'elevenlabs',
  music_hum_to_track: 'udio',
  music_extend: 'suno',
  music_rework: 'suno',
  music_remix: 'udio',
  music_mashup: 'suno',
  music_cover: 'suno',
  audio_stems: 'stability',
  audio_karaoke: 'stability',
  audio_master: 'stability',
  audio_scene_sfx: 'elevenlabs',
  voice_tts: 'elevenlabs',
  voice_longform: 'elevenlabs',
  voice_dialogue: 'elevenlabs',
  voice_ad: 'elevenlabs',
  voice_design: 'elevenlabs',
  voice_clone: 'elevenlabs',
  voice_change: 'elevenlabs',
  voice_dub_video: 'elevenlabs',
  voice_translate_preserve: 'elevenlabs',
  voice_replace_phrase: 'elevenlabs',
  voice_transcribe: 'openai',
  voice_meeting: 'assemblyai',
  voice_subtitles: 'openai',
  voice_cleanup: 'elevenlabs',
  voice_shorten: 'openai'
});

const navigationRows = (backData, backText = '‹ назад') => [
  [{ text: '👤 профиль', callback_data: 'task:profile' }],
  [
    { text: backText, callback_data: backData },
    { text: '🏠 главное меню', callback_data: 'task:menu' }
  ]
];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const categoryButton = (category) => ({
  text: `${category.customEmojiFallback} ${category.name}`,
  callback_data: `audiocategory:${category.id}`
});

const workflowButton = (workflow) => ({
  ...buildModelButton({
    id: workflow.id,
    name: workflow.name,
    brand: WORKFLOW_BRANDS[workflow.id]
  }),
  callback_data: `audioworkflow:${workflow.id}`
});

const rows = (items, columns = 2) =>
  Array.from({ length: Math.ceil(items.length / columns) }, (_, index) =>
    items.slice(index * columns, (index + 1) * columns)
  );

const formatParameterValue = (parameter) => {
  if (parameter.type === 'boolean') return parameter.default ? 'да' : 'нет';
  if (parameter.type === 'string') return parameter.default || 'не задано';
  return String(parameter.default);
};

export function buildAudioStudioHomeMessage() {
  return {
    text: '<b>🎧 музыка, голос и звук</b>\n\nздесь можно собрать песню или инструментал, подготовить звук к монтажу, озвучить текст, изменить голос, сделать дубляж и разобрать готовую запись. выбери направление, а дальше бот покажет подходящие сценарии и попросит только те исходники, которые действительно нужны.',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎵 музыка и звук', callback_data: 'audiostudio:music' },
          { text: '🎙️ голос и речь', callback_data: 'audiostudio:voice' }
        ],
        ...navigationRows('task:menu')
      ]
    }
  };
}

export function buildAudioStudioCategoryMessage(kindOrCategoryId) {
  if (CATEGORY_KINDS.has(kindOrCategoryId)) {
    const isMusic = kindOrCategoryId === 'music';
    const categories = audioWorkflowCategories.filter(({ kind }) => kind === kindOrCategoryId);
    const descriptions = categories.map(({ customEmojiFallback, name, description }) =>
      `${customEmojiFallback} <b>${escapeHtml(name)}</b>\n${escapeHtml(description)}`
    );
    return {
      text: `<b>${isMusic ? '🎵 музыка и звук' : '🎙️ голос и речь'}</b>\n\n${
        isMusic
          ? 'создай новую музыку, переделай готовую запись или доведи звук до финального файла.'
          : 'озвучь материал, создай или измени голос, переведи запись и подготовь речь к публикации.'
      }\n\n${descriptions.join('\n\n')}`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...rows(categories.map(categoryButton)),
          ...(!isMusic ? [[{
            text: '🎙️ библиотека голосов · 80',
            callback_data: 'voicelib:0'
          }]] : []),
          ...navigationRows(isMusic ? 'modelcat:audio' : 'modelcat:voice')
        ]
      }
    };
  }

  const category = audioWorkflowCategories.find(({ id }) => id === kindOrCategoryId);
  if (!category) return buildAudioStudioHomeMessage();
  const workflows = listAudioWorkflows({ categoryId: category.id });
  return {
    text: `<b>${category.customEmojiFallback} ${escapeHtml(category.name)}</b>\n\n${escapeHtml(category.description)}\n\nвыбери задачу: в карточке будут нужные исходники, настройки и стоимость до запуска.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...rows(workflows.map(workflowButton)),
        ...navigationRows(`audiostudio:${category.kind}`, '‹ назад к разделам')
      ]
    }
  };
}

export function buildAudioWorkflowMessage(workflowId) {
  const workflow = getAudioWorkflowById(workflowId);
  if (!workflow) return buildAudioStudioHomeMessage();
  return {
    text: buildAudioWorkflowCardText(workflow),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚙️ параметры', callback_data: `audiosettings:${workflow.id}` }],
        ...navigationRows(`audiocategory:${workflow.categoryId}`, '‹ назад к списку')
      ]
    }
  };
}

export function buildAudioWorkflowSettingsMessage(workflowId) {
  const workflow = getAudioWorkflowById(workflowId);
  if (!workflow) return buildAudioStudioHomeMessage();
  const fields = workflow.parameters.map((parameter) =>
    `<b>${escapeHtml(parameter.label)}:</b> ${escapeHtml(formatParameterValue(parameter))}`
  );
  return {
    text: `<b>⚙️ параметры · ${escapeHtml(workflow.name)}</b>\n\n${fields.join('\n')}\n\n<b>стоимость: ${metacoinHtml()} ${escapeHtml(formatAudioWorkflowPrice(workflow))}</b>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: navigationRows(
        `audioworkflow:${workflow.id}`,
        '‹ назад к карточке'
      )
    }
  };
}

export function buildAudioWorkflowSelectedMessage(workflowId) {
  const workflow = getAudioWorkflowById(workflowId);
  if (!workflow) return buildAudioStudioHomeMessage();
  return {
    text: `<b>${escapeHtml(workflow.customEmojiFallback)} ${escapeHtml(workflow.name)}</b>\n\n${escapeHtml(workflow.instruction)}👇\n\n<b>стоимость: ${metacoinHtml()} ${escapeHtml(formatAudioWorkflowPrice(workflow))}</b>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: navigationRows(
        `audioworkflow:${workflow.id}`,
        '‹ назад к карточке'
      )
    }
  };
}

export function buildAudioWorkflowEarlyAccessMessage(workflowId) {
  const workflow = getAudioWorkflowById(workflowId);
  if (!workflow) return buildAudioStudioHomeMessage();
  return {
    text: `<b>${escapeHtml(workflow.customEmojiFallback)} ${escapeHtml(workflow.name)}</b>\n\nэтот сценарий сейчас недоступен. запрос не отправлен, ${metacoinHtml()} метакоины не списаны.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: navigationRows(
        `audioworkflow:${workflow.id}`,
        '‹ назад к карточке'
      )
    }
  };
}

export function buildAudioDubConstructorMessage(draft = {}) {
  const voiceLabel = draft.voice?.type === 'profile'
    ? 'личный голос выбран'
    : draft.voice?.type === 'curated' ? 'готовый голос выбран' : 'не выбран';
  const sourceAudio = draft.sourceAudio ?? 'сохранить';
  const sourceMix = draft.sourceAudioMix ?? 25;
  const ready = Boolean(draft.voice);
  return {
    text: `<b>🎥 дубляж видео</b>\n\n<b>голос:</b> ${voiceLabel}\n<b>исходный звук:</b> ${escapeHtml(sourceAudio)}${sourceAudio === 'смешать' ? ` · ${sourceMix}%` : ''}\n\n${ready ? 'пришли видео MP4. следующим сообщением бот попросит код языка, например ru или en.' : 'сначала выбери готовый или личный голос.'}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎙 выбрать голос', callback_data: 'audiodub:voice' }],
        [{ text: `🔊 звук: ${sourceAudio}`, callback_data: 'audiodubset:cycle' }],
        ...(sourceAudio === 'смешать' ? [[
          { text: '−5%', callback_data: 'audiodubmix:down' },
          { text: `${sourceMix}%`, callback_data: 'audiodubmix:current' },
          { text: '+5%', callback_data: 'audiodubmix:up' }
        ]] : []),
        ...navigationRows('audioworkflow:voice_dub_video', '‹ назад к карточке')
      ]
    }
  };
}

export function buildAudioDubVoicePickerMessage(profiles = [], curatedVoices = []) {
  const owned = (Array.isArray(profiles) ? profiles : []).slice(0, 8).map((profile) => [{
    text: `🎤 ${String(profile.name ?? 'мой голос').slice(0, 42)}`,
    callback_data: `audiodubowned:${profile.profileId}`
  }]);
  const curated = rows((Array.isArray(curatedVoices) ? curatedVoices : []).slice(0, 8).map((voice) => ({
    text: `🎙 ${String(voice.name ?? 'голос').slice(0, 28)}`,
    callback_data: `audiodubvoice:${voice.id}`
  })));
  return {
    text: '<b>🎙 голос для дубляжа</b>\n\nвыбери личный голос ниже или открой готовые голоса. в готовой библиотеке кнопка выбора для дубляжа появится после возвращения сюда.',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...owned,
        ...curated,
        ...navigationRows('audiodub:home', '‹ назад к дубляжу')
      ]
    }
  };
}
