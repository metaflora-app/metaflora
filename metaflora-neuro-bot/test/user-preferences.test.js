import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyUserPreference,
  cycleUserPreference,
  buildUserPreferenceOptions,
  buildUserSettingsMessage,
  defaultUserPreferences,
  preferenceInstructions
} from '../src/user-preferences.js';

test('user settings are global and do not ask for a model', () => {
  const message = buildUserSettingsMessage(defaultUserPreferences());
  const callbacks = message.reply_markup.inline_keyboard.flat()
    .map(({ callback_data }) => callback_data)
    .filter(Boolean);

  assert.match(message.text, /^⚙️ <b>настройки<\/b>/);
  assert.match(message.text, /язык ответов/i);
  assert.match(message.text, /объём ответа/i);
  assert.match(message.text, /глубина разбора/i);
  assert.match(message.text, /резюме ответа/i);
  assert.match(message.text, /документы/i);
  assert.doesNotMatch(message.text, /выбери модель|параметры модели|название модели|показывать модель/i);
  assert.ok(callbacks.includes('prefs:language'));
  assert.ok(callbacks.includes('prefs:length'));
  assert.ok(callbacks.includes('prefcycle:reasoning'));
  assert.equal(callbacks.some((callback) => callback.includes('showModel')), false);
  assert.ok(callbacks.includes('modelcat:llm'));
});

test('advanced preferences cycle immutably and request only a summary, never hidden reasoning', () => {
  const defaults = defaultUserPreferences();
  const reasoning = cycleUserPreference(defaults, 'reasoning');
  const summary = applyUserPreference(reasoning, 'reasoningSummary', 'brief');
  const documents = applyUserPreference(summary, 'documents', 'always');
  const instructions = preferenceInstructions(documents);

  assert.notEqual(reasoning.reasoning, defaults.reasoning);
  assert.ok(Object.isFrozen(reasoning));
  assert.match(instructions, /краткое резюме/i);
  assert.doesNotMatch(instructions, /цепочку рассуждений|скрытые рассуждения/i);
  assert.match(instructions, /приложенные документы/i);
});

test('language and answer length settings produce real request instructions', () => {
  const russian = applyUserPreference(defaultUserPreferences(), 'language', 'ru');
  const detailed = applyUserPreference(russian, 'length', 'detailed');

  assert.match(preferenceInstructions(detailed), /русском языке/i);
  assert.match(preferenceInstructions(detailed), /подробно/i);
  assert.match(buildUserPreferenceOptions('language', detailed).text, /язык ответов/i);
});
