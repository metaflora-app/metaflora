import { brandForModel, buildModelButton } from './brand-icons.js';
import { getModelById } from './model-catalog.js';

const DIAMOND_PLACEHOLDER = /[◆◇◈◊⬥⬦♦▫�]/u;
const LOWERCASE_START = /^\p{Ll}/u;
const EMOJI = /\p{Extended_Pictographic}/u;
const EMOJI_KEY = /^[a-z][a-z0-9_]{2,63}$/;
const TEXT_FIELDS = Object.freeze([
  'name',
  'description',
  'inputHint',
  'resultFormat'
]);

function assertLowercaseText(value, field) {
  if (typeof value !== 'string' || !LOWERCASE_START.test(value)) {
    throw new TypeError(`${field} должен начинаться со строчной буквы`);
  }
}

function assertNoDiamond(value, field) {
  if (DIAMOND_PLACEHOLDER.test(value)) {
    throw new TypeError(`${field} содержит ромбовый плейсхолдер`);
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function primaryModelFor(agent) {
  const model = getModelById(agent.primaryModel);
  if (!model) {
    throw new RangeError(`неизвестная основная модель агента: ${agent.primaryModel}`);
  }
  return model;
}

function customEmojiIdFor(agent) {
  return buildModelButton(primaryModelFor(agent)).icon_custom_emoji_id;
}

export function validateAgentVisuals(agent) {
  if (!agent || typeof agent !== 'object' || Array.isArray(agent)) {
    throw new TypeError('agent должен быть объектом');
  }
  if (typeof agent.id !== 'string' || !EMOJI_KEY.test(agent.id)) {
    throw new TypeError('id агента имеет неверный формат');
  }
  if (typeof agent.customEmojiKey !== 'string' || !EMOJI_KEY.test(agent.customEmojiKey)) {
    throw new TypeError('customEmojiKey агента имеет неверный формат');
  }

  for (const field of TEXT_FIELDS) {
    assertLowercaseText(agent[field], field);
    assertNoDiamond(agent[field], field);
  }
  if (!Array.isArray(agent.tasks) || agent.tasks.length === 0) {
    throw new TypeError('tasks должен быть непустым массивом');
  }
  for (const [index, task] of agent.tasks.entries()) {
    assertLowercaseText(task, `tasks[${index}]`);
    assertNoDiamond(task, `tasks[${index}]`);
  }
  if (typeof agent.fallback !== 'string' || !EMOJI.test(agent.fallback)) {
    throw new TypeError('fallback должен содержать emoji');
  }
  assertNoDiamond(agent.fallback, 'fallback');
  const primaryModel = primaryModelFor(agent);
  if (agent.customEmojiKey !== brandForModel(primaryModel)) {
    throw new TypeError('customEmojiKey должен соответствовать бренду основной модели');
  }
  return true;
}

export function buildAgentButton(agent, properties = {}) {
  validateAgentVisuals(agent);
  const customEmojiId = customEmojiIdFor(agent);
  const {
    text: _text,
    callback_data: _callbackData,
    icon_custom_emoji_id: _iconCustomEmojiId,
    ...safeProperties
  } = properties;

  return {
    text: customEmojiId ? agent.name : `${agent.fallback} ${agent.name}`,
    ...safeProperties,
    callback_data: `agent:${agent.id}`,
    ...(customEmojiId ? { icon_custom_emoji_id: customEmojiId } : {})
  };
}

export function agentLogoHtml(agent) {
  validateAgentVisuals(agent);
  const customEmojiId = customEmojiIdFor(agent);
  const fallback = escapeHtml(agent.fallback);
  return customEmojiId
    ? `<tg-emoji emoji-id="${escapeHtml(customEmojiId)}">${fallback}</tg-emoji>`
    : fallback;
}
