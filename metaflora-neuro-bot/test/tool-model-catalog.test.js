import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TOOL_MODELS,
  calculateToolMetacoinPrice,
  formatToolMetacoinPrice,
  toolSettingsProfileFor
} from '../src/tool-model-adapter.js';
import {
  applyModelSetting,
  buildModelCard,
  buildModelCategoryMessage,
  buildModelConfiguredMessage,
  buildModelSelectedMessage,
  buildModelSettingsMessage,
  buildSettingOptionsMessage,
  buildToolCategoryMessage,
  calculateModelMetacoinPrice,
  defaultModelSettings,
  formatModelMetacoinPrice,
  getModelById,
  inputProfileForModel,
  listCatalogModels
} from '../src/model-catalog.js';
import { TOOL_CATALOG } from '../src/tool-catalog.js';

const legacyToolIds = [
  'topaz_image',
  'topaz_video',
  'remove_bg',
  'face_swap',
  'inpaint',
  'outpaint',
  'image_editor',
  'photo_master'
];

const expectedToolIds = [
  'photo_generate',
  'photo_edit',
  'photo_pose_transfer',
  'photo_colorize',
  'photo_restore',
  'photo_remove_bg',
  'photo_object_remove',
  'photo_expand',
  'photo_face_restore',
  'photo_try_on',
  'photo_product',
  'photo_ocr',
  'photo_upscale',
  'video_generate',
  'video_image_to_video',
  'video_extend',
  'video_understand',
  'video_edit',
  'video_live_photo',
  'video_lipsync',
  'video_talking_head',
  'video_remove_bg',
  'video_remove_object',
  'video_upscale',
  'audio_stt',
  'audio_tts',
  'audio_voice_clone',
  'audio_isolation',
  'audio_stems',
  'audio_sfx',
  'audio_music',
  'audio_voice_change',
  'document_ocr',
  'document_table',
  'document_formula',
  'document_chart',
  'data_extract',
  'data_image_description',
  'three_d_image',
  'three_d_text',
  'three_d_extract',
  'three_d_multi_image'
];

function callbacks(message) {
  return message.reply_markup.inline_keyboard
    .flat()
    .map(({ callback_data: callbackData }) => callbackData);
}

