import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildQuizStartMessage,
  buildQuizSetupMessage,
  buildQuizQuestionMessage,
  buildQuizResultMessage,
  createQuizState,
  parseQuizQuestions,
  answerQuizQuestion
} from '../src/entertainment-quiz.js';

const buttons = (message) => message.reply_markup.inline_keyboard.flat();

test('quiz exposes category, difficulty and question-count setup', () => {
  assert.ok(buttons(buildQuizStartMessage()).some(({ callback_data }) => callback_data === 'entquiz:category:science'));
  assert.ok(buttons(buildQuizSetupMessage({ category: 'science' })).some(({ callback_data }) => callback_data === 'entquiz:difficulty:hard'));
  assert.ok(buttons(buildQuizSetupMessage({ category: 'science', difficulty: 'hard' })).some(({ callback_data }) => callback_data === 'entquiz:count:10'));
});

test('provider quiz payload is strictly validated and normalized', () => {
  const questions = parseQuizQuestions(JSON.stringify({ questions: [
    { text: 'Столица Исландии?', options: ['Осло', 'Рейкьявик', 'Турку', 'Берген'], correctIndex: 1, explanation: 'Рейкьявик — столица Исландии.' },
    { text: 'Сколько спутников у Земли?', options: ['0', '1', '2', '4'], correctIndex: 1, explanation: 'У Земли один естественный спутник.' }
  ] }), 2);
  assert.equal(questions.length, 2);
  assert.equal(questions[0].correctIndex, 1);
  assert.throws(() => parseQuizQuestions('{"questions":[{"text":"x"}]}', 1));
  assert.throws(() => parseQuizQuestions('{"questions":[]}', 1));
});

test('answers are checked against server-held index and score advances once', () => {
  const questions = parseQuizQuestions(JSON.stringify({ questions: [
    { text: '2 + 2?', options: ['3', '4', '5', '6'], correctIndex: 1, explanation: '2 + 2 = 4.' },
    { text: '3 + 3?', options: ['5', '6', '7', '8'], correctIndex: 1, explanation: '3 + 3 = 6.' }
  ] }), 2);
  const state = createQuizState({ sessionId: 'quiz:1', category: 'science', difficulty: 'easy', questions });
  const first = answerQuizQuestion(state, 1);
  assert.equal(first.correct, true);
  assert.equal(first.state.score, 1);
  assert.equal(first.state.index, 1);
  assert.equal(first.history.answerIndex, 1);
  assert.equal(first.history.correctIndex, undefined);
  assert.equal(answerQuizQuestion(first.state, 1).finished, true);
});

test('question and final cards provide a complete playable flow', () => {
  const state = createQuizState({ sessionId: 'quiz:1', category: 'culture', difficulty: 'medium', questions: [
    { text: 'Вопрос?', options: ['А', 'Б', 'В', 'Г'], correctIndex: 2, explanation: 'Пояснение.' }
  ] });
  const question = buildQuizQuestionMessage(state);
  assert.match(question.text, /вопрос 1 из 1/u);
  assert.equal(buttons(question).filter(({ callback_data = '' }) => callback_data.startsWith('entquiz:answer:0:')).length, 4);
  const result = buildQuizResultMessage({ ...state, index: 1, score: 1 });
  assert.match(result.text, /1 из 1/u);
  assert.ok(buttons(result).some(({ callback_data }) => callback_data === 'ent:use:ent_quiz'));
});
