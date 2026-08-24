import {
  cardProfileFor,
  defaultsFor,
  inputProfileFor as standardInputProfileFor,
  settingLabel
} from './model-profiles.js';
import { supportsImageReferences } from './image-reference-ui.js';
import {
  calculateMetacoinPrice as calculateStandardMetacoinPrice,
  calculateProviderFloorMetacoins as calculateStandardProviderFloorMetacoins,
  formatMetacoinPrice as formatStandardMetacoinPrice
} from './model-pricing.js';
import {
  TOOL_MODEL_CATEGORIES,
  buildToolCard,
  calculateToolMetacoinPrice,
  defaultToolSettings,
  formatToolMetacoinPrice,
  getToolModelById,
  listToolModels,
  toolSettingsProfileFor
} from './tool-model-adapter.js';
import {
  buildFamilyButton,
  buildModelButton,
  isNewModel,
  isTopModel,
  metacoinHtml,
  modelLogoHtml
} from './brand-icons.js';
import { catalogExpansion } from './catalog-expansion.js';
import { freeEntitlementFor, isFreeModelId } from './generation-access.js';
import { POLZA_PROVIDER_MODELS } from './polza-provider-models.js';
import { ROUTERAI_DIRECT_MODELS } from './routerai-direct-models.js';
import { exactProviderRoutesFor } from './provider-route-matrix.js';
import {
  PROVIDER_SNAPSHOT_CATEGORY_MODELS,
  PROVIDER_SNAPSHOT_LLM_MODELS_BY_FAMILY,
  PROVIDER_SNAPSHOT_MODELS_BY_ID
} from './provider-snapshot-catalog.js';

const categoryDefinitions = Object.freeze([
  ['💬 текст / код / поиск', 'llm'],
  ['🎨 изображения', 'image'],
  ['🎬 видео', 'video'],
  ['🎧 аудио / музыка', 'audio'],
  ['🎙 озвучка / расшифровка', 'voice'],
  ['🧪 бета-модели', 'beta'],
  ['🪄 ИИ-инструменты', 'tools']
]);

const popularModelsNote = '<blockquote>*звёздами отмечены самые популярные модели на данный момент</blockquote>';

const yandexTextModels = Object.freeze([
  ['yandexgpt_51_pro', 'YandexGPT Pro 5.1'],
  ['yandexgpt_5_pro', 'YandexGPT Pro 5'],
  ['yandexgpt_5_lite', 'YandexGPT Lite 5'],
  ['alice_ai', 'Alice AI']
]);