test('all 42 tools expose a strict card, input, settings, pricing and runtime contract', () => {
  assert.deepEqual(TOOL_CATALOG.map(({ id }) => id), expectedToolIds);
  assert.equal(new Set(expectedToolIds).size, 42);

  for (const tool of TOOL_CATALOG) {
    assert.equal(tool.card.title, tool.name, `${tool.id}: card title`);
    assert.ok(tool.card.description.trim().length >= 120, `${tool.id}: card description`);
    assert.ok(tool.card.instruction.trim(), `${tool.id}: card instruction`);

    const inputKeys = [...tool.input.required, ...tool.input.optional];
    assert.equal(new Set(inputKeys).size, inputKeys.length, `${tool.id}: duplicate input`);
    assert.ok(tool.input.required.length > 0, `${tool.id}: required input`);
    assert.deepEqual(
      Object.keys(tool.runtime.inputMap).sort(),
      [...inputKeys].sort(),
      `${tool.id}: runtime input map`
    );

    for (const [key, setting] of Object.entries(tool.settings)) {
      assert.ok(setting.label.trim(), `${tool.id}:${key}: label`);
      if (setting.type === 'enum') {
        assert.equal(new Set(setting.values).size, setting.values.length, `${tool.id}:${key}: values`);
        assert.ok(setting.values.includes(setting.default), `${tool.id}:${key}: default`);
      } else if (setting.type === 'number') {
        assert.ok(Number.isFinite(setting.default), `${tool.id}:${key}: default`);
        assert.ok(setting.min <= setting.default && setting.default <= setting.max);
        assert.ok(setting.step > 0, `${tool.id}:${key}: step`);
        const steps = (setting.default - setting.min) / setting.step;
        assert.ok(Math.abs(steps - Math.round(steps)) < 1e-8, `${tool.id}:${key}: alignment`);
      } else if (setting.type === 'boolean') {
        assert.equal(typeof setting.default, 'boolean', `${tool.id}:${key}: default`);
      } else {
        assert.equal(setting.type, 'string', `${tool.id}:${key}: type`);
        assert.equal(typeof setting.default, 'string', `${tool.id}:${key}: default`);
      }
    }

    assert.equal(tool.routes.filter(({ role }) => role === 'primary').length, 1, tool.id);
    assert.ok(
      ['fal.subscribe', 'elevenlabs.direct'].includes(tool.runtime.adapter),
      `${tool.id}: adapter`
    );
    assert.ok(tool.runtime.outputPath.trim(), `${tool.id}: output path`);
    assert.ok(['fixed', 'range', 'tiered'].includes(tool.pricing.type), `${tool.id}: price type`);
    if (tool.pricing.type === 'fixed') {
      assert.ok(Number.isFinite(tool.pricing.amount) && tool.pricing.amount > 0, tool.id);
    } else if (tool.pricing.type === 'range') {
      assert.ok(Number.isFinite(tool.pricing.min) && tool.pricing.min > 0, tool.id);
      assert.ok(Number.isFinite(tool.pricing.max) && tool.pricing.max >= tool.pricing.min, tool.id);
    } else {
      assert.ok(tool.settings[tool.pricing.setting], `${tool.id}: pricing setting`);
      assert.ok(
        Object.values(tool.pricing.amounts).every((amount) => Number.isFinite(amount) && amount > 0),
        `${tool.id}: pricing tiers`
      );
    }

    assert.match(tool.brand, /^[a-z][a-z0-9]*$/, `${tool.id}: brand`);
    assert.equal(tool.customEmojiKey, tool.brand, `${tool.id}: custom emoji`);
    assert.doesNotMatch(tool.customEmojiFallback, /[◆◇♦◊▫]/u, `${tool.id}: custom emoji fallback`);
    assert.match(tool.logoFallback, /\S/u, `${tool.id}: logo fallback`);
  }
});

test('tool model adapter preserves branding for custom emoji and logo fallback', () => {
  assert.equal(TOOL_MODELS.length, 42);

  for (const model of TOOL_MODELS) {
    const tool = TOOL_CATALOG.find(({ id }) => id === model.id);
    assert.match(model.brand, /^[a-z][a-z0-9]*$/, `${model.id}: brand`);
    assert.doesNotMatch(model.customEmojiFallback, /[◆◇♦◊▫]/u, `${model.id}: custom emoji fallback`);
    assert.match(model.logoFallback, /\S/u, `${model.id}: logo fallback`);
    assert.equal(model.brand, tool.brand, `${model.id}: brand`);
    assert.equal(model.customEmojiKey, tool.customEmojiKey, `${model.id}: custom emoji`);
    assert.equal(model.customEmojiFallback, tool.customEmojiFallback, `${model.id}: custom emoji fallback`);
    assert.equal(model.logoFallback, tool.logoFallback, `${model.id}: logo fallback`);
  }
});

test('tool root contains four file subcategories plus the shared sound studio', () => {
  const root = buildModelCategoryMessage('tools');

  assert.match(root.text, /^<b>🪄 ИИ-инструменты<\/b>/);
  assert.deepEqual(
    callbacks(root).filter((value) => value?.startsWith('toolcat:')),
    ['toolcat:image', 'toolcat:video', 'toolcat:document', 'toolcat:3d']
  );
  assert.ok(callbacks(root).includes('audiostudio:home'));

  const listedIds = new Set(listCatalogModels().map(({ id }) => id));
  assert.ok(TOOL_MODELS.filter(({ active }) => active).every(({ id }) => listedIds.has(id)));
  assert.ok(legacyToolIds.every((id) => !listedIds.has(id)));
});

