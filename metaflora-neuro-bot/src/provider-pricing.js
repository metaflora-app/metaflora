import { POLZA_PUBLIC_MODELS } from './provider-model-snapshot.js';
import { ROUTERAI_DIRECT_MODELS } from './routerai-direct-models.js';
import { exactProviderRoutesFor } from './provider-route-matrix.js';
import {
  ROUTERAI_LIVE_PRICING,
  ROUTERAI_LIVE_PRICING_CHECKED_AT
} from './routerai-live-pricing.js';

export const PROVIDER_PRICE_CHECKED_AT = '2026-08-02';

export const LLM_PRICE_RANGE_PROFILE = Object.freeze({
  minInputTokens: 1_000,
  minOutputTokens: 1_000,
  maxInputTokens: 4_096,
  maxOutputTokens: 4_096
});

const ROUTERAI_PRICING_SOURCE = 'https://routerai.ru/api/v1/models';

// Conservative fallback for legacy image routes without a published model
// schedule.  Every RouterAI route with a published schedule below must use its
// own entry instead of this fallback.
export const ROUTERAI_IMAGE_OUTPUT_TOKEN_RESERVE = Object.freeze({
  low: 256,
  standard: 1_025,
  high: 4_100,
  ultra: 16_400
});

// RouterAI exposes these models in image-output tokens.  The exact number of
// image tokens is model- and resolution-dependent, so a single multiplier is
// financially wrong.  Values are the providers' published token schedules.
export const ROUTERAI_IMAGE_OUTPUT_TOKEN_SCHEDULES = Object.freeze({
  'google/gemini-2.5-flash-image': Object.freeze({ standard: 1_290 }),
  'google/gemini-3-pro-image': Object.freeze({
    standard: 1_120,
    high: 1_120,
    ultra: 2_000
  }),
  'google/gemini-3-pro-image-preview': Object.freeze({
    standard: 1_120,
    high: 1_120,
    ultra: 2_000
  }),
  'google/gemini-3.1-flash-image': Object.freeze({
    low: 747,
    standard: 1_120,
    high: 1_680,
    ultra: 2_520
  }),
  'google/gemini-3.1-flash-image-preview': Object.freeze({
    low: 747,
    standard: 1_120,
    high: 1_680,
    ultra: 2_520
  }),
  'google/gemini-3.1-flash-lite-image': Object.freeze({ standard: 1_120 })
});

// RouterAI documents FLUX.2 billing in megapixels rather than an opaque image
// token bucket.  Each generated image can be up to four megapixels and each
// reference is billed on the same basis.  Keep the dimensional limit together
// with the route so that a reference-heavy edit cannot silently underfund the
// provider reserve.
export const ROUTERAI_IMAGE_MEGAPIXEL_SCHEDULES = Object.freeze({
  'black-forest-labs/flux.2-pro': Object.freeze({
    maxOutputMegapixels: 4,
    maxInputMegapixels: 4,
    maxInputReferences: 8,
    imageTokensPerMegapixel: 4_096
  }),
  'black-forest-labs/flux.2-flex': Object.freeze({
    maxOutputMegapixels: 4,
    maxInputMegapixels: 4,
    maxInputReferences: 8,
    imageTokensPerMegapixel: 4_096
  }),
  'black-forest-labs/flux.2-max': Object.freeze({
    maxOutputMegapixels: 4,
    maxInputMegapixels: 4,
    maxInputReferences: 8,
    imageTokensPerMegapixel: 4_096
  })
});

// GPT Image 1's public per-image table maps directly to image-output tokens.
// RouterAI exposes GPT-5 Image / GPT Image 2 in those same output-token units;
// using this table means quality and aspect ratio are quoted once, rather than
// applying a generic resolution multiplier on top of the provider price.
const ROUTERAI_OPENAI_IMAGE_OUTPUT_TOKEN_SCHEDULES = Object.freeze({
  'openai/gpt-5-image': Object.freeze({
    low: Object.freeze({ square: 272, landscape: 400, portrait: 416, auto: 416 }),
    medium: Object.freeze({ square: 1_056, landscape: 1_568, portrait: 1_584, auto: 1_584 }),
    high: Object.freeze({ square: 4_160, landscape: 6_208, portrait: 6_240, auto: 6_240 })
  }),
  'openai/gpt-5-image-mini': Object.freeze({
    low: Object.freeze({ square: 272, landscape: 400, portrait: 416, auto: 416 }),
    medium: Object.freeze({ square: 1_056, landscape: 1_568, portrait: 1_584, auto: 1_584 }),
    high: Object.freeze({ square: 4_160, landscape: 6_208, portrait: 6_240, auto: 6_240 })
  }),
  'openai/gpt-5.4-image-2': Object.freeze({
    low: Object.freeze({ square: 272, landscape: 400, portrait: 416, auto: 416 }),
    medium: Object.freeze({ square: 1_056, landscape: 1_568, portrait: 1_584, auto: 1_584 }),
    high: Object.freeze({ square: 4_160, landscape: 6_208, portrait: 6_240, auto: 6_240 })
  }),
  'openai/gpt-image-2': Object.freeze({
    low: Object.freeze({ square: 272, landscape: 400, portrait: 416, auto: 416 }),
    medium: Object.freeze({ square: 1_056, landscape: 1_568, portrait: 1_584, auto: 1_584 }),
    high: Object.freeze({ square: 4_160, landscape: 6_208, portrait: 6_240, auto: 6_240 })
  })
});

