const CHECKED_AT = '2026-08-12';

const llm = ({
  name,
  providerModelId,
  inputRublesPerMillion,
  outputRublesPerMillion,
  contextLength,
  supportedParameters,
  checkedAt = CHECKED_AT
}) => Object.freeze({
  name,
  provider: 'routerai',
  providerModelId,
  providerModels: Object.freeze([providerModelId]),
  availability: 'available',
  contextLength,
  supportedParameters: Object.freeze(supportedParameters),
  providerPricing: Object.freeze({
    type: 'llm_tokens',
    inputRublesPerMillion,
    outputRublesPerMillion,
    source: `https://routerai.ru/models/${providerModelId}`,
    checkedAt,
    provider: 'routerai',
    providerModelId
  })
});

const media = ({ name, category, providerModelId, providerPricing, supportedParameters = [], availability = 'blocked', checkedAt = CHECKED_AT }) => Object.freeze({
  name,
  category,
  provider: 'routerai',
  providerModelId,
  providerModels: Object.freeze([providerModelId]),
  availability,
  supportedParameters: Object.freeze(supportedParameters),
  providerPricing: Object.freeze({
    ...providerPricing,
    source: `https://routerai.ru/models/${providerModelId}`,
    checkedAt,
    provider: 'routerai',
    providerModelId
  })
});

const image = (name, providerModelId, rubles, supportedParameters) => media({
  name, category: 'image', providerModelId, supportedParameters, availability: 'available',
  providerPricing: { type: 'request_units', minRublesPerRequest: rubles, maxRublesPerRequest: rubles }
});
const video = (name, providerModelId, rublesPerSecond, supportedParameters, checkedAt = CHECKED_AT) => media({
  name, category: 'video', providerModelId, supportedParameters, availability: 'available',
  checkedAt,
  providerPricing: { type: 'video_seconds', minRublesPerSecond: rublesPerSecond, maxRublesPerSecond: rublesPerSecond }
});
const speech = (name, providerModelId, rublesPerThousandCharacters, supportedParameters = []) => media({
  name, category: 'voice', providerModelId,
  supportedParameters: [...new Set(['voice', 'response_format', ...supportedParameters])],
  availability: 'available',
  providerPricing: { type: 'character_million', minRublesPerMillionCharacters: rublesPerThousandCharacters * 1_000, maxRublesPerMillionCharacters: rublesPerThousandCharacters * 1_000 }
});
const transcription = (
  name,
  providerModelId,
  inputRublesPerMillion,
  outputRublesPerMillion,
  supportedParameters = []
) => media({
  name,
  category: 'voice',
  providerModelId,
  supportedParameters,
  availability: 'available',
  providerPricing: { type: 'llm_tokens', inputRublesPerMillion, outputRublesPerMillion }
});
const transcriptionMinutes = (name, providerModelId, rublesPerMinute, supportedParameters = [], checkedAt = CHECKED_AT) => media({
  name,
  category: 'voice',
  providerModelId,
  supportedParameters,
  availability: 'available',
  checkedAt,
  providerPricing: {
    type: 'audio_minutes',
    minRublesPerMinute: rublesPerMinute,
    maxRublesPerMinute: rublesPerMinute
  }
});

const STANDARD = ['max_tokens', 'temperature'];
const REASONING = ['max_tokens', 'temperature', 'reasoning_effort'];
const TOOLS = ['max_tokens', 'temperature', 'tool_choice', 'tools'];
const REASONING_TOOLS = [...REASONING, 'tool_choice', 'tools'];

