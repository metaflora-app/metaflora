import { expansionCopy } from './catalog-expansion.js';
import { llmCardProfiles } from './model-cards-llm.js';
import { imageCardProfiles } from './model-cards-image.js';
import { videoCardProfiles } from './model-cards-video.js';
import { audioCardProfiles } from './model-cards-audio.js';

const option = (value, label = value) => Object.freeze({ value, label });

const field = (key, label, defaultValue, values) => Object.freeze({
  key,
  label,
  defaultValue,
  values: Object.freeze(values)
});

const researchedCardProfiles = Object.freeze({
  ...llmCardProfiles,
  ...imageCardProfiles,
  ...videoCardProfiles,
  ...audioCardProfiles
});

const referenceKinds = (...kinds) => Object.freeze(kinds);

const inputContracts = Object.freeze({
  nemotron_35_asr_streaming: {
    minimum: { audio: 1 },
    maximum: { audio: 1 },
    referenceKinds: referenceKinds('audio')
  },
  wan_27: { referenceKinds: referenceKinds('image', 'video', 'audio') },
  kling_video_o1: { referenceKinds: referenceKinds('image', 'video') },
  runway_aleph_2: { referenceKinds: referenceKinds('image', 'video') },
  minimax_h3: {
    maximum: { image: 9, video: 3, audio: 3 },
    referenceKinds: referenceKinds('image', 'video', 'audio')
  },
  seedance_25: {
    maximum: { image: 50, video: 50, audio: 50 },
    totalMaximum: 50,
    referenceKinds: referenceKinds('image', 'video', 'audio')
  },
  flux_3: { maximum: { image: 2 } },
  seedance_20: {
    maximum: { image: 9, video: 3, audio: 3 },
    totalMaximum: 12,
    referenceKinds: referenceKinds('image', 'video', 'audio')
  },
  seedance_20_fast: {
    maximum: { image: 9, video: 3, audio: 3 },
    totalMaximum: 12,
    referenceKinds: referenceKinds('image', 'video', 'audio')
  },
  seedance_20_mini: {
    maximum: { image: 9, video: 3, audio: 3 },
    totalMaximum: 12,
    referenceKinds: referenceKinds('image', 'video', 'audio')
  },
  seedream_50_pro: { maximum: { image: 10 } },
  seedream_50_lite: { maximum: { image: 10 } },
  suno_mashup: { minimum: { audio: 2 }, maximum: { audio: 2 } },
  kling_kolors: { minimum: { image: 2 }, maximum: { image: 2 } },
  flux_vto: { minimum: { image: 2 }, maximum: { image: 2 } },
  face_swap: { minimum: { image: 2 }, maximum: { image: 2 } },
  bria_product_dimensions: { minimum: { image: 1, text: 1 } },
  bria_extract_object: { minimum: { image: 1, text: 1 } },
  image_editor: { minimum: { image: 1, text: 1 } },
  inpaint: { minimum: { image: 1, text: 1 } }
});

const settingLabels = Object.freeze({
  aspect_ratio: 'соотношение сторон',
  duration: 'длительность',
  resolution: 'разрешение',
  image_resolution: 'разрешение изображения',
  num_images: 'количество',
  prompt_expansion: 'расширение описания',
  enable_prompt_expansion: 'расширение описания',
  output_format: 'формат файла',
  generate_audio: 'звук',
  sound: 'звук',
  mode: 'режим',
  upscale_factor: 'масштаб увеличения',
  generationType: 'тип генерации',
  enableTranslation: 'перевод',
  fixed_lens: 'фиксированный объектив',
  character_orientation: 'ориентация персонажа',
  multi_shots: 'несколько планов',
  enable_safety_checker: 'проверка безопасности',
  has_video: 'видео-референс',
  key_signature: 'тональность',
  temperature: 'точность / вариативность',
  reasoning_effort: 'скорость и глубина',
  web_search: 'поиск в интернете',
  quality: 'качество',
  voice: 'голос',
  speed: 'скорость',
  language: 'язык',
  response_format: 'формат ответа',
  fps: 'частота кадров',
  num_frames: 'число кадров',
  guidance_scale: 'следование запросу',
  num_inference_steps: 'шаги генерации'
});

const commonSettings = Object.freeze({
  temperature: field('temperature', settingLabels.temperature, '0.7', [
    option('0.2', 'точнее'),
    option('0.7', 'сбалансированно'),
    option('1.0', 'свободнее')
  ]),
  reasoning_effort: field('reasoning_effort', settingLabels.reasoning_effort, 'medium', [
    option('low', 'быстрее'),
    option('medium', 'сбалансированно'),
    option('high', 'глубокий разбор')
  ]),
  web_search: field('web_search', settingLabels.web_search, 'false', [
    option('false', 'выключен'),
    option('true', 'включен')
  ])
});

const valueLabels = Object.freeze({
  auto: 'автоматически',
  true: 'включен',
  false: 'выключен',
  png: 'PNG',
  jpeg: 'JPEG',
  jpg: 'JPEG',
  webp: 'WebP',
  wav: 'WAV',
  mp3: 'MP3',
  flac: 'FLAC',
  opus: 'Opus',
  aac: 'AAC',
  ru: 'русский',
  en: 'английский',
  low: 'быстрое',
  medium: 'сбалансированное',
  high: 'максимальное',
  square_hd: 'квадрат · 1K',
  square: 'квадрат · 512 px',
  portrait_4_3: 'вертикальное · 3:4',
  portrait_16_9: 'вертикальное · 9:16',
  landscape_4_3: 'горизонтальное · 4:3',
  landscape_16_9: 'горизонтальное · 16:9',
  auto_1K: 'автоматически · 1K',
  auto_2K: 'автоматически · 2K',
  auto_4K: 'автоматически · 4K',
  '4k': '4K',
  square_uhd: 'квадрат · 4K',
  portrait_hd: 'вертикальное · HD',
  landscape_hd: 'горизонтальное · HD',
  ogg_opus: 'OGG Opus',
  en_us: 'английский · США',
  en_gb: 'английский · Великобритания',
  fr_fr: 'французский',
  pt_br: 'португальский · Бразилия',
  turbo: 'быстро',
  balanced: 'сбалансированно',
  quality: 'максимальное'
});

const providerSettingAliases = Object.freeze({
  sound: 'generate_audio',
  mode: 'resolution',
  image_resolution: 'resolution',
  enable_prompt_expansion: 'prompt_expansion',
  enable_web_search: 'web_search',
  soundKey: 'key_signature'
});

const publicProviderSettingKeys = new Set([
  'aspect_ratio', 'duration', 'resolution', 'generate_audio', 'quality',
  'num_images', 'prompt_expansion', 'output_format', 'voice', 'speed',
  'language', 'response_format', 'key_signature', 'upscale_factor',
  'generationType', 'enableTranslation', 'fixed_lens', 'character_orientation',
  'enable_safety_checker', 'web_search', 'enable_web_search', 'multi_shots'
]);

const settingOrder = Object.freeze([
  'duration',
  'resolution',
  'aspect_ratio',
  'generate_audio',
  'multi_shots',
  'quality',
  'num_images',
  'output_format',
  'prompt_expansion',
  'web_search',
  'voice',
  'speed',
  'language',
  'response_format',
  'key_signature',
  'upscale_factor',
  'generationType',
  'enableTranslation',
  'fixed_lens',
  'character_orientation',
  'enable_safety_checker'
]);

function settingOrderIndex(key) {
  const index = settingOrder.indexOf(key);
  return index < 0 ? settingOrder.length : index;
}

function providerSettingsFor(model) {
  const seen = new Set();
  const tierParameters = Object.entries((model?.providerPricing?.tierPrices ?? []).reduce(
    (parameters, { conditions }) => Object.entries(conditions).reduce(
      (next, [key, value]) => ({ ...next, [key]: [...new Set([...(next[key] ?? []), String(value)])] }),
      parameters
    ),
    {}
  )).map(([key, values]) => ({ key, defaultValue: values.includes('false') ? 'false' : values[0], values }));
  const projected = [...(model?.providerParameters ?? []), ...tierParameters].flatMap(({ key, defaultValue, values }) => {
    const publicKey = providerSettingAliases[key] ?? key;
    const availableValues = [...new Set((values ?? []).map(String))];
    if (
      !publicProviderSettingKeys.has(publicKey)
      || seen.has(publicKey)
      || availableValues.length < 2
    ) return [];
    seen.add(publicKey);
    const selectedDefault = availableValues.includes(String(defaultValue))
      ? String(defaultValue)
      : availableValues[0];
    const label = publicKey === 'resolution' && key === 'mode' ? 'разрешение' : settingLabels[publicKey];
    return [field(
      publicKey,
      label,
      selectedDefault,
      availableValues.map((value) => option(
        value,
        publicKey === 'duration' && /^\d+$/.test(value) ? `${value} сек` : (valueLabels[value] ?? value)
      ))
    )];
  });
  return projected.sort((left, right) => settingOrderIndex(left.key) - settingOrderIndex(right.key));
}

