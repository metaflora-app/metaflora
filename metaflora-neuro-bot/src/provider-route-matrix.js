import { POLZA_PUBLIC_MODELS } from './provider-model-snapshot.js';
import { ROUTERAI_DIRECT_MODELS } from './routerai-direct-models.js';

const PROVIDER_ALIASES = Object.freeze({
  polza: 'polza',
  polzaai: 'polza',
  kie: 'kie',
  kieai: 'kie',
  gptunnel: 'gptunnel',
  gptunnelai: 'gptunnel',
  routerai: 'routerai',
  router: 'routerai',
  fal: 'fal',
  replicate: 'replicate',
  elevenlabs: 'elevenlabs',
  elevenlabsai: 'elevenlabs',
  openrouter: 'openrouter',
  requesty: 'requesty'
});
const PROVIDER_MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/:+-]{1,160}$/u;

export function normalizeProvider(value) {
  if (typeof value !== 'string') return null;
  const compact = value.trim().toLowerCase().replaceAll(/[^a-z0-9]/gu, '');
  return PROVIDER_ALIASES[compact] ?? null;
}

export function normalizeProviderModelId(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return PROVIDER_MODEL_ID_PATTERN.test(normalized) ? normalized : null;
}

const polzaModelIds = new Set(POLZA_PUBLIC_MODELS
  .filter(({ available, endpointAvailable }) => available && endpointAvailable)
  .map(({ providerModelId }) => providerModelId));

const polzaSupportedParameters = new Map(POLZA_PUBLIC_MODELS
  .filter(({ available, endpointAvailable, supportedParameters }) => (
    available
    && endpointAvailable
    && Array.isArray(supportedParameters)
  ))
  .map(({ providerModelId, supportedParameters }) => [
    providerModelId,
    Object.freeze([...new Set(supportedParameters.filter((value) => (
      typeof value === 'string'
      && /^[A-Za-z][A-Za-z0-9_]*$/u.test(value)
    )))])
  ]));

const ROUTERAI_CHAT_ENDPOINT = 'https://routerai.ru/api/v1/chat/completions';
const routeraiDirectByProviderId = new Map(Object.values(ROUTERAI_DIRECT_MODELS)
  .filter((model) => model.providerModelId)
  .map((model) => [model.providerModelId, model]));
const routeraiDirectLlmByProviderId = new Map(Object.values(ROUTERAI_DIRECT_MODELS)
  .filter((model) => !model.category && model.providerModelId)
  .map((model) => [model.providerModelId, model]));

const routeraiChatRoute = (providerModelId) => Object.freeze({
  provider: 'routerai',
  providerModelId,
  endpoint: ROUTERAI_CHAT_ENDPOINT,
  protocol: 'chat',
  ...(routeraiDirectLlmByProviderId.get(providerModelId)?.supportedParameters
    ? { supportedParameters: routeraiDirectLlmByProviderId.get(providerModelId).supportedParameters }
    : {})
});

// Exact identifiers checked against RouterAI's 461-model public catalog on 2026-08-20.
// The two provider snapshots overlap almost completely for chat models. Keeping
// the small, verified absence list here makes the route table exhaustive without
// duplicating hundreds of catalog identifiers. Renames still require an explicit
// alias below and are never inferred.
const routeraiMissingExactLlmModelIds = new Set([
  'ai21/jamba-large-1.7',
  'aiesa/aiesa-mini', 'aiesa/aiesa-pro', 'google/gemini-3-pro-preview',
  'openai/gpt-5-codex', 'openai/gpt-5.3-chat', 'openai/o3-pro',
  'sakana/fugu-ultra', 'sber/gigachat', 'sber/gigachat-2',
  'sber/gigachat-2-max', 'sber/gigachat-2-pro', 'sber/gigachat-max',
  'sber/gigachat-plus', 'sber/gigachat-pro',
  'yandex/yandexgpt-5-lite', 'yandex/yandexgpt-5-pro', 'yandex/yandexgpt-5.1-pro'
]);

const routeraiLlmModelIds = new Set(POLZA_PUBLIC_MODELS
  .filter(({ available, endpointAvailable, category, providerModelId }) => (
    available
    && endpointAvailable
    && category === 'llm'
    && !routeraiMissingExactLlmModelIds.has(providerModelId)
  ))
  .map(({ providerModelId }) => providerModelId));

