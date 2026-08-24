import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createProductCatalogView } from "./product-catalog.js";

test("product catalog view preserves operational coverage and strips sensitive fields", () => {
  const view = createProductCatalogView({
    schemaVersion: "1.0.0",
    release: { version: "2026.08.13", sourceHash: "abc" },
    summary: { models: 1, agents: 1, tools: 1, workflows: 1, voices: 1, entertainments: 1 },
    models: [{ id: "model", name: "Model", category: "text", settings: ["reasoning"], systemPrompt: "secret" }],
    agents: [{ id: "agent", name: "Agent", category: "business", active: true, systemPrompt: "secret" }],
    tools: [{ id: "tool", name: "Tool", category: "photo", active: true, endpoint: "secret" }],
    workflows: [{ id: "flow", name: "Flow", category: "voice", active: true, providerToken: "secret" }],
    entertainments: [{ id: "fun", name: "игра", category: "entertainment", description: "безопасная карточка", inputHint: "начни", safety: "не диагноз", systemPrompt: "secret" }],
    coverage: [{ id: "video-builder", label: "режимы видео", state: "ready", scope: "video" }],
    voiceProfile: { curatedCount: 1, customVoiceSupported: true, sensitiveFieldsExposed: false, voiceId: "secret" },
  });

  assert.equal(view.summary.models, 1);
  assert.equal(view.summary.entertainments, 1);
  assert.equal(view.entertainments[0].description, "безопасная карточка");
  assert.equal(view.voiceProfile.sensitiveFieldsExposed, false);
  assert.equal(JSON.stringify(view).includes("secret"), false);
  assert.deepEqual(Object.keys(view.models[0]).sort(), ["category", "id", "modes", "name", "settings"].sort());
  assert.deepEqual(Object.keys(view.entertainments[0]).sort(), ["accepts", "category", "description", "entryOptions", "flowKind", "id", "inputHint", "name", "output", "readiness"].sort());
});

test("generated catalog exposes RouterAI additions and excludes retired provider cards", async () => {
  const manifest = JSON.parse(await readFile(
    new URL("../src/generated/product-catalog.v1.json", import.meta.url),
    "utf8",
  ));
  const modelIds = new Set(manifest.models.map(({ id }) => id));

  for (const id of [
    "kling_video_o1",
    "veo_31_lite",
    "wan_27",
    "qwen_image_3",
    "qwen_image_3_pro",
    "fish_audio_s21_pro",
    "mai_voice_2",
    "glm_53",
    "gemini_37_flash",
    "qwen_38_27b",
    "hy_mt2_30b_a3b",
    "gpt_4o_transcribe",
    "gpt_oss_20b_free",
    "nemotron_3_ultra_free",
    "nemotron_3_super_free",
    "gemma_4_31b_free",
    "north_mini_code_free",
    "nemotron_3_nano_omni_free",
    "ox_alpha",
    "flux_video_upscale",
    "nemotron_35_asr_streaming",
    "gpt_56_sol",
    "gpt_56_sol_pro",
    "hy_mt2_18b",
    "minimax_h3",
    "polza_mancer_weaver_1ssc57c",
    "polza_x_ai_grok_imagine_image_1e8vbmb",
  ]) {
    assert.equal(modelIds.has(id), true, `${id} must be visible in the CRM catalog`);
  }

  for (const id of [
    "polza_bytedance_seedream_1p1gj11",
    "polza_bytedance_seedream_4_0flct3o",
    "polza_kling_v2_5_turbo_17zcvnf",
    "polza_kling_v2_6_0fxm8wn",
    "polza_wan_2_5_0k8ohet",
    "polza_openai_tts_1_19bzocj",
    "polza_openai_tts_1_hd_1dyowdi",
    "gpt_53_chat",
    "gpt_5_codex",
    "o3_pro",
    "polza_google_gemini_3_pro_preview_0li4nuj",
    "polza_ai21_jamba_large_1_7_0p8ngfb",
    "gigachat_2_max",
    "gigachat_2_pro",
    "gigachat_2",
    "polza_sber_gigachat_1sbag2e",
    "polza_sber_gigachat_max_00ud1d1",
    "polza_sber_gigachat_plus_1d2dn75",
    "polza_sber_gigachat_pro_03opyas",
    "polza_openai_gpt_image_1_5_0wv2v9y",
    "polza_qwen_image_0i0mbk0",
    "polza_qwen_image_2_0m85awv",
    "polza_yandex_yandex_art_0wl8wis",
    "polza_ai_sage_gigaam_v3_146z2tr",
    "polza_aiesa_transcribe_0eontc0",
    "polza_aiesa_transcribe_fast_1yltowx",
    "polza_openai_gpt_4o_mini_tts_0f5jo5v",
    "polza_aiesa_aiesa_mini_0yyg60s",
    "polza_aiesa_aiesa_pro_07f9hsi",
    "polza_sakana_fugu_ultra_0wuxm6z",
  ]) {
    assert.equal(modelIds.has(id), false, `${id} must stay retired from the CRM catalog`);
  }
});

test("generated catalog preserves Suno and removes unsupported specialist cards", async () => {
  const manifest = JSON.parse(await readFile(
    new URL("../src/generated/product-catalog.v1.json", import.meta.url),
    "utf8",
  ));
  const modelsById = new Map(manifest.models.map((model) => [model.id, model]));
  const preservedCards = new Map([
    ["polza_suno_generate_1xai46g", "Suno Music Generate"],
    ["polza_suno_mashup_0e1mpc3", "Suno Mashup"],
    ["polza_suno_sounds_1lwz9xr", "Suno Sounds"],
    ["polza_topaz_image_upscale_1qyj2i9", "Topaz Upscale"],
    ["polza_topaz_video_upscale_11v3tgv", "Topaz Video Upscale"],
  ]);

  for (const [id, name] of preservedCards) {
    assert.equal(modelsById.get(id)?.name, name, `${id} must preserve its public card and copy`);
  }

  for (const id of [
    "polza_tongyi_mai_z_image_0x1b58c",
    "polza_gemini_omni_video_0zgwx2i",
    "polza_kling_v2_6_motion_control_18vsbd0",
    "polza_kling_v3_motion_control_1i2kcfl",
  ]) assert.equal(modelsById.has(id), false, `${id} must stay removed`);

  assert.equal(manifest.summary.models, manifest.models.length);
  assert.equal(manifest.models.length, 394, "only the verified removals and additions may change the public catalog");
});
