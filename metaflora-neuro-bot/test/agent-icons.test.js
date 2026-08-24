import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  agentLogoHtml,
  buildAgentButton,
  validateAgentVisuals
} from '../src/agent-icons.js';
import { listAgents } from '../src/agent-catalog.js';
import { setCustomEmojiIds } from '../src/brand-icons.js';
import {
  buildAgentIconManifest,
  generateAgentIconManifest
} from '../scripts/generate-agent-icons.js';

const agent = Object.freeze({
  id: 'legal_advisor',
  name: 'ии-юрист',
  description: 'проверяет документы и объясняет риски простым языком',
  tasks: Object.freeze(['разобрать договор', 'подготовить список правок']),
  inputHint: 'пришлите документ и опишите ситуацию',
  resultFormat: 'заключение с рисками и следующими шагами',
  primaryModel: 'gpt_56_terra',
  customEmojiKey: 'openai',
  fallback: '⚖️'
});

test.afterEach(() => {
  setCustomEmojiIds({});
});

test('кнопка агента использует custom emoji бренда основной модели', () => {
  setCustomEmojiIds({ openai: 'openai-custom-id' });

  assert.deepEqual(buildAgentButton(agent, {
    callback_data: 'agent:legal_advisor',
    style: 'primary'
  }), {
    text: 'ии-юрист',
    callback_data: 'agent:legal_advisor',
    style: 'primary',
    icon_custom_emoji_id: 'openai-custom-id'
  });
});

test('служебные свойства не могут подменить текст, маршрут или emoji агента', () => {
  setCustomEmojiIds({ openai: 'openai-custom-id' });

  assert.deepEqual(buildAgentButton(agent, {
    text: 'подмена',
    callback_data: 'agent:other',
    icon_custom_emoji_id: 'other-id',
    style: 'primary'
  }), {
    text: 'ии-юрист',
    callback_data: 'agent:legal_advisor',
    style: 'primary',
    icon_custom_emoji_id: 'openai-custom-id'
  });
});

test('без Telegram custom emoji кнопка показывает собственный fallback агента', () => {
  assert.deepEqual(buildAgentButton(agent), {
    text: '⚖️ ии-юрист',
    callback_data: 'agent:legal_advisor'
  });
  assert.equal(agentLogoHtml(agent), '⚖️');
});

test('логотип агента использует тот же custom emoji и смысловой fallback в HTML', () => {
  setCustomEmojiIds({ openai: 'openai-custom-id' });

  assert.equal(
    agentLogoHtml(agent),
    '<tg-emoji emoji-id="openai-custom-id">⚖️</tg-emoji>'
  );
});

test('customEmojiKey обязателен, а исходные объекты не мутируются', () => {
  const properties = Object.freeze({ callback_data: 'agent:legal_advisor' });
  const before = structuredClone(agent);

  buildAgentButton(agent, properties);

  assert.deepEqual(agent, before);
  assert.throws(
    () => validateAgentVisuals({ ...agent, customEmojiKey: '' }),
    /customEmojiKey/
  );
  assert.throws(
    () => validateAgentVisuals({ ...agent, customEmojiKey: 'google' }),
    /бренду основной модели/
  );
});

test('визуальные тексты начинаются со строчной буквы', () => {
  for (const [field, value] of [
    ['name', 'Ии-юрист'],
    ['description', 'Проверяет документы'],
    ['inputHint', 'Пришлите договор'],
    ['resultFormat', 'Заключение'],
    ['tasks', ['разобрать договор', 'Подготовить правки']]
  ]) {
    assert.throws(
      () => validateAgentVisuals({ ...agent, [field]: value }),
      /строчной буквы/
    );
  }
});

test('ромбовые плейсхолдеры запрещены во всех визуальных текстах', () => {
  for (const [field, value] of [
    ['name', 'ии-юрист ◆'],
    ['description', 'проверяет ◇ документы'],
    ['inputHint', 'пришлите ♦ договор'],
    ['resultFormat', 'заключение ◊'],
    ['tasks', ['разобрать договор', 'подготовить ◈ правки']],
    ['fallback', '▫']
  ]) {
    assert.throws(
      () => validateAgentVisuals({ ...agent, [field]: value }),
      /ромб/
    );
  }
});

test('HTML fallback экранируется и обязан содержать настоящий emoji', () => {
  assert.equal(
    agentLogoHtml({ ...agent, fallback: '⚖️ & право' }),
    '⚖️ &amp; право'
  );
  assert.throws(
    () => validateAgentVisuals({ ...agent, fallback: 'L' }),
    /emoji/
  );
});

test('генератор создаёт детерминированную запись без отдельных sticker ID', () => {
  assert.deepEqual(buildAgentIconManifest([agent]), {
    version: 1,
    strategy: 'primary-model-brand',
    agents: [{
      id: 'legal_advisor',
      customEmojiKey: 'openai',
      fallback: '⚖️',
      primaryModel: 'gpt_56_terra'
    }]
  });
});

test('валидация отклоняет повреждённый контракт и неизвестную модель', () => {
  assert.throws(() => validateAgentVisuals(null), /объектом/);
  assert.throws(() => validateAgentVisuals({ ...agent, id: '!' }), /id агента/);
  assert.throws(() => validateAgentVisuals({ ...agent, tasks: [] }), /непустым массивом/);
  assert.throws(
    () => validateAgentVisuals({ ...agent, primaryModel: 'missing_model' }),
    /неизвестная основная модель/
  );
});

test('генератор отклоняет не-массив и повторяющиеся id', () => {
  assert.throws(() => buildAgentIconManifest(null), /массивом/);
  assert.throws(
    () => buildAgentIconManifest([agent, agent]),
    /повтор id/
  );
});

test('генератор записывает проверенный manifest ровно для 50 агентов', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'metaflora-agent-icons-'));
  const outputPath = join(directory, 'nested', 'manifest.json');
  const agents = Array.from({ length: 50 }, (_, index) => ({
    ...agent,
    id: `legal_advisor_${index}`
  }));

  try {
    const manifest = await generateAgentIconManifest(outputPath, agents);
    const stored = JSON.parse(await readFile(outputPath, 'utf8'));
    assert.equal(manifest.agents.length, 50);
    assert.deepEqual(stored, manifest);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('реальный каталог проходит визуальную валидацию 50 из 50', () => {
  const manifest = buildAgentIconManifest(listAgents());
  assert.equal(manifest.agents.length, 50);
  assert.equal(new Set(manifest.agents.map(({ id }) => id)).size, 50);
});

test('генератор не записывает неполный каталог', async () => {
  await assert.rejects(
    () => generateAgentIconManifest('/tmp/unused-agent-icons.json', [agent]),
    /ожидалось 50 агентов/
  );
});
