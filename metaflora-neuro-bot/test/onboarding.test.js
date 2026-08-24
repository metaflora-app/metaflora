import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCategoryPrompt, buildWelcomeMessage, menuKeyboard } from '../src/onboarding.js';

test('welcome keeps the user in a task-first flow', () => {
  const welcome = buildWelcomeMessage('Илья', 'mishchenko_is');

  assert.match(welcome.text, /^👋 <b>добро пожаловать,<\/b>\n<a href="https:\/\/t\.me\/mishchenko_is">@mishchenko_is<\/a>/);
  assert.match(welcome.text, /МЕТАФЛОРА\* нейро — крупнейший агрегатор нейросетей в СНГ/);
  assert.match(welcome.text, /более 400 моделей и ИИ-инструментов/);
  assert.match(welcome.text, /@metaflora_support/);
  assert.match(welcome.text, /выбери нужный раздел👇/);
  assert.match(welcome.text, /<blockquote>команда \/welcome вызовет ИИ-помощника\./);
  assert.match(welcome.text, /возможност(?:ях|ями) агрегатора/);
  assert.equal(welcome.parse_mode, 'HTML');
  assert.doesNotMatch(welcome.text, /модель выбирается вручную/);
  assert.equal(welcome.reply_markup.inline_keyboard, undefined);
  assert.ok(Array.isArray(welcome.reply_markup.keyboard));
  assert.equal(welcome.reply_markup.resize_keyboard, true);
  assert.equal(welcome.reply_markup.is_persistent, true);
  assert.equal(welcome.reply_markup.one_time_keyboard, false);
  assert.deepEqual(welcome.reply_markup.keyboard, menuKeyboard());
  assert.deepEqual(welcome.link_preview_options, { is_disabled: true });
  assert.deepEqual(menuKeyboard().flat().map((button) => button.text.replace(/^🪙 /, '')), [
    '👤 профиль',
    'пополнить баланс',
    '💬 текст / код / поиск',
    '🎨 изображения',
    '🎬 видео',
    '🎧 аудио / музыка',
    '🎙 озвучка / расшифровка',
    '🧪 бета-модели',
    '🪄 ИИ-инструменты',
    '🤖 ИИ-агенты',
    '🎰 развлечения',
    '👥 пригласить друга',
    '🧯 поддержка',
    '📡 канал фаундера'
  ]);
  const withoutAllowedCaps = (text) => text
    .replaceAll('метафлора', '')
    .replaceAll('СНГ', '')
    .replaceAll('ИИ', '')
    .replaceAll('МЕТАФЛОРА', '')
    .replaceAll('ИИ', '');
  assert.ok(menuKeyboard().flat().every(({ text }) => !/[А-ЯЁ]/.test(withoutAllowedCaps(text))));
  assert.doesNotMatch(withoutAllowedCaps(welcome.text), /[А-ЯЁ]/);
  assert.ok(menuKeyboard().flat().every((button) => button.callback_data === undefined));
  assert.ok(menuKeyboard().flat().every((button) => button.style === undefined));
});

test('each onboarding category asks only for the next required input', () => {
  assert.match(buildCategoryPrompt('video').text, /из текста, из фото или с референсами/i);
  assert.match(buildCategoryPrompt('audio').text, /озвучить текст, расшифровать запись или написать трек/i);
  assert.equal(buildCategoryPrompt('unknown').text, buildWelcomeMessage().text);
});