export const ROUTERAI_DIRECT_MODELS = Object.freeze({
  gpt_56_sol: llm({ name: 'GPT-5.6 Sol', providerModelId: 'openai/gpt-5.6-sol', inputRublesPerMillion: 271, outputRublesPerMillion: 1625, contextLength: 1_000_000, supportedParameters: ['max_tokens', 'seed', 'response_format', 'structured_outputs', 'tool_choice', 'tools', 'reasoning', 'include_reasoning'], checkedAt: '2026-08-21' }),
  gpt_56_sol_pro: llm({ name: 'GPT-5.6 Sol Pro', providerModelId: 'openai/gpt-5.6-sol-pro', inputRublesPerMillion: 284, outputRublesPerMillion: 1707, contextLength: 1_000_000, supportedParameters: ['max_tokens', 'seed', 'response_format', 'structured_outputs', 'tool_choice', 'tools', 'reasoning', 'include_reasoning'], checkedAt: '2026-08-21' }),
  ox_alpha: llm({
    name: 'Ox Alpha',
    providerModelId: 'stealth/ox-alpha',
    inputRublesPerMillion: 0,
    outputRublesPerMillion: 0,
    contextLength: 1_000_000,
    supportedParameters: ['max_tokens', 'temperature', 'top_p', 'response_format', 'top_k', 'tool_choice', 'tools', 'reasoning', 'include_reasoning'],
    checkedAt: '2026-08-21'
  }),
  glm_53: llm({ name: 'GLM 5.3', providerModelId: 'z-ai/glm-5.3', inputRublesPerMillion: 154, outputRublesPerMillion: 486, contextLength: 1_000_000, supportedParameters: REASONING_TOOLS, checkedAt: '2026-08-20' }),
  gemini_37_flash: llm({
    name: 'Gemini 3.7 Flash',
    providerModelId: 'google/gemini-3.7-flash',
    inputRublesPerMillion: 41,
    outputRublesPerMillion: 207,
    contextLength: 1_000_000,
    supportedParameters: ['max_tokens', 'temperature', 'top_p', 'seed', 'response_format', 'stop', 'structured_outputs', 'tool_choice', 'tools', 'reasoning', 'include_reasoning'],
    checkedAt: '2026-08-20'
  }),
  qwen_38_27b: llm({
    name: 'Qwen3.8 27B',
    providerModelId: 'qwen/qwen3.8-27b',
    inputRublesPerMillion: 44,
    outputRublesPerMillion: 332,
    contextLength: 1_000_000,
    supportedParameters: ['max_tokens', 'temperature', 'top_p', 'seed', 'logprobs', 'top_logprobs', 'response_format', 'stop', 'frequency_penalty', 'presence_penalty', 'repetition_penalty', 'top_k', 'logit_bias', 'structured_outputs', 'tool_choice', 'tools', 'reasoning', 'include_reasoning'],
    checkedAt: '2026-08-20'
  }),
  hy_mt2_30b_a3b: llm({
    name: 'Hy-MT2-30B-A3B',
    providerModelId: 'tencent/hy-mt2-30b-a3b',
    inputRublesPerMillion: 8,
    outputRublesPerMillion: 32,
    contextLength: 8_000,
    supportedParameters: ['max_tokens', 'temperature', 'response_format', 'stop', 'structured_outputs'],
    checkedAt: '2026-08-20'
  }),
  hy_mt2_18b: llm({ name: 'Hy-MT2-1.8B', providerModelId: 'tencent/hy-mt2-1.8b', inputRublesPerMillion: 4.77, outputRublesPerMillion: 19, contextLength: 8_000, supportedParameters: ['max_tokens', 'temperature', 'stop'], checkedAt: '2026-08-21' }),
  qwen_37_flash: llm({ name: 'Qwen 3.7 Flash', providerModelId: 'qwen/qwen3.7-flash', inputRublesPerMillion: 3.2125938, outputRublesPerMillion: 13.9212398, contextLength: 1_000_000, supportedParameters: REASONING_TOOLS }),
  ling_30_flash: llm({ name: 'InclusionAI Ling 3.0 Flash', providerModelId: 'inclusionai/ling-3.0-flash', inputRublesPerMillion: 2.24881566, outputRublesPerMillion: 6.74644698, contextLength: 262_144, supportedParameters: REASONING_TOOLS }),
  longcat_20: llm({ name: 'LongCat 2.0', providerModelId: 'meituan/longcat-2.0', inputRublesPerMillion: 32.125938, outputRublesPerMillion: 128.503752, contextLength: 1_048_756, supportedParameters: REASONING_TOOLS }),
  reka_flash_3: llm({ name: 'Reka Flash 3', providerModelId: 'rekaai/reka-flash-3', inputRublesPerMillion: 10.708646, outputRublesPerMillion: 21.417292, contextLength: 65_536, supportedParameters: STANDARD }),
  seed_20_code: llm({ name: 'ByteDance Seed 2.0 Code', providerModelId: 'bytedance-seed/seed-2.0-code', inputRublesPerMillion: 53.54323, outputRublesPerMillion: 321.25938, contextLength: 262_144, supportedParameters: REASONING_TOOLS }),
  nemotron_35_lightning: llm({ name: 'NVIDIA Nemotron 3.5 Lightning', providerModelId: 'nvidia/nemotron-3.5-lightning', inputRublesPerMillion: 5.3948505, outputRublesPerMillion: 21.579402, contextLength: 1_000_000, supportedParameters: REASONING_TOOLS }),
  grok_46: llm({ name: 'SpaceXAI: Grok 4.6', providerModelId: 'x-ai/grok-4.6', inputRublesPerMillion: 228.75, outputRublesPerMillion: 686.25, contextLength: 500_000, supportedParameters: REASONING_TOOLS }),
  deepseek_v4_pro_0813: llm({ name: 'DeepSeek: DeepSeek V4 Pro 0813', providerModelId: 'deepseek/deepseek-v4-pro-0813', inputRublesPerMillion: 49.75, outputRublesPerMillion: 99.51, contextLength: 1_048_576, supportedParameters: REASONING_TOOLS }),
  solar_pro_4: llm({ name: 'Solar Pro 4', providerModelId: 'upstage/solar-pro4', inputRublesPerMillion: 3.2125938, outputRublesPerMillion: 12.8503752, contextLength: 524_288, supportedParameters: REASONING_TOOLS }),
  muse_glimmer_30b: llm({ name: 'Meta Muse Glimmer 30B', providerModelId: 'meta/muse-glimmer-30b', inputRublesPerMillion: 32.125938, outputRublesPerMillion: 128.503752, contextLength: 131_072, supportedParameters: REASONING_TOOLS }),
  muse_spark_12: llm({ name: 'Meta Muse Spark 1.2', providerModelId: 'meta/muse-spark-1.2', inputRublesPerMillion: 147.2438825, outputRublesPerMillion: 500.6292005, contextLength: 1_048_576, supportedParameters: REASONING_TOOLS }),
  dolphin_mistral_venice: llm({ name: 'Dolphin Mistral Venice', providerModelId: 'cognitivecomputations/dolphin-mistral-24b-venice-edition', inputRublesPerMillion: 21.417292, outputRublesPerMillion: 96.377814, contextLength: 128_000, supportedParameters: STANDARD }),
  sakana_namazu: llm({ name: 'Sakana Namazu', providerModelId: 'sakana/namazu', inputRublesPerMillion: 101.732137, outputRublesPerMillion: 428.34584, contextLength: 262_144, supportedParameters: ['reasoning_effort', 'tool_choice', 'tools', 'web_search'] }),
  inkling_small: llm({ name: 'Thinking Machines Inkling Small', providerModelId: 'thinkingmachines/inkling-small', inputRublesPerMillion: 48.188907, outputRublesPerMillion: 128.503752, contextLength: 524_288, supportedParameters: REASONING_TOOLS }),

  flux_2_max: image('FLUX.2 Max', 'black-forest-labs/flux.2-max', 1.830090869140625, ['aspect_ratio', 'output_format', 'n', 'input_references', 'seed']),
  mai_image_25: image('MAI Image 2.5', 'microsoft/mai-image-2.5', 5.03306362, ['aspect_ratio', 'n', 'input_references']),
  mai_image_25_pro: image('MAI Image 2.5 Pro', 'microsoft/mai-image-2.5-pro', 11.56533768, ['aspect_ratio', 'n', 'input_references']),
  krea_2_large: image('Krea 2 Large', 'krea/krea-2-large', 6.4251876, ['resolution', 'aspect_ratio', 'input_references', 'seed']),
  krea_2_medium: image('Krea 2 Medium', 'krea/krea-2-medium', 3.2125938, ['resolution', 'aspect_ratio', 'input_references', 'seed']),
  krea_2_turbo: image('Krea 2 Medium Turbo', 'krea/krea-2-medium-turbo', 1.6062969, ['resolution', 'aspect_ratio', 'input_references', 'seed']),
  qwen_image_3: image('Qwen Image 3', 'qwen/qwen-image-3', 3.2125938, ['resolution', 'aspect_ratio', 'n', 'input_references', 'seed']),
  qwen_image_3_pro: image('Qwen Image 3 Pro', 'qwen/qwen-image-3-pro', 4.2834584, ['resolution', 'aspect_ratio', 'n', 'input_references', 'seed']),
  recraft_41_pro: image('Recraft 4.1 Pro', 'recraft/recraft-v4.1-pro', 22.4881566, ['aspect_ratio', 'n', 'input_references']),
  recraft_41_vector: image('Recraft 4.1 Vector', 'recraft/recraft-v4.1-vector', 8.5669168, ['aspect_ratio', 'n', 'input_references']),
  recraft_41_pro_vector: image('Recraft 4.1 Pro Vector', 'recraft/recraft-v4.1-pro-vector', 32.125938, ['aspect_ratio', 'n', 'input_references']),
  grok_image_20: image('Grok Imagine Image 2.0', 'x-ai/grok-imagine-image-2.0', 4.2834584, ['resolution', 'aspect_ratio', 'quality', 'n', 'input_references']),
  minimax_h3: video('MiniMax H3', 'minimax/hailuo-3', 14, ['aspect_ratio', 'duration', 'resolution', 'frame_images', 'input_references', 'generate_audio', 'aigc_watermark']),
  riverflow_25_pro: image('Riverflow 2.5 Pro', 'sourceful/riverflow-v2.5-pro', 13.9212398, ['resolution', 'aspect_ratio', 'output_format', 'background', 'n', 'input_references']),
  riverflow_25_fast: image('Riverflow 2.5 Fast', 'sourceful/riverflow-v2.5-fast', 2.03464274, ['resolution', 'aspect_ratio', 'output_format', 'background', 'n', 'input_references']),
  nano_banana_pro: image('Nano Banana Pro', 'google/gemini-3-pro-image', 13.2621216, ['aspect_ratio', 'resolution', 'output_format', 'web_search', 'input_references']),
  nano_banana_2: image('Nano Banana 2', 'google/gemini-3.1-flash-image', 54.65, ['aspect_ratio', 'resolution', 'output_format', 'web_search', 'input_references']),
  nano_banana_2_lite: image('Nano Banana 2 Lite', 'google/gemini-3.1-flash-lite-image', 27.33, ['aspect_ratio', 'resolution', 'output_format', 'web_search', 'input_references']),
  gpt_image_2: media({
    name: 'GPT Image 2',
    category: 'image',
    providerModelId: 'openai/gpt-5.4-image-2',
    supportedParameters: ['aspect_ratio', 'quality', 'output_format', 'input_references'],
    availability: 'available',
    checkedAt: '2026-08-21',
    providerPricing: { type: 'request_units', minRublesPerRequest: 1, maxRublesPerRequest: 11 }
  }),
  gpt_5_image: image('GPT-5 Image', 'openai/gpt-5-image', 27.1, ['aspect_ratio', 'quality', 'num_images', 'input_references']),
  gpt_5_image_mini: image('GPT-5 Image Mini', 'openai/gpt-5-image-mini', 5.5, ['aspect_ratio', 'quality', 'num_images', 'input_references']),

  wan_27: video('Wan 2.7', 'alibaba/wan-2.7', 10.708646, ['negative_prompt', 'prompt_extend', 'audio', 'ratio', 'last_image', 'video', 'videos', 'images']),
  veo_31_lite: video('Veo 3.1 Lite', 'google/veo-3.1-lite', 5.354323, ['personGeneration', 'aspectRatio', 'negativePrompt', 'conditioningScale', 'enhancePrompt']),
  kling_video_o1: video('Kling Video O1', 'kwaivgi/kling-video-o1', 11.99368352, ['negative_prompt']),
  sora_2_pro: video('Sora 2 Pro', 'openai/sora-2-pro', 32.125938, ['quality', 'style']),
  runway_gen_45: video('Runway Gen-4.5', 'runway/gen-4.5', 12.8503752, ['contentModeration']),
  runway_aleph_2: video('Runway Aleph 2.0', 'runway/aleph-2', 29.9842088, ['contentModeration', 'keyframes']),
  grok_imagine_video_15: video('Grok Imagine Video 1.5', 'x-ai/grok-imagine-video-1.5', 8.5669168, []),
  mai_voice_2: speech('MAI Voice 2', 'microsoft/mai-voice-2', 2.35590212, ['temperature', 'top_p']),
  mai_voice_2_flash: speech('MAI Voice 2 Flash', 'microsoft/mai-voice-2-flash', 1.6062969, ['temperature', 'top_p']),
  grok_voice_tts_10: speech('Grok Voice TTS 1.0', 'x-ai/grok-voice-tts-1.0', 1.6062969, ['temperature', 'top_p', 'seed', 'response_format']),
  voxtral_mini_tts: speech('Voxtral Mini TTS', 'mistralai/voxtral-mini-tts-2603', 1.71338336, ['temperature', 'top_p', 'seed', 'response_format']),
  qwen_audio_tts_flash: speech('Qwen Audio 3.0 TTS Flash', 'qwen/qwen-audio-3.0-tts-flash', 1.6062969, ['temperature', 'top_p', 'seed', 'response_format']),
  qwen_audio_tts_plus: speech('Qwen Audio 3.0 TTS Plus', 'qwen/qwen-audio-3.0-tts-plus', 2.1417292, ['temperature', 'top_p', 'seed', 'response_format']),
  fish_audio_s21_pro: speech('Fish Audio S2.1 Pro', 'fish-audio/s2.1-pro', 1.6062969),
  orpheus_3b: speech('Orpheus 3B', 'canopylabs/orpheus-3b-0.1-ft', 0.74960522, ['temperature', 'top_p', 'seed', 'response_format']),
  kokoro_82m: speech('Kokoro 82M', 'hexgrad/kokoro-82m', 0.0663936052, ['temperature', 'top_p', 'seed', 'response_format']),
  sesame_csm_1b: speech('Sesame CSM 1B', 'sesame/csm-1b', 0.74960522, ['temperature', 'top_p', 'seed', 'response_format']),
  nemotron_35_asr_streaming: transcriptionMinutes(
    'Nemotron 3.5 ASR Streaming Multilingual 0.6B',
    'nvidia/nemotron-3.5-asr-streaming-multilingual-0.6b',
    0.02,
    ['max_tokens', 'temperature', 'top_p', 'seed', 'response_format', 'stop', 'frequency_penalty', 'presence_penalty', 'repetition_penalty', 'top_k', 'min_p'],
    '2026-08-21'
  ),
  gpt_4o_transcribe: transcription(
    'GPT-4o Transcribe',
    'openai/gpt-4o-transcribe',
    274,
    1099,
    ['max_tokens', 'temperature', 'top_p', 'seed', 'logprobs', 'top_logprobs', 'response_format', 'stop', 'frequency_penalty', 'presence_penalty', 'logit_bias', 'structured_outputs']
  )
});
