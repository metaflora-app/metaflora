import { buildQuizStartMessage } from './entertainment-quiz.js';

const nav = Object.freeze([
  [{ text: '👤 профиль', callback_data: 'task:profile' }],
  [{ text: '‹ назад к развлечениям', callback_data: 'ent:home' }, { text: '🏠 главное меню', callback_data: 'task:menu' }]
]);

const guidedFlows = Object.freeze({
  ent_lila: Object.freeze({
    maxTurns: 40,
    text: '<b>🎲 игра «лила»</b>\n\nполе из <b>72 клеток</b>: каждая открывает тему, состояние или вопрос для честного размышления. сформулируй запрос — дальше кубик определит первый ход.\n\nодна сессия — до <b>40 ходов</b>.',
    keyboard: [[{ text: '▶️ войти в Лилу', callback_data: 'entflow:lila:enter' }], ...nav]
  }),
  ent_trainer: Object.freeze({
    maxTurns: 8,
    text: '<b>💪 тренировочная мастерская</b>\n\nвыбери <b>режим тренера</b>. дальше я уточню график, место занятий и инвентарь, а затем соберу программу на неделю.',
    keyboard: [[{ text: '🔥 сжечь лишнее', callback_data: 'entflow:trainer:goal:lose' }, { text: '🏗 добавить объём', callback_data: 'entflow:trainer:goal:gain' }], [{ text: '🧘 вернуть форму', callback_data: 'entflow:trainer:goal:tone' }, { text: '🏋️ стать сильнее', callback_data: 'entflow:trainer:goal:strength' }], [{ text: '🏃 держать темп дольше', callback_data: 'entflow:trainer:goal:endurance' }], ...nav],
    systemPrompt: 'Составляй только общеоздоровительные тренировочные планы. Не ставь диагнозы и не назначай реабилитацию. При боли, острой травме, беременности, сердечно-сосудистых рисках или иных серьёзных противопоказаниях останови подбор нагрузки и порекомендуй очную консультацию профильного специалиста. Не обещай лечебный результат.'
  }),
  ent_language_tutor: Object.freeze({
    maxTurns: 20,
    text: '<b>🗣 языковой собеседник</b>\n\nживой разговор с ИИ-репетитором: он подстроится под уровень, мягко исправит ошибки и в конце соберёт слова для повторения.\n\n<b>выбери язык:</b>',
    keyboard: [[{ text: '🇬🇧 английский', callback_data: 'entflow:language:choose:en' }, { text: '🇩🇪 немецкий', callback_data: 'entflow:language:choose:de' }], [{ text: '🇫🇷 французский', callback_data: 'entflow:language:choose:fr' }, { text: '🇪🇸 испанский', callback_data: 'entflow:language:choose:es' }], [{ text: '🇮🇹 итальянский', callback_data: 'entflow:language:choose:it' }, { text: '🇨🇳 китайский', callback_data: 'entflow:language:choose:zh' }], [{ text: '📊 мой прогресс', callback_data: 'entflow:language:progress' }], ...nav]
  })
});

const goals = Object.freeze({ lose: 'похудеть', gain: 'набрать массу', tone: 'тонус и форма', strength: 'сила', endurance: 'выносливость' });
const languages = Object.freeze({ en: 'английский', de: 'немецкий', fr: 'французский', es: 'испанский', it: 'итальянский', zh: 'китайский' });
export const LILA_TRANSITIONS = Object.freeze({
  4: 14, 9: 31, 20: 38, 28: 50, 40: 59, 51: 67,
  17: 7, 35: 16, 47: 26, 55: 34, 62: 19, 69: 44
});