function finitePositive(value) {
  return Number.isFinite(value) && value > 0;
}

function imageTokenTier(settings = {}) {
  const quality = String(settings.quality ?? '').toLowerCase();
  if (quality === 'low') return 'low';
  if (quality === 'medium') return 'standard';
  if (quality === 'high') return 'high';
  const resolution = String(settings.resolution ?? '').toLowerCase();
  if (/(?:4k|4096|3840|2160)/u.test(resolution)) {
    return 'ultra';
  }
  if (/(?:2k|2048|1792|1536)/u.test(resolution)) {
    return 'high';
  }
  if (/(?:0\.5k|512|480)/u.test(resolution)) {
    return 'low';
  }
  return 'standard';
}

function imageAspectClass(settings = {}) {
  const aspectRatio = String(settings.aspect_ratio ?? settings.resolution ?? '').toLowerCase();
  if (aspectRatio === 'auto' || aspectRatio.length === 0) return 'auto';
  if (/(?:^|[^0-9])(?:1:1|square)(?:$|[^0-9])/u.test(aspectRatio)) return 'square';
  const [width, height] = aspectRatio.split(':').map(Number);
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    if (width === height) return 'square';
    return width > height ? 'landscape' : 'portrait';
  }
  if (/(?:landscape|wide|horizontal)/u.test(aspectRatio)) return 'landscape';
  if (/(?:portrait|vertical)/u.test(aspectRatio)) return 'portrait';
  return 'auto';
}

function openAiImageOutputTokensForSettings(settings, providerModelId) {
  const schedule = ROUTERAI_OPENAI_IMAGE_OUTPUT_TOKEN_SCHEDULES[providerModelId];
  if (!schedule) return null;
  const quality = String(settings.quality ?? 'medium').toLowerCase();
  const qualitySchedule = schedule[quality] ?? schedule.medium ?? schedule.high ?? schedule.low;
  const aspect = imageAspectClass(settings);
  return qualitySchedule[aspect]
    ?? qualitySchedule.auto
    ?? qualitySchedule.portrait
    ?? qualitySchedule.landscape
    ?? qualitySchedule.square;
}

function numericLeaves(value) {
  if (Number.isFinite(value) && value > 0) return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(numericLeaves);
}

function tokenScheduleFor(providerModelId) {
  return ROUTERAI_IMAGE_OUTPUT_TOKEN_SCHEDULES[providerModelId]
    ?? ROUTERAI_IMAGE_OUTPUT_TOKEN_RESERVE;
}

export function routeraiImageOutputTokensForSettings(settings = {}, providerModelId = '') {
  const openAiTokens = openAiImageOutputTokensForSettings(settings, providerModelId);
  if (Number.isFinite(openAiTokens) && openAiTokens > 0) return openAiTokens;
  const schedule = tokenScheduleFor(providerModelId);
  const tier = imageTokenTier(settings);
  return schedule[tier]
    ?? schedule.standard
    ?? schedule.high
    ?? schedule.ultra
    ?? schedule.low;
}

export function routeraiImageOutputTokenRange(providerModelId = '') {
  const tokens = numericLeaves(
    ROUTERAI_OPENAI_IMAGE_OUTPUT_TOKEN_SCHEDULES[providerModelId]
      ?? tokenScheduleFor(providerModelId)
  );
  return Object.freeze({
    min: Math.min(...tokens),
    max: Math.max(...tokens)
  });
}

function routeraiRouteForPricing(providerModelId) {
  return exactProviderRoutesFor(providerModelId)
    .find(({ provider }) => provider === 'routerai')
    ?? null;
}

function routeraiPriceSource(providerModelId) {
  return Object.freeze({
    source: ROUTERAI_PRICING_SOURCE,
    checkedAt: ROUTERAI_LIVE_PRICING_CHECKED_AT,
    provider: 'routerai',
    providerModelId
  });
}