for (const providerModelId of [
  'x-ai/grok-4.6',
  'deepseek/deepseek-v4-pro-0813',
  'openai/gpt-5.6-luna', 'openai/gpt-5.6-terra', 'openai/gpt-5.5', 'openai/gpt-5.5-pro',
  'openai/gpt-5.4', 'openai/gpt-5.4-pro', 'openai/gpt-5.4-mini', 'openai/gpt-5.4-nano',
  'openai/gpt-5.3-codex', 'openai/gpt-5.2', 'openai/gpt-5.2-pro', 'openai/gpt-5.2-codex',
  'openai/gpt-5', 'openai/gpt-5-mini', 'openai/gpt-5-nano', 'openai/gpt-4.1',
  'openai/gpt-4.1-mini', 'openai/gpt-4.1-nano', 'openai/gpt-4o', 'openai/gpt-4o-mini',
  'openai/o3', 'openai/o4-mini', 'anthropic/claude-opus-5', 'anthropic/claude-sonnet-5',
  'anthropic/claude-fable-5', 'anthropic/claude-opus-4.8', 'anthropic/claude-opus-4.7',
  'anthropic/claude-opus-4.6', 'anthropic/claude-haiku-4.5', 'google/gemini-3.5-flash',
  'google/gemini-3.1-flash-lite', 'google/gemini-3.1-pro-preview', 'google/gemini-2.5-pro',
  'google/gemini-2.5-flash', 'x-ai/grok-4.5', 'x-ai/grok-4.3', 'x-ai/grok-4.20',
  'moonshotai/kimi-k3', 'moonshotai/kimi-k2.7-code', 'moonshotai/kimi-k2.6',
  'moonshotai/kimi-k2.5', 'deepseek/deepseek-v4-pro', 'deepseek/deepseek-v4-flash',
  'deepseek/deepseek-v4-flash-0731',
  'deepseek/deepseek-v3.2', 'deepseek/deepseek-v3.2-exp', 'deepseek/deepseek-r1',
  'qwen/qwen3.7-max', 'qwen/qwen3.6-max-preview', 'qwen/qwen3-coder', 'minimax/minimax-m3',
  'qwen/qwen3-vl-235b-a22b-instruct', 'perplexity/sonar', 'perplexity/sonar-pro',
  'perplexity/sonar-pro-search', 'perplexity/sonar-deep-research', 'perplexity/sonar-reasoning-pro',
  'minimax/minimax-m2.7', 'minimax/minimax-m2.5', 'z-ai/glm-5.2',
  'mistralai/mistral-large-2512', 'meta-llama/llama-4-maverick', 'meta-llama/llama-4-scout'
]) {
  routeraiLlmModelIds.add(providerModelId);
}

for (const model of Object.values(ROUTERAI_DIRECT_MODELS)) {
  if (!model.category && model.providerModelId) {
    routeraiLlmModelIds.add(model.providerModelId);
  }
}

// KIE has no trustworthy general catalog endpoint. Keep this allowlist limited
// to exact model/version identifiers confirmed by its public API contract.
const kieExactModelIds = new Set([]);

