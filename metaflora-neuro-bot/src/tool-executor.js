import { createFalClient } from '@fal-ai/client';

import { buildMediaRuntimeConfig } from './media-runtime-config.js';
import { invokeMediaTool } from './media-router.js';
import { getToolById } from './tool-catalog.js';
import {
  buildToolProviderPayload,
  normalizeTelegramInputs,
  validateToolInputs
} from './tool-runtime.js';

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{1,512}$/u;
const MEDIA_RULES = Object.freeze({
  image: Object.freeze({
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: Object.freeze(['image/jpeg', 'image/png', 'image/webp'])
  }),
  video: Object.freeze({
    maxBytes: 50 * 1024 * 1024,
    mimeTypes: Object.freeze(['video/mp4', 'video/quicktime', 'video/webm'])
  }),
  audio: Object.freeze({
    maxBytes: 50 * 1024 * 1024,
    mimeTypes: Object.freeze([
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
      'audio/x-wav'
    ])
  })
});
const INPUT_MEDIA_KIND = Object.freeze({
  image: 'image',
  images: 'image',
  person_image: 'image',
  garment_image: 'image',
  reference_images: 'image',
  masks: 'image',
  video: 'video',
  audio: 'audio',
  reference_audio: 'audio'
});

export function falUploader(apiKey) {
  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    throw new Error('FAL_KEY is required for media uploads.');
  }
  const client = createFalClient({ credentials: apiKey });
  return (blob) => client.storage.upload(blob, {
    lifecycle: { expiresIn: '1d' }
  });
}

function isTelegramFileId(value) {
  return typeof value === 'string'
    && FILE_ID_PATTERN.test(value)
    && !value.startsWith('http');
}

async function uploadTelegramFile(telegram, fileId, kind, upload) {
  const rule = MEDIA_RULES[kind];
  const file = await telegram.getFile(fileId, { maxBytes: rule.maxBytes });
  const downloaded = await telegram.downloadFile(file, {
    allowedMimeTypes: rule.mimeTypes,
    maxBytes: rule.maxBytes
  });
  const blob = new Blob([downloaded.data], { type: downloaded.mimeType });
  return upload(blob, {
    fileName: downloaded.fileName,
    mimeType: downloaded.mimeType
  });
}

async function resolveValue(telegram, value, kind, upload) {
  if (Array.isArray(value)) {
    return Promise.all(value.map((entry) => resolveValue(telegram, entry, kind, upload)));
  }
  if (!isTelegramFileId(value)) return value;
  return uploadTelegramFile(telegram, value, kind, upload);
}

export async function resolveMediaInputs(telegram, inputs, upload) {
  const entries = await Promise.all(Object.entries(inputs).map(async ([key, value]) => {
    if (key === 'media' && value?.type && value?.value) {
      return [key, {
        ...value,
        value: await resolveValue(telegram, value.value, value.type, upload)
      }];
    }
    const kind = INPUT_MEDIA_KIND[key];
    return [key, kind ? await resolveValue(telegram, value, kind, upload) : value];
  }));
  return Object.fromEntries(entries);
}

function configForToolInputs(config, toolId, inputs) {
  const routes = config.routes?.[toolId];
  if (!Array.isArray(routes)) return config;

  const filteredRoutes = routes.filter((route) => {
    const inputMediaTypes = route.runtime?.inputMediaTypes;
    if (inputMediaTypes === undefined) return true;
    if (!Array.isArray(inputMediaTypes) || inputMediaTypes.length === 0) return false;
    return inputMediaTypes.includes(inputs.media?.type);
  });
  if (filteredRoutes.length === routes.length) return config;
  return {
    ...config,
    routes: {
      ...config.routes,
      [toolId]: filteredRoutes
    }
  };
}

function fallbackStatusForInputs(toolId, inputs) {
  const fallbackStatus = getToolById(toolId)?.fallbackStatus;
  if (!fallbackStatus) return undefined;
  if (
    fallbackStatus.status === 'compatible'
    && Array.isArray(fallbackStatus.inputMediaTypes)
    && !fallbackStatus.inputMediaTypes.includes(inputs.media?.type)
  ) {
    return {
      ...fallbackStatus,
      status: 'incompatible',
      reason: 'The configured fallback is compatible only with the documented audio input shape.'
    };
  }
  return fallbackStatus;
}

export function toolUsageFromInputs(inputs) {
  const characters = ['text', 'reference_text', 'keyterms']
    .map((key) => inputs[key])
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value) => typeof value === 'string')
    .reduce((total, value) => total + value.length, 0);
  const images = Object.entries(INPUT_MEDIA_KIND)
    .filter(([, kind]) => kind === 'image')
    .map(([key]) => inputs[key])
    .reduce((total, value) => total + (Array.isArray(value) ? value.length : value ? 1 : 0), 0);
  return {
    characters,
    images,
    durationSeconds: Number(inputs.durationSeconds ?? 0)
  };
}

export function createToolExecutor({
  telegram,
  providerKeys,
  upload = null,
  invoke = invokeMediaTool,
  fetchImpl = fetch,
  onAttempt = async () => {}
}) {
  const config = buildMediaRuntimeConfig(providerKeys);
  let resolvedUpload = upload;

  return async function executeTool({ toolId, telegramInput, settings = {}, auditContext = null }) {
    const normalized = normalizeTelegramInputs(toolId, telegramInput);
    validateToolInputs(toolId, normalized);
    const uploadFile = async (...args) => {
      resolvedUpload ??= falUploader(providerKeys.fal);
      return resolvedUpload(...args);
    };
    const inputs = await resolveMediaInputs(telegram, normalized, uploadFile);
    const payload = buildToolProviderPayload(toolId, inputs, settings);
    const requestConfig = {
      ...configForToolInputs(config, toolId, inputs),
      fallbackStatus: fallbackStatusForInputs(toolId, inputs)
    };
    const scopedFetch = auditContext && typeof fetchImpl.withAuditContext === 'function'
      ? fetchImpl.withAuditContext(auditContext)
      : fetchImpl;
    return invoke(
      { routeId: toolId, input: payload },
      { config: requestConfig, fetchImpl: scopedFetch, onAttempt }
    );
  };
}
