const categoryMessages = Object.freeze({
  text: '📝 текст\nчто написать: пост, письмо, план, код или другое?\n\nможешь просто прислать задачу сообщением.',
  image: '🎨 картинка\nчто создаем: аватар, товар, постер, стиль или редактирование фото?\n\nможно прислать описание или фото-референс.',
  video: '🎬 видео\nиз текста, из фото или с референсами?\n\nвыберем fast или quality уже после задачи.',
  audio: '🎧 голос / музыка\nозвучить текст, расшифровать запись или написать трек?\n\nпришли текст либо аудиофайл.',
  models: '🤖 выбор модели\nдля чего нужна модель?\n\nпокажу варианты: дешевле, быстрее или лучший результат.'
});

export function menuKeyboard() {
  return [
    [{ text: '👤 профиль' }],
    [{ text: '🪙 пополнить баланс' }],
    [
      { text: '💬 текст / код / поиск' },
      { text: '🎨 изображения' }
    ],
    [
      { text: '🎬 видео' },
      { text: '🎧 аудио / музыка' }
    ],
    [{ text: '🎙 озвучка / расшифровка' }],
    [
      { text: '🧪 бета-модели' },
      { text: '🪄 ИИ-инструменты' }
    ],
    [{ text: '🤖 ИИ-агенты' }, { text: '🎰 развлечения' }],
    [
      { text: '👥 пригласить друга' },
      { text: '🧯 поддержка' }
    ],
    [{ text: '📡 канал фаундера' }]
  ];
}

export function buildWelcomeMessage(firstName = '', username = '') {
  const safeUsername = /^[a-zA-Z0-9_]{5,32}$/.test(username) ? username : '';
  const safeFirstName = String(firstName).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const greeting = safeUsername
    ? `👋 <b>добро пожаловать,</b>\n<a href="https://t.me/${safeUsername}">@${safeUsername}</a>`
    : `👋 <b>добро пожаловать${safeFirstName ? `, ${safeFirstName}` : ''}</b>`;

  return {
    text: `${greeting}\n\nМЕТАФЛОРА* нейро — крупнейший агрегатор нейросетей в СНГ. более 400 моделей и ИИ-инструментов с прозрачными ценами.\n\nподдержка через <a href="https://t.me/metaflora_support">@metaflora_support</a> с 10:00 до 18:00 (utc+3)\n\nвыбери нужный раздел👇\n\n<blockquote>команда /welcome вызовет ИИ-помощника. он поможет разобраться в возможностях агрегатора.</blockquote>`,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      keyboard: menuKeyboard(),
      resize_keyboard: true,
      is_persistent: true,
      one_time_keyboard: false
    }
  };
}

export function buildCategoryPrompt(category) {
  const text = categoryMessages[category];
  return text ? { text } : buildWelcomeMessage();
}
