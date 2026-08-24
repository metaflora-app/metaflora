import { invokeMediaTool } from './media-router.js';
import { falUploader, resolveMediaInputs } from './tool-executor.js';
import {
  normalizeProvider,
  normalizeProviderModelId
} from './provider-route-matrix.js';

const POLZA_MEDIA_ENDPOINT = 'https://polza.ai/api/v1/media';
const POLZA_AUDIO_TRANSCRIPTIONS_ENDPOINT = 'https://polza.ai/api/v1/audio/transcriptions';
const POLZA_AUDIO_SPEECH_ENDPOINT = 'https://polza.ai/api/v1/audio/speech';
const KIE_CREATE_ENDPOINT = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_STATUS_ENDPOINT = 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId={requestId}';
const ROUTERAI_VIDEO_CREATE_ENDPOINT = 'https://routerai.ru/api/v1/videos';
const ROUTERAI_VIDEO_STATUS_ENDPOINT = 'https://routerai.ru/api/v1/videos/{requestId}';
const ROUTERAI_IMAGE_ENDPOINT = 'https://routerai.ru/api/v1/images';
const ROUTERAI_CHAT_ENDPOINT = 'https://routerai.ru/api/v1/chat/completions';
const ROUTERAI_SPEECH_ENDPOINT = 'https://routerai.ru/api/v1/audio/speech';
const ROUTERAI_TRANSCRIPTIONS_ENDPOINT = 'https://routerai.ru/api/v1/audio/transcriptions';
const SEEDANCE_MODEL_IDS = new Set([
  'bytedance/seedance-2',
  'bytedance/seedance-2-fast',
  'bytedance/seedance-2-mini',
  'bytedance/seedance-2.5'
]);
const ROUTERAI_ONLY_MODEL_IDS = new Set([
  'bytedance/seedance-2.0', 'bytedance/seedance-2.0-fast', 'bytedance/seedance-2.0-mini',
  'bytedance/seedance-2.5',
  'google/veo-3.1', 'google/veo-3.1-fast', 'kwaivgi/kling-v3.0-std', 'alibaba/wan-2.6',
  'black-forest-labs/flux-3-video',
  'alibaba/wan-2.7',
  'google/veo-3.1-lite',
  'kwaivgi/kling-video-o1',
  'openai/sora-2-pro',
  'runway/gen-4.5',
  'runway/aleph-2',
  'x-ai/grok-imagine-video-1.5', 'alibaba/happyhorse-1.0', 'alibaba/happyhorse-1.1',
  'minimax/hailuo-3', 'black-forest-labs/flux-video-upscale'
]);
const ROUTERAI_ONLY_POLZA_ALIASES = new Set([
  'bytedance/seedance-2',
  'bytedance/seedance-2-fast',
  'bytedance/seedance-2-mini'
]);
const ROUTERAI_IMAGE_MODEL_IDS = new Set([
  'black-forest-labs/flux.2-max', 'microsoft/mai-image-2.5', 'microsoft/mai-image-2.5-pro',
  'krea/krea-2-large', 'krea/krea-2-medium', 'krea/krea-2-medium-turbo',
  'qwen/qwen-image-3', 'qwen/qwen-image-3-pro', 'recraft/recraft-v4.1-pro',
  'recraft/recraft-v4.1-vector', 'recraft/recraft-v4.1-pro-vector',
  'x-ai/grok-imagine-image-2.0', 'sourceful/riverflow-v2.5-pro', 'sourceful/riverflow-v2.5-fast',
  'x-ai/grok-imagine-image-quality',
  'openai/gpt-image-2', 'openai/gpt-5.4-image-2',
  'openai/gpt-5-image', 'openai/gpt-5-image-mini',
  'black-forest-labs/flux.2-flex', 'black-forest-labs/flux.2-pro',
  'bytedance-seed/seedream-4.5', 'bytedance-seed/seedream-5-0-lite',
  'bytedance-seed/seedream-5-0-pro'
]);
const ROUTERAI_CHAT_IMAGE_MODEL_IDS = new Set([
  'google/gemini-3-pro-image',
  'google/gemini-3.1-flash-image',
  'google/gemini-3.1-flash-lite-image',
  'google/gemini-2.5-flash-image',
  'google/gemini-3.1-flash-image-preview'
]);
const ROUTERAI_CHAT_AUDIO_MODEL_IDS = new Set([
  'google/lyria-3-clip-preview', 'google/lyria-3-pro-preview'
]);
const ROUTERAI_SPEECH_MODEL_IDS = new Set([
  'microsoft/mai-voice-2', 'microsoft/mai-voice-2-flash', 'x-ai/grok-voice-tts-1.0',
  'mistralai/voxtral-mini-tts-2603', 'qwen/qwen-audio-3.0-tts-flash',
  'qwen/qwen-audio-3.0-tts-plus', 'fish-audio/s2.1-pro',
  'canopylabs/orpheus-3b-0.1-ft', 'hexgrad/kokoro-82m', 'sesame/csm-1b',
  'deepgram/aura-2', 'fish-audio/s1', 'fish-audio/s2-pro',
  'google/gemini-3.1-flash-tts-preview', 'minimax/speech-2.8-hd', 'minimax/speech-2.8-turbo'
]);
const ROUTERAI_TRANSCRIPTION_MODEL_IDS = new Set([
  'google/chirp-3', 'mistralai/voxtral-mini-transcribe', 'nvidia/parakeet-tdt-0.6b-v3',
  'openai/gpt-4o-mini-transcribe', 'openai/gpt-4o-transcribe', 'openai/whisper-1',
  'openai/whisper-large-v3', 'openai/whisper-large-v3-turbo',
  'qwen/qwen3-asr-flash-2026-02-10',
  'nvidia/nemotron-3.5-asr-streaming-multilingual-0.6b'
]);
const ROUTERAI_CONFIRMED_MEDIA_ALIASES = Object.freeze({
  'bytedance/seedance-1.5-pro': 'bytedance/seedance-1-5-pro',
  'bytedance/seedance-2': 'bytedance/seedance-2.0',
  'bytedance/seedance-2-fast': 'bytedance/seedance-2.0-fast',
  'bytedance/seedance-2-mini': 'bytedance/seedance-2.0-mini',
  'bytedance/seedream-4.5': 'bytedance-seed/seedream-4.5',
  'bytedance/seedream-5-lite': 'bytedance-seed/seedream-5-0-lite',
  'seedream/5-pro-text-to-image': 'bytedance-seed/seedream-5-0-pro',
  'google/veo3': 'google/veo-3.1',
  'google/veo3_fast': 'google/veo-3.1-fast',
  'kling/v3': 'kwaivgi/kling-v3.0-std',
  'wan/2.6': 'alibaba/wan-2.6',
  'x-ai/grok-imagine-image': 'x-ai/grok-imagine-image-quality',
  'google/lyria-3-clip-preview': 'google/lyria-3-clip-preview',
  'google/lyria-3-pro-preview': 'google/lyria-3-pro-preview',
  ...Object.fromEntries([
    'black-forest-labs/flux.2-flex', 'black-forest-labs/flux.2-pro',
    'google/gemini-2.5-flash-image', 'google/gemini-3.1-flash-image-preview',
    'alibaba/happyhorse-1.0', 'alibaba/happyhorse-1.1',
    'deepgram/aura-2', 'fish-audio/s1', 'fish-audio/s2-pro',
    'google/gemini-3.1-flash-tts-preview', 'minimax/speech-2.8-hd', 'minimax/speech-2.8-turbo',
    'google/chirp-3', 'mistralai/voxtral-mini-transcribe', 'nvidia/parakeet-tdt-0.6b-v3',
    'openai/gpt-4o-mini-transcribe', 'openai/gpt-4o-transcribe', 'openai/whisper-1',
    'openai/whisper-large-v3', 'openai/whisper-large-v3-turbo',
    'qwen/qwen3-asr-flash-2026-02-10'
  ].map((id) => [id, id]))
});
const KIE_MINIMAX_MODEL_IDS = Object.freeze({
  text: 'minimax-h3/text-to-video',
  image: 'minimax-h3/image-to-video',
  reference: 'minimax-h3/reference-to-video'
});
const KIE_MEDIA_MODEL_SPECS = Object.freeze({
  'bytedance/seedream-4.5': Object.freeze({
    text: 'seedream/4.5-text-to-image',
    image: 'seedream/4.5-edit'
  }),
  'bytedance/seedream-5-lite': Object.freeze({
    text: 'seedream/5-lite-text-to-image',
    image: 'seedream/5-lite-image-to-image'
  }),
  'seedream/5-pro-text-to-image': Object.freeze({
    text: 'seedream/5-pro-text-to-image',
    image: 'seedream/5-pro-image-to-image'
  }),
  'openai/gpt-image-1.5': Object.freeze({
    text: 'gpt-image/1.5-text-to-image',
    image: 'gpt-image/1.5-image-to-image',
    inputMap: Object.freeze({ image_urls: 'input_urls' })
  }),
  'x-ai/grok-imagine-image': Object.freeze({
    text: 'grok-imagine/text-to-image',
    image: 'grok-imagine/image-to-image'
  }),
  'kling/v2.5-turbo': Object.freeze({
    text: 'kling/v2-5-turbo-text-to-video-pro'
  }),
  'kling/v2.6': Object.freeze({
    text: 'kling-2.6/text-to-video',
    image: 'kling-2.6/image-to-video',
    inputMap: Object.freeze({ generate_audio: 'sound' })
  }),
  'kling/v3': Object.freeze({
    text: 'kling-3.0/video',
    image: 'kling-3.0/video',
    inputMap: Object.freeze({
      generate_audio: 'sound',
      resolution: 'mode'
    })
  }),
  'wan/2.5': Object.freeze({
    text: 'wan/2-5-text-to-video',
    inputMap: Object.freeze({ prompt_expansion: 'enable_prompt_expansion' })
  }),
  'wan/2.6': Object.freeze({
    text: 'wan/2-6-text-to-video',
    image: 'wan/2-6-image-to-video',
    maxImages: 1
  })
});
const EMPTY_MEDIA_INPUTS = Object.freeze({
  image: Object.freeze([]),
  video: Object.freeze([]),
  audio: Object.freeze([])
});
const KIE_BOOLEAN_SETTING_KEYS = new Set([
  'generate_audio',
  'prompt_expansion',
  'enable_prompt_expansion',
  'sound',
  'nsfw_checker'
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTranscriptionModel(model) {
  const providerModelId = String(model?.providerModelId ?? '').toLowerCase();
  return model?.category === 'voice'
    && /transcrib|whisper|asr|gigaam|parakeet|chirp|voxtral/.test(providerModelId);
}

function modelResultType(model) {
  if (model?.category === 'image') return 'image';
  if (isTranscriptionModel(model)) return 'text';
  if (model?.category === 'audio' || model?.category === 'music' || model?.category === 'voice') {
    return 'audio';
  }
  if (model?.category === '3d') return 'document';
  if (model?.category === 'video') return 'video';
  throw new TypeError('Unsupported media model category.');
}

function modelMimeType(type) {
  return {
    image: 'image/jpeg',
    video: 'video/mp4',
    audio: 'audio/mpeg',
    document: 'application/octet-stream',
    text: 'text/plain'
  }[type];
}

function normalizedMediaModel(model) {
  const providerModelId = normalizeProviderModelId(
    model?.providerModelId
      ?? (Array.isArray(model?.providerModels) && model.providerModels.length === 1
        ? model.providerModels[0]
        : undefined)
  );
  return {
    ...model,
    provider: normalizeProvider(model?.provider),
    providerModelId
  };
}

function messagesFor(value) {
  if (Array.isArray(value)) return value.filter(isRecord);
  return isRecord(value) ? [value] : [];
}

function fileId(value) {
  return typeof value?.file_id === 'string' && value.file_id.length > 0
    ? value.file_id
    : null;
}

function collectTelegramInputs(value) {
  const collected = {
    text: [],
    image: [],
    video: [],
    audio: []
  };
  for (const message of messagesFor(value)) {
    const prompt = typeof message.text === 'string' ? message.text : message.caption;
    if (typeof prompt === 'string' && prompt.trim()) collected.text.push(prompt.trim());

    const photo = Array.isArray(message.photo) ? message.photo.at(-1) : null;
    const photoId = fileId(photo);
    if (photoId) collected.image.push(photoId);

    const videoId = fileId(message.video ?? message.animation ?? message.video_note);
    if (videoId) collected.video.push(videoId);

    const audioId = fileId(message.audio ?? message.voice);
    if (audioId) collected.audio.push(audioId);

    const documentId = fileId(message.document);
    const documentMimeType = String(message.document?.mime_type ?? '').toLowerCase();
    if (documentId && documentMimeType.startsWith('image/')) collected.image.push(documentId);
    if (documentId && documentMimeType.startsWith('video/')) collected.video.push(documentId);
    if (documentId && documentMimeType.startsWith('audio/')) collected.audio.push(documentId);
  }
  return collected;
}

function valueOrUndefined(value) {
  return value === undefined || value === null || value === '' || value === 'auto'
    ? undefined
    : value;
}

function booleanSetting(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new TypeError('Media model boolean setting is invalid.');
}

function numberSetting(value, label) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 120) {
    throw new TypeError(`Media model ${label} setting is invalid.`);
  }
  return parsed;
}

