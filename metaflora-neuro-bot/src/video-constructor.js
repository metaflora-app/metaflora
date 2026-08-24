import {
  buildModelCard,
  calculateModelMetacoinPrice,
  defaultModelSettings,
  inputProfileForModel
} from './model-catalog.js';
import { metacoinHtml } from './brand-icons.js';
import { cardProfileFor, inputContractFor } from './model-profiles.js';

export const VIDEO_CONSTRUCTOR_MODES = Object.freeze({
  text_to_video: Object.freeze({ label: 'текст → видео', icon: '✍️' }),
  first_frame: Object.freeze({ label: 'кадр → видео', icon: '🖼' }),
  references: Object.freeze({ label: 'референсы → видео', icon: '🎞' }),
  extend: Object.freeze({ label: 'продолжить клип', icon: '⏭' })
});

const MIN_IMAGE_SIDE = 300;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const MAX_SOURCE_DURATION_SECONDS = 600;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function frozenDraft(value) {
  return Object.freeze({
    ...value,
    settings: Object.freeze({ ...(value.settings ?? {}) }),
    slots: Object.freeze({
      firstFrame: value.slots?.firstFrame ?? null,
      lastFrame: value.slots?.lastFrame ?? null,
      sourceVideo: value.slots?.sourceVideo ?? null,
      references: Object.freeze([...(value.slots?.references ?? [])])
    })
  });
}

export function modesForVideoModel(model) {
  if (model?.category !== 'video' || model.availability !== 'available') return [];
  if (model.source === 'tool') {
    return {
      video_generate: ['text_to_video'],
      video_image_to_video: ['first_frame'],
      video_extend: ['extend']
    }[model.id] ?? [];
  }
  const inputs = new Set(cardProfileFor(model).inputs ?? []);
  const contract = inputContractFor(model) ?? {};
  const modes = [];
  if (inputs.has('text')) modes.push('text_to_video');
  if (inputs.has('image')) modes.push('first_frame');
  if (Array.isArray(contract.referenceKinds) && contract.referenceKinds.length > 0) {
    modes.push('references');
  }
  return modes;
}

export function createVideoConstructorDraft(model, settings = defaultModelSettings(model)) {
  const modes = modesForVideoModel(model);
  if (modes.length === 0) throw new TypeError('Video model does not support constructor modes.');
  return frozenDraft({
    modelId: model.id,
    mode: modes[0],
    prompt: '',
    settings,
    slots: { firstFrame: null, lastFrame: null, sourceVideo: null, references: [] },
    error: null
  });
}

export function setVideoConstructorMode(draft, mode, model = null) {
  if (!Object.hasOwn(VIDEO_CONSTRUCTOR_MODES, mode)) return draft;
  if (model && !modesForVideoModel(model).includes(mode)) return draft;
  const nextSlots = {
    text_to_video: { firstFrame: null, lastFrame: null, sourceVideo: null, references: [] },
    first_frame: {
      firstFrame: draft.slots?.firstFrame ?? null,
      lastFrame: draft.slots?.lastFrame ?? null,
      sourceVideo: null,
      references: []
    },
    references: {
      firstFrame: null,
      lastFrame: null,
      sourceVideo: null,
      references: draft.slots?.references ?? []
    },
    extend: {
      firstFrame: null,
      lastFrame: null,
      sourceVideo: draft.slots?.sourceVideo ?? null,
      references: []
    }
  }[mode];
  return frozenDraft({ ...draft, mode, slots: nextSlots, error: null });
}

export function setVideoConstructorPrompt(draft, prompt) {
  const normalized = String(prompt ?? '').trim().slice(0, 12_000);
  return frozenDraft({ ...draft, prompt: normalized, error: null });
}

export function clearVideoConstructorPrompt(draft) {
  return setVideoConstructorPrompt(draft, '');
}

function videoModelSupportsPrompt(model) {
  if (model?.source === 'tool') return modesForVideoModel(model).length > 0;
  return new Set(cardProfileFor(model).inputs ?? []).has('text');
}

function promptDeleteRows(draft, model) {
  return draft.prompt && videoModelSupportsPrompt(model)
    ? [[{ text: '🗑 удалить промпт', callback_data: 'video:prompt:delete', style: 'danger' }]]
    : [];
}