const ROUTERAI_VIDEO_CREATE_ENDPOINT = 'https://routerai.ru/api/v1/videos';
const ROUTERAI_VIDEO_STATUS_ENDPOINT = 'https://routerai.ru/api/v1/videos/{requestId}';
const ROUTERAI_IMAGE_ENDPOINT = 'https://routerai.ru/api/v1/images';
const ROUTERAI_CHAT_IMAGE_ENDPOINT = 'https://routerai.ru/api/v1/chat/completions';
const ROUTERAI_SPEECH_ENDPOINT = 'https://routerai.ru/api/v1/audio/speech';
const ROUTERAI_TRANSCRIPTIONS_ENDPOINT = 'https://routerai.ru/api/v1/audio/transcriptions';
const routeraiVideoRoute = (providerModelId) => Object.freeze({
  provider: 'routerai',
  providerModelId,
  endpoint: ROUTERAI_VIDEO_CREATE_ENDPOINT,
  statusEndpoint: ROUTERAI_VIDEO_STATUS_ENDPOINT
});
const routeraiImageRoute = (providerModelId) => Object.freeze({
  provider: 'routerai',
  providerModelId,
  endpoint: ROUTERAI_IMAGE_ENDPOINT,
  protocol: 'image'
});
const routeraiChatImageRoute = (providerModelId) => Object.freeze({
  provider: 'routerai',
  providerModelId,
  endpoint: ROUTERAI_CHAT_IMAGE_ENDPOINT,
  protocol: 'chat_image'
});
const routeraiChatAudioRoute = (providerModelId) => Object.freeze({
  provider: 'routerai',
  providerModelId,
  endpoint: ROUTERAI_CHAT_ENDPOINT,
  protocol: 'chat_audio',
  supportedParameters: Object.freeze([
    'max_tokens', 'temperature', 'top_p', 'seed', 'response_format'
  ])
});
const routeraiSpeechRoute = (providerModelId) => Object.freeze({
  provider: 'routerai',
  providerModelId,
  endpoint: ROUTERAI_SPEECH_ENDPOINT,
  protocol: 'speech'
});
const routeraiTranscriptionRoute = (providerModelId) => Object.freeze({
  provider: 'routerai',
  providerModelId,
  endpoint: ROUTERAI_TRANSCRIPTIONS_ENDPOINT,
  protocol: 'transcription'
});
const routeraiMediaRoutes = new Map(Object.entries({
  'bytedance/seedance-2': routeraiVideoRoute('bytedance/seedance-2.0'),
  'bytedance/seedance-2.5': routeraiVideoRoute('bytedance/seedance-2.5'),
  'black-forest-labs/flux-3-video': routeraiVideoRoute('black-forest-labs/flux-3-video'),
  'alibaba/wan-2.7': routeraiVideoRoute('alibaba/wan-2.7'),
  'google/veo-3.1-lite': routeraiVideoRoute('google/veo-3.1-lite'),
  'kwaivgi/kling-video-o1': routeraiVideoRoute('kwaivgi/kling-video-o1'),
  'openai/sora-2-pro': routeraiVideoRoute('openai/sora-2-pro'),
  'runway/gen-4.5': routeraiVideoRoute('runway/gen-4.5'),
  'runway/aleph-2': routeraiVideoRoute('runway/aleph-2'),
  'x-ai/grok-imagine-video-1.5': routeraiVideoRoute('x-ai/grok-imagine-video-1.5'),
  'alibaba/happyhorse-1.0': routeraiVideoRoute('alibaba/happyhorse-1.0'),
  'alibaba/happyhorse-1.1': routeraiVideoRoute('alibaba/happyhorse-1.1'),
  'minimax/hailuo-3': routeraiVideoRoute('minimax/hailuo-3'),
  ...Object.fromEntries([
    'black-forest-labs/flux.2-max', 'microsoft/mai-image-2.5', 'microsoft/mai-image-2.5-pro',
    'krea/krea-2-large', 'krea/krea-2-medium', 'krea/krea-2-medium-turbo',
    'qwen/qwen-image-3', 'qwen/qwen-image-3-pro', 'recraft/recraft-v4.1-pro',
    'recraft/recraft-v4.1-vector', 'recraft/recraft-v4.1-pro-vector',
    'x-ai/grok-imagine-image-2.0', 'sourceful/riverflow-v2.5-pro', 'sourceful/riverflow-v2.5-fast',
    'x-ai/grok-imagine-image-quality',
    'black-forest-labs/flux.2-flex',
    'black-forest-labs/flux.2-pro', 'openai/gpt-image-2', 'openai/gpt-5.4-image-2',
    'openai/gpt-5-image', 'openai/gpt-5-image-mini'
  ].map((id) => [id, Object.freeze({ provider: 'routerai', providerModelId: id, endpoint: ROUTERAI_IMAGE_ENDPOINT, protocol: 'image' })])),
  ...Object.fromEntries([
    'google/gemini-3-pro-image', 'google/gemini-3.1-flash-image',
    'google/gemini-3.1-flash-lite-image', 'google/gemini-2.5-flash-image',
    'google/gemini-3.1-flash-image-preview'
  ].map((id) => [id, routeraiChatImageRoute(id)])),
  ...Object.fromEntries([
    'google/lyria-3-clip-preview', 'google/lyria-3-pro-preview'
  ].map((id) => [id, routeraiChatAudioRoute(id)])),
  ...Object.fromEntries([
    'microsoft/mai-voice-2', 'microsoft/mai-voice-2-flash', 'x-ai/grok-voice-tts-1.0',
    'mistralai/voxtral-mini-tts-2603', 'qwen/qwen-audio-3.0-tts-flash',
    'qwen/qwen-audio-3.0-tts-plus', 'fish-audio/s2.1-pro',
    'canopylabs/orpheus-3b-0.1-ft', 'hexgrad/kokoro-82m', 'sesame/csm-1b',
    'deepgram/aura-2', 'fish-audio/s1', 'fish-audio/s2-pro',
    'google/gemini-3.1-flash-tts-preview', 'minimax/speech-2.8-hd',
    'minimax/speech-2.8-turbo'
  ].map((id) => [id, Object.freeze({ provider: 'routerai', providerModelId: id, endpoint: ROUTERAI_SPEECH_ENDPOINT, protocol: 'speech' })]))
  , ...Object.fromEntries([
    'google/chirp-3', 'mistralai/voxtral-mini-transcribe', 'nvidia/parakeet-tdt-0.6b-v3',
    'openai/gpt-4o-mini-transcribe', 'openai/gpt-4o-transcribe', 'openai/whisper-1',
    'openai/whisper-large-v3', 'openai/whisper-large-v3-turbo',
    'qwen/qwen3-asr-flash-2026-02-10',
    'nvidia/nemotron-3.5-asr-streaming-multilingual-0.6b'
  ].map((id) => [id, routeraiTranscriptionRoute(id)]))
}));

