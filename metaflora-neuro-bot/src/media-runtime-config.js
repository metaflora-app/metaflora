import { TOOL_CATALOG } from './tool-catalog.js';

const RESULT_CONTRACTS = Object.freeze({
  image: Object.freeze({ type: 'image', mimeType: 'image/jpeg' }),
  video: Object.freeze({ type: 'video', mimeType: 'video/mp4' }),
  audio: Object.freeze({ type: 'audio', mimeType: 'audio/mpeg' }),
  text: Object.freeze({ type: 'text', mimeType: 'text/plain' }),
  document: Object.freeze({
    type: 'document',
    mimeType: 'application/octet-stream'
  }),
  '3d': Object.freeze({ type: 'document', mimeType: 'model/gltf-binary' })
});

const TEXT_OUTPUT_PATHS = new Set(['text', 'outputs']);
const THREE_D_OUTPUT_PATHS = new Set(['model_glb']);
const CATEGORY_RESULT_KINDS = Object.freeze({
  photo: 'image',
  video: 'video',
  audio: 'audio',
  document: 'document',
  '3d': '3d'
});

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function copyRecord(value) {
  if (Array.isArray(value)) return value.map(copyRecord);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, copyRecord(nested)])
  );
}

export function getMediaResultKind(tool) {
  if (!isRecord(tool) || !isRecord(tool.runtime)) {
    throw new TypeError('Tool runtime must be an object.');
  }

  const { outputPath } = tool.runtime;
  if (tool.runtime.resultKind) {
    if (!RESULT_CONTRACTS[tool.runtime.resultKind]) {
      throw new Error(`Unsupported explicit result kind for tool "${tool.id ?? 'unknown'}".`);
    }
    return tool.runtime.resultKind;
  }
  if (THREE_D_OUTPUT_PATHS.has(outputPath) || tool.category === '3d') return '3d';
  if (TEXT_OUTPUT_PATHS.has(outputPath)) return 'text';
  if (CATEGORY_RESULT_KINDS[tool.category]) {
    return CATEGORY_RESULT_KINDS[tool.category];
  }

  throw new Error(`Unsupported media result for tool "${tool.id ?? 'unknown'}".`);
}

function configuredProviders(providerKeys) {
  const providers = new Set(
    TOOL_CATALOG.flatMap(({ routes }) => routes.map(({ provider }) => provider))
  );
  return Object.fromEntries(
    [...providers].map((provider) => [
      provider,
      { apiKey: providerKeys[provider] ?? '' }
    ])
  );
}

function configuredRoute(tool, route) {
  const resultKind = getMediaResultKind(tool);
  const routeRuntime = route.runtime
    ? { ...copyRecord(tool.runtime), ...copyRecord(route.runtime) }
    : copyRecord(tool.runtime);
  return {
    ...copyRecord(route),
    ...RESULT_CONTRACTS[resultKind],
    resultKind,
    runtime: routeRuntime
  };
}

export function buildMediaRuntimeConfig(providerKeys) {
  if (!isRecord(providerKeys)) {
    throw new TypeError('providerKeys must be an object.');
  }

  return {
    providers: configuredProviders(providerKeys),
    routes: Object.fromEntries(
      TOOL_CATALOG.map((tool) => [
        tool.id,
        tool.routes.map((route) => configuredRoute(tool, route))
      ])
    )
  };
}

export const createMediaRuntimeConfig = buildMediaRuntimeConfig;
