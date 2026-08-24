import fs from 'node:fs';

import { normalizePolzaPricing } from '../src/polza-pricing-normalizer.js';
import { isPolzaEmbeddingModel } from '../src/polza-snapshot-filters.js';

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? new URL('../src/provider-model-snapshot.js', import.meta.url);

if (!inputPath) throw new Error('usage: node scripts/build-provider-model-snapshot.js <polza-catalog.json> [output]');

const categoryByType = Object.freeze({
  chat: 'llm',
  image: 'image',
  video: 'video',
  music: 'audio',
  stt: 'voice',
  tts: 'voice',
  embedding: 'embedding'
});

const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

function compactArray(values) {
  if (!Array.isArray(values)) return undefined;
  const compact = values.filter((value) => typeof value === 'string' && value.trim());
  return compact.length > 0 ? compact : undefined;
}

function publicParameters(parameters) {
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return undefined;
  const entries = Object.entries(parameters).flatMap(([key, definition]) => {
    const values = compactArray(definition?.values)?.map(String);
    if (!values || values.length < 2) return [];
    const defaultValue = String(definition?.default ?? values[0]);
    return [Object.freeze({
      key,
      defaultValue: values.includes(defaultValue) ? defaultValue : values[0],
      values: Object.freeze(values)
    })];
  });
  return entries.length > 0 ? Object.freeze(entries) : undefined;
}

function hasEndpoint(entry) {
  const direct = entry.endpoint ?? entry.url ?? entry.top_provider?.endpoint ?? entry.topProvider?.endpoint;
  if (typeof direct === 'string' && direct.trim()) return true;
  const endpoints = entry.endpoints ?? entry.top_provider?.endpoints ?? entry.topProvider?.endpoints;
  return Array.isArray(endpoints) && endpoints.length > 0;
}

function snapshotRecord(entry) {
  const { id, name, type } = entry;
  const rawCategory = categoryByType[type];
  const category = isPolzaEmbeddingModel({ providerModelId: id, name, category: rawCategory })
    ? 'embedding'
    : rawCategory;
  const topProvider = entry.top_provider ?? entry.topProvider;
  const pricing = normalizePolzaPricing(topProvider?.pricing ?? entry.pricing, { category });
  const supportedParameters = compactArray(
    entry.supported_parameters
      ?? entry.supportedParameters
      ?? topProvider?.supported_parameters
      ?? topProvider?.supportedParameters
  );
  const providerParameters = publicParameters(entry.parameters ?? topProvider?.parameters);
  const endpointAvailable = hasEndpoint(entry);

  return {
    provider: 'polza',
    providerModelId: id,
    name,
    category,
    available: entry.available ?? topProvider?.available ?? true,
    ...(pricing ? { pricing } : {}),
    ...(supportedParameters ? { supportedParameters } : {}),
    ...(providerParameters ? { providerParameters } : {}),
    endpointAvailable,
    ...(topProvider?.context_length ? { contextLength: topProvider.context_length } : {}),
    ...(topProvider?.max_completion_tokens ? { maxCompletionTokens: topProvider.max_completion_tokens } : {}),
    ...(entry.icon_provider_slug ? { iconProviderSlug: entry.icon_provider_slug } : {}),
    ...(entry.created ? { created: entry.created } : {})
  };
}

const models = source
  .map(snapshotRecord)
  .filter(({ providerModelId, name, category }) => providerModelId && name && category)
  .sort((left, right) => left.providerModelId.localeCompare(right.providerModelId));

const contents = `// Generated from the authenticated Polza catalog. Contains no credentials.\n`
  + `export const POLZA_PUBLIC_MODELS = Object.freeze(${JSON.stringify(models, null, 2)}\n`
  + `.map((model) => Object.freeze(model)));\n`;

fs.writeFileSync(outputPath, contents);
console.log(JSON.stringify({ source: source.length, written: models.length }));