function liveRouteraiProviderPrice(providerModelId) {
  const route = routeraiRouteForPricing(providerModelId);
  if (!route) return null;

  const actualProviderModelId = route.providerModelId;
  const pricing = ROUTERAI_LIVE_PRICING[actualProviderModelId];
  if (!pricing) return null;
  const source = routeraiPriceSource(actualProviderModelId);

  if (route.protocol === 'speech' && finitePositive(pricing.prompt)) {
    return Object.freeze({
      type: 'character_million',
      minRublesPerMillionCharacters: pricing.prompt * 1_000_000,
      maxRublesPerMillionCharacters: pricing.prompt * 1_000_000,
      ...source
    });
  }

  if (route.protocol === 'transcription' && finitePositive(pricing.seconds)) {
    return Object.freeze({
      type: 'audio_minutes',
      minRublesPerMinute: pricing.seconds * 60,
      maxRublesPerMinute: pricing.seconds * 60,
      ...source
    });
  }

  if (finitePositive(pricing.seconds)) {
    return Object.freeze({
      type: 'video_seconds',
      minRublesPerSecond: pricing.seconds,
      maxRublesPerSecond: pricing.seconds,
      ...source
    });
  }

  if (finitePositive(pricing.image_output)) {
    const megapixelSchedule = ROUTERAI_IMAGE_MEGAPIXEL_SCHEDULES[actualProviderModelId];
    if (megapixelSchedule) {
      const outputRublesPerMegapixel = pricing.image_output * megapixelSchedule.imageTokensPerMegapixel;
      const inputRublesPerMegapixel = finitePositive(pricing.image_token)
        ? pricing.image_token * megapixelSchedule.imageTokensPerMegapixel
        : outputRublesPerMegapixel;
      return Object.freeze({
        type: 'image_megapixels',
        outputRublesPerMegapixel,
        inputRublesPerMegapixel,
        maxOutputMegapixels: megapixelSchedule.maxOutputMegapixels,
        maxInputMegapixels: megapixelSchedule.maxInputMegapixels,
        maxInputReferences: megapixelSchedule.maxInputReferences,
        ...source
      });
    }
    if (pricing.image_output >= 0.1) {
      return Object.freeze({
        type: 'request_units',
        minRublesPerRequest: pricing.image_output,
        maxRublesPerRequest: pricing.image_output,
        ...source
      });
    }
    return Object.freeze({
      type: 'image_output_tokens',
      rublesPerImageOutputToken: pricing.image_output,
      inputRublesPerMillion: (pricing.prompt ?? 0) * 1_000_000,
      outputRublesPerMillion: (pricing.completion ?? 0) * 1_000_000,
      ...source
    });
  }

  if (Number.isFinite(pricing.prompt) || Number.isFinite(pricing.completion)) {
    return Object.freeze({
      type: 'llm_tokens',
      inputRublesPerMillion: (pricing.prompt ?? 0) * 1_000_000,
      outputRublesPerMillion: (pricing.completion ?? 0) * 1_000_000,
      ...source
    });
  }

  return null;
}

function llmTokens(inputRublesPerMillion, outputRublesPerMillion, providerModelId) {
  return Object.freeze({
    type: 'llm_tokens',
    inputRublesPerMillion,
    outputRublesPerMillion,
    source: `https://polza.ai/models/${providerModelId}`,
    checkedAt: PROVIDER_PRICE_CHECKED_AT
  });
}

function routeraiLlmTokens(inputRublesPerMillion, outputRublesPerMillion, providerModelId, checkedAt = '2026-08-13') {
  return Object.freeze({
    ...llmTokens(inputRublesPerMillion, outputRublesPerMillion, providerModelId),
    source: `https://routerai.ru/models/${providerModelId}`,
    checkedAt,
    provider: 'routerai',
    providerModelId
  });
}

function videoSeconds(minRublesPerSecond, maxRublesPerSecond, providerModelId) {
  return Object.freeze({
    type: 'video_seconds',
    minRublesPerSecond,
    maxRublesPerSecond,
    source: `https://polza.ai/models/${providerModelId}`,
    checkedAt: PROVIDER_PRICE_CHECKED_AT
  });
}

function requestUnits(minRublesPerRequest, maxRublesPerRequest, providerModelId) {
  return Object.freeze({
    type: 'request_units',
    minRublesPerRequest,
    maxRublesPerRequest,
    source: `https://polza.ai/models/${providerModelId}`,
    checkedAt: PROVIDER_PRICE_CHECKED_AT
  });
}

function routeraiRequestUnits(rublesPerRequest, providerModelId) {
  return Object.freeze({
    type: 'request_units',
    minRublesPerRequest: rublesPerRequest,
    maxRublesPerRequest: rublesPerRequest,
    source: `https://routerai.ru/models/${providerModelId}`,
    checkedAt: '2026-08-21',
    provider: 'routerai',
    providerModelId
  });
}