function seedanceInput(collected, settings) {
  const input = {
    prompt: collected.text.join('\n').trim(),
    resolution: valueOrUndefined(settings.resolution),
    duration: numberSetting(valueOrUndefined(settings.duration), 'duration'),
    aspect_ratio: valueOrUndefined(settings.aspect_ratio),
    generate_audio: booleanSetting(settings.generate_audio),
    multi_shots: booleanSetting(settings.multi_shots),
    _constructorMode: valueOrUndefined(settings._constructorMode)
  };
  const references = {
    image_urls: collected.image,
    video_urls: collected.video,
    audio_urls: collected.audio
  };
  return Object.fromEntries(
    Object.entries({ ...input, ...references })
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .filter(([, value]) => !Array.isArray(value) || value.length > 0)
  );
}

function minimaxInput(collected, settings) {
  const input = {
    prompt: collected.text.join('\n').trim(),
    duration: numberSetting(valueOrUndefined(settings.duration), 'duration'),
    aspect_ratio: valueOrUndefined(settings.aspect_ratio),
    resolution: valueOrUndefined(settings.resolution) ?? '2K',
    generate_audio: booleanSetting(valueOrUndefined(settings.generate_audio)),
    _constructorMode: collected.video.length || collected.audio.length || collected.image.length > 2
      ? 'references'
      : 'first_frame',
    image_urls: collected.image,
    video_urls: collected.video,
    audio_urls: collected.audio
  };
  return Object.fromEntries(Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .filter(([, value]) => !Array.isArray(value) || value.length > 0));
}