const llmFamilies = Object.freeze({
  openai: {
    name: 'GPT',
    models: [
      ['gpt_oss_20b_free', 'gpt-oss-20b free'],
      ['gpt_56_sol', 'GPT-5.6 Sol'],
      ['gpt_56_sol_pro', 'GPT-5.6 Sol Pro'],
      ['gpt_56_luna', 'GPT-5.6 Luna'],
      ['gpt_56_luna_pro', 'GPT-5.6 Luna Pro'],
      ['gpt_56_terra', 'GPT-5.6 Terra'],
      ['gpt_56_terra_pro', 'GPT-5.6 Terra Pro'],
      ['gpt_55', 'GPT-5.5'],
      ['gpt_55_pro', 'GPT-5.5 Pro'],
      ['gpt_55_codex', 'GPT-5.5 Codex'],
      ['gpt_54', 'GPT-5.4'],
      ['gpt_54_pro', 'GPT-5.4 Pro'],
      ['gpt_54_mini', 'GPT-5.4 Mini'],
      ['gpt_54_nano', 'GPT-5.4 Nano'],
      ['gpt_53_chat', 'GPT-5.3 Chat'],
      ['gpt_53_codex', 'GPT-5.3 Codex'],
      ['gpt_52', 'GPT-5.2'],
      ['gpt_52_pro', 'GPT-5.2 Pro'],
      ['gpt_52_codex', 'GPT-5.2 Codex'],
      ['gpt_5', 'GPT-5'],
      ['gpt_5_pro', 'GPT-5 Pro'],
      ['gpt_5_mini', 'GPT-5 Mini'],
      ['gpt_5_nano', 'GPT-5 Nano'],
      ['gpt_5_codex', 'GPT-5 Codex'],
      ['gpt_41', 'GPT-4.1'],
      ['gpt_41_mini', 'GPT-4.1 Mini'],
      ['gpt_41_nano', 'GPT-4.1 Nano'],
      ['gpt_4o', 'GPT-4o'],
      ['gpt_4o_mini', 'GPT-4o Mini'],
      ['o3', 'o3'],
      ['o3_pro', 'o3 Pro'],
      ['o4_mini', 'o4-mini']
    ]
  },
  anthropic: {
    name: 'Claude',
    models: [
      ['claude_opus_5', 'Claude Opus 5'],
      ['claude_sonnet_5', 'Claude Sonnet 5'],
      ['claude_fable_5', 'Claude Fable 5'],
      ['claude_opus_48', 'Claude Opus 4.8'],
      ['claude_opus_48_fast', 'Claude Opus 4.8 Fast'],
      ['claude_opus_47', 'Claude Opus 4.7'],
      ['claude_opus_46', 'Claude Opus 4.6'],
      ['claude_haiku_45', 'Claude Haiku 4.5']
    ]
  },
  google: {
    name: 'Gemini',
    models: [
      ['gemini_37_flash', 'Gemini 3.7 Flash'],
      ['gemini_36_flash', 'Gemini 3.6 Flash'],
      ['gemini_35_flash', 'Gemini 3.5 Flash'],
      ['gemini_35_flash_lite', 'Gemini 3.5 Flash Lite'],
      ['gemini_31_pro', 'Gemini 3.1 Pro'],
      ['gemini_31_flash_lite', 'Gemini 3.1 Flash Lite'],
      ['gemini_3_pro', 'Gemini 3 Pro'],
      ['gemini_3_flash', 'Gemini 3 Flash'],
      ['gemini_31_custom_preview', 'Gemini 3.1 Custom Tools Preview'],
      ['gemini_31_pro_preview', 'Gemini 3.1 Pro Preview'],
      ['gemini_3_flash_preview', 'Gemini 3 Flash Preview'],
      ['gemini_25_pro', 'Gemini 2.5 Pro'],
      ['gemini_25_flash', 'Gemini 2.5 Flash']
    ]
  },
  xai: {
    name: 'Grok',
    models: [
      ['grok_46', 'SpaceXAI: Grok 4.6'],
      ['grok_45', 'Grok 4.5'],
      ['grok_43', 'Grok 4.3'],
      ['grok_420', 'Grok 4.20'],
      ['grok_build', 'Grok Build 0.1']
    ]
  },
  kimi: {
    name: 'Kimi',
    models: [
      ['kimi_k3', 'Kimi K3'],
      ['kimi_k27_code', 'Kimi K2.7 Code'],
      ['kimi_k26', 'Kimi K2.6'],
      ['kimi_k25', 'Kimi K2.5'],
      ['kimi_k2_thinking', 'Kimi K2 Thinking']
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    models: [
      ['deepseek_v4_pro_0813', 'DeepSeek: DeepSeek V4 Pro 0813'],
      ['deepseek_v4_pro', 'DeepSeek V4 Pro'],
      ['deepseek_v4_flash', 'DeepSeek V4 Flash'],
      ['deepseek_v4_flash_0731', 'DeepSeek V4 Flash 0731'],
      ['deepseek_v32', 'DeepSeek V3.2'],
      ['deepseek_v32_exp', 'DeepSeek V3.2 Exp'],
      ['deepseek_r1', 'DeepSeek R1']
    ]
  },
  qwen: {
    name: 'Qwen',
    models: [
      ['qwen_38_27b', 'Qwen3.8 27B'],
      ['qwen_37_max', 'Qwen 3.7 Max'],
      ['qwen_38_max', 'Qwen 3.8 Max'],
      ['qwen_37_plus', 'Qwen 3.7 Plus'],
      ['qwen_37_flash', 'Qwen 3.7 Flash'],
      ['qwen_36_flash', 'Qwen 3.6 Flash'],
      ['qwen_36_max_preview', 'Qwen 3.6 Max Preview'],
      ['qwen_35_plus', 'Qwen 3.5 Plus'],
      ['qwen_3_coder', 'Qwen 3 Coder'],
      ['qwen_3_coder_next', 'Qwen 3 Coder Next'],
      ['qwen_3_vl', 'Qwen 3 VL']
    ]
  },
  glm: {
    name: 'GLM',
    models: [
      ['glm_53', 'GLM 5.3'],
      ['glm_52', 'GLM 5.2']
    ]
  },
  other: {
    name: 'open-source',
    models: [
      ['ox_alpha', 'Ox Alpha'],
      ['nemotron_3_ultra_free', 'Nemotron 3 Ultra free'],
      ['nemotron_3_super_free', 'Nemotron 3 Super free'],
      ['gemma_4_31b_free', 'Gemma 4 31B free'],
      ['north_mini_code_free', 'North Mini Code free'],
      ['nemotron_3_nano_omni_free', 'Nemotron 3 Nano Omni free'],
      ['minimax_m3', 'MiniMax M3'],
      ['minimax_m27', 'MiniMax M2.7'],
      ['minimax_m25', 'MiniMax M2.5'],
      ['hy_mt2_30b_a3b', 'Hy-MT2-30B-A3B'],
      ['hy_mt2_18b', 'Hy-MT2-1.8B'],
      ['tencent_hy3', 'Tencent Hy3'],
      ['tencent_hy3_preview', 'Tencent Hy3 Preview'],
      ['cohere_north_code', 'Cohere North Mini Code'],
      ['openrouter_fusion', 'OpenRouter Fusion'],
      ['step_37_flash', 'Step 3.7 Flash'],
      ['mistral_small_4', 'Mistral Small 4'],
      ['mistral_medium_35', 'Mistral Medium 3.5'],
      ['mistral_large_3', 'Mistral Large 3'],
      ['devstral_2', 'Devstral 2'],
      ['codestral', 'Codestral'],
      ['gemma_4', 'Gemma 4'],
      ['nemotron_3', 'Nemotron 3'],
      ['nemotron_3_ultra', 'Nemotron 3 Ultra'],
      ['llama_4_maverick', 'Llama 4 Maverick'],
      ['llama_4_scout', 'Llama 4 Scout'],
      ...yandexTextModels
    ]
  },
  search: {
    name: 'Perplexity',
    models: [
      ['sonar', 'Perplexity Sonar'],
      ['sonar_pro', 'Perplexity Sonar Pro'],
      ['sonar_search', 'Sonar Pro Search'],
      ['sonar_research', 'Sonar Deep Research'],
      ['sonar_reasoning', 'Sonar Reasoning Pro'],
      ['gpt_search', 'GPT Search'],
      ['gpt_4o_search_preview', 'GPT-4o Search Preview'],
      ['gpt_4o_mini_search_preview', 'GPT-4o Mini Search Preview']
    ]
  }
});

const categoryModels = Object.freeze({
  image: [
    ['flux_2_max', 'FLUX.2 Max'],
    ['mai_image_25', 'MAI Image 2.5'],
    ['mai_image_25_pro', 'MAI Image 2.5 Pro'],
    ['krea_2_large', 'Krea 2 Large'],
    ['krea_2_medium', 'Krea 2 Medium'],
    ['krea_2_turbo', 'Krea 2 Medium Turbo'],
    ['qwen_image_3', 'Qwen Image 3'],
    ['qwen_image_3_pro', 'Qwen Image 3 Pro'],
    ['recraft_41_pro', 'Recraft 4.1 Pro'],
    ['recraft_41_vector', 'Recraft 4.1 Vector'],
    ['recraft_41_pro_vector', 'Recraft 4.1 Pro Vector'],
    ['grok_image_20', 'Grok Imagine Image 2.0'],
    ['riverflow_25_pro', 'Riverflow 2.5 Pro'],
    ['riverflow_25_fast', 'Riverflow 2.5 Fast'],
    ['nano_banana_pro', 'Nano Banana Pro'],
    ['nano_banana_2', 'Nano Banana 2'],
    ['nano_banana_2_lite', 'Nano Banana 2 Lite'],
    ['seedream_50_pro', 'Seedream 5.0 Pro'],
    ['seedream_50_lite', 'Seedream 5.0 Lite'],
    ['seedream_45', 'Seedream 4.5'],
    ['gpt_image_2', 'GPT Image 2'],
    ['gpt_image_15', 'GPT Image 1.5'],
    ['gpt_5_image', 'GPT-5 Image'],
    ['gpt_5_image_mini', 'GPT-5 Image Mini'],
    ['sora_image', 'Sora Image'],
    ['ideogram_4', 'Ideogram 4'],
    ['ideogram_4_fast', 'Ideogram 4 Fast'],
    ['cosmos_3_super', 'NVIDIA Cosmos 3 Super'],
    ['flux_2_klein_4b', 'FLUX 2 Klein 4B'],
    ['flux_2_klein_9b', 'FLUX 2 Klein 9B'],
    ['flux_2_pro', 'FLUX 2 Pro'],
    ['flux_2_flex', 'FLUX 2 Flex'],
    ['recraft_41', 'Recraft 4.1'],
    ['higgsfield_soul', 'Higgsfield Soul'],
    ['kling_kolors', 'Kling KOLORS'],
    ['midjourney', 'Midjourney'],
    ['ideogram_3', 'Ideogram 3'],
    ['grok_image', 'Grok Image'],
    ['qwen_image_2', 'Qwen Image 2'],
    ['wan_image', 'Wan Image'],
    ['luma_image', 'Luma Image'],
    ['runway_frames', 'Runway Frames'],
    ['magnific_upscaler', 'Magnific Upscaler'],
    ['clarity_upscaler', 'Clarity Upscaler'],
    ['yandex_art', 'YandexART'],
    ...catalogExpansion.image
  ],
  video: [
    ['wan_27', 'Wan 2.7'],
    ['veo_31_lite', 'Veo 3.1 Lite'],
    ['kling_video_o1', 'Kling Video O1'],
    ['sora_2_pro', 'Sora 2 Pro'],
    ['runway_gen_45', 'Runway Gen-4.5'],
    ['runway_aleph_2', 'Runway Aleph 2.0'],
    ['minimax_h3', 'MiniMax H3'],
    ['seedance_25', 'Seedance 2.5'],
    ['flux_3', 'FLUX 3'],
    ['seedance_20', 'Seedance 2.0'],
    ['seedance_20_fast', 'Seedance 2.0 Fast'],
    ['seedance_20_mini', 'Seedance 2.0 Mini'],
    ['seedance_15_pro', 'Seedance 1.5 Pro'],
    ['kling_30', 'Kling 3.0'],
    ['kling_30_motion', 'Kling 3.0 Motion'],
    ['kling_26', 'Kling 2.6'],
    ['kling_25_turbo', 'Kling 2.5 Turbo'],
    ['veo_31_fast', 'Veo 3.1 Fast'],
    ['veo_31_quality', 'Veo 3.1 Quality'],
    ['sora_2', 'Sora 2'],
    ['wan_26', 'Wan 2.6'],
    ['wan_25', 'Wan 2.5'],
    ['runway', 'Runway'],
    ['luma_dm', 'Luma Dream Machine'],
    ['hailuo', 'Hailuo'],
    ['pika_25', 'Pika 2.5'],
    ['vidu_q2', 'Vidu Q2'],
    ['ltx_2', 'LTX-2'],
    ['hunyuan_video', 'Hunyuan Video'],
    ['mochi_1', 'Mochi 1'],
    ['higgsfield_video', 'Higgsfield Video'],
    ['heygen_video', 'HeyGen Video'],
    ['grok_imagine', 'Grok Imagine'],
    ['happyhorse_11', 'HappyHorse 1.1'],
    ['gemini_omni_video', 'Gemini Omni Video'],
    ...catalogExpansion.video
  ],
  audio: [
    ['suno_55', 'Suno 5.5'],
    ['suno_mashup', 'Suno Mashup'],
    ['suno_sounds', 'Suno Sounds'],
    ['lyria_3_pro', 'Lyria 3 Pro'],
    ['lyria_3_clip', 'Lyria 3 Clip'],
    ['eleven_music', 'ElevenLabs Music'],
    ['stable_audio', 'Stable Audio'],
    ['udio', 'Udio'],
    ['minimax_music', 'MiniMax Music'],
    ['eleven_sounds', 'ElevenLabs Sound Effects'],
    ['sfx_generator', 'генератор звуков'],
    ...catalogExpansion.audio
  ],
  voice: [
    ['nemotron_35_asr_streaming', 'Nemotron 3.5 ASR Streaming Multilingual 0.6B'],
    ['mai_voice_2', 'MAI Voice 2'],
    ['mai_voice_2_flash', 'MAI Voice 2 Flash'],
    ['grok_voice_tts_10', 'Grok Voice TTS 1.0'],
    ['voxtral_mini_tts', 'Voxtral Mini TTS'],
    ['qwen_audio_tts_flash', 'Qwen Audio 3.0 TTS Flash'],
    ['qwen_audio_tts_plus', 'Qwen Audio 3.0 TTS Plus'],
    ['fish_audio_s21_pro', 'Fish Audio S2.1 Pro'],
    ['orpheus_3b', 'Orpheus 3B'],
    ['kokoro_82m', 'Kokoro 82M'],
    ['sesame_csm_1b', 'Sesame CSM 1B'],
    ['eleven_voice', 'ElevenLabs Voice'],
    ['voice_clone', 'клонирование голоса'],
    ['openai_tts', 'OpenAI TTS'],
    ['gpt_4o_mini_tts', 'GPT-4o Mini TTS'],
    ['whisper_1', 'Whisper 1'],
    ['gpt_4o_transcribe', 'GPT-4o Transcribe'],
    ['chirp_3', 'Google Chirp 3'],
    ['qwen_asr', 'Qwen 3 ASR'],
    ['voxtral', 'Voxtral Transcribe'],
    ['gigaam_v3', 'GigaAM-v3'],
    ['parakeet_asr', 'NVIDIA Parakeet'],
    ['deepgram_nova_3', 'Deepgram Nova 3'],
    ['assembly_universal', 'AssemblyAI Universal'],
    ['cartesia_sonic', 'Cartesia Sonic'],
    ['minimax_speech', 'MiniMax Speech'],
    ...catalogExpansion.voice
  ],
  beta: [
    ['longcat_20', 'LongCat 2.0'],
    ['ling_30_flash', 'InclusionAI Ling 3.0 Flash'],
    ['reka_flash_3', 'Reka Flash 3'],
    ['seed_20_code', 'ByteDance Seed 2.0 Code'],
    ['nemotron_35_lightning', 'NVIDIA Nemotron 3.5 Lightning'],
    ['solar_pro_4', 'Solar Pro 4'],
    ['muse_glimmer_30b', 'Meta Muse Glimmer 30B'],
    ['muse_spark_12', 'Meta Muse Spark 1.2'],
    ['dolphin_mistral_venice', 'Dolphin Mistral Venice'],
    ['sakana_namazu', 'Sakana Namazu'],
    ['inkling_small', 'Thinking Machines Inkling Small'],
    ['inkling', 'Thinking Machines Inkling'],
    ['muse_spark_11', 'Muse Spark 1.1'],
    ['kat_coder_air_25', 'KAT-Coder-Air V2.5'],
    ['kat_coder_pro_25', 'KAT-Coder-Pro V2.5'],
    ['aion_30', 'Aion 3.0'],
    ['aion_30_mini', 'Aion 3.0 Mini'],
    ['laguna_xs_21', 'Laguna XS 2.1'],
    ['laguna_s_21', 'Laguna S 2.1'],
    ['laguna_m1', 'Laguna M.1'],
    ['nex_n2_mini', 'Nex N2 Mini'],
    ['nex_n2_pro', 'Nex N2 Pro'],
    ['fugu_ultra', 'Fugu Ultra'],
    ...catalogExpansion.experimental
  ],
  '3d': catalogExpansion['3d']
});

function mergeModelTuples(primary, additions = []) {
  return Object.freeze([...new Map(
    [...primary, ...additions].map(([id, name]) => [
      id,
      Object.freeze([id, displayModelName(name)])
    ])
  ).values()]);
}

export function displayModelName(name) {
  const compact = String(name ?? '').replace(/\s+/gu, ' ').trim();
  const withoutPublisher = compact.replace(/^[^:]{2,72}:\s+/u, '');
  return withoutPublisher.replace(/^(\S+)\s+\1\b/iu, '$1');
}

function confirmedPublicModels(confirmedModels, curatedModels) {
  const isPricedAndAvailable = ([id]) => (
    PROVIDER_SNAPSHOT_MODELS_BY_ID[id]?.availability === 'available'
      || providersById[id] === 'kie'
      // The newcomer text allowance is intentionally served by OpenRouter's
      // provider-level `:free` variants. They are not part of RouterAI's
      // catalog snapshot, but removing their cards makes the weekly free
      // quota unreachable before access control can claim it.
      || (providersById[id] === 'openrouter'
        && providerModelsById[id]?.every((providerModelId) => providerModelId.endsWith(':free')))
      || (providersById[id] === 'routerai' && ROUTERAI_DIRECT_MODELS[id]?.availability !== 'blocked')
  );
  const confirmedCuratedModels = curatedModels.filter(isPricedAndAvailable);
  const curatedNames = new Map(confirmedCuratedModels.map(([id, name]) => [id, name]));
  const confirmed = confirmedModels
    .filter(isPricedAndAvailable)
    .filter(([id]) => !curatedNames.has(id))
    .map(([id, providerName]) => [
    id,
    curatedNames.get(id) ?? providerName
  ]);
  return mergeModelTuples(confirmedCuratedModels, confirmed);
}

const familyGuides = Object.freeze({
  openai: {
    intro: 'в линейке GPT есть универсальные модели, отдельные версии для кода и облегчённые варианты для коротких запросов. старшие модели точнее соблюдают длинные инструкции и увереннее работают с несколькими файлами, но расходуют больше метакоинов.',
    heading: 'основные варианты',
    recommendations: [
      { id: 'gpt_56_terra', name: 'GPT-5.6 Terra', text: 'универсальная версия для текста, кода, изображений и документов.' },
      { id: 'gpt_56_terra_pro', name: 'GPT-5.6 Terra Pro', text: 'усиленная версия для сложного анализа, расчётов и многошаговых задач.' },
      { id: 'gpt_55_codex', name: 'GPT-5.5 Codex', text: 'специализация на программировании, отладки и работе с репозиториями.' },
      { id: 'gpt_5_mini', name: 'GPT-5 Mini', text: 'быстрые ответы, черновики и повседневные запросы с меньшим расходом.' }
    ]
  },
  anthropic: {
    intro: 'Claude хорошо удерживает длинные инструкции, разбирает большие документы и аккуратно редактирует текст без потери исходного голоса. разница между версиями заметнее всего на объёмных задачах и кодовых проектах.',
    heading: 'линейка Claude',
    recommendations: [
      { id: 'claude_fable_5', name: 'Claude Fable 5', text: 'самая мощная версия семейства для сложных задач с большим количеством вводных.' },
      { id: 'claude_opus_5', name: 'Claude Opus 5', text: 'сложный код, крупные документы и длинные задачи с несколькими этапами.' },
      { id: 'claude_sonnet_5', name: 'Claude Sonnet 5', text: 'быстрая регулярная работа с текстом, кодом и файлами.' },
      { id: 'claude_haiku_45', name: 'Claude Haiku 4.5', text: 'короткие запросы и массовая обработка, где важны скорость и цена.' }
    ]
  },
  google: {
    intro: 'Gemini работает с текстом, изображениями, скриншотами и документами в одном диалоге. Pro-версии рассчитаны на сложный анализ и длинный контекст, Flash быстрее обрабатывает короткие и массовые запросы.',
    heading: 'актуальные версии',
    recommendations: [
      { id: 'gemini_31_pro', name: 'Gemini 3.1 Pro', text: 'сложный анализ файлов, мультимодальные задачи и длинный контекст.' },
      { id: 'gemini_36_flash', name: 'Gemini 3.6 Flash', text: 'быстрый универсальный вариант для текста, изображений и документов.' },
      { id: 'gemini_35_flash_lite', name: 'Gemini 3.5 Flash Lite', text: 'самая экономная версия для классификации, извлечения данных и коротких ответов.' },
      { id: 'gemini_31_custom_preview', name: 'Gemini 3.1 Custom Tools Preview', text: 'предпросмотр новых функций для вызова инструментов и сложных рабочих сценариев.' }
    ]
  },
  xai: {
    intro: 'Grok отвечает прямее большинства языковых моделей и хорошо разбирает технические темы. модели семейства различаются глубиной анализа, скоростью и специализацией на разработке.',
    heading: 'что находится в линейке',
    recommendations: [
      { id: 'grok_45', name: 'Grok 4.5', text: 'старшая универсальная модель для анализа, текста и сложных технических вопросов.' },
      { id: 'grok_43', name: 'Grok 4.3', text: 'сбалансированная версия для регулярных диалогов и работы с кодом.' },
      { id: 'grok_build', name: 'Grok Build 0.1', text: 'разработка, исправление кода и подготовка технических инструкций.' }
    ]
  },
  kimi: {
    intro: 'Kimi рассчитан на большой объём исходных данных: длинные документы, переписки и кодовые базы. в линейке отдельно выделены универсальная, кодовая и рассуждающая версии.',
    heading: 'версии Kimi',
    recommendations: [
      { id: 'kimi_k3', name: 'Kimi K3', text: 'новая старшая модель для сложного анализа, программирования и длинного контекста.' },
      { id: 'kimi_k27_code', name: 'Kimi K2.7 Code', text: 'написание, разбор и исправление кода в крупных проектах.' },
      { id: 'kimi_k2_thinking', name: 'Kimi K2 Thinking', text: 'математика, логика и задачи с последовательным рассуждением.' }
    ]
  },
  deepseek: {
    intro: 'DeepSeek специализируется на коде, математике и логических задачах. Pro берёт самые тяжёлые запросы, Flash сокращает время и стоимость ответа, а R1 сохраняется как отдельная рассуждающая модель.',
    heading: 'модели DeepSeek',
    recommendations: [
      { id: 'deepseek_v4_pro', name: 'DeepSeek V4 Pro', text: 'сложное программирование, расчёты и глубокий технический разбор.' },
      { id: 'deepseek_v4_flash', name: 'DeepSeek V4 Flash', text: 'быстрые ответы, черновой код и повседневные задачи.' },
      { id: 'deepseek_v4_flash_0731', name: 'DeepSeek V4 Flash 0731', text: 'быстрые ответы с отдельным режимом рассуждения и инструментами.' },
      { id: 'deepseek_r1', name: 'DeepSeek R1', text: 'задачи, где нужен последовательный разбор условий и проверка решения.' },
      { id: 'deepseek_v32_exp', name: 'DeepSeek V3.2 Exp', text: 'бета-ветка для сравнения с основными релизами.' }
    ]
  },
  qwen: {
    intro: 'в Qwen входят обычные языковые модели, отдельная кодовая линия и версии компьютерного зрения. пометка VL означает, что модели можно прислать изображение, интерфейс или документ.',
    heading: 'ключевые версии',
    recommendations: [
      { id: 'qwen_37_max', name: 'Qwen 3.7 Max', text: 'старшая универсальная модель для анализа и длинных задач.' },
      { id: 'qwen_38_max', name: 'Qwen 3.8 Max', text: 'миллионный контекст, мультимодальный вход и сложные агентные задачи.' },
      { id: 'qwen_3_coder_next', name: 'Qwen 3 Coder Next', text: 'актуальная кодовая версия для разработки и работы с репозиториями.' },
      { id: 'qwen_3_vl', name: 'Qwen 3 VL', text: 'понимание изображений, интерфейсов, таблиц и документов.' },
      { id: 'qwen_36_flash', name: 'Qwen 3.6 Flash', text: 'быстрые недорогие ответы и массовая обработка текста.' }
    ]
  },
  glm: {
    intro: 'GLM — семейство Z.ai для текста, кода, рассуждений и мультимодальных задач. старшие версии подходят для сложного анализа и разработки, Flash и Air — для быстрых ответов с меньшим расходом.',
    heading: 'ключевые версии',
    recommendations: [
      { id: 'glm_53', name: 'GLM 5.3', text: 'новая старшая версия для сложного анализа, кода и многошаговых задач.' },
      { id: 'glm_52', name: 'GLM 5.2', text: 'универсальная модель для текста, рассуждений и разработки.' },
      { id: 'polza_z_ai_glm_4_7_flash_0fofa0y', name: 'GLM 4.7 Flash', text: 'быстрые ответы и массовая обработка текста.' }
    ]
  },
  other: {
    intro: 'в этом разделе собраны Mistral, MiniMax, Llama, Nemotron, Yandex и другие открытые либо дополнительные семейства. их проще выбирать по специализации: общий текст, русский язык, код, длинный контекст или массовая обработка.',
    heading: 'с чего начать',
    recommendations: [
      { id: 'minimax_m3', name: 'MiniMax M3', text: 'большой контекст, документы и длинные диалоги.' },
      { id: 'mistral_large_3', name: 'Mistral Large 3', text: 'сильный общий текст и работа с европейскими языками.' },
      { id: 'devstral_2', name: 'Devstral 2', text: 'код, репозитории и многофайловые задачи разработки.' },
      { id: 'nemotron_3_ultra', name: 'Nemotron 3 Ultra', text: 'сложные рассуждения и технический анализ.' },
      { id: 'yandexgpt_51_pro', name: 'YandexGPT Pro 5.1', text: 'сложные русскоязычные тексты, документы и анализ.' }
    ]
  },
  search: {
    intro: 'поисковые модели читают актуальные страницы и возвращают ссылки на источники. используй их для новостей, цен, изменений в продуктах и фактов, которые могли устареть.',
    heading: 'режимы поиска',
    recommendations: [
      { id: 'sonar_search', name: 'Sonar Pro Search', text: 'быстрый ответ по нескольким веб-источникам.' },
      { id: 'sonar_research', name: 'Sonar Deep Research', text: 'подробное исследование с большим числом источников и связным отчётом.' },
      { id: 'sonar_reasoning', name: 'Sonar Reasoning Pro', text: 'поиск с дополнительной проверкой логики и сопоставлением фактов.' }
    ]
  }
});

const categoryGuides = Object.freeze({
  image: {
    intro: 'раздел охватывает генерацию с нуля, правки готового кадра, макеты с надписями и увеличение разрешения. для новой картинки достаточно описания; для редактирования приложи исходник и перечисли изменения.',
    heading: 'основные модели',
    recommendations: [
      { id: 'nano_banana_pro', name: 'Nano Banana Pro', text: 'последовательные правки, несколько референсов и сохранение персонажа между кадрами.' },
      { id: 'gpt_image_2', name: 'GPT-5.4 Image 2', text: 'макеты, читаемые надписи и точечное редактирование изображения.' },
      { id: 'polza_seedream_5_pro_text_to_image_14hhcqr', name: 'Seedream 5.0 Pro', text: 'детальные рекламные изображения и серии кадров в едином стиле.' },
      { id: 'polza_black_forest_labs_flux_2_pro_03wfchj', name: 'FLUX 2 Pro', text: 'быстрые изображения и правки с подтверждённой ценой запуска.' }
    ]
  },
  video: {
    intro: 'видео создаётся по тексту, изображению или исходному ролику. допустимые референсы, длительность, разрешение и звук различаются по моделям и указаны в каждой карточке.',
    heading: 'основные модели',
    recommendations: [
      { id: 'seedance_25', name: 'Seedance 2.5', text: 'многосценовые ролики по тексту, ключевому кадру и мультимодальным референсам.' },
      { id: 'polza_kling_v3_0r3wzac', name: 'Kling 3.0', text: 'реалистичная физика движения, мимика и оживление исходного кадра.' },
      { id: 'polza_google_veo3_fast_0js3z3z', name: 'Veo 3.1 Fast', text: 'быстрая генерация короткого видео с синхронным звуком.' },
      { id: 'flux_3', name: 'FLUX 3', text: 'кинематографичные ролики с управляемым движением по тексту или изображению.' }
    ]
  },
  audio: {
    intro: 'музыкальные модели принимают описание, жанр, настроение, текст песни или аудиореференс. в этом же разделе находятся короткие звуковые эффекты и продолжение готовой записи.',
    heading: 'музыка и звуки',
    recommendations: [
      { id: 'polza_suno_generate_1xai46g', name: 'Suno Music Generate', text: 'полные песни с вокалом, структурой и готовым текстом.' },
      { id: 'polza_google_lyria_3_pro_preview_190ii7b', name: 'Lyria 3 Pro', text: 'инструментальная и фоновая музыка для роликов, игр и подкастов.' },
      { id: 'polza_suno_mashup_0e1mpc3', name: 'Suno Mashup', text: 'сведение нескольких аудиофрагментов в одну композицию.' },
      { id: 'polza_suno_sounds_1lwz9xr', name: 'Suno Sounds', text: 'короткие шумы, переходы и атмосферные эффекты по описанию.' }
    ]
  },
  voice: {
    intro: 'для озвучки отправь текст, для расшифровки аудио или видео с речью. клонированию нужен чистый образец голоса без музыки; языки, голоса и лимиты записи указаны в карточке модели.',
    heading: 'основные модели',
    recommendations: [
      { id: 'polza_ai_sage_gigaam_v3_146z2tr', name: 'GigaAM-v3', text: 'быстрая русскоязычная расшифровка с подтверждённой ценой.' },
      { id: 'polza_aiesa_transcribe_0eontc0', name: 'Aiesa Транскрипция', text: 'распознаёт речь из аудио и видео для заметок и субтитров.' },
      { id: 'polza_deepgram_aura_2_0ljfibt', name: 'Aura-2', text: 'естественная озвучка текста для роликов и объяснений.' },
      { id: 'polza_openai_whisper_1_11ajggw', name: 'Whisper 1', text: 'расшифровывает аудио, переводит речь и готовит субтитры.' }
    ]
  },
  '3d': {
    intro: '3D-модели превращают описание или фотографии в объёмный объект. результатом может быть меш с текстурами, готовый игровой ассет или Gaussian Splatting для просмотра сцены.',
    heading: 'основные модели',
    recommendations: [
      { id: 'meshy_6', name: 'Meshy 6', text: 'объект по тексту или нескольким ракурсам с готовыми текстурами.' },
      { id: 'hyper3d_rodin_25', name: 'Rodin 2.5', text: 'детальная геометрия и качественные текстуры для сложных объектов.' },
      { id: 'tripo_h31', name: 'Tripo H3.1', text: 'быстрый практичный ассет по одному изображению.' }
    ]
  },
  beta: {
    intro: 'в раздел попадают малоизвестные модели небольших лабораторий и свежие публичные бета-релизы. их поведение и доступность могут меняться быстрее, поэтому результаты лучше сравнивать с основной моделью на одном запросе.',
    heading: 'что тестировать первым',
    recommendations: [
      { id: 'polza_thinkingmachines_inkling_1sez1yg', name: 'Thinking Machines Inkling', text: 'длинные задачи, рассуждения и работа с большим количеством условий.' },
      { id: 'polza_kwaipilot_kat_coder_pro_v2_5_1nw51im', name: 'KAT-Coder-Pro V2.5', text: 'программирование и разбор крупных фрагментов кода.' },
      { id: 'polza_aion_labs_aion_3_0_0ga4bbb', name: 'Aion 3.0', text: 'универсальная новая модель для сравнения текста и логики.' }
    ]
  }
});

const providerModelsById = Object.freeze({
  ...POLZA_PROVIDER_MODELS,
  ...Object.fromEntries(Object.entries(ROUTERAI_DIRECT_MODELS).map(
    ([id, model]) => [id, model.providerModels]
  )),
  seedance_20: Object.freeze(['bytedance/seedance-2']),
  seedance_20_fast: Object.freeze(['bytedance/seedance-2-fast']),
  seedance_20_mini: Object.freeze(['bytedance/seedance-2-mini']),
  seedance_25: Object.freeze(['bytedance/seedance-2.5']),
  flux_3: Object.freeze(['black-forest-labs/flux-3-video']),
  minimax_h3: Object.freeze(['minimax/hailuo-3']),
  claude_opus_5: Object.freeze(['anthropic/claude-opus-5']),
  gpt_oss_20b_free: Object.freeze(['openai/gpt-oss-20b:free']),
  nemotron_3_ultra_free: Object.freeze(['nvidia/nemotron-3-ultra-550b-a55b:free']),
  nemotron_3_super_free: Object.freeze(['nvidia/nemotron-3-super-120b-a12b:free']),
  gemma_4_31b_free: Object.freeze(['google/gemma-4-31b-it:free']),
  north_mini_code_free: Object.freeze(['cohere/north-mini-code:free']),
  nemotron_3_nano_omni_free: Object.freeze([
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
  ])
});

const providersById = Object.freeze({
  ...Object.fromEntries(Object.keys(ROUTERAI_DIRECT_MODELS).map((id) => [id, 'routerai'])),
  seedance_25: 'routerai',
  flux_3: 'routerai',
  minimax_h3: 'routerai',
  gpt_oss_20b_free: 'openrouter',
  nemotron_3_ultra_free: 'openrouter',
  nemotron_3_super_free: 'openrouter',
  gemma_4_31b_free: 'openrouter',
  north_mini_code_free: 'openrouter',
  nemotron_3_nano_omni_free: 'openrouter'
});

const earlyAccessModelIds = new Set();

// Superseded provider cards must not leak back into the bot when the Polza
// snapshot is refreshed. Their supported replacements are published as
// RouterAI-direct cards in ROUTERAI_DIRECT_MODELS.
const retiredPublicModelIds = new Set([
  'polza_bytedance_seedream_1p1gj11',
  'polza_bytedance_seedream_4_0flct3o',
  'polza_kling_v2_5_turbo_17zcvnf',
  'polza_kling_v2_6_0fxm8wn',
  'polza_wan_2_5_0k8ohet',
  'polza_openai_tts_1_19bzocj',
  'polza_openai_tts_1_hd_1dyowdi',
  // Cards no longer present in RouterAI's live catalogue (2026-08-20).
  // Explicit provider-gap specialists (Suno and Topaz on Polza, plus Lyria)
  // remain public. Z-Image, OmniVideo and Kling Motion Control stay retired.
  'gpt_53_chat',
  'gpt_5_codex',
  'o3_pro',
  'polza_google_gemini_3_pro_preview_0li4nuj',
  'polza_ai21_jamba_large_1_7_0p8ngfb',
  'gigachat_2_max',
  'gigachat_2_pro',
  'gigachat_2',
  'polza_sber_gigachat_1sbag2e',
  'polza_sber_gigachat_max_00ud1d1',
  'polza_sber_gigachat_plus_1d2dn75',
  'polza_sber_gigachat_pro_03opyas',
  'polza_openai_gpt_image_1_5_0wv2v9y',
  'polza_qwen_image_0i0mbk0',
  'polza_qwen_image_2_0m85awv',
  'polza_yandex_yandex_art_0wl8wis',
  'polza_tongyi_mai_z_image_0x1b58c',
  'polza_gemini_omni_video_0zgwx2i',
  'polza_kling_v2_6_motion_control_18vsbd0',
  'polza_kling_v3_motion_control_1i2kcfl',
  'polza_ai_sage_gigaam_v3_146z2tr',
  'polza_aiesa_transcribe_0eontc0',
  'polza_aiesa_transcribe_fast_1yltowx',
  'polza_openai_gpt_4o_mini_tts_0f5jo5v',
  'polza_aiesa_aiesa_mini_0yyg60s',
  'polza_aiesa_aiesa_pro_07f9hsi',
  'polza_sakana_fugu_ultra_0wuxm6z'
]);

function withoutRetiredModels(models) {
  return models.filter(([id]) => !retiredPublicModelIds.has(id));
}

function routeFieldsFor(modelId) {
  const routeraiDirect = ROUTERAI_DIRECT_MODELS[modelId];
  if (routeraiDirect) return routeraiDirect;
  if (providersById[modelId]) {
    return {
      provider: providersById[modelId],
      ...(providerModelsById[modelId]?.length === 1
        ? { providerModelId: providerModelsById[modelId][0] }
        : {}),
      ...(providerModelsById[modelId] ? { providerModels: providerModelsById[modelId] } : {}),
      availability: 'available'
    };
  }
  const snapshot = PROVIDER_SNAPSHOT_MODELS_BY_ID[modelId];
  if (snapshot) {
    const routeraiRoute = exactProviderRoutesFor(snapshot.providerModelId)
      .find(({ provider }) => provider === 'routerai')
      ?? null;
    // Keep the public-card alias as the primary id: the route matrix resolves
    // it to RouterAI's canonical id at execution time.  Replacing it here
    // breaks that lookup for aliases whose canonical id has no reverse entry.
    const providerModelId = snapshot.providerModelId;
    const providerModels = [...new Set([
      providerModelId,
      ...(snapshot.providerModels ?? [])
    ].filter(Boolean))];
    return {
      provider: routeraiRoute?.provider ?? snapshot.provider,
      providerModelId,
      ...(providerModels.length > 0 ? { providerModels } : {}),
      ...(snapshot.providerPricing ? { providerPricing: snapshot.providerPricing } : {}),
      ...(Array.isArray(snapshot.supportedParameters)
        ? { supportedParameters: snapshot.supportedParameters }
        : {}),
      ...(Array.isArray(snapshot.providerParameters)
        ? { providerParameters: snapshot.providerParameters }
        : {}),
      ...(snapshot.contextLength ? { contextLength: snapshot.contextLength } : {}),
      ...(snapshot.maxCompletionTokens ? { maxCompletionTokens: snapshot.maxCompletionTokens } : {}),
      availability: snapshot.availability
    };
  }
  if (providerModelsById[modelId]) {
    return {
      provider: 'polza',
      providerModelId: providerModelsById[modelId][0],
      providerModels: providerModelsById[modelId],
      availability: 'available'
    };
  }
  return { availability: 'unavailable' };
}

const BETA_PROVIDER_PREFIXES = Object.freeze([
  'aiesa/',
  'anthracite-org/',
  'arcee-ai/',
  'deepcogito/',
  'gryphe/',
  'poolside/',
  'sakana/',
  'thedrummer/',
  'upstage/',
  'thinkingmachines/',
  'kwaipilot/',
  'aion-labs/'
]);

function isBetaProviderModel(model) {
  return model.category === 'llm'
    && model.availability === 'available'
    && BETA_PROVIDER_PREFIXES.some((prefix) => model.providerModelId.startsWith(prefix));
}

const confirmedBetaModels = Object.freeze(Object.values(PROVIDER_SNAPSHOT_MODELS_BY_ID)
  .filter(isBetaProviderModel)
  .map(({ id, name }) => Object.freeze([id, name])));

const betaModelIds = new Set(confirmedBetaModels.map(([id]) => id));

function isGlmModelTuple([id]) {
  const providerModelId = ROUTERAI_DIRECT_MODELS[id]?.providerModelId
    ?? PROVIDER_SNAPSHOT_MODELS_BY_ID[id]?.providerModelId;
  return typeof providerModelId === 'string' && /^z-ai\/glm-/u.test(providerModelId);
}

function confirmedLlmModelsForFamily(familyId) {
  const confirmed = PROVIDER_SNAPSHOT_LLM_MODELS_BY_FAMILY[
    familyId === 'glm' ? 'other' : familyId
  ] ?? [];
  if (familyId === 'glm') return confirmed.filter(isGlmModelTuple);
  if (familyId === 'other') return confirmed.filter((model) => !isGlmModelTuple(model));
  return confirmed;
}

const publicLlmFamilies = Object.freeze(Object.fromEntries(
  Object.entries(llmFamilies).map(([familyId, family]) => [familyId, Object.freeze({
    ...family,
    models: withoutRetiredModels(
      confirmedPublicModels(confirmedLlmModelsForFamily(familyId), family.models)
    )
      .filter(([id]) => !betaModelIds.has(id))
 })])
));

const publicCategoryModels = Object.freeze(Object.fromEntries(
  [...Object.entries(categoryModels), ['beta', mergeModelTuples(categoryModels.beta, confirmedBetaModels)]].map(([category, models]) => [
    category,
    withoutRetiredModels(
      confirmedPublicModels(PROVIDER_SNAPSHOT_CATEGORY_MODELS[category] ?? [], models)
    )
  ])
));

function guideText(guide, metadata = {}, models = null) {
  const visibleIds = models ? new Set(models.map(([id]) => id)) : null;
  const recommendations = guide.recommendations
    .filter(({ id }) => !visibleIds || visibleIds.has(id))
    .map(({ id, name, text }) => {
    const logo = modelLogoHtml({ id, name, ...metadata });
    return `${logo} <b>${escapeHtml(name)}</b> — ${escapeHtml(text)}`;
  });
  return recommendations.length > 0
    ? `${guide.intro}\n\n<b>${guide.heading}</b>\n\n${recommendations.join('\n\n')}`
    : guide.intro;
}

function rows(items, callbackPrefix, columns = 2) {
  const buttons = items.map(([id, name]) => ({ text: name, callback_data: `${callbackPrefix}:${id}` }));
  return Array.from({ length: Math.ceil(buttons.length / columns) }, (_, index) =>
    buttons.slice(index * columns, index * columns + columns)
  );
}

function modelRows(items, metadata) {
  const ordered = [...items].sort(([leftId], [rightId]) => Number(isTopModel(rightId)) - Number(isTopModel(leftId)));
  const buttons = ordered.map(([id, name]) => buildModelButton({ id, name, ...metadata }));
  return Array.from({ length: Math.ceil(buttons.length / 2) }, (_, index) => buttons.slice(index * 2, index * 2 + 2));
}

function settingsCallback(model, action = '') {
  const callback = `settings:${action ? `${action}:` : ''}${model.id}`;
  return Buffer.byteLength(callback, 'utf8') <= 64
    ? callback
    : `settings:${action ? `${action}:` : ''}_`;
}

function modelCallback(prefix, modelId) {
  const callback = `${prefix}:${modelId}`;
  return Buffer.byteLength(callback, 'utf8') <= 64 ? callback : `${prefix}:_`;
}

function categoryTitle(category) {
  if (category === '3d') return '🧊 3D-модели';
  return categoryDefinitions.find(([, id]) => id === category)?.[0] ?? '🤖 модели';
}

const toolCategoryCopy = Object.freeze({
  image: {
    title: '🖼 фото',
    text: 'обработка готовых фотографий: восстановление старых снимков и лиц, удаление фона или объектов, расширение кадра, примерка одежды, распознавание текста и увеличение разрешения.'
  },
  video: {
    title: '🎞 видео',
    text: 'монтаж и обработка готового видео: замена фона, удаление объектов, синхронизация губ, говорящие портреты, оживление фото и увеличение разрешения.'
  },
  audio: {
    title: '🎧 аудио',
    text: 'работа с речью, голосом и звуком: расшифровка, озвучка, разделение записи на дорожки, очистка речи и генерация звуковых эффектов.'
  },
  document: {
    title: '📄 документы и данные',
    text: 'разбор файлов и ссылок: распознавание текста, краткое содержание документов, извлечение таблиц, перевод с сохранением структуры, сравнение версий и конспект видео.'
  },
  '3d': {
    title: '🧊 3D',
    text: 'создание и обработка объёмных объектов: модель по описанию или изображению, текстуры, упрощение геометрии и подготовка результата для дальнейшей работы.'
  }
});

function navigationRows(backData, backText = '‹ назад') {
  return [
    [{ text: '👤 профиль', callback_data: 'task:profile' }],
    [
      { text: backText, callback_data: backData },
      { text: '🏠 главное меню', callback_data: 'task:menu' }
    ]
  ];
}

export function buildModelActionButton(model) {
  if (isConversationalModel(model)) {
    const callback = `dialog:new:model:${model.id}`;
    return {
      text: '⛔️ очистить контекст',
      callback_data: Buffer.byteLength(callback, 'utf8') <= 64
        ? callback
        : 'dialog:new'
    };
  }
  if (['image', 'video', 'audio', 'music', 'voice', '3d'].includes(model?.category)
      || model?.source === 'tool') {
    const callback = `generation:new:model:${model.id}`;
    return {
      text: '✨ новая генерация',
      callback_data: Buffer.byteLength(callback, 'utf8') <= 64
        ? callback
        : 'gen:new'
    };
  }
  return null;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function lowerInitial(text, modelName = '') {
  const value = String(text);
  if (!value || (modelName && value.startsWith(modelName))) return value;
  return `${value[0].toLocaleLowerCase('ru-RU')}${value.slice(1)}`;
}

function lowerRussianSentenceStarts(text, protectedName = '') {
  return String(text).replace(
    /(^|[.!?…]\s+)([А-ЯЁ])(?=[а-яё]|\s)/g,
    (match, prefix, letter, offset, source) => {
      const sentenceStart = offset + prefix.length;
      if (protectedName && source.slice(sentenceStart).startsWith(protectedName)) return match;
      return `${prefix}${letter.toLocaleLowerCase('ru-RU')}`;
    }
  );
}

function lowerToolCardSentenceStarts(text) {
  return lowerRussianSentenceStarts(text)
    .replace(
      /\n\n([А-ЯЁ])(?=[а-яё]|\s)/g,
      (match, letter) => `\n\n${letter.toLocaleLowerCase('ru-RU')}`
    )
    .replace(
      /(<\/b>\s+)([А-ЯЁ])(?=[а-яё]|\s)/g,
      (match, prefix, letter) => `${prefix}${letter.toLocaleLowerCase('ru-RU')}`
    );
}

function highlightedHtml(text, highlights) {
  const ranges = highlights
    .flatMap((highlight) => {
      const rangesForHighlight = [];
      let offset = 0;
      while (offset < text.length) {
        const start = text.indexOf(highlight, offset);
        if (start === -1) break;
        rangesForHighlight.push({ start, end: start + highlight.length });
        offset = start + highlight.length;
      }
      return rangesForHighlight;
    })
    .sort((left, right) => left.start - right.start || right.end - left.end);

  const parts = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    parts.push(escapeHtml(text.slice(cursor, range.start)));
    parts.push(`<b>${escapeHtml(text.slice(range.start, range.end))}</b>`);
    cursor = range.end;
  }
  parts.push(escapeHtml(text.slice(cursor)));
  return parts.join('');
}

export function buildModelCategoryMessage(category) {
  if (category === 'russian') return buildLlmFamilyMessage('other');
  const normalizedCategory = category === 'experimental' ? 'beta' : category;

  if (normalizedCategory === 'llm') {
    const visibleFamilies = Object.entries(publicLlmFamilies)
      .filter(([, family]) => family.models.length > 0);
    return {
      text: '<b>💬 текст / код / поиск</b>\n\nязыковые модели отвечают на вопросы, пишут и разбирают код, редактируют тексты и работают с документами. отдельные версии принимают изображения, держат большой контекст или обращаются к свежим страницам в интернете.\n\nкаталог разделён по семействам, потому что одна и та же линейка часто содержит быстрые, мощные, кодовые и мультимодальные версии.',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...Array.from({ length: Math.ceil(visibleFamilies.length / 2) }, (_, index) =>
            visibleFamilies.slice(index * 2, index * 2 + 2).map(([id, family]) => buildFamilyButton(id, family.name))
          ),
          [{ text: '💬 история диалогов', callback_data: 'dialoghist:list:0' }],
          ...navigationRows('task:menu')
        ]
      }
    };
  }

  if (normalizedCategory === 'tools') {
    const fileCategories = TOOL_MODEL_CATEGORIES.filter(({ id }) => id !== 'audio');
    return {
      text: '<b>🪄 ИИ-инструменты</b>\n\nточечные операции с готовыми файлами: восстановление фотографий, монтаж видео, работа со звуком, разбор документов и сборка 3D-объектов. в карточке указаны подходящие исходники, доступные настройки и стоимость запуска.',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{
            text: '🎯 готовые сценарии',
            callback_data: 'scenarios:home'
          }],
          [{
            text: '🎧 музыка, голос и звук',
            callback_data: 'audiostudio:home'
          }],
          ...rows(fileCategories.map(({ id, name }) => [
            id,
            `${toolCategoryCopy[id]?.title.split(' ')[0] ?? '🪄'} ${name}`
          ]), 'toolcat'),
          ...navigationRows('task:menu')
        ]
      }
    };
  }

  const categoryTuples = publicCategoryModels[normalizedCategory];
  if (!categoryTuples) return buildModelCategoryMessage('llm');
  const models = categoryTuples;
  const guide = categoryGuides[normalizedCategory];
  return {
    text: `<b>${escapeHtml(categoryTitle(normalizedCategory))}</b>\n\n${guideText(guide, { category: normalizedCategory }, models)}\n\n${popularModelsNote}`,
    parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          ...(normalizedCategory === 'audio' ? [[{
            text: '🎛 инструменты для музыки',
            callback_data: 'audiostudio:music'
          }]] : []),
          ...(normalizedCategory === 'voice' ? [[{
            text: '🎙 инструменты для голоса',
            callback_data: 'audiostudio:voice'
          }]] : []),
          ...modelRows(models, { category: normalizedCategory }),
          ...navigationRows('task:menu')
        ]
    }
  };
}

