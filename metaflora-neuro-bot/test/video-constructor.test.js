import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addVideoConstructorUpload,
  buildVideoSettingOptionsMessage,
  buildVideoModeSelectionMessage,
  buildVideoConstructorMessage,
  buildVideoLaunchMessage,
  buildVideoReferenceUploadMessage,
  createVideoConstructorDraft,
  clearVideoConstructorPrompt,
  cycleVideoConstructorSetting,
  modesForVideoModel,
  resetVideoConstructorSettings,
  setVideoConstructorMode,
  setVideoConstructorPrompt,
  videoConstructorTelegramInput,
  validateVideoConstructorDraft
} from '../src/video-constructor.js';
import { getModelById, listCatalogModels } from '../src/model-catalog.js';

const buttons = (message) => message.reply_markup.inline_keyboard.flat();

test('saved video prompt can be deleted without touching references or settings', () => {
  const model = getModelById('seedance_25');
  let draft = setVideoConstructorMode(createVideoConstructorDraft(model), 'first_frame');
  draft = setVideoConstructorPrompt(draft, 'оживи этот кадр');
  draft = addVideoConstructorUpload(draft, {
    kind: 'image', fileId: 'first-frame', width: 1280, height: 720
  }).draft;

  for (const message of [buildVideoConstructorMessage(draft, model), buildVideoLaunchMessage(draft, model)]) {
    assert.equal(buttons(message).find(({ callback_data }) => callback_data === 'video:prompt:delete')?.text, '🗑 удалить промпт');
  }

  const cleared = clearVideoConstructorPrompt(draft);
  const clearedAgain = clearVideoConstructorPrompt(cleared);
  assert.equal(cleared.prompt, '');
  assert.equal(clearedAgain.prompt, '');
  assert.deepEqual(cleared.slots, draft.slots);
  assert.deepEqual(cleared.settings, draft.settings);
  assert.equal(buttons(buildVideoConstructorMessage(cleared, model)).some(({ text }) => text === '🗑 удалить промпт'), false);
});

test('video constructor exposes only modes supported by the selected model', () => {
  assert.deepEqual(modesForVideoModel(getModelById('seedance_25')), [
    'text_to_video',
    'first_frame',
    'references'
  ]);
  assert.deepEqual(modesForVideoModel(getModelById('seedance_20')), [
    'text_to_video',
    'first_frame',
    'references'
  ]);
  assert.deepEqual(modesForVideoModel(getModelById('video_extend')), ['extend']);
});

test('reference mode comes from an explicit input contract, never from video/audio heuristics', () => {
  assert.ok(modesForVideoModel(getModelById('seedance_20')).includes('references'));
  assert.equal(
    modesForVideoModel(getModelById('polza_topaz_video_upscale_11v3tgv')).includes('references'),
    false
  );
});

test('draft updates are immutable and preserve accepted slots after a bad upload', () => {
  const model = getModelById('seedance_25');
  const initial = setVideoConstructorMode(createVideoConstructorDraft(model), 'first_frame');
  const accepted = addVideoConstructorUpload(initial, {
    kind: 'image',
    fileId: 'photo-1',
    width: 1280,
    height: 720
  });
  const rejected = addVideoConstructorUpload(accepted.draft, {
    kind: 'image',
    fileId: 'photo-too-small',
    width: 738,
    height: 194
  });

  assert.notEqual(accepted.draft, initial);
  assert.equal(rejected.error.code, 'image_dimensions');
  assert.equal(rejected.draft, accepted.draft);
  assert.equal(rejected.draft.slots.firstFrame.fileId, 'photo-1');
});

test('constructor rejects oversized and excessively long media before quote', () => {
  const model = getModelById('video_extend');
  const draft = setVideoConstructorMode(createVideoConstructorDraft(model), 'extend');
  assert.equal(addVideoConstructorUpload(draft, {
    kind: 'video', fileId: 'huge', fileSize: 50 * 1024 * 1024 + 1, duration: 5
  }, model).error.code, 'file_size');
  assert.equal(addVideoConstructorUpload(draft, {
    kind: 'video', fileId: 'long', fileSize: 1024, duration: 601
  }, model).error.code, 'media_duration');
});