function freezeTierPrices(tierPrices = []) {
  return Object.freeze(tierPrices.map(({ conditions, costRubles }) => Object.freeze({
    conditions: Object.freeze({ ...conditions }),
    costRubles
  })));
}

function routeraiVideoSeconds(rublesPerSecond, providerModelId, options = {}) {
  return Object.freeze({
    type: 'video_seconds',
    minRublesPerSecond: rublesPerSecond,
    maxRublesPerSecond: rublesPerSecond,
    source: `https://routerai.ru/models/${providerModelId}`,
    checkedAt: '2026-08-11',
    provider: 'routerai',
    providerModelId,
    ...(options.tierPrices ? { tierPrices: freezeTierPrices(options.tierPrices) } : {})
  });
}

export const CONFIRMED_PROVIDER_PRICES = Object.freeze({
  'anthropic/claude-fable-5': llmTokens(1092.82, 5464.11, 'anthropic/claude-fable-5'),
  'anthropic/claude-haiku-4.5': llmTokens(50.68, 251.82, 'anthropic/claude-haiku-4.5'),
  'anthropic/claude-opus-4.6': llmTokens(251.82, 1259.12, 'anthropic/claude-opus-4.6'),
  'anthropic/claude-opus-4.7': llmTokens(546.41, 2732.05, 'anthropic/claude-opus-4.7'),
  'anthropic/claude-opus-4.8': llmTokens(601.05, 3005.26, 'anthropic/claude-opus-4.8'),
  'anthropic/claude-opus-4.8-fast': llmTokens(1092.82, 5464.11, 'anthropic/claude-opus-4.8-fast'),
  'anthropic/claude-opus-5': llmTokens(546.41, 2732.05, 'anthropic/claude-opus-5'),
  'anthropic/claude-sonnet-5': llmTokens(218.56, 1092.82, 'anthropic/claude-sonnet-5'),
  'bytedance/seedance-2': routeraiVideoSeconds(15, 'bytedance/seedance-2.0'),
  'bytedance/seedance-2-fast': videoSeconds(10.46, 22.27, 'bytedance/seedance-2-fast'),
  'bytedance/seedance-2-mini': videoSeconds(4.18, 11, 'bytedance/seedance-2-mini'),
  'bytedance/seedance-2.5': routeraiVideoSeconds(24.819468336, 'bytedance/seedance-2.5'),
  'black-forest-labs/flux-3-video': routeraiVideoSeconds(18, 'black-forest-labs/flux-3-video', {
    tierPrices: [
      { conditions: { resolution: '720p' }, costRubles: 18 },
      { conditions: { resolution: '1080p' }, costRubles: 31 }
    ]
  }),
  'minimax-h3/text-to-video': routeraiVideoSeconds(14, 'minimax/hailuo-3'),
  'minimax-h3/image-to-video': routeraiVideoSeconds(14, 'minimax/hailuo-3'),
  'minimax-h3/reference-to-video': routeraiVideoSeconds(14, 'minimax/hailuo-3'),
  'minimax/hailuo-3': routeraiVideoSeconds(14, 'minimax/hailuo-3'),
  'deepseek/deepseek-r1': llmTokens(162.28, 649.14, 'deepseek/deepseek-r1'),
  'deepseek/deepseek-v3.2': llmTokens(28.41, 41.53, 'deepseek/deepseek-v3.2'),
  'deepseek/deepseek-v3.2-exp': llmTokens(29.51, 44.81, 'deepseek/deepseek-v3.2-exp'),
  'deepseek/deepseek-v4-flash': llmTokens(15.3, 30.6, 'deepseek/deepseek-v4-flash'),
  'deepseek/deepseek-v4-pro': llmTokens(486.31, 601.05, 'deepseek/deepseek-v4-pro'),
  'deepseek/deepseek-v4-pro-0813': routeraiLlmTokens(49.75, 99.51, 'deepseek/deepseek-v4-pro-0813'),
  'google/gemini-2.5-flash': llmTokens(12.83, 106.91, 'google/gemini-2.5-flash'),
  'google/gemini-2.5-pro': llmTokens(54.17, 427.63, 'google/gemini-2.5-pro'),
  'google/gemini-3-flash-preview': llmTokens(54.64, 327.85, 'google/gemini-3-flash-preview'),
  'google/gemini-3.1-flash-lite': llmTokens(27.32, 163.92, 'google/gemini-3.1-flash-lite'),
  'google/gemini-3.1-flash-image': requestUnits(54.65, 54.65, 'google/gemini-3.1-flash-image'),
  'google/gemini-3.1-flash-lite-image': requestUnits(27.33, 27.33, 'google/gemini-3.1-flash-lite-image'),
  // RouterAI bills image output tokens. These ceilings cover a high-quality
  // non-square image, so the bot never prices a request below provider cost.
  'openai/gpt-5-image': routeraiRequestUnits(27.1, 'openai/gpt-5-image'),
  'openai/gpt-5-image-mini': routeraiRequestUnits(5.5, 'openai/gpt-5-image-mini'),
  'google/gemini-3.1-pro-preview': llmTokens(71.27, 498.9, 'google/gemini-3.1-pro-preview'),
  'google/gemini-3.1-pro-preview-customtools': llmTokens(218.56, 1311.39, 'google/gemini-3.1-pro-preview-customtools'),
  'google/gemini-3.5-flash': llmTokens(163.92, 983.54, 'google/gemini-3.5-flash'),
  'google/gemini-3.5-flash-lite': llmTokens(32.78, 273.21, 'google/gemini-3.5-flash-lite'),
  'google/gemini-3.6-flash': llmTokens(163.92, 819.62, 'google/gemini-3.6-flash'),
  'meta-llama/llama-4-maverick': llmTokens(21.86, 87.43, 'meta-llama/llama-4-maverick'),
  'meta-llama/llama-4-scout': llmTokens(10.93, 32.78, 'meta-llama/llama-4-scout'),
  'minimax/minimax-m2.5': llmTokens(24.59, 98.35, 'minimax/minimax-m2.5'),
  'minimax/minimax-m2.7': llmTokens(65.57, 262.28, 'minimax/minimax-m2.7'),
  'minimax/minimax-m3': llmTokens(32.78, 131.14, 'minimax/minimax-m3'),
  'mistralai/codestral-2508': llmTokens(32.78, 98.35, 'mistralai/codestral-2508'),
  'mistralai/mistral-large-2512': llmTokens(54.64, 163.92, 'mistralai/mistral-large-2512'),
  'mistralai/mistral-medium-3-5': llmTokens(163.92, 819.62, 'mistralai/mistral-medium-3-5'),
  'mistralai/mistral-small-2603': llmTokens(16.39, 65.57, 'mistralai/mistral-small-2603'),
  'moonshotai/kimi-k2-thinking': llmTokens(65.57, 273.21, 'moonshotai/kimi-k2-thinking'),
  'moonshotai/kimi-k2.5': llmTokens(48.08, 218.56, 'moonshotai/kimi-k2.5'),
  'moonshotai/kimi-k2.6': llmTokens(65.57, 372.65, 'moonshotai/kimi-k2.6'),
  'moonshotai/kimi-k2.7-code': llmTokens(83.05, 382.49, 'moonshotai/kimi-k2.7-code'),
  'moonshotai/kimi-k3': llmTokens(327.85, 1639.23, 'moonshotai/kimi-k3'),
  'nvidia/nemotron-3-ultra-550b-a55b': llmTokens(65.57, 393.42, 'nvidia/nemotron-3-ultra-550b-a55b'),
  'x-ai/grok-4.6': routeraiLlmTokens(228.75, 686.25, 'x-ai/grok-4.6'),
  'openai/gpt-4.1': llmTokens(218.56, 874.26, 'openai/gpt-4.1'),
  'openai/gpt-4.1-mini': llmTokens(43.71, 174.85, 'openai/gpt-4.1-mini'),
  'openai/gpt-4.1-nano': llmTokens(10.93, 43.71, 'openai/gpt-4.1-nano'),
  'openai/gpt-4o': llmTokens(273.21, 1092.82, 'openai/gpt-4o'),
  'openai/gpt-4o-mini': llmTokens(16.39, 65.57, 'openai/gpt-4o-mini'),
  'openai/gpt-5': llmTokens(136.6, 1092.82, 'openai/gpt-5'),
  'openai/gpt-5-codex': llmTokens(72.06, 576.5, 'openai/gpt-5-codex'),
  'openai/gpt-5-mini': llmTokens(27.32, 218.56, 'openai/gpt-5-mini'),
  'openai/gpt-5-nano': llmTokens(5.46, 43.71, 'openai/gpt-5-nano'),
  'openai/gpt-5-pro': llmTokens(1639.23, 13113.86, 'openai/gpt-5-pro'),
  'openai/gpt-5.2': llmTokens(62.72, 498.9, 'openai/gpt-5.2'),
  'openai/gpt-5.2-codex': llmTokens(100.73, 806.15, 'openai/gpt-5.2-codex'),
  'openai/gpt-5.2-pro': llmTokens(2294.93, 18359.41, 'openai/gpt-5.2-pro'),
  'openai/gpt-5.3-chat': llmTokens(191.24, 1529.95, 'openai/gpt-5.3-chat'),
  'openai/gpt-5.3-codex': llmTokens(100.73, 806.15, 'openai/gpt-5.3-codex'),
  'openai/gpt-5.4': llmTokens(100.73, 806.15, 'openai/gpt-5.4'),
  'openai/gpt-5.4-mini': llmTokens(81.96, 491.77, 'openai/gpt-5.4-mini'),
  'openai/gpt-5.4-nano': llmTokens(21.86, 136.6, 'openai/gpt-5.4-nano'),
  'openai/gpt-5.4-pro': llmTokens(3278.47, 19670.8, 'openai/gpt-5.4-pro'),
  'openai/gpt-5.5': llmTokens(546.41, 3278.47, 'openai/gpt-5.5'),
  'openai/gpt-5.5-pro': llmTokens(3278.47, 19670.8, 'openai/gpt-5.5-pro'),
  'openai/gpt-5.6-luna': llmTokens(10.93, 65.57, 'openai/gpt-5.6-luna'),
  'openai/gpt-5.6-luna-pro': llmTokens(10.93, 65.57, 'openai/gpt-5.6-luna-pro'),
  'openai/gpt-5.6-terra': llmTokens(109.28, 655.69, 'openai/gpt-5.6-terra'),
  'openai/gpt-5.6-terra-pro': llmTokens(109.28, 655.69, 'openai/gpt-5.6-terra-pro'),
  'openai/gpt-5.6-sol': routeraiLlmTokens(271, 1625, 'openai/gpt-5.6-sol', '2026-08-21'),
  'openai/gpt-5.6-sol-pro': routeraiLlmTokens(284, 1707, 'openai/gpt-5.6-sol-pro', '2026-08-21'),
  'openai/gpt-5.4-image-2': requestUnits(1, 11, 'openai/gpt-5.4-image-2'),
  'openai/o3': llmTokens(218.56, 874.26, 'openai/o3'),
  'openai/o3-pro': llmTokens(2185.64, 8742.58, 'openai/o3-pro'),
  'openai/o4-mini': llmTokens(120.21, 480.84, 'openai/o4-mini'),
  'perplexity/sonar': llmTokens(109.28, 109.28, 'perplexity/sonar'),
  'perplexity/sonar-deep-research': llmTokens(218.56, 874.26, 'perplexity/sonar-deep-research'),
  'perplexity/sonar-pro': llmTokens(327.85, 1639.23, 'perplexity/sonar-pro'),
  'perplexity/sonar-pro-search': llmTokens(327.85, 1639.23, 'perplexity/sonar-pro-search'),
  'perplexity/sonar-reasoning-pro': llmTokens(218.56, 874.26, 'perplexity/sonar-reasoning-pro'),
  'qwen/qwen3-coder': llmTokens(106.55, 532.75, 'qwen/qwen3-coder'),
  'qwen/qwen3-coder-next': llmTokens(19.67, 98.35, 'qwen/qwen3-coder-next'),
  'qwen/qwen3-vl-235b-a22b-instruct': llmTokens(28.41, 113.65, 'qwen/qwen3-vl-235b-a22b-instruct'),
  'qwen/qwen3.6-flash': llmTokens(20.49, 122.94, 'qwen/qwen3.6-flash'),
  'qwen/qwen3.6-max-preview': llmTokens(113.65, 681.92, 'qwen/qwen3.6-max-preview'),
  'qwen/qwen3.7-max': llmTokens(161.19, 483.57, 'qwen/qwen3.7-max'),
  'sber/gigachat-2': llmTokens(89.7, 89.7, 'sber/gigachat-2'),
  'sber/gigachat-2-max': llmTokens(897, 897, 'sber/gigachat-2-max'),
  'sber/gigachat-2-pro': llmTokens(690, 690, 'sber/gigachat-2-pro'),
  'stepfun/step-3.7-flash': llmTokens(21.86, 125.67, 'stepfun/step-3.7-flash'),
  'tencent/hy3': llmTokens(14.43, 57.7, 'tencent/hy3'),
  'x-ai/grok-4.20': llmTokens(136.6, 273.21, 'x-ai/grok-4.20'),
  'x-ai/grok-4.3': llmTokens(136.6, 273.21, 'x-ai/grok-4.3'),
  'x-ai/grok-4.5': llmTokens(218.56, 655.69, 'x-ai/grok-4.5'),
  'x-ai/grok-build-0.1': llmTokens(109.28, 218.56, 'x-ai/grok-build-0.1'),
  'yandex/aliceai-llm': llmTokens(690, 1656, 'yandex/aliceai-llm'),
  'yandex/yandexgpt-5-lite': llmTokens(276, 276, 'yandex/yandexgpt-5-lite'),
  'yandex/yandexgpt-5-pro': llmTokens(1656, 1656, 'yandex/yandexgpt-5-pro'),
  'yandex/yandexgpt-5.1-pro': llmTokens(1104, 1104, 'yandex/yandexgpt-5.1-pro'),
  'z-ai/glm-5.2': llmTokens(114.75, 480.84, 'z-ai/glm-5.2')
});

