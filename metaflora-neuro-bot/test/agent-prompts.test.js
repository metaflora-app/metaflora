import assert from 'node:assert/strict';
import test from 'node:test';

import {
  agentPromptIds,
  agentPrompts,
  getAgentPrompt
} from '../src/agent-prompts.js';
import { listAgents } from '../src/agent-catalog.js';

const forbiddenFragments = Object.freeze([
  '[вставьте',
  '[имя]',
  'дд.мм.гггг',
  'это не просто',
  'раскрой потенциал',
  'погрузись в',
  'бесшовн',
  'революционн',
  'уникальн'
]);

test('у всех 50 агентов есть отдельный непустой системный промпт', () => {
  const agents = listAgents();

  assert.equal(agentPromptIds.length, 50);
  assert.equal(Object.keys(agentPrompts).length, 50);
  assert.equal(new Set(agents.map(({ systemPrompt }) => systemPrompt)).size, 50);

  for (const agent of agents) {
    assert.equal(getAgentPrompt(agent.id), agent.systemPrompt);
    assert.ok(agent.systemPrompt.length >= 300, `${agent.id}: промпт слишком общий`);
    assert.equal(agent.systemPrompt[0], agent.systemPrompt[0].toLocaleLowerCase('ru-RU'));
  }
  assert.equal(getAgentPrompt('missing_agent'), null);
});

test('промпты задают способ работы, формат и проверку результата', () => {
  for (const [id, prompt] of Object.entries(agentPrompts)) {
    assert.match(prompt, /порядок работы:/, `${id}: нет порядка работы`);
    assert.match(prompt, /формат ответа:/, `${id}: нет формата`);
    assert.match(prompt, /проверка перед отправкой:/, `${id}: нет проверки`);
    assert.doesNotMatch(prompt, /—/u, `${id}: длинное тире`);
    assert.doesNotMatch(prompt, /\[[^\]]+\]/u, `${id}: плейсхолдер`);
    for (const fragment of forbiddenFragments) {
      assert.equal(prompt.toLocaleLowerCase('ru-RU').includes(fragment), false, `${id}: ${fragment}`);
    }
  }
});

test('реестр промптов и списки идентификаторов неизменяемы', () => {
  assert.ok(Object.isFrozen(agentPrompts));
  assert.ok(Object.isFrozen(agentPromptIds));
});