export function buildToolCategoryMessage(category) {
  const copy = toolCategoryCopy[category];
  if (!copy) return buildModelCategoryMessage('tools');
  const models = listToolModels()
    .filter((model) => model.category === category);
  const ordered = [...models].sort(
    (left, right) => Number(isTopModel(right.id)) - Number(isTopModel(left.id))
  );
  const buttons = ordered.map((model) => buildModelButton(model));

  return {
    text: `<b>${escapeHtml(copy.title)}</b>\n\n${escapeHtml(copy.text)}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...Array.from({ length: Math.ceil(buttons.length / 2) }, (_, index) =>
          buttons.slice(index * 2, index * 2 + 2)
        ),
        ...navigationRows('modelcat:tools', '‹ назад к инструментам')
      ]
    }
  };
}

export function buildLlmFamilyMessage(familyId, requestedPage = 0) {
  const normalizedFamilyId = familyId === 'russian' ? 'other' : familyId;
  const family = publicLlmFamilies[normalizedFamilyId];
  if (!family) return buildModelCategoryMessage('llm');
  const guide = familyGuides[normalizedFamilyId];
  const pageSize = 72;
  const catalogModels = family.models;
  if (catalogModels.length === 0) return buildModelCategoryMessage('llm');
  const pageCount = Math.max(1, Math.ceil(catalogModels.length / pageSize));
  const page = Math.min(Math.max(Number.parseInt(String(requestedPage), 10) || 0, 0), pageCount - 1);
  const visibleModels = catalogModels.slice(page * pageSize, (page + 1) * pageSize);
  const pageRows = pageCount > 1 ? [[
    ...(page > 0 ? [{ text: '‹ раньше', callback_data: `family:${normalizedFamilyId}:${page - 1}` }] : []),
    { text: `${page + 1} / ${pageCount}`, callback_data: `family:${normalizedFamilyId}:${page}` },
    ...(page + 1 < pageCount ? [{ text: 'дальше ›', callback_data: `family:${normalizedFamilyId}:${page + 1}` }] : [])
  ]] : [];
  return {
    text: `<b>${escapeHtml(family.name)}</b>\n\n${guideText(guide, { category: 'llm', family: normalizedFamilyId }, catalogModels)}\n\n${popularModelsNote}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...modelRows(visibleModels, { category: 'llm', family: normalizedFamilyId }),
        ...pageRows,
        ...navigationRows('modelcat:llm', '‹ назад к семействам')
      ]
    }
  };
}