function llmSettingsFor(model, settings) {
  if (!Array.isArray(model?.supportedParameters)) return settings;
  const supported = new Set(model.supportedParameters);
  return settings.filter(({ key }) => {
    if (key === 'temperature') return supported.has('temperature');
    if (key === 'reasoning_effort') return supported.has('reasoning_effort');
    if (key === 'response_length') {
      return supported.has('max_tokens')
        || supported.has('max_completion_tokens')
        || supported.has('max_output_tokens');
    }
    if (key === 'web_search') return supported.has('web_search') || supported.has('search');
    return false;
  });
}

function profileSettings(profile) {
  const settings = profile?.settings;
  if (Array.isArray(settings)) {
    return settings
      .filter((key) => !['max_tokens', 'guidance_scale', 'num_inference_steps', 'num_frames'].includes(key))
      .map((key) => commonSettings[key])
      .filter(Boolean);
  }
  if (!settings || typeof settings !== 'object') return [];

  return Object.entries(settings).flatMap(([key, definition]) => {
    if (['guidance_scale', 'num_inference_steps', 'num_frames'].includes(key)) return [];
    const values = [...new Set((definition?.values ?? []).map(String))];
    const defaultValue = String(definition?.defaultValue ?? '');
    if (values.length < 2 || !values.includes(defaultValue)) return [];
    const label = key === 'resolution' && values.some((value) => valueLabels[value]?.includes('·'))
      ? 'размер изображения'
      : settingLabels[key] ?? key.replaceAll('_', ' ');
    const friendlyValue = (value) => {
      if (valueLabels[value]) return valueLabels[value];
      if (key === 'duration' && /^\d+$/.test(value)) return `${value} сек`;
      if (key === 'resolution' && value.toLowerCase() === '4k') return '4K';
      return value;
    };
    return [field(
      key,
      label,
      defaultValue,
      values.map((value) => option(value, friendlyValue(value)))
    )];
  });
}

const llmFields = Object.freeze([
  field('temperature', 'точность / вариативность', '0.7', [
    option('0.2', 'точнее'),
    option('0.7', 'сбалансированно'),
    option('1.0', 'свободнее')
  ]),
  field('response_length', 'объём ответа', 'normal', [
    option('brief', 'краткий'),
    option('normal', 'стандартный'),
    option('detailed', 'подробный')
  ])
]);

const reasoningLlmFields = Object.freeze([
  field('reasoning_effort', 'скорость и глубина', 'medium', [
    option('low', 'быстрее'), option('medium', 'сбалансированно'), option('high', 'глубокий разбор')
  ]),
  field('response_length', 'объём ответа', 'normal', [
    option('brief', 'краткий'),
    option('normal', 'стандартный'),
    option('detailed', 'подробный')
  ])
]);

const maxTokensOnlyFields = Object.freeze([]);

const reasoningLlmIds = new Set([
  'gpt_56_luna', 'gpt_56_luna_pro', 'gpt_56_terra', 'gpt_56_terra_pro',
  'gpt_55', 'gpt_55_pro', 'gpt_54', 'gpt_54_pro', 'gpt_54_mini', 'gpt_54_nano',
  'gpt_53_codex', 'gpt_52', 'gpt_52_pro', 'gpt_52_codex', 'gpt_5', 'gpt_5_pro', 'gpt_5_mini',
  'gpt_5_nano', 'o3', 'o3_pro', 'o4_mini', 'claude_sonnet_5', 'claude_fable_5',
  'claude_opus_5', 'claude_opus_48_fast', 'claude_opus_47', 'kimi_k3',
  'deepseek_v4_flash_0731', 'qwen_38_max'
]);

const unverifiedLlmIds = new Set([
  'gpt_55_codex', 'gemini_31_pro', 'gemini_3_pro', 'gemini_3_flash', 'qwen_37_max', 'qwen_37_plus',
  'qwen_36_flash', 'qwen_35_plus', 'qwen_3_coder', 'qwen_3_coder_next', 'qwen_3_vl', 'cohere_north_code',
  'mistral_large_3', 'devstral_2', 'codestral', 'gemma_4', 'nemotron_3', 'gpt_search',
  'fugu_ultra', 'openrouter_fusion', 'gpt_5_codex'
]);

const nanoBananaProFields = Object.freeze([
  field('aspect_ratio', 'соотношение сторон', '1:1', [
    option('auto'), option('21:9'), option('16:9'), option('3:2'), option('4:3'),
    option('5:4'), option('1:1'), option('4:5'), option('3:4'), option('2:3'), option('9:16')
  ]),
  field('resolution', 'разрешение', '1K', [option('1K'), option('2K'), option('4K')]),
  field('output_format', 'формат файла', 'png', [option('png', 'PNG'), option('jpeg', 'JPEG'), option('webp', 'WebP')]),
  field('enable_web_search', 'поиск в интернете', 'false', [option('false', 'выключен'), option('true', 'включен')])
]);

const gptImage2Fields = Object.freeze([
  field('aspect_ratio', 'соотношение сторон', 'auto', [
    option('auto', 'автоматически'), option('1:1'), option('9:16'), option('16:9'), option('4:3'), option('3:4')
  ]),
  field('quality', 'качество', 'high', [option('low', 'быстрое'), option('medium', 'сбалансированное'), option('high', 'максимальное')]),
  field('output_format', 'формат файла', 'png', [option('png', 'PNG'), option('jpeg', 'JPEG'), option('webp', 'WebP')])
]);

const seedance20BaseFields = Object.freeze([
  field('resolution', 'разрешение', '720p', [option('480p'), option('720p'), option('1080p'), option('4k', '4K')]),
  field('duration', 'длительность', 'auto', [
    option('auto', 'авто'), ...Array.from({ length: 12 }, (_, index) => option(String(index + 4), `${index + 4} сек`))
  ]),
  field('aspect_ratio', 'соотношение сторон', 'auto', [
    option('auto', 'авто'), option('21:9'), option('16:9'), option('4:3'), option('1:1'), option('3:4'), option('9:16')
  ]),
  field('generate_audio', 'звук', 'true', [option('true', 'включен'), option('false', 'выключен')])
]);

const seedance20FastFields = Object.freeze([
  field('resolution', 'разрешение', '720p', [option('480p'), option('720p')]),
  ...seedance20BaseFields.filter(({ key }) => key !== 'resolution')
]);

const routerAiSeedance25Fields = Object.freeze([
  field('duration', 'длительность', '8', Array.from(
    { length: 27 },
    (_, index) => option(String(index + 4), `${index + 4} сек`)
  )),
  field('resolution', 'разрешение', '720p', [option('480p'), option('720p')]),
  field('aspect_ratio', 'соотношение сторон', '16:9', [
    option('21:9'), option('16:9'), option('4:3'), option('1:1'), option('3:4'), option('9:16')
  ]),
  field('generate_audio', 'звук', 'true', [option('true', 'включен'), option('false', 'выключен')])
]);

const routerAiFlux3VideoFields = Object.freeze([
  field('duration', 'длительность', '5', Array.from(
    { length: 16 },
    (_, index) => option(String(index + 5), `${index + 5} сек`)
  )),
  field('resolution', 'разрешение', '720p', [option('720p'), option('1080p')]),
  field('aspect_ratio', 'соотношение сторон', '16:9', [
    option('21:9'), option('16:9'), option('4:3'), option('1:1'), option('3:4'), option('9:16')
  ]),
  field('generate_audio', 'звук', 'true', [option('true', 'включен'), option('false', 'выключен')])
]);

const openAiTtsFields = Object.freeze([
  field('voice', 'голос', 'alloy', [
    option('alloy'), option('ash'), option('coral'), option('echo'), option('fable'),
    option('nova'), option('onyx'), option('sage'), option('shimmer')
  ]),
  field('response_format', 'формат файла', 'mp3', [option('mp3', 'MP3'), option('opus', 'Opus'), option('wav', 'WAV'), option('aac', 'AAC')]),
  field('speed', 'скорость', '1.0', [option('0.75', '0,75×'), option('1.0', '1×'), option('1.25', '1,25×'), option('1.5', '1,5×')])
]);

const transcriptionFields = Object.freeze([
  field('language', 'язык', 'auto', [option('auto', 'авто'), option('ru', 'русский'), option('en', 'английский')]),
  field('response_format', 'формат ответа', 'text', [option('text', 'текст'), option('json', 'JSON'), option('srt', 'SRT'), option('vtt', 'VTT')])
]);

const toolPngFields = Object.freeze([
  field('output_format', 'формат файла', 'png', [option('png', 'PNG'), option('jpeg', 'JPEG'), option('webp', 'WebP')])
]);

const exactProfiles = Object.freeze({
  nano_banana_pro: nanoBananaProFields,
  gpt_image_2: gptImage2Fields,
  seedance_20: seedance20BaseFields,
  seedance_20_fast: seedance20FastFields,
  seedance_20_mini: seedance20FastFields,
  seedance_25: routerAiSeedance25Fields,
  flux_3: routerAiFlux3VideoFields,
  openai_tts: openAiTtsFields,
  gpt_4o_mini_tts: openAiTtsFields,
  whisper_1: transcriptionFields,
  gpt_4o_transcribe: transcriptionFields,
  remove_bg: toolPngFields,
  inpaint: toolPngFields,
  outpaint: toolPngFields,
  image_editor: toolPngFields,
  photo_master: toolPngFields
});

