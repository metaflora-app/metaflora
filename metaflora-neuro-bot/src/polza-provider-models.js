const aliases = {
  gpt_56_luna: 'openai/gpt-5.6-luna', gpt_56_luna_pro: 'openai/gpt-5.6-luna-pro',
  gpt_56_terra: 'openai/gpt-5.6-terra', gpt_56_terra_pro: 'openai/gpt-5.6-terra-pro',
  gpt_55: 'openai/gpt-5.5', gpt_55_pro: 'openai/gpt-5.5-pro',
  gpt_54: 'openai/gpt-5.4', gpt_54_pro: 'openai/gpt-5.4-pro', gpt_54_mini: 'openai/gpt-5.4-mini', gpt_54_nano: 'openai/gpt-5.4-nano',
  gpt_53_chat: 'openai/gpt-5.3-chat', gpt_53_codex: 'openai/gpt-5.3-codex',
  gpt_52: 'openai/gpt-5.2', gpt_52_pro: 'openai/gpt-5.2-pro', gpt_52_codex: 'openai/gpt-5.2-codex',
  gpt_5: 'openai/gpt-5', gpt_5_pro: 'openai/gpt-5-pro', gpt_5_mini: 'openai/gpt-5-mini', gpt_5_nano: 'openai/gpt-5-nano', gpt_5_codex: 'openai/gpt-5-codex',
  gpt_41: 'openai/gpt-4.1', gpt_41_mini: 'openai/gpt-4.1-mini', gpt_41_nano: 'openai/gpt-4.1-nano', gpt_4o: 'openai/gpt-4o', gpt_4o_mini: 'openai/gpt-4o-mini',
  o3: 'openai/o3', o3_pro: 'openai/o3-pro', o4_mini: 'openai/o4-mini',
  claude_opus_5: 'anthropic/claude-opus-5', claude_sonnet_5: 'anthropic/claude-sonnet-5', claude_fable_5: 'anthropic/claude-fable-5',
  claude_opus_48: 'anthropic/claude-opus-4.8', claude_opus_48_fast: 'anthropic/claude-opus-4.8-fast', claude_opus_47: 'anthropic/claude-opus-4.7', claude_opus_46: 'anthropic/claude-opus-4.6', claude_haiku_45: 'anthropic/claude-haiku-4.5',
  gemini_36_flash: 'google/gemini-3.6-flash', gemini_35_flash: 'google/gemini-3.5-flash', gemini_35_flash_lite: 'google/gemini-3.5-flash-lite', gemini_31_flash_lite: 'google/gemini-3.1-flash-lite', gemini_31_pro: 'google/gemini-3.1-pro-preview',
  gemini_31_custom_preview: 'google/gemini-3.1-pro-preview-customtools', gemini_31_pro_preview: 'google/gemini-3.1-pro-preview', gemini_3_flash_preview: 'google/gemini-3-flash-preview', gemini_25_pro: 'google/gemini-2.5-pro', gemini_25_flash: 'google/gemini-2.5-flash',
  grok_45: 'x-ai/grok-4.5', grok_43: 'x-ai/grok-4.3', grok_420: 'x-ai/grok-4.20', grok_build: 'x-ai/grok-build-0.1',
  kimi_k3: 'moonshotai/kimi-k3', kimi_k27_code: 'moonshotai/kimi-k2.7-code', kimi_k26: 'moonshotai/kimi-k2.6', kimi_k25: 'moonshotai/kimi-k2.5', kimi_k2_thinking: 'moonshotai/kimi-k2-thinking',
  deepseek_v4_pro: 'deepseek/deepseek-v4-pro', deepseek_v4_flash: 'deepseek/deepseek-v4-flash', deepseek_v4_flash_0731: 'deepseek/deepseek-v4-flash-0731', deepseek_v32: 'deepseek/deepseek-v3.2', deepseek_v32_exp: 'deepseek/deepseek-v3.2-exp', deepseek_r1: 'deepseek/deepseek-r1',
  qwen_37_max: 'qwen/qwen3.7-max', qwen_38_max: 'qwen/qwen3.8-max', qwen_36_flash: 'qwen/qwen3.6-flash', qwen_36_max_preview: 'qwen/qwen3.6-max-preview', qwen_3_coder: 'qwen/qwen3-coder', qwen_3_coder_next: 'qwen/qwen3-coder-next', qwen_3_vl: 'qwen/qwen3-vl-235b-a22b-instruct',
  minimax_m3: 'minimax/minimax-m3', minimax_m27: 'minimax/minimax-m2.7', minimax_m25: 'minimax/minimax-m2.5', glm_52: 'z-ai/glm-5.2', tencent_hy3: 'tencent/hy3', step_37_flash: 'stepfun/step-3.7-flash',
  mistral_small_4: 'mistralai/mistral-small-2603', mistral_medium_35: 'mistralai/mistral-medium-3-5', mistral_large_3: 'mistralai/mistral-large-2512', codestral: 'mistralai/codestral-2508', nemotron_3_ultra: 'nvidia/nemotron-3-ultra-550b-a55b',
  llama_4_maverick: 'meta-llama/llama-4-maverick', llama_4_scout: 'meta-llama/llama-4-scout',
  sonar: 'perplexity/sonar', sonar_pro: 'perplexity/sonar-pro', sonar_search: 'perplexity/sonar-pro-search', sonar_research: 'perplexity/sonar-deep-research', sonar_reasoning: 'perplexity/sonar-reasoning-pro',
  yandexgpt_51_pro: 'yandex/yandexgpt-5.1-pro', yandexgpt_5_pro: 'yandex/yandexgpt-5-pro', yandexgpt_5_lite: 'yandex/yandexgpt-5-lite', alice_ai: 'yandex/aliceai-llm',
  gigachat_2_max: 'sber/gigachat-2-max', gigachat_2_pro: 'sber/gigachat-2-pro', gigachat_2: 'sber/gigachat-2',
  gpt_image_2: 'openai/gpt-5.4-image-2',
  nano_banana_pro: 'google/gemini-3-pro-image-preview',
  nano_banana_2: 'google/gemini-3.1-flash-image',
  nano_banana_2_lite: 'google/gemini-3.1-flash-lite-image',
  seedance_20: 'bytedance/seedance-2', seedance_20_fast: 'bytedance/seedance-2-fast', seedance_20_mini: 'bytedance/seedance-2-mini'
};

export const POLZA_PROVIDER_MODELS = Object.freeze(Object.fromEntries(
  Object.entries(aliases).map(([id, providerModel]) => [id, Object.freeze([providerModel])])
));