export function cycleVideoConstructorSetting(draft, model, key) {
  const definition = inputProfileForModel(model).find((field) => field.key === key);
  if (!definition?.values?.length) return draft;
  const values = definition.values.map(({ value }) => String(value));
  const current = String(draft.settings?.[key] ?? definition.defaultValue);
  const currentIndex = values.indexOf(current);
  const nextValue = values[(currentIndex + 1 + values.length) % values.length];
  return frozenDraft({
    ...draft,
    settings: { ...draft.settings, [key]: nextValue },
    error: null
  });
}

export function setVideoConstructorSetting(draft, model, key, value) {
  const definition = inputProfileForModel(model).find((field) => field.key === key);
  const normalized = String(value ?? '');
  if (!definition?.values?.some((option) => String(option.value) === normalized)) return draft;
  return frozenDraft({
    ...draft,
    settings: { ...draft.settings, [key]: normalized },
    error: null
  });
}

export function resetVideoConstructorSettings(draft, model) {
  return frozenDraft({
    ...draft,
    settings: defaultModelSettings(model),
    error: null
  });
}

function invalidUpload(code, message, draft) {
  return Object.freeze({
    draft,
    error: Object.freeze({ code, message })
  });
}

export function addVideoConstructorUpload(draft, upload, model = null) {
  if (!upload || !['image', 'video', 'audio'].includes(upload.kind) || !upload.fileId) {
    return invalidUpload('unsupported_upload', 'этот файл не подходит для выбранного режима.', draft);
  }
  const fileSize = Number(upload.fileSize ?? 0);
  const maximumBytes = upload.kind === 'image' ? MAX_IMAGE_BYTES : MAX_MEDIA_BYTES;
  if (fileSize && (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > maximumBytes)) {
    return invalidUpload('file_size', 'файл слишком большой для безопасной обработки.', draft);
  }
  if (upload.kind !== 'image') {
    const duration = Number(upload.duration ?? 0);
    if (duration && (!Number.isFinite(duration) || duration < 0 || duration > MAX_SOURCE_DURATION_SECONDS)) {
      return invalidUpload('media_duration', 'запись слишком длинная для этого конструктора.', draft);
    }
  }
  if (
    upload.kind === 'image'
    && (!Number.isFinite(Number(upload.width)) || !Number.isFinite(Number(upload.height))
      || Number(upload.width) < MIN_IMAGE_SIDE || Number(upload.height) < MIN_IMAGE_SIDE)
  ) {
    return invalidUpload(
      'image_dimensions',
      `изображение слишком маленькое. минимум ${MIN_IMAGE_SIDE}×${MIN_IMAGE_SIDE} пикселей.`,
      draft
    );
  }

  if (draft.mode === 'first_frame') {
    if (upload.kind !== 'image') {
      return invalidUpload('expected_image', 'для этого режима нужен первый кадр — изображение.', draft);
    }
    const maximumImages = model?.id === 'seedance_25'
      ? 2
      : inputContractFor(model)?.maximum?.image ?? 1;
    if (draft.slots.firstFrame && draft.slots.lastFrame) {
      return invalidUpload('image_limit', 'первый и последний кадры уже добавлены.', draft);
    }
    if (draft.slots.firstFrame && maximumImages < 2) {
      return invalidUpload('image_limit', 'эта модель принимает только один исходный кадр.', draft);
    }
    const key = draft.slots.firstFrame ? 'lastFrame' : 'firstFrame';
    return Object.freeze({
      draft: frozenDraft({
        ...draft,
        slots: { ...draft.slots, [key]: Object.freeze({ ...upload }) },
        error: null
      }),
      error: null
    });
  }

  if (draft.mode === 'references') {
    const allowedKinds = new Set(inputContractFor(model)?.referenceKinds ?? []);
    if (!allowedKinds.has(upload.kind)) {
      return invalidUpload('unsupported_reference', 'эта модель не принимает такой тип референса.', draft);
    }
    const maximum = inputContractFor(model)?.maximum?.[upload.kind] ?? 1;
    const totalMaximum = inputContractFor(model)?.totalMaximum;
    if (totalMaximum && draft.slots.references.length >= totalMaximum) {
      return invalidUpload('total_reference_limit', `общий лимит референсов: ${totalMaximum}.`, draft);
    }
    const used = draft.slots.references.filter(({ kind }) => kind === upload.kind).length;
    if (used >= maximum) {
      return invalidUpload('reference_limit', `лимит референсов этого типа: ${maximum}.`, draft);
    }
    return Object.freeze({
      draft: frozenDraft({
        ...draft,
        slots: {
          ...draft.slots,
          references: [...draft.slots.references, Object.freeze({ ...upload })]
        },
        error: null
      }),
      error: null
    });
  }

  if (draft.mode === 'extend') {
    if (upload.kind !== 'video') {
      return invalidUpload('expected_video', 'для продолжения нужен исходный видеоклип.', draft);
    }
    return Object.freeze({
      draft: frozenDraft({
        ...draft,
        slots: { ...draft.slots, sourceVideo: Object.freeze({ ...upload }) },
        error: null
      }),
      error: null
    });
  }

  return invalidUpload('text_mode_upload', 'в текстовом режиме вложения не нужны.', draft);
}

