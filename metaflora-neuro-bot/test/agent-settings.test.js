import test from 'node:test';
import assert from 'node:assert/strict';

import { listAgents } from '../src/agent-catalog.js';
import {
  agentSettingInstructions,
  agentSettingsProfileFor,
  applyAgentSetting,
  cycleAgentSetting,
  defaultAgentSettings,
  sanitizeAgentSettingsStore
} from '../src/agent-settings.js';
import {
  buildAgentCard,
  buildAgentSettingOptionsMessage,
  buildAgentSettingsMessage
} from '../src/agent-ui.js';

function buttons(message) {
  return message.reply_markup.inline_keyboard.flat();
}

test('все 50 агентов имеют базовую глубину и длину, а специальные агенты — свои параметры', () => {
  const configured = listAgents().filter((agent) => agentSettingsProfileFor(agent).length > 0);

  assert.equal(configured.length, 50);
  for (const agent of configured) {
    assert.ok(agentSettingsProfileFor(agent).some(({ key }) => key === 'depth'), agent.id);
    assert.ok(agentSettingsProfileFor(agent).some(({ key }) => key === 'length'), agent.id);
  }
  assert.ok(agentSettingsProfileFor('business_lawyer').some(({ key }) => key === 'depth'));
  assert.ok(agentSettingsProfileFor('copywriter').some(({ key }) => key === 'tone'));
  assert.ok(agentSettingsProfileFor('language_teacher').some(({ key }) => key === 'corrections'));
});

test('кнопка параметра циклически меняет значение без мутации', () => {
  const source = defaultAgentSettings('strategist');
  const next = cycleAgentSetting('strategist', source, 'depth');
  assert.notEqual(next.depth, source.depth);
  assert.equal(next.length, source.length);
  assert.ok(Object.isFrozen(next));
});

test('значения проверяются по профилю и превращаются в реальные инструкции', () => {
  const agent = listAgents().find(({ id }) => id === 'copywriter');
  const defaults = defaultAgentSettings(agent);
  const updated = applyAgentSetting(agent, defaults, 'tone', 'warm');
  const ignored = applyAgentSetting(agent, updated, 'tone', 'aggressive');

  assert.notDeepEqual(updated, defaults);
  assert.deepEqual(ignored, updated);
  assert.match(agentSettingInstructions(agent, updated), /дружелюбно/);
  assert.ok(Object.isFrozen(updated));
});

test('хранилище параметров отбрасывает неизвестные агенты, ключи и значения', () => {
  assert.deepEqual(sanitizeAgentSettingsStore({
    researcher: { sources: 'primary', injected: 'yes' },
    copywriter: { tone: 'warm' },
    unknown_agent: { sources: 'primary' }
  }), {
    researcher: { depth: 'normal', length: 'normal', sources: 'primary' },
    copywriter: { depth: 'normal', length: 'normal', tone: 'warm', variants: '3' }
  });
});

test('карточка показывает настройки всем агентам', () => {
  const copywriter = buildAgentCard('copywriter');
  const strategist = buildAgentCard('strategist');

  assert.ok(buttons(copywriter).some(({ callback_data }) => callback_data === 'agentsettings:copywriter'));
  assert.equal(buttons(strategist).some(({ callback_data }) => callback_data?.startsWith('agentsettings:')), true);
});

test('экран параметров показывает текущие значения, варианты и возврат к карточке', () => {
  const settings = buildAgentSettingsMessage('copywriter', { tone: 'warm' });
  const options = buildAgentSettingOptionsMessage('copywriter', 'tone', { tone: 'warm' });

  assert.match(settings.text, /^<b>⚙️ параметры агента «копирайтер»<\/b>/);
  assert.match(settings.text, /<b>тон текста:<\/b> дружелюбно/);
  assert.ok(buttons(settings).some(({ callback_data }) => callback_data === 'agentcycle:copywriter:tone'));
  assert.ok(buttons(settings).some(({ callback_data }) => callback_data === 'agentsettings:reset:copywriter'));
  assert.ok(buttons(settings).some(({ callback_data }) => callback_data === 'agent:copywriter'));
  assert.deepEqual(buttons(settings).find(({ text }) => text === 'готово'), {
    text: 'готово', callback_data: 'agent:copywriter', style: 'success'
  });
  assert.ok(buttons(options).some(({ callback_data, text }) => (
    callback_data === 'agentset:copywriter:tone:warm' && text.startsWith('✓ ')
  )));
  assert.ok(buttons(options).every(({ callback_data }) => (
    !callback_data || Buffer.byteLength(callback_data, 'utf8') <= 64
  )));
});