test('cycling a setting keeps the draft immutable and follows model values', () => {
  const model = getModelById('seedance_25');
  const draft = createVideoConstructorDraft(model);
  const cycled = cycleVideoConstructorSetting(draft, model, 'resolution');

  assert.equal(draft.settings.resolution, '720p');
  assert.equal(cycled.settings.resolution, '480p');
  assert.notEqual(cycled, draft);
});

test('resetting video settings preserves prompt, mode and accepted media', () => {
  const model = getModelById('seedance_25');
  const base = setVideoConstructorPrompt(
    setVideoConstructorMode(createVideoConstructorDraft(model), 'first_frame'),
    'оживи сцену'
  );
  const withFrame = addVideoConstructorUpload(base, {
    kind: 'image', fileId: 'frame', width: 1280, height: 720
  }, model).draft;
  const changed = cycleVideoConstructorSetting(withFrame, model, 'resolution');
  const reset = resetVideoConstructorSettings(changed, model);

  assert.equal(reset.settings.resolution, '720p');
  assert.equal(reset.mode, 'first_frame');
  assert.equal(reset.prompt, 'оживи сцену');
  assert.equal(reset.slots.firstFrame.fileId, 'frame');
  assert.notEqual(reset, changed);
});

test('mode validation requires the right slots and keeps a concrete history target', () => {
  const model = getModelById('video_extend');
  const draft = {
    ...setVideoConstructorMode(createVideoConstructorDraft(model), 'extend'),
    prompt: 'продолжи движение камеры'
  };
  const invalid = validateVideoConstructorDraft(draft, model);
  assert.equal(invalid.ok, false);
  assert.match(invalid.message, /исходное видео/u);

  const accepted = addVideoConstructorUpload(draft, {
    kind: 'video',
    fileId: 'clip-1',
    width: 1280,
    height: 720,
    duration: 5
  });
  const valid = validateVideoConstructorDraft(accepted.draft, model);
  assert.equal(valid.ok, true);
  assert.deepEqual(valid.historyTarget, {
    kind: 'video',
    mode: 'extend',
    modelId: 'video_extend',
    references: {
      image: 0,
      video: 0,
      audio: 0,
      total: 0,
      firstFrame: 0,
      lastFrame: 0,
      sourceVideo: 1
    }
  });
});

test('video flow asks for a supported mode before opening the working card', () => {
  const model = getModelById('seedance_20');
  const message = buildVideoModeSelectionMessage(model);
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.match(message.text, /выбери режим работы/u);
  assert.match(message.text, /<b>стоимость:.*метакоинов<\/b>/u);
  assert.doesNotMatch(message.text, /конструктор/u);
  assert.deepEqual(
    buttons.filter(({ callback_data }) => callback_data.startsWith('video:choose:'))
      .map(({ callback_data }) => callback_data),
    ['video:choose:text_to_video', 'video:choose:first_frame', 'video:choose:references']
  );
  assert.ok(buttons.every(({ callback_data = '' }) => Buffer.byteLength(callback_data) <= 64));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'model:seedance_20'));
});

test('video mode selection is a dedicated prompt, not a second settings card', () => {
  const model = getModelById('seedance_25');
  const message = buildVideoModeSelectionMessage(model);

  assert.match(message.text, /^<b>Seedance 2\.5<\/b>/u);
  assert.match(message.text, /<b>выбери режим работы:<\/b>/u);
  assert.doesNotMatch(message.text, /<b>режим:<\/b>/u);
  assert.doesNotMatch(message.text, /первый кадр:|описание:|добавляй материалы/u);
  assert.doesNotMatch(message.text, /длительность:<\/b>|разрешение:<\/b>|соотношение сторон:<\/b>|звук:<\/b>/u);
});

test('every video constructor screen offers the main menu', () => {
  const model = getModelById('seedance_25');
  const draft = setVideoConstructorMode(createVideoConstructorDraft(model), 'references', model);
  const screens = [
    buildVideoModeSelectionMessage(model),
    buildVideoConstructorMessage(draft, model),
    buildVideoSettingOptionsMessage(draft, model, 'duration'),
    buildVideoReferenceUploadMessage(draft, model),
    buildVideoLaunchMessage(draft, model)
  ];
  for (const screen of screens) {
    assert.ok(screen.reply_markup.inline_keyboard.flat().some(({ text, callback_data }) => (
      text === '🏠 главное меню' && callback_data === 'task:menu'
    )));
  }
});