export function validateVideoConstructorDraft(draft, model) {
  if (!modesForVideoModel(model).includes(draft.mode)) {
    return Object.freeze({ ok: false, message: 'выбранный режим недоступен для этой модели.' });
  }
  if (!draft.prompt.trim()) {
    return Object.freeze({ ok: false, message: 'добавь текстовое описание сцены.' });
  }
  if (draft.mode === 'first_frame' && !draft.slots.firstFrame) {
    return Object.freeze({ ok: false, message: 'добавь изображение для первого кадра.' });
  }
  if (draft.mode === 'references' && draft.slots.references.length === 0) {
    return Object.freeze({ ok: false, message: 'добавь хотя бы один референс.' });
  }
  if (draft.mode === 'extend' && !draft.slots.sourceVideo) {
    return Object.freeze({ ok: false, message: 'добавь исходное видео, которое нужно продолжить.' });
  }
  return Object.freeze({
    ok: true,
    historyTarget: Object.freeze({
      kind: 'video',
      mode: draft.mode,
      modelId: model.id,
      references: Object.freeze({
        image: draft.slots.references.filter((item) => item.kind === 'image').length,
        video: draft.slots.references.filter((item) => item.kind === 'video').length,
        audio: draft.slots.references.filter((item) => item.kind === 'audio').length,
        total: draft.slots.references.length,
        firstFrame: draft.slots.first ? 1 : 0,
        lastFrame: draft.slots.last ? 1 : 0,
        sourceVideo: draft.slots.sourceVideo ? 1 : 0
      })
    })
  });
}

function settingLabel(definition, value) {
  return definition.values.find((option) => String(option.value) === String(value))?.label ?? String(value);
}

function formatRussianList(items) {
  if (items.length < 2) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} и ${items.at(-1)}`;
}

function slotLine(draft, model) {
  if (draft.mode === 'first_frame') {
    const supportsLastFrame = model.id === 'seedance_25'
      || (inputContractFor(model)?.maximum?.image ?? 1) === 2;
    return `<b>первый кадр:</b> ${draft.slots.firstFrame ? 'добавлен ✅' : 'не добавлен'}${supportsLastFrame ? `\n<b>последний кадр:</b> ${draft.slots.lastFrame ? 'добавлен ✅' : 'необязательно'}` : ''}`;
  }
  if (draft.mode === 'references') {
    const kinds = inputContractFor(model)?.referenceKinds ?? [];
    const labels = { image: 'изображения', video: 'видео', audio: 'аудио' };
    const supported = formatRussianList(kinds.map((kind) => `<b>${labels[kind]}</b>`));
    return `<b>референсы:</b> ${draft.slots.references.length || 'не добавлены'} · ${supported} · <b>до ${inputContractFor(model)?.totalMaximum ?? inputContractFor(model)?.maximum?.image ?? 1}</b>`;
  }
  if (draft.mode === 'extend') return `<b>исходный клип:</b> ${draft.slots.sourceVideo ? 'добавлен ✅' : 'не добавлен'}`;
  return '<b>вложения:</b> не нужны';
}

export function buildVideoModeSelectionMessage(model, selectedMode = null) {
  const modes = modesForVideoModel(model);
  if (modes.length === 0) throw new TypeError('Video model does not support selectable modes.');
  const cardText = buildModelCard(model).text;
  const checkedMode = selectedMode ?? modes[0];
  const backTarget = `model:${model.id}`;
  const backLabel = '‹ назад к карточке';
  return Object.freeze({
    text: `${cardText}\n\n<b>выбери режим работы:</b>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...modes.map((mode) => [{
          text: `${checkedMode === mode ? '✓ ' : ''}${VIDEO_CONSTRUCTOR_MODES[mode].icon} ${VIDEO_CONSTRUCTOR_MODES[mode].label}`,
          callback_data: `video:choose:${mode}`
        }]),
        [
          { text: backLabel, callback_data: backTarget },
          { text: '🏠 главное меню', callback_data: 'task:menu' }
        ]
      ]
    }
  });
}

