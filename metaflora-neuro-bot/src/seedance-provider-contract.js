const PROVIDER_ENDPOINTS = Object.freeze({
  polza: 'https://polza.ai/api/v1/media',
  routerai: 'https://routerai.ru/api/v1/videos'
});

const PROVIDER_MODEL_IDS = Object.freeze({
  polza: Object.freeze({
    seedance_20: 'bytedance/seedance-2',
    seedance_20_fast: 'bytedance/seedance-2-fast',
    seedance_20_mini: 'bytedance/seedance-2-mini'
  }),
  routerai: Object.freeze({
    seedance_20: 'bytedance/seedance-2.0',
    seedance_25: 'bytedance/seedance-2.5'
  })
});

const RESOLUTIONS = Object.freeze({
  seedance_20: Object.freeze(['480p', '720p', '1080p', '4k']),
  seedance_20_fast: Object.freeze(['480p', '720p']),
  seedance_20_mini: Object.freeze(['480p', '720p']),
  seedance_25: Object.freeze(['480p', '720p'])
});

export function seedanceProviderRoute(provider, modelId) {
  const endpoint = PROVIDER_ENDPOINTS[provider];
  const providerModelId = PROVIDER_MODEL_IDS[provider]?.[modelId];
  if (!endpoint) throw new RangeError(`Unsupported Seedance provider: ${provider}`);
  if (!providerModelId) throw new RangeError(`Unsupported Seedance route: ${provider}/${modelId}`);
  return { provider, endpoint, providerModelId };
}

function integerInRange(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new RangeError(`Seedance duration must be between ${minimum} and ${maximum}.`);
  }
  return parsed;
}

function booleanValue(value, fallback) {
  if (value === undefined) return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new TypeError('Seedance generate_audio must be boolean.');
}

function routeraiReference(kind, url) {
  return Object.freeze({
    type: `${kind}_url`,
    [`${kind}_url`]: Object.freeze({ url })
  });
}

function routeraiInputReferences(input) {
  return Object.freeze([
    ...(input.reference_image_urls ?? []).map((url) => routeraiReference('image', url)),
    ...(input.reference_video_urls ?? []).map((url) => routeraiReference('video', url)),
    ...(input.reference_audio_urls ?? []).map((url) => routeraiReference('audio', url))
  ]);
}

export function serializeSeedanceProviderRequest(provider, request) {
  const route = seedanceProviderRoute(provider, request?.modelId);
  const settings = request?.settings ?? {};
  const resolution = String(settings.resolution ?? '720p').toLowerCase();
  if (!RESOLUTIONS[request.modelId].includes(resolution)) {
    throw new RangeError(`Unsupported resolution for ${request.modelId}: ${resolution}`);
  }
  const prompt = String(request?.prompt ?? '').trim();
  if (!prompt) throw new TypeError('Seedance prompt is required.');

  const input = {
    prompt,
    resolution,
    duration: integerInRange(settings.duration, 15, 4, request.modelId === 'seedance_25' ? 30 : 15),
    aspect_ratio: String(settings.aspect_ratio ?? '16:9'),
    generate_audio: booleanValue(settings.generate_audio, true)
  };
  if (Array.isArray(request.referenceImageUrls) && request.referenceImageUrls.length > 0) {
    input.reference_image_urls = [...request.referenceImageUrls];
  }
  if (Array.isArray(request.referenceVideoUrls) && request.referenceVideoUrls.length > 0) {
    input.reference_video_urls = [...request.referenceVideoUrls];
  }
  if (Array.isArray(request.referenceAudioUrls) && request.referenceAudioUrls.length > 0) {
    input.reference_audio_urls = [...request.referenceAudioUrls];
  }

  if (
    route.provider === 'routerai'
    && request.modelId !== 'seedance_25'
    && (input.reference_video_urls?.length > 0 || input.reference_audio_urls?.length > 0)
  ) {
    throw new TypeError('RouterAI Seedance 2.0 accepts only image frame references.');
  }

  const inputReferences = route.provider === 'routerai'
    ? routeraiInputReferences(input)
    : Object.freeze([]);
  const body = route.provider === 'routerai'
    ? {
      model: route.providerModelId,
      prompt: input.prompt,
      resolution: input.resolution === '4k' ? '4K' : input.resolution,
      duration: input.duration,
      aspect_ratio: input.aspect_ratio,
      generate_audio: input.generate_audio,
      ...(inputReferences.length
        ? { input_references: inputReferences }
        : {})
    }
    : {
      model: route.providerModelId,
      ...(request.callBackUrl ? { callBackUrl: request.callBackUrl } : {}),
      input: Object.freeze(input)
    };

  return Object.freeze({
    provider: route.provider,
    endpoint: route.endpoint,
    body: Object.freeze(body)
  });
}

export const SEEDANCE_RESOLUTIONS = RESOLUTIONS;
