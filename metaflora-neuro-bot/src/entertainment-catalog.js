import { getAgentById } from './agent-catalog.js';
import { calculateAgentRunPrice } from './agent-economics.js';
import { metacoinHtml } from './brand-icons.js';
import { getModelById } from './model-catalog.js';
import { AGENT_MODEL_ALLOWLIST } from './agent-runtime.js';
import {
  entertainmentInteraction,
  buildInteractiveEntertainmentStart
} from './entertainment-interactive.js';

const raw = [
  ['ent_congratulator', '🎙 поздравлятор', 'copywriter', 'готовит персональное поздравление с характером адресата, поводом и нужной длительностью: от короткого тоста до текста для озвучки.', 'назови повод, адресата, ваши отношения, желаемый тон и длительность'],
  ['ent_calorie_estimator', '🍽 калории по фото', 'meal_planner', 'оценивает состав блюда, размер порции, диапазон калорий и БЖУ по фотографии. удобно, когда нужно быстро понять порядок цифр по обычному снимку.', 'пришли чёткое фото блюда и, если знаешь, перечисли ингредиенты и вес'],
  ['ent_trainer', '💪 тренер', 'personal_assistant', 'собирает программу домашних или зальных тренировок под цель, опыт, доступное оборудование, график и желаемый темп нагрузки.', 'укажи цель, опыт, доступные дни, оборудование и известные ограничения'],
  ['ent_lila', '🎲 игра «лила»', 'psychologist', 'ведёт игру на поле из 72 клеток: ты формулируешь запрос, кубик задаёт ход, а ИИ-мастер разбирает выпавшую клетку в контексте вопроса.', 'сформулируй тему для игры и напиши, насколько глубокий разбор тебе комфортен'],
  ['ent_language_tutor', '🗣 языковой собеседник', 'language_teacher', 'устраивает живую разговорную практику на выбранном языке, подстраивает сложность, мягко исправляет ошибки и собирает полезный словарь.', 'назови язык, свой уровень, тему разговора и как часто тебя исправлять'],
  ['ent_meme_sticker', '🎭 мем-стикер', 'idea_generator', 'придумывает короткий мем или набор подписей для стикера под ситуацию, эмоцию и аудиторию, сохраняя текст читаемым и уместным.', 'опиши ситуацию, героя, настроение, формат и слова, которые нельзя использовать'],
  ['ent_story_quest', '🗺 сюжетный квест', 'screenwriter', 'ведёт интерактивное приключение короткими сценами, предлагает осмысленные варианты действий и сохраняет выбранный жанр без жестокого или опасного контента.', 'назови жанр, героя, место действия, желаемую длину и допустимый возрастной рейтинг'],
  ['ent_sound_postcard', '🎧 звуковая открытка', 'copywriter', 'пишет компактный сценарий звуковой открытки с репликой, атмосферой, музыкой и шумами, который затем можно передать в озвучку или монтаж.', 'назови адресата, повод, длительность, настроение, голос и желаемые звуки'],
  ['ent_visual_age', '🔢 визуальный возраст', 'idea_generator', 'даёт игровой диапазон воспринимаемого возраста и объясняет, какие детали образа создают такое впечатление, без оценки здоровья.', 'пришли фотографию и укажи, нужен бережный или шутливый разбор', 'это субъективное развлечение, а не биометрическая или медицинская оценка'],
  ['ent_quiz', '🧪 квиз', 'tutor', 'проводит короткий интерактивный квиз по выбранной теме, выдаёт вопросы по одному, считает очки и объясняет ответы после попытки.', 'назови тему, сложность, количество вопросов и формат вариантов ответа'],
  ['ent_chef', '👨‍🍳 повар', 'meal_planner', 'превращает список продуктов в выполнимый рецепт с заменами, временем, посудой и понятными шагами без вымышленных ингредиентов.', 'перечисли продукты, порции, технику, время и пищевые ограничения'],
  ['ent_diet_day', '🥗 меню на день', 'meal_planner', 'собирает меню на день под бюджет, предпочтения и доступное время: блюда, примерные порции, покупки и простой порядок готовки.', 'укажи число людей, бюджет, продукты дома, аллергии и время на готовку'],
  ['ent_story_oracle', '🔮 оракул историй', 'idea_generator', 'создаёт символическую мини-историю по вопросу пользователя и предлагает несколько интерпретаций для размышления.', 'задай вопрос и выбери атмосферу: добрая, загадочная, ироничная или эпическая'],
  ['ent_character_test', '🎭 тест персонажа', 'literary_analyst', 'проводит авторский тест и подбирает похожий типаж из выбранной вселенной, объясняя результат через ответы пользователя.', 'назови вселенную или жанр и выбери длину теста'],
  ['ent_party_game', '🎉 игра для компании', 'idea_generator', 'собирает безопасную игру для компании под количество людей, возраст, место и доступное время, с правилами и готовыми заданиями.', 'укажи число игроков, возраст, место, длительность и нежелательные темы']
];