export function buildVideoConstructorMessage(draft, model, error = null) {
  const settings = inputProfileForModel(model).filter(({ values }) => values?.length > 1);
  const activeMode = VIDEO_CONSTRUCTOR_MODES[draft.mode];
  const errorText = error?.message ? `\n\n❌ ${error.message}` : '';
  const values = [
    `<b>режим:</b> ${activeMode.icon} ${activeMode.label}`,
    ...settings.map((definition) => (
      `<b>${definition.label}:</b> ${settingLabel(definition, draft.settings[definition.key] ?? definition.defaultValue)}`
    ))
  ];
  return Object.freeze({
    text: `<b>⚙️ параметры ${escapeHtml(model.name)}</b>\n\n${values.join('\n')}\n${slotLine(draft, model)}\n<b>промпт:</b> ${draft.prompt ? 'добавлен ✅' : 'не добавлен'}${errorText}\n\n<b>стоимость:</b> ${metacoinHtml()} ${calculateModelMetacoinPrice(model, draft.settings)} метакоинов`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎬 сменить режим', callback_data: 'video:change' }],
        ...launchSlotButtons(draft, model),
        ...settings.map((definition) => [{
          text: `${definition.label}: ${settingLabel(definition, draft.settings[definition.key])}`,
          callback_data: definition.values.length > 3
            ? `video:options:${definition.key}`
            : `video:cycle:${definition.key}`
        }]),
        ...promptDeleteRows(draft, model),
        [
          { text: 'сбросить', callback_data: 'video:reset', style: 'danger' },
          { text: 'готово', callback_data: 'video:done', style: 'success' }
        ],
        [{ text: '👤 профиль', callback_data: 'task:profile' }],
        [
          { text: '‹ назад к карточке', callback_data: `model:${model.id}` },
          { text: '🏠 главное меню', callback_data: 'task:menu' }
        ]
      ]
    }
  });
}

export function buildVideoSettingOptionsMessage(draft, model, key) {
  const definition = inputProfileForModel(model).find((field) => field.key === key);
  if (!definition?.values?.length) return buildVideoConstructorMessage(draft, model);
  const current = String(draft.settings?.[key] ?? definition.defaultValue);
  const buttons = definition.values.map(({ value, label }) => ({
    text: `${String(value) === current ? '✓ ' : ''}${label}`,
    callback_data: `video:set:${key}:${value}`
  }));
  const rows = [];
  for (let index = 0; index < buttons.length; index += 4) rows.push(buttons.slice(index, index + 4));
  return Object.freeze({
    text: key === 'duration'
      ? '<b>⏱ длительность:</b> выбери значение'
      : `<b>${escapeHtml(definition.label)}:</b> выбери значение`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [...rows, [
      { text: '‹ назад к параметрам', callback_data: 'video:settings' },
      { text: '🏠 главное меню', callback_data: 'task:menu' }
    ]] }
  });
}

function launchSlotButtons(draft, model) {
  if (draft.mode === 'first_frame') {
    const rows = [[{
      text: `${draft.slots.firstFrame ? '✅' : '🖼'} первый кадр`,
      callback_data: 'video:slot:first'
    }]];
    if (model.id === 'seedance_25' || (inputContractFor(model)?.maximum?.image ?? 1) === 2) {
      rows.push([{
        text: `${draft.slots.lastFrame ? '✅' : '🖼'} последний кадр (необязательно)`,
        callback_data: 'video:slot:last'
      }]);
    }
    return rows;
  }
  if (draft.mode === 'references') {
    return [[{
      text: `🎞 референсы${draft.slots.references.length ? ` · ${draft.slots.references.length}` : ''}`,
      callback_data: 'video:references'
    }]];
  }
  if (draft.mode === 'extend') {
    return [[{
      text: `${draft.slots.sourceVideo ? '✅' : '🎬'} исходный клип`,
      callback_data: 'video:slot:source'
    }]];
  }
  return [];
}

