import test from 'node:test';
import assert from 'node:assert/strict';

import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';
import {
  buildLlmFamilyMessage, buildModelCard, buildModelCategoryMessage,
  buildModelConfiguredMessage, buildModelSettingsMessage, buildModelSelectedMessage,
  calculateModelMetacoinPrice, defaultModelSettings, getModelById,
  inputProfileFor, listCatalogModels
} from '../src/model-catalog.js';

const retiredSupersededIds = Object.freeze([
  'polza_bytedance_seedream_1p1gj11', 'polza_bytedance_seedream_4_0flct3o',
  'polza_kling_v2_5_turbo_17zcvnf', 'polza_kling_v2_6_0fxm8wn',
  'polza_wan_2_5_0k8ohet', 'polza_openai_tts_1_19bzocj',
  'polza_openai_tts_1_hd_1dyowdi'
]);

const retiredNonRouterAiIds = Object.freeze([
  'gpt_53_chat', 'gpt_5_codex', 'o3_pro',
  'polza_google_gemini_3_pro_preview_0li4nuj',
  'polza_ai21_jamba_large_1_7_0p8ngfb',
  'gigachat_2_max', 'gigachat_2_pro', 'gigachat_2',
  'polza_sber_gigachat_1sbag2e', 'polza_sber_gigachat_max_00ud1d1',
  'polza_sber_gigachat_plus_1d2dn75', 'polza_sber_gigachat_pro_03opyas',
  'polza_openai_gpt_image_1_5_0wv2v9y', 'polza_qwen_image_0i0mbk0',
  'polza_qwen_image_2_0m85awv',
  'polza_yandex_yandex_art_0wl8wis',
  'polza_ai_sage_gigaam_v3_146z2tr', 'polza_aiesa_transcribe_0eontc0',
  'polza_aiesa_transcribe_fast_1yltowx', 'polza_openai_gpt_4o_mini_tts_0f5jo5v',
  'polza_aiesa_aiesa_mini_0yyg60s', 'polza_aiesa_aiesa_pro_07f9hsi',
  'polza_sakana_fugu_ultra_0wuxm6z'
]);

const directRouterAiModels = Object.freeze({
  glm_53: 'z-ai/glm-5.3',
  grok_46: 'x-ai/grok-4.6',
  deepseek_v4_pro_0813: 'deepseek/deepseek-v4-pro-0813',
  qwen_37_flash: 'qwen/qwen3.7-flash',
  flux_2_max: 'black-forest-labs/flux.2-max',
  qwen_image_3: 'qwen/qwen-image-3',
  qwen_image_3_pro: 'qwen/qwen-image-3-pro',
  wan_27: 'alibaba/wan-2.7',
  veo_31_lite: 'google/veo-3.1-lite',
  kling_video_o1: 'kwaivgi/kling-video-o1',
  seedance_25: 'bytedance/seedance-2.5',
  mai_voice_2: 'microsoft/mai-voice-2',
  fish_audio_s21_pro: 'fish-audio/s2.1-pro'
});

test('public catalogue preserves cards independently from provider routing', () => {
  const models = listCatalogModels().filter(({ source }) => source !== 'tool');
  assert.ok(models.length >= 375);
  assert.equal(new Set(models.map(({ id }) => id)).size, models.length);
  for (const model of models) {
    assert.equal(model.availability, 'available', model.id);
    assert.match(buildModelCard(model).text, /<b>стоимость:.*метакоинов/iu, model.id);
  }
});

test('public catalogue retires generic cards absent from the live RouterAI catalogue', () => {
  const visible = new Set(listCatalogModels().map(({ id }) => id));
  for (const id of retiredNonRouterAiIds) {
    assert.equal(visible.has(id), false, id);
    assert.equal(getModelById(id), null, id);
  }
});

test('only agreed superseded cards are removed even by direct id', () => {
  const visible = new Set(listCatalogModels().map(({ id }) => id));
  for (const id of retiredSupersededIds) {
    assert.equal(visible.has(id), false, id);
    assert.equal(getModelById(id), null, id);
  }
});

test('Suno and agreed RouterAI-gap specialists remain public while obsolete specialists are removed', () => {
  for (const id of [
    'polza_suno_generate_1xai46g', 'polza_suno_mashup_0e1mpc3',
    'polza_suno_sounds_1lwz9xr'
  ]) assert.ok(getModelById(id), id);
  for (const id of [
    'polza_tongyi_mai_z_image_0x1b58c',
    'polza_gemini_omni_video_0zgwx2i',
    'polza_kling_v2_6_motion_control_18vsbd0',
    'polza_kling_v3_motion_control_1i2kcfl'
  ]) assert.equal(getModelById(id), null, id);
});