export function getModelById(modelId) {
  if (retiredPublicModelIds.has(modelId)) return null;
  const toolModel = getToolModelById(modelId);
  if (toolModel?.active) return toolModel;
  for (const [familyId, family] of Object.entries(publicLlmFamilies)) {
    const model = family.models.find(([id]) => id === modelId);
    if (model) {
      return {
        id: model[0],
        name: displayModelName(model[1]),
        category: 'llm',
        family: familyId,
        ...routeFieldsFor(model[0])
      };
    }
  }
  for (const [category, models] of Object.entries(publicCategoryModels)) {
    const model = models.find(([id]) => id === modelId);
    if (model) {
      return {
        id: model[0],
        name: displayModelName(model[1]),
        category,
        ...routeFieldsFor(model[0]),
        ...(earlyAccessModelIds.has(model[0]) ? { availability: 'early_access' } : {})
      };
    }
  }
  return null;
}

export function listCatalogModels() {
  const llmModels = Object.values(publicLlmFamilies).flatMap((value) =>
    value.models.map(([id]) => getModelById(id))
  );
  const functionalModels = Object.values(publicCategoryModels).flatMap((models) =>
    models.map(([id]) => getModelById(id))
  );
  return [...new Map([...llmModels, ...functionalModels, ...listToolModels()]
    .map((model) => [model.id, model])).values()];
}