export const isInteractiveEntertainment = (id) => Boolean(guidedFlows[id] || interactions[id]);
export function buildInteractiveEntertainmentStart(id) {
  if (id === 'ent_quiz') return buildQuizStartMessage();
  if (id === 'ent_congratulator') return buildCongratulatorOccasionMessage();
  if (id === 'ent_calorie_estimator') return buildCalorieCaptureMessage();
  if (id === 'ent_meme_sticker') return buildMemeStickerModeMessage();
  const flow = guidedFlows[id];
  return flow ? { text: flow.text, parse_mode: 'HTML', reply_markup: { inline_keyboard: flow.keyboard } } : null;
}
export function createEntertainmentFlowState(id, values = {}) {
  const flow = guidedFlows[id];
  return flow ? Object.freeze({ id, turn: 0, maxTurns: flow.maxTurns, ...(flow.systemPrompt ? { systemPrompt: flow.systemPrompt } : {}), ...(id === 'ent_lila' ? { position: 0, entered: false, question: '' } : {}), ...values }) : null;
}
export function deterministicLilaDice(sessionId, turn) {
  let value = 2166136261;
  for (const character of `${sessionId}:${turn}`) value = Math.imul(value ^ character.codePointAt(0), 16777619) >>> 0;
  return (value % 6) + 1;
}
export function flowStateFromCallback(data, sessionId) {
  if (data === 'entflow:lila:enter') return createEntertainmentFlowState('ent_lila', { sessionId });
  const trainer = /^entflow:trainer:goal:(\w+)$/u.exec(data);
  if (trainer && goals[trainer[1]]) return createEntertainmentFlowState('ent_trainer', { goal: goals[trainer[1]] });
  const language = /^entflow:language:choose:(\w+)$/u.exec(data);
  if (language && languages[language[1]]) return createEntertainmentFlowState('ent_language_tutor', { language: languages[language[1]] });
  return null;
}
export function buildFlowReadyMessage(state) {
  const text = state.id === 'ent_lila'
    ? '<b>🎲 сформулируй вопрос</b>\n\nпришли его одним сообщением — кубик будет брошен автоматически.'
    : state.id === 'ent_trainer'
      ? `<b>💪 цель: ${state.goal}</b>\n\nнапиши одним сообщением: опыт, сколько тренировок в неделю, где занимаешься, доступное оборудование и ограничения.`
      : `<b>🗣 ${state.language}</b>\n\nнапиши первую реплику на выбранном языке.`;
  return { text, parse_mode: 'HTML', reply_markup: { inline_keyboard: nav } };
}

export function buildLilaNextMessage(state) {
  return {
    text: `<b>🎲 Лила · клетка ${state.position}</b>\n\nнажми кнопку, чтобы сделать следующий ход.`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [{ text: '🎲 бросить кубик', callback_data: 'entflow:lila:roll' }],
      ...nav
    ] }
  };
}
export function prepareEntertainmentTurn(state, input) {
  if (!state || state.turn >= state.maxTurns) return null;
  const turn = state.turn + 1;
  const next = Object.freeze({ ...state, turn });
  if (state.id === 'ent_lila') {
    const roll = deterministicLilaDice(state.sessionId, turn);
    const question = String(input || state.question || '').trim();
    const from = state.position ?? 0;
    const entered = Boolean(state.entered) || roll === 6;
    const landed = entered ? (from === 0 ? 1 : Math.min(72, from + roll)) : 0;
    const destination = LILA_TRANSITIONS[landed] ?? landed;
    const transition = Object.freeze({
      from: landed,
      to: destination,
      type: destination > landed ? 'arrow' : destination < landed ? 'snake' : 'none'
    });
    const updated = Object.freeze({ ...next, question, entered, position: destination, lastRoll: roll });
    const history = Object.freeze({ game: 'lila', turn, roll, from, landed, position: destination, transition });
    const rule = !entered
      ? 'Вход на поле только при выпадении 6: игрок остаётся перед первой клеткой.'
      : transition.type === 'arrow'
        ? `Стрела переводит игрока с клетки ${landed} на ${destination}.`
        : transition.type === 'snake'
          ? `Змея возвращает игрока с клетки ${landed} на ${destination}.`
          : `Игрок находится на клетке ${destination}.`;
    return {
      state: updated,
      roll,
      entered,
      transition,
      history,
      prompt: `Игра «Лила», ход ${turn} из ${state.maxTurns}. Кубик: ${roll}. Позиция до хода: ${from}; после хода: ${destination}. ${rule} Запрос игрока: ${question}. ${entered ? 'Раскрой тему текущей клетки, дай краткий смысл хода и задай один точный вопрос.' : 'Кратко сообщи результат броска и предложи бросить кубик ещё раз.'}`
    };
  }
  if (state.id === 'ent_trainer') return { state: next, prompt: `Цель пользователя: ${state.goal}. Ответ анкеты: ${input}. Если данных недостаточно, задай один следующий конкретный вопрос. Иначе составь недельный план с упражнениями, подходами, повторениями, отдыхом и прогрессией.` };
  return { state: next, prompt: `Проведи ход ${turn} из ${state.maxTurns} занятия на языке «${state.language}». Реплика ученика: ${input}. Ответь на изучаемом языке, мягко исправь максимум две существенные ошибки и продолжи разговор одним вопросом.` };
}