const providerNativeCuratedProfileIds = new Set([
  'seedance_20',
  'seedance_20_fast',
  'seedance_20_mini'
]);

const providerInputProfiles = Object.freeze({
  'topaz/image-upscale': Object.freeze(['image']),
  'topaz/video-upscale': Object.freeze(['video'])
});

const copyByCategory = Object.freeze({
  llm: {
    icon: '🔥',
    description: 'помогает с текстами, анализом, кодом и вопросами, где нужен подробный разбор.',
    input: 'напишите задачу обычным сообщением. изображение или документ можно прикрепить, если модель умеет с ними работать.'
  },
  image: {
    icon: '🎨',
    description: 'создает новое изображение по описанию и помогает изменить готовую картинку.',
    input: 'опишите желаемый результат. для редактирования прикрепите исходное изображение и перечислите правки.'
  },
  video: {
    icon: '🎬',
    description: 'создает короткое видео по описанию или оживляет исходное изображение.',
    input: 'опишите сцену. чтобы оживить кадр или повторить движение, прикрепите подходящий референс.'
  },
  audio: {
    icon: '🎧',
    description: 'создает музыку, вокал или звуковые эффекты по описанию.',
    input: 'опишите жанр, настроение и звучание. для песни можно добавить текст и пример композиции.'
  },
  voice: {
    icon: '🎙',
    description: 'работает с речью: озвучивает текст, распознает запись или клонирует голос в зависимости от выбранной модели.',
    input: 'текст для озвучки либо аудиофайл для распознавания.'
  },
  tools: {
    icon: '🛠',
    description: 'обрабатывает готовый файл без нового промпта или с короткой инструкцией к правке.',
    input: 'изображение или видео, которое нужно обработать.'
  },
  '3d': {
    icon: '🧊',
    description: 'создает объемный объект по тексту или изображению.',
    input: 'опиши объект или прикрепи референс на чистом фоне. укажи, нужны ли текстуры и какой формат файла требуется.'
  },
  russian: {
    icon: '🇷🇺',
    description: 'модель с русскоязычным интерфейсом и хорошей поддержкой запросов на русском языке.',
    input: 'задачу по-русски и файл, если он нужен для результата.'
  },
  experimental: {
    icon: '🧪',
    description: 'малоизвестная модель, которую редко встретишь в обычных агрегаторах. раздел нужен для тех, кто хочет находить сильные варианты раньше массовой аудитории.',
    input: 'опишите задачу обычным сообщением и добавьте файл, если без него модель не сможет выполнить запрос.'
  }
});

const familyCopy = Object.freeze({
  openai: 'универсальная модель OpenAI для текста, анализа и кода. хорошо выполняет задачи с четкими требованиями к форме ответа.',
  anthropic: 'модель Claude для работы с длинными текстами, документами, кодом и подробным анализом.',
  google: 'мультимодальная модель Gemini для текста, изображений, документов и задач с большим объемом контекста.',
  xai: 'модель Grok для текста, кода, рассуждений и работы с актуальной информацией, когда доступен поиск.',
  kimi: 'модель Kimi с сильной работой по длинному контексту, документам, рассуждениям и программированию.',
  deepseek: 'модель DeepSeek для рассуждений, программирования, математики и недорогой обработки текста.',
  qwen: 'модель Qwen для текста, кода, изображений и многоязычных задач.',
  search: 'поисковая модель, которая собирает ответ по свежим источникам и подходит для исследования темы.'
});

const namedCopy = Object.freeze({
  nano_banana_2: ['🍌', 'быстрая модель Google для генерации и редактирования изображений. хорошо сохраняет персонажей, предметы и общий стиль при правках.'],
  nano_banana_2_lite: ['🍌', 'облегченная версия Nano Banana для быстрых черновиков, простых правок и серий изображений.'],
  seedream_50_pro: ['📊', 'флагманская модель ByteDance для детальных изображений, рекламных кадров и точной работы с текстом внутри картинки.'],
  seedream_50_lite: ['📊', 'быстрая версия Seedream для эскизов, иллюстраций и проверки нескольких визуальных идей.'],
  gpt_image_2: ['🌀', 'модель OpenAI для генерации и редактирования изображений, особенно удобна для макетов, надписей и последовательных правок.'],
  flux_2_pro: ['🌈', 'модель FLUX для фотореалистичных кадров, сложных композиций и точного следования подробному описанию.'],
  recraft_41: ['🎨', 'модель Recraft для дизайна, иллюстраций, рекламной графики и изображений с аккуратной композицией.'],
  higgsfield_soul: ['H', 'создает выразительные портреты и журнальные кадры с сильной работой по свету, внешности персонажа и fashion-эстетике.', 'портретов, fashion-съемок, обложек и кадров с узнаваемым визуальным стилем.'],
  midjourney: ['⛵', 'генератор выразительных изображений с сильной стилизацией, светом и художественной композицией.'],
  ideogram_3: ['🔤', 'модель для постеров, типографики и изображений, где важно правильно написать текст внутри кадра.'],
  kling_30: ['🌐', 'флагманская видеомодель Kling для реалистичного движения, сложной камеры и видео по изображению.'],
  veo_31_fast: ['✦', 'быстрая версия Veo для видео со звуком, диалогами и управляемым движением камеры.'],
  veo_31_quality: ['✦', 'качественный режим Veo для детального видео, естественного движения и синхронного звука.'],
  sora_2: ['🌀', 'видеомодель OpenAI для сцен по описанию, анимации изображений и последовательного движения объектов.'],
  vidu_q2: ['▶️', 'быстрая видеомодель Vidu для роликов по тексту или изображению. умеет оживлять персонажей и собирать короткие сцены с заметным движением.'],
  ltx_2: ['LTX', 'модель Lightricks для управляемого видео по тексту и изображению. подходит для раскадровок, анимации исходного кадра и быстрых итераций.'],
  hunyuan_video: ['🧊', 'открытая видеомодель Tencent для генерации сцен по описанию. полезна как альтернативный вариант для реалистичного движения и сложных кадров.'],
  mochi_1: ['G', 'открытая модель Genmo для видео по тексту. подходит для атмосферных сцен, движения камеры и проверки нестандартных визуальных идей.'],
  higgsfield_video: ['H', 'видеомодель Higgsfield с упором на выразительное движение камеры, рекламную подачу и короткие кинематографичные ролики.'],
  heygen_video: ['H', 'создает ролики с говорящими аватарами, озвучкой и синхронизацией губ. подходит для ведущих, обучающих видео и локализации.'],
  happyhorse_11: ['🌊', 'видеомодель для динамичных роликов по тексту или изображению, особенно полезна для быстрых креативных проб.'],
  gemini_omni_video: ['✦', 'мультимодальная модель Google для видео, которая может учитывать текст и несколько типов референсов.'],
  suno_55: ['🎸', 'музыкальная модель Suno для готовых песен с вокалом, аранжировкой и текстом.'],
  eleven_voice: ['🎙', 'озвучивает текст естественными голосами ElevenLabs и подходит для роликов, подкастов и дубляжа.'],
  voice_clone: ['👥', 'создает голосовой профиль по записи и затем озвучивает новые тексты похожим голосом.'],
  remove_bg: ['✂️', 'удаляет фон у изображения и возвращает объект на прозрачном фоне.'],
  face_swap: ['🎭', 'заменяет лицо на фотографии или в кадре, сохраняя позу, свет и выражение.'],
  inpaint: ['🖌', 'заменяет или дорисовывает выбранную область изображения по короткой инструкции.'],
  outpaint: ['🖼', 'расширяет изображение за исходные границы и дорисовывает окружающую сцену.'],
  topaz_image: ['🔎', 'увеличивает изображение, восстанавливает детали и уменьшает шум.'],
  topaz_video: ['🔎', 'увеличивает разрешение видео, повышает четкость и сглаживает движение.'],
  magnific_upscaler: ['🔎', 'увеличивает изображение и творчески восстанавливает мелкие детали. лучше подходит для портретов, фактур и кадров, которым не хватает выразительности.'],
  clarity_upscaler: ['🔎', 'повышает разрешение исходника с упором на чистые контуры и контролируемую резкость. удобен для товаров, графики и аккуратной подготовки к печати.'],
  image_editor: ['🖌', 'собирает несколько правок изображения в одном запросе. можно убрать объект, заменить фон, поправить цвет и сохранить остальную композицию.'],
  photo_master: ['📷', 'автоматически улучшает готовую фотографию. исправляет свет, цвет, резкость и мелкие дефекты без ручной работы по областям.'],
  yandexgpt_51_pro: ['Я', 'старшая текстовая модель Yandex для сложных запросов на русском языке, анализа документов и ответов с подробной структурой.'],
  yandexgpt_5_pro: ['Я', 'универсальная модель Yandex для деловых текстов, анализа, идей и повседневных задач на русском языке.'],
  yandexgpt_5_lite: ['Я', 'быстрая версия YandexGPT для коротких ответов, переписывания текста, классификации и массовых запросов.'],
  alice_ai: ['Я', 'разговорная модель Яндекса для бытовых вопросов, идей, объяснений и естественного диалога на русском языке.'],
  gigachat_2_max: ['🟢', 'старшая модель GigaChat для сложного анализа, длинных документов, рассуждений и программирования на русском языке.'],
  gigachat_2_pro: ['🟢', 'рабочая версия GigaChat для текстов, кода, анализа файлов и задач, где нужен баланс скорости и качества.'],
  gigachat_2: ['🟢', 'универсальная российская модель для текстов, идей, вопросов по изображениям и повседневной работы.'],
  ru_yandex_art: ['Я', 'генератор Яндекса для иллюстраций и изображений по русскому описанию. хорошо понимает локальные формулировки и сюжеты.'],
  ru_gigaam_v3: ['🟢', 'модель Сбера для распознавания русской речи. расшифровывает голосовые сообщения, встречи, интервью и лекции.'],
  kandinsky: ['🎨', 'российская генеративная модель для изображений по тексту и референсу. подходит для иллюстраций, концептов и визуальных экспериментов.']
});

