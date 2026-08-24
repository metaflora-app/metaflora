import test from 'node:test';
import assert from 'node:assert/strict';

import { BOT_COMMANDS, createUpdateHandler } from '../src/bot.js';
import { menuKeyboard } from '../src/onboarding.js';
import { createReferralService } from '../src/referral-service.js';
import { clearCuratedVoices, setCuratedVoices } from '../src/voice-library.js';

function createTelegramMock() {
  const deliveries = [];
  return {
    deliveries,
    async sendMessage(chatId, message) {
      const result = { message_id: deliveries.length + 100 };
      deliveries.push({ chatId, message, result, method: 'sendMessage' });
      return result;
    },
    async editMessageText(chatId, messageId, message) {
      const result = { message_id: messageId };
      deliveries.push({ chatId, message, result, method: 'editMessageText' });
      return result;
    },
    async deleteMessage() {
      return true;
    },
    async answerCallbackQuery() {
      return true;
    },
    async setMyCommands() {
      return true;
    }
  };
}

function privateMessage(updateId, text) {
  return {
    update_id: updateId,
    message: {
      message_id: updateId,
      chat: { id: 10, type: 'private' },
      from: { id: 10, username: 'operation_tester', first_name: 'Тест' },
      text
    }
  };
}

function callback(updateId, data) {
  return {
    update_id: updateId,
    callback_query: {
      id: `callback-${updateId}`,
      data,
      from: { id: 10, username: 'operation_tester', first_name: 'Тест' },
      message: {
        message_id: 77,
        chat: { id: 10, type: 'private' }
      }
    }
  };
}

function assertScreen(screen, label) {
  assert.ok(screen, `${label}: экран не отрисован`);
  assert.equal(typeof screen.text, 'string', `${label}: нет текста`);
  assert.ok(screen.text.length > 0 && screen.text.length <= 4096, `${label}: неверная длина`);
  assert.doesNotMatch(screen.text, /не получилось обработать запрос/i, label);

  for (const row of screen.reply_markup?.inline_keyboard ?? []) {
    assert.ok(row.length > 0 && row.length <= 8, `${label}: неверная строка кнопок`);
    for (const button of row) {
      if (button.callback_data) {
        assert.ok(Buffer.byteLength(button.callback_data, 'utf8') <= 64, button.callback_data);
      }
    }
  }
}

const COMMAND_MATRIX = Object.freeze([
  ['/start', /МЕТАФЛОРА\* нейро/u],
  ['/menu', /МЕТАФЛОРА\* нейро/u],
  ['/back', /МЕТАФЛОРА\* нейро/u],
  ['/welcome', /ИИ-помощник/u],
  ['/text', /текст \/ код \/ поиск/u],
  ['/design', /изображения/u],
  ['/video', /видео/u],
  ['/audio', /музыка/u],
  ['/voice', /озвучка \/ расшифровка/u],
  ['/tools', /ИИ-инструменты/u],
  ['/agents', /ИИ-агенты/u],
  ['/fun', /развлечения/u],
  ['/settings', /настройки/u],
  ['/dialogs', /история диалогов/u],
  ['/profile', /профиль/u],
  ['/balance', /баланс/u],
  ['/paysupport', /поддержка/u],
  ['/channel', /канал фаундера/u],
  ['/support', /поддержка/u],
  ['/icons', /команда недоступна/u]
]);

