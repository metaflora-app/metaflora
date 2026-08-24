import { toolCardCopy } from './model-cards-tools.js';

const enumSetting = (label, defaultValue, values) => ({
  label,
  type: 'enum',
  default: defaultValue,
  values
});

const booleanSetting = (label, defaultValue) => ({
  label,
  type: 'boolean',
  default: defaultValue
});

const numberSetting = (label, defaultValue, min, max, step) => ({
  label,
  type: 'number',
  default: defaultValue,
  min,
  max,
  step
});

const stringSetting = (label, defaultValue = '') => ({
  label,
  type: 'string',
  default: defaultValue
});

const fixedPrice = (amount, unit) => ({
  type: 'fixed',
  currency: 'USD',
  amount,
  unit
});

const rangePrice = (min, max, unit) => ({
  type: 'range',
  currency: 'USD',
  min,
  max,
  unit
});

const tieredPrice = (setting, amounts, unit) => ({
  type: 'tiered',
  currency: 'USD',
  setting,
  amounts,
  unit
});

const input = (required, optional = [], constraints = {}) => ({
  required,
  optional,
  constraints
});

const falRoute = (endpoint) => [{
  provider: 'fal',
  endpoint,
  role: 'primary',
  verified: true
}];

const elevenRoute = (endpoint, runtimeOptions = {}) => ({
  provider: 'elevenlabs',
  endpoint,
  role: 'primary',
  verified: true,
  runtime: runtimeOptions
});

const fallbackFalRoute = (endpoint, runtimeOptions = {}) => ({
  provider: 'fal',
  endpoint,
  role: 'fallback',
  verified: true,
  ...(Object.keys(runtimeOptions).length > 0 ? { runtime: runtimeOptions } : {})
});

const polzaMediaRoute = (model, inputMap) => ({
  provider: 'polza',
  endpoint: 'https://polza.ai/api/v1/media',
  statusEndpoint: 'https://polza.ai/api/v1/media/{requestId}',
  model,
  role: 'primary',
  verified: true,
  runtime: {
    async: true,
    inputMap
  }
});

function defaultFallbackStatus(id, brand) {
  const reason = id === 'audio_music'
    ? 'Music uses a separate contract; no universal tool fallback is enabled.'
    : brand === 'elevenlabs'
      ? 'No exact voice model, input, and result contract is confirmed for this tool.'
      : 'No exact model, input, and output contract is confirmed for this tool.';
  return {
    provider: 'routerai',
    status: 'incompatible',
    reason
  };
}

const runtime = (inputMap, outputPath, resultKind, adapter = 'fal.subscribe', extra = {}) => ({
  adapter,
  inputMap,
  outputPath,
  ...extra,
  ...(resultKind ? { resultKind } : {})
});

const BRAND_FALLBACKS = Object.freeze({
  fal: 'fal',
  flux: 'FLUX',
  bria: 'B',
  elevenlabs: '🎙',
  kling: '🌐',
  meshy: 'M',
  minimax: '〽️',
  moondream: '🌙',
  topaz: '🔎',
  trellis: 'T',
  veo: 'Veo'
});

const TOOL_EMOJI_FALLBACKS = Object.freeze({
  photo_generate: '🎨',
  photo_edit: '🖌️',
  photo_pose_transfer: '🕺',
  photo_colorize: '🌈',
  photo_restore: '🩹',
  photo_remove_bg: '✂️',
  photo_object_remove: '🧹',
  photo_expand: '↔️',
  photo_face_restore: '🙂',
  photo_try_on: '👕',
  photo_product: '📦',
  photo_ocr: '🔤',
  photo_upscale: '🔍',
  video_generate: '🎬',
  video_image_to_video: '▶️',
  video_extend: '⏭️',
  video_understand: '🧐',
  video_edit: '✂️',
  video_live_photo: '🪄',
  video_lipsync: '👄',
  video_talking_head: '🗣️',
  video_remove_bg: '🎭',
  video_remove_object: '🧽',
  video_upscale: '📺',
  audio_stt: '📝',
  audio_tts: '🔊',
  audio_voice_clone: '🗣️',
  audio_isolation: '🎧',
  audio_stems: '🎚️',
  audio_sfx: '💥',
  audio_music: '🎵',
  audio_voice_change: '🎭',
  document_ocr: '📄',
  document_table: '📊',
  document_formula: '∑',
  document_chart: '📈',
  data_extract: '🧾',
  data_image_description: '👁️',
  three_d_image: '🧊',
  three_d_text: '🧱',
  three_d_extract: '🗿',
  three_d_multi_image: '📐'
});