const exactCopy = Object.freeze({
  ...expansionCopy,
  gpt_image_2: {
    description: 'создает изображение с нуля и редактирует исходник без необходимости заново собирать весь промпт. хорошо держит композицию при последовательных правках и аккуратнее многих генераторов работает с надписями.',
    input: 'опишите сюжет, стиль, формат кадра и напишите нужный текст дословно. для правки прикрепите исходное изображение и перечислите, что сохранить, удалить или заменить.'
  },
  nano_banana_pro: {
    icon: '🍌',
    description: 'генерирует и редактирует изображения, умеет выпускать до четырех вариантов за запрос, поддерживает разрешение до 4K и поиск в интернете.',
    input: 'опишите, что хотите получить. для редактирования прикрепите исходные изображения и перечислите изменения.'
  },
  seedance_20: {
    icon: '🔘',
    description: 'создает видео длиной от 4 до 15 секунд в 480p, 720p, 1080p или 4K. поддерживает синхронный звук и умеет собирать сцену по нескольким референсам.',
    input: 'опишите сцену, выберите разрешение и длительность. можно приложить до 9 изображений, 3 видео и 3 аудиофайлов, но не больше 12 вложений суммарно.'
  }
});

function bestFor(model) {
  const name = model?.name?.toLowerCase() ?? '';
  const id = model?.id ?? '';

  if (model?.category === 'llm' || model?.category === 'experimental') {
    if (/coder|codex|code|kat-coder/.test(name)) return 'эту версию стоит брать для написания и разбора кода, поиска ошибок и рефакторинга.';
    if (/search|sonar|research/.test(name)) return 'она полезнее обычного чата, когда нужно найти свежую информацию и сверить несколько источников.';
    if (/vl|vision/.test(name)) return 'ей лучше поручать разбор изображений, скриншотов, схем и документов вместе с текстовым вопросом.';
    if (/mini|nano|lite|flash|air|xs/.test(name)) return 'её место в быстрых ответах, черновиках, классификации и массовой обработке коротких запросов.';
    if (/pro|opus|max|ultra|thinking|reasoning/.test(name)) return 'эта версия нужна для сложного анализа, длинных документов и задач с несколькими связанными условиями.';
    return 'она подходит для текстов, идей, анализа документов и обычных рабочих вопросов.';
  }

  if (model?.category === 'image') {
    if (/upscaler|magnific|clarity/.test(name)) return 'используйте её, чтобы увеличить небольшое изображение, вернуть детали и подготовить файл к печати.';
    if (/ideogram|gpt image|seedream/.test(name)) return 'лучший повод открыть её, постер, рекламный макет, карточка товара или изображение с надписью.';
    if (/recraft|flux|midjourney/.test(name)) return 'она особенно уместна для брендовой графики, иллюстраций, фотореализма и выраженного визуального стиля.';
    return 'она пригодится для нового изображения, вариации готового кадра или точечной правки по инструкции.';
  }

  if (model?.category === 'video') {
    if (/heygen/.test(name)) return 'выбирайте её для говорящих аватаров, ведущих и роликов с синхронизацией речи.';
    if (/motion/.test(name)) return 'она нужна, когда движение следует перенести на персонажа из исходного изображения.';
    if (/fast|mini/.test(name)) return 'это режим для быстрого черновика, проверки идеи и нескольких вариантов одной сцены.';
    if (/higgsfield|runway|luma|kling|seedance|veo|sora/.test(name)) return 'ей стоит поручать рекламные ролики, движение камеры и оживление исходных изображений.';
    return 'она подходит для коротких видео по тексту или изображению и проб с анимацией персонажей.';
  }

  if (model?.category === 'audio') {
    if (/sound|sfx/.test(name)) return 'используйте её для эффектов, переходов, фоновых шумов и коротких вставок.';
    if (/suno|udio|music|lyria/.test(name)) return 'она пригодится для готовой песни, инструментального трека, вокала или музыкального наброска.';
    return 'она создает музыку и звук по описанию, референсу или заданному настроению.';
  }

  if (model?.category === 'voice') {
    if (/clone|клонирование/.test(name)) return 'она создает цифровой голос для роликов, подкастов и повторной озвучки.';
    if (/transcribe|whisper|asr|parakeet|assembly|gigaam|deepgram|voxtral|chirp/.test(name)) return 'её стоит брать для интервью, созвонов, лекций и подготовки субтитров.';
    return 'она подходит для озвучки, дубляжа и речи с заранее выбранной подачей.';
  }

  if (model?.category === 'tools') {
    if (/topaz/.test(name)) return 'инструмент повышает разрешение и четкость исходного изображения или видео.';
    if (id === 'remove_bg') return 'он быстро готовит вырезки объектов на прозрачном фоне для карточек товаров и каталогов.';
    if (id === 'face_swap') return 'он заменяет лицо в портрете, сохраняя свет, позу и выражение.';
    if (id === 'inpaint' || id === 'outpaint') return 'он удаляет лишние объекты, дорисовывает детали и расширяет границы кадра.';
    return 'инструмент обрабатывает готовый файл без отдельного графического редактора.';
  }

  if (model?.category === '3d') {
    if (/splat/.test(name)) return 'используй ее для объемной сцены, которую нужно быстро показать с разных точек.';
    if (/meshy|rodin|h3\.1/.test(name)) return 'она подходит для детального ассета с геометрией и текстурами.';
    return 'она нужна для быстрого 3D-черновика по тексту или одному изображению.';
  }

  if (model?.category === 'russian') {
    if (/art|kandinsky/.test(name)) return 'выбирайте её для изображений по русскому описанию, иллюстраций и рекламных материалов.';
    if (/gigaam/.test(name)) return 'она нужна для расшифровки русской речи, интервью, голосовых сообщений и встреч.';
    return 'ей стоит поручать тексты и рабочие задачи, где важны русский язык и локальный контекст.';
  }

  return 'её полезно сравнить с популярной моделью на одной и той же задаче по тексту или коду.';
}