const CALLBACK_MATRIX = Object.freeze([
  ['task:menu', /МЕТАФЛОРА\* нейро/u],
  ['task:profile', /профиль/u],
  ['task:support', /поддержка/u],
  ['task:founder-channel', /канал фаундера/u],
  ['task:invite', /реферальная программа/u],
  ['task:balance', /баланс/u],
  ['task:settings', /настройки/u],
  ['task:models', /текст \/ код \/ поиск/u],
  ['task:text', /текст \/ код \/ поиск/u],
  ['task:image', /изображения/u],
  ['task:video', /видео/u],
  ['task:audio', /музыка/u],
  ['task:voice', /озвучка \/ расшифровка/u],
  ['task:tools', /ИИ-инструменты/u],
  ['task:agents', /ИИ-агенты/u],
  ['task:russian', /Yandex/u],
  ['task:beta', /бета-модели/u],
  ['audiostudio:home', /музыка, голос и звук/u],
  ['audiostudio:music', /музыка и звук/u],
  ['audiostudio:voice', /голос и речь/u],
  ['audiocategory:music_create', /создать музыку/u],
  ['audiocategory:voice_speak', /озвучить текст/u],
  ['audioworkflow:voice_tts', /озвучить текст/u],
  ['audiosettings:voice_tts', /параметры/u],
  ['audiomodels:audio', /музыка/u],
  ['audiomodels:voice', /голос и речь/u],
  ['voicelib:0', /библиотека голосов/u],
  ['ref:home', /реферальная программа/u],
  ['ref:people', /мои рефералы/u],
  ['ref:earnings', /начисления/u],
  ['ref:levels', /уровни реферальной программы/u],
  ['ref:withdraw', /вывод/u],
  ['prefs:language', /язык ответов/u],
  ['prefs:length', /объём ответа/u],
  ['prefs:set:language:ru', /настройки/u],
  ['billing:home', /баланс/u],
  ['billing:plans:profile', /тариф/u],
  ['billing:planinfo:author:profile', /автор/u],
  ['billing:packages:balance', /метакоин/u],
  ['billing:history:profile', /история операций/u],
  ['billing:promo:profile', /промокод/u],
  ['billing:plan:author:1:profile', /тариф/u],
  ['billing:package:coins_150:balance', /метакоин/u],
  ['billing:checkout:plan:author:1:profile', /платёж/u],
  ['modelcat:llm', /текст \/ код \/ поиск/u],
  ['modelcat:image', /изображения/u],
  ['modelcat:video', /видео/u],
  ['modelcat:audio', /музыка/u],
  ['modelcat:voice', /озвучка \/ расшифровка/u],
  ['modelcat:tools', /ИИ-инструменты/u],
  ['toolcat:image', /фото/u],
  ['toolcat:video', /видео/u],
  ['toolcat:document', /документы/u],
  ['toolcat:3d', /3D/u],
  ['agents:home', /ИИ-агенты/u],
  ['agentcat:business', /для бизнеса/u],
  ['family:openai', /GPT/u],
  ['family:glm', /^<b>GLM<\/b>/u],
  ['family:other', /^<b>open-source<\/b>/u],
  ['model:gpt_oss_20b_free', /gpt-oss-20b free/u],
  ['dialog:new', /текст \/ код \/ поиск/u]
]);

test('operation matrix lists every public command plus internal start/back/icon flows', () => {
  const matrixCommands = new Set(COMMAND_MATRIX.map(([command]) => command.slice(1)));
  assert.deepEqual(
    BOT_COMMANDS.map(({ command }) => command),
    BOT_COMMANDS.map(({ command }) => command).filter((command) => matrixCommands.has(command))
  );
  assert.equal(new Set(COMMAND_MATRIX.map(([command]) => command)).size, COMMAND_MATRIX.length);
});

test('every slash command renders a valid screen without provider calls or metacoin debit', async (t) => {
  for (const [index, [command, expected]] of COMMAND_MATRIX.entries()) {
    await t.test(command, async () => {
      const telegram = createTelegramMock();
      const referralService = createReferralService();
      let providerCalls = 0;
      let debitCalls = 0;
      const service = {
        ...referralService,
        debitMetacoins(payload) {
          debitCalls += 1;
          return referralService.debitMetacoins(payload);
        }
      };
      const handler = createUpdateHandler({
        telegram,
        referralService: service,
        config: { botOwnerId: '999', providerTestMode: true },
        invokeLlm: async () => {
          providerCalls += 1;
          return { text: 'не должен вызываться' };
        },
        invokeTool: async () => {
          providerCalls += 1;
          return { type: 'image', url: 'https://example.test/never.png' };
        }
      });

      await handler(privateMessage(10_000 + index, command));

      const screen = telegram.deliveries.at(-1)?.message;
      assertScreen(screen, command);
      assert.match(screen.text, expected, command);
      assert.equal(providerCalls, 0, command);
      assert.equal(debitCalls, 0, command);
      referralService.close();
    });
  }
});

