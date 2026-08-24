import { getToolById } from './tool-catalog.js';

const INPUT_METADATA_KEYS = new Set(['durationSeconds']);
const TEXT_INPUT_KEYS = new Set(['text', 'reference_text']);
const ARRAY_INPUT_KEYS = new Set(['points', 'boxes']);
const MEDIA_TYPES = Object.freeze({
  image: new Set(['image']),
  images: new Set(['image']),
  person_image: new Set(['image']),
  garment_image: new Set(['image']),
  reference_images: new Set(['image']),
  masks: new Set(['image']),
  video: new Set(['video']),
  audio: new Set(['audio']),
  reference_audio: new Set(['audio']),
  media: new Set(['audio', 'video'])
});

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toolRecord(toolOrId) {
  const tool = typeof toolOrId === 'string' ? getToolById(toolOrId) : toolOrId;
  if (
    !isRecord(tool)
    || !isRecord(tool.input)
    || !isRecord(tool.settings)
    || !isRecord(tool.runtime)
  ) {
    throw new TypeError('Unknown tool.');
  }
  return tool;
}

function assertRecord(value, label) {
  if (!isRecord(value)) throw new TypeError(`${label} must be an object.`);
}

function inputKeys(tool) {
  return [...tool.input.required, ...tool.input.optional];
}

function copyValue(value) {
  if (Array.isArray(value)) return value.map(copyValue);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, copyValue(nested)])
    );
  }
  return value;
}

function hasValue(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0 && value.every(hasValue);
  if (isRecord(value) && 'value' in value) return hasValue(value.value);
  return value !== undefined && value !== null;
}

function telegramFileId(value) {
  return isRecord(value) && typeof value.file_id === 'string' && value.file_id.length > 0
    ? value.file_id
    : null;
}

function documentType(document) {
  const mimeType = String(document?.mime_type ?? '').toLowerCase();
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return null;
}

function isDirectInput(key, value) {
  if (!hasValue(value)) return false;
  if (!MEDIA_TYPES[key]) return true;
  if (key === 'media') {
    return isRecord(value)
      && MEDIA_TYPES.media.has(value.type)
      && hasValue(value.value);
  }
  if (Array.isArray(value)) {
    return value.every((entry) => !telegramFileId(entry));
  }
  return !telegramFileId(value);
}

function collectTelegram(messages) {
  const collected = {
    text: [],
    image: [],
    video: [],
    audio: [],
    durationSeconds: []
  };

  for (const message of messages) {
    if (!isRecord(message)) continue;
    const prompt = typeof message.text === 'string' ? message.text : message.caption;
    if (typeof prompt === 'string' && prompt.trim()) collected.text.push(prompt.trim());

    const photo = Array.isArray(message.photo) ? message.photo.at(-1) : null;
    const photoId = telegramFileId(photo);
    if (photoId) collected.image.push(photoId);

    const video = message.video ?? message.animation ?? message.video_note;
    const videoId = telegramFileId(video);
    if (videoId) {
      collected.video.push(videoId);
      if (Number.isFinite(video.duration)) collected.durationSeconds.push(video.duration);
    }

    const audio = message.audio ?? message.voice;
    const audioId = telegramFileId(audio);
    if (audioId) {
      collected.audio.push(audioId);
      if (Number.isFinite(audio.duration)) collected.durationSeconds.push(audio.duration);
    }

    const documentId = telegramFileId(message.document);
    const type = documentType(message.document);
    if (documentId && type) collected[type].push(documentId);
  }
  return collected;
}

function singularType(key) {
  const types = MEDIA_TYPES[key];
  return types?.size === 1 ? [...types][0] : null;
}

function assignCollectedInputs(tool, normalized, collected) {
  const remaining = {
    text: [...collected.text],
    image: [...collected.image],
    video: [...collected.video],
    audio: [...collected.audio]
  };

  for (const key of inputKeys(tool)) {
    if (hasValue(normalized[key])) continue;

    if (key === 'media') {
      const availableType = ['audio', 'video'].find((type) => remaining[type].length > 0);
      if (availableType) {
        normalized.media = { type: availableType, value: remaining[availableType].shift() };
      }
      continue;
    }

    if (key === 'text' || key === 'keyterms' || key === 'reference_text') {
      if (remaining.text.length > 0) normalized[key] = remaining.text.shift();
      continue;
    }

    const type = singularType(key);
    if (!type || remaining[type].length === 0) continue;
    if (key.endsWith('s')) {
      normalized[key] = remaining[type].splice(0);
    } else {
      normalized[key] = remaining[type].shift();
    }
  }
}