const snapshotPricesByProviderModelId = Object.freeze(Object.fromEntries(
  POLZA_PUBLIC_MODELS
    .filter(({ pricing }) => pricing && typeof pricing === 'object')
    .map(({ providerModelId, pricing }) => [providerModelId, Object.freeze({
      ...pricing,
      source: `https://polza.ai/models/${providerModelId}`,
      checkedAt: pricing.checkedAt ?? 'provider-model-snapshot'
    })])
));

const INTERNAL_TIER_CONDITIONS = new Set(['has_video']);

function publicTierPrices(tierPrices) {
  const buckets = new Map();
  for (const tier of tierPrices) {
    const conditions = Object.fromEntries(Object.entries(tier.conditions ?? {})
      .filter(([key]) => !INTERNAL_TIER_CONDITIONS.has(key)));
    const key = JSON.stringify(Object.entries(conditions).sort(([left], [right]) => left.localeCompare(right)));
    const existing = buckets.get(key);
    if (!existing || tier.costRubles > existing.costRubles) {
      buckets.set(key, Object.freeze({ conditions: Object.freeze(conditions), costRubles: tier.costRubles }));
    }
  }
  return Object.freeze([...buckets.values()]);
}

const RESOLUTION_SENTINELS = new Set([720, 1080, 2160, 4320]);
const MAX_TRUSTED_VIDEO_PRICE_RATIO = 20;
const MAX_TRUSTED_GENERATION_RUBLES = 100;