test('selected RouterAI additions stay public with their exact contracts', () => {
  const visible = new Set(listCatalogModels().map(({ id }) => id));
  for (const [id, providerModelId] of Object.entries(directRouterAiModels)) {
    const model = getModelById(id);
    assert.equal(visible.has(id), true, id);
    assert.equal(model?.provider, 'routerai', id);
    assert.equal(model?.providerModelId, providerModelId, id);
    assert.ok(calculateModelMetacoinPrice(model, defaultModelSettings(model)) > 0, `${id}: price is missing`);
    assert.equal(exactProviderRoutesFor(providerModelId)[0]?.provider, 'routerai', id);
  }
});

test('confirmed legacy aliases remain public and RouterAI-first', () => {
  const aliases = Object.freeze({
    polza_bytedance_seedream_4_5_0y4bpwh: 'bytedance-seed/seedream-4.5',
    polza_google_veo3_0n9pka0: 'google/veo-3.1',
    polza_kling_v3_0r3wzac: 'kwaivgi/kling-v3.0-std',
    polza_wan_2_6_0jepobw: 'alibaba/wan-2.6'
  });
  for (const [id, routerAiId] of Object.entries(aliases)) {
    const model = getModelById(id);
    assert.ok(model, id);
    const route = exactProviderRoutesFor(model.providerModelId)[0];
    assert.equal(route?.provider, 'routerai', id);
    assert.equal(route?.providerModelId, routerAiId, id);
  }
});

test('legacy public cards expose their effective RouterAI route, not the retired Polza source', () => {
  for (const id of [
    'polza_bytedance_seedream_4_5_0y4bpwh',
    'polza_google_veo3_0n9pka0',
    'polza_kling_v3_0r3wzac',
    'polza_wan_2_6_0jepobw'
  ]) {
    const model = getModelById(id);
    assert.ok(model, id);
    assert.equal(model.provider, 'routerai', id);
    assert.ok(model.providerModelId, `${id}: effective RouterAI model id`);
  }
});

test('single-image RouterAI contracts do not expose unsupported batch or resolution controls', () => {
  for (const id of [
    'nano_banana_pro', 'nano_banana_2', 'nano_banana_2_lite',
    'flux_2_max', 'mai_image_25', 'mai_image_25_pro'
  ]) {
    const keys = inputProfileFor(getModelById(id)).map(({ key }) => key);
    assert.equal(keys.includes('num_images'), false, `${id}: n is capped at one by RouterAI`);
  }
  const gptImage2Keys = inputProfileFor(getModelById('gpt_image_2')).map(({ key }) => key);
  assert.equal(gptImage2Keys.includes('resolution'), false, 'GPT Image 2: RouterAI has no resolution field');
  for (const id of ['mai_image_25', 'mai_image_25_pro']) {
    const card = buildModelCard(getModelById(id));
    assert.doesNotMatch(card.text, /до четыр[её]х вариантов/iu, `${id}: RouterAI only accepts one image`);
  }
});

test('catalogue screens never expose dead callbacks', () => {
  const messages = [
    ...['image', 'video', 'audio', 'voice', 'beta'].map(buildModelCategoryMessage),
    ...['openai', 'anthropic', 'google', 'xai', 'deepseek', 'qwen', 'other', 'search'].map(buildLlmFamilyMessage)
  ];
  for (const message of messages) {
    assert.equal(message.parse_mode, 'HTML');
    for (const button of message.reply_markup.inline_keyboard.flat()) {
      assert.ok(Buffer.byteLength(button.callback_data, 'utf8') <= 64);
      if (button.callback_data.startsWith('model:')) assert.ok(getModelById(button.callback_data.slice(6)));
    }
  }
});

test('video guide recommends exactly the current executable flagship models', () => {
  const message = buildModelCategoryMessage('video');
  const guide = message.text.split('<blockquote>')[0];
  const recommendationNames = [...guide.matchAll(/<\/tg-emoji> <b>([^<]+)<\/b>/gu)]
    .map((match) => match[1]);
  const expected = Object.freeze([
    ['seedance_25', 'Seedance 2.5'],
    ['polza_kling_v3_0r3wzac', 'Kling 3.0'],
    ['polza_google_veo3_fast_0js3z3z', 'Veo 3.1 Fast'],
    ['flux_3', 'FLUX 3']
  ]);
  const callbacks = new Set(message.reply_markup.inline_keyboard.flat()
    .map(({ callback_data }) => callback_data));

  assert.deepEqual(recommendationNames, expected.map(([, name]) => name));
  assert.doesNotMatch(guide, /Seedance 2\.0|Motion Control/iu);
  for (const [id, name] of expected) {
    const model = getModelById(id);
    assert.equal(model?.name, name, id);
    assert.equal(exactProviderRoutesFor(model.providerModelId)[0]?.provider, 'routerai', id);
    assert.ok(callbacks.has(`model:${id}`), id);
  }
});