export function buildVideoReferenceUploadMessage(draft, model, error = null) {
  const kinds = new Set(inputContractFor(model)?.referenceKinds ?? []);
  const counts = Object.freeze({
    image: draft.slots.references.filter(({ kind }) => kind === 'image').length,
    video: draft.slots.references.filter(({ kind }) => kind === 'video').length,
    audio: draft.slots.references.filter(({ kind }) => kind === 'audio').length
  });
  const totalMaximum = inputContractFor(model)?.totalMaximum ?? 1;
  const errorText = error?.message ? `\n\n❌ ${escapeHtml(error.message)}` : '';
  const rows = [
    kinds.has('image') ? `<b>изображения:</b> ${counts.image}` : null,
    kinds.has('video') ? `<b>видео:</b> ${counts.video}` : null,
    kinds.has('audio') ? `<b>аудио:</b> ${counts.audio}` : null
  ].filter(Boolean);
  const kindLabels = [
    kinds.has('image') ? 'изображение' : null,
    kinds.has('video') ? 'видео' : null,
    kinds.has('audio') ? 'аудио' : null
  ].filter(Boolean);
  const supportedKinds = formatRussianList(kindLabels);
  return Object.freeze({
    text: `<b>🎞 референсы ${escapeHtml(model.name)}</b>\n\nпришли любой подходящий референс отдельным сообщением: <b>${supportedKinds}</b>. можно присылать по одному — всего <b>до ${totalMaximum} референсов</b>. уже принятые файлы сохраняются.\n\n${rows.join('\n')}\n<b>всего:</b> ${draft.slots.references.length} из ${totalMaximum}${errorText}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '‹ назад к параметрам', callback_data: 'video:settings' },
          { text: '🏠 главное меню', callback_data: 'task:menu' }
        ]
      ]
    }
  });
}

export function buildVideoLaunchMessage(draft, model, error = null) {
  const activeMode = VIDEO_CONSTRUCTOR_MODES[draft.mode];
  const errorText = error?.message ? `\n\n❌ ${escapeHtml(error.message)}` : '';
  return Object.freeze({
    text: `<b>👁‍🗨 проверь, что всё на месте</b>\n\n<b>модель:</b> ${escapeHtml(model.name)}\n<b>режим:</b> ${activeMode.icon} ${activeMode.label}\n${slotLine(draft, model)}\n<b>промпт:</b> ${draft.prompt ? 'добавлен ✅' : 'не добавлен'}${errorText}\n\n<b>стоимость:</b> ${metacoinHtml()} ${calculateModelMetacoinPrice(model, draft.settings)} метакоинов`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [{ text: '▶️ создать видео', callback_data: 'video:generate' }],
      ...promptDeleteRows(draft, model),
      [{ text: '👤 профиль', callback_data: 'task:profile' }],
      [
        { text: '‹ назад к параметрам', callback_data: 'video:settings' },
        { text: '🏠 главное меню', callback_data: 'task:menu' }
      ]
    ] }
  });
}

export function videoConstructorTelegramInput(draft) {
  const media = [
    draft.slots.firstFrame,
    draft.slots.lastFrame,
    ...draft.slots.references,
    draft.slots.sourceVideo
  ].filter(Boolean);
  const messages = media.map((item, index) => {
    const caption = index === 0 ? draft.prompt : undefined;
    if (item.kind === 'image') {
      return { photo: [{ file_id: item.fileId, width: item.width, height: item.height }], caption };
    }
    if (item.kind === 'video') {
      return { video: { file_id: item.fileId, width: item.width, height: item.height, duration: item.duration }, caption };
    }
    return { audio: { file_id: item.fileId, duration: item.duration }, caption };
  });
  return messages.length > 0 ? messages : { text: draft.prompt };
}