const interactions = Object.freeze({
  ent_lila: Object.freeze({
    modelId: 'claude_sonnet_5',
    systemPrompt: 'Ты ведущий интерактивной игры «Лила». Строго сохраняй номер хода, бросок кубика, клетку поля 1–72 и запрос игрока. На каждом ходу раскрывай одну тему и задавай один точный вопрос. Максимум 40 ходов.'
  }),
  ent_trainer: Object.freeze({
    modelId: 'gpt_56_terra',
    systemPrompt: 'Ты персональный тренер. Сначала зафиксируй цель, затем последовательно собери опыт, график, место, оборудование и ограничения. После анкеты выдай конкретный недельный план с прогрессией.'
  }),
  ent_language_tutor: Object.freeze({
    modelId: 'claude_sonnet_5',
    systemPrompt: 'Ты разговорный языковой тьютор. Веди диалог на выбранном языке до 20 ответов, подстраивай сложность, исправляй максимум две существенные ошибки за ход и заверши сессию словарём и темами для повторения.'
  }),
  ent_congratulator: Object.freeze({
    modelId: 'claude_sonnet_5',
    systemPrompt: 'Напиши персональное поздравление для озвучки. Сначала учти повод, затем спроси имя адресата, отношения, тон и желаемую длительность. Финальный текст должен звучать естественно вслух.'
  }),
  ent_calorie_estimator: Object.freeze({
    modelId: 'qwen_3_vl',
    systemPrompt: 'Рассмотри одно фото блюда. Назови распознанные продукты, оцени размер порции, дай диапазон калорий и примерные белки, жиры и углеводы (БЖУ). Отмечай допущения кратко. Это не является медицинской рекомендацией, не ставит диагноз и не заменяет план питания от специалиста.'
  }),
  ent_meme_sticker: Object.freeze({
    modelId: 'nano_banana_2',
    systemPrompt: 'Создай выразительный мем-стикер: один главный объект, чистый контур, прозрачный или простой фон, крупная читаемая подпись. Соблюдай выбранный пользователем режим входа.'
  }),
  ent_quiz: Object.freeze({
    modelId: 'gpt_56_terra',
    systemPrompt: 'Ты редактор фактологических квизов. Создавай однозначные вопросы с четырьмя вариантами ответа и проверяемым кратким объяснением. Возвращай только запрошенный JSON.'
  })
});

export const entertainmentInteraction = (id) => interactions[id] ?? null;

export function buildCongratulatorOccasionMessage() {
  return {
    text: '<b>🎙 голосовая открытка</b>\n\nначнём с человека, <b>для кого</b> она прозвучит. выбери ближайший повод, а следующим сообщением расскажи одну личную деталь: привычку, вашу общую историю или фразу адресата.',
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [{ text: '🎂 личный праздник', callback_data: 'entcongrats:birthday' }, { text: '🥂 важная дата', callback_data: 'entcongrats:anniversary' }],
      [{ text: '💍 для двоих', callback_data: 'entcongrats:wedding' }, { text: '✦ свой случай', callback_data: 'entcongrats:custom' }],
      ...nav
    ] }
  };
}

export function buildCongratulatorPromptMessage(occasion) {
  const names = Object.freeze({ birthday: 'день рождения', new_year: 'новый год', wedding: 'свадьба', anniversary: 'юбилей', love: 'признание', custom: 'своя тематика' });
  return {
    text: `<b>🎙 открытка · ${names[occasion] ?? names.custom}</b>\n\nодним сообщением напиши <b>имя адресата</b>, вашу личную деталь, желаемое настроение и примерную длину записи. по этим данным я сначала соберу текст для проверки.`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: nav }
  };
}

export function buildCongratulatorConfirmationMessage({ occasion, text, priceMetacoins, token }) {
  const names = Object.freeze({ birthday: 'день рождения', new_year: 'новый год', wedding: 'свадьба', anniversary: 'юбилей', love: 'признание', custom: 'своя тематика' });
  return {
    text: `<b>👁‍🗨 проверь поздравление</b>\n\n<b>повод:</b> ${names[occasion] ?? names.custom}\n<b>текст:</b> ${String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}\n\n<b>стоимость: ${priceMetacoins} метакоинов</b>`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [{ text: '▶️ создать аудио', callback_data: `entcongratulate:${token}` }],
      ...nav
    ] }
  };
}

export function buildCalorieCaptureMessage() {
  return {
    text: '<b>🍽 подсчёт калорий</b>\n\nпришли фото блюда — примерно оценю продукты, размер порции, калорийность и БЖУ.',
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: nav }
  };
}

export function buildMemeStickerModeMessage() {
  return {
    text: '<b>🎭 стикерная</b>\n\nвыбери заготовку. можно начать с одной реплики, вытащить героя из кадра или собрать новую сцену из фото и режиссёрской подсказки.',
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [{ text: '🗯 фраза → стикер', callback_data: 'entmeme:text' }, { text: '🎬 герой из кадра', callback_data: 'entmeme:photo' }],
      [{ text: '🧩 собрать сцену', callback_data: 'entmeme:photo_text' }],
      ...nav
    ] }
  };
}

export function buildMemeStickerCaptureMessage(mode) {
  const instruction = mode === 'text'
    ? 'пришли фразу и коротко опиши, кто её произносит. я сам подберу реакцию, композицию и фон'
    : mode === 'photo'
      ? 'пришли кадр с героем. сохраню узнаваемые черты и превращу реакцию в отдельный стикер'
      : 'пришли фото и в подписи задай новую ситуацию: действие, эмоцию и нужную реплику';
  return {
    text: `<b>🎭 стикерная</b>\n\n${instruction}.`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: nav }
  };
}