function genericMediaInput(collected, settings) {
  const prompt = collected.text.join('\n').trim();
  const input = {
    ...(prompt ? { prompt } : {}),
    ...Object.fromEntries(
      Object.entries(settings ?? {})
        .filter(([, value]) => valueOrUndefined(value) !== undefined)
        .map(([key, value]) => [
          key,
          KIE_BOOLEAN_SETTING_KEYS.has(key)
            ? booleanSetting(valueOrUndefined(value))
            : valueOrUndefined(value)
        ])
    ),
    ...(collected.image.length ? { image_urls: collected.image } : {}),
    ...(collected.video.length ? { video_urls: collected.video } : {}),
    ...(collected.audio.length ? { audio_urls: collected.audio } : {})
  };
  return input;
}

function mediaInput(model, collected, settings) {
  if (SEEDANCE_MODEL_IDS.has(model.providerModelId)) return seedanceInput(collected, settings);
  if (model.id === 'minimax_h3') return minimaxInput(collected, settings);
  return genericMediaInput(collected, settings);
}

function kieModelFor(model, collected) {
  if (model.id !== 'minimax_h3') return model.providerModelId;
  if (collected.video.length || collected.audio.length || collected.image.length > 2) {
    return KIE_MINIMAX_MODEL_IDS.reference;
  }
  if (collected.image.length) return KIE_MINIMAX_MODEL_IDS.image;
  return KIE_MINIMAX_MODEL_IDS.text;
}

