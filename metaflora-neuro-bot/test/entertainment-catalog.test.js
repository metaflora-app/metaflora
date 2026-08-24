import assert from 'node:assert/strict';
import test from 'node:test';

import { listAgents } from '../src/agent-catalog.js';
import {
  ENTERTAINMENT_CATALOG,
  buildEntertainmentCard,
  buildEntertainmentMenu,
  getEntertainmentById,
  entertainmentAgentFor
} from '../src/entertainment-catalog.js';
import { calculateAgentRunPrice } from '../src/agent-economics.js';
import { getAgentById } from '../src/agent-catalog.js';

const callbacks = (message) => message.reply_markup.inline_keyboard.flat();

test('entertainment catalog contains exactly 15 isolated scenarios', () => {
  assert.equal(ENTERTAINMENT_CATALOG.length, 15);
  assert.equal(new Set(ENTERTAINMENT_CATALOG.map(({ id }) => id)).size, 15);
  assert.equal(new Set(ENTERTAINMENT_CATALOG.map(({ name }) => name)).size, 15);
  assert.equal(listAgents().length, 50);
  for (const item of ENTERTAINMENT_CATALOG) {
    assert.match(item.id, /^ent_[a-z0-9_]{1,28}$/u);
    assert.equal(item.name, item.name.toLocaleLowerCase('ru-RU'));
    assert.ok(item.description.length >= 90, item.id);
    assert.ok(item.inputHint.length >= 25, item.id);
    assert.ok(getAgentById(item.targetAgentId), item.targetAgentId);
    assert.equal(getEntertainmentById(item.id), item);
  }
});

test('entertainment runtime wrapper carries scenario behavior and visual routing', () => {
  const calories = getEntertainmentById('ent_calorie_estimator');
  const wrapped = entertainmentAgentFor(calories);
  assert.match(wrapped.systemPrompt, /примерн/iu);
  assert.ok([wrapped.primaryModel, ...wrapped.fallbackModels].includes('qwen_3_vl'));
  assert.equal(wrapped.id, 'ent_calorie_estimator');
});

test('required safe entertainment journeys are present', () => {
  const ids = new Set(ENTERTAINMENT_CATALOG.map(({ id }) => id));
  for (const id of ['ent_congratulator', 'ent_calorie_estimator', 'ent_trainer', 'ent_lila', 'ent_language_tutor', 'ent_meme_sticker']) {
    assert.ok(ids.has(id), id);
  }
  const calories = getEntertainmentById('ent_calorie_estimator');
  assert.match(calories.description, /калори|БЖУ/iu);
  assert.equal('safety' in calories, false);
  assert.equal('safety' in getEntertainmentById('ent_lila'), false);
});

test('entertainment menu and cards use safe callbacks and real agent economics', () => {
  const menu = buildEntertainmentMenu();
  assert.equal(menu.menuMediaKey, 'entertainment');
  assert.match(menu.text, /^<b>🎰 развлечения<\/b>/u);
  assert.match(menu.text, /<b>что попробовать<\/b>/u);
  assert.match(menu.text, /<blockquote>\*звёздами отмечены самые популярные развлечения на данный момент<\/blockquote>/u);
  assert.doesNotMatch(menu.text, /15 лёгких сценариев/iu);
  assert.equal(callbacks(menu).filter(({ callback_data = '' }) => callback_data.startsWith('ent:card:')).length, 15);
  for (const id of ['ent_lila', 'ent_congratulator', 'ent_language_tutor', 'ent_meme_sticker']) {
    const button = callbacks(menu).find(({ callback_data }) => callback_data === `ent:card:${id}`);
    assert.match(button.text, /★/u, id);
  }
  for (const item of ENTERTAINMENT_CATALOG) {
    const card = buildEntertainmentCard(item);
    const agent = entertainmentAgentFor(item);
    assert.match(card.text, new RegExp(`${calculateAgentRunPrice(agent)} метакоин`));
    assert.doesNotMatch(card.text, /<b>важно:<\/b>|ограничени|не является медицин|не предсказание|не терапия/iu, item.id);
    const isPriorityInteractive = ['ent_congratulator', 'ent_calorie_estimator', 'ent_trainer', 'ent_lila', 'ent_language_tutor', 'ent_meme_sticker', 'ent_quiz'].includes(item.id);
    assert.equal(
      callbacks(card).some(({ callback_data }) => callback_data === `ent:use:${item.id}`),
      !isPriorityInteractive
    );
    assert.ok(callbacks(card).some(({ callback_data }) => callback_data === 'task:profile'));
    assert.ok(callbacks(card).some(({ callback_data }) => callback_data === 'ent:home'));
    assert.ok(callbacks(card).some(({ callback_data }) => callback_data === 'task:menu'));
    for (const { callback_data = '' } of callbacks(card)) assert.ok(Buffer.byteLength(callback_data) <= 64);
  }
});

test('priority cards have their own concise copy instead of a generic start template', () => {
  const expected = new Map([
    ['ent_congratulator', /для кого/iu],
    ['ent_calorie_estimator', /пришли фото блюда/iu],
    ['ent_trainer', /режим тренера/iu],
    ['ent_lila', /72 клет/iu],
    ['ent_language_tutor', /выбери язык/iu],
    ['ent_meme_sticker', /заготовк/iu]
  ]);
  const texts = [];
  for (const [id, pattern] of expected) {
    const card = buildEntertainmentCard(id);
    assert.match(card.text, pattern, id);
    texts.push(card.text);
  }
  assert.equal(new Set(texts).size, texts.length);
});

test('priority entertainment cards expose the working first step directly', () => {
  const expectations = new Map([
    ['ent_congratulator', ['entcongrats:birthday', 'entcongrats:wedding', 'entcongrats:custom']],
    ['ent_calorie_estimator', ['ent:home']],
    ['ent_trainer', ['entflow:trainer:goal:lose', 'entflow:trainer:goal:strength']],
    ['ent_lila', ['entflow:lila:enter']],
    ['ent_language_tutor', ['entflow:language:choose:en', 'entflow:language:progress']],
    ['ent_meme_sticker', ['entmeme:text', 'entmeme:photo_text']]
  ]);
  for (const [id, callbacksExpected] of expectations) {
    const cardButtons = callbacks(buildEntertainmentCard(id)).map(({ callback_data }) => callback_data);
    assert.equal(cardButtons.includes(`ent:use:${id}`), false, id);
    for (const callback of callbacksExpected) assert.ok(cardButtons.includes(callback), `${id} -> ${callback}`);
  }
});

test('every entertainment scenario resolves to an executable model route', () => {
  for (const item of ENTERTAINMENT_CATALOG) {
    const agent = entertainmentAgentFor(item);
    assert.ok(agent?.primaryModel, item.id);
    assert.ok(agent.systemPrompt.length >= 120, item.id);
    assert.doesNotMatch(agent.systemPrompt, /undefined|null/u, item.id);
  }
});