test('LLM navigation folds Yandex into the open family and names research Perplexity', () => {
  const category = buildModelCategoryMessage('llm');
  const familyButtons = category.reply_markup.inline_keyboard.flat();
  const open = buildLlmFamilyMessage('other');
  const openModelIds = open.reply_markup.inline_keyboard.flat()
    .map(({ callback_data }) => callback_data)
    .filter((callbackData) => callbackData?.startsWith('model:'))
    .map((callbackData) => callbackData.slice(6));
  const perplexity = buildLlmFamilyMessage('search');

  assert.doesNotMatch(category.text, /поиск\s*\/\s*research/iu);
  assert.doesNotMatch(category.text, /для новостей, цен и проверки фактов/iu);
  assert.equal(familyButtons.some(({ callback_data }) => callback_data === 'family:russian'), false);
  assert.ok(familyButtons.some(({ callback_data, text }) => callback_data === 'family:search' && /Perplexity/u.test(text)));
  for (const id of ['yandexgpt_51_pro', 'yandexgpt_5_pro', 'yandexgpt_5_lite', 'alice_ai']) {
    assert.ok(openModelIds.includes(id), id);
  }
  assert.match(perplexity.text, /^<b>Perplexity<\/b>/u);
  assert.doesNotMatch(perplexity.text, /поиск\s*\/\s*research/iu);
  assert.deepEqual(buildLlmFamilyMessage('russian'), open);
});

test('LLM families expose GLM separately and rename the merged family open-source', () => {
  const category = buildModelCategoryMessage('llm');
  const familyButtons = category.reply_markup.inline_keyboard.flat();
  const open = buildLlmFamilyMessage('other');
  const glm = buildLlmFamilyMessage('glm');
  const modelIds = (message) => message.reply_markup.inline_keyboard.flat()
    .map(({ callback_data }) => callback_data)
    .filter((callbackData) => callbackData?.startsWith('model:'))
    .map((callbackData) => callbackData.slice(6));
  const expectedGlmIds = [
    'glm_53', 'glm_52',
    'polza_z_ai_glm_4_5_188dzjz', 'polza_z_ai_glm_4_5_air_05nem5u',
    'polza_z_ai_glm_4_5v_0hehotn', 'polza_z_ai_glm_4_6_18idl8y',
    'polza_z_ai_glm_4_6v_0cerzu4', 'polza_z_ai_glm_4_7_18sd6xx',
    'polza_z_ai_glm_4_7_flash_0fofa0y', 'polza_z_ai_glm_5_1xphcfl',
    'polza_z_ai_glm_5_turbo_04qtxrk', 'polza_z_ai_glm_5_1_18dwyb8',
    'polza_z_ai_glm_5v_turbo_0r4729g'
  ];

  assert.doesNotMatch(category.text, /для новостей, цен и проверки фактов/iu);
  assert.ok(familyButtons.some(({ callback_data, text }) => (
    callback_data === 'family:other' && /open-source/u.test(text)
  )));
  assert.ok(familyButtons.some(({ callback_data, text }) => (
    callback_data === 'family:glm' && /GLM/u.test(text)
  )));
  assert.match(open.text, /^<b>open-source<\/b>/u);
  assert.match(glm.text, /^<b>GLM<\/b>/u);
  assert.deepEqual(modelIds(glm).sort(), expectedGlmIds.sort());
  assert.ok(modelIds(open).every((id) => !expectedGlmIds.includes(id)));
  assert.ok(modelIds(open).includes('yandexgpt_51_pro'));
});

test('every remaining card keeps valid Telegram HTML, navigation and price', () => {
  for (const model of listCatalogModels()) {
    const card = buildModelCard(model);
    assert.equal(card.parse_mode, 'HTML', model.id);
    assert.match(card.text, /^<b>[^<]+<\/b>/u, model.id);
    assert.doesNotMatch(card.text, /<script|undefined|null/iu, model.id);
    assert.ok(card.reply_markup.inline_keyboard.flat().some(({ callback_data }) =>
      /^(?:modelcat|family|toolcat):/u.test(callback_data ?? '')), `${model.id}: no back navigation`);
  }
});

test('settings and configured screens remain native and price-consistent', () => {
  for (const id of ['gpt_56_terra', 'qwen_image_3', 'wan_27', 'mai_voice_2']) {
    const model = getModelById(id);
    assert.ok(model, id);
    const settings = defaultModelSettings(model);
    assert.equal(Object.keys(settings).length, inputProfileFor(model).length, id);
    assert.ok(calculateModelMetacoinPrice(model, settings) > 0, id);
    for (const message of [buildModelSettingsMessage(model), buildModelConfiguredMessage(model, settings), buildModelSelectedMessage(model, settings)]) {
      if (message.parse_mode !== undefined) assert.equal(message.parse_mode, 'HTML', id);
      assert.doesNotMatch(message.text, /undefined|null/iu, id);
      assert.ok(message.reply_markup.inline_keyboard.flat().every(({ callback_data }) =>
        Buffer.byteLength(callback_data, 'utf8') <= 64), id);
    }
  }
});