function kieFallbackSpecFor(model, collected) {
  if (SEEDANCE_MODEL_IDS.has(model.providerModelId)) {
    return {
      model: model.providerModelId,
      inputMap: {
        image_urls: 'reference_image_urls',
        video_urls: 'reference_video_urls',
        audio_urls: 'reference_audio_urls'
      }
    };
  }
  if (model.id === 'minimax_h3') {
    return { model: kieModelFor(model, collected) };
  }

  const spec = KIE_MEDIA_MODEL_SPECS[model.providerModelId];
  if (!spec || collected.video.length || collected.audio.length) return null;
  if (spec.maxImages !== undefined && collected.image.length > spec.maxImages) return null;
  const operation = collected.image.length > 0 ? 'image' : 'text';
  const modelId = spec[operation];
  if (typeof modelId !== 'string') return null;
  return {
    model: modelId,
    ...(spec.inputMap ? { inputMap: spec.inputMap } : {})
  };
}

function routeraiFallbackSpecFor(model) {
  const routeraiModelId = ROUTERAI_CONFIRMED_MEDIA_ALIASES[model.providerModelId];
  return routeraiModelId ? { model: routeraiModelId } : null;
}

function routeFor(provider, model, type, collected, providerSpec = null) {
  const normalizedProvider = normalizeProvider(provider);
  const confirmedRouteraiSpec = normalizedProvider === 'routerai'
    ? routeraiFallbackSpecFor(model)
    : null;
  const providerModelId = normalizedProvider === 'kie'
    ? providerSpec?.model ?? kieModelFor(model, collected)
    : normalizedProvider === 'routerai'
      ? providerSpec?.model ?? confirmedRouteraiSpec?.model ?? model.providerModelId
      : model.providerModelId;
  const normalizedProviderModelId = normalizeProviderModelId(providerModelId);
  if (
    !normalizedProvider
    || !normalizedProviderModelId
    || !/^[A-Za-z0-9][A-Za-z0-9._/-]{2,160}$/u.test(normalizedProviderModelId)
  ) {
    throw new TypeError('Media model provider route is not configured.');
  }
  const isPolza = normalizedProvider === 'polza';
  const isRouterai = normalizedProvider === 'routerai';
  const operation = isPolza && model.category === 'voice'
    ? (isTranscriptionModel(model) ? 'transcription' : 'speech')
    : isRouterai && ROUTERAI_CHAT_IMAGE_MODEL_IDS.has(normalizedProviderModelId)
      ? 'chat_image'
      : isRouterai && ROUTERAI_CHAT_AUDIO_MODEL_IDS.has(normalizedProviderModelId)
        ? 'chat_audio'
      : isRouterai && ROUTERAI_IMAGE_MODEL_IDS.has(normalizedProviderModelId)
      ? 'image'
      : isRouterai && ROUTERAI_SPEECH_MODEL_IDS.has(normalizedProviderModelId)
        ? 'speech'
        : isRouterai && ROUTERAI_TRANSCRIPTION_MODEL_IDS.has(normalizedProviderModelId)
          ? 'transcription'
        : null;
  const route = {
    provider: normalizedProvider,
    providerModelId: normalizedProviderModelId,
    endpoint: isPolza
      ? operation === 'transcription'
        ? POLZA_AUDIO_TRANSCRIPTIONS_ENDPOINT
        : operation === 'speech'
          ? POLZA_AUDIO_SPEECH_ENDPOINT
          : POLZA_MEDIA_ENDPOINT
      : isRouterai
        ? ['chat_image', 'chat_audio'].includes(operation)
          ? ROUTERAI_CHAT_ENDPOINT
          : operation === 'image'
          ? ROUTERAI_IMAGE_ENDPOINT
          : operation === 'speech'
            ? ROUTERAI_SPEECH_ENDPOINT
            : operation === 'transcription'
              ? ROUTERAI_TRANSCRIPTIONS_ENDPOINT
            : ROUTERAI_VIDEO_CREATE_ENDPOINT
        : KIE_CREATE_ENDPOINT,
    statusEndpoint: isPolza
      ? `${POLZA_MEDIA_ENDPOINT}/{requestId}`
      : isRouterai
        ? ROUTERAI_VIDEO_STATUS_ENDPOINT
        : KIE_STATUS_ENDPOINT,
    model: normalizedProviderModelId,
    type,
    mimeType: isRouterai && ['image', 'chat_image'].includes(operation) ? 'image/png' : modelMimeType(type),
    runtime: isPolza
      ? {
        ...(operation
          ? {
            operation,
            ...(operation === 'transcription' ? { outputPath: 'text', bodyType: 'multipart' } : {})
          }
          : { async: true })
      }
      : isRouterai && operation
        ? {
          operation,
          ...(operation === 'transcription' ? { outputPath: 'text', bodyType: 'multipart' } : {})
        }
        : undefined
  };
  if (isPolza && Array.isArray(model.providerParameters)) {
    route.providerParameters = model.providerParameters;
  }
  if (!isPolza && providerSpec?.inputMap) {
    route.runtime = { inputMap: { ...providerSpec.inputMap } };
  }
  return route;
}