function isFiniteNonNegative(value) {
  return Number.isFinite(value) && value >= 0;
}

function isTrustedVideoPrice(price) {
  const { minRublesPerSecond: min, maxRublesPerSecond: max } = price;
  if (!isFiniteNonNegative(min) || !isFiniteNonNegative(max) || max < min) return false;
  if (RESOLUTION_SENTINELS.has(max)) return false;
  if (min === 0) return max === 0;
  return (max / min) <= MAX_TRUSTED_VIDEO_PRICE_RATIO;
}

function isTrustedGenerationPrice(price) {
  const { minRubles: min, maxRubles: max } = price;
  return (
    price.unit === 'generation'
    && isFiniteNonNegative(min)
    && isFiniteNonNegative(max)
    && max >= min
    && max <= MAX_TRUSTED_GENERATION_RUBLES
  );
}

export function isTrustedSnapshotProviderPrice(price) {
  if (!price || typeof price !== 'object') return false;
  if (price.type === 'llm_tokens' || price.type === 'request_units') return true;
  if (price.type === 'video_seconds') return isTrustedVideoPrice(price);
  if (price.type === 'unit_rubles') return isTrustedGenerationPrice(price);
  if (price.type === 'audio_minutes' || price.type === 'character_million' || price.type === 'token_million') {
    return true;
  }
  return false;
}