export function inputProfileFor(model) {
  return model?.source === 'tool' ? toolSettingsProfileFor(model) : standardInputProfileFor(model);
}

export function calculateMetacoinPrice(model, settings = {}, usage = {}) {
  return model?.source === 'tool'
    ? calculateToolMetacoinPrice(model, settings, usage)
    : calculateStandardMetacoinPrice(model, settings, usage);
}

export function formatMetacoinPrice(model, settings) {
  return model?.source === 'tool'
    ? formatToolMetacoinPrice(model, settings)
    : formatStandardMetacoinPrice(model, settings);
}

export const inputProfileForModel = inputProfileFor;
export const calculateModelMetacoinPrice = calculateMetacoinPrice;

export function calculateModelProviderFloorMetacoins(model, settings = {}, usage = {}) {
  return model?.source === 'tool'
    ? calculateToolMetacoinPrice(model, settings, usage)
    : calculateStandardProviderFloorMetacoins(model, settings, usage);
}
export const formatModelMetacoinPrice = formatMetacoinPrice;

export function defaultModelSettings(model) {
  return model?.source === 'tool'
    ? defaultToolSettings(model)
    : defaultsFor(standardInputProfileFor(model));
}

function modelSettingLabel(definition, value) {
  if (definition.type === 'string') return value === '' ? 'не задано' : String(value);
  return definition.values.find((entry) => entry.value === value)?.label
    ?? settingLabel(definition, value);
}