function routesForModel(model, type, collected) {
  const provider = normalizeProvider(model?.provider);
  if (provider === 'polza') {
    const routeraiSpec = routeraiFallbackSpecFor(model);
    if (routeraiSpec && ROUTERAI_ONLY_POLZA_ALIASES.has(model.providerModelId)) {
      return [routeFor('routerai', model, type, collected, routeraiSpec)];
    }
    return [
      ...(routeraiSpec ? [routeFor('routerai', model, type, collected, routeraiSpec)] : []),
      routeFor('polza', model, type, collected)
    ];
  }
  if (provider === 'kie') {
    const kieSpec = kieFallbackSpecFor(model, collected);
    if (!kieSpec) throw new TypeError('Media model KIE route is not confirmed.');
    return [routeFor('kie', model, type, collected, kieSpec)];
  }
  if (provider === 'routerai') {
    const routeraiModelId = routeraiFallbackSpecFor(model)?.model ?? model.providerModelId;
    if (
      !ROUTERAI_ONLY_MODEL_IDS.has(routeraiModelId)
      && !ROUTERAI_IMAGE_MODEL_IDS.has(routeraiModelId)
      && !ROUTERAI_CHAT_IMAGE_MODEL_IDS.has(routeraiModelId)
      && !ROUTERAI_CHAT_AUDIO_MODEL_IDS.has(routeraiModelId)
      && !ROUTERAI_SPEECH_MODEL_IDS.has(routeraiModelId)
      && !ROUTERAI_TRANSCRIPTION_MODEL_IDS.has(routeraiModelId)
    ) {
      throw new TypeError('Media model RouterAI route is not confirmed.');
    }
    return [routeFor('routerai', model, type, collected)];
  }
  throw new TypeError('Media model provider is not supported.');
}