export const ENTERTAINMENT_CATALOG = Object.freeze(raw.map(([id, name, targetAgentId, description, inputHint]) => Object.freeze({ id, name, targetAgentId, description, inputHint })));
const byId = new Map(ENTERTAINMENT_CATALOG.map((item) => [item.id, item]));
export const getEntertainmentById = (id) => byId.get(id) ?? null;

const popularIds = new Set([
  'ent_lila',
  'ent_congratulator',
  'ent_language_tutor',
  'ent_meme_sticker'
]);

const cardCopy = Object.freeze({
  ent_congratulator: 'соберём голосовую открытку вокруг конкретного человека: с личной деталью, своей интонацией и финалом, который хочется переслушать.',
  ent_calorie_estimator: 'пришли фото блюда, оценю размер порции, примерную калорийность и БЖУ.',
  ent_trainer: 'настроим тренировочный режим под реальную неделю: короткие занятия, системная программа или точечная работа над результатом.',
  ent_lila: 'поле состоит из 72 клеток. сформулируй запрос, бросай кубик и проходи путь вместе с ИИ-мастером. значение каждой клетки разбирается в контексте твоего вопроса.',
  ent_language_tutor: 'проведу живую разговорную практику, подстроюсь под твой уровень и разберу повторяющиеся ошибки.\n\n<b>выбери язык:</b>',
  ent_meme_sticker: 'собери заготовку для стикера: короткая фраза, герой из кадра или полноценная сцена с нужной реакцией.'
});

export function entertainmentAgentFor(itemOrId) {
  const item = typeof itemOrId === 'string' ? getEntertainmentById(itemOrId) : itemOrId;
  if (!item) return null;
  const base = getAgentById(item.targetAgentId);
  const interaction = entertainmentInteraction(item.id);
  const visual = ['ent_calorie_estimator', 'ent_visual_age'].includes(item.id);
  const requestedInteractionModel = interaction?.modelId ? getModelById(interaction.modelId) : null;
  const interactionModel = requestedInteractionModel?.category === 'llm'
    && AGENT_MODEL_ALLOWLIST.includes(interaction.modelId)
    ? interaction.modelId
    : null;
  const primaryModel = interactionModel ?? (visual ? 'qwen_3_vl' : base.primaryModel);
  const scenarioPrompts = Object.freeze({
    ent_congratulator: 'Ты создаёшь персональное поздравление для последующей озвучки: яркий заход, живые детали, естественная устная речь и сильная финальная фраза.',
    ent_calorie_estimator: 'Проанализируй одно фото блюда. Назови продукты, оцени размер порции, дай диапазон калорий и примерные белки, жиры и углеводы (БЖУ). Это не является медицинской оценкой. Ответ должен быть компактным и предметным.',
    ent_meme_sticker: 'Создай точный промпт для готового мем-стикера: главный объект, эмоция, чистый контур, простой фон и крупная читаемая подпись.'
  });
  return Object.freeze({
    ...base,
    id: item.id,
    name: item.name.replace(/^\S+\s+/u, ''),
    primaryModel,
    fallbackModels: (visual || interactionModel)
      ? Object.freeze([base.primaryModel, ...base.fallbackModels].filter((id, index, all) => id !== primaryModel && all.indexOf(id) === index).slice(0, 3))
      : base.fallbackModels,
    systemPrompt: `${base.systemPrompt}\n\n${interaction?.systemPrompt ?? scenarioPrompts[item.id] ?? `Ты работаешь в сценарии «${item.name}». ${item.description} Пользователь должен предоставить: ${item.inputHint}.`}`.trim()
  });
}

