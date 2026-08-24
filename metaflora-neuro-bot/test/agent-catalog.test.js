import assert from 'node:assert/strict';
import test from 'node:test';

import {
  agentCategories,
  getAgentById,
  listAgentCategories,
  listAgents
} from '../src/agent-catalog.js';
import { getModelById, listCatalogModels } from '../src/model-catalog.js';

const requiredFields = Object.freeze([
  'id',
  'category',
  'name',
  'description',
  'tasks',
  'inputHint',
  'resultFormat',
  'primaryModel',
  'fallbackModels',
  'promptVersion',
  'systemPrompt',
  'customEmojiKey',
  'riskTier',
  'active'
]);

test('каталог содержит ровно 50 активных агентов в пяти непустых категориях', () => {
  const agents = listAgents();
  const categories = listAgentCategories();

  assert.equal(agents.length, 50);
  assert.equal(categories.length, 5);
  assert.deepEqual(categories, agentCategories);
  assert.ok(categories.every((category) => agents.some((agent) => agent.category === category.id)));
  assert.ok(agents.every((agent) => agent.active));
});

test('у каждого агента полный контракт, уникальный id и текст со строчной буквы', () => {
  const agents = listAgents();
  const ids = new Set();

  for (const agent of agents) {
    for (const field of requiredFields) {
      assert.ok(Object.hasOwn(agent, field), `${agent.id ?? 'unknown'}: отсутствует ${field}`);
    }

    assert.match(agent.id, /^[a-z][a-z0-9_]{2,63}$/);
    assert.equal(ids.has(agent.id), false, `повтор id: ${agent.id}`);
    ids.add(agent.id);

    for (const text of [agent.name, agent.description, agent.inputHint, agent.resultFormat]) {
      assert.equal(text[0], text[0].toLocaleLowerCase('ru-RU'), `${agent.id}: текст начинается не со строчной`);
    }
    assert.ok(agent.tasks.length >= 2);
    assert.ok(agent.tasks.every((task) => task[0] === task[0].toLocaleLowerCase('ru-RU')));
    assert.match(agent.customEmojiKey, /^[a-z][a-z0-9_]{2,63}$/);
    assert.match(agent.fallback, /\p{Extended_Pictographic}/u);
    assert.ok(['low', 'medium', 'high'].includes(agent.riskTier));
    assert.equal(agent.promptVersion, '1.0.0');
  }
});

test('все маршруты ссылаются на модели каталога и не используют sol', () => {
  const modelIds = new Set(listCatalogModels().map(({ id }) => id));

  for (const agent of listAgents()) {
    const routes = [agent.primaryModel, ...agent.fallbackModels];
    assert.ok(routes.every((modelId) => modelIds.has(modelId)));
    assert.ok(routes.every((modelId) => getModelById(modelId)));
    assert.ok(routes.every((modelId) => !modelId.includes('sol')), `${agent.id}: запрещён sol`);
    assert.equal(new Set(routes).size, routes.length, `${agent.id}: модель продублирована в маршруте`);
  }
});

test('lookup и фильтрация не раскрывают изменяемое состояние', () => {
  const all = listAgents();
  const first = all[0];

  assert.equal(getAgentById(first.id), first);
  assert.equal(getAgentById('missing_agent'), null);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.tasks));
  assert.ok(Object.isFrozen(first.fallbackModels));
  assert.ok(Object.isFrozen(agentCategories));
  assert.ok(Object.isFrozen(all));

  const filtered = listAgents({ category: first.category });
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((agent) => agent.category === first.category));
  assert.ok(Object.isFrozen(filtered));
  assert.deepEqual(listAgents(first.category), filtered);
  assert.deepEqual(listAgents({ category: 'missing' }), []);
});