function incompatibleFallbackReason(model, collected) {
  if (collected.video.length || collected.audio.length) {
    return 'No confirmed RouterAI fallback contract covers this media reference type.';
  }
  return 'No exact RouterAI model, input, and output contract is confirmed for this operation.';
}

export function getMediaFallbackStatus(model, collected = EMPTY_MEDIA_INPUTS) {
  const normalizedModel = normalizedMediaModel(model);
  if (normalizedModel.provider === 'kie') {
    return Object.freeze({
      provider: 'kie',
      status: 'primary',
      reason: 'KIE is the explicitly configured primary provider for this model.'
    });
  }
  if (normalizedModel.provider !== 'polza') {
    return Object.freeze({
      provider: 'routerai',
      status: normalizedModel.provider === 'routerai' ? 'primary' : 'incompatible',
      reason: normalizedModel.provider === 'routerai'
        ? 'RouterAI is the primary provider for this model.'
        : 'The media model provider is not eligible for a RouterAI fallback.'
    });
  }
  const spec = routeraiFallbackSpecFor(normalizedModel);
  return Object.freeze(spec
    ? {
      provider: 'routerai',
      status: 'compatible',
      model: spec.model,
      reason: 'The RouterAI video task, input, and result contract is confirmed for this operation.'
    }
    : {
      provider: 'routerai',
      status: 'incompatible',
      reason: incompatibleFallbackReason(model, collected)
    });
}

