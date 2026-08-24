const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export const QUIZ_CATEGORIES = Object.freeze({
  science: '🔬 наука', history: '🏺 история', culture: '🎬 культура',
  geography: '🌍 география', technology: '💻 технологии', mixed: '🎲 обо всём'
});
export const QUIZ_DIFFICULTIES = Object.freeze({ easy: 'разминка', medium: 'знаток', hard: 'эксперт' });
export const QUIZ_COUNTS = Object.freeze([5, 10, 15]);
const nav = [
  [{ text: '👤 профиль', callback_data: 'task:profile' }],
  [{ text: '‹ назад к развлечениям', callback_data: 'ent:home' }, { text: '🏠 главное меню', callback_data: 'task:menu' }]
];

export function buildQuizStartMessage() {
  return {
    text: '<b>🧪 квиз</b>\n\nвыбери тему. вопросы будут появляться по одному, а после ответа покажу правильный вариант и короткое объяснение.',
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      ...Object.entries(QUIZ_CATEGORIES).map(([id, label]) => [{ text: label, callback_data: `entquiz:category:${id}` }]),
      [{ text: '👤 профиль', callback_data: 'task:profile' }],
      ...nav
    ] }
  };
}

export function buildQuizSetupMessage(setup = {}) {
  if (!QUIZ_CATEGORIES[setup.category]) return buildQuizStartMessage();
  if (!QUIZ_DIFFICULTIES[setup.difficulty]) return {
    text: `<b>🧪 квиз · ${QUIZ_CATEGORIES[setup.category]}</b>\n\nвыбери сложность👇`, parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [
        ...Object.entries(QUIZ_DIFFICULTIES).map(([id, label]) => ({ text: label, callback_data: `entquiz:difficulty:${id}` }))
      ],
      [{ text: '‹ сменить тему', callback_data: 'ent:use:ent_quiz' }], ...nav
    ] }
  };
  return {
    text: `<b>🧪 ${QUIZ_CATEGORIES[setup.category]} · ${QUIZ_DIFFICULTIES[setup.difficulty]}</b>\n\nсколько будет вопросов?`, parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [
        ...QUIZ_COUNTS.map((count) => ({ text: String(count), callback_data: `entquiz:count:${count}` }))
      ],
      [{ text: '‹ сменить сложность', callback_data: `entquiz:category:${setup.category}` }], ...nav
    ] }
  };
}

const cleanText = (value, max) => {
  const result = String(value ?? '').trim();
  if (!result || result.length > max) throw new TypeError('Invalid quiz text.');
  return result;
};

export function parseQuizQuestions(value, expectedCount) {
  let parsed;
  try { parsed = typeof value === 'string' ? JSON.parse(value.replace(/^```(?:json)?\s*|\s*```$/giu, '')) : value; }
  catch { throw new TypeError('Quiz response is not valid JSON.'); }
  if (!Array.isArray(parsed?.questions) || parsed.questions.length !== expectedCount) throw new TypeError('Invalid quiz question count.');
  return Object.freeze(parsed.questions.map((question) => {
    if (!Array.isArray(question?.options) || question.options.length !== 4) throw new TypeError('A quiz question must have four options.');
    const correctIndex = Number(question.correctIndex);
    if (!Number.isSafeInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) throw new TypeError('Invalid quiz answer index.');
    return Object.freeze({
      text: cleanText(question.text, 500),
      options: Object.freeze(question.options.map((option) => cleanText(option, 150))),
      correctIndex,
      explanation: cleanText(question.explanation, 500)
    });
  }));
}

export function createQuizState({ sessionId, category, difficulty, questions }) {
  if (!QUIZ_CATEGORIES[category] || !QUIZ_DIFFICULTIES[difficulty] || !Array.isArray(questions) || !questions.length) throw new TypeError('Invalid quiz state.');
  const token = String(sessionId).split(':').at(-1).slice(0, 12);
  return Object.freeze({ id: 'ent_quiz', sessionId, token, category, difficulty, questions: Object.freeze([...questions]), index: 0, score: 0, answers: Object.freeze([]), turn: 0, maxTurns: questions.length });
}

export function buildQuizQuestionMessage(state, feedback = '') {
  const question = state.questions[state.index];
  if (!question) return buildQuizResultMessage(state);
  return {
    text: `${feedback ? `${feedback}\n\n` : ''}<b>вопрос ${state.index + 1} из ${state.questions.length}</b>\n\n${escapeHtml(question.text)}\n\n<b>счёт: ${state.score}</b>`, parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      ...question.options.map((option, index) => [{ text: `${['А', 'Б', 'В', 'Г'][index]}. ${option}`, callback_data: `entquiz:answer:${state.index}:${index}:${state.token}` }]),
      ...nav
    ] }
  };
}

export function answerQuizQuestion(state, answerIndex) {
  const question = state?.questions?.[state.index];
  const chosen = Number(answerIndex);
  if (!question || !Number.isSafeInteger(chosen) || chosen < 0 || chosen > 3) return null;
  const correct = chosen === question.correctIndex;
  const answer = Object.freeze({ question: state.index, answerIndex: chosen, correct });
  const next = Object.freeze({ ...state, index: state.index + 1, turn: state.index + 1, score: state.score + (correct ? 1 : 0), answers: Object.freeze([...state.answers, answer]) });
  return Object.freeze({
    state: next, correct, finished: next.index >= next.questions.length,
    feedback: `${correct ? '✅ <b>верно</b>' : `❌ <b>правильный ответ: ${escapeHtml(question.options[question.correctIndex])}</b>`}\n${escapeHtml(question.explanation)}`,
    history: Object.freeze({ game: 'quiz', question: state.index + 1, answerIndex: chosen, correct })
  });
}

export function buildQuizResultMessage(state) {
  const percent = Math.round((state.score / state.questions.length) * 100);
  const verdict = percent === 100 ? 'без ошибок' : percent >= 70 ? 'сильный результат' : percent >= 40 ? 'хорошая разминка' : 'тема для реванша';
  return {
    text: `<b>🏁 квиз завершён</b>\n\nправильных ответов: <b>${state.score} из ${state.questions.length}</b>\nрезультат: <b>${percent}% · ${verdict}</b>`, parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [{ text: '🔄 сыграть ещё', callback_data: 'ent:use:ent_quiz' }], ...nav
    ] }
  };
}

export function buildQuizGenerationPrompt({ category, difficulty, count }) {
  return `Создай квиз на русском языке. Тема: ${QUIZ_CATEGORIES[category]}. Сложность: ${QUIZ_DIFFICULTIES[difficulty]}. Ровно ${count} вопросов без повторов. У каждого вопроса ровно четыре правдоподобных варианта, один правильный ответ и короткое фактическое объяснение. Не используй двусмысленные, субъективные или зависящие от текущей даты вопросы. Верни только JSON: {"questions":[{"text":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}`;
}