function individualDescription(model, fallback) {
  const name = model?.name ?? 'эта модель';
  const normalized = name.toLowerCase();

  if (model?.category === 'llm' || model?.category === 'experimental') {
    const versionedLlmCopy = {
      gpt_55: 'основная GPT поколения 5.5 для текста, анализа и повседневного кода. начинайте с нее, если специальный режим не нужен.',
      gpt_54: 'универсальная GPT поколения 5.4. пригодится как стабильная альтернатива новым версиям на привычных рабочих запросах.',
      gpt_53_chat: 'диалоговая GPT-5.3 для объяснений, переписывания и длинной переписки. ее сильная сторона в естественном продолжении разговора.',
      gpt_52: 'базовая GPT-5.2 для текстов и анализа. полезна для повторяемых задач, где важнее предсказуемый формат, чем новейшие возможности.',
      gpt_5: 'первая основная версия поколения GPT-5. подходит для общих вопросов, документов и несложного программирования.',
      gpt_55_pro: 'старший режим GPT-5.5 для задач с большим количеством условий. выбирайте его для сложного анализа и решений, которые нужно тщательно проверить.',
      gpt_54_pro: 'усиленная GPT-5.4 для длинных документов и многошагового кода. она медленнее базовой версии, зато лучше удерживает связанные требования.',
      gpt_52_pro: 'режим GPT-5.2 с увеличенной глубиной разбора. пригодится для логики, планирования и технических запросов с несколькими этапами.',
      gpt_5_pro: 'старшая GPT-5 для тяжелых интеллектуальных задач. дайте ей весь контекст сразу и отдельно перечислите критерии правильного ответа.',
      gpt_55_codex: 'Codex поколения 5.5 для изменений в кодовой базе, тестов и поиска ошибок. лучше всего работает, когда видит связанные файлы и логи.',
      gpt_53_codex: 'Codex поколения 5.3 для написания функций и разбора существующего кода. приложите интерфейсы и ожидаемое поведение.',
      gpt_52_codex: 'Codex поколения 5.2 для программирования по четкой спецификации. удобен для небольших правок, миграций и тестов.',
      gpt_5_codex: 'первая Codex-версия поколения GPT-5. подходит для генерации кода, ревью и объяснения незнакомого проекта.',
      gpt_54_mini: 'быстрая GPT-5.4 для коротких текстов, классификации и извлечения данных. экономит время на потоке однотипных запросов.',
      gpt_54_nano: 'самая компактная GPT-5.4. используйте ее для простых проверок, сортировки запросов и ответов в пару строк.',
      gpt_5_mini: 'облегченная GPT-5 для повседневных вопросов и черновиков. она быстрее полной версии, но хуже держит сложные многошаговые условия.',
      gpt_5_nano: 'минимальная GPT-5 для массовых простых операций. годится для тегов, коротких сводок и извлечения отдельных полей.',
      gpt_4o: 'полная GPT-4o быстро работает в диалоге, понимает изображения и разбирает файлы. выбирайте ее для мультимодальной задачи без отдельного режима рассуждения.',
      gpt_4o_mini: 'GPT-4o Mini нужна для коротких ответов и массовых запросов с изображениями. сложный файл или неоднозначную инструкцию лучше передать полной GPT-4o.',
      o3: 'o3 тратит время на рассуждение и проверку решения. подходит для математики, логики и сложного программирования.',
      o3_pro: 'o3 Pro рассчитана на самые тяжелые reasoning-задачи. выбирайте ее, когда глубина проверки важнее скорости и стоимости.',
      gpt_56_luna: 'быстрая версия линейки GPT-5.6 для диалога и обычных рабочих задач. выбирайте ее для писем, объяснений и короткого анализа.',
      gpt_56_luna_pro: 'усиленная Luna с более глубоким разбором и вниманием к ограничениям. подходит для длинного запроса, который базовая Luna упрощает.',
      gpt_56_terra: 'универсальная GPT-5.6 с упором на тексты, анализ и код. это основной рабочий вариант внутри новой линейки.',
      gpt_56_terra_pro: 'старшая Terra для кода, документов и решений с высокой ценой ошибки. скорость здесь уступает место тщательной проверке условий.',
      gpt_41: 'полная GPT-4.1 точно соблюдает инструкции и уверенно работает с кодом. полезна для задач с жестким форматом ответа.',
      gpt_41_mini: 'GPT-4.1 Mini сохраняет хорошее следование инструкциям при меньшей задержке. подходит для небольших функций и обработки текста.',
      gpt_41_nano: 'GPT-4.1 Nano рассчитана на простые и частые операции. используйте ее для классификации, тегов и извлечения полей.',
      claude_opus_48: 'Claude Opus 4.8 предназначена для длинных документов, сложного анализа и крупных изменений в коде. это старший режим семейства.',
      claude_opus_47: 'Claude Opus 4.7 полезна как проверенная старшая версия для анализа и программирования. выбирайте ее для сравнения с новым Opus 4.8.',
      claude_opus_46: 'Claude Opus 4.6 справляется с длинным контекстом и подробными инструкциями. подходит для стабильных повторяемых процессов на Claude.',
      gemini_36_flash: 'самая новая Flash-версия Gemini в каталоге. рассчитана на быстрый разбор текста, изображений и документов.',
      gemini_35_flash: 'быстрая Gemini 3.5 для мультимодальных запросов. удобна для повседневной работы с файлами без задержки Pro-режима.',
      gemini_3_flash: 'базовая Flash-версия третьего поколения Gemini. подходит для коротких ответов, анализа изображений и массовой обработки.',
      gemini_25_flash: 'проверенная Gemini 2.5 Flash для текста и файлов. разумный выбор для повторяемых задач с понятным форматом результата.',
      gemini_31_pro: 'Gemini 3.1 Pro работает с большим контекстом, файлами и сложным анализом. это старшая стабильная версия поколения 3.1.',
      gemini_3_pro: 'Gemini 3 Pro нужна для тяжелых мультимодальных запросов и длинных документов. полезна как альтернатива версии 3.1 на том же материале.',
      gemini_25_pro: 'Gemini 2.5 Pro проверена на документах, коде и больших объемах контекста. выбирайте ее для процессов, где важна предсказуемость версии.',
      gemini_31_pro_preview: 'предварительная Gemini 3.1 Pro показывает возможности следующей старшей версии. тестируйте ее на копии задачи, потому что поведение еще может измениться.',
      gemini_3_flash_preview: 'предварительная Gemini 3 Flash дает ранний доступ к быстрому режиму третьего поколения. полезна для оценки скорости и формата ответов до стабильного релиза.',
      gemini_35_flash_lite: 'Gemini 3.5 Flash Lite создана для самых быстрых и дешевых операций с текстом и файлами. сложные выводы лучше передать обычной Flash.',
      gemini_31_flash_lite: 'Gemini 3.1 Flash Lite подходит для классификации и извлечения данных из большого потока запросов. это легкий стабильный вариант поколения 3.1.',
      grok_45: 'Grok 4.5 универсальна для рассуждений, кода и вопросов по текущим событиям при доступном поиске. это старшая версия семейства в каталоге.',
      grok_43: 'Grok 4.3 подходит для текста, анализа и программирования. используйте ее как более проверенную альтернативу новой версии 4.5.',
      grok_420: 'Grok 4.20 рассчитана на повседневный диалог, код и актуальные вопросы. удобна для сравнения поведения разных поколений Grok.',
      kimi_k3: 'Kimi K3 работает с длинным контекстом, документами и сложным кодом. это старшая универсальная Kimi в каталоге.',
      kimi_k26: 'Kimi K2.6 подходит для больших файлов и продолжительных рабочих диалогов. хороший стабильный вариант перед переходом на K3.',
      kimi_k25: 'Kimi K2.5 справляется с документами, текстом и программированием. используйте ее для повторяемых задач на знакомой версии.',
      minimax_m3: 'MiniMax M3 рассчитана на длинный контекст и сложные рабочие запросы. это самая новая универсальная MiniMax в каталоге.',
      minimax_m27: 'MiniMax M2.7 занимает середину линейки по возможностям и скорости. подходит для документов и обычного анализа.',
      minimax_m25: 'MiniMax M2.5 полезна для стабильных текстовых процессов и длинных диалогов. выбирайте ее, если новые версии не дают заметного выигрыша.',
      qwen_37_plus: 'Qwen 3.7 Plus универсальна для текста, кода и многоязычных задач. занимает середину между быстрым Flash и старшим Max.',
      qwen_35_plus: 'Qwen 3.5 Plus подходит для повседневного анализа и программирования. это стабильная версия Plus для повторяемых процессов.',
      qwen_3_coder: 'Qwen 3 Coder пишет функции, объясняет код и помогает с отладкой. приложите соседние модули, чтобы правка учитывала проект.',
      qwen_3_coder_next: 'Qwen 3 Coder Next рассчитана на более крупные изменения и работу с несколькими файлами. полезна для рефакторинга и задач по репозиторию.',
      tencent_hy3: 'Tencent Hy3 универсальна для текста, анализа и кода. используйте стабильную версию в повторяемых рабочих процессах.',
      tencent_hy3_preview: 'Tencent Hy3 Preview дает ранний доступ к следующему поведению модели. подходит для сравнения, но формат ответа еще может меняться.',
      sonar_pro: 'Perplexity Sonar Pro отвечает по свежим источникам и лучше обычной Sonar держит сложный вопрос. попросите приложить ссылки к ключевым фактам.',
      sonar_search: 'Sonar Pro Search создана для точечного поиска по интернету. задайте период, регион и критерии, по которым нужно отобрать источники.',
      kat_coder_air_25: 'KAT-Coder-Air V2.5 быстро пишет и исправляет код. используйте ее для небольших функций, тестов и короткого цикла правок.',
      kat_coder_pro_25: 'KAT-Coder-Pro V2.5 рассчитана на архитектуру и длинные цепочки изменений. приложите структуру репозитория и связанные файлы.',
      aion_30: 'Aion 3.0 универсальная экспериментальная модель для текста, анализа и кода. сравните ее ответ со старшей массовой моделью на одной задаче.',
      aion_30_mini: 'Aion 3.0 Mini дает быстрый доступ к той же экспериментальной линейке. подходит для коротких итераций и черновой проверки идеи.',
      laguna_xs_21: 'Laguna XS 2.1 самая компактная версия линейки. нужна для коротких ответов, классификации и быстрых проб.',
      laguna_s_21: 'Laguna S 2.1 занимает середину экспериментальной линейки. подходит для обычного текста и анализа без задержки M.1.',
      laguna_m1: 'Laguna M.1 старшая модель семейства для сложных инструкций и длинного контекста. используйте ее, когда XS и S упрощают задачу.',
      nex_n2_mini: 'Nex N2 Mini предназначена для быстрых текстовых итераций. удобна для черновиков, сводок и сравнения альтернатив.',
      nex_n2_pro: 'Nex N2 Pro рассчитана на запросы с большим количеством условий. выбирайте ее для анализа и решений, которые нужно обосновать.',
      gpt_search: 'поисковый режим GPT. сначала собирает свежие страницы, затем отвечает по найденному и может приложить ссылки.',
      gpt_4o_search_preview: 'поисковая GPT-4o в предварительном режиме. полезна для актуальных вопросов, где кроме ссылок нужен разбор найденного.',
      gpt_4o_mini_search_preview: 'облегченный поисковый режим GPT-4o. выбирайте его для быстрых справок и короткой проверки факта по свежим страницам.'
    };
    if (versionedLlmCopy[model.id]) return versionedLlmCopy[model.id];

    if (model.category === 'experimental') {
      if (/kat-coder/.test(normalized)) return `${name} специализируется на программировании и работе с репозиториями. версия Air рассчитана на быстрые правки, Pro стоит оставить для архитектуры и длинных цепочек изменений.`;
      if (/inkling/.test(normalized)) return `${name} исследует сложную задачу через развернутое рассуждение. модель интересна там, где важен ход решения, а не только короткий финальный ответ.`;
      if (/longcat/.test(normalized)) return `${name} это малоизвестная универсальная модель для длинных диалогов и работы с текстом. ее имеет смысл сравнивать с GPT и Claude на одном промпте.`;
      if (/muse spark/.test(normalized)) return `${name} ориентирована на идеи и свободное письмо. попробуйте ее на названиях, концепциях и сюжетах, где сухая точность только мешает.`;
      if (/laguna/.test(normalized)) return `${name} входит в экспериментальную линейку Laguna. XS быстрее, S занимает середину, M.1 рассчитана на более тяжелые запросы.`;
      if (/nex/.test(normalized)) return `${name} представляет небольшую линейку Nex N2. Mini годится для быстрой проверки, Pro для запроса с большим количеством условий.`;
      if (/aion/.test(normalized)) return `${name} это универсальная экспериментальная модель. обычная версия рассчитана на сложные задачи, Mini нужна для коротких итераций.`;
      if (/fugu/.test(normalized)) return `${name} это редкая крупная модель общего назначения. запускайте ее как альтернативное мнение для анализа, текста и нетипичных форматов.`;
    }

    if (/sonar|search|research/.test(normalized)) {
      if (/deep research/.test(normalized)) return `${name} проводит многошаговый поиск и сводит найденное в подробный отчет со ссылками. это режим для исследования, а не для мгновенного ответа.`;
      if (/reasoning/.test(normalized)) return `${name} сочетает поиск с рассуждением. полезна, когда найденные факты еще нужно сопоставить или проверить на противоречия.`;
      if (/pro/.test(normalized)) return `${name} ищет актуальные страницы и собирает ответ с источниками. Pro лучше обычного Sonar держит сложный вопрос и длинный контекст.`;
      return `${name} отвечает с опорой на свежую выдачу. укажите период, географию и попросите ссылки, если результат нужно перепроверить.`;
    }

    if (model.family === 'openai') {
      if (/codex/.test(normalized)) return `${name} работает с кодом, ошибками и изменениями в проекте. приложите нужные файлы, логи и объясните, каким должно быть поведение после правки.`;
      if (/\bo3\b/.test(normalized)) return `${name} тратит больше времени на рассуждение и проверку решения. Pro предназначена для самых тяжелых задач, обычная версия быстрее и дешевле.`;
      if (/o4-mini/.test(normalized)) return `${name} это компактная reasoning-модель OpenAI. ее удобно использовать для математики, логики и кода, когда полноценная старшая модель избыточна.`;
      if (/gpt-4o/.test(normalized)) return `${name} принимает текст и изображения и быстро отвечает в диалоге. Mini подходит для массовых коротких запросов, полная версия лучше разбирает сложные файлы.`;
      if (/gpt-4\.1/.test(normalized)) return `${name} хорошо соблюдает инструкции и подходит для программирования. Mini и Nano нужны там, где скорость и цена важнее глубины разбора.`;
      if (/gpt-oss/.test(normalized)) return `${name} это открытая модель OpenAI на 20 миллиардов параметров. бесплатный доступ годится для простых текстов, классификации и локальных экспериментов.`;
      if (/luna/.test(normalized)) return `${name} относится к линейке GPT-5.6 для повседневного диалога и быстрых рабочих задач. Pro выбирайте, когда в запросе много условий или нужен подробный разбор.`;
      if (/terra/.test(normalized)) return `${name} это универсальная версия GPT-5.6 с упором на тексты, анализ и код. Pro рассчитана на длинный контекст и задачи, где ошибка обходится дорого.`;
      if (/mini|nano/.test(normalized)) return `${name} это облегченная GPT для коротких ответов, извлечения данных и обработки потока однотипных запросов. сложный документ лучше передать полной версии.`;
      if (/pro/.test(normalized)) return `${name} это старший режим GPT для анализа, кода и задач с несколькими ограничениями. дайте контекст и критерии результата в одном сообщении.`;
      return `${name} это универсальная GPT для текста, анализа и кода. она удобна как основная модель, когда специальный режим не нужен.`;
    }

    if (model.family === 'anthropic') {
      if (/haiku/.test(normalized)) return `${name} это самая быстрая Claude в семействе. хорошо справляется с краткими ответами, извлечением фактов и обработкой большого числа похожих текстов.`;
      if (/sonnet/.test(normalized)) return `${name} занимает рабочую середину семейства Claude. ее выбирают для документов, кода и редакторских задач, где нужен сильный результат без цены Opus.`;
      if (/fable/.test(normalized)) return `${name} это версия Claude с акцентом на письмо, идеи и повествование. попробуйте ее на сценариях, диалогах и тексте, которому нужен живой ритм.`;
      if (/fast/.test(normalized)) return `${name} это ускоренный режим Opus. он сохраняет глубину старшей Claude, но рассчитан на задачи, где долго ждать ответ неудобно.`;
      return `${name} это старшая Claude для длинных документов, сложного анализа и работы с большим кодом. ее преимущество заметнее на запросах, которые не помещаются в пару абзацев.`;
    }

    if (model.family === 'google') {
      if (/custom tools/.test(normalized)) return `${name} это предварительная версия Gemini для вызова инструментов. она нужна для проверки цепочек, где модель выбирает действие и передает ему параметры.`;
      if (/preview/.test(normalized)) return `${name} это предварительная сборка Gemini. используйте ее для знакомства с новым поведением, но не рассчитывайте на неизменный формат ответа.`;
      if (/flash lite/.test(normalized)) return `${name} это самый легкий режим Gemini для классификации, извлечения полей и коротких ответов. длинный документ лучше отдать Flash или Pro.`;
      if (/flash/.test(normalized)) return `${name} это быстрая Gemini для текста, изображений и документов. это удачный вариант, когда запросов много, а задержка важна.`;
      return `${name} это старшая Gemini для большого контекста, файлов и сложного анализа. приложите материалы целиком и отдельно сформулируйте, какой вывод нужен.`;
    }

    if (model.family === 'xai') {
      if (/build/.test(normalized)) return `${name} ранняя модель Grok для программирования. отправьте код, текст ошибки и ожидаемый результат, чтобы получить правку, а не общий совет.`;
      return `${name} модель семейства Grok для рассуждений, текста и кода. при доступном поиске ее удобно использовать для вопросов о текущих событиях.`;
    }

    if (model.family === 'kimi') {
      if (/code/.test(normalized)) return `${name} версия Kimi для программирования и длинных файлов. подходит для ревью, поиска ошибки и согласованных изменений в нескольких модулях.`;
      if (/thinking/.test(normalized)) return `${name} показывает сильную сторону Kimi в рассуждениях. выбирайте ее для логики, математики и запросов, где решение важнее скорости.`;
      return `${name} работает с длинным контекстом, документами и кодом. можно загрузить несколько материалов и попросить свести их в один вывод.`;
    }

    if (model.family === 'deepseek') {
      if (/flash/.test(normalized)) return `${name} быстрая версия DeepSeek для кода и коротких рассуждений. она подходит для итераций, но сложную проверку лучше повторить в Pro.`;
      if (/\br1\b/.test(normalized)) return `${name} reasoning-модель DeepSeek для математики, логики и программирования. попросите показать проверку решения, если цена ошибки высока.`;
      if (/exp/.test(normalized)) return `${name} экспериментальная сборка DeepSeek V3.2. полезна для сравнения качества, однако стиль и формат ответа еще могут меняться.`;
      if (/pro/.test(normalized)) return `${name} старший режим DeepSeek для сложного кода и рассуждений. используйте его на задачах с несколькими зависимыми шагами.`;
      return `${name} универсальная DeepSeek для текста, кода и анализа. это экономный основной вариант без отдельного режима глубокого рассуждения.`;
    }

    if (model.family === 'qwen') {
      if (/coder/.test(normalized)) return `${name} специализируется на коде. версия Next полезна для крупных изменений, обычный Coder удобен для функций, тестов и отладки.`;
      if (/\bvl\b/.test(normalized)) return `${name} читает изображения, скриншоты и документы вместе с текстом. покажите нужную страницу и задайте конкретный вопрос по ней.`;
      if (/preview/.test(normalized)) return `${name} предварительная версия старшей Qwen. она подходит для тестов новых возможностей, но формат ответа может измениться.`;
      if (/flash/.test(normalized)) return `${name} быстрая Qwen для коротких многоязычных запросов и массовой обработки. для сложного анализа выберите Plus или Max.`;
      if (/max/.test(normalized)) return `${name} старшая Qwen для документов, кода и сложных рассуждений. она нужна, когда запрос нельзя надежно решить одним быстрым проходом.`;
      return `${name} универсальная Qwen для текста, кода и нескольких языков. Plus занимает середину между быстрым Flash и старшим Max.`;
    }

    if (/minimax/.test(normalized)) return `${name} универсальная модель MiniMax с длинным контекстом. используйте ее для больших документов, текста и задач, которые требуют помнить ранние детали.`;
    if (/glm/.test(normalized)) return `${name} старшая языковая модель Zhipu AI. подходит для текста, анализа и программирования, особенно как независимая проверка ответа другой модели.`;
    if (/tencent/.test(normalized)) return `${name} языковая модель Tencent общего назначения. Preview показывает новое поведение раньше стабильной версии, поэтому формат ответа может меняться.`;
    if (/cohere/.test(normalized)) return `${name} компактная модель Cohere для кода и работы внутри инструментальных цепочек. удобна для быстрых правок и структурированных ответов.`;
    if (/openrouter fusion/.test(normalized)) return `${name} автоматически выбирает подходящую модель из каталога OpenRouter. используйте ее, когда важен результат, а конкретный бренд не принципиален.`;
    if (/step/.test(normalized)) return `${name} быстрая модель StepFun для текста и повседневного анализа. ее удобно сравнивать с Gemini Flash и Qwen Flash.`;
    if (/mistral small/.test(normalized)) return `${name} компактная Mistral для быстрых текстовых задач и европейских языков. подходит для классификации, переписывания и извлечения данных.`;
    if (/mistral medium/.test(normalized)) return `${name} средняя Mistral для текста, анализа и кода. это баланс между скоростью Small и возможностями Large.`;
    if (/mistral large/.test(normalized)) return `${name} старшая универсальная Mistral. выбирайте ее для длинных документов, сложных инструкций и многоязычной работы.`;
    if (/devstral/.test(normalized)) return `${name} модель Mistral для разработки и работы с репозиториями. приложите структуру проекта, связанные файлы и проверяемый результат.`;
    if (/codestral/.test(normalized)) return `${name} специализируется на генерации и дополнении кода. лучше всего работает, когда видит сигнатуры, соседние функции и ограничения проекта.`;
    if (/gemma/.test(normalized)) return `${name} открытая модель Google общего назначения. подойдет для текста, простого кода и экспериментов, где важна переносимость.`;
    if (/nemotron.*ultra/.test(normalized)) return `${name} старшая модель NVIDIA для рассуждений и сложных инструкций. используйте ее для проверки логики и длинных технических задач.`;
    if (/nemotron/.test(normalized)) return `${name} модель NVIDIA для текста, кода и рассуждений. это более легкая альтернатива Ultra для повседневных запросов.`;
    if (/llama.*maverick/.test(normalized)) return `${name} универсальная открытая Llama с упором на сложные инструкции и мультимодальные задачи. подходит для анализа и разработки.`;
    if (/llama.*scout/.test(normalized)) return `${name} облегченная Llama для длинного контекста и быстрых ответов. выбирайте ее для черновой обработки больших объемов текста.`;
    return `языковая модель ${name} принимает обычный текстовый запрос и возвращает связный ответ. используй её для анализа, редактирования, кода или проверки идеи; добавь исходные данные, ограничения и желаемый формат результата.`;
  }

  if (model?.category === 'image') {
    if (/upscaler|magnific|clarity/.test(normalized)) return `${name} не рисует кадр заново, а увеличивает исходник и восстанавливает детали, которые потерялись из-за малого разрешения или сжатия.`;
    if (/gpt.image 1\.5/.test(normalized)) return `${name} генерирует изображения и меняет готовые кадры по инструкции. особенно полезна для последовательных правок, когда композицию нужно сохранить.`;
    if (/gpt-5 image mini/.test(normalized)) return `${name} облегченный режим генерации OpenAI для быстрых эскизов и серий вариантов. сложные надписи и мелкие детали лучше оставить полной версии.`;
    if (/gpt-5 image/.test(normalized)) return `${name} соединяет генерацию изображения с пониманием сложной текстовой инструкции. подходит для макетов, схем и правок в несколько шагов.`;
    if (/sora image/.test(normalized)) return `${name} создает статичные кадры в визуальной линейке Sora. попробуйте ее для кинематографичных сцен, света и широких композиций.`;
    if (/flux 2 flex/.test(normalized)) return `${name} гибкая версия FLUX для стилизации и управляемых вариаций. она удобна, когда нужно перебрать несколько трактовок одного референса.`;
    if (/kling kolors/.test(normalized)) return `${name} генератор изображений из семейства Kling с выразительным цветом и портретной подачей. полезен для героев, обложек и рекламных кадров.`;
    if (/grok image/.test(normalized)) return `${name} быстро превращает текстовую идею в изображение и подходит для визуальных шуток, концептов и черновых иллюстраций.`;
    if (/qwen image/.test(normalized)) return `${name} понимает подробные многоязычные запросы и умеет редактировать исходник. хороший вариант для сложной сцены с несколькими объектами.`;
    if (/wan image/.test(normalized)) return `${name} открытая модель Alibaba для генерации изображений. ее стоит попробовать на иллюстрациях, персонажах и стилизованных сценах.`;
    if (/luma image/.test(normalized)) return `${name} создает атмосферные изображения с естественным светом и глубиной кадра. полезна для концепт-артов и визуальных раскадровок.`;
    if (/runway frames/.test(normalized)) return `${name} предназначена для ключевых кадров и раскадровок. с ее помощью удобно сначала собрать внешний вид сцены, а затем переносить его в видео.`;
    if (/yandexart/.test(normalized)) return `${name} понимает запросы на русском и создает иллюстрации по тексту. особенно удобна для локальных сюжетов и формулировок без перевода.`;
    if (/image mini|lite/.test(normalized)) return `${name} нужна для быстрых черновиков и серий вариантов. она экономнее старшей версии, но хуже подходит для мелких деталей и сложной типографики.`;
    return `${name} создает новый кадр по описанию и принимает исходное изображение для правок. характер результата зависит от референса и точности ограничений в запросе.`;
  }

  if (model?.category === 'video') {
    if (/seedance 2\.0 fast/.test(normalized)) return `${name} сокращает ожидание при генерации динамичной сцены. используйте Fast для перебора движений и композиции перед финальным запуском.`;
    if (/seedance 2\.0 mini/.test(normalized)) return `${name} самый легкий режим Seedance 2.0 для черновых роликов. он полезен для быстрой проверки промпта и референса.`;
    if (/seedance 1\.5 pro/.test(normalized)) return `${name} старшая версия предыдущего поколения Seedance. подходит для стабильных процессов и сравнения с новой линейкой 2.0.`;
    if (/seedance/.test(normalized)) return `${name} собирает динамичную сцену по тексту и нескольким референсам. лучше всего раскрывается на последовательном движении и управляемой камере.`;
    if (/kling 3\.0 motion/.test(normalized)) return `${name} переносит движение из видео-референса на героя исходного кадра. чистая поза и хорошо видимый силуэт важнее длинного описания.`;
    if (/kling 2\.5 turbo/.test(normalized)) return `${name} ускоренная версия Kling для быстрых вариантов сцены. финальный ролик со сложной физикой лучше повторить в старшей модели.`;
    if (/kling 2\.6/.test(normalized)) return `${name} стабильная версия Kling для видео по тексту и изображению. подходит для реалистичного движения и оживления портретов.`;
    if (/kling/.test(normalized)) return `${name} хорошо передает физику движения и оживляет исходный кадр. задайте одно действие, движение камеры и неизменные детали.`;
    if (/veo/.test(normalized)) return `${name} генерирует видео вместе со звуком и речью. Fast удобен для итераций, Quality нужен для финального кадра с большим количеством деталей.`;
    if (/wan 2\.6/.test(normalized)) return `${name} новая версия открытой видеомодели Alibaba. подходит для сложного движения и роликов по подробному описанию или изображению.`;
    if (/wan 2\.5/.test(normalized)) return `${name} стабильная открытая видеомодель Alibaba для сцен по тексту и изображению. полезна как быстрый запасной вариант для версии 2.6.`;
    if (/runway/.test(normalized)) return `${name} подходит для управляемой анимации кадра и кинематографичного движения камеры. хороший выбор для рекламы и раскадровок.`;
    if (/luma dream/.test(normalized)) return `${name} делает короткие атмосферные сцены с плавным движением. сильнее всего выглядит на пейзажах, предметных кадрах и переходах камеры.`;
    if (/hailuo/.test(normalized)) return `${name} быстро оживляет изображение и хорошо справляется с заметным движением персонажей. используйте короткое описание одного действия.`;
    if (/pika/.test(normalized)) return `${name} рассчитана на короткие эффектные клипы и трансформации. подходит для соцсетей, мемов и визуальных переходов.`;
    if (/grok imagine/.test(normalized)) return `${name} видеорежим xAI для быстрых сцен по описанию. полезен для идей и необычных визуальных проб, где важнее находка, чем точный контроль.`;
    if (/fast|mini|turbo/.test(normalized)) return `${name} сокращает ожидание и подходит для чернового монтажа идеи. финальный ролик со сложным движением лучше повторить в качественном режиме.`;
    if (/motion/.test(normalized)) return `${name} переносит заданное движение на исходный кадр. результат сильнее зависит от чистого референса, чем от длинного текстового описания.`;
    return `${name} собирает короткую сцену по тексту или изображению. заранее задайте действие, движение камеры и то, что должно остаться неизменным.`;
  }

  if (model?.category === 'audio') {
    if (/suno mashup/.test(normalized)) return `${name} соединяет материал нескольких треков в новую версию. приложите исходники и укажите, какие части, темп и настроение нужно сохранить.`;
    if (/suno sounds/.test(normalized)) return `${name} создает короткие звуковые эффекты внутри экосистемы Suno. подходит для ударов, переходов, окружения и вставок в монтаж.`;
    if (/lyria 3 pro/.test(normalized)) return `${name} старшая музыкальная модель Google для полноценных инструментальных композиций. подробно задайте жанр, развитие и набор инструментов.`;
    if (/lyria 3 clip/.test(normalized)) return `${name} делает короткие музыкальные фрагменты для роликов и заставок. удобна, когда нужен фон заданной длины без полной песни.`;
    if (/elevenlabs music/.test(normalized)) return `${name} создает музыку для видео, подкастов и коммерческих проектов. опишите сцену, настроение и момент, в котором трек должен измениться.`;
    if (/stable audio/.test(normalized)) return `${name} генерирует инструментальные фрагменты, атмосферу и звуковой дизайн. хорошо работает с точной длительностью и описанием фактуры звука.`;
    if (/udio/.test(normalized)) return `${name} собирает песни и инструментальные треки с выразительной аранжировкой. укажите жанр, эпоху, вокал и структуру композиции.`;
    if (/minimax music/.test(normalized)) return `${name} создает песни по тексту и музыкальному описанию. подходит для быстрых демо с вокалом и понятной куплетной структурой.`;
    if (/elevenlabs sound/.test(normalized)) return `${name} генерирует отдельные эффекты с точной сценой и длительностью. полезна для киношного окружения, фоли и переходов.`;
    if (/генератор звуков/.test(normalized)) return `${name} делает одиночный эффект по короткому описанию. напишите, что звучит, где это происходит и сколько секунд нужен файл.`;
    if (/sound|sfx/.test(normalized)) return `${name} создает отдельные звуки вместо целой песни. это окружение, удары, переходы, шумы и короткие эффекты для монтажа.`;
    return `${name} превращает описание в музыкальный фрагмент или готовый трек. жанр, темп, настроение и устройство вокала лучше указать сразу.`;
  }

  if (model?.category === 'voice') {
    if (/elevenlabs voice/.test(normalized)) return `${name} озвучивает текст естественными голосами и управляет подачей. подходит для дубляжа, роликов и длинных закадровых текстов.`;
    if (/openai tts/.test(normalized)) return `${name} быстрая озвучка OpenAI с выбором голоса и формата файла. удобна для интерфейсов, инструкций и коротких роликов.`;
    if (/gpt-4o mini tts/.test(normalized)) return `${name} компактная модель OpenAI для речи с заданной интонацией. опишите не только текст, но и то, как его нужно произнести.`;
    if (/whisper/.test(normalized)) return `${name} проверенная модель OpenAI для расшифровки речи и субтитров. хорошо работает с многоязычными записями и знакомыми форматами аудио.`;
    if (/gpt-4o transcribe/.test(normalized)) return `${name} новая расшифровка OpenAI с улучшенной работой на сложной речи. выбирайте ее для шумных записей и нескольких говорящих.`;
    if (/chirp/.test(normalized)) return `${name} модель Google для распознавания речи на многих языках. подходит для звонков, видео и потоковой расшифровки.`;
    if (/qwen 3 asr/.test(normalized)) return `${name} распознает многоязычную речь и особенно интересна для китайского и смешанных записей. приложите чистый аудиофайл без пережатия.`;
    if (/voxtral/.test(normalized)) return `${name} модель Mistral для транскрибации и понимания аудио. умеет не только записать речь, но и отвечать по содержанию записи.`;
    if (/gigaam/.test(normalized)) return `${name} модель Сбера для русской речи. используйте ее для интервью, лекций и голосовых сообщений без предварительного перевода.`;
    if (/parakeet/.test(normalized)) return `${name} быстрая модель NVIDIA для расшифровки длинных записей. подойдет для больших архивов аудио и субтитров.`;
    if (/deepgram/.test(normalized)) return `${name} распознает речь в реальном времени и хорошо подходит для звонков. полезна, когда важны скорость, пунктуация и разделение реплик.`;
    if (/assemblyai/.test(normalized)) return `${name} универсальная транскрибация с разметкой длинных разговоров. используйте ее для встреч, подкастов и интервью с несколькими участниками.`;
    if (/cartesia/.test(normalized)) return `${name} быстрая модель синтеза речи с низкой задержкой. подходит для голосовых интерфейсов и реплик, которые должны звучать без долгого ожидания.`;
    if (/minimax speech/.test(normalized)) return `${name} создает выразительную речь и поддерживает разные голоса. полезна для персонажей, дубляжа и эмоциональных реплик.`;
    if (/transcribe|whisper|asr|parakeet|assembly|gigaam|deepgram|voxtral|chirp/.test(normalized)) return `${name} переводит речь в текст. язык, качество записи и нужный формат субтитров можно задать перед запуском.`;
    return `${name} озвучивает текст выбранным голосом. подачу лучше описывать словами о темпе, эмоции и дистанции до микрофона.`;
  }

  return fallback;
}

