import test from 'node:test';
import assert from 'node:assert/strict';

import { createUpdateHandler } from '../src/bot.js';

function telegramMock() {
  const sent = [];
  const edited = [];
  return {
    sent,
    edited,
    async sendMessage(chatId, message) {
      sent.push({ chatId, message });
      return { message_id: sent.length + 100 };
    },
    async editMessageText(chatId, messageId, message) {
      edited.push({ chatId, messageId, message });
      return { message_id: messageId };
    },
    async deleteMessage() {},
    async answerCallbackQuery() {}
  };
}

const callback = (id, data) => ({
  update_id: id,
  callback_query: {
    id: `callback-${id}`,
    data,
    from: { id: 10 },
    message: { message_id: 77, chat: { id: 10 } }
  }
});

test('video flow checks the default mode and launches only after done', async () => {
  const telegram = telegramMock();
  const handle = createUpdateHandler({ telegram, config: {} });

  await handle(callback(1, 'model:seedance_25'));
  assert.ok(telegram.edited.at(-1).message.reply_markup.inline_keyboard.flat().some(
    ({ callback_data }) => callback_data === 'video:new:_'
  ));

  await handle(callback(2, 'video:new:_'));
  assert.match(telegram.edited.at(-1).message.text, /выбери режим работы/u);
  assert.ok(telegram.edited.at(-1).message.reply_markup.inline_keyboard.flat().some(
    ({ text }) => /^✓ .*текст → видео/u.test(text)
  ));

  await handle(callback(3, 'video:choose:first_frame'));
  assert.match(telegram.edited.at(-1).message.text, /^<b>⚙️ параметры Seedance 2\.5<\/b>/u);
  assert.match(telegram.edited.at(-1).message.text, /<b>первый кадр:<\/b>/u);
  assert.match(telegram.edited.at(-1).message.text, /<b>длительность:<\/b> 8 сек/u);
  assert.ok(telegram.edited.at(-1).message.reply_markup.inline_keyboard.flat().some(
    ({ callback_data }) => callback_data === 'video:slot:first'
  ));
  assert.ok(telegram.edited.at(-1).message.reply_markup.inline_keyboard.flat().some(
    ({ callback_data }) => callback_data === 'video:done'
  ));
  assert.ok(!telegram.edited.at(-1).message.reply_markup.inline_keyboard.flat().some(
    ({ callback_data }) => callback_data === 'video:generate'
  ));
  assert.ok(!telegram.edited.at(-1).message.reply_markup.inline_keyboard.flat().some(
    ({ callback_data, text }) => callback_data === 'video:settings' || /управление/u.test(text)
  ));
  await handle(callback(4, 'video:options:duration'));
  assert.match(telegram.edited.at(-1).message.text, /^<b>⏱ длительность:<\/b> выбери значение/u);
  assert.ok(telegram.edited.at(-1).message.reply_markup.inline_keyboard.flat().some(
    ({ text }) => text === '✓ 8 сек'
  ));
  await handle(callback(5, 'video:set:duration:12'));
  assert.match(telegram.edited.at(-1).message.text, /<b>длительность:<\/b> 12 сек/u);
  await handle(callback(6, 'video:change'));
  assert.match(telegram.edited.at(-1).message.text, /выбери режим работы/u);
  await handle(callback(7, 'video:return'));
  assert.match(telegram.edited.at(-1).message.text, /<b>первый кадр:<\/b>/u);
  await handle({
    update_id: 8,
    message: {
      message_id: 7,
      chat: { id: 10 },
      from: { id: 10 },
      photo: [{ file_id: 'too-small', width: 738, height: 194 }]
    }
  });

  assert.ok(telegram.edited.length >= 2);
  assert.match(telegram.sent.at(-1).message.text, /минимум 300×300/u);
  assert.match(telegram.sent.at(-1).message.text, /<b>первый кадр:<\/b> не добавлен/u);
});

test('Seedance 2.5 reference uploads stay on a separate upload message', async () => {
  const telegram = telegramMock();
  const handle = createUpdateHandler({ telegram, config: {} });

  await handle(callback(10, 'model:seedance_25'));
  await handle(callback(11, 'video:new:_'));
  await handle(callback(12, 'video:choose:references'));
  const parameters = telegram.edited.at(-1).message;
  assert.match(parameters.text, /^<b>⚙️ параметры Seedance 2\.5<\/b>/u);
  assert.match(parameters.text, /<b>изображения<\/b>, <b>видео<\/b> и <b>аудио<\/b>/u);
  assert.equal(parameters.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'video:reset' || callback_data === 'video:done'), true);

  await handle(callback(13, 'video:references'));
  const uploadCard = telegram.sent.at(-1).message;
  assert.match(uploadCard.text, /^<b>🎞 референсы Seedance 2\.5<\/b>/u);
  assert.match(uploadCard.text, /<b>изображение, видео и аудио<\/b>/u);
  assert.match(uploadCard.text, /<b>до 50 референсов<\/b>/u);
  assert.equal(uploadCard.reply_markup.inline_keyboard.flat()
    .some(({ callback_data = '' }) => callback_data.startsWith('video:slot:reference_')), false);

  await handle({
    update_id: 14,
    message: {
      message_id: 14,
      chat: { id: 10 },
      from: { id: 10 },
      audio: { file_id: 'voice-ref', duration: 12, file_size: 1024 }
    }
  });
  const updatedUpload = telegram.sent.at(-1).message;
  assert.match(updatedUpload.text, /^<b>🎞 референсы Seedance 2\.5<\/b>/u);
  assert.match(updatedUpload.text, /<b>аудио:<\/b> 1/u);
  assert.doesNotMatch(updatedUpload.text, /^<b>⚙️ параметры/u);
});