function rows(items, size = 2) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

export function buildEntertainmentMenu() {
  return {
    menuMediaKey: 'entertainment',
    text: '<b>🎰 развлечения</b>\n\nздесь можно сыграть с ИИ, придумать поздравление, собрать тренировку, потренировать язык или сделать мем-стикер. каждый сценарий ведёт по шагам и попросит только то, что нужно.\n\n<b>что попробовать</b>\n\n🎲 <b>игра «Лила»</b> — путь по игровому полю с ИИ-мастером\n\n🎙 <b>поздравлятор</b> — персональное аудиопоздравление\n\n🗣 <b>изучение языков</b> — разговорная практика и прогресс\n\n🎭 <b>мем-стикер</b> — стикер по описанию или фото\n\n<blockquote>*звёздами отмечены самые популярные развлечения на данный момент</blockquote>',
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      ...rows(ENTERTAINMENT_CATALOG.map(({ id, name }) => ({
        text: popularIds.has(id) ? name.replace(/^([^\s]+)\s/u, '$1 ★ ') : name,
        callback_data: `ent:card:${id}`
      }))),
      [{ text: '👤 профиль', callback_data: 'task:profile' }],
      [{ text: '‹ назад', callback_data: 'task:menu' }, { text: '🏠 главное меню', callback_data: 'task:menu' }]
    ] }
  };
}

export function buildEntertainmentCard(itemOrId) {
  const item = typeof itemOrId === 'string' ? getEntertainmentById(itemOrId) : itemOrId;
  if (!item) return buildEntertainmentMenu();
  const agent = entertainmentAgentFor(item);
  const price = calculateAgentRunPrice(agent);
  const description = cardCopy[item.id] ?? item.description;
  const interactive = buildInteractiveEntertainmentStart(item.id);
  if (interactive) {
    return Object.freeze({
      ...interactive,
      text: `${interactive.text}\n\n<b>стоимость: ${metacoinHtml()} ${price} метакоинов</b>`
    });
  }
  return {
    text: `<b>${item.name}</b>\n\n${description}\n\n<b>стоимость: ${metacoinHtml()} ${price} метакоинов</b>`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [{ text: '📝 начать', callback_data: `ent:use:${item.id}` }],
      [{ text: '👤 профиль', callback_data: 'task:profile' }],
      [{ text: '‹ назад к развлечениям', callback_data: 'ent:home' }, { text: '🏠 главное меню', callback_data: 'task:menu' }]
    ] }
  };
}

export function buildEntertainmentSelectedMessage(itemOrId) {
  const item = typeof itemOrId === 'string' ? getEntertainmentById(itemOrId) : itemOrId;
  if (!item) return buildEntertainmentMenu();
  return {
    text: `<b>${item.name}</b>\n\nсценарий включён. ${item.inputHint}👇`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [{ text: '👤 профиль', callback_data: 'task:profile' }],
      [{ text: '‹ назад к карточке', callback_data: `ent:card:${item.id}` }, { text: '🏠 главное меню', callback_data: 'task:menu' }]
    ] }
  };
}
