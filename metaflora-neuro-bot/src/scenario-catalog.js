const FACE_SWAP_INSTRUCTION = 'Перенеси лицо с первого изображения на человека на втором изображении. Сохрани позу, выражение, освещение, ракурс, волосы и остальные детали целевого кадра.';

const scenarios = [
  {
    id: 'create_image',
    name: '🎨 создать изображение',
    targetId: 'photo_generate',
    description: 'Создай новый визуал по описанию: от быстрого эскиза до готовой иллюстрации, карточки товара или рекламного кадра. Пропорции, разрешение и число вариантов настраиваются перед запуском.',
    instruction: 'Опиши сюжет, композицию, стиль, свет и точные надписи, если они нужны.'
  },
  {
    id: 'face_swap',
    name: '🎭 заменить лицо',
    targetId: 'photo_edit',
    description: 'Перенеси лицо с первого изображения на человека во втором кадре. Сценарий использует реальное редактирование Nano Banana 2 и заранее добавляет точную инструкцию, чтобы сохранить позу, свет и окружение цели.',
    instruction: 'Отправь два фото одним сообщением: сначала источник лица, затем целевой кадр.',
    presetInput: Object.freeze({ text: FACE_SWAP_INSTRUCTION })
  },
  {
    id: 'try_on',
    name: '👕 примерить одежду',
    targetId: 'photo_try_on',
    description: 'Покажи выбранную вещь на фотографии человека с учётом его позы и типа одежды. Для результата используются отдельные исходники человека и вещи, поэтому фоновые фотографии товара не подменяют кадр человека.',
    instruction: 'Отправь фото человека и отдельное фото вещи, затем выбери тип одежды.'
  },
  {
    id: 'remove_background',
    name: '✂️ удалить фон',
    targetId: 'photo_remove_bg',
    description: 'Отдели главный объект от окружения и получи изображение без исходного фона. Сценарий подходит для карточек товара, портретов, коллажей и дальнейшего монтажа в другом редакторе.',
    instruction: 'Отправь одно изображение с объектом, который нужно сохранить.'
  },
  {
    id: 'remove_object',
    name: '🧹 убрать объект',
    targetId: 'photo_object_remove',
    description: 'Удали лишний предмет или деталь по текстовому описанию, а освободившуюся область восстанови по соседнему изображению. Можно отдельно выбрать качество и расширение рабочей области вокруг объекта.',
    instruction: 'Отправь фото и точно назови объект, который нужно убрать.'
  },
  {
    id: 'animate_photo',
    name: '🪄 оживить фото',
    targetId: 'video_image_to_video',
    description: 'Преврати исходное изображение в короткий ролик с управляемым движением, звуком и описанием сцены. Сценарий использует Kling Video 3 Pro и сохраняет исходный кадр как визуальную основу.',
    instruction: 'Отправь изображение и опиши движение героя, камеры и окружения.'
  },
  {
    id: 'edit_video',
    name: '✂️ изменить видео',
    targetId: 'video_edit',
    description: 'Измени готовый ролик по текстовой инструкции, сохранив его движение и работу камеры. При необходимости добавь изображения-референсы и отдельно реши, оставлять ли исходную звуковую дорожку.',
    instruction: 'Отправь видео, опиши изменения и при необходимости приложи изображения-референсы.'
  }
];

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

export const SCENARIO_CATALOG = deepFreeze(scenarios);
const scenariosById = new Map(SCENARIO_CATALOG.map((scenario) => [scenario.id, scenario]));

export function getScenarioById(id) {
  return scenariosById.get(id) ?? null;
}

export function buildScenarioCatalogMessage() {
  const buttons = SCENARIO_CATALOG.map(({ id, name }) => ({
    text: name,
    callback_data: `scenario:${id}`
  }));
  return {
    text: '<b>🎯 готовые сценарии</b>\n\nвыбери задачу, а бот откроет подходящую рабочую модель с уже понятным порядком исходников. это короткие маршруты поверх общего каталога, а не дубли моделей и инструментов.',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...Array.from({ length: Math.ceil(buttons.length / 2) }, (_, index) => (
          buttons.slice(index * 2, index * 2 + 2)
        )),
        [{ text: '‹ назад к инструментам', callback_data: 'modelcat:tools' }]
      ]
    }
  };
}

export function buildScenarioMessage(scenarioOrId) {
  const scenario = typeof scenarioOrId === 'string'
    ? getScenarioById(scenarioOrId)
    : scenarioOrId;
  if (!scenario) return buildScenarioCatalogMessage();
  return {
    text: `<b>${scenario.name}</b>\n\n${scenario.description}\n\n<b>что отправить</b>\n${scenario.instruction}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'начать', callback_data: `scenario:use:${scenario.id}` }],
        [{ text: '‹ назад к сценариям', callback_data: 'scenarios:home' }]
      ]
    }
  };
}

export function applyScenarioTelegramInput(scenario, telegramInput) {
  if (!scenario?.presetInput) return telegramInput;
  const messages = Array.isArray(telegramInput) ? telegramInput : [telegramInput];
  return [{ ...scenario.presetInput }, ...messages];
}

export function validateScenarioInputs(scenario, inputs) {
  if (scenario?.id !== 'face_swap') return;
  if (!Array.isArray(inputs?.images) || inputs.images.length !== 2) {
    throw new RangeError('Face swap requires exactly two images.');
  }
}