export function normalizeTelegramInputs(toolOrId, telegramInput) {
  const tool = toolRecord(toolOrId);
  const messages = Array.isArray(telegramInput) ? telegramInput : [telegramInput];
  if (messages.some((message) => !isRecord(message))) {
    throw new TypeError('Telegram input must be a message object or an array of message objects.');
  }

  const normalized = {};
  for (const key of inputKeys(tool)) {
    for (const message of messages) {
      if (Object.hasOwn(message, key) && isDirectInput(key, message[key])) {
        normalized[key] = copyValue(message[key]);
        break;
      }
    }
  }

  const collected = collectTelegram(messages);
  assignCollectedInputs(tool, normalized, collected);
  if (collected.durationSeconds.length > 0) {
    normalized.durationSeconds = Math.max(...collected.durationSeconds);
  }
  return normalized;
}

function validateDuration(inputs, constraint) {
  const value = inputs.durationSeconds;
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError('Input "durationSeconds" must be a non-negative number.');
  }
  if (constraint?.max !== undefined && value > constraint.max) {
    throw new RangeError(`Input "durationSeconds" must not exceed ${constraint.max}.`);
  }
  if (constraint?.min !== undefined && value < constraint.min) {
    throw new RangeError(`Input "durationSeconds" must be at least ${constraint.min}.`);
  }
}

function validateInputShape(key, value) {
  if (key === 'media') return;
  if (MEDIA_TYPES[key]) {
    if (key.endsWith('s')) {
      if (
        !Array.isArray(value)
        || value.some((entry) => typeof entry !== 'string' || entry.trim().length === 0)
      ) {
        throw new TypeError(`Input "${key}" must be an array of non-empty strings.`);
      }
      return;
    }
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new TypeError(`Input "${key}" must be a non-empty string.`);
    }
    return;
  }
  if (TEXT_INPUT_KEYS.has(key) && typeof value !== 'string') {
    throw new TypeError(`Input "${key}" must be a string.`);
  }
  if (
    key === 'keyterms'
    && typeof value !== 'string'
    && (
      !Array.isArray(value)
      || value.some((entry) => typeof entry !== 'string' || entry.trim().length === 0)
    )
  ) {
    throw new TypeError('Input "keyterms" must be a string or an array of non-empty strings.');
  }
  if (ARRAY_INPUT_KEYS.has(key) && !Array.isArray(value)) {
    throw new TypeError(`Input "${key}" must be an array.`);
  }
}

function validateInputConstraint(key, value, constraint) {
  if (!isRecord(constraint)) return;
  if (constraint.min !== undefined) {
    const size = Array.isArray(value) ? value.length : 1;
    if (size < constraint.min) {
      throw new RangeError(`Input "${key}" must contain at least ${constraint.min} value(s).`);
    }
  }
  if (constraint.max !== undefined) {
    const size = Array.isArray(value) ? value.length : 1;
    if (size > constraint.max) {
      throw new RangeError(`Input "${key}" must contain at most ${constraint.max} value(s).`);
    }
  }
  if (constraint.types) {
    const type = isRecord(value) ? value.type : undefined;
    if (!constraint.types.includes(type)) {
      throw new TypeError(
        `Input "${key}" must use one of these media types: ${constraint.types.join(', ')}.`
      );
    }
    if (
      !Object.hasOwn(value, 'value')
      || typeof value.value !== 'string'
      || value.value.trim().length === 0
    ) {
      throw new TypeError(`Input "${key}" must contain a non-empty string media value.`);
    }
  }
  if (
    constraint.exactlyOne
    && (
      Array.isArray(value)
      || (isRecord(value) && Array.isArray(value.value))
    )
  ) {
    throw new RangeError(`Input "${key}" must contain exactly one non-array value.`);
  }
}

