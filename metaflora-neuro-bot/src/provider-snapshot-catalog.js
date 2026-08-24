import { POLZA_PROVIDER_MODELS } from './polza-provider-models.js';
import { POLZA_PUBLIC_MODELS } from './provider-model-snapshot.js';
import { confirmedProviderPriceFor } from './provider-pricing.js';
import { isPolzaEmbeddingModel } from './polza-snapshot-filters.js';

const LLM_FAMILY_IDS = Object.freeze([
  'openai', 'anthropic', 'google', 'xai', 'kimi', 'deepseek', 'qwen', 'other', 'search', 'russian'
]);
const PUBLIC_CATEGORIES = Object.freeze(['image', 'video', 'audio', 'voice']);

// The authenticated snapshot is the source of truth for most fields. A few
// media releases publish their controls in the model card before the snapshot
// endpoint starts returning them. Keep those additive and model-scoped: the
// adapter still filters every outgoing field against this exact route contract.
const DOCUMENTED_MEDIA_PARAMETER_OVERRIDES = Object.freeze({
  'google/gemini-3-pro-image-preview': Object.freeze([
    Object.freeze({ key: 'num_images', defaultValue: '1', values: Object.freeze(['1', '2', '3', '4']) }),
    Object.freeze({ key: 'output_format', defaultValue: 'png', values: Object.freeze(['png', 'jpeg', 'webp']) }),
    Object.freeze({ key: 'enable_web_search', defaultValue: 'false', values: Object.freeze(['false', 'true']) })
  ]),
  'google/gemini-3.1-flash-image': Object.freeze([
    Object.freeze({ key: 'aspect_ratio', defaultValue: 'auto', values: Object.freeze([
      'auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16', '4:1', '1:4', '8:1', '1:8'
    ]) }),
    Object.freeze({ key: 'image_resolution', defaultValue: '1K', values: Object.freeze(['0.5K', '1K', '2K', '4K']) }),
    Object.freeze({ key: 'num_images', defaultValue: '1', values: Object.freeze(['1', '2', '3', '4']) }),
    Object.freeze({ key: 'output_format', defaultValue: 'png', values: Object.freeze(['png', 'jpeg', 'webp']) }),
    Object.freeze({ key: 'enable_web_search', defaultValue: 'false', values: Object.freeze(['false', 'true']) })
  ]),
  'google/gemini-3.1-flash-lite-image': Object.freeze([
    Object.freeze({ key: 'aspect_ratio', defaultValue: 'auto', values: Object.freeze([
      'auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16', '4:1', '1:4', '8:1', '1:8'
    ]) }),
    Object.freeze({ key: 'output_format', defaultValue: 'png', values: Object.freeze(['png', 'jpeg', 'webp']) })
  ]),
  'openai/gpt-5.4-image-2': Object.freeze([
    Object.freeze({ key: 'quality', defaultValue: 'high', values: Object.freeze(['low', 'medium', 'high']) }),
    Object.freeze({ key: 'output_format', defaultValue: 'png', values: Object.freeze(['png', 'jpeg', 'webp']) })
  ]),
  'bytedance/seedance-2': Object.freeze([
    Object.freeze({
      key: 'resolution',
      defaultValue: '720p',
      values: Object.freeze(['480p', '720p', '1080p', '4k'])
    }),
    Object.freeze({
      key: 'duration',
      defaultValue: '15',
      values: Object.freeze(Array.from({ length: 12 }, (_, index) => String(index + 4)))
    }),
    Object.freeze({
      key: 'multi_shots',
      defaultValue: 'false',
      values: Object.freeze(['true', 'false'])
    })
  ]),
  'bytedance/seedance-2-fast': Object.freeze([
    Object.freeze({
      key: 'duration',
      defaultValue: '15',
      values: Object.freeze(Array.from({ length: 12 }, (_, index) => String(index + 4)))
    }),
    Object.freeze({
      key: 'multi_shots',
      defaultValue: 'false',
      values: Object.freeze(['true', 'false'])
    })
  ]),
  'bytedance/seedance-2-mini': Object.freeze([
    Object.freeze({
      key: 'duration',
      defaultValue: '15',
      values: Object.freeze(Array.from({ length: 12 }, (_, index) => String(index + 4)))
    }),
    Object.freeze({
      key: 'multi_shots',
      defaultValue: 'false',
      values: Object.freeze(['true', 'false'])
    })
  ])
});