test('mode selection always returns to the normal model card', () => {
  const model = getModelById('seedance_20');
  const message = buildVideoModeSelectionMessage(model, 'first_frame');
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.ok(buttons.some(({ callback_data }) => callback_data === 'model:seedance_20'));
  assert.ok(buttons.some(({ text }) => text.startsWith('✓') && /кадр → видео/u.test(text)));
});

test('video parameters keep reset and done before final launch', () => {
  const model = getModelById('seedance_20');
  const draft = setVideoConstructorMode(createVideoConstructorDraft(model), 'first_frame');
  const message = buildVideoConstructorMessage(draft, model);
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.match(message.text, /^<b>⚙️ параметры Seedance 2\.0<\/b>/u);
  assert.match(message.text, /<b>режим:<\/b> 🖼 кадр → видео/u);
  assert.match(message.text, /<b>стоимость:<\/b> .* метакоинов/u);
  assert.doesNotMatch(message.text, /добавляй материалы по одному/u);
  assert.doesNotMatch(message.text, /конструктор/u);
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'video:change'));
  assert.ok(!buttons.some(({ callback_data }) => callback_data.startsWith('video:mode:')));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'video:options:duration'));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'video:reset'));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'video:done'));
  assert.equal(buttons.some(({ callback_data }) => callback_data === 'video:generate'), false);
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'model:seedance_20'));
  assert.ok(buttons.every(({ callback_data = '' }) => Buffer.byteLength(callback_data) <= 64));
});

test('final video screen launches and returns to parameters', () => {
  const model = getModelById('seedance_20');
  const draft = setVideoConstructorMode(createVideoConstructorDraft(model), 'first_frame');
  const message = buildVideoLaunchMessage(draft, model);
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.match(message.text, /<b>режим:<\/b> 🖼 кадр → видео/u);
  assert.match(message.text, /<b>первый кадр:<\/b> не добавлен/u);
  assert.match(message.text, /<b>промпт:<\/b> не добавлен/u);
  assert.match(message.text, /^<b>👁‍🗨 проверь, что всё на месте<\/b>/u);
  assert.match(message.text, /стоимость/u);
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'video:settings'));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'video:generate'));
  assert.equal(buttons.find(({ callback_data }) => callback_data === 'video:generate').style, undefined);
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'task:profile'));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'task:menu'));
});

test('Seedance 2.5 uses a cheap checked default and duration grid', () => {
  const model = getModelById('seedance_25');
  const draft = createVideoConstructorDraft(model);
  const selection = buildVideoModeSelectionMessage(model, draft.mode);
  const optionMessage = buildVideoSettingOptionsMessage(draft, model, 'duration');
  const optionButtons = optionMessage.reply_markup.inline_keyboard.flat();

  assert.equal(draft.settings.duration, '8');
  assert.ok(selection.reply_markup.inline_keyboard.flat().some(({ text, callback_data }) => (
    callback_data === 'video:choose:text_to_video' && text.startsWith('✓ ✍️')
  )));
  assert.match(optionMessage.text, /^<b>⏱ длительность:<\/b> выбери значение/u);
  assert.ok(optionButtons.some(({ text, callback_data }) => (
    text === '✓ 8 сек' && callback_data === 'video:set:duration:8'
  )));
  assert.ok(optionButtons.some(({ text, callback_data }) => (
    text === '15 сек' && callback_data === 'video:set:duration:15'
  )));
  assert.ok(optionButtons.some(({ callback_data }) => callback_data === 'video:settings'));
});

test('Seedance 2.5 parameters link to one separate reference upload screen', () => {
  const model = getModelById('seedance_25');
  const draft = setVideoConstructorMode(createVideoConstructorDraft(model), 'references', model);
  const message = buildVideoConstructorMessage(draft, model);
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.match(message.text, /<b>референсы:<\/b> не добавлены · <b>изображения<\/b>, <b>видео<\/b> и <b>аудио<\/b> · <b>до 50<\/b>/u);
  assert.ok(buttons.some(({ text, callback_data }) => (
    text === '🎞 референсы' && callback_data === 'video:references'
  )));
  assert.equal(buttons.some(({ callback_data = '' }) => callback_data.startsWith('video:slot:reference_')), false);
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'video:reset'));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'video:done'));
});

