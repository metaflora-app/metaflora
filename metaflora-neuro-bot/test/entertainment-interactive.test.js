import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCalorieCaptureMessage,
  buildCongratulatorOccasionMessage,
  buildMemeStickerModeMessage,
  entertainmentInteraction,
  buildInteractiveEntertainmentStart,
  createEntertainmentFlowState,
  deterministicLilaDice,
  prepareEntertainmentTurn
} from '../src/entertainment-interactive.js';

const buttons = (message) => message.reply_markup.inline_keyboard.flat();

test('congratulator uses an original recipient-led start instead of competitor occasion grid', () => {
  const message = buildCongratulatorOccasionMessage();
  assert.match(message.text, /<b>🎙 голосовая открытка<\/b>/u);
  assert.match(message.text, /для кого/iu);
  assert.doesNotMatch(message.text, /выбери повод/iu);
  for (const id of ['birthday', 'anniversary', 'wedding', 'custom']) {
    assert.ok(buttons(message).some(({ callback_data }) => callback_data === `entcongrats:${id}`));
  }
  assert.equal(buttons(message).filter(({ callback_data = '' }) => callback_data.startsWith('entcongrats:')).length, 4);
});

test('calorie flow requests exactly one photograph', () => {
  const message = buildCalorieCaptureMessage();
  assert.match(message.text, /пришли (?:одно|фото)/iu);
  assert.match(message.text, /примерн/iu);
  assert.ok(!/ограничени|важно:/iu.test(message.text));
});

test('meme sticker offers three actual input modes', () => {
  const message = buildMemeStickerModeMessage();
  assert.deepEqual(
    buttons(message).filter(({ callback_data = '' }) => callback_data.startsWith('entmeme:')).map(({ text }) => text),
    ['🗯 фраза → стикер', '🎬 герой из кадра', '🧩 собрать сцену']
  );
  assert.match(message.text, /заготовк/iu);
  assert.doesNotMatch(message.text, /из чего начинаем/iu);
});

test('interactive scenarios define runtime model and precise instructions', () => {
  assert.equal(entertainmentInteraction('ent_calorie_estimator').modelId, 'qwen_3_vl');
  assert.equal(entertainmentInteraction('ent_meme_sticker').modelId, 'nano_banana_2');
  assert.match(entertainmentInteraction('ent_calorie_estimator').systemPrompt, /БЖУ/u);
  assert.match(entertainmentInteraction('ent_meme_sticker').systemPrompt, /стикер/u);
  assert.equal(entertainmentInteraction('ent_lila').modelId, 'claude_sonnet_5');
  assert.equal(entertainmentInteraction('ent_trainer').modelId, 'gpt_56_terra');
  assert.equal(entertainmentInteraction('ent_language_tutor').modelId, 'claude_sonnet_5');
});

test('lila has deterministic dice and a capped stateful session', () => {
  const start = buildInteractiveEntertainmentStart('ent_lila');
  assert.match(start.text, /72 клет/iu);
  assert.ok(buttons(start).some(({ callback_data }) => callback_data === 'entflow:lila:enter'));
  assert.equal(deterministicLilaDice('session-1', 1), deterministicLilaDice('session-1', 1));
  const turn = prepareEntertainmentTurn(createEntertainmentFlowState('ent_lila', { sessionId: 'session-1' }), 'мой вопрос');
  assert.match(turn.prompt, /кубик/iu);
  assert.equal(turn.state.maxTurns, 40);
  assert.equal(turn.state.turn, 1);
});

test('lila requires a six to enter and applies board transitions', () => {
  const waiting = createEntertainmentFlowState('ent_lila', { sessionId: 'waiting', position: 0 });
  let entered = null;
  for (let attempt = 1; attempt <= 100; attempt += 1) {
    const turn = prepareEntertainmentTurn({ ...waiting, turn: attempt - 1 }, 'бросок');
    if (turn.roll === 6) { entered = turn; break; }
    assert.equal(turn.state.position, 0);
    assert.equal(turn.entered, false);
  }
  assert.ok(entered, 'a deterministic six must occur');
  assert.equal(entered.state.position, 1);
  assert.equal(entered.entered, true);
  assert.equal(typeof entered.transition?.to, 'number');
  assert.deepEqual(entered.history, {
    game: 'lila', turn: entered.state.turn, roll: 6,
    from: 0, landed: 1, position: entered.state.position,
    transition: entered.transition
  });
});

test('lila next-turn UI exposes a dice callback rather than asking arbitrary text', () => {
  const message = buildInteractiveEntertainmentStart('ent_lila');
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'entflow:lila:enter'));
});

test('trainer and language tutor start with distinct choices and preserve progress', () => {
  const trainer = buildInteractiveEntertainmentStart('ent_trainer');
  assert.match(trainer.text, /режим тренера/iu);
  assert.doesNotMatch(trainer.text, /твоя цель/iu);
  assert.ok(buttons(trainer).some(({ callback_data }) => callback_data === 'entflow:trainer:goal:lose'));
  const trainerTurn = prepareEntertainmentTurn(createEntertainmentFlowState('ent_trainer', { goal: 'похудеть' }), '3 раза дома');
  assert.match(trainerTurn.prompt, /похудеть/u);

  const language = buildInteractiveEntertainmentStart('ent_language_tutor');
  assert.match(language.text, /выбери язык/iu);
  assert.ok(buttons(language).some(({ callback_data }) => callback_data === 'entflow:language:choose:en'));
  const languageTurn = prepareEntertainmentTurn(createEntertainmentFlowState('ent_language_tutor', { language: 'английский' }), 'Hello');
  assert.equal(languageTurn.state.turn, 1);
  assert.equal(languageTurn.state.maxTurns, 20);
  assert.match(languageTurn.prompt, /английск/iu);
});
