import test from 'node:test';
import assert from 'node:assert/strict';

import { createUpdateHandler } from '../src/bot.js';
import { getModelById, listCatalogModels } from '../src/model-catalog.js';

const retiredModelIds = Object.freeze([
  'polza_bytedance_seedream_1p1gj11',
  'polza_bytedance_seedream_4_0flct3o',
  'polza_kling_v2_5_turbo_17zcvnf',
  'polza_kling_v2_6_0fxm8wn',
  'polza_wan_2_5_0k8ohet',
  'polza_openai_tts_1_19bzocj',
  'polza_openai_tts_1_hd_1dyowdi',
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
  'polza_sakana_fugu_ultra_0wuxm6z',
  'polza_tongyi_mai_z_image_0x1b58c',
  'polza_gemini_omni_video_0zgwx2i',
  'polza_kling_v2_6_motion_control_18vsbd0',
  'polza_kling_v3_motion_control_1i2kcfl'
]);

test('only agreed superseded cards are removed from public model surfaces', () => {
  const visibleIds = new Set(listCatalogModels().map(({ id }) => id));
  for (const modelId of retiredModelIds) {
    assert.equal(visibleIds.has(modelId), false, modelId);
    assert.equal(getModelById(modelId), null, modelId);
  }
});

test('retired model callbacks open a safe catalog fallback', async () => {
  for (const [index, modelId] of retiredModelIds.entries()) {
    const sent = [];
    const telegram = {
      async sendMessage(chatId, message) {
        sent.push({ chatId, message });
        return { message_id: 100 + sent.length };
      },
      async answerCallbackQuery() {},
      async setMyCommands() {}
    };
    const handleUpdate = createUpdateHandler({ telegram, config: {} });
    await handleUpdate({
      update_id: 91_000 + index,
      callback_query: {
        id: `retired-model-${index}`,
        data: `model:${modelId}`,
        from: { id: 10 },
        message: { message_id: 77, chat: { id: 10 } }
      }
    });
    assert.equal(sent.length, 1, modelId);
    assert.match(sent[0].message.text, /модел|каталог|текст|изображен|видео/iu, modelId);
  }
});

test('all Suno cards remain visible in the bot catalogue', () => {
  const visibleIds = new Set(listCatalogModels().map(({ id }) => id));
  for (const id of [
    'polza_suno_generate_1xai46g',
    'polza_suno_mashup_0e1mpc3',
    'polza_suno_sounds_1lwz9xr'
  ]) assert.equal(visibleIds.has(id), true, id);
});

test('Suno and RouterAI-listed Lyria remain public music exceptions', () => {
  for (const id of [
    'polza_google_lyria_3_clip_preview_067fyr0',
    'polza_google_lyria_3_pro_preview_190ii7b'
  ]) assert.notEqual(getModelById(id), null, id);
});