function modelBackTarget(model) {
  if (model.source === 'tool') return `toolcat:${model.category}`;
  return model.category === 'llm' && model.family
    ? `family:${model.family}`
    : `modelcat:${model.category}`;
}

export function isConversationalModel(model) {
  return !model?.source && (
    model?.category === 'llm'
    || model?.category === 'beta'
    || model?.category === 'experimental'
    || model?.category === 'russian'
  );
}

export function buildModelCard(model, now = Date.now()) {
  if (!model) return buildModelCategoryMessage('llm');
  if (model.source === 'tool') {
    const card = buildToolCard(model);
    const profile = inputProfileForModel(model);
    const cardText = card.text.replace(
      /<b>стоимость:<\/b> ([^<]+)$/,
      `<b>стоимость: ${metacoinHtml()} $1</b>`
    );
    return {
      ...card,
      text: lowerToolCardSentenceStarts(cardText),
      reply_markup: {
        inline_keyboard: [
          ...(['video_generate', 'video_image_to_video', 'video_extend'].includes(model.id)
            ? [[{ text: '🎬 выбрать режим', callback_data: 'video:new:_' }]]
            : []),
          ...(profile.length
            ? [[{ text: '⚙️ параметры', callback_data: `settings:${model.id}` }]]
            : []),
          ...navigationRows(modelBackTarget(model), '‹ назад к списку')
        ]
      }
    };
  }

  const card = cardProfileFor(model);
  const profile = inputProfileForModel(model);
  const controls = [];
  if (model.category === 'video') {
    controls.push({ text: '🎬 выбрать режим', callback_data: 'video:new:_' });
  }
  if (profile.length > 0 && model.category !== 'video') {
    controls.push({ text: '⚙️ параметры', callback_data: `settings:${model.id}` });
  }
  if (supportsImageReferences(model)) {
    controls.unshift({ text: '🖼 референсы', callback_data: 'imagerefs:open' });
  }
  if (isConversationalModel(model)) {
    controls.unshift({ text: '💬 история диалогов', callback_data: 'dialoghist:list:0' });
  }
  const description = lowerRussianSentenceStarts(lowerInitial(card.description, model.name), model.name);
  const highlights = card.highlights.map(lowerRussianSentenceStarts);
  const cardInstruction = model.category === 'video'
    ? 'опиши сцену сразу или выбери другой режим генерации по кнопке ниже'
    : card.instruction;
  const instruction = lowerRussianSentenceStarts(lowerInitial(cardInstruction))
    .trim()
    .replace(/[.!?…]+$/u, '');
  const entitlement = freeEntitlementFor(model.id);
  const quotaLabels = {
    image: 'генерации',
    video: 'генерации',
    music: 'музыкальная генерация',
    voice: 'озвучек',
    luna_text: 'запросов',
    gpt_image_2: 'генерации',
    text: 'запросов'
  };
  const newcomerBadge = entitlement
    ? ` (🎁 ${entitlement.weeklyLimit} ${quotaLabels[entitlement.quotaKey] ?? 'запросов'} в неделю бесплатно)`
    : '';
  const freeBadge = isFreeModelId(model.id) ? ' 🆓' : '';
  const newBadge = isNewModel(model.id, now) ? ' 🆕' : '';
  const title = `<b>${escapeHtml(model.name)}${newcomerBadge}</b>${newBadge}${freeBadge}`;

  if (model.availability === 'unavailable') {
    return {
      text: `${title}\n\n${highlightedHtml(description, highlights)}\n\n${escapeHtml(instruction)}👇\n\n<b>статус:</b> модель есть в каталоге провайдера, но цена пока не подтверждена. запрос не отправляется, метакоины не списываются.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: navigationRows(modelBackTarget(model), '‹ назад к списку')
      }
    };
  }

  if (model.availability === 'early_access') {
    return {
      text: `${title}\n\n${highlightedHtml(description, highlights)}\n\n${escapeHtml(instruction)}👇\n\n<b>ранний доступ:</b> запуск появится после публикации стабильного API и цены. сейчас списаний нет.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: navigationRows(modelBackTarget(model), '‹ назад к списку')
      }
    };
  }

  return {
    text: `${title}\n\n${highlightedHtml(description, highlights)}\n\n${escapeHtml(instruction)}👇\n\n<b>стоимость: ${metacoinHtml()} ${formatModelMetacoinPrice(model)} метакоинов</b>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...(controls.length ? [controls] : []),
        ...navigationRows(modelBackTarget(model), '‹ назад к списку')
      ]
    }
  };
}

export function buildModelSettingsMessage(model, settings = defaultModelSettings(model)) {
  if (!model) return buildModelCategoryMessage('llm');
  const profile = inputProfileForModel(model);
  if (profile.length === 0) return buildModelCard(model);

  const values = profile.map((definition) => {
    const label = escapeHtml(definition.label);
    const value = escapeHtml(modelSettingLabel(
      definition,
      settings[definition.key] ?? definition.defaultValue
    ));
    return `<b>${label}:</b> ${value}`;
  });
  const buttons = profile.map((definition) => [
    {
      text: `${definition.label}: ${modelSettingLabel(definition, settings[definition.key] ?? definition.defaultValue)}`,
      callback_data: definition.type === 'string'
        ? `setting:${definition.key}`
        : `settingcycle:${definition.key}`
    }
  ]);
  if (model.category === 'llm') {
    values.push(`<b>инструкции для ии:</b> ${settings.instructions ? 'заданы' : 'не заданы'}`);
    values.push('<b>контекст:</b> текущий диалог');
    buttons.push([{ text: '📋 инструкции для ИИ', callback_data: modelCallback('instructions', model.id) }]);
    buttons.push([{ text: '⛔️ очистить контекст', callback_data: 'dialog:new:' }]);
    buttons.push([{ text: 'язык, резюме и документы', callback_data: 'task:settings' }]);
  }

  return {
    text: `<b>⚙️ параметры ${escapeHtml(model.name)}</b>\n\n${values.join('\n')}\n\n<b>стоимость:</b> ${metacoinHtml()} ${formatModelMetacoinPrice(model, settings)} метакоинов`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...buttons,
        [
          { text: 'сбросить', callback_data: settingsCallback(model, 'reset'), style: 'danger' },
          { text: 'готово', callback_data: settingsCallback(model, 'done'), style: 'success' }
        ],
        ...navigationRows(
          model.source === 'tool' ? modelBackTarget(model) : `model:${model.id}`,
          model.source === 'tool' ? '‹ назад к инструментам' : '‹ назад к карточке'
        )
      ]
    }
  };
}

export function buildModelConfiguredMessage(model, settings = defaultModelSettings(model)) {
  if (!model) return buildModelCategoryMessage('llm');
  const profile = inputProfileForModel(model);
  if (profile.length === 0) return buildModelCard(model);
  const values = profile.map((definition) => {
    const label = escapeHtml(definition.label);
    const value = escapeHtml(modelSettingLabel(
      definition,
      settings[definition.key] ?? definition.defaultValue
    ));
    return `<b>${label}:</b> ${value}`;
  });
  if (model.category === 'llm' && settings.instructions) {
    values.push('<b>инструкции для ии:</b> заданы');
  }
  const instructions = {
    llm: 'теперь пришли задачу сообщением.',
    image: 'теперь пришли описание и, если нужно, изображение-референс.',
    video: 'теперь пришли описание, изображение или видео-референс.',
    audio: 'теперь пришли описание трека или звука.',
    voice: 'теперь пришли текст либо аудиофайл.',
    tools: 'теперь пришли файл для обработки.',
    '3d': 'теперь пришли описание или изображение-референс.',
    russian: 'теперь пришли задачу сообщением.',
    beta: 'теперь пришли задачу сообщением.',
    experimental: 'теперь пришли задачу сообщением.'
  };
  const nextInstruction = model.source === 'tool'
    ? 'теперь пришли файлы, которые перечислены в карточке инструмента.'
    : instructions[model.category] ?? 'теперь пришли задачу сообщением.';

  return {
    text: `<b>${escapeHtml(model.name)}</b>\n\n${values.join('\n')}\n\n<b>стоимость:</b> ${metacoinHtml()} ${formatModelMetacoinPrice(model, settings)} метакоинов\n\n${nextInstruction}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚙️ изменить настройки', callback_data: settingsCallback(model) }],
        ...navigationRows(modelBackTarget(model), '‹ назад к списку')
      ]
    }
  };
}

