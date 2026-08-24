import { describe, expect, it } from "vitest";

import { listCatalogModels } from "../../../../metaflora-neuro-bot/src/model-catalog.js";
import generatedManifest from "../../generated/product-catalog.v1.json";

describe("generated catalog integrity after RouterAI migration", () => {
  it("preserves the bot catalog while excluding only superseded cards", () => {
    const sourceIds = new Set(listCatalogModels()
      .filter(({ source }) => source !== "tool")
      .map(({ id }) => id));
    expect(generatedManifest.models.map(({ id }) => id).filter((id) => !sourceIds.has(id))).toEqual([]);
    expect(generatedManifest.summary.models).toBe(393);
    expect(generatedManifest.models).toHaveLength(393);
  });

  it("includes the August RouterAI additions", () => {
    const modelsById = new Map(generatedManifest.models.map((model) => [model.id, model]));
    expect(modelsById.get("glm_53")?.name).toBe("GLM 5.3");
    expect(modelsById.get("gemini_37_flash")?.name).toBe("Gemini 3.7 Flash");
    expect(modelsById.get("qwen_38_27b")?.name).toBe("Qwen3.8 27B");
    expect(modelsById.get("hy_mt2_30b_a3b")?.name).toBe("Hy-MT2-30B-A3B");
    expect(modelsById.get("gpt_4o_transcribe")?.name).toBe("GPT-4o Transcribe");
    expect(modelsById.get("ox_alpha")?.name).toBe("Ox Alpha");
    expect(modelsById.has("flux_video_upscale")).toBe(false);
    expect(modelsById.get("nemotron_35_asr_streaming")?.name).toBe("Nemotron 3.5 ASR Streaming Multilingual 0.6B");
    expect(modelsById.get("gpt_56_sol")?.name).toBe("GPT-5.6 Sol");
    expect(modelsById.get("gpt_56_sol_pro")?.name).toBe("GPT-5.6 Sol Pro");
    expect(modelsById.get("hy_mt2_18b")?.name).toBe("Hy-MT2-1.8B");
  });

  it("keeps restored RouterAI cards and drops unsupported specialist cards", () => {
    const ids = new Set(generatedManifest.models.map(({ id }) => id));
    for (const id of [
      "minimax_h3",
      "polza_mancer_weaver_1ssc57c",
      "polza_x_ai_grok_imagine_image_1e8vbmb",
      "polza_topaz_image_upscale_1qyj2i9",
      "polza_topaz_video_upscale_11v3tgv",
    ])
      expect(ids.has(id)).toBe(true);
    for (const id of [
      "polza_tongyi_mai_z_image_0x1b58c",
      "polza_gemini_omni_video_0zgwx2i",
      "polza_kling_v2_6_motion_control_18vsbd0",
      "polza_kling_v3_motion_control_1i2kcfl",
      "gigachat_2_max", "gigachat_2_pro", "gigachat_2",
      "polza_sber_gigachat_1sbag2e", "polza_sber_gigachat_max_00ud1d1",
      "polza_sber_gigachat_plus_1d2dn75", "polza_sber_gigachat_pro_03opyas",
    ]) expect(ids.has(id)).toBe(false);
  });

  it("preserves every public OpenRouter free card", () => {
    const ids = new Set(generatedManifest.models.map(({ id }) => id));
    for (const id of [
      "gpt_oss_20b_free",
      "nemotron_3_ultra_free",
      "nemotron_3_super_free",
      "gemma_4_31b_free",
      "north_mini_code_free",
      "nemotron_3_nano_omni_free",
    ]) expect(ids.has(id)).toBe(true);
  });
});