function runtimeConfig(providerKeys, routes, runtime, fallbackStatus) {
  return {
    pollIntervalMs: runtime?.pollIntervalMs ?? 2_000,
    maxPollAttempts: runtime?.maxPollAttempts ?? 120,
    requestTimeoutMs: runtime?.requestTimeoutMs ?? 15_000,
    requestRetries: runtime?.requestRetries ?? 2,
    retryDelayMs: runtime?.retryDelayMs ?? 250,
    providers: {
      polza: { apiKey: providerKeys?.polza ?? '' },
      routerai: { apiKey: providerKeys?.routerai ?? '' }
    },
    routes: { model: routes },
    fallbackStatus
  };
}

export function createMediaModelExecutor({
  telegram,
  providerKeys = {},
  upload = null,
  invoke = invokeMediaTool,
  fetchImpl = fetch,
  runtime = {},
  onAttempt = async () => {}
} = {}) {
  if (!isRecord(providerKeys) || typeof invoke !== 'function' || typeof fetchImpl !== 'function') {
    throw new TypeError('Media model runtime is invalid.');
  }
  let resolvedUpload = upload;
  return async function executeMediaModel({
    model,
    settings = {},
    telegramInput,
    fetchImpl: requestFetch = fetchImpl
  }) {
    if (!isRecord(model) || !isRecord(settings)) throw new TypeError('Media model request is invalid.');
    const normalizedModel = normalizedMediaModel(model);
    const type = modelResultType(normalizedModel);
    const rawInputs = collectTelegramInputs(telegramInput);
    const uploadFile = async (...args) => {
      resolvedUpload ??= falUploader(providerKeys.fal);
      return resolvedUpload(...args);
    };
    const resolved = await resolveMediaInputs(telegram, rawInputs, uploadFile);
    const input = mediaInput(normalizedModel, resolved, settings);
    const hasMediaReference = Object.values(resolved).some(
      (value) => Array.isArray(value) && value.length > 0
    );
    if ((!input.prompt || input.prompt.trim().length === 0) && !hasMediaReference) {
      throw new TypeError('Media model prompt is required.');
    }
    const routes = routesForModel(normalizedModel, type, resolved);
    const fallbackStatus = getMediaFallbackStatus(normalizedModel, resolved);
    return invoke(
      { routeId: 'model', input },
      { 
        config: runtimeConfig(providerKeys, routes, runtime, fallbackStatus),
        fetchImpl: requestFetch,
        onAttempt
      }
    );
  };
}