const tool = ({
  id,
  name,
  category,
  subcategory,
  card,
  brand = 'fal',
  inputs,
  settings,
  pricing,
  endpoint,
  routes,
  inputMap,
  outputPath,
  resultKind,
  runtimeAdapter,
  runtimeOptions,
  fallbackStatus
}) => ({
  id,
  name,
  category,
  subcategory,
  brand,
  customEmojiKey: brand,
  customEmojiFallback: TOOL_EMOJI_FALLBACKS[id],
  logoFallback: BRAND_FALLBACKS[brand] ?? 'AI',
  active: true,
  card: {
    ...toolCardCopy[card],
    title: name
  },
  input: inputs,
  settings,
  pricing,
  routes: routes ?? falRoute(endpoint),
  runtime: runtime(inputMap, outputPath, resultKind, runtimeAdapter, runtimeOptions),
  fallbackStatus: fallbackStatus ?? defaultFallbackStatus(id, brand)
});

const catalog = [
  tool({
    id: 'photo_generate',
    name: 'создать изображение',
    category: 'photo',
    subcategory: 'generate',
    card: 'photo_generate',
    brand: 'google',
    inputs: input(['text']),
    settings: {
      aspect_ratio: enumSetting('соотношение сторон', 'auto', [
        'auto',
        '1:1',
        '3:2',
        '2:3',
        '4:3',
        '3:4',
        '16:9',
        '9:16'
      ]),
      resolution: enumSetting('разрешение', '1K', ['0.5K', '1K', '2K', '4K']),
      num_images: numberSetting('число вариантов', 1, 1, 4, 1),
      output_format: enumSetting('формат файла', 'png', ['png', 'jpeg', 'webp']),
      safety_tolerance: enumSetting('фильтр безопасности', '4', ['1', '2', '3', '4', '5', '6'])
    },
    pricing: tieredPrice('resolution', {
      '0.5K': 0.06,
      '1K': 0.08,
      '2K': 0.12,
      '4K': 0.16
    }, 'image'),
    endpoint: 'fal-ai/nano-banana-2',
    inputMap: { text: 'prompt' },
    outputPath: 'images.0'
  }),
  tool({
    id: 'photo_edit',
    name: 'изменить изображение',
    category: 'photo',
    subcategory: 'edit',
    card: 'photo_edit',
    brand: 'google',
    inputs: input(['images', 'text'], [], {
      images: { min: 1, max: 16 }
    }),
    settings: {
      aspect_ratio: enumSetting('соотношение сторон', 'auto', [
        'auto',
        '1:1',
        '3:2',
        '2:3',
        '4:3',
        '3:4',
        '16:9',
        '9:16'
      ]),
      resolution: enumSetting('разрешение', '1K', ['0.5K', '1K', '2K', '4K']),
      num_images: numberSetting('число вариантов', 1, 1, 4, 1),
      output_format: enumSetting('формат файла', 'png', ['png', 'jpeg', 'webp']),
      safety_tolerance: enumSetting('фильтр безопасности', '4', ['1', '2', '3', '4', '5', '6'])
    },
    pricing: tieredPrice('resolution', {
      '0.5K': 0.06,
      '1K': 0.08,
      '2K': 0.12,
      '4K': 0.16
    }, 'image'),
    endpoint: 'fal-ai/nano-banana-2/edit',
    inputMap: { images: 'image_urls', text: 'prompt' },
    outputPath: 'images.0'
  }),
  tool({
    id: 'photo_pose_transfer',
    name: 'изменить позу',
    category: 'photo',
    subcategory: 'pose_transfer',
    card: 'photo_pose_transfer',
    inputs: input(['person_image', 'image']),
    settings: {
      enable_safety_checker: booleanSetting('проверка безопасности', true),
      output_format: enumSetting('формат файла', 'png', ['jpeg', 'png'])
    },
    pricing: fixedPrice(0.1, 'generation'),
    endpoint: 'fal-ai/leffa/pose-transfer',
    inputMap: {
      person_image: 'person_image_url',
      image: 'pose_image_url'
    },
    outputPath: 'image'
  }),
  tool({
    id: 'photo_colorize',
    name: 'раскрасить фото',
    category: 'photo',
    subcategory: 'colorize',
    card: 'photo_colorize',
    brand: 'bria',
    inputs: input(['image']),
    settings: {
      color: enumSetting('цветовая обработка', 'contemporary color', [
        'contemporary color',
        'vivid color',
        'black and white colors',
        'sepia vintage'
      ])
    },
    pricing: fixedPrice(0.04, 'image'),
    endpoint: 'bria/fibo-edit/colorize',
    inputMap: { image: 'image_url' },
    outputPath: 'image'
  }),
  tool({
    id: 'photo_restore',
    name: 'восстановить фото',
    category: 'photo',
    subcategory: 'restore',
    card: 'photo_restore',
    inputs: input(['image']),
    settings: {
      output_format: enumSetting('формат', 'jpeg', ['jpeg', 'png'])
    },
    pricing: fixedPrice(0.04, 'image'),
    endpoint: 'fal-ai/image-editing/photo-restoration',
    inputMap: { image: 'image_url' },
    outputPath: 'images.0'
  }),
  tool({
    id: 'photo_remove_bg',
    name: 'убрать фон',
    category: 'photo',
    subcategory: 'remove_bg',
    card: 'photo_remove_bg',
    brand: 'bria',
    inputs: input(['image']),
    settings: {
      sync_mode: booleanSetting('вернуть файл сразу', false)
    },
    pricing: fixedPrice(0.018, 'image'),
    endpoint: 'fal-ai/bria/background/remove',
    inputMap: { image: 'image_url' },
    outputPath: 'image'
  }),
  tool({
    id: 'photo_object_remove',
    name: 'убрать объект',
    category: 'photo',
    subcategory: 'object_remove',
    card: 'photo_object_remove',
    inputs: input(['image', 'text']),
    settings: {
      model: enumSetting('качество', 'best_quality', [
        'low_quality',
        'medium_quality',
        'high_quality',
        'best_quality'
      ]),
      mask_expansion: numberSetting('расширение маски', 15, 0, 50, 1)
    },
    pricing: rangePrice(0.006, 0.024, 'image'),
    endpoint: 'fal-ai/object-removal',
    inputMap: { image: 'image_url', text: 'prompt' },
    outputPath: 'images.0'
  }),
  tool({
    id: 'photo_expand',
    name: 'расширить кадр',
    category: 'photo',
    subcategory: 'expand',
    card: 'photo_expand',
    brand: 'bria',
    inputs: input(['image'], ['text']),
    settings: {
      aspect_ratio: enumSetting('соотношение сторон', '1:1', [
        '1:1',
        '2:3',
        '3:2',
        '3:4',
        '4:3',
        '4:5',
        '5:4',
        '9:16',
        '16:9'
      ]),
      negative_prompt: stringSetting('что не добавлять')
    },
    pricing: fixedPrice(0.04, 'image'),
    endpoint: 'fal-ai/bria/expand',
    inputMap: { image: 'image_url', text: 'prompt' },
    outputPath: 'image'
  }),
  tool({
    id: 'photo_face_restore',
    name: 'восстановить лицо',
    category: 'photo',
    subcategory: 'face_restore',
    card: 'photo_face_restore',
    inputs: input(['image']),
    settings: {
      fidelity: numberSetting('сходство с оригиналом', 0.5, 0, 1, 0.05),
      only_center_face: booleanSetting('только центральное лицо', false),
      aligned: booleanSetting('лицо уже выровнено', false),
      upscale_factor: numberSetting('масштаб', 2, 1, 4, 1)
    },
    pricing: fixedPrice(0.0021, 'megapixel'),
    endpoint: 'fal-ai/codeformer',
    inputMap: { image: 'image_url' },
    outputPath: 'image'
  }),
  tool({
    id: 'photo_try_on',
    name: 'примерить одежду',
    category: 'photo',
    subcategory: 'try_on',
    card: 'photo_try_on',
    inputs: input(['person_image', 'garment_image']),
    settings: {
      garment_type: enumSetting('тип одежды', 'upper_body', [
        'upper_body',
        'lower_body',
        'dresses'
      ])
    },
    pricing: fixedPrice(0.1, 'image'),
    endpoint: 'fal-ai/leffa/virtual-tryon',
    inputMap: {
      person_image: 'human_image_url',
      garment_image: 'garment_image_url'
    },
    outputPath: 'image'
  }),
  tool({
    id: 'photo_product',
    name: 'фото товара',
    category: 'photo',
    subcategory: 'product_photo',
    card: 'photo_product',
    inputs: input(['image']),
    settings: {
      aspect_ratio: enumSetting('соотношение сторон', '1:1', [
        '1:1',
        '16:9',
        '9:16',
        '4:3',
        '3:4'
      ])
    },
    pricing: fixedPrice(0.04, 'image'),
    endpoint: 'fal-ai/image-apps-v2/product-photography',
    inputMap: { image: 'product_image_url' },
    outputPath: 'images.0'
  }),
  tool({
    id: 'photo_ocr',
    name: 'распознать текст',
    category: 'photo',
    subcategory: 'ocr',
    card: 'photo_ocr',
    inputs: input(['images'], [], { images: { min: 1 } }),
    settings: {
      do_format: booleanSetting('сохранить форматирование', true),
      multi_page: booleanSetting('объединить страницы', false)
    },
    pricing: fixedPrice(0.05, 'image'),
    endpoint: 'fal-ai/got-ocr/v2',
    inputMap: { images: 'input_image_urls' },
    outputPath: 'outputs'
  }),
  tool({
    id: 'photo_upscale',
    name: 'увеличить фото',
    category: 'photo',
    subcategory: 'upscale',
    card: 'photo_upscale',
    brand: 'topaz',
    inputs: input(['image']),
    settings: {
      upscale_factor: numberSetting('масштаб', 2, 1, 4, 1),
      model: enumSetting('модель обработки', 'Standard V2', [
        'Standard V2',
        'Low Resolution V2',
        'CGI',
        'High Fidelity V2',
        'Text Refine'
      ]),
      output_format: enumSetting('формат', 'jpeg', ['jpeg', 'png'])
    },
    // Kept at the previous conservative public quote until the next economics
    // pass recalculates every provider allocation together.
    pricing: rangePrice(0.08, 1.36, 'image'),
    routes: [polzaMediaRoute('topaz/image-upscale', { image_url: 'image_urls' })],
    inputMap: { image: 'image_url' },
    outputPath: 'image'
  }),

  tool({
    id: 'video_generate',
    name: 'создать видео',
    category: 'video',
    subcategory: 'text_to_video',
    card: 'video_generate',
    brand: 'kling',
    inputs: input(['text']),
    settings: {
      duration: enumSetting('длительность', '5', [
        '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'
      ]),
      generate_audio: booleanSetting('создать звук', true),
      aspect_ratio: enumSetting('соотношение сторон', '16:9', [
        '16:9',
        '9:16',
        '1:1'
      ]),
      negative_prompt: stringSetting('что исключить', 'blur, distort, and low quality')
    },
    pricing: rangePrice(0.112, 0.168, 'output_second'),
    endpoint: 'fal-ai/kling-video/v3/pro/text-to-video',
    inputMap: { text: 'prompt' },
    outputPath: 'video'
  }),
  tool({
    id: 'video_image_to_video',
    name: 'оживить изображение',
    category: 'video',
    subcategory: 'image_to_video',
    card: 'video_image_to_video',
    brand: 'kling',
    inputs: input(['image', 'text']),
    settings: {
      duration: enumSetting('длительность', '5', ['5', '10']),
      generate_audio: booleanSetting('создать звук', true),
      negative_prompt: stringSetting('что исключить', 'blur, distort, and low quality')
    },
    pricing: rangePrice(0.112, 0.168, 'output_second'),
    endpoint: 'fal-ai/kling-video/v3/pro/image-to-video',
    inputMap: { image: 'start_image_url', text: 'prompt' },
    outputPath: 'video'
  }),
  tool({
    id: 'video_extend',
    name: 'продолжить видео',
    category: 'video',
    subcategory: 'extend',
    card: 'video_extend',
    brand: 'fal',
    inputs: input(['video', 'text'], [], { durationSeconds: { max: 8 } }),
    settings: {
      aspect_ratio: enumSetting('соотношение сторон', 'auto', [
        'auto',
        '16:9',
        '9:16'
      ]),
      resolution: enumSetting('разрешение', '720p', ['720p', '1080p']),
      generate_audio: booleanSetting('продолжить звук', true),
      safety_tolerance: enumSetting('строгость фильтра', '4', [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6'
      ])
    },
    pricing: rangePrice(0.2, 0.4, 'output_second'),
    endpoint: 'fal-ai/veo3.1/extend-video',
    inputMap: { video: 'video_url', text: 'prompt' },
    outputPath: 'video'
  }),
  tool({
    id: 'video_understand',
    name: 'разобрать видео',
    category: 'video',
    subcategory: 'understand',
    card: 'video_understand',
    inputs: input(['video', 'text']),
    settings: {},
    pricing: fixedPrice(0.01, '5_input_seconds'),
    endpoint: 'fal-ai/video-understanding',
    inputMap: { video: 'video_url', text: 'prompt' },
    outputPath: 'output',
    resultKind: 'text'
  }),
  tool({
    id: 'video_edit',
    name: 'изменить видео',
    category: 'video',
    subcategory: 'edit',
    card: 'video_edit',
    brand: 'kling',
    inputs: input(['video', 'text'], ['reference_images']),
    settings: {
      keep_audio: booleanSetting('сохранить звук', true)
    },
    pricing: fixedPrice(0.168, 'output_second'),
    endpoint: 'fal-ai/kling-video/o1/video-to-video/edit',
    inputMap: {
      video: 'video_url',
      text: 'prompt',
      reference_images: 'image_urls'
    },
    outputPath: 'video'
  }),
  tool({
    id: 'video_live_photo',
    name: 'оживить фото',
    category: 'video',
    subcategory: 'live_photo',
    card: 'video_live_photo',
    brand: 'minimax',
    inputs: input(['image', 'text']),
    settings: {
      prompt_optimizer: booleanSetting('улучшить описание', true)
    },
    pricing: fixedPrice(0.5, 'video'),
    endpoint: 'fal-ai/minimax/video-01-live/image-to-video',
    inputMap: { image: 'image_url', text: 'prompt' },
    outputPath: 'video'
  }),
  tool({
    id: 'video_lipsync',
    name: 'синхронизировать губы',
    category: 'video',
    subcategory: 'lipsync',
    card: 'video_lipsync',
    inputs: input(['video', 'audio']),
    settings: {},
    pricing: fixedPrice(0.2, 'video_up_to_40_seconds'),
    endpoint: 'fal-ai/latentsync',
    inputMap: { video: 'video_url', audio: 'audio_url' },
    outputPath: 'video'
  }),
  tool({
    id: 'video_talking_head',
    name: 'говорящий портрет',
    category: 'video',
    subcategory: 'talking_head',
    card: 'video_talking_head',
    inputs: input(['image', 'audio']),
    settings: {
      seed: numberSetting('зерно', 0, 0, 2147483647, 1)
    },
    pricing: fixedPrice(0.02, 'output_second'),
    endpoint: 'fal-ai/flashtalk',
    inputMap: { image: 'image_url', audio: 'audio_url' },
    outputPath: 'video'
  }),
  tool({
    id: 'video_remove_bg',
    name: 'убрать фон из видео',
    category: 'video',
    subcategory: 'remove_bg',
    card: 'video_remove_bg',
    brand: 'bria',
    inputs: input(['video'], [], { durationSeconds: { max: 30 } }),
    settings: {
      output_container_and_codec: enumSetting('контейнер и кодек', 'webm_vp9', [
        'mp4_h265',
        'mp4_h264',
        'webm_vp9',
        'mov_h265',
        'mov_proresks',
        'mkv_h265',
        'mkv_h264',
        'mkv_vp9',
        'gif'
      ]),
      preserve_audio: booleanSetting('сохранить звук', true),
      background_color: enumSetting('фон', 'Black', [
        'Transparent',
        'Black',
        'White',
        'Gray',
        'Red',
        'Green',
        'Blue',
        'Yellow',
        'Cyan',
        'Magenta',
        'Orange'
      ])
    },
    pricing: fixedPrice(0.0042, 'input_second'),
    endpoint: 'bria/video/background-removal',
    inputMap: { video: 'video_url' },
    outputPath: 'video'
  }),
  tool({
    id: 'video_remove_object',
    name: 'убрать объект из видео',
    category: 'video',
    subcategory: 'remove_object',
    card: 'video_remove_object',
    brand: 'bria',
    inputs: input(['video', 'text'], [], { durationSeconds: { max: 5 } }),
    settings: {
      preserve_audio: booleanSetting('сохранить звук', true),
      auto_trim: booleanSetting('обрезать до допустимой длины', true),
      output_container_and_codec: enumSetting('контейнер и кодек', 'mp4_h264', [
        'mp4_h265',
        'mp4_h264',
        'webm_vp9',
        'gif',
        'mov_h264',
        'mov_h265',
        'mov_proresks',
        'mkv_h264',
        'mkv_h265',
        'mkv_vp9',
        'mkv_mpeg4'
      ])
    },
    pricing: fixedPrice(0.14, 'input_second'),
    endpoint: 'bria/video/erase/prompt',
    inputMap: { video: 'video_url', text: 'prompt' },
    outputPath: 'video'
  }),
  tool({
    id: 'video_upscale',
    name: 'улучшить видео',
    category: 'video',
    subcategory: 'upscale',
    card: 'video_upscale',
    brand: 'topaz',
    inputs: input(['video']),
    settings: {
      model: enumSetting('модель обработки', 'Proteus', [
        'Proteus',
        'Artemis HQ',
        'Artemis MQ',
        'Artemis LQ',
        'Nyx',
        'Gaia HQ',
        'Gaia CG',
        'Gaia 2'
      ]),
      upscale_factor: numberSetting('масштаб', 2, 1, 8, 1)
    },
    pricing: rangePrice(0.01, 0.16, 'output_second'),
    routes: [polzaMediaRoute('topaz/video-upscale', { video_url: 'video_urls' })],
    inputMap: { video: 'video_url' },
    outputPath: 'video'
  }),

  tool({
    id: 'audio_stt',
    name: 'расшифровать речь',
    category: 'audio',
    subcategory: 'stt',
    card: 'audio_stt',
    brand: 'elevenlabs',
    inputs: input(['audio'], ['keyterms']),
    settings: {
      language_code: stringSetting('код языка'),
      tag_audio_events: booleanSetting('отмечать звуки', true),
      diarize: booleanSetting('разделять говорящих', true)
    },
    pricing: fixedPrice(0.008, 'input_minute'),
    routes: [
      elevenRoute('/v1/speech-to-text', {
        bodyType: 'multipart',
        fileFields: ['file'],
        operation: 'stt'
      }),
      fallbackFalRoute('fal-ai/elevenlabs/speech-to-text/scribe-v2', {
        adapter: 'fal.subscribe',
        inputMap: { file: 'audio_url', keyterms: 'keyterms' }
      })
    ],
    inputMap: { audio: 'audio_url', keyterms: 'keyterms' },
    outputPath: 'text',
    runtimeAdapter: 'elevenlabs.direct',
    runtimeOptions: {
      bodyType: 'multipart',
      fileFields: ['file'],
      operation: 'stt',
      inputMap: { audio: 'file', keyterms: 'keyterms' }
    }
  }),
  tool({
    id: 'audio_tts',
    name: 'озвучить текст',
    category: 'audio',
    subcategory: 'tts',
    card: 'audio_tts',
    brand: 'elevenlabs',
    inputs: input(['text']),
    settings: {
      voice: stringSetting('голос', '21m00Tcm4TlvDq8ikWAM'),
      stability: numberSetting('стабильность', 0.5, 0, 1, 0.05),
      similarity_boost: numberSetting('похожесть', 0.75, 0, 1, 0.05),
      speed: numberSetting('скорость', 1, 0.7, 1.2, 0.05),
      language_code: stringSetting('код языка'),
      output_format: enumSetting('формат', 'mp3_44100_128', [
        'mp3_44100_128',
        'pcm_44100',
        'opus_48000_128'
      ])
    },
    pricing: fixedPrice(0.1, '1000_characters'),
    routes: [
      elevenRoute('/v1/text-to-speech/{voice_id}', { operation: 'tts' }),
      fallbackFalRoute('fal-ai/elevenlabs/tts/eleven-v3', {
        adapter: 'fal.subscribe',
        inputMap: { text: 'text' }
      })
    ],
    inputMap: { text: 'text' },
    outputPath: 'audio',
    runtimeAdapter: 'elevenlabs.direct',
    runtimeOptions: {
      operation: 'tts',
      inputMap: { text: 'text' }
    }
  }),
  tool({
    id: 'audio_voice_clone',
    name: 'клонировать голос',
    category: 'audio',
    subcategory: 'voice_clone',
    card: 'audio_voice_clone',
    inputs: input(['text', 'reference_audio'], ['reference_text']),
    settings: {
      model_type: enumSetting('модель', 'F5-TTS', ['F5-TTS', 'E2-TTS']),
      remove_silence: booleanSetting('убрать тишину', true)
    },
    pricing: fixedPrice(0.05, '1000_characters'),
    endpoint: 'fal-ai/f5-tts',
    inputMap: {
      text: 'gen_text',
      reference_audio: 'ref_audio_url',
      reference_text: 'ref_text'
    },
    outputPath: 'audio_url'
  }),
  tool({
    id: 'audio_isolation',
    name: 'очистить голос',
    category: 'audio',
    subcategory: 'isolation',
    card: 'audio_isolation',
    brand: 'elevenlabs',
    inputs: input(['media'], [], {
      media: { types: ['audio', 'video'], exactlyOne: true }
    }),
    settings: {},
    pricing: fixedPrice(0.1, 'input_minute'),
    routes: [
      elevenRoute('/v1/audio-isolation', {
        bodyType: 'multipart',
        fileFields: ['audio']
      }),
      fallbackFalRoute('fal-ai/elevenlabs/audio-isolation', {
        adapter: 'fal.subscribe',
        inputMap: { audio: 'audio_url' }
      })
    ],
    fallbackStatus: {
      provider: 'routerai',
      status: 'incompatible',
      reason: 'No confirmed audio-isolation model and result contract is available.'
    },
    inputMap: {
      media: { audio: 'audio_url', video: 'video_url' }
    },
    outputPath: 'audio',
    runtimeAdapter: 'elevenlabs.direct',
    runtimeOptions: {
      bodyType: 'multipart',
      fileFields: ['audio'],
      inputMap: {
        media: { audio: 'audio', video: 'audio' }
      }
    }
  }),
  tool({
    id: 'audio_stems',
    name: 'разделить на дорожки',
    category: 'audio',
    subcategory: 'stems',
    card: 'audio_stems',
    inputs: input(['audio']),
    settings: {
      model: enumSetting('модель', 'htdemucs_6s', [
        'htdemucs',
        'htdemucs_ft',
        'htdemucs_6s',
        'hdemucs_mmi',
        'mdx',
        'mdx_extra',
        'mdx_q',
        'mdx_extra_q'
      ]),
      stems: enumSetting('дорожки', 'all', [
        'all',
        'vocals',
        'drums',
        'bass',
        'other',
        'guitar',
        'piano'
      ]),
      output_format: enumSetting('формат', 'mp3', ['wav', 'mp3'])
    },
    pricing: fixedPrice(0.0007, 'input_second'),
    endpoint: 'fal-ai/demucs',
    inputMap: { audio: 'audio_url' },
    outputPath: 'vocals'
  }),
  tool({
    id: 'audio_sfx',
    name: 'создать звуковой эффект',
    category: 'audio',
    subcategory: 'sfx',
    card: 'audio_sfx',
    brand: 'elevenlabs',
    inputs: input(['text']),
    settings: {
      duration_seconds: numberSetting('длительность', 5, 0.5, 22, 0.5),
      prompt_influence: numberSetting('следование описанию', 0.3, 0, 1, 0.05),
      output_format: enumSetting('формат', 'mp3_44100_128', [
        'mp3_44100_128',
        'pcm_44100',
        'opus_48000_128'
      ])
    },
    pricing: fixedPrice(0.002, 'output_second'),
    routes: [
      elevenRoute('/v1/sound-generation', { operation: 'sound_generation' }),
      fallbackFalRoute('fal-ai/elevenlabs/sound-effects/v2', {
        adapter: 'fal.subscribe',
        inputMap: { text: 'text' }
      })
    ],
    inputMap: { text: 'text' },
    outputPath: 'audio',
    runtimeAdapter: 'elevenlabs.direct',
    runtimeOptions: {
      operation: 'sound_generation',
      inputMap: { text: 'text' }
    }
  }),
  tool({
    id: 'audio_music',
    name: 'создать музыку',
    category: 'audio',
    subcategory: 'music',
    card: 'audio_music',
    brand: 'elevenlabs',
    inputs: input(['text']),
    settings: {
      music_length_ms: numberSetting('длительность в миллисекундах', 30000, 3000, 600000, 1000),
      force_instrumental: booleanSetting('только инструменты', false),
      respect_sections_durations: booleanSetting('соблюдать длину частей', true),
      output_format: enumSetting('формат', 'mp3_44100_128', [
        'mp3_44100_128',
        'pcm_44100',
        'opus_48000_128'
      ])
    },
    pricing: fixedPrice(0.15, 'output_audio_minute'),
    routes: [
      elevenRoute('/v1/music', { operation: 'music' }),
      fallbackFalRoute('fal-ai/elevenlabs/music', {
        adapter: 'fal.subscribe',
        inputMap: { text: 'prompt' }
      })
    ],
    inputMap: { text: 'prompt' },
    outputPath: 'audio',
    runtimeAdapter: 'elevenlabs.direct',
    runtimeOptions: {
      operation: 'music',
      inputMap: { text: 'prompt' }
    }
  }),
  tool({
    id: 'audio_voice_change',
    name: 'изменить голос',
    category: 'audio',
    subcategory: 'voice_change',
    card: 'audio_voice_change',
    brand: 'elevenlabs',
    inputs: input(['audio']),
    settings: {
      voice: stringSetting('голос', '21m00Tcm4TlvDq8ikWAM'),
      remove_background_noise: booleanSetting('убрать фоновый шум', false),
      seed: numberSetting('зерно', 0, 0, 2147483647, 1),
      output_format: enumSetting('формат', 'mp3_44100_128', [
        'mp3_44100_128',
        'pcm_44100',
        'opus_48000_128'
      ])
    },
    pricing: fixedPrice(0.3, 'input_minute'),
    routes: [
      elevenRoute('/v1/speech-to-speech/{voice_id}', {
        bodyType: 'multipart',
        fileFields: ['audio'],
        operation: 'speech_to_speech'
      }),
      fallbackFalRoute('fal-ai/elevenlabs/voice-changer', {
        adapter: 'fal.subscribe',
        inputMap: { audio: 'audio_url' }
      })
    ],
    inputMap: { audio: 'audio_url' },
    outputPath: 'audio',
    runtimeAdapter: 'elevenlabs.direct',
    runtimeOptions: {
      bodyType: 'multipart',
      fileFields: ['audio'],
      operation: 'speech_to_speech',
      inputMap: { audio: 'audio' }
    }
  }),

  tool({
    id: 'document_ocr',
    name: 'прочитать документ',
    category: 'document',
    subcategory: 'document_ocr',
    card: 'documents_ocr',
    inputs: input(['images'], [], { images: { min: 1 } }),
    settings: {
      do_format: booleanSetting('сохранить форматирование', true),
      multi_page: booleanSetting('объединить страницы', true)
    },
    pricing: fixedPrice(0.05, 'image'),
    endpoint: 'fal-ai/got-ocr/v2',
    inputMap: { images: 'input_image_urls' },
    outputPath: 'outputs'
  }),
  tool({
    id: 'document_table',
    name: 'извлечь таблицу',
    category: 'document',
    subcategory: 'table_extraction',
    card: 'documents_table',
    inputs: input(['images'], [], { images: { min: 1 } }),
    settings: {
      do_format: booleanSetting('сохранить структуру таблицы', true),
      multi_page: booleanSetting('объединить страницы', false)
    },
    pricing: fixedPrice(0.05, 'image'),
    endpoint: 'fal-ai/got-ocr/v2',
    inputMap: { images: 'input_image_urls' },
    outputPath: 'outputs'
  }),
  tool({
    id: 'document_formula',
    name: 'распознать формулы',
    category: 'document',
    subcategory: 'formula_ocr',
    card: 'documents_formula',
    inputs: input(['images'], [], { images: { min: 1 } }),
    settings: {
      do_format: booleanSetting('сохранить расположение формул', true),
      multi_page: booleanSetting('объединить страницы', false)
    },
    pricing: fixedPrice(0.05, 'image'),
    endpoint: 'fal-ai/got-ocr/v2',
    inputMap: { images: 'input_image_urls' },
    outputPath: 'outputs'
  }),
  tool({
    id: 'document_chart',
    name: 'разобрать диаграмму',
    category: 'document',
    subcategory: 'chart_analysis',
    card: 'documents_chart',
    brand: 'fal',
    inputs: input(['image', 'text']),
    settings: {},
    pricing: rangePrice(0.4, 3.5, 'million_input_or_output_tokens'),
    endpoint: 'fal-ai/moondream3-preview/query',
    inputMap: { image: 'image_url', text: 'prompt' },
    outputPath: 'output',
    resultKind: 'text'
  }),
  tool({
    id: 'data_extract',
    name: 'извлечь данные с изображения',
    category: 'document',
    subcategory: 'structured_extraction',
    card: 'data_extract',
    brand: 'fal',
    inputs: input(['image', 'text']),
    settings: {},
    pricing: rangePrice(0.4, 3.5, 'million_input_or_output_tokens'),
    endpoint: 'fal-ai/moondream3-preview/query',
    inputMap: { image: 'image_url', text: 'prompt' },
    outputPath: 'output',
    resultKind: 'text'
  }),
  tool({
    id: 'data_image_description',
    name: 'описать изображение',
    category: 'document',
    subcategory: 'image_description',
    card: 'data_image_description',
    brand: 'fal',
    inputs: input(['image', 'text']),
    settings: {},
    pricing: fixedPrice(0.0011, 'compute_second'),
    endpoint: 'fal-ai/moondream-next',
    inputMap: { image: 'image_url', text: 'prompt' },
    outputPath: 'output',
    resultKind: 'text'
  }),
  tool({
    id: 'three_d_image',
    name: '3d по фото',
    category: '3d',
    subcategory: 'image_to_3d',
    card: 'three_d_image',
    brand: 'meshy',
    inputs: input(['image']),
    settings: {
      model_type: enumSetting('тип сетки', 'standard', ['standard', 'lowpoly']),
      topology: enumSetting('топология', 'triangle', ['quad', 'triangle']),
      target_polycount: numberSetting('число полигонов', 30000, 1000, 300000, 1000),
      symmetry_mode: enumSetting('симметрия', 'auto', ['off', 'auto', 'on']),
      should_texture: booleanSetting('создать текстуры', true),
      enable_pbr: booleanSetting('добавить PBR-карты', false)
    },
    pricing: fixedPrice(0.8, 'generation'),
    endpoint: 'fal-ai/meshy/v6/image-to-3d',
    inputMap: { image: 'image_url' },
    outputPath: 'model_glb'
  }),
  tool({
    id: 'three_d_text',
    name: '3d по описанию',
    category: '3d',
    subcategory: 'text_to_3d',
    card: 'three_d_text',
    brand: 'meshy',
    inputs: input(['text']),
    settings: {
      mode: enumSetting('режим', 'full', ['preview', 'full']),
      model_type: enumSetting('тип сетки', 'standard', ['standard', 'lowpoly']),
      topology: enumSetting('топология', 'triangle', ['quad', 'triangle']),
      target_polycount: numberSetting('число полигонов', 30000, 1000, 300000, 1000)
    },
    pricing: fixedPrice(0.8, 'generation'),
    endpoint: 'fal-ai/meshy/v6/text-to-3d',
    inputMap: { text: 'prompt' },
    outputPath: 'model_glb'
  }),
  tool({
    id: 'three_d_extract',
    name: 'извлечь объект в 3d',
    category: '3d',
    subcategory: 'object_extraction',
    card: 'three_d_extract',
    inputs: input(['image'], ['text', 'masks', 'points', 'boxes']),
    settings: {},
    pricing: fixedPrice(0.02, 'reconstruction'),
    endpoint: 'fal-ai/sam-3/3d-objects',
    inputMap: {
      image: 'image_url',
      text: 'prompt',
      masks: 'mask_urls',
      points: 'point_prompts',
      boxes: 'box_prompts'
    },
    outputPath: 'model_glb'
  }),
  tool({
    id: 'three_d_multi_image',
    name: 'собрать 3d по нескольким фото',
    category: '3d',
    subcategory: 'multi_image_to_3d',
    card: 'three_d_multi_image',
    brand: 'fal',
    inputs: input(['images'], [], { images: { min: 2 } }),
    settings: {
      texture_size: enumSetting('размер текстуры', '1024', [
        '512',
        '1024',
        '2048'
      ]),
      multiimage_algo: enumSetting('алгоритм сведения', 'stochastic', [
        'stochastic',
        'multidiffusion'
      ])
    },
    pricing: fixedPrice(0.02, 'reconstruction'),
    endpoint: 'fal-ai/trellis/multi',
    inputMap: { images: 'image_urls' },
    outputPath: 'model_mesh'
  })
];

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

export const TOOL_CATEGORIES = deepFreeze([
  'photo',
  'video',
  'audio',
  'document',
  '3d'
]);
export const TOOL_CATALOG = deepFreeze(catalog);

const toolsById = new Map(TOOL_CATALOG.map((entry) => [entry.id, entry]));

export function getToolById(id) {
  return toolsById.get(id) ?? null;
}

export function getActiveTools() {
  return TOOL_CATALOG.filter(({ active }) => active);
}

export function getToolsByCategory(category) {
  return TOOL_CATALOG.filter((toolEntry) => toolEntry.category === category);
}