export function inputProfileFor(model) {
  if (!model) return [];
  if (model.category === 'llm') {
    const researched = researchedCardProfiles[model.id];
    if (researched) {
      return llmSettingsFor(model, profileSettings(researched).filter(({ key }) => key !== 'show_model'));
    }
    if (unverifiedLlmIds.has(model.id)) return [];
    if (model.id === 'gpt_53_chat') return maxTokensOnlyFields;
    if (reasoningLlmIds.has(model.id)) return llmSettingsFor(model, reasoningLlmFields);
    return llmSettingsFor(model, llmFields);
  }

  const exact = exactProfiles[model.id];
  if (providerNativeCuratedProfileIds.has(model.id) && model.provider === 'polza') {
    return providerSettingsFor(model);
  }
  if (exact) return exact;
  const researched = researchedCardProfiles[model.id];
  if (researched) {
    const settings = profileSettings(researched).filter(({ key }) => key !== 'show_model');
    if (model.category !== 'llm') return settings;
    return settings;
  }
  if (model.provider === 'polza' && Array.isArray(model.providerParameters)) {
    return providerSettingsFor(model);
  }
  if (exact) return exact;
  return [];
}

export function cardProfileFor(model) {
  const researched = researchedCardProfiles[model?.id];
  if (researched) {
    return Object.freeze({
      description: researched.description,
      instruction: researched.instruction,
      inputs: Object.freeze([...researched.inputs]),
      highlights: Object.freeze([...(researched.highlights ?? [])]),
      settingKeys: Object.freeze(inputProfileFor(model).map(({ key }) => key))
    });
  }

  const base = copyByCategory[model?.category] ?? copyByCategory.experimental;
  const fallback = copyFor(model);
  return Object.freeze({
    description: fallback.description,
    instruction: fallback.input ?? base.input,
    inputs: Object.freeze(providerInputProfiles[model?.providerModelId] ?? ['text']),
    highlights: Object.freeze([]),
    settingKeys: Object.freeze(inputProfileFor(model).map(({ key }) => key))
  });
}