test('video references name the model without a separator and never require every media kind', () => {
  const model = getModelById('seedance_25');
  const draft = setVideoConstructorMode(createVideoConstructorDraft(model), 'references', model);
  const message = buildVideoReferenceUploadMessage(draft, model);

  assert.match(message.text, /^<b>🎞 референсы Seedance 2\.5<\/b>/u);
  assert.match(message.text, /можно присылать по одному/u);
  assert.doesNotMatch(message.text, /нужно прислать.*изображения.*видео.*аудио/su);
});

test('changing video mode preserves only slots compatible with the new mode', () => {
  const model = getModelById('seedance_20');
  const populated = {
    ...createVideoConstructorDraft(model),
    slots: {
      firstFrame: { kind: 'photo', fileId: 'first' },
      lastFrame: { kind: 'photo', fileId: 'last' },
      references: [{ kind: 'photo', fileId: 'ref' }],
      sourceVideo: { kind: 'video', fileId: 'clip' }
    }
  };

  const references = setVideoConstructorMode(populated, 'references', model);
  assert.equal(references.slots.firstFrame, null);
  assert.equal(references.slots.lastFrame, null);
  assert.equal(references.slots.sourceVideo, null);
  assert.equal(references.slots.references.length, 1);
});

test('every available video entry has a truthful constructor surface or no constructor', () => {
  for (const model of listCatalogModels().filter(({ category, availability }) => (
    category === 'video' && availability === 'available'
  ))) {
    const modes = modesForVideoModel(model);
    assert.equal(new Set(modes).size, modes.length, `${model.id} has duplicate modes`);
    assert.ok(modes.every((mode) => Object.hasOwn({
      text_to_video: true,
      first_frame: true,
      references: true,
      extend: true
    }, mode)), `${model.id} exposes an unknown mode`);
    if (model.source === 'tool' && ![
      'video_generate', 'video_image_to_video', 'video_extend'
    ].includes(model.id)) {
      assert.deepEqual(modes, [], `${model.id} must stay in its dedicated scenario flow`);
    }
    if (modes.length > 0) {
      assert.doesNotThrow(() => buildVideoConstructorMessage(
        createVideoConstructorDraft(model),
        model
      ), model.id);
    }
  }
});

test('constructor enforces per-model slot types and limits without erasing accepted media', () => {
  const singleFrameModel = getModelById('runway_gen_45');
  const singleFrame = setVideoConstructorMode(
    createVideoConstructorDraft(singleFrameModel),
    'first_frame'
  );
  const first = addVideoConstructorUpload(singleFrame, {
    kind: 'image', fileId: 'frame-1', width: 720, height: 1280
  }, singleFrameModel);
  const second = addVideoConstructorUpload(first.draft, {
    kind: 'image', fileId: 'frame-2', width: 720, height: 1280
  }, singleFrameModel);
  assert.equal(second.error.code, 'image_limit');
  assert.equal(second.draft.slots.firstFrame.fileId, 'frame-1');

  const referenceModel = getModelById('seedance_20');
  const references = setVideoConstructorMode(
    createVideoConstructorDraft(referenceModel),
    'references'
  );
  const wrong = addVideoConstructorUpload(references, {
    kind: 'document', fileId: 'doc-1'
  }, referenceModel);
  assert.equal(wrong.error.code, 'unsupported_upload');
  const acceptedVideo = addVideoConstructorUpload(references, {
    kind: 'video', fileId: 'movement-1', width: 1280, height: 720, duration: 4
  }, referenceModel);
  assert.equal(acceptedVideo.error, null);
  assert.equal(acceptedVideo.draft.slots.references.length, 1);
});

test('constructor composes provider-ready Telegram input without mutating its draft', () => {
  const model = getModelById('seedance_25');
  const withMode = setVideoConstructorMode(createVideoConstructorDraft(model), 'first_frame');
  const withPrompt = setVideoConstructorPrompt(withMode, '  камера медленно приближается  ');
  const first = addVideoConstructorUpload(withPrompt, {
    kind: 'image', fileId: 'first', width: 1280, height: 720
  }, model).draft;
  const second = addVideoConstructorUpload(first, {
    kind: 'image', fileId: 'last', width: 1280, height: 720
  }, model).draft;
  const input = videoConstructorTelegramInput(second);

  assert.equal(withMode.prompt, '');
  assert.equal(input.length, 2);
  assert.equal(input[0].caption, 'камера медленно приближается');
  assert.equal(input[0].photo[0].file_id, 'first');
  assert.equal(input[1].photo[0].file_id, 'last');
});