test('tool categories use model buttons and navigate back through their tool category', () => {
  const image = buildToolCategoryMessage('image');
  const imageCallbacks = callbacks(image);

  assert.match(image.text, /^<b>🖼 фото<\/b>/);
  assert.ok(imageCallbacks.includes('model:photo_remove_bg'));
  assert.ok(imageCallbacks.includes('model:photo_upscale'));
  assert.ok(imageCallbacks.includes('model:photo_restore'));
  assert.ok(imageCallbacks.includes('modelcat:tools'));

  for (const category of ['image', 'video', 'audio', 'document', '3d']) {
    const expectedIds = TOOL_MODELS
      .filter((model) => model.active && model.category === category)
      .map(({ id }) => `model:${id}`);
    const categoryCallbacks = callbacks(buildToolCategoryMessage(category));

    assert.ok(expectedIds.every((callbackData) => categoryCallbacks.includes(callbackData)));
  }

  assert.equal(buildToolCategoryMessage('missing').text, buildModelCategoryMessage('tools').text);
});

test('tool models resolve through the unified catalog without replacing regular models', () => {
  const tool = getModelById('photo_restore');
  const regular = getModelById('nano_banana_pro');

  assert.equal(tool.source, 'tool');
  assert.equal(tool.category, 'image');
  assert.equal(regular.source, undefined);
  assert.equal(getModelById('topaz_image'), null);
});

test('tool cards, settings, configured state, and selection keep tool navigation', () => {
  const model = getModelById('photo_face_restore');

  assert.match(buildModelCard(model).text, /^<b>восстановить лицо<\/b>/);
  assert.ok(callbacks(buildModelCard(model)).includes('toolcat:image'));
  assert.ok(callbacks(buildModelSettingsMessage(model)).includes('toolcat:image'));
  assert.ok(callbacks(buildModelConfiguredMessage(model)).includes('toolcat:image'));
  assert.ok(callbacks(buildModelSelectedMessage(model)).includes('toolcat:image'));

  const options = buildSettingOptionsMessage(model, 'only_center_face');
  assert.ok(callbacks(options).includes('set:only_center_face:false'));
  assert.ok(callbacks(options).includes('set:only_center_face:true'));
});

test('unified settings preserve boolean, number, and string values', () => {
  const face = getModelById('photo_face_restore');
  const speech = getModelById('audio_tts');
  const defaults = defaultModelSettings(face);

  assert.equal(defaults.only_center_face, false);
  assert.equal(defaults.fidelity, 0.5);
  assert.deepEqual(inputProfileForModel(face), toolSettingsProfileFor(face));

  const booleanSettings = applyModelSetting(face, defaults, 'only_center_face', 'true');
  const numberSettings = applyModelSetting(face, booleanSettings, 'fidelity', '0.75');
  const stringSettings = applyModelSetting(
    speech,
    defaultModelSettings(speech),
    'voice',
    'Custom voice'
  );

  assert.equal(booleanSettings.only_center_face, true);
  assert.equal(typeof booleanSettings.only_center_face, 'boolean');
  assert.equal(numberSettings.fidelity, 0.75);
  assert.equal(typeof numberSettings.fidelity, 'number');
  assert.equal(stringSettings.voice, 'Custom voice');
});

test('unified price helpers delegate tool pricing and retain regular catalog pricing', () => {
  const tool = getModelById('photo_face_restore');
  const settings = { ...defaultModelSettings(tool), fidelity: 0.75 };

  assert.equal(
    calculateModelMetacoinPrice(tool, settings),
    calculateToolMetacoinPrice(tool, settings)
  );
  assert.equal(formatModelMetacoinPrice(tool), formatToolMetacoinPrice(tool));
  assert.match(formatModelMetacoinPrice(getModelById('nano_banana_pro')), /^\d+(?:–\d+)?$/);
});
