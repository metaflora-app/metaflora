import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAgentCard } from '../src/agent-ui.js';
import { listAgents } from '../src/agent-catalog.js';
import {
  buildModelConfiguredMessage,
  buildModelSelectedMessage,
  getModelById
} from '../src/model-catalog.js';
import {
  buildGenerationHistoryDetailMessage,
  buildGenerationHistoryListMessage
} from '../src/generation-history-ui.js';
import { buildDialogHistoryMessage, buildProfileCabinetMessage } from '../src/billing-ui.js';

function buttons(message) {
  return message.reply_markup.inline_keyboard.flat();
}

const account = {
  metacoinBalance: 0,
  subscriptionPlanId: 'newcomer',
  subscriptionMetacoinsTotal: 0,
  subscriptionMetacoinsRemaining: 0,
  subscriptionExpiresAt: null,
  packageId: null,
  packageMetacoinsRemaining: 0,
  spentMetacoins1d: 0,
  spentMetacoins30d: 0
};

test('карточки ждут запрос, а действия появляются только в результате', () => {
  const llm = getModelById('gpt_56_luna');
  const video = getModelById('seedance_20');
  const agent = listAgents()[0];

  assert.equal(buttons(buildModelSelectedMessage(llm)).some(({ text }) => text === '💬 новый диалог'), false);
  assert.equal(buttons(buildModelConfiguredMessage(video)).some(({ text }) => text === '✨ новая генерация'), false);
  assert.ok(buttons(buildAgentCard(agent)).some(({ text, callback_data }) => (
    text === '📝 новая задача' && callback_data === `agent:new:${agent.id}`
  )));
});

test('профиль показывает отдельные истории диалогов, задач и генераций', () => {
  const message = buildProfileCabinetMessage({ account });
  const buttonData = buttons(message).map(({ callback_data }) => callback_data);
  const labels = buttons(message).map(({ text }) => text);

  assert.ok(buttonData.includes('dialoghist:list:0'));
  assert.ok(buttonData.includes('taskhist:list:0'));
  assert.ok(buttonData.includes('genhist:list:0'));
  assert.ok(labels.includes('история диалогов'));
  assert.ok(labels.includes('история задач'));
  assert.ok(labels.includes('история генераций'));
  assert.doesNotMatch(message.text, /история запросов/u);
});

test('истории используют понятные названия и отдельный callback-префикс задач', () => {
  const dialogs = buildDialogHistoryMessage({ items: [] });
  const tasks = buildGenerationHistoryListMessage({ items: [], historyType: 'task' });
  const taskDetail = buildGenerationHistoryDetailMessage({
    id: '00000000-0000-4000-8000-000000000001',
    kind: 'agent',
    subjectLabel: 'редактор',
    status: 'completed',
    metacoinsCharged: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    prompt: 'собери план'
  }, { historyType: 'task' });

  assert.match(dialogs.text, /история диалогов/u);
  assert.doesNotMatch(dialogs.text, /история запросов|запросов пока/u);
  assert.ok(buttons(dialogs).some(({ callback_data }) => callback_data === 'dialog:new'));
  assert.match(tasks.text, /история задач/u);
  assert.ok(buttons(tasks).some(({ callback_data }) => callback_data === 'taskhist:list:1') === false);
  assert.match(taskDetail.text, /ИИ-агент/u);
  assert.ok(buttons(taskDetail).some(({ callback_data }) => callback_data === 'taskhist:list:0'));
});

test('история генераций использует кисточку и не маскирует историю задач под генерации', () => {
  const generations = buildGenerationHistoryListMessage({ items: [] });
  assert.match(generations.text, /^🖌️ <b>история генераций<\/b>/u);
  assert.doesNotMatch(generations.text, /ИИ-агент/u);
});