test('every permanent device-menu action maps to a real operation without provider calls', async (t) => {
  const labels = menuKeyboard().flat().map(({ text }) => text);
  assert.equal(new Set(labels).size, labels.length);

  for (const [index, label] of labels.entries()) {
    await t.test(label, async () => {
      const telegram = createTelegramMock();
      const referralService = createReferralService();
      let providerCalls = 0;
      const handler = createUpdateHandler({
        telegram,
        referralService,
        config: { providerTestMode: true },
        invokeLlm: async () => {
          providerCalls += 1;
          return { text: 'не должен вызываться' };
        }
      });

      await handler(privateMessage(11_000 + index, label));

      assertScreen(telegram.deliveries.at(-1)?.message, label);
      assert.equal(providerCalls, 0, label);
      referralService.close();
    });
  }
});

test('navigation callback matrix renders its destination without paid side effects', async (t) => {
  for (const [index, [data, expected]] of CALLBACK_MATRIX.entries()) {
    await t.test(data, async () => {
      const telegram = createTelegramMock();
      const referralService = createReferralService();
      let providerCalls = 0;
      let debitCalls = 0;
      const service = {
        ...referralService,
        debitMetacoins(payload) {
          debitCalls += 1;
          return referralService.debitMetacoins(payload);
        }
      };
      const handler = createUpdateHandler({
        telegram,
        referralService: service,
        config: { providerTestMode: true },
        invokeLlm: async () => {
          providerCalls += 1;
          return { text: 'не должен вызываться' };
        },
        invokeTool: async () => {
          providerCalls += 1;
          return { type: 'image', url: 'https://example.test/never.png' };
        }
      });

      await handler(callback(12_000 + index, data));

      const screen = telegram.deliveries.at(-1)?.message;
      assertScreen(screen, data);
      assert.match(screen.text, expected, data);
      assert.equal(providerCalls, 0, data);
      assert.equal(debitCalls, 0, data);
      referralService.close();
    });
  }
});

test('unknown, malformed and stale callbacks are acknowledged without provider or billing calls', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralService();
  let providerCalls = 0;
  let debitCalls = 0;
  const handler = createUpdateHandler({
    telegram,
    referralService: {
      ...referralService,
      debitMetacoins(payload) {
        debitCalls += 1;
        return referralService.debitMetacoins(payload);
      }
    },
    config: { providerTestMode: true },
    invokeLlm: async () => {
      providerCalls += 1;
      return { text: 'не должен вызываться' };
    }
  });

  for (const [index, data] of [
    '',
    'unknown:route',
    'billing:plan:missing:1:profile',
    'billing:package:missing:balance',
    'agent:missing',
    'model:missing',
    'prefs:set:unknown:value',
    'settings:reset:missing'
  ].entries()) {
    await handler(callback(13_000 + index, data));
  }

  assert.equal(providerCalls, 0);
  assert.equal(debitCalls, 0);
  referralService.close();
});