test('constructor explains incomplete text, frame and reference drafts', () => {
  const textModel = getModelById('seedance_25');
  assert.match(
    validateVideoConstructorDraft(createVideoConstructorDraft(textModel), textModel).message,
    /описание/u
  );
  const frame = setVideoConstructorPrompt(
    setVideoConstructorMode(createVideoConstructorDraft(textModel), 'first_frame'),
    'оживи сцену'
  );
  assert.match(validateVideoConstructorDraft(frame, textModel).message, /изображение/u);

  const referenceModel = getModelById('seedance_20');
  const references = setVideoConstructorPrompt(
    setVideoConstructorMode(createVideoConstructorDraft(referenceModel), 'references'),
    'сохрани движение'
  );
  assert.match(validateVideoConstructorDraft(references, referenceModel).message, /референс/u);
});

test('constructor rejects wrong slot media and serializes video and audio references', () => {
  const frameModel = getModelById('seedance_25');
  const frame = setVideoConstructorMode(createVideoConstructorDraft(frameModel), 'first_frame');
  assert.equal(addVideoConstructorUpload(frame, {
    kind: 'video', fileId: 'clip', width: 1280, height: 720
  }, frameModel).error.code, 'expected_image');
  assert.equal(addVideoConstructorUpload(createVideoConstructorDraft(frameModel), {
    kind: 'image', fileId: 'unused', width: 720, height: 720
  }, frameModel).error.code, 'text_mode_upload');

  const referenceModel = getModelById('kling_video_o1');
  const referenceDraft = setVideoConstructorMode(
    createVideoConstructorDraft(referenceModel),
    'references'
  );
  assert.equal(addVideoConstructorUpload(referenceDraft, {
    kind: 'audio', fileId: 'sound', duration: 4
  }, referenceModel).error.code, 'unsupported_reference');
  const one = addVideoConstructorUpload(referenceDraft, {
    kind: 'video', fileId: 'movement', width: 1280, height: 720, duration: 4
  }, referenceModel).draft;
  assert.equal(addVideoConstructorUpload(one, {
    kind: 'video', fileId: 'movement-2', width: 1280, height: 720, duration: 4
  }, referenceModel).error.code, 'reference_limit');
  assert.equal(videoConstructorTelegramInput(one)[0].video.file_id, 'movement');

  const extendModel = getModelById('video_extend');
  const extend = setVideoConstructorPrompt(createVideoConstructorDraft(extendModel), 'продолжи');
  assert.equal(addVideoConstructorUpload(extend, {
    kind: 'image', fileId: 'wrong', width: 720, height: 720
  }, extendModel).error.code, 'expected_video');
  assert.equal(validateVideoConstructorDraft({ ...extend, mode: 'references' }, extendModel).ok, false);
});

test('Seedance 2.5 accepts up to 50 multimodal references', () => {
  const model = getModelById('seedance_25');
  const references = setVideoConstructorMode(createVideoConstructorDraft(model), 'references', model);
  assert.ok(modesForVideoModel(model).includes('references'));

  let draft = references;
  for (let index = 0; index < 50; index += 1) {
    const accepted = addVideoConstructorUpload(draft, {
      kind: 'image',
      fileId: `ref-${index}`,
      width: 720,
      height: 720
    }, model);
    assert.equal(accepted.error, null);
    draft = accepted.draft;
  }

  assert.equal(draft.slots.references.length, 50);
  assert.equal(addVideoConstructorUpload(draft, {
    kind: 'image',
    fileId: 'ref-over-limit',
    width: 720,
    height: 720
  }, model).error.code, 'total_reference_limit');
  assert.equal(addVideoConstructorUpload(references, {
    kind: 'video',
    fileId: 'clip',
    width: 1280,
    height: 720,
    duration: 4
  }, model).error, null);
});
