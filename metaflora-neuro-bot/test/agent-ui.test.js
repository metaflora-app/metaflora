import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAgentCard,
  buildAgentCatalogMenu,
  buildAgentCategoryMessage,
  buildAgentSelectedMessage
} from '../src/agent-ui.js';
import {
  getAgentById,
  listAgentCategories,
  listAgents
} from '../src/agent-catalog.js';
import {
  getAgentCardProfile,
  listAgentCardProfileIds
} from '../src/agent-card-copy.js';
import { calculateAgentRunPrice } from '../src/agent-economics.js';
import { setCustomEmojiIds } from '../src/brand-icons.js';
import { getModelById } from '../src/model-catalog.js';

function buttonsOf(message) {
  return message.reply_markup.inline_keyboard.flat();
}

function callbackBytes(button) {
  return button.callback_data
    ? Buffer.byteLength(button.callback_data, 'utf8')
    : 0;
}

function firstLetter(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/^[^\p{L}]+/u, '')
    .match(/\p{L}/u)?.[0] ?? '';
}

function assertLowercaseOpening(value, context) {
  const letter = firstLetter(value);
  assert.equal(letter, letter.toLocaleLowerCase('ru-RU'), context);
}

test.afterEach(() => setCustomEmojiIds({}));

test('корневой экран объясняет каталог, показывает пять категорий и общую навигацию', () => {
  const categories = listAgentCategories();
  const message = buildAgentCatalogMenu();
  const buttons = buttonsOf(message);

  assert.equal(categories.length, 5);
  assert.equal(listAgents().length, 50);
  assert.equal(message.parse_mode, 'HTML');
  assert.match(message.text, /<b>🤖 ИИ-агенты<\/b>/);
  assert.match(message.text, /50/);
  assert.ok(categories.every(({ id }) =>
    buttons.some(({ callback_data }) => callback_data === `agentcat:${id}`)));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'task:profile'));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'task:menu'));
  assert.match(message.text, /^<b>🤖 ИИ-/u, 'сокращение ИИ остаётся капсом');
});

