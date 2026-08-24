import { getEntertainmentById, entertainmentAgentFor } from './entertainment-catalog.js';

const definitions = {
  ent_story_quest: ['выбери жанр квеста', 'назови героя и место действия', [['detective', '🕵️ детектив', 'детектив'], ['fantasy', '🐉 фэнтези', 'фэнтези'], ['space', '🚀 космос', 'космическая фантастика'], ['comedy', '😄 комедия', 'комедия']]],
  ent_sound_postcard: ['выбери настроение открытки', 'назови адресата, повод и желаемую длительность', [['warm', '☀️ тёплая', 'тёплая и душевная'], ['funny', '😄 весёлая', 'весёлая'], ['romantic', '❤️ романтичная', 'романтичная'], ['solemn', '✨ торжественная', 'торжественная']]],
  ent_visual_age: ['выбери тон разбора', 'пришли одно чёткое фото', [['gentle', '🌿 бережно', 'бережный'], ['neutral', '🔎 нейтрально', 'нейтральный'], ['playful', '😄 с юмором', 'лёгкий юмористический']]],
  ent_chef: ['что приготовить', 'перечисли продукты, порции и доступное время', [['quick', '⚡ быстро', 'до 20 минут'], ['dinner', '🍽 ужин', 'полноценный ужин'], ['dessert', '🍰 десерт', 'десерт'], ['surprise', '🎲 сюрприз', 'неожиданный рецепт']]],
  ent_diet_day: ['выбери задачу меню', 'укажи число людей, бюджет, продукты дома и аллергии', [['budget', '💰 экономно', 'экономное'], ['balanced', '⚖️ сбалансированно', 'сбалансированное'], ['fast', '⚡ без долгой готовки', 'с быстрой готовкой'], ['vegetarian', '🌱 без мяса', 'вегетарианское']]],
  ent_story_oracle: ['выбери атмосферу истории', 'задай вопрос, который хочешь рассмотреть через историю', [['kind', '☀️ добрая', 'добрая'], ['mystery', '🌙 загадочная', 'загадочная'], ['ironic', '😏 ироничная', 'ироничная'], ['epic', '⚔️ эпическая', 'эпическая']]],
  ent_character_test: ['выбери длину теста', 'назови вселенную, фильм, игру или жанр', [['short', '⚡ 5 вопросов', 'короткий тест из 5 вопросов'], ['normal', '🎯 10 вопросов', 'тест из 10 вопросов'], ['deep', '🧠 15 вопросов', 'подробный тест из 15 вопросов']]],
  ent_party_game: ['выбери тип игры', 'напиши число игроков, возраст, место и время', [['icebreaker', '👋 знакомство', 'для знакомства'], ['team', '🤝 командная', 'командная'], ['words', '💬 словесная', 'словесная'], ['active', '🏃 активная', 'подвижная']]]
};

export const ENTERTAINMENT_FLOWS = Object.freeze(Object.fromEntries(Object.entries(definitions).map(([id, [title, inputHint, options]]) => [id, Object.freeze({
  title, startLabel: '▶️ начать', inputHint,
  options: Object.freeze(options.map(([optionId, label, instruction]) => Object.freeze({ id: optionId, label, instruction })))
})])));
export const entertainmentFlowFor = (id) => ENTERTAINMENT_FLOWS[id] ?? null;

export function buildEntertainmentFlowMessage(id) {
  const entertainment = getEntertainmentById(id);
  const flow = entertainmentFlowFor(id);
  if (!entertainment || !flow) return null;
  return { text: `<b>${entertainment.name}</b>\n\n${flow.title}👇`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [
    ...flow.options.map((option) => [{ text: option.label, callback_data: `ent:flow:${id}:${option.id}` }]),
    [{ text: '‹ назад к карточке', callback_data: `ent:card:${id}` }, { text: '🏠 главное меню', callback_data: 'task:menu' }]
  ] } };
}

export function chooseEntertainmentFlow(id, optionId) {
  const entertainment = getEntertainmentById(id);
  const flow = entertainmentFlowFor(id);
  const choice = flow?.options.find(({ id: value }) => value === optionId);
  if (!entertainment || !flow || !choice) return null;
  const base = entertainmentAgentFor(entertainment);
  const agent = Object.freeze({ ...base, systemPrompt: `${base.systemPrompt}\n\nВыбранный формат: ${choice.instruction}. Веди сценарий последовательно: задавай только один необходимый вопрос за раз, сохраняй состояние и не перескакивай к финалу.` });
  return Object.freeze({ entertainment, choice, agent, message: Object.freeze({
    text: `<b>${entertainment.name}</b>\n\nвыбран формат: <b>${choice.label}</b>. ${flow.inputHint}👇`, parse_mode: 'HTML', reply_markup: { inline_keyboard: [
      [{ text: '‹ сменить формат', callback_data: `ent:use:${id}` }],
      [{ text: '‹ назад к развлечениям', callback_data: 'ent:home' }, { text: '🏠 главное меню', callback_data: 'task:menu' }]
    ] }
  }) });
}