test('parallel retry of one voice request invokes, debits and delivers exactly once', async (t) => {
  const voiceId = 'elv_000000000000000000000001';
  setCuratedVoices(Object.freeze(Array.from({ length: 80 }, (_, index) => Object.freeze({
    id: `elv_${String(index + 1).padStart(24, '0')}`,
    name: `Голос ${index + 1}`,
    description: 'голос для проверки идемпотентной озвучки',
    category: 'premade',
    labels: Object.freeze({ language: 'русский', accent: 'нейтральный' }),
    preview: Object.freeze({
      type: 'id',
      value: `voice-preview-elv_${String(index + 1).padStart(24, '0')}`
    })
  }))));
  t.after(() => clearCuratedVoices());

  let resolveSpeech;
  let providerCalls = 0;
  let audioDeliveries = 0;
  const debits = new Map();
  const account = {
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2027-01-01T00:00:00.000Z',
    metacoinBalance: 1_000
  };
  const telegram = {
    ...createTelegramMock(),
    async sendAudio() {
      audioDeliveries += 1;
      return { message_id: 900 + audioDeliveries };
    }
  };
  const handler = createUpdateHandler({
    telegram,
    config: {},
    now: () => Date.parse('2026-07-27T00:00:00.000Z'),
    referralService: {
      registerUser({ id }) { return { telegramId: String(id) }; },
      markStarted() {},
      account() { return { ...account }; },
      debitMetacoins(payload) {
        if (debits.has(payload.requestKey)) {
          return { ...debits.get(payload.requestKey), status: 'duplicate' };
        }
        account.metacoinBalance -= payload.amount;
        const result = {
          status: 'debited',
          amount: payload.amount,
          balance: account.metacoinBalance
        };
        debits.set(payload.requestKey, result);
        return result;
      }
    },
    voiceService: {
      textToSpeech() {
        providerCalls += 1;
        return new Promise((resolve) => {
          resolveSpeech = resolve;
        });
      }
    }
  });

  await handler(callback(14_000, `voiceuse:${voiceId}`));
  const initial = handler(privateMessage(14_001, 'Один и тот же текст.'));
  await new Promise((resolve) => setImmediate(resolve));
  const retry = handler(callback(14_002, `voicegenerate:${voiceId}:14001`));
  resolveSpeech({ audio: Buffer.from('mp3'), contentType: 'audio/mpeg' });
  await Promise.all([initial, retry]);

  assert.equal(providerCalls, 1);
  assert.equal(debits.size, 1);
  assert.equal(audioDeliveries, 1);
});

test('failed voice delivery releases its claim and retries the cached MP3 without a second debit', async (t) => {
  const voiceId = 'elv_000000000000000000000001';
  setCuratedVoices(Object.freeze(Array.from({ length: 80 }, (_, index) => Object.freeze({
    id: `elv_${String(index + 1).padStart(24, '0')}`,
    name: `Голос ${index + 1}`,
    description: 'голос для проверки повторной доставки',
    category: 'premade',
    labels: Object.freeze({ language: 'русский', accent: 'нейтральный' }),
    preview: Object.freeze({
      type: 'id',
      value: `voice-preview-elv_${String(index + 1).padStart(24, '0')}`
    })
  }))));
  t.after(() => clearCuratedVoices());

  let providerCalls = 0;
  let deliveryAttempts = 0;
  let successfulDeliveries = 0;
  let debitCalls = 0;
  const telegram = {
    ...createTelegramMock(),
    async sendAudio() {
      deliveryAttempts += 1;
      if (deliveryAttempts === 1) throw new Error('temporary Telegram failure');
      successfulDeliveries += 1;
      return { message_id: 901 };
    }
  };
  const handler = createUpdateHandler({
    telegram,
    config: {},
    now: () => Date.parse('2026-07-27T00:00:00.000Z'),
    referralService: {
      registerUser({ id }) { return { telegramId: String(id) }; },
      markStarted() {},
      account() {
        return {
          subscriptionPlanId: 'author',
          subscriptionExpiresAt: '2027-01-01T00:00:00.000Z',
          metacoinBalance: 1_000
        };
      },
      debitMetacoins({ amount, requestKey }) {
        debitCalls += 1;
        return {
          status: debitCalls === 1 ? 'debited' : 'duplicate',
          requestKey,
          amount,
          balance: 1_000 - amount
        };
      }
    },
    voiceService: {
      async textToSpeech() {
        providerCalls += 1;
        return { audio: Buffer.from('mp3'), contentType: 'audio/mpeg' };
      }
    }
  });

  await handler(callback(15_000, `voiceuse:${voiceId}`));
  await handler(privateMessage(15_001, 'Текст с повторной доставкой.'));
  await handler(callback(15_002, `voicegenerate:${voiceId}:15001`));

  assert.equal(providerCalls, 1);
  assert.equal(deliveryAttempts, 2);
  assert.equal(successfulDeliveries, 1);
  assert.equal(debitCalls, 2);
});