export function validateToolInputs(toolOrId, inputs) {
  const tool = toolRecord(toolOrId);
  assertRecord(inputs, 'Tool inputs');
  const allowed = new Set([...inputKeys(tool), ...INPUT_METADATA_KEYS]);

  for (const key of Object.keys(inputs)) {
    if (!allowed.has(key)) throw new TypeError(`Unknown input "${key}".`);
  }

  const constraints = tool.input.constraints ?? {};
  validateDuration(inputs, constraints.durationSeconds);
  for (const key of inputKeys(tool)) {
    if (Object.hasOwn(inputs, key)) validateInputShape(key, inputs[key]);
  }
  for (const [key, constraint] of Object.entries(constraints)) {
    if (key === 'durationSeconds' || !Object.hasOwn(inputs, key)) continue;
    validateInputConstraint(key, inputs[key], constraint);
  }

  for (const key of tool.input.required) {
    if (!hasValue(inputs[key])) throw new TypeError(`Required input "${key}" is missing.`);
  }
  for (const key of inputKeys(tool)) {
    if (Object.hasOwn(inputs, key) && !hasValue(inputs[key])) {
      throw new TypeError(`Input "${key}" must not be empty.`);
    }
  }
  return Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, copyValue(value)]));
}

function validateNumberSetting(key, value, definition) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Setting "${key}" must be a finite number.`);
  }
  if (value < definition.min || value > definition.max) {
    throw new RangeError(`Setting "${key}" must be between ${definition.min} and ${definition.max}.`);
  }
  const quotient = (value - definition.min) / definition.step;
  if (Math.abs(quotient - Math.round(quotient)) > 1e-8) {
    throw new RangeError(`Setting "${key}" must align to step ${definition.step}.`);
  }
}

function validateSetting(key, value, definition) {
  if (definition.type === 'boolean' && typeof value !== 'boolean') {
    throw new TypeError(`Setting "${key}" must be boolean.`);
  }
  if (definition.type === 'string' && typeof value !== 'string') {
    throw new TypeError(`Setting "${key}" must be a string.`);
  }
  if (definition.type === 'enum' && !definition.values.includes(value)) {
    throw new TypeError(`Setting "${key}" must be an allowed value.`);
  }
  if (definition.type === 'number') validateNumberSetting(key, value, definition);
}

export function validateToolSettings(toolOrId, settings = {}) {
  const tool = toolRecord(toolOrId);
  assertRecord(settings, 'Tool settings');

  for (const key of Object.keys(settings)) {
    if (!Object.hasOwn(tool.settings, key)) throw new TypeError(`Unknown setting "${key}".`);
  }

  const normalized = {};
  for (const [key, definition] of Object.entries(tool.settings)) {
    const value = Object.hasOwn(settings, key) ? settings[key] : definition.default;
    validateSetting(key, value, definition);
    normalized[key] = value;
  }
  return normalized;
}

export function buildToolProviderPayload(toolOrId, inputs, settings = {}) {
  const tool = toolRecord(toolOrId);
  const validInputs = validateToolInputs(tool, inputs);
  const validSettings = validateToolSettings(tool, settings);
  const payload = {};

  for (const [key, target] of Object.entries(tool.runtime.inputMap)) {
    if (!Object.hasOwn(validInputs, key)) continue;
    if (typeof target === 'string') {
      payload[target] = copyValue(validInputs[key]);
      continue;
    }
    const media = validInputs[key];
    const dynamicTarget = target[media.type];
    if (typeof dynamicTarget !== 'string') {
      throw new TypeError(`Input "${key}" has no provider mapping for type "${media.type}".`);
    }
    payload[dynamicTarget] = copyValue(media.value);
  }
  for (const [key, value] of Object.entries(validSettings)) payload[key] = value;
  return payload;
}

export function extractToolOutput(toolOrId, providerOutput) {
  const tool = toolRecord(toolOrId);
  const path = tool.runtime.outputPath;
  let value = providerOutput;

  for (const segment of path.split('.')) {
    if (
      (isRecord(value) || Array.isArray(value))
      && segment !== '__proto__'
      && segment !== 'prototype'
      && segment !== 'constructor'
      && Object.hasOwn(value, segment)
    ) {
      value = value[segment];
    } else {
      throw new Error(`Provider output does not contain output path "${path}".`);
    }
  }
  if (value === undefined || value === null) {
    throw new Error(`Provider output does not contain output path "${path}".`);
  }
  return value;
}

export const buildProviderPayload = buildToolProviderPayload;
export const extractProviderOutput = extractToolOutput;