test('экран категории подробно объясняет раздел, содержит его агентов и полную навигацию', () => {
  for (const category of listAgentCategories()) {
    const agents = listAgents({ category: category.id });
    const message = buildAgentCategoryMessage(category.id);
    const buttons = buttonsOf(message);

    assert.ok(agents.length > 0, category.id);
    assert.match(message.text, new RegExp(category.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.ok(message.text.length > category.name.length + 140, `${category.id}: нужно подробное описание`);
    assert.ok(agents.every(({ id }) =>
      buttons.some(({ callback_data }) => callback_data === `agent:${id}`)));
    assert.ok(buttons.some(({ callback_data }) => callback_data === 'agents:home'));
    assert.ok(buttons.some(({ callback_data }) => callback_data === 'task:profile'));
    assert.ok(buttons.some(({ callback_data }) => callback_data === 'task:menu'));
    assertLowercaseOpening(message.text, `${category.id}: текст начинается со строчной буквы`);
  }
});

test('карточка написана как карточка модели: польза, естественная подсказка, цена и навигация', () => {
  const descriptions = new Set();
  for (const agent of listAgents()) {
    const message = buildAgentCard(agent.id);
    const buttons = buttonsOf(message);
    const profile = getAgentCardProfile(agent.id);
    const modelNames = [agent.primaryModel, ...agent.fallbackModels]
      .flatMap((id) => [id, getModelById(id)?.name])
      .filter(Boolean);

    assert.equal(message.parse_mode, 'HTML', agent.id);
    assert.ok(profile, `${agent.id}: нет отдельного профиля карточки`);
    assert.match(message.text, new RegExp(agent.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.doesNotMatch(message.text, /<b>(подходит для|что прислать|что получишь):<\/b>/, agent.id);
    assert.doesNotMatch(message.text, /\bполучишь\b|назови модель|<b>модель:/i, agent.id);
    assert.ok(modelNames.every((name) => !message.text.toLocaleLowerCase('ru-RU')
      .includes(String(name).toLocaleLowerCase('ru-RU'))), `${agent.id}: раскрыт маршрут`);
    assert.ok(profile.highlights.every((highlight) =>
      message.text.includes(`<b>${highlight}</b>`)), `${agent.id}: потеряны смысловые выделения`);
    assert.match(message.text, /👇/, agent.id);
    assert.match(message.text, /<b>стоимость:/, agent.id);
    assert.match(message.text, new RegExp(`стоимость:[\\s\\S]* ${calculateAgentRunPrice(agent)} метакоин`), agent.id);
    assert.equal(buttons.some(({ callback_data }) => callback_data?.startsWith('useagent:')), false);
    assert.equal(buttons.some(({ text }) => /выбрать агента/i.test(text)), false);
    assert.ok(buttons.some(({ callback_data }) => callback_data === `agentcat:${agent.category}`));
    assert.ok(buttons.some(({ callback_data }) => callback_data === 'task:profile'));
    assert.ok(buttons.some(({ callback_data }) => callback_data === 'task:menu'));
    assert.deepEqual(message.reply_markup.inline_keyboard.slice(-2), [
      [{ text: '👤 профиль', callback_data: 'task:profile' }],
      [
        { text: '‹ назад к списку', callback_data: `agentcat:${agent.category}` },
        { text: '🏠 главное меню', callback_data: 'task:menu' }
      ]
    ]);
    descriptions.add(profile.description);
    assertLowercaseOpening(message.text, `${agent.id}: карточка начинается со строчной буквы`);
  }
  assert.equal(listAgentCardProfileIds().length, 50);
  assert.equal(descriptions.size, 50);
});

test('повторная подсказка агента возвращает ту же карточку без промежуточного экрана выбора', () => {
  const agent = listAgents()[0];
  const message = buildAgentSelectedMessage(agent.id);

  assert.deepEqual(message, buildAgentCard(agent.id));
  assert.equal(buttonsOf(message).some(({ callback_data }) => callback_data?.startsWith('useagent:')), false);
  assertLowercaseOpening(message.text, 'подтверждение начинается со строчной буквы');
});

test('неизвестные идентификаторы безопасно возвращают пользователя в каталог', () => {
  assert.deepEqual(buildAgentCategoryMessage('missing'), buildAgentCatalogMenu());
  assert.deepEqual(buildAgentCard('missing'), buildAgentCatalogMenu());
  assert.deepEqual(buildAgentSelectedMessage('missing'), buildAgentCatalogMenu());
  assert.equal(getAgentById('missing'), null);
});

test('все callback_data укладываются в лимит telegram', () => {
  const messages = [
    buildAgentCatalogMenu(),
    ...listAgentCategories().map(({ id }) => buildAgentCategoryMessage(id)),
    ...listAgents().flatMap(({ id }) => [
      buildAgentCard(id),
      buildAgentSelectedMessage(id)
    ])
  ];

  for (const button of messages.flatMap(buttonsOf)) {
    assert.ok(callbackBytes(button) <= 64, button.callback_data);
  }
});

test('кнопки агентов получают custom emoji и сохраняют fallback без настройки', () => {
  const agent = listAgents()[0];

  setCustomEmojiIds({ [agent.customEmojiKey]: 'agent-emoji-id' });
  const configured = buildAgentCategoryMessage(agent.category).reply_markup.inline_keyboard
    .flat()
    .find(({ callback_data }) => callback_data === `agent:${agent.id}`);
  assert.equal(configured.icon_custom_emoji_id, 'agent-emoji-id');
  assert.equal(firstLetter(configured.text), firstLetter(agent.name));

  setCustomEmojiIds({});
  const fallback = buildAgentCategoryMessage(agent.category).reply_markup.inline_keyboard
    .flat()
    .find(({ callback_data }) => callback_data === `agent:${agent.id}`);
  assert.equal(fallback.icon_custom_emoji_id, undefined);
  assert.match(fallback.text, /^\S+\s+\p{L}/u);
});
