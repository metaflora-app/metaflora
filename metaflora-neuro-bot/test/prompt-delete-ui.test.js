import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildModelInstructionsPrompt,
  buildModelSettingsMessage,
  defaultModelSettings,
  getModelById
} from '../src/model-catalog.js';

const buttons = (message) => message.reply_markup.inline_keyboard.flat();

test('LLM delete prompt action is shown only for persisted instructions', () => {
  const model = getModelById('gpt_oss_20b_free');
  assert.equal(buttons(buildModelInstructionsPrompt(model, true)).find(
    ({ callback_data }) => callback_data === `instructions:clear:${model.id}`
  )?.text, '🗑 удалить промпт');
  assert.equal(buttons(buildModelInstructionsPrompt(model, false)).some(
    ({ text }) => text === '🗑 удалить промпт'
  ), false);
});

test('ordinary image settings never invent a persistent prompt delete action', () => {
  const model = getModelById('nano_banana_2');
  const message = buildModelSettingsMessage(model, defaultModelSettings(model));
  assert.equal(buttons(message).some(({ text }) => text === '🗑 удалить промпт'), false);
});