const aliasesByProviderModelId = Object.freeze(Object.entries(POLZA_PROVIDER_MODELS)
  .flatMap(([id, providerModelIds]) => providerModelIds.map((providerModelId) => [providerModelId, id]))
  .reduce((aliases, [providerModelId, id]) => ({
    ...aliases,
    [providerModelId]: aliases[providerModelId] ?? id
  }), {}));

function hash(value) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.codePointAt(0);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36).padStart(7, '0').slice(-7);
}

function generatedId(providerModelId) {
  const slug = providerModelId
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '_')
    .replace(/^_+|_+$/gu, '')
    .slice(0, 41);
  return `polza_${slug}_${hash(providerModelId)}`;
}

function llmFamilyFor(providerModelId) {
  const namespace = providerModelId.split('/')[0];
  if (namespace === 'openai') return 'openai';
  if (namespace === 'anthropic') return 'anthropic';
  if (namespace === 'google') return 'google';
  if (namespace === 'x-ai') return 'xai';
  if (namespace === 'moonshotai') return 'kimi';
  if (namespace === 'deepseek') return 'deepseek';
  if (namespace === 'qwen') return 'qwen';
  if (namespace === 'perplexity') return 'search';
  if (namespace === 'yandex' || namespace === 'sber') return 'russian';
  return 'other';
}

function providerParametersFor(entry) {
  const parameters = [
    ...(entry.providerParameters ?? []),
    ...(DOCUMENTED_MEDIA_PARAMETER_OVERRIDES[entry.providerModelId] ?? [])
  ];
  return Object.freeze([...new Map(parameters.map((parameter) => [parameter.key, parameter])).values()]);
}

function descriptorFor(entry) {
  const id = aliasesByProviderModelId[entry.providerModelId] ?? generatedId(entry.providerModelId);
  const providerPricing = confirmedProviderPriceFor(entry.providerModelId);
  const available = Boolean(entry.endpointAvailable && providerPricing);
  return Object.freeze({
    id,
    name: entry.name,
    category: entry.category,
    ...(entry.category === 'llm' ? { family: llmFamilyFor(entry.providerModelId) } : {}),
    provider: 'polza',
    providerModelId: entry.providerModelId,
    ...(providerPricing ? { providerPricing } : {}),
    supportedParameters: Object.freeze([...(entry.supportedParameters ?? [])]),
    providerParameters: providerParametersFor(entry),
    ...(entry.contextLength ? { contextLength: entry.contextLength } : {}),
    ...(entry.maxCompletionTokens ? { maxCompletionTokens: entry.maxCompletionTokens } : {}),
    ...(entry.iconProviderSlug ? { iconProviderSlug: entry.iconProviderSlug } : {}),
    ...(available ? { providerModels: Object.freeze([entry.providerModelId]) } : {}),
    availability: available ? 'available' : 'unavailable'
  });
}

const projectedModels = POLZA_PUBLIC_MODELS
  .filter((entry) => (
    entry.available
      && !isPolzaEmbeddingModel(entry)
      && entry.category !== 'embedding'
      && !/^openai\/gpt-5\.6-sol(?:-pro)?$/u.test(entry.providerModelId)
  ))
  // Keep a listed model in the catalogue even if its current provider price
  // is unsafe to charge. Its card is explicitly non-runnable instead of
  // disappearing with the rest of its category.
  .map(descriptorFor);

export const PROVIDER_SNAPSHOT_MODELS_BY_ID = Object.freeze(Object.fromEntries(
  projectedModels.map((model) => [model.id, model])
));

export const PROVIDER_SNAPSHOT_LLM_MODELS_BY_FAMILY = Object.freeze(Object.fromEntries(
  LLM_FAMILY_IDS.map((familyId) => [familyId, Object.freeze(projectedModels
    .filter((model) => model.category === 'llm' && model.family === familyId)
    .map(({ id, name }) => Object.freeze([id, name])))])
));

export const PROVIDER_SNAPSHOT_CATEGORY_MODELS = Object.freeze(Object.fromEntries(
  PUBLIC_CATEGORIES.map((category) => [category, Object.freeze(projectedModels
    .filter((model) => model.category === category)
    .map(({ id, name }) => Object.freeze([id, name])))])
));
