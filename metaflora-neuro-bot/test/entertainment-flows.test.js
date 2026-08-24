import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ENTERTAINMENT_FLOWS,
  entertainmentFlowFor,
  buildEntertainmentFlowMessage,
  chooseEntertainmentFlow
} from '../src/entertainment-flows.js';

const expected = [
  'ent_story_quest', 'ent_sound_postcard', 'ent_visual_age',
  'ent_chef', 'ent_diet_day', 'ent_story_oracle', 'ent_character_test', 'ent_party_game'
];

test('the remaining secondary entertainment scenarios have distinct interactive flows', () => {
  assert.deepEqual(Object.keys(ENTERTAINMENT_FLOWS).sort(), expected.sort());
  const signatures = expected.map((id) => {
    const flow = entertainmentFlowFor(id);
    assert.ok(flow.options.length >= 3, id);
    assert.ok(flow.startLabel);
    assert.ok(flow.inputHint);
    return flow.options.map(({ id: optionId }) => optionId).join('|');
  });
  assert.equal(new Set(signatures).size, expected.length);
});

test('flow menus expose scenario-specific choices and navigation', () => {
  const message = buildEntertainmentFlowMessage('ent_story_quest');
  assert.match(message.text, /выбери жанр/u);
  const buttons = message.reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some(({ text }) => text.includes('детектив')));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'ent:flow:ent_story_quest:detective'));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'ent:card:ent_story_quest'));
});

test('choice creates immutable runtime context with an actual agent route', () => {
  const selected = chooseEntertainmentFlow('ent_story_quest', 'detective');
  assert.equal(selected.entertainment.id, 'ent_story_quest');
  assert.equal(selected.choice.id, 'detective');
  assert.ok(selected.agent.primaryModel);
  assert.match(selected.agent.systemPrompt, /детектив/u);
  assert.match(selected.message.text, /место действия/u);
  assert.equal(Object.isFrozen(selected.entertainment), true);
  assert.equal(Object.isFrozen(selected.agent), true);
});

test('unknown flow choices fail closed', () => {
  assert.equal(chooseEntertainmentFlow('ent_story_quest', 'hack'), null);
  assert.equal(buildEntertainmentFlowMessage('missing'), null);
});