export function confirmedProviderPriceFor(providerModelId) {
  // Provider routing is authoritative: when a public card executes through
  // RouterAI, its live RouterAI catalogue price must win over an older Polza
  // snapshot carrying the same historical identifier.
  const liveRouteraiPrice = liveRouteraiProviderPrice(providerModelId);
  if (liveRouteraiPrice) return liveRouteraiPrice;

  const curatedPrice = CONFIRMED_PROVIDER_PRICES[providerModelId];
  const snapshotPrice = snapshotPricesByProviderModelId[providerModelId];
  const routeraiDirectPrice = Object.values(ROUTERAI_DIRECT_MODELS)
    .find((model) => model.providerModelId === providerModelId)
    ?.providerPricing;
  if (curatedPrice) {
    // Curated prices are the billing baseline, while the provider snapshot owns
    // the selectable dimensions (resolution, sound, etc.).  Keeping both is
    // essential: otherwise a static range gets multiplied by a second generic
    // resolution factor in the UI.
    if (
      curatedPrice.provider !== 'routerai'
      && snapshotPrice?.type === curatedPrice.type
      && Array.isArray(snapshotPrice.tierPrices)
    ) {
      return Object.freeze({ ...curatedPrice, tierPrices: publicTierPrices(snapshotPrice.tierPrices) });
    }
    return curatedPrice;
  }

  return (isTrustedSnapshotProviderPrice(snapshotPrice) ? snapshotPrice : null)
    ?? (isTrustedSnapshotProviderPrice(routeraiDirectPrice) ? routeraiDirectPrice : null)
    ?? null;
}