export function inputContractFor(model) {
  return inputContracts[model?.id] ?? null;
}

export function copyFor(model) {
  const researched = researchedCardProfiles[model?.id];
  if (researched) {
    return Object.freeze({
      ...(copyByCategory[model?.category] ?? copyByCategory.experimental),
      description: researched.description,
      input: researched.instruction,
      highlights: researched.highlights,
      bestFor: ''
    });
  }

  const base = copyByCategory[model?.category] ?? copyByCategory.experimental;
  const named = namedCopy[model?.id];
  const familyDescription = familyCopy[model?.family];
  const exact = exactCopy[model?.id];
  const rawDescription = exact?.description ?? named?.[1] ?? individualDescription(model, familyDescription ?? base.description);
  const repeatedName = `${model?.name ?? ''} `;
  const description = rawDescription.startsWith(repeatedName)
    ? `${rawDescription.slice(repeatedName.length, repeatedName.length + 1).toLowerCase()}${rawDescription.slice(repeatedName.length + 1)}`
    : rawDescription;
  return Object.freeze({
    ...base,
    bestFor: bestFor(model),
    description,
    ...(named ? { icon: named[0] } : {}),
    ...(named?.[2] ? { bestFor: named[2] } : {}),
    ...(exact ?? {})
  });
}

export function iconFor(model) {
  return copyFor(model).icon;
}

export function defaultsFor(profile) {
  return Object.fromEntries(profile.map(({ key, defaultValue }) => [key, defaultValue]));
}

export function settingLabel(fieldDefinition, value) {
  return fieldDefinition.values.find((entry) => entry.value === value)?.label
    ?? valueLabels[value]
    ?? value;
}