// Renames are kept explicit: each pair was verified against RouterAI's live
// catalog. An absent entry is deliberately Polza-only instead of being guessed.
const routeraiAliasRoutes = new Map([
  ['yandex/yandexgpt-5.1-pro', routeraiChatRoute('yandex/gpt-pro-5.1')],
  ['yandex/yandexgpt-5-pro', routeraiChatRoute('yandex/gpt-pro-5')],
  ['yandex/yandexgpt-5-lite', routeraiChatRoute('yandex/gpt-lite-5')],
  ['bytedance/seedance-1.5-pro', routeraiVideoRoute('bytedance/seedance-1-5-pro')],
  ['bytedance/seedance-2-fast', routeraiVideoRoute('bytedance/seedance-2.0-fast')],
  ['bytedance/seedance-2-mini', routeraiVideoRoute('bytedance/seedance-2.0-mini')],
  ['bytedance/seedream-4.5', routeraiImageRoute('bytedance-seed/seedream-4.5')],
  ['bytedance/seedream-5-lite', routeraiImageRoute('bytedance-seed/seedream-5-0-lite')],
  ['seedream/5-pro-text-to-image', routeraiImageRoute('bytedance-seed/seedream-5-0-pro')],
  ['google/veo3', routeraiVideoRoute('google/veo-3.1')],
  ['google/veo3_fast', routeraiVideoRoute('google/veo-3.1-fast')],
  ['kling/v3', routeraiVideoRoute('kwaivgi/kling-v3.0-std')],
  ['wan/2.6', routeraiVideoRoute('alibaba/wan-2.6')],
  ['minimax-h3/text-to-video', routeraiVideoRoute('minimax/hailuo-3')],
  ['minimax-h3/image-to-video', routeraiVideoRoute('minimax/hailuo-3')],
  ['minimax-h3/reference-to-video', routeraiVideoRoute('minimax/hailuo-3')],
  ['x-ai/grok-imagine-image', routeraiImageRoute('x-ai/grok-imagine-image-quality')],
  ['deepseek/deepseek-v4-flash-0731', routeraiChatRoute('deepseek/deepseek-v4-flash-0731')],
  ['qwen/qwen3-vl-235b-a22b-instruct', routeraiChatRoute('qwen/qwen3-vl-235b-a22b-instruct')],
  ['perplexity/sonar', routeraiChatRoute('perplexity/sonar')],
  ['perplexity/sonar-pro', routeraiChatRoute('perplexity/sonar-pro')],
  ['perplexity/sonar-pro-search', routeraiChatRoute('perplexity/sonar-pro-search')],
  ['perplexity/sonar-deep-research', routeraiChatRoute('perplexity/sonar-deep-research')],
  ['perplexity/sonar-reasoning-pro', routeraiChatRoute('perplexity/sonar-reasoning-pro')]
]);

function routeraiRouteFor(providerModelId) {
  if (routeraiAliasRoutes.has(providerModelId)) return routeraiAliasRoutes.get(providerModelId);
  if (routeraiLlmModelIds.has(providerModelId)) return routeraiChatRoute(providerModelId);
  return routeraiMediaRoutes.get(providerModelId) ?? null;
}

function routeWithSupportedParameters(route, supportedParameters) {
  if (!route || !supportedParameters || route.supportedParameters) return route;
  return Object.freeze({
    ...route,
    supportedParameters
  });
}

export function exactProviderRoutesFor(providerModelId) {
  const normalizedProviderModelId = normalizeProviderModelId(providerModelId);
  if (!normalizedProviderModelId) return [];
  if (normalizedProviderModelId.endsWith(':free')) {
    return [{ provider: 'openrouter', providerModelId: normalizedProviderModelId }];
  }
  if (polzaModelIds.has(normalizedProviderModelId)) {
    const supportedParameters = polzaSupportedParameters.get(normalizedProviderModelId);
    const routeraiRoute = routeWithSupportedParameters(
      routeraiRouteFor(normalizedProviderModelId),
      supportedParameters
    );
    return routeraiRoute
      ? [routeraiRoute]
      : [{
        provider: 'polza',
        providerModelId: normalizedProviderModelId,
        ...(supportedParameters ? { supportedParameters } : {})
      }, ...(kieExactModelIds.has(normalizedProviderModelId)
        ? [{ provider: 'kie', providerModelId: normalizedProviderModelId }]
        : [])];
  }
  if (kieExactModelIds.has(normalizedProviderModelId)) {
    return [{ provider: 'kie', providerModelId: normalizedProviderModelId }];
  }
  const routeraiRoute = routeWithSupportedParameters(
    routeraiRouteFor(normalizedProviderModelId),
    routeraiDirectByProviderId.get(normalizedProviderModelId)?.supportedParameters
  );
  if (routeraiRoute) return [routeraiRoute];
  return [];
}