export function confirmedProviderCostRangeRubles(
  providerPrice,
  profile = LLM_PRICE_RANGE_PROFILE
) {
  if (!providerPrice) return null;
  if (providerPrice.type === 'llm_tokens') {
    return Object.freeze({
      kind: 'llm',
      minRubles: (
        (providerPrice.inputRublesPerMillion * profile.minInputTokens)
        + (providerPrice.outputRublesPerMillion * profile.minOutputTokens)
      ) / 1_000_000,
      maxRubles: (
        (providerPrice.inputRublesPerMillion * profile.maxInputTokens)
        + (providerPrice.outputRublesPerMillion * profile.maxOutputTokens)
      ) / 1_000_000
    });
  }
  if (providerPrice.type === 'video_seconds') {
    if (!isTrustedVideoPrice(providerPrice)) return null;
    return Object.freeze({
      kind: 'video_seconds',
      minRubles: providerPrice.minRublesPerSecond,
      maxRubles: providerPrice.maxRublesPerSecond
    });
  }
  if (providerPrice.type === 'request_units') {
    return Object.freeze({
      kind: 'request_units',
      minRubles: providerPrice.minRublesPerRequest,
      maxRubles: providerPrice.maxRublesPerRequest
    });
  }
  if (providerPrice.type === 'image_output_tokens') {
    const outputTokenPrice = providerPrice.rublesPerImageOutputToken;
    const textInputPrice = providerPrice.inputRublesPerMillion ?? 0;
    const textOutputPrice = providerPrice.outputRublesPerMillion ?? 0;
    const textMinimum = (
      (textInputPrice * profile.minInputTokens)
      + (textOutputPrice * profile.minOutputTokens)
    ) / 1_000_000;
    const textMaximum = (
      (textInputPrice * profile.maxInputTokens)
      + (textOutputPrice * profile.maxOutputTokens)
    ) / 1_000_000;
    if (!finitePositive(outputTokenPrice)) return null;
    const imageTokens = routeraiImageOutputTokenRange(providerPrice.providerModelId);
    return Object.freeze({
      kind: 'image_output_tokens',
      minRubles: textMinimum + (
        outputTokenPrice * imageTokens.min
      ),
      maxRubles: textMaximum + (
        outputTokenPrice * imageTokens.max
      )
    });
  }
  if (providerPrice.type === 'image_megapixels') {
    const outputRate = providerPrice.outputRublesPerMegapixel;
    const inputRate = providerPrice.inputRublesPerMegapixel;
    const outputMegapixels = providerPrice.maxOutputMegapixels;
    const inputMegapixels = providerPrice.maxInputMegapixels;
    const referenceLimit = providerPrice.maxInputReferences;
    if (
      !finitePositive(outputRate)
      || !finitePositive(inputRate)
      || !finitePositive(outputMegapixels)
      || !finitePositive(inputMegapixels)
      || !Number.isSafeInteger(referenceLimit)
      || referenceLimit < 0
    ) return null;
    return Object.freeze({
      kind: 'image_megapixels',
      minRubles: outputRate * outputMegapixels,
      maxRubles: (outputRate * outputMegapixels)
        + (inputRate * inputMegapixels * referenceLimit)
    });
  }
  if (providerPrice.type === 'unit_rubles') {
    if (!isTrustedGenerationPrice(providerPrice)) return null;
    return Object.freeze({
      kind: 'request_units',
      minRubles: providerPrice.minRubles,
      maxRubles: providerPrice.maxRubles
    });
  }
  if (providerPrice.type === 'audio_minutes') {
    return Object.freeze({
      kind: 'audio_minutes',
      minRubles: providerPrice.minRublesPerMinute,
      maxRubles: providerPrice.maxRublesPerMinute
    });
  }
  if (providerPrice.type === 'character_million') {
    return Object.freeze({
      kind: 'character_million',
      minRubles: providerPrice.minRublesPerMillionCharacters * 1_000 / 1_000_000,
      maxRubles: providerPrice.maxRublesPerMillionCharacters * 1_000 / 1_000_000
    });
  }
  if (providerPrice.type === 'token_million') {
    return Object.freeze({
      kind: 'token_million',
      minRubles: providerPrice.minRublesPerMillionTokens * profile.minOutputTokens / 1_000_000,
      maxRubles: providerPrice.maxRublesPerMillionTokens * profile.maxOutputTokens / 1_000_000
    });
  }

  throw new TypeError(`Unsupported provider price type: ${providerPrice.type}`);
}