export function buildModelInstructionsPrompt(model, hasInstructions = false) {
  return {
    text: `<b>⚙️ инструкции для ии · ${escapeHtml(model.name)}</b>\n\nнапиши одним сообщением, что модель должна учитывать во всех новых диалогах. например, можно задать язык, тон ответа, формат или правила работы с кодом.\n\n<b>лимит:</b> 3 000 символов`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...(hasInstructions ? [[{
          text: '🗑 удалить промпт',
          callback_data: modelCallback('instructions:clear', model.id),
          style: 'danger'
        }]] : []),
        ...navigationRows(`settings:${model.id}`, '‹ назад к настройкам')
      ]
    }
  };
}

export function buildSettingOptionsMessage(model, key, settings = defaultModelSettings(model)) {
  const definition = inputProfileForModel(model).find((item) => item.key === key);
  if (!definition) return buildModelSettingsMessage(model, settings);
  return {
    text: `<b>⚙️ ${escapeHtml(model.name)}</b>\n\n<b>${escapeHtml(definition.label)}:</b> выбери значение👇`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...rows(definition.values.map(({ value, label }) => [value, label]), `set:${key}`, 2),
        [
          { text: 'сбросить', callback_data: settingsCallback(model, 'reset'), style: 'danger' },
          { text: 'готово', callback_data: settingsCallback(model, 'done'), style: 'success' }
        ],
        ...navigationRows(
          model.source === 'tool' ? modelBackTarget(model) : settingsCallback(model),
          model.source === 'tool' ? '‹ назад к инструментам' : '‹ назад к настройкам'
        )
      ]
    }
  };
}

export function applyModelSetting(model, settings, key, value) {
  const definition = inputProfileForModel(model).find((item) => item.key === key);
  if (!definition) return { ...settings };
  if (definition.type === 'string') return { ...settings, [key]: String(value) };
  const selected = definition.values.find((entry) => String(entry.value) === String(value));
  if (!selected) return { ...settings };
  return { ...settings, [key]: selected.value };
}

export function buildContextClearedMessage() {
  return Object.freeze({
    text: 'контекст модели успешно очищен'
  });
}

export function buildModelSelectedMessage(model) {
  const instructions = {
    llm: 'пришли задачу сообщением.',
    image: 'пришли описание и, если нужно, фото-референс.',
    video: 'пришли описание, изображение или видео-референс.',
    audio: 'пришли описание трека или звука.',
    voice: 'пришли текст или аудиофайл.',
    tools: 'пришли файл для обработки.',
    '3d': 'пришли описание или изображение-референс.',
    russian: 'пришли задачу сообщением.',
    beta: 'пришли задачу сообщением.',
    experimental: 'пришли задачу сообщением.'
  };
  const nextInstruction = model.source === 'tool'
    ? 'пришли файлы, которые перечислены в карточке инструмента.'
    : instructions[model.category] ?? 'пришли задачу сообщением.';
  return {
    text: 'выбрана ' + model.name + '\n\n' + nextInstruction,
    reply_markup: {
      inline_keyboard: [
        ...(isConversationalModel(model) ? [[{
          text: '💬 история диалогов',
          callback_data: 'dialoghist:list:0'
        }]] : []),
        ...navigationRows(
          modelBackTarget(model),
          model.source === 'tool' ? '‹ назад к инструментам' : '‹ назад к моделям'
        )
      ]
    }
  };
}
