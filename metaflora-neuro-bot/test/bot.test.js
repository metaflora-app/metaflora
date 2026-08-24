import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  BOT_COMMANDS,
  createUpdateHandler,
  registerBotCommands,
  sanitizeStoredModelSettings
} from '../src/bot.js';
import { AppStateRepository } from '../src/app-state-repository.js';
import { createReferralService } from '../src/referral-service.js';
import { menuKeyboard } from '../src/onboarding.js';
import {
  calculateModelMetacoinPrice,
  getModelById,
  listCatalogModels
} from '../src/model-catalog.js';
import { listAgents } from '../src/agent-catalog.js';
import { calculateAgentRunPrice } from '../src/agent-economics.js';
import {
  calculateToolMetacoinPrice,
  getToolModelById
} from '../src/tool-model-adapter.js';
import { ProviderRequestError } from '../src/request-errors.js';
import { clearCuratedVoices, setCuratedVoices } from '../src/voice-library.js';
import { WELCOME_AGENT_MODEL } from '../src/welcome-agent.js';

function createTelegramMock(overrides = {}) {
  const sent = [];
  const deleted = [];
  const events = [];
  return {
    sent,
    deleted,
    events,
    async sendMessage(chatId, message) {
      const result = { message_id: sent.length + 100 };
      sent.push({ chatId, message, result });
      events.push({ type: 'send', chatId, messageId: result.message_id });
      return result;
    },
    async deleteMessage(chatId, messageId) {
      deleted.push({ chatId, messageId });
      events.push({ type: 'delete', chatId, messageId });
      return true;
    },
    async answerCallbackQuery() {},
    async setMyCommands() {},
    ...overrides
  };
}

const flushAsyncWork = () => new Promise((resolve) => setImmediate(resolve));

function createPaidReferralService(initialBalance = 10_000) {
  const account = {
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2027-01-01T00:00:00.000Z',
    metacoinBalance: initialBalance
  };
  const debits = new Map();
  return {
    registerUser({ id }) { return { telegramId: String(id) }; },
    markStarted() {},
    account() { return { ...account }; },
    debitMetacoins({ amount, requestKey }) {
      if (debits.has(requestKey)) return { status: 'duplicate', balance: account.metacoinBalance };
      account.metacoinBalance -= amount;
      debits.set(requestKey, amount);
      return { status: 'debited', balance: account.metacoinBalance };
    }
  };
}

function assertValidTelegramScreen(message) {
  assert.ok(message);
  assert.equal(typeof message.text, 'string');
  assert.ok(message.text.length > 0);
  assert.ok(message.text.length <= 4096, `message is ${message.text.length} characters`);

  const rows = message.reply_markup?.inline_keyboard ?? [];
  for (const row of rows) {
    assert.ok(row.length > 0 && row.length <= 8);
    for (const button of row) {
      assert.equal(typeof button.text, 'string');
      assert.ok(button.text.length > 0);
      const actions = ['callback_data', 'url', 'switch_inline_query', 'web_app']
        .filter((key) => button[key] !== undefined);
      assert.equal(actions.length, 1, `button "${button.text}" must have one action`);
      if (button.callback_data) {
        assert.ok(
          Buffer.byteLength(button.callback_data, 'utf8') <= 64,
          `callback_data is too long: ${button.callback_data}`
        );
      }
      if (button.url) assert.doesNotThrow(() => new URL(button.url));
    }
  }
}

test('Telegram command menu contains the requested dropdown commands', async () => {
  let registered;
  const telegram = createTelegramMock({
    async setMyCommands(commands) { registered = commands; }
  });

  await registerBotCommands(telegram);

  assert.deepEqual(registered, BOT_COMMANDS);
  assert.deepEqual(BOT_COMMANDS.map(({ command }) => command), [
    'menu',
    'welcome',
    'text',
    'design',
    'video',
    'audio',
    'voice',
    'tools',
    'agents',
    'fun',
    'settings',
    'dialogs',
    'profile',
    'balance',
    'paysupport',
    'channel',
    'support'
  ]);
  assert.ok(BOT_COMMANDS.every(({ description }) => {
    const withoutLeadingIcon = description.replace(/^\p{Extended_Pictographic}\ufe0f?\s*/u, '');
    return /^(?:[а-яё]|ИИ)/.test(withoutLeadingIcon);
  }));
});

test('legal gate keeps the device menu visible and unlocks only after both acceptances', async () => {
  const telegram = createTelegramMock();
  const timers = [];
  let status = { termsAccepted: false, personalDataAccepted: false };
  const records = [];
  const newcomerSchedules = [];
  const historyService = {
    async captureUpdate() {},
    async getLegalConsentStatus() { return { ...status }; },
    async recordLegalConsent(value) {
      records.push(value);
      status = value.consentKind === 'terms'
        ? { ...status, termsAccepted: true }
        : { ...status, personalDataAccepted: true };
      return {
        ...status,
        completed: status.termsAccepted && status.personalDataAccepted
      };
    }
  };
  const config = {
    legalConsent: {
      enabled: true,
      version: '2026-07-27',
      urls: {
        personalData: 'https://legal.example/soglasie',
        agreement: 'https://legal.example/soglashenie',
        privacy: 'https://legal.example/politika',
        rules: 'https://legal.example/pravila'
      }
    }
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config,
    historyService,
    lifecycleService: {
      async scheduleNewcomerReminder(value) { newcomerSchedules.push(value); }
    },
    setTimeoutFn(callback, delay) {
      timers.push({ callback, delay });
      return { unref() {} };
    }
  });
  const actor = { id: 77, first_name: 'Иван', username: 'mishchenko_is' };

  await handleUpdate({
    update_id: 900,
    message: { message_id: 1, chat: { id: 77, type: 'private' }, from: actor, text: '/start' }
  });
  assert.ok(telegram.sent.some(({ message }) => message.reply_markup?.keyboard));
  assert.match(telegram.sent.at(-1).message.text, /подтверди оба пункта/u);

  await handleUpdate({
    update_id: 901,
    callback_query: {
      id: 'legal-terms',
      from: actor,
      data: 'legal:accept:terms',
      message: { message_id: 101, chat: { id: 77, type: 'private' } }
    }
  });
  assert.match(telegram.sent.at(-1).message.text, /чтобы продолжить, осталось дать согласие/u);
  assert.ok(telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat().some(
    ({ text, callback_data }) => text.startsWith('✅') && callback_data === 'legal:accept:terms'
  ));

  await handleUpdate({
    update_id: 902,
    callback_query: {
      id: 'legal-pd',
      from: actor,
      data: 'legal:accept:personal_data',
      message: { message_id: 102, chat: { id: 77, type: 'private' } }
    }
  });
  assert.match(telegram.sent.at(-1).message.text, /теперь можно пользоваться всеми возможностями агрегатора/u);
  const sentBeforeCleanup = telegram.sent.length;
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 3_000);
  await timers[0].callback();
  await flushAsyncWork();
  assert.equal(telegram.sent.length, sentBeforeCleanup);
  assert.ok(telegram.deleted.length > 0);
  assert.deepEqual(records.map(({ consentKind }) => consentKind), ['terms', 'personal_data']);
  assert.deepEqual(records.map(({ requestKey }) => requestKey), [
    'legal:77:legal-terms',
    'legal:77:legal-pd'
  ]);
  assert.deepEqual(newcomerSchedules, [{
    telegramUserId: '77',
    telegramChatId: '77'
  }]);
});

test('legal gate blocks reply-menu and inline actions before both consents', async () => {
  const telegram = createTelegramMock();
  const historyService = {
    async captureUpdate() {},
    async getLegalConsentStatus() {
      return { termsAccepted: true, personalDataAccepted: false };
    }
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { legalConsent: { enabled: true } },
    historyService
  });

  await handleUpdate({
    update_id: 910,
    message: {
      message_id: 10,
      chat: { id: 91, type: 'private' },
      from: { id: 91 },
      text: '🎨 изображения'
    }
  });
  assert.match(telegram.sent.at(-1).message.text, /осталось дать согласие/u);

  await handleUpdate({
    update_id: 911,
    callback_query: {
      id: 'blocked-inline',
      from: { id: 91 },
      data: 'task:image',
      message: { message_id: 110, chat: { id: 91, type: 'private' } }
    }
  });
  assert.match(telegram.sent.at(-1).message.text, /осталось дать согласие/u);
});

test('legal gate keeps the card and explains a failed consent write', async () => {
  const telegram = createTelegramMock();
  const errors = [];
  const historyService = {
    async captureUpdate() {},
    async getLegalConsentStatus() {
      return { termsAccepted: false, personalDataAccepted: false };
    },
    async recordLegalConsent() {
      throw new Error('supabase write failed');
    },
    async recordEvent(event) {
      errors.push(event);
    }
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { legalConsent: { enabled: true } },
    historyService
  });

  await handleUpdate({
    update_id: 912,
    callback_query: {
      id: 'failed-consent',
      from: { id: 91 },
      data: 'legal:accept:terms',
      message: { message_id: 111, chat: { id: 91, type: 'private' } }
    }
  });

  const message = telegram.sent.at(-1).message;
  assert.match(message.text, /не получилось сохранить отметку/u);
  assert.match(message.text, /чтобы продолжить, подтверди оба пункта/u);
  assert.equal(message.reply_markup.inline_keyboard.length, 2);
  assert.equal(errors[0].eventName, 'legal.consent.failed');
});

test('/welcome menu action stops the agent, deletes its messages and returns to the device menu', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'metaflora-welcome-agent-')), 'state.sqlite');
  const stateRepository = new AppStateRepository(path);
  const llmCalls = [];
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { providerKeys: { openrouter: 'openrouter-secret' } },
    stateRepository,
    invokeLlm: async (request) => {
      llmCalls.push(request);
      return { text: 'открой раздел «видео», затем выбери создание из текста или изображения.' };
    }
  });

  await handleUpdate({
    update_id: 8_000,
    message: {
      message_id: 8_000,
      chat: { id: 10, type: 'private' },
      from: { id: 10, username: 'new_user' },
      text: '/welcome'
    }
  });
  assert.equal(stateRepository.loadWelcomeAgentSession('10').active, true);
  assert.match(telegram.sent.at(-1).message.text, /ИИ-помощник/u);
  assert.equal(
    telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat()
      .some(({ callback_data }) => callback_data === 'welcome:menu'),
    true
  );

  await handleUpdate({
    update_id: 8_001,
    message: {
      message_id: 8_001,
      chat: { id: 10, type: 'private' },
      from: { id: 10, username: 'new_user' },
      text: 'хочу сделать видео из фотографии'
    }
  });
  await flushAsyncWork();
  assert.equal(llmCalls.length, 1);
  assert.equal(llmCalls[0].providerModel, WELCOME_AGENT_MODEL);
  assert.equal(llmCalls[0].allowSecondaryProviders, false);
  assert.match(llmCalls[0].settings.instructions, /МЕТАФЛОРА\* нейро/u);
  assert.match(llmCalls[0].settings.instructions, new RegExp(`${listCatalogModels().length} моделей`, 'u'));
  assert.match(llmCalls[0].prompt, /хочу сделать видео из фотографии/u);
  assert.deepEqual(
    stateRepository.loadWelcomeAgentSession('10').messages.map(({ role }) => role),
    ['user', 'assistant']
  );
  assert.equal(
    telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat()
      .some(({ callback_data }) => callback_data === 'welcome:menu'),
    true
  );

  telegram.deleted.length = 0;
  await handleUpdate({
    update_id: 8_002,
    callback_query: {
      id: 'welcome-menu',
      data: 'welcome:menu',
      from: { id: 10 },
      message: { message_id: 101, chat: { id: 10, type: 'private' } }
    }
  });
  assert.equal(stateRepository.loadWelcomeAgentSession('10').active, false);
  assert.deepEqual(stateRepository.loadWelcomeAgentSession('10').messages, []);
  assert.deepEqual(telegram.deleted, [
    { chatId: 10, messageId: 100 },
    { chatId: 10, messageId: 101 }
  ]);
  assert.deepEqual(telegram.sent.at(-1).message.reply_markup.keyboard, menuKeyboard());
  stateRepository.close();
});

test('a regular command leaves welcome mode before opening another section', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'metaflora-welcome-agent-')), 'state.sqlite');
  const stateRepository = new AppStateRepository(path);
  stateRepository.startWelcomeAgentSession('10');
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {}, stateRepository });

  await handleUpdate({
    update_id: 8_010,
    message: {
      message_id: 8_010,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: '/video'
    }
  });

  assert.equal(stateRepository.loadWelcomeAgentSession('10').active, false);
  assert.match(telegram.sent.at(-1).message.text, /^<b>🎬 видео<\/b>/u);
  stateRepository.close();
});

test('a regular callback leaves welcome mode before opening another section', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'metaflora-welcome-agent-')), 'state.sqlite');
  const stateRepository = new AppStateRepository(path);
  stateRepository.startWelcomeAgentSession('10');
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {}, stateRepository });

  await handleUpdate({
    update_id: 8_020,
    callback_query: {
      id: 'welcome-to-image',
      data: 'task:image',
      from: { id: 10 },
      message: { message_id: 8_020, chat: { id: 10, type: 'private' } }
    }
  });

  assert.equal(stateRepository.loadWelcomeAgentSession('10').active, false);
  assert.match(telegram.sent.at(-1).message.text, /^<b>🎨 изображения<\/b>/u);
  stateRepository.close();
});

test('welcome mode handles text without replacing or invoking the selected model', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'metaflora-welcome-agent-')), 'state.sqlite');
  const stateRepository = new AppStateRepository(path);
  stateRepository.saveUserState('10', { selectedModelId: 'gpt_oss_20b_free' });
  const llmCalls = [];
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { providerKeys: { openrouter: 'openrouter-secret' } },
    stateRepository,
    invokeLlm: async (request) => {
      llmCalls.push(request);
      return { text: 'открой нужный раздел через меню.' };
    }
  });

  await handleUpdate({
    update_id: 8_030,
    message: {
      message_id: 8_030,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: '/welcome'
    }
  });
  await handleUpdate({
    update_id: 8_031,
    message: {
      message_id: 8_031,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: 'куда идти за расшифровкой?'
    }
  });
  await flushAsyncWork();

  assert.equal(llmCalls.length, 1);
  assert.equal(llmCalls[0].providerModel, WELCOME_AGENT_MODEL);
  assert.equal(stateRepository.loadUserState('10').selectedModelId, 'gpt_oss_20b_free');
  stateRepository.close();
});

test('a pending welcome answer does not block another user from opening the menu', async () => {
  let resolveWelcome;
  const pendingWelcome = new Promise((resolve) => { resolveWelcome = resolve; });
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { providerKeys: { openrouter: 'openrouter-secret' } },
    invokeLlm: () => pendingWelcome
  });

  await handleUpdate({
    update_id: 8_040,
    message: {
      message_id: 8_040,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: '/welcome'
    }
  });
  await handleUpdate({
    update_id: 8_041,
    message: {
      message_id: 8_041,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: 'где сделать видео?'
    }
  });

  await Promise.race([
    handleUpdate({
      update_id: 8_042,
      message: {
        message_id: 8_042,
        chat: { id: 11, type: 'private' },
        from: { id: 11, first_name: 'Анна' },
        text: '/menu'
      }
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('second user was blocked')), 100))
  ]);
  assert.equal(telegram.sent.at(-1).chatId, 11);
  assert.match(telegram.sent.at(-1).message.text, /добро пожаловать/u);

  resolveWelcome({ text: 'открой раздел видео' });
  await flushAsyncWork();
});

test('a slow history capture never delays an interactive menu callback', async () => {
  const neverSettles = new Promise(() => {});
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    historyService: {
      captureUpdate() { return neverSettles; }
    }
  });

  await Promise.race([
    handleUpdate({
      update_id: 8_043,
      callback_query: {
        id: 'open-tools-with-slow-audit',
        from: { id: 11 },
        data: 'task:tools',
        message: { message_id: 110, chat: { id: 11, type: 'private' } }
      }
    }),
    new Promise((_, reject) => setTimeout(
      () => reject(new Error('menu callback was blocked by history capture')),
      100
    ))
  ]);

  assert.equal(telegram.sent.at(-1).chatId, 11);
  assert.match(telegram.sent.at(-1).message.text, /инструмент/u);
});

test('stopping welcome while a request is running suppresses the late answer', async () => {
  let resolveWelcome;
  const pendingWelcome = new Promise((resolve) => { resolveWelcome = resolve; });
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { providerKeys: { openrouter: 'openrouter-secret' } },
    invokeLlm: () => pendingWelcome
  });

  await handleUpdate({
    update_id: 8_050,
    message: {
      message_id: 8_050,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: '/welcome'
    }
  });
  await handleUpdate({
    update_id: 8_051,
    message: {
      message_id: 8_051,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: 'что выбрать?'
    }
  });
  await handleUpdate({
    update_id: 8_052,
    callback_query: {
      id: 'menu-running-welcome',
      data: 'welcome:menu',
      from: { id: 10, first_name: 'Илья' },
      message: { message_id: 8_052, chat: { id: 10, type: 'private' } }
    }
  });
  const sentAfterStop = telegram.sent.length;
  resolveWelcome({ text: 'этот ответ уже не должен прийти' });
  await flushAsyncWork();

  assert.equal(telegram.sent.length, sentAfterStop);
  assert.deepEqual(telegram.sent.at(-1).message.reply_markup.keyboard, menuKeyboard());
});

test('welcome can restart immediately while an invalidated request is still pending', async () => {
  let resolveOldWelcome;
  const oldWelcome = new Promise((resolve) => { resolveOldWelcome = resolve; });
  let calls = 0;
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { providerKeys: { openrouter: 'openrouter-secret' } },
    invokeLlm: async () => {
      calls += 1;
      return calls === 1 ? oldWelcome : { text: 'новая сессия работает' };
    }
  });
  const message = (updateId, text) => ({
    update_id: updateId,
    message: {
      message_id: updateId,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text
    }
  });

  await handleUpdate(message(8_060, '/welcome'));
  await handleUpdate(message(8_061, 'старый вопрос'));
  await handleUpdate({
    update_id: 8_062,
    callback_query: {
      id: 'menu-old-welcome',
      data: 'welcome:menu',
      from: { id: 10 },
      message: { message_id: 8_062, chat: { id: 10, type: 'private' } }
    }
  });
  await handleUpdate(message(8_063, '/welcome'));
  await handleUpdate(message(8_064, 'новый вопрос'));
  await flushAsyncWork();

  assert.equal(calls, 2);
  assert.match(telegram.sent.at(-1).message.text, /новая сессия работает/u);
  resolveOldWelcome({ text: 'старый ответ' });
  await flushAsyncWork();
  assert.doesNotMatch(telegram.sent.at(-1).message.text, /старый ответ/u);
});

test('/welcome profile action deletes the dialogue and opens profile', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 8_080,
    message: {
      message_id: 8_080,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: '/welcome'
    }
  });
  telegram.deleted.length = 0;
  await handleUpdate({
    update_id: 8_081,
    callback_query: {
      id: 'welcome-profile',
      data: 'welcome:profile',
      from: { id: 10 },
      message: { message_id: 100, chat: { id: 10, type: 'private' } }
    }
  });

  assert.deepEqual(telegram.deleted, [{ chatId: 10, messageId: 100 }]);
  assert.match(telegram.sent.at(-1).message.text, /^👤 <b>профиль<\/b>/u);
});

test('/welcome back action deletes only the assistant dialogue and reveals the previous screen', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 8_090,
    message: {
      message_id: 8_090,
      chat: { id: 10, type: 'private' },
      from: { id: 10, first_name: 'Илья' },
      text: '/menu'
    }
  });
  await handleUpdate({
    update_id: 8_091,
    message: {
      message_id: 8_091,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: '/welcome'
    }
  });
  const sentBeforeBack = telegram.sent.length;
  telegram.deleted.length = 0;
  await handleUpdate({
    update_id: 8_092,
    callback_query: {
      id: 'welcome-back',
      data: 'welcome:back',
      from: { id: 10 },
      message: { message_id: 101, chat: { id: 10, type: 'private' } }
    }
  });

  assert.equal(telegram.sent.length, sentBeforeBack);
  assert.deepEqual(telegram.deleted, [{ chatId: 10, messageId: 101 }]);
});

test('welcome text does not invoke or replace the selected ИИ-agent', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'metaflora-welcome-agent-')), 'state.sqlite');
  const stateRepository = new AppStateRepository(path);
  stateRepository.saveUserState('10', { selectedAgentId: 'copywriter' });
  const calls = [];
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { providerKeys: { openrouter: 'openrouter-secret' } },
    stateRepository,
    invokeLlm: async (request) => {
      calls.push(request);
      return { text: 'открой раздел ИИ-агентов.' };
    }
  });

  await handleUpdate({
    update_id: 8_070,
    message: {
      message_id: 8_070,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: '/welcome'
    }
  });
  await handleUpdate({
    update_id: 8_071,
    message: {
      message_id: 8_071,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: 'какой агент пишет тексты?'
    }
  });
  await flushAsyncWork();

  assert.equal(calls.length, 1);
  assert.equal(calls[0].providerModel, WELCOME_AGENT_MODEL);
  assert.equal(stateRepository.loadUserState('10').selectedAgentId, 'copywriter');
  stateRepository.close();
});

test('callback action continues when Telegram cannot clear the loading spinner', async () => {
  const telegram = createTelegramMock({
    async answerCallbackQuery() { throw new Error('expired callback'); }
  });
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 1,
    callback_query: {
      id: 'callback-1',
      data: 'task:image',
      message: { chat: { id: 10 } }
    }
  });

  assert.equal(telegram.sent.length, 1);
  const buttons = telegram.sent[0].message.reply_markup.inline_keyboard.flat().map((button) => button.text);
  assert.ok(buttons.some((label) => label.endsWith('Nano Banana Pro')));
});

test('callback navigation edits one Telegram message instead of leaving a trail', async () => {
  const edited = [];
  const telegram = createTelegramMock({
    async editMessageText(chatId, messageId, message) { edited.push({ chatId, messageId, message }); }
  });
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: { id: `callback-${id}`, data, message: { message_id: 77, chat: { id: 10 } } }
  });

  await handleUpdate(callback(70, 'task:image'));
  await handleUpdate(callback(71, 'model:nano_banana_pro'));
  await handleUpdate(callback(72, 'settings:nano_banana_pro'));

  assert.equal(telegram.sent.length, 0);
  assert.equal(edited.length, 3);
  assert.ok(edited.every(({ messageId }) => messageId === 77));
});

test('menu media is cached and captions are edited when the same screen is revisited', async () => {
  const photos = [];
  const captions = [];
  const telegram = createTelegramMock({
    async sendPhoto(chatId, source, message) {
      photos.push({ chatId, source, message });
      return {
        message_id: 200 + photos.length,
        photo: [{ file_id: `${message.fileName}-telegram-id` }]
      };
    },
    async editMessageCaption(chatId, messageId, message) {
      captions.push({ chatId, messageId, message });
      return { message_id: messageId };
    }
  });
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    menuMedia: {
      menu: { data: Buffer.from('menu'), mimeType: 'image/jpeg', size: 4, fileName: 'menu.jpg' },
      image: { data: Buffer.from('image'), mimeType: 'image/jpeg', size: 5, fileName: 'image.jpg' }
    }
  });
  const callback = (id, data, messageId = 201) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { message_id: messageId, chat: { id: 10 } }
    }
  });

  await handleUpdate({
    update_id: 80,
    message: {
      message_id: 80,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: '/start'
    }
  });
  await handleUpdate(callback(81, 'task:menu'));
  await handleUpdate(callback(82, 'task:image'));
  await handleUpdate({
    update_id: 83,
    message: {
      message_id: 83,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: '/start'
    }
  });

  assert.equal(photos.length, 3);
  assert.equal(Buffer.isBuffer(photos[0].source), true);
  assert.equal(Buffer.isBuffer(photos[1].source), true);
  assert.equal(photos[2].source, 'menu.jpg-telegram-id');
  assert.equal(captions.length, 1);
  assert.equal(captions[0].messageId, 201);
  assert.match(captions[0].message.caption, /добро пожаловать/u);
});

test('selected model and its settings survive a bot process restart', async () => {
  const databasePath = join(mkdtempSync(join(tmpdir(), 'metaflora-bot-state-')), 'state.sqlite');
  const firstRepository = new AppStateRepository(databasePath);
  const firstTelegram = createTelegramMock();
  const firstHandler = createUpdateHandler({
    telegram: firstTelegram,
    config: {},
    stateRepository: firstRepository
  });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { message_id: 77, chat: { id: 10 } }
    }
  });

  await firstHandler(callback(500, 'model:seedance_20'));
  await firstHandler(callback(501, 'settings:seedance_20'));
  await firstHandler(callback(502, 'setting:resolution'));
  await firstHandler(callback(503, 'set:resolution:480p'));
  firstRepository.close();

  const secondRepository = new AppStateRepository(databasePath);
  const secondTelegram = createTelegramMock();
  const secondHandler = createUpdateHandler({
    telegram: secondTelegram,
    config: {},
    stateRepository: secondRepository
  });
  await secondHandler(callback(504, 'settings:seedance_20'));

  assert.match(secondTelegram.sent[0].message.text, /<b>разрешение:<\/b> 480p/);
  secondRepository.close();
});

test('stored model settings are revalidated against the current provider contract before execution', () => {
  const sanitized = sanitizeStoredModelSettings({
    gpt_image_2: {
      resolution: 'landscape_4_3',
      quality: 'high',
      output_format: 'png'
    },
    missing_model: { resolution: '1K' }
  });

  assert.deepEqual(sanitized, {
    gpt_image_2: {
      aspect_ratio: 'auto',
      quality: 'high',
      output_format: 'png'
    }
  });
});

test('agent callback opens the card and selects the agent immediately', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const agent = listAgents()[0];
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });

  await handleUpdate(callback(520, 'agents:home'));
  await handleUpdate(callback(521, `agentcat:${agent.category}`));
  await handleUpdate(callback(522, `agent:${agent.id}`));

  assert.match(telegram.sent[0].message.text, /<b>🤖 ИИ-агенты<\/b>/);
  assert.ok(telegram.sent[1].message.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === `agent:${agent.id}`));
  assert.equal(telegram.sent[2].message.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data?.startsWith('useagent:')), false);
  assert.doesNotMatch(telegram.sent[2].message.text, /модель:/i);
});

test('selected agent survives restart separately from the selected model', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'metaflora-agent-state-')), 'state.sqlite');
  const agent = listAgents()[0];
  const firstRepository = new AppStateRepository(path);
  const firstHandler = createUpdateHandler({
    telegram: createTelegramMock(),
    config: {},
    stateRepository: firstRepository
  });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });

  await firstHandler(callback(530, 'model:gpt_oss_20b_free'));
  await firstHandler(callback(531, `agent:${agent.id}`));
  firstRepository.close();

  const secondRepository = new AppStateRepository(path);
  assert.equal(secondRepository.loadUserState('10').selectedModelId, 'gpt_oss_20b_free');
  assert.equal(secondRepository.loadUserState('10').selectedAgentId, agent.id);
  secondRepository.close();
});

test('agent parameters survive restart and reach the trusted system instructions', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'metaflora-agent-params-')), 'state.sqlite');
  const agent = listAgents().find(({ id }) => id === 'developer');
  const firstRepository = new AppStateRepository(path);
  const firstHandler = createUpdateHandler({
    telegram: createTelegramMock(),
    config: {},
    stateRepository: firstRepository
  });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });

  await firstHandler(callback(532, `agent:${agent.id}`));
  await firstHandler(callback(533, `agentset:${agent.id}:code_scope:refactor`));
  await firstHandler(callback(534, 'prefs:set:length:detailed'));
  firstRepository.close();

  let invocation;
  const secondRepository = new AppStateRepository(path);
  const secondHandler = createUpdateHandler({
    telegram: createTelegramMock(),
    config: {
      enableAgentProviderCalls: true,
      providerKeys: { polza: 'secret' }
    },
    stateRepository: secondRepository,
    referralService: createPaidReferralService(100_000),
    invokeLlm: async (options) => {
      invocation = options;
      return { text: 'готово', provider: 'polza' };
    }
  });

  await secondHandler({
    update_id: 535,
    message: {
      message_id: 535,
      chat: { id: 10 },
      from: { id: 10 },
      text: 'напиши карточку'
    }
  });

  assert.match(invocation.settings.instructions, /ограниченный рефакторинг/i);
  assert.match(invocation.settings.instructions, /отвечай подробно/i);
  assert.match(invocation.settings.instructions, /параметры не заменяют обязательные уточнения/i);
  assert.equal(secondRepository.loadUserState('10').agentSettings.developer.code_scope, 'refactor');
  secondRepository.close();
});

test('selected agent uses its own Terra route and is charged exactly once', async () => {
  const agent = listAgents()[0];
  const telegram = createTelegramMock();
  let invocation;
  const debits = [];
  const ledgerEntries = [];
  const referralService = createPaidReferralService(100_000);
  const originalDebit = referralService.debitMetacoins;
  referralService.debitMetacoins = (entry) => {
    debits.push(entry);
    return originalDebit(entry);
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {
      enableAgentProviderCalls: true,
      providerKeys: { polza: 'secret' }
    },
    referralService,
    historyService: {
      async recordMetacoinTransaction(entry) {
        ledgerEntries.push(entry);
      }
    },
    invokeLlm: async (options) => {
      invocation = options;
      return { text: 'ответ агента', provider: 'polza' };
    }
  });

  await handleUpdate({
    update_id: 540,
    callback_query: {
      id: 'callback-540',
      data: `agent:${agent.id}`,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 541,
    message: {
      message_id: 541,
      chat: { id: 10 },
      from: { id: 10 },
      text: 'разбери мою задачу'
    }
  });

  assert.equal(invocation.prompt, 'разбери мою задачу');
  assert.ok(invocation.settings.instructions.startsWith(agent.systemPrompt));
  assert.match(invocation.settings.instructions, /не заменяет консультацию/i);
  assert.ok(invocation.providerModels.length >= 1);
  assert.equal(invocation.providerModels[0], 'openai/gpt-5.6-terra');
  assert.equal(invocation.allowFreeFallback, true);
  assert.equal(debits.length, 1);
  assert.equal(debits[0].amount, calculateAgentRunPrice(agent));
  assert.equal(ledgerEntries.length, 1);
  assert.equal(ledgerEntries[0].delta, -calculateAgentRunPrice(agent));
  assert.equal(ledgerEntries[0].balanceAfter, 100_000 - calculateAgentRunPrice(agent));
  assert.equal(ledgerEntries[0].source, 'generation');
  assert.equal(telegram.sent.at(-1).message.text, 'ответ агента');
  assert.ok(telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === `agent:${agent.id}`));
});

test('entertainment keeps agent billing but records its own subject and safety prompt', async () => {
  const telegram = createTelegramMock();
  const starts = [];
  let invocation;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableAgentProviderCalls: true, providerKeys: { polza: 'secret' } },
    referralService: createPaidReferralService(100_000),
    historyService: {
      async startGeneration(entry) { starts.push(entry); return { generationId: 'ent-gen', telegramUserId: '10' }; },
      async completeGeneration() {},
      async recordMetacoinTransaction() {}
    },
    invokeLlm: async (options) => { invocation = options; return { text: 'примерная оценка', provider: 'polza' }; }
  });
  const callback = (id, data) => ({ update_id: id, callback_query: { id: `cb-${id}`, data, from: { id: 10 }, message: { chat: { id: 10 } } } });
  await handleUpdate(callback(545, 'ent:use:ent_calorie_estimator'));
  await handleUpdate({ update_id: 546, message: { message_id: 546, chat: { id: 10 }, from: { id: 10 }, text: 'оцени блюдо' } });

  assert.equal(invocation, undefined);
  assert.equal(starts.length, 0);
  assert.match(telegram.sent.at(-1).message.text, /пришли фото блюда/iu);
});

test('reply menu navigation cancels partner onboarding instead of treating the label as INN', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    referralService: {
      ...createPaidReferralService(),
      async getPartnerOnboarding() {
        return { offerAccepted: true, payoutEnabled: false };
      }
    }
  });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `partner-navigation-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });

  await handleUpdate(callback(547, 'ref:onboarding:status:self_employed'));
  await handleUpdate({
    update_id: 548,
    message: {
      message_id: 548,
      chat: { id: 10 },
      from: { id: 10 },
      text: 'Иван Иванов'
    }
  });
  await handleUpdate({
    update_id: 549,
    message: {
      message_id: 549,
      chat: { id: 10 },
      from: { id: 10 },
      text: '🎰 развлечения'
    }
  });

  assert.match(telegram.sent.at(-1).message.text, /<b>🎰 развлечения<\/b>/u);
  assert.doesNotMatch(telegram.sent.at(-1).message.text, /ИНН/u);
});

test('partner onboarding persists legal status, name and INN after the accepted offer', async () => {
  const telegram = createTelegramMock();
  const profiles = [];
  const referralService = {
    ...createPaidReferralService(),
    async getPartnerOnboarding() {
      return profiles.length
        ? { offerAccepted: true, payoutEnabled: false, profile: profiles.at(-1) }
        : { offerAccepted: true, payoutEnabled: false };
    },
    async upsertPartnerProfile(value) {
      profiles.push(value);
      return { outcome: 'saved' };
    }
  };
  const handleUpdate = createUpdateHandler({ telegram, config: {}, referralService });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `partner-persist-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  const message = (id, text) => ({
    update_id: id,
    message: { message_id: id, chat: { id: 10 }, from: { id: 10 }, text }
  });

  await handleUpdate(callback(550, 'ref:onboarding:status:self_employed'));
  await handleUpdate(message(551, 'Иван Иванов'));
  await handleUpdate(message(552, '123456789012'));

  assert.equal(profiles.length, 1);
  assert.deepEqual(profiles[0], {
    telegramId: 10,
    legalStatus: 'self_employed',
    inn: '123456789012',
    fullName: 'Иван Иванов',
    metadata: { source: 'telegram_bot', telegramUpdateId: '552' }
  });
});

test('selected agent preprocesses audio and stores safe CRM media metadata', async () => {
  const agent = listAgents()[0];
  const telegram = createTelegramMock();
  let invocation;
  const toolCalls = [];
  const historyStarts = [];
  const debits = [];
  const referralService = createPaidReferralService(100_000);
  const originalDebit = referralService.debitMetacoins;
  referralService.debitMetacoins = (entry) => {
    debits.push(entry);
    return originalDebit(entry);
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {
      enableAgentProviderCalls: true,
      providerKeys: { polza: 'secret', elevenlabs: 'eleven' }
    },
    referralService,
    historyService: {
      async startGeneration(entry) {
        historyStarts.push(entry);
        return {
          generationId: 'gen-audio-agent',
          telegramUserId: String(entry.telegramUserId)
        };
      },
      async completeGeneration() {},
      async recordMetacoinTransaction() {}
    },
    invokeTool: async (request) => {
      toolCalls.push(request);
      return { type: 'text', text: 'аудио: клиент просит короткий сценарий' };
    },
    invokeLlm: async (options) => {
      invocation = options;
      return { text: 'ответ по аудио', provider: 'polza' };
    }
  });

  await handleUpdate({
    update_id: 5_403,
    callback_query: {
      id: 'callback-5403',
      data: `agent:${agent.id}`,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 5_404,
    message: {
      message_id: 5_404,
      chat: { id: 10 },
      from: { id: 10 },
      voice: { file_id: 'voice-file-id', duration: 120 }
    }
  });

  const expectedPrice = calculateAgentRunPrice(agent)
    + calculateToolMetacoinPrice(getToolModelById('audio_stt'), {}, { durationSeconds: 120 });
  assert.equal(toolCalls.length, 1);
  assert.equal(toolCalls[0].toolId, 'audio_stt');
  assert.match(invocation.prompt, /Расшифровка аудио-вложения/u);
  assert.match(invocation.prompt, /короткий сценарий/u);
  assert.equal(debits[0].amount, expectedPrice);
  assert.equal(historyStarts[0].metacoinsQuoted, expectedPrice);
  assert.deepEqual(historyStarts[0].parameters.media.references, {
    image: 0,
    video: 0,
    audio: 1,
    total: 1
  });
  assert.deepEqual(historyStarts[0].parameters.media.preprocessTools, ['audio_stt']);
  assert.equal(JSON.stringify(historyStarts[0].parameters).includes('voice-file-id'), false);
});

test('selected agent preprocesses video before the LLM call', async () => {
  const agent = listAgents()[0];
  const telegram = createTelegramMock();
  let invocation;
  const toolCalls = [];
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {
      enableAgentProviderCalls: true,
      providerKeys: { polza: 'secret', fal: 'fal' }
    },
    referralService: createPaidReferralService(100_000),
    historyService: {
      async startGeneration(entry) {
        return {
          generationId: 'gen-video-agent',
          telegramUserId: String(entry.telegramUserId)
        };
      },
      async completeGeneration() {},
      async recordMetacoinTransaction() {}
    },
    invokeTool: async (request) => {
      toolCalls.push(request);
      return { type: 'text', text: 'видео: человек показывает продукт' };
    },
    invokeLlm: async (options) => {
      invocation = options;
      return { text: 'ответ по видео', provider: 'polza' };
    }
  });

  await handleUpdate({
    update_id: 5_405,
    callback_query: {
      id: 'callback-5405',
      data: `agent:${agent.id}`,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 5_406,
    message: {
      message_id: 5_406,
      chat: { id: 10 },
      from: { id: 10 },
      video: { file_id: 'video-file-id', duration: 12 }
    }
  });

  assert.equal(toolCalls.length, 1);
  assert.equal(toolCalls[0].toolId, 'video_understand');
  assert.equal(toolCalls[0].telegramInput.text, 'разбери приложенное видео');
  assert.match(invocation.prompt, /Разбор видео-вложения/u);
  assert.match(invocation.prompt, /показывает продукт/u);
});

test('free emergency route answers without charging the Terra price', async () => {
  const agent = listAgents()[0];
  const telegram = createTelegramMock();
  const debits = [];
  const referralService = createPaidReferralService(100_000);
  const originalDebit = referralService.debitMetacoins;
  referralService.debitMetacoins = (entry) => {
    debits.push(entry);
    return originalDebit(entry);
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {
      enableAgentProviderCalls: true,
      providerKeys: { openrouter: 'secret' }
    },
    referralService,
    invokeLlm: async () => ({
      text: 'аварийный маршрут работает',
      provider: 'openrouter',
      billingTier: 'free'
    })
  });

  await handleUpdate({
    update_id: 5_401,
    callback_query: {
      id: 'callback-5401',
      data: `agent:${agent.id}`,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 5_402,
    message: {
      message_id: 5_402,
      chat: { id: 10 },
      from: { id: 10 },
      text: 'проверь задачу'
    }
  });

  assert.equal(debits.length, 0);
  assert.equal(telegram.sent.at(-1).message.text, 'аварийный маршрут работает');
});

test('agent result is not delivered when the atomic debit loses a balance race', async () => {
  const agent = listAgents()[0];
  const telegram = createTelegramMock();
  const referralService = createPaidReferralService(100_000);
  referralService.debitMetacoins = () => ({
    status: 'insufficient_funds',
    balance: 0
  });
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {
      enableAgentProviderCalls: true,
      providerKeys: { polza: 'secret' }
    },
    referralService,
    invokeLlm: async () => ({ text: 'неоплаченный результат', provider: 'polza' })
  });

  await handleUpdate({
    update_id: 542,
    callback_query: {
      id: 'callback-542',
      data: `agent:${agent.id}`,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 543,
    message: {
      message_id: 543,
      chat: { id: 10 },
      from: { id: 10 },
      text: 'разбери задачу'
    }
  });

  assert.equal(
    telegram.sent.some(({ message }) => message.text === 'неоплаченный результат'),
    false
  );
  assert.match(telegram.sent.at(-1).message.text, /не хватает метакоинов/);
});

test('agent provider failure keeps the agent context and never exposes its internal model', async () => {
  const agent = listAgents()[0];
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {
      enableAgentProviderCalls: true,
      providerKeys: { polza: 'secret' }
    },
    referralService: createPaidReferralService(100_000),
    invokeLlm: async () => {
      throw new ProviderRequestError('provider unavailable');
    }
  });

  await handleUpdate({
    update_id: 544,
    callback_query: {
      id: 'callback-544',
      data: `agent:${agent.id}`,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 545,
    message: {
      message_id: 545,
      chat: { id: 10 },
      from: { id: 10 },
      text: 'разбери задачу'
    }
  });

  const message = telegram.sent.at(-1).message;
  const buttons = message.reply_markup.inline_keyboard.flat();
  assert.match(message.text, /<b>агент временно не отвечает<\/b>/);
  assert.doesNotMatch(message.text, /модель|gpt|claude|gemini/i);
  assert.ok(buttons.some(({ callback_data }) => callback_data === `agent:${agent.id}`));
  assert.ok(buttons.some(({ callback_data }) => callback_data === `agentcat:${agent.category}`));
  assert.equal(buttons.some(({ callback_data }) => callback_data?.startsWith('use:')), false);
});

test('slash commands open their model sections', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({ update_id: 2, message: { chat: { id: 10 }, text: '/text' } });
  await handleUpdate({ update_id: 3, message: { chat: { id: 10 }, text: '/design' } });
  await handleUpdate({ update_id: 4, message: { chat: { id: 10 }, text: '/video@neuro_metaflora_bot' } });
  await handleUpdate({ update_id: 5, message: { chat: { id: 10 }, text: '/russian' } });
  await handleUpdate({ update_id: 6, message: { chat: { id: 10 }, text: '/experimental' } });
  await handleUpdate({ update_id: 7, message: { chat: { id: 10 }, text: '/beta' } });

  assert.match(telegram.sent[0].message.text, /^<b>💬 текст \/ код \/ поиск<\/b>/);
  assert.match(telegram.sent[1].message.text, /^<b>🎨 изображения<\/b>/);
  assert.match(telegram.sent[2].message.text, /^<b>🎬 видео<\/b>/);
  assert.match(telegram.sent[3].message.text, /^<b>open-source<\/b>/);
  assert.doesNotMatch(telegram.sent[3].message.text, /Sber|GigaChat|сбер/iu);
  assert.match(telegram.sent[4].message.text, /^<b>🧪 бета-модели<\/b>/);
  assert.match(telegram.sent[5].message.text, /^<b>🧪 бета-модели<\/b>/);
});

test('back command returns to the main menu', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({ update_id: 7, message: { chat: { id: 10 }, text: '/back' } });

  assert.match(telegram.sent[0].message.text, /^👋 <b>добро пожаловать<\/b>/);
  assert.deepEqual(telegram.sent[0].message.reply_markup.keyboard, menuKeyboard());
});

test('tools, profile, and support commands open real sections', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({ update_id: 20, message: { chat: { id: 10 }, text: '/tools' } });
  await handleUpdate({ update_id: 21, message: { chat: { id: 10 }, text: '/profile' } });
  await handleUpdate({ update_id: 22, message: { chat: { id: 10 }, text: '/support' } });

  assert.match(telegram.sent[0].message.text, /^<b>🪄 ИИ-инструменты<\/b>/);
  assert.match(telegram.sent[1].message.text, /^👤 <b>профиль<\/b>/);
  assert.doesNotMatch(telegram.sent[1].message.text, /текущая модель/i);
  assert.match(telegram.sent[2].message.text, /^🧯 поддержка/);
  assert.match(telegram.sent[2].message.text, /@metaflora_support/);
  assert.match(telegram.sent[2].message.text, /<b>списались метакоины без результата<\/b>/);
  assert.ok(telegram.sent[0].message.reply_markup.inline_keyboard.flat().some((button) => button.callback_data === 'task:profile'));
  assert.ok(telegram.sent[1].message.reply_markup.inline_keyboard.flat().some((button) => button.callback_data === 'task:menu'));
  assert.ok(telegram.sent[2].message.reply_markup.inline_keyboard.flat().some((button) => button.callback_data === 'task:profile'));
  const supportButton = telegram.sent[2].message.reply_markup.inline_keyboard.flat()
    .find((button) => button.url?.includes('metaflora_support'));
  assert.equal(supportButton.text, 'написать');
  assert.equal(supportButton.style, undefined);
});

test('voice and agents commands open the new production sections', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({ update_id: 23, message: { chat: { id: 10 }, text: '/voice' } });
  await handleUpdate({ update_id: 24, message: { chat: { id: 10 }, text: '/agents' } });

  assert.match(telegram.sent[0].message.text, /^<b>🎙 озвучка \/ расшифровка<\/b>/);
  assert.ok(telegram.sent[0].message.reply_markup.inline_keyboard.flat().some(
    ({ callback_data }) => callback_data === 'audiostudio:voice'
  ));
  assert.match(telegram.sent[1].message.text, /^<b>🤖 ИИ-агенты<\/b>/);
});

test('channel command opens the founder card', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({ update_id: 221, message: { chat: { id: 10 }, text: '/channel' } });

  assert.match(telegram.sent[0].message.text, /^📡 <b>канал фаундера<\/b>/);
  assert.ok(telegram.sent[0].message.reply_markup.inline_keyboard.flat().some(({ url }) => (
    url === 'https://t.me/metamishchenko'
  )));
});

test('profile keeps the permanent device keyboard available', async () => {
  const deleted = [];
  const telegram = createTelegramMock({
    async deleteMessage(chatId, messageId) {
      deleted.push({ chatId, messageId });
    }
  });
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 23,
    message: { chat: { id: 10 }, from: { id: 10 }, text: '/profile' }
  });

  assert.equal(telegram.sent.some(({ message }) => message.reply_markup?.remove_keyboard), false);
  assert.match(telegram.sent[0].message.text, /^👤 <b>профиль<\/b>/);
  assert.ok(telegram.sent[0].message.reply_markup.inline_keyboard);
  assert.equal(deleted.length, 0);
});

test('a stale billing button returns to the current catalog instead of breaking polling', async () => {
  const edited = [];
  const telegram = createTelegramMock({
    async editMessageText(chatId, messageId, message) {
      edited.push({ chatId, messageId, message });
    }
  });
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 24,
    callback_query: {
      id: 'stale-billing',
      data: 'billing:plan:removed_plan',
      from: { id: 10 },
      message: { message_id: 77, chat: { id: 10 } }
    }
  });

  assert.equal(edited.length, 1);
  assert.match(edited[0].message.text, /<b>актуальные тарифы<\/b>/);
});

test('promo code can be entered as the next Telegram message', async () => {
  const telegram = createTelegramMock();
  const stateRepository = {
    redeemPromo(userId, code) {
      assert.equal(userId, '10');
      assert.equal(code, 'FLORA-25');
      return { code, rewardType: 'discount_percent', rewardValue: 25 };
    },
    loadUserState() {
      return { selectedModelId: null, modelSettings: {}, preferences: {}, activePromoCode: null };
    },
    saveUserState() {}
  };
  const handleUpdate = createUpdateHandler({ telegram, config: {}, stateRepository });

  await handleUpdate({
    update_id: 25,
    callback_query: {
      id: 'promo-entry',
      data: 'billing:promo:enter',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 26,
    message: { chat: { id: 10 }, from: { id: 10 }, text: 'flora-25' }
  });

  assert.match(telegram.sent[0].message.text, /^<b>ввести промокод<\/b>/);
  assert.match(telegram.sent[1].message.text, /<b>активный промокод:<\/b> FLORA-25/);
});

test('my promo codes activation credits arbitrary metacoins immediately and only once', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'metaflora-bot-promo-')), 'state.sqlite');
  const stateRepository = new AppStateRepository(path);
  const referralService = createReferralService({ databasePath: path });
  referralService.registerUser({ id: '10', username: 'tester' });
  stateRepository.createPromo({
    code: 'BOT173',
    rewardType: 'metacoins',
    rewardValue: 173,
    maxUses: 1,
    createdBy: 'crm-owner'
  });
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    stateRepository,
    referralService
  });

  await handleUpdate({
    update_id: 26_100,
    callback_query: {
      id: 'my-promos-entry',
      data: 'billing:promo:enter:profile',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 26_101,
    message: { message_id: 26_101, chat: { id: 10 }, from: { id: 10 }, text: 'bot173' }
  });

  assert.match(telegram.sent.at(-1).message.text, /активный промокод.*BOT173/is);
  assert.match(telegram.sent.at(-1).message.text, /173.*метакоин/is);
  assert.equal(referralService.account('10').metacoinBalance, 173);
  assert.equal(stateRepository.findPromo('BOT173').uses, 1);

  await handleUpdate({
    update_id: 26_102,
    callback_query: {
      id: 'my-promos-entry-again',
      data: 'billing:promo:enter:profile',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 26_103,
    message: { message_id: 26_103, chat: { id: 10 }, from: { id: 10 }, text: 'BOT173' }
  });
  assert.match(telegram.sent.at(-1).message.text, /уже активирован/i);
  assert.equal(referralService.account('10').metacoinBalance, 173);

  stateRepository.close();
  referralService.close();
});

test('selected-model promo never undercuts the provider-backed generation floor', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'metaflora-model-promo-')), 'state.sqlite');
  const model = getModelById('gpt_55');
  const prompt = 'Проверь модельную скидку';
  const basePrice = calculateModelMetacoinPrice(model, {}, {
    inputTokens: Buffer.byteLength(prompt, 'utf8'),
    outputTokens: 900
  });
  const expectedDebit = basePrice;
  const stateRepository = new AppStateRepository(path);
  const persistedReferralService = createReferralService({ databasePath: path });
  persistedReferralService.registerUser({ id: '10', username: 'tester' });
  persistedReferralService.activateSubscription({
    telegramId: '10',
    planId: 'author',
    durationMonths: 1,
    durationDays: 30,
    priceKopecks: 74_900,
    metacoins: 10_000,
    paymentId: 'promo-test-subscription'
  });
  stateRepository.createPromo({
    code: 'GPT37',
    rewardType: 'discount_percent',
    rewardValue: 37,
    modelIds: ['gpt_55', 'claude_sonnet_5'],
    maxUses: 10,
    createdBy: 'crm-owner'
  });
  stateRepository.redeemPromo('10', 'GPT37');
  stateRepository.saveUserState('10', { selectedModelId: 'gpt_55' });
  const debits = [];
  const referralService = {
    ...persistedReferralService,
    reserveMetacoins(entry) {
      debits.push(entry);
      return persistedReferralService.reserveMetacoins(entry);
    }
  };
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enablePaidProviderCalls: true, providerKeys: { polza: 'secret' } },
    stateRepository,
    referralService,
    invokeLlm: async () => ({ text: 'готово', provider: 'polza' })
  });

  await handleUpdate({
    update_id: 26_200,
    message: {
      message_id: 26_200,
      chat: { id: 10 },
      from: { id: 10, username: 'tester' },
      text: prompt
    }
  });

  assert.equal(debits.length, 1);
  assert.equal(debits[0].amount, expectedDebit);
  assert.equal(debits[0].amount, basePrice);
  assert.equal(stateRepository.findPromo('GPT37').uses, 1);

  stateRepository.close();
  persistedReferralService.close();
});

test('selected-model promo leaves an unlisted model charge unchanged', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'metaflora-model-promo-scope-')), 'state.sqlite');
  const model = getModelById('gpt_5_mini');
  const prompt = 'Эта модель не входит в промо';
  const basePrice = calculateModelMetacoinPrice(model, {}, {
    inputTokens: Buffer.byteLength(prompt, 'utf8'),
    outputTokens: 900
  });
  const stateRepository = new AppStateRepository(path);
  const promo = stateRepository.createPromo({
    code: 'CLAUDEONLY',
    rewardType: 'discount_percent',
    rewardValue: 99,
    modelIds: ['claude_sonnet_5'],
    maxUses: 10,
    createdBy: 'crm-owner'
  });
  stateRepository.saveUserState('10', {
    selectedModelId: 'gpt_5_mini',
    activePromoCode: promo.code
  });
  const debits = [];
  const referralService = createPaidReferralService(10_000);
  const originalDebit = referralService.debitMetacoins;
  referralService.debitMetacoins = (entry) => {
    debits.push(entry);
    return originalDebit(entry);
  };
  const handleUpdate = createUpdateHandler({
    telegram: createTelegramMock(),
    config: { enablePaidProviderCalls: true, providerKeys: { polza: 'secret' } },
    stateRepository,
    referralService,
    invokeLlm: async () => ({ text: 'готово', provider: 'polza' })
  });

  await handleUpdate({
    update_id: 26_300,
    message: {
      message_id: 26_300,
      chat: { id: 10 },
      from: { id: 10, username: 'tester' },
      text: prompt
    }
  });

  assert.equal(debits.length, 1);
  assert.equal(debits[0].amount, basePrice);
  stateRepository.close();
});

test('promo entry cannot report success without persistent validation', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 261,
    callback_query: {
      id: 'promo-entry-without-repository',
      data: 'billing:promo:enter',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 262,
    message: { chat: { id: 10 }, from: { id: 10 }, text: 'flora-25' }
  });

  assert.doesNotMatch(telegram.sent[1].message.text, /активный промокод/i);
  assert.match(telegram.sent[1].message.text, /не получилось активировать/i);
});

test('leaving promo entry cancels the pending code capture', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 27,
    callback_query: {
      id: 'promo-entry-cancel',
      data: 'billing:promo:enter',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 28,
    callback_query: {
      id: 'open-profile',
      data: 'task:profile',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 29,
    message: { chat: { id: 10 }, from: { id: 10 }, text: 'обычное сообщение' }
  });

  assert.match(telegram.sent[1].message.text, /^👤 <b>профиль<\/b>/);
  assert.equal(telegram.sent.length, 3);
  assert.doesNotMatch(telegram.sent[2].message.text, /введённый промокод|ввести промокод/i);
});

test('service icon installation is restricted to the configured owner', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { botOwnerId: '42' }
  });

  await handleUpdate({
    update_id: 24,
    message: {
      chat: { id: 10 },
      from: { id: 99 },
      text: '/icons'
    }
  });

  assert.match(telegram.sent[0].message.text, /команда недоступна/i);
});

test('main menu buttons open profile, tools, and support sections', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: { id: `callback-${id}`, data, message: { chat: { id: 10 } } }
  });

  await handleUpdate(callback(40, 'task:profile'));
  await handleUpdate(callback(41, 'task:tools'));
  await handleUpdate(callback(42, 'task:support'));

  assert.match(telegram.sent[0].message.text, /^👤 <b>профиль<\/b>/);
  assert.match(telegram.sent[1].message.text, /^<b>🪄 ИИ-инструменты<\/b>/);
  assert.ok(telegram.sent[1].message.reply_markup.inline_keyboard.flat().some(
    ({ callback_data }) => callback_data === 'audiostudio:home'
  ));
  assert.match(telegram.sent[2].message.text, /^🧯 поддержка/);
});

test('menu screens send one approved static photo with the caption and keep buttons clean', async () => {
  const photos = [];
  const telegram = createTelegramMock({
    async sendPhoto(chatId, data, options) {
      const result = { message_id: 700 + photos.length };
      photos.push({ chatId, data, options, result });
      return result;
    }
  });
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    menuMedia: {
      menu: {
        data: Buffer.from('menu-jpeg'),
        mimeType: 'image/jpeg',
        size: 9,
        fileName: 'main-menu.jpg'
      },
      profile: {
        data: Buffer.from('profile-jpeg'),
        mimeType: 'image/jpeg',
        size: 12,
        fileName: 'profile.jpg'
      }
    }
  });

  await handleUpdate({
    update_id: 33_001,
    message: { chat: { id: 10 }, from: { id: 10 }, text: '/menu' }
  });
  await handleUpdate({
    update_id: 33_002,
    callback_query: {
      id: 'callback-33-002',
      data: 'task:profile',
      from: { id: 10 },
      message: { chat: { id: 10 }, message_id: 700 }
    }
  });

  assert.equal(photos.length, 2);
  assert.equal(photos[0].options.fileName, 'main-menu.jpg');
  assert.equal(photos[1].options.fileName, 'profile.jpg');
  assert.match(photos[0].options.caption, /добро пожаловать/u);
  assert.match(photos[1].options.caption, /профиль/u);
  assert.equal('menuMediaKey' in photos[0].options, false);
  assert.equal('menuMediaKey' in photos[1].options, false);
  assert.equal(telegram.sent.length, 0);
});

test('all fourteen approved menu screens attach their own static media', async () => {
  const photos = [];
  const telegram = createTelegramMock({
    async sendPhoto(chatId, data, options) {
      const result = { message_id: 900 + photos.length };
      photos.push({ chatId, data, options, result });
      return result;
    }
  });
  const fileNames = [
    'main-menu.jpg', 'profile.jpg', 'balance.jpg', 'support.jpg',
    'invite.jpg', 'founder.jpg', 'llm.jpg', 'image.jpg', 'video.jpg',
    'music.jpg', 'voice.jpg', 'beta.jpg', 'tools.jpg', 'agents.jpg'
  ];
  const menuMedia = Object.fromEntries(fileNames.map((fileName) => [
    fileName.replace('.jpg', '').replace('main-menu', 'menu'),
    {
      data: Buffer.from(fileName),
      mimeType: 'image/jpeg',
      size: fileName.length,
      fileName
    }
  ]));
  const handleUpdate = createUpdateHandler({ telegram, config: {}, menuMedia });
  const message = (updateId, text) => ({
    update_id: updateId,
    message: { chat: { id: 10 }, from: { id: 10 }, text }
  });
  const callback = (updateId, data) => ({
    update_id: updateId,
    callback_query: {
      id: `callback-${updateId}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10 }, message_id: 900 + photos.length }
    }
  });

  await handleUpdate(message(34_001, '/menu'));
  await handleUpdate(message(34_002, '/profile'));
  await handleUpdate(message(34_003, '/balance'));
  await handleUpdate(message(34_004, '/support'));
  await handleUpdate(callback(34_005, 'task:invite'));
  await handleUpdate(message(34_006, '/channel'));
  await handleUpdate(message(34_007, '/text'));
  await handleUpdate(message(34_008, '/design'));
  await handleUpdate(message(34_009, '/video'));
  await handleUpdate(message(34_010, '/audio'));
  await handleUpdate(message(34_011, '/voice'));
  await handleUpdate(message(34_012, '/beta'));
  await handleUpdate(message(34_013, '/tools'));
  await handleUpdate(message(34_014, '/agents'));

  assert.deepEqual(photos.map(({ options }) => options.fileName), fileNames);
  assert.equal(photos.every(({ options }) => !('menuMediaKey' in options)), true);
});

test('every permanent menu button opens a real screen without an aggregator error', async () => {
  const labels = menuKeyboard().flat().map(({ text }) => text);

  for (const [index, label] of labels.entries()) {
    const telegram = createTelegramMock();
    const handleUpdate = createUpdateHandler({ telegram, config: {} });
    await handleUpdate({
      update_id: 2_000 + index,
      message: {
        chat: { id: 10, type: 'private' },
        from: { id: 10, username: 'menu_tester' },
        text: label
      }
    });

    const screen = telegram.sent.at(-1)?.message;
    assert.ok(screen, `no screen returned for ${label}`);
    assert.doesNotMatch(screen.text, /не получилось обработать запрос/i, label);
    assert.ok(screen.reply_markup, `no keyboard returned for ${label}`);
  }
});

test('every catalog model, card, settings screen, and option obeys Telegram UI limits', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  let updateId = 3_000;

  const open = async (data) => {
    const before = telegram.sent.length;
    await handleUpdate({
      update_id: updateId++,
      callback_query: {
        id: `callback-${updateId}`,
        data,
        from: { id: 10 },
        message: { message_id: 77, chat: { id: 10, type: 'private' } }
      }
    });
    assert.equal(telegram.sent.length, before + 1, `callback did not render: ${data}`);
    const message = telegram.sent.at(-1).message;
    assert.doesNotMatch(message.text, /не получилось обработать запрос/i, data);
    assertValidTelegramScreen(message);
    return message;
  };

  for (const category of ['llm', 'image', 'video', 'audio', 'voice', 'tools', 'russian', 'experimental', '3d']) {
    await open(`modelcat:${category}`);
  }

  for (const model of listCatalogModels()) {
    const card = await open(`model:${model.id}`);
    const settingsButton = card.reply_markup.inline_keyboard
      .flat()
      .find(({ callback_data: data }) => data === `settings:${model.id}`);
    if (!settingsButton) continue;

    const settings = await open(settingsButton.callback_data);
    for (const button of settings.reply_markup.inline_keyboard
      .flat()
      .filter(({ callback_data: data }) => data?.startsWith('setting:'))) {
      const options = await open(button.callback_data);
      const firstValue = options.reply_markup.inline_keyboard
        .flat()
        .find(({ callback_data: data }) => data?.startsWith('set:'));
      if (firstValue) await open(firstValue.callback_data);
    }

    await open(`settings:reset:${model.id}`);
    await open(`settings:done:${model.id}`);
  }
});

test('tools open directly with four file categories and one shared sound studio', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const open = async (data) => {
    await handleUpdate({
      update_id: Math.floor(Math.random() * 1_000_000),
      callback_query: {
        id: `callback-${data}`,
        data,
        from: { id: 10 },
        message: { chat: { id: 10, type: 'private' } }
      }
    });
    return telegram.sent.at(-1).message;
  };

  const root = await open('modelcat:tools');
  assert.match(root.text, /ИИ-инструменты/);
  assert.deepEqual(
    root.reply_markup.inline_keyboard.flat()
      .map(({ callback_data }) => callback_data)
      .filter((value) => value?.startsWith('toolcat:'))
      .sort(),
    ['toolcat:3d', 'toolcat:document', 'toolcat:image', 'toolcat:video']
  );
  assert.ok(root.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'audiostudio:home'));

  const image = await open('toolcat:image');
  const callbacks = image.reply_markup.inline_keyboard.flat()
    .map(({ callback_data }) => callback_data);
  assert.ok(callbacks.includes('model:photo_remove_bg'));
  assert.ok(callbacks.includes('model:photo_upscale'));
  assert.ok(!callbacks.includes('model:remove_bg'));
  assert.ok(!callbacks.includes('model:topaz_image'));
});

test('audio studio exposes 30 cards without a redundant confirmation button', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  let updateId = 7_000;
  const open = async (data) => {
    await handleUpdate({
      update_id: updateId++,
      callback_query: {
        id: `callback-${updateId}`,
        data,
        from: { id: 10 },
        message: { chat: { id: 10, type: 'private' } }
      }
    });
    return telegram.sent.at(-1).message;
  };

  const music = await open('task:audio');
  assert.match(music.text, /музыка/u);
  assert.ok(music.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data?.startsWith('model:')));
  assert.ok(music.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'audiostudio:music'));

  const studio = await open('audiostudio:music');
  assert.equal(
    studio.reply_markup.inline_keyboard.flat()
      .filter(({ callback_data }) => callback_data?.startsWith('audiocategory:')).length,
    3
  );

  const category = await open('audiocategory:music_create');
  assert.ok(category.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'audioworkflow:music_song'));

  const inactive = await open('audioworkflow:music_song');
  assert.equal(inactive.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => /^(?:audioearly|audiouse):/u.test(callback_data ?? '')), false);

  const active = await open('audioworkflow:voice_tts');
  assert.equal(active.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => /^(?:audioearly|audiouse):/u.test(callback_data ?? '')), false);
  const settings = await open('audiosettings:voice_tts');
  assert.match(settings.text, /параметры · озвучить текст/u);
  assert.ok(settings.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'audioworkflow:voice_tts'));
  assert.equal(settings.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => /^(?:modelcat|toolcat|settings):/u.test(callback_data ?? '')), false);
  const legacyModels = await open('audiomodels:audio');
  assert.match(legacyModels.text, /музыка/u);
  assert.ok(legacyModels.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data?.startsWith('model:')));
  const legacyVoiceModels = await open('audiomodels:voice');
  assert.match(legacyVoiceModels.text, /голос и речь/u);
  assert.ok(legacyVoiceModels.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'modelcat:voice'));
  const selected = await open('audiouse:voice_tts');
  assert.match(selected.text, /озвучить текст/u);
});

test('music uses the selected workflow and completes history only after Telegram delivery', async () => {
  const order = [];
  const executions = [];
  const historyService = {
    async startGeneration(payload) {
      order.push('history:start');
      assert.equal(payload.subjectId, 'music_instrumental');
      assert.equal(payload.subjectType, 'music');
      assert.equal(payload.kind, 'audio');
      return { generationId: 'g-music-1', telegramUserId: '10' };
    },
    async completeGeneration(_run, payload) {
      order.push('history:complete');
      assert.equal(payload.outputType, 'audio');
      assert.equal(payload.metacoinsCharged > 0, true);
      assert.equal(payload.provider, 'polza');
    },
    async failGeneration() { order.push('history:fail'); }
  };
  const audioWorkflowExecutor = {
    getRoute(id) { return { state: ['music_song', 'music_instrumental'].includes(id) ? 'runnable' : 'inactive' }; },
    async execute(request) {
      executions.push(request);
      order.push('provider');
      return { result: { tracks: [{ url: 'https://media.example.test/music.mp3', mimeType: 'audio/mpeg' }] } };
    }
  };
  const telegram = createTelegramMock({
    async sendAudio(chatId, source, options) {
      order.push('telegram:audio');
      this.sent.push({ chatId, source, options, message: { text: options.caption } });
      return { message_id: 501 };
    }
  });
  const handleUpdate = createUpdateHandler({ telegram, config: {}, audioWorkflowExecutor, historyService });
  let updateId = 20_000;
  const callback = (data) => handleUpdate({
    update_id: updateId++,
    callback_query: {
      id: `callback-${updateId}`, data, from: { id: 10 },
      message: { message_id: 77, chat: { id: 10, type: 'private' } }
    }
  });
  await callback('audioworkflow:music_instrumental');
  await callback('audiosettings:music_instrumental');
  await handleUpdate({
    update_id: updateId++,
    message: { message_id: 78, text: 'яркий синтвейв без вокала', from: { id: 10 }, chat: { id: 10, type: 'private' } }
  });
  await callback('musicrun:confirm');

  assert.equal(executions.length, 1);
  assert.equal(executions[0].workflowId, 'music_instrumental');
  assert.ok(order.indexOf('history:start') < order.indexOf('provider'));
  assert.ok(order.indexOf('telegram:audio') < order.indexOf('history:complete'));
  assert.equal(order.includes('history:fail'), false);
});

test('runnable text music workflows use constructor confirmation and back without category echo', async () => {
  const telegram = createTelegramMock();
  const audioWorkflowExecutor = {
    getRoute(id) {
      return { state: ['music_song', 'music_instrumental', 'music_jingle', 'music_loop'].includes(id) ? 'runnable' : 'inactive' };
    }
  };
  const handleUpdate = createUpdateHandler({ telegram, config: {}, audioWorkflowExecutor });
  let updateId = 20_500;
  const callback = async (data) => {
    await handleUpdate({
      update_id: updateId++,
      callback_query: {
        id: `callback-${updateId}`,
        data,
        from: { id: 10 },
        message: { message_id: 88, chat: { id: 10, type: 'private' } }
      }
    });
    return telegram.sent.at(-1).message;
  };

  await callback('audioworkflow:music_jingle');
  const settings = await callback('audiosettings:music_jingle');
  assert.match(settings.text, /^<b>⚙️ параметры<\/b>/u);
  assert.doesNotMatch(settings.text, /параметры ·/u);
  assert.equal(settings.reply_markup.inline_keyboard.flat().some(({ text }) => text === '✍️ промпт'), false);
  assert.equal(settings.reply_markup.inline_keyboard.flat().some(({ text }) => text === '👁 проверить и создать'), false);

  await handleUpdate({
    update_id: updateId++,
    message: { message_id: 89, text: 'короткая радостная заставка для подкаста', from: { id: 10 }, chat: { id: 10, type: 'private' } }
  });
  const confirmation = await callback('musicset:confirm:open');
  assert.match(confirmation.text, /^<b>👁‍🗨 проверь, что всё на месте<\/b>/u);
  assert.equal(
    confirmation.reply_markup.inline_keyboard.flat().find(({ callback_data }) => callback_data === 'musicrun:confirm')?.text,
    '▶️ создать заставку'
  );

  const card = await callback('audioworkflow:music_jingle');
  assert.match(card.text, /создать заставку/u);
  assert.doesNotMatch(card.text, /музыка, голос и звук/u);
});

test('music delivery failure marks generation history as failed', async () => {
  const order = [];
  const historyService = {
    async startGeneration() { order.push('start'); return { generationId: 'g2', telegramUserId: '10' }; },
    async completeGeneration() { order.push('complete'); },
    async failGeneration() { order.push('fail'); }
  };
  const audioWorkflowExecutor = {
    getRoute() { return { state: 'runnable' }; },
    async execute() { return { result: { tracks: [{ url: 'https://media.example.test/music.mp3' }] } }; }
  };
  const telegram = createTelegramMock({ async sendAudio() { throw new Error('Telegram audio network failure'); } });
  const handleUpdate = createUpdateHandler({ telegram, config: {}, audioWorkflowExecutor, historyService });
  let id = 21_000;
  const callback = (data) => handleUpdate({ update_id: id++, callback_query: { id: `c-${id}`, data, from: { id: 10 }, message: { message_id: 91, chat: { id: 10, type: 'private' } } } });
  await callback('audioworkflow:music_song');
  await callback('audiosettings:music_song');
  await handleUpdate({ update_id: id++, message: { message_id: 92, text: 'песня о городе', from: { id: 10 }, chat: { id: 10, type: 'private' } } });
  await callback('musicrun:confirm');
  assert.deepEqual(order, ['start', 'fail']);
});

test('video dubbing collects voice, audio mix, video and language then executes once on retry', async () => {
  const executions = [];
  const settlements = [];
  const audioWorkflowExecutor = {
    getRoute(id) { return { state: id === 'voice_dub_video' ? 'runnable' : 'missing' }; },
    async execute(request) {
      executions.push(request);
      return { workflowId: request.workflowId, reservation: { id: 'r1', currency: 'METACOIN', total: 10 }, result: { dubbingId: 'dub_1', media: Buffer.from('video'), contentType: 'video/mp4' } };
    },
    async settleDelivery(request) { settlements.push(request); }
  };
  const telegram = createTelegramMock({
    async sendVideo(chatId, source, options) {
      this.sent.push({ chatId, source, options, message: { text: options.caption } });
      return { message_id: this.sent.length + 100 };
    },
    async getFile() { return { file_path: 'video.mp4', file_size: 5 }; },
    async downloadFile() {
      return { data: Buffer.from('video'), mimeType: 'video/mp4', fileName: 'video.mp4' };
    }
  });
  const handleUpdate = createUpdateHandler({ telegram, config: {}, audioWorkflowExecutor });
  const callback = (id, data) => handleUpdate({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  await callback(8_000, 'audioworkflow:voice_dub_video');
  assert.ok(telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'audiodub:voice'));
  await callback(8_001, 'audiodubvoice:elv_000000000000000000000001');
  await callback(8_002, 'audiodubset:mix');
  await handleUpdate({ update_id: 8_003, message: {
    message_id: 8_003,
    chat: { id: 10, type: 'private' },
    from: { id: 10 },
    video: { file_id: 'telegram-video-1', duration: 12, mime_type: 'video/mp4' }
  } });
  await handleUpdate({ update_id: 8_005, message: {
    message_id: 8_005,
    chat: { id: 10, type: 'private' },
    from: { id: 10 },
    text: 'ru'
  } });
  await handleUpdate({ update_id: 8_004, message: {
    message_id: 8_004,
    chat: { id: 10, type: 'private' },
    from: { id: 10 },
    text: 'ru'
  } });

  assert.equal(executions.length, 1);
  assert.equal(executions[0].workflowId, 'voice_dub_video');
  assert.equal(executions[0].requestKey, 'audio-dub:10:8003');
  assert.equal(executions[0].inputs.target_language, 'ru');
  assert.equal(executions[0].inputs.voice.type, 'curated');
  assert.equal(executions[0].settings.source_audio, 'смешать');
  assert.equal(executions[0].settings.source_audio_mix, 25);
  assert.deepEqual(executions[0].inputs.video.bytes, Buffer.from('video'));
  assert.equal(settlements.length, 1);
  assert.equal(settlements[0].requestKey, executions[0].requestKey);
});

test('ИИ-агенты и ИИ-инструменты открывают свои каталоги и сбрасывают старый FLUX', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  await handleUpdate(callback(7_100, 'model:flux_2_flex'));
  await handleUpdate(callback(7_101, 'task:agents'));
  assert.match(telegram.sent.at(-1).message.text, /ИИ-агенты/u);

  await handleUpdate({ update_id: 7_102, message: {
    message_id: 7_102,
    chat: { id: 10, type: 'private' },
    from: { id: 10 },
    text: 'проверь маршрутизацию'
  } });
  assert.doesNotMatch(telegram.sent.at(-1).message.text, /FLUX 2 Flex/u);

  await handleUpdate(callback(7_103, 'task:tools'));
  const tools = telegram.sent.at(-1).message;
  assert.match(tools.text, /ИИ-инструменты/u);
  assert.equal(
    tools.reply_markup.inline_keyboard.flat()
      .find(({ callback_data }) => callback_data === 'audiostudio:home')?.style,
    undefined
  );
});

test('выбранный голос принимает текст, показывает расчёт и отдаёт готовый MP3', async (t) => {
  const voices = Object.freeze(Array.from({ length: 80 }, (_, index) => {
    const id = `elv_${String(index + 1).padStart(24, '0')}`;
    return Object.freeze({
      id,
      name: `Голос ${index + 1}`,
      description: 'голос для роликов и подкастов',
      category: 'premade',
      labels: Object.freeze({ language: 'русский', accent: 'нейтральный' }),
      preview: Object.freeze({ type: 'id', value: `voice-preview-${id}` })
    });
  }));
  setCuratedVoices(voices);
  t.after(() => clearCuratedVoices());
  const speechCalls = [];
  const audio = [];
  const telegram = createTelegramMock({
    async sendAudio(chatId, source, options) {
      audio.push({ chatId, source, options });
      return { message_id: 900 };
    }
  });
  const voiceService = {
    async previewVoice() {
      throw new Error('preview storage unavailable');
    },
    async textToSpeech(input) {
      speechCalls.push(input);
      return { audio: Buffer.from('mp3-result'), contentType: 'audio/mpeg' };
    }
  };
  const quotaClaims = [];
  const historyService = {
    async captureUpdate() {},
    async claimFreeWeeklyRequest(value) {
      quotaClaims.push(value);
      return {
        allowed: true,
        used: 1,
        limit: 5,
        remaining: 4,
        duplicate: false
      };
    },
    async releaseFreeWeeklyRequest() {
      throw new Error('successful free voice generation must keep its quota claim');
    }
  };
  const referralService = {
    registerUser({ id: actorId }) { return { telegramId: String(actorId) }; },
    markStarted() {},
    account() {
      return {
        subscriptionPlanId: 'newcomer',
        subscriptionExpiresAt: null,
        metacoinBalance: 0
      };
    },
    debitMetacoins() {
      throw new Error('free voice generation must not debit metacoins');
    }
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    voiceService,
    referralService,
    historyService
  });
  const id = voices[0].id;

  await handleUpdate({
    update_id: 7_200,
    callback_query: {
      id: 'callback-7200',
      data: `voiceuse:${id}`,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });
  assert.match(telegram.sent.at(-1).message.text, /пришли текст/u);

  await handleUpdate({
    update_id: 7_201,
    message: {
      message_id: 7_201,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: 'Текст для готового аудиофайла.'
    }
  });
  assert.equal(speechCalls.length, 1);
  assert.equal(speechCalls[0].text, 'Текст для готового аудиофайла.');
  assert.deepEqual(speechCalls[0].voice, { type: 'curated', id });
  assert.equal(speechCalls[0].outputFormat, 'mp3_44100_128');
  assert.equal(audio.length, 1);
  assert.ok(telegram.deleted.some(({ chatId, messageId }) => chatId === 10 && messageId === 101));
  assert.equal(audio[0].options.fileName, 'metaflora-voice.mp3');
  assert.match(audio[0].options.caption, /готовый MP3/u);
  assert.match(audio[0].options.caption, /tg-emoji|🪙/u);
  assert.match(audio[0].options.caption, /списано:.*0 метакоинов/u);
  assert.deepEqual(quotaClaims, [{
    telegramUserId: 10,
    requestKey: 'voice-tts:10:7201',
    quotaKey: 'voice',
    requestLimit: 5
  }]);

  await handleUpdate({
    update_id: 7_202,
    callback_query: {
      id: 'callback-7202',
      data: `voicepreview:${id}`,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });
  assert.match(telegram.sent.at(-1).message.text, /превью не загрузилось/u);
});

test('voice preview is temporary and returning to the card removes only the preview message', async (t) => {
  const voices = Object.freeze(Array.from({ length: 80 }, (_, index) => {
    const id = 'elv_' + String(index + 1).padStart(24, '0');
    return Object.freeze({
      id,
      name: index === 0 ? 'Тестовый голос' : 'Голос ' + (index + 1),
      description: 'живой голос для коротких роликов и подкастов',
      category: 'premade',
      labels: Object.freeze({ language: 'русский', accent: 'нейтральный' }),
      preview: Object.freeze({ type: 'id', value: 'voice-preview-' + id })
    });
  }));
  const id = voices[0].id;
  setCuratedVoices(voices);
  t.after(() => clearCuratedVoices());
  const audio = [];
  const editAttempts = [];
  const telegram = createTelegramMock({
    async sendAudio(chatId, source, options) {
      audio.push({ chatId, source, options });
      return { message_id: 900 };
    },
    async editMessageText(chatId, messageId) {
      editAttempts.push({ chatId, messageId });
      throw new Error('audio messages cannot be edited as text');
    }
  });
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    voiceService: {
      async previewVoice() {
        return { audio: Buffer.from('preview'), contentType: 'audio/mpeg' };
      }
    }
  });
  const callback = (updateId, data, messageId) => ({
    update_id: updateId,
    callback_query: {
      id: 'callback-' + updateId,
      data,
      from: { id: 10 },
      message: { message_id: messageId, chat: { id: 10, type: 'private' } }
    }
  });

  await handleUpdate(callback(7_210, 'voicecard:' + id, null));
  await handleUpdate(callback(7_211, 'voicepreview:' + id, 100));
  assert.equal(audio.length, 1);
  assert.equal(telegram.deleted.length, 0);

  await handleUpdate(callback(7_212, 'voicecard:' + id, 900));

  assert.deepEqual(telegram.deleted, [
    { chatId: 10, messageId: 900 },
    { chatId: 10, messageId: 100 }
  ]);
  assert.deepEqual(editAttempts, []);
  assert.equal(telegram.sent.length, 2);
  assert.match(telegram.sent.at(-1).message.text, /Тестовый голос/u);
  assert.equal(telegram.sent.at(-1).result.message_id, 101);
});

test('voice preview cleanup timer removes only the current audio and keeps the card', async (t) => {
  const voices = Object.freeze(Array.from({ length: 80 }, (_, index) => {
    const id = 'elv_' + String(index + 1).padStart(24, '0');
    return Object.freeze({
      id,
      name: index === 0 ? 'Таймерный голос' : 'Голос ' + (index + 1),
      description: 'живой голос для коротких роликов и подкастов',
      category: 'premade',
      labels: Object.freeze({ language: 'русский', accent: 'нейтральный' }),
      preview: Object.freeze({ type: 'id', value: 'voice-preview-' + id })
    });
  }));
  const id = voices[0].id;
  setCuratedVoices(voices);
  t.after(() => clearCuratedVoices());
  const timers = [];
  const cancelledTimers = [];
  let nextAudioMessageId = 900;
  const telegram = createTelegramMock({
    async sendAudio() {
      const messageId = nextAudioMessageId;
      nextAudioMessageId += 1;
      return { message_id: messageId };
    }
  });
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    setTimeoutFn(callback, delay) {
      const timer = { callback, delay };
      timers.push(timer);
      return timer;
    },
    clearTimeoutFn(timer) {
      cancelledTimers.push(timer);
    },
    voiceService: {
      async previewVoice() {
        return { audio: Buffer.from('preview'), contentType: 'audio/mpeg' };
      }
    }
  });
  const callback = (updateId, data, messageId) => ({
    update_id: updateId,
    callback_query: {
      id: 'callback-' + updateId,
      data,
      from: { id: 10 },
      message: { message_id: messageId, chat: { id: 10, type: 'private' } }
    }
  });

  await handleUpdate(callback(7_220, 'voicecard:' + id, 70));
  await handleUpdate(callback(7_221, 'voicepreview:' + id, 100));
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 4_000);
  assert.deepEqual(telegram.deleted, []);

  await handleUpdate(callback(7_222, 'voicepreview:' + id, 100));
  assert.deepEqual(telegram.deleted, [{ chatId: 10, messageId: 900 }]);
  assert.ok(cancelledTimers.includes(timers[0]));

  await timers[0].callback();
  assert.deepEqual(telegram.deleted, [{ chatId: 10, messageId: 900 }]);

  await timers[1].callback();
  assert.deepEqual(telegram.deleted, [
    { chatId: 10, messageId: 900 },
    { chatId: 10, messageId: 901 }
  ]);
  assert.ok(cancelledTimers.includes(timers[1]));
  assert.equal(telegram.deleted.some(({ messageId }) => messageId === 100), false);
  assert.equal(telegram.sent.length, 1);
  assert.match(telegram.sent[0].message.text, /Таймерный голос/u);
});

test('кнопки постоянного меню с капсом ИИ ведут сразу в нужные разделы', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const send = async (updateId, text) => {
    await handleUpdate({
      update_id: updateId,
      message: {
        message_id: updateId,
        chat: { id: 77, type: 'private' },
        from: { id: 77 },
        text
      }
    });
    return telegram.sent.at(-1).message;
  };

  const tools = await send(7_300, '🪄 ИИ-инструменты');
  assert.match(tools.text, /<b>🪄 ИИ-инструменты<\/b>/u);
  assert.doesNotMatch(tools.text, /текст \/ код \/ поиск/u);

  const voice = await send(7_301, '🎙 озвучка / расшифровка');
  assert.match(voice.text, /<b>🎙 озвучка \/ расшифровка<\/b>/u);
  assert.ok(voice.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'audiostudio:voice'));
  assert.ok(voice.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data?.startsWith('model:')));

  const agents = await send(7_302, '🤖 ИИ-агенты');
  assert.match(agents.text, /ИИ-агенты/u);
});

test('catalog navigation survives a temporary referral database failure', async () => {
  const telegram = createTelegramMock();
  const errors = [];
  const referralService = {
    registerUser() { throw new Error('database is busy'); }
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    referralService,
    onError: (error) => errors.push(error)
  });

  for (const [index, label] of [
    '🎬 видео',
    '🪄 ИИ-инструменты',
    '🇷🇺 российские',
    '🧪 экспериментальные',
    '🧪 бета-модели'
  ].entries()) {
    await handleUpdate({
      update_id: 2_100 + index,
      message: {
        chat: { id: 10, type: 'private' },
        from: { id: 10 },
        text: label
      }
    });
    assert.doesNotMatch(telegram.sent.at(-1).message.text, /не получилось обработать запрос/i);
  }

  assert.equal(errors.length, 5);
});

test('new and legacy catalog callbacks open the renamed model routes', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const catalogCallback = (id, data) => ({
    update_id: id,
    callback_query: { id: `callback-${id}`, data, message: { chat: { id: 10 } } }
  });

  await handleUpdate(catalogCallback(2_200, 'family:russian'));
  await handleUpdate(catalogCallback(2_201, 'modelcat:russian'));
  await handleUpdate(catalogCallback(2_202, 'modelcat:beta'));
  await handleUpdate(catalogCallback(2_203, 'modelcat:experimental'));

  assert.match(telegram.sent[0].message.text, /^<b>open-source<\/b>/);
  assert.match(telegram.sent[1].message.text, /^<b>open-source<\/b>/);
  assert.match(telegram.sent[2].message.text, /^<b>🧪 бета-модели<\/b>/);
  assert.match(telegram.sent[3].message.text, /^<b>🧪 бета-модели<\/b>/);
});

test('founder channel menu button opens the approved card and channel link', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 421,
    message: {
      chat: { id: 10 },
      from: { id: 10 },
      text: '📡 канал фаундера'
    }
  });

  const message = telegram.sent.at(-1).message;
  assert.equal(message.parse_mode, 'HTML');
  assert.deepEqual(message.link_preview_options, { is_disabled: true });
  assert.match(message.text, /^📡 <b>канал фаундера<\/b>/);
  assert.match(message.text, /десятки гайдов по нейросетям, готовые промпты/);
  assert.match(message.text, /<b>только то, чем пользуюсь сам каждый день\.<\/b>/);
  assert.match(message.text, /подпишись, чтобы не пропускать полезные материалы и обновления👇$/);
  assert.doesNotMatch(message.text, /metamishchenko|Иван|Мищенко/);

  const buttons = message.reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some(({ text, url }) => (
    text === 'подписаться ↗' && url === 'https://t.me/metamishchenko'
  )));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'task:menu'));
});

test('founder channel callback edits the current screen into the same channel card', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 422,
    callback_query: {
      id: 'callback-422',
      data: 'task:founder-channel',
      from: { id: 10 },
      message: { message_id: 77, chat: { id: 10 } }
    }
  });

  const message = telegram.sent[0].message;
  assert.equal(message.parse_mode, 'HTML');
  assert.deepEqual(message.link_preview_options, { is_disabled: true });
  assert.match(message.text, /^📡 <b>канал фаундера<\/b>/);
  assert.ok(message.reply_markup.inline_keyboard.flat().some(({ text, url }) => (
    text === 'подписаться ↗' && url === 'https://t.me/metamishchenko'
  )));
});


test('invite button creates a personal share link and keeps menu navigation', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralService({
    randomToken: () => 'K7m4Q2x9Qa12',
    now: () => new Date('2026-07-24T01:00:00.000Z')
  });
  const handleUpdate = createUpdateHandler({ telegram, config: {}, referralService });

  await handleUpdate({
    update_id: 43,
    callback_query: {
      id: 'callback-43',
      data: 'task:invite',
      from: { id: 9876, username: 'ivan_test', first_name: 'Иван' },
      message: { chat: { id: 10 } }
    }
  });

  const message = telegram.sent[0].message;
  const buttons = message.reply_markup.inline_keyboard.flat();
  assert.match(message.text, /start=ref_ivan_test_K7m4Q2x9Qa12/);
  assert.match(message.text, /<b>реферальная программа<\/b>/);
  assert.match(message.text, /25% метакоинами/);
  assert.ok(buttons.some((button) => button.url?.startsWith('https://t.me/share/url?')));
  assert.ok(buttons.some((button) => button.callback_data === 'ref:people'));
  assert.ok(buttons.some((button) => button.callback_data === 'ref:earnings'));
  assert.ok(buttons.some((button) => button.callback_data === 'ref:withdraw'));
  assert.ok(buttons.some((button) => button.callback_data === 'task:menu'));
  assert.ok(buttons.some((button) => button.callback_data === 'task:profile'));
  referralService.close();
});

test('start payload permanently binds a new user to the referral code owner', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralService({
    randomToken: () => 'K7m4Q2x9Qa12',
    now: () => new Date('2026-07-24T01:00:00.000Z')
  });
  const inviter = referralService.registerUser({ id: 50, username: 'inviter', first_name: 'Иван' });
  const handleUpdate = createUpdateHandler({ telegram, config: {}, referralService });

  await handleUpdate({
    update_id: 431,
    message: {
      message_id: 91,
      chat: { id: 60 },
      from: { id: 60, username: 'new_user', first_name: 'Олег' },
      text: `/start ref_${inviter.referralCode}`
    }
  });

  assert.equal(referralService.getUser(60).referrerId, '50');
  assert.match(telegram.sent[0].message.text, /добро пожаловать/);
  referralService.close();
});

test('a later referral start cannot claim a user who already started the bot', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralService({
    randomToken: () => 'K7m4Q2x9Qa12',
    now: () => new Date('2026-07-24T01:00:00.000Z')
  });
  const inviter = referralService.registerUser({ id: 50, username: 'inviter', first_name: 'Иван' });
  const handleUpdate = createUpdateHandler({ telegram, config: {}, referralService });

  await handleUpdate({
    update_id: 439,
    message: { chat: { id: 60 }, from: { id: 60, username: 'old_user' }, text: '/start' }
  });
  await handleUpdate({
    update_id: 440,
    message: {
      chat: { id: 60 },
      from: { id: 60, username: 'old_user' },
      text: `/start ref_${inviter.referralCode}`
    }
  });

  assert.equal(referralService.getUser(60).referrerId, null);
  referralService.close();
});

test('referral cabinet callbacks open people, earnings, levels, and withdrawal screens', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralService({
    randomToken: () => 'K7m4Q2x9Qa12',
    now: () => new Date('2026-07-24T01:00:00.000Z')
  });
  const handleUpdate = createUpdateHandler({ telegram, config: {}, referralService });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10, username: 'ivan_test', first_name: 'Иван' },
      message: { chat: { id: 10 } }
    }
  });

  await handleUpdate(callback(432, 'ref:people'));
  await handleUpdate(callback(433, 'ref:earnings'));
  await handleUpdate(callback(434, 'ref:levels'));
  await handleUpdate(callback(435, 'ref:withdraw'));

  assert.match(telegram.sent[0].message.text, /<b>мои рефералы<\/b>/);
  assert.match(telegram.sent[1].message.text, /<b>начисления<\/b>/);
  assert.match(telegram.sent[2].message.text, /классика · 25%/);
  assert.match(telegram.sent[3].message.text, /минимальная сумма: <b>1 000 ₽<\/b>/);
  referralService.close();
});

test('withdrawal flow validates amount and stores payout details', async () => {
  const telegram = createTelegramMock();
  const requests = [];
  const account = {
    referralUrl: 'https://t.me/neuro_metaflora_bot?start=ref_test_AbCdEf123456',
    level: { name: 'классика', percent: 25, next: null },
    invited: 1,
    paidReferrals: 1,
    referralTurnoverKopecks: 1_000_000,
    availableKopecks: 150_000,
    pendingKopecks: 0,
    lifetimeKopecks: 150_000,
    metacoinBalance: 0,
    availableBoosts: 0
  };
  const referralService = {
    registerUser() {},
    account() { return account; },
    listReferrals() { return []; },
    listEarnings() { return []; },
    requestWithdrawal(request) {
      requests.push(request);
      return { status: 'pending' };
    }
  };
  const handleUpdate = createUpdateHandler({ telegram, config: {}, referralService });

  await handleUpdate({
    update_id: 436,
    callback_query: {
      id: 'callback-436',
      data: 'ref:withdraw:start',
      from: { id: 10, username: 'ivan_test' },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 437,
      message: { message_id: 92, chat: { id: 10 }, from: { id: 10 }, text: '1500' }
  });
  await handleUpdate({
    update_id: 4371,
    callback_query: {
      id: 'callback-4371',
      data: 'ref:withdraw:method:sbp',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 438,
    message: { message_id: 93, chat: { id: 10 }, from: { id: 10 }, text: '+79990000000' }
  });

  assert.match(telegram.sent[0].message.text, /сумма вывода/);
  assert.match(telegram.sent[1].message.text, /способ выплаты/);
  assert.match(telegram.sent[2].message.text, /реквизиты для вывода/);
  assert.match(telegram.sent[3].message.text, /заявка на вывод создана/);
  assert.deepEqual(requests, [{
    telegramId: 10,
    amountKopecks: 150_000,
    method: 'sbp',
    destination: '+79990000000'
  }]);
});

test('balance button and its back navigation keep the approved balance image attached', async () => {
  const photos = [];
  const telegram = createTelegramMock({
    async sendPhoto(chatId, data, options) {
      const result = { message_id: 990 + photos.length, photo: [{ file_id: 'balance-file-id' }] };
      photos.push({ chatId, data, options, result });
      return result;
    }
  });
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    menuMedia: {
      balance: {
        data: Buffer.from('balance-image'),
        mimeType: 'image/jpeg',
        size: 13,
        fileName: 'balance.jpg'
      }
    }
  });

  await handleUpdate({ update_id: 44, message: { chat: { id: 10 }, text: '🪙 пополнить баланс' } });
  await handleUpdate({
    update_id: 45,
    callback_query: {
      id: 'callback-balance-plans',
      data: 'billing:plans:balance',
      from: { id: 10 },
      message: { chat: { id: 10 }, message_id: 990 }
    }
  });
  await handleUpdate({
    update_id: 46,
    callback_query: {
      id: 'callback-balance-back',
      data: 'billing:home',
      from: { id: 10 },
      message: { chat: { id: 10 }, message_id: 991 }
    }
  });

  assert.equal(photos.length, 2);
  for (const photo of photos) {
    assert.equal(photo.options.fileName, 'balance.jpg');
    assert.match(photo.options.caption, /<b>пополнить баланс<\/b>/);
    assert.match(photo.options.caption, /0 метакоинов/);
    assert.equal(photo.options.parse_mode, 'HTML');
  }
});

test('profile generation history opens a paginated list and a generation card', async () => {
  const telegram = createTelegramMock();
  const calls = [];
  const generation = Object.freeze({
    id: 'adca3a69-1fa9-47ac-92a3-b9f7b9675579',
    kind: 'image',
    subjectLabel: 'убрать фон',
    prompt: 'оставь предмет, фон сделай прозрачным',
    status: 'completed',
    metacoinsCharged: 7,
    outputType: 'image',
    createdAt: '2026-07-27T01:35:00.000Z',
    metadata: { url: 'https://cdn.example.test/generation.png' }
  });
  const historyService = {
    async captureUpdate() {},
    async listGenerations(query) {
      calls.push(['list', query]);
      return { items: [generation], hasMore: true };
    },
    async getGeneration(query) {
      calls.push(['get', query]);
      return generation;
    }
  };
  const handleUpdate = createUpdateHandler({ telegram, config: {}, historyService });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { message_id: 80, chat: { id: 10 } }
    }
  });

  await handleUpdate(callback(446, 'genhist:list:0'));
  await handleUpdate(callback(447, 'genhist:list:1'));
  await handleUpdate(callback(448, `genhist:item:${generation.id}:1`));

  assert.deepEqual(calls, [
    ['list', { telegramUserId: '10', limit: 6, offset: 0, scope: 'media' }],
    ['list', { telegramUserId: '10', limit: 6, offset: 6, scope: 'media' }],
    ['get', { telegramUserId: '10', generationId: generation.id }]
  ]);
  assert.match(telegram.sent[0].message.text, /^🖌️ <b>история генераций<\/b>/u);
  assert.match(telegram.sent[2].message.text, /^🖼 <b>изображение · убрать фон<\/b>/u);
  assert.ok(telegram.sent[0].message.reply_markup.inline_keyboard.flat().some(
    ({ text }) => text === 'убрать фон · 1'
  ));
  assert.match(telegram.sent[2].message.text, /<b>исходный промпт:<\/b>/u);
  assert.ok(telegram.sent[2].message.reply_markup.inline_keyboard.flat().some(
    ({ text, url }) => text === '🔗 прямая ссылка' && url === 'https://cdn.example.test/generation.png'
  ));
  assert.ok(telegram.sent[2].message.reply_markup.inline_keyboard.flat().some(
    ({ text, callback_data }) => text === '🔁 перегенерировать'
      && callback_data === `genhist:repeat:${generation.id}`
  ));
  assert.ok(telegram.sent[2].message.reply_markup.inline_keyboard.flat().some(
    ({ callback_data }) => callback_data === 'genhist:list:1'
  ));
});

test('generation history handles missing storage and inaccessible records without exposing errors', async () => {
  const telegram = createTelegramMock();
  const historyService = {
    async captureUpdate() {},
    async listGenerations() { throw new Error('database password leaked'); },
    async getGeneration() { return null; }
  };
  const handleUpdate = createUpdateHandler({ telegram, config: {}, historyService });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { message_id: 80, chat: { id: 10 } }
    }
  });

  await handleUpdate(callback(448, 'genhist:list:0'));
  await handleUpdate(callback(449, 'genhist:item:adca3a69-1fa9-47ac-92a3-b9f7b9675579:0'));

  assert.match(telegram.sent[0].message.text, /история временно не загрузилась/u);
  assert.match(telegram.sent[1].message.text, /история временно не загрузилась/u);
  assert.doesNotMatch(telegram.sent.map(({ message }) => message.text).join(' '), /password leaked/u);
});

test('billing callbacks lead from the catalog to a final purchase card', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });

  await handleUpdate(callback(440, 'billing:plans'));
  await handleUpdate(callback(441, 'billing:plan:author:1'));
  await handleUpdate(callback(442, 'billing:packages'));
  await handleUpdate(callback(443, 'billing:package:coins_400'));

  assert.match(telegram.sent[0].message.text, /<b>актуальные тарифы<\/b>/);
  assert.match(telegram.sent[1].message.text, /^💳 <b>счёт на оплату<\/b>/);
  assert.match(telegram.sent[1].message.text, /<b>тариф:<\/b> автор/);
  assert.match(telegram.sent[2].message.text, /^<b>докупить метакоины<\/b>/);
  assert.match(telegram.sent[3].message.text, /<b>метакоины: 400 метакоинов<\/b>/u);
  assert.ok(telegram.sent[3].message.reply_markup.inline_keyboard.flat()
    .some((button) => button.callback_data?.startsWith('billing:checkout:package:coins_400:balance:')));
});

test('billing checkout back keeps the screen origin', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });

  await handleUpdate(callback(444, 'billing:checkout:plan:author:1:balance'));
  await handleUpdate(callback(445, 'billing:checkout:package:coins_400:profile'));

  const planButtons = telegram.sent[0].message.reply_markup.inline_keyboard.flat();
  const packageButtons = telegram.sent[1].message.reply_markup.inline_keyboard.flat();
  assert.ok(planButtons.some(({ text, callback_data }) => (
    text === '‹ назад' && callback_data === 'billing:planinfo:author:balance'
  )));
  assert.ok(packageButtons.some(({ text, callback_data }) => (
    text === '‹ назад' && callback_data === 'billing:packages:profile'
  )));
});

test('configured crypto rail handles its own checkout without asking for a receipt e-mail', async () => {
  const telegram = createTelegramMock();
  const calls = [];
  const cryptoService = {
    async createCheckout(value) {
      calls.push(value);
      return {
        confirmationUrl: 'https://pay.example/crypto?quote=signed',
        amountUsdcMicros: 12_500_000,
        currency: 'USDC',
        chain: 'base'
      };
    }
  };
  const paymentRails = {
    get(name) { return name === 'crypto_usdc' ? cryptoService : null; },
    enabledMethods() { return ['crypto_usdc']; }
  };
  const handleUpdate = createUpdateHandler({ telegram, config: {}, paymentRails });

  await handleUpdate({
    update_id: 4461,
    callback_query: {
      id: 'callback-crypto-4461',
      data: 'billing:checkout:crypto_usdc:package:coins_150:balance',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].productId, 'coins_150');
  assert.equal(calls[0].receiptEmail, undefined);
  assert.match(telegram.sent.at(-1).message.text, /12,50 USDC/u);
  assert.match(telegram.sent.at(-1).message.text, /Base/u);
  assert.equal(
    telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat().find(({ url }) => url)?.url,
    'https://pay.example/crypto?quote=signed'
  );
});

test('configured billing checkout stores the receipt email and skips the prompt on later purchases', async () => {
  const telegram = createTelegramMock();
  const calls = [];
  const savedEmails = [];
  let storedEmail = null;
  const paymentService = {
    async createCheckout(value) {
      calls.push(value);
      return {
        confirmationUrl: 'https://yookassa.ru/checkout/example',
        amountKopecks: 19_900
      };
    }
  };
  const historyService = {
    async getReceiptEmail() {
      return storedEmail;
    },
    async saveReceiptEmail({ email }) {
      storedEmail = email;
      savedEmails.push(email);
      return true;
    }
  };
  const handleUpdate = createUpdateHandler({ telegram, config: {}, paymentService, historyService });

  await handleUpdate({
    update_id: 446,
    callback_query: {
      id: 'callback-446',
      data: 'billing:checkout:package:coins_150:balance',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });

  assert.match(telegram.sent[0].message.text, /e-mail для чека/i);

  await handleUpdate({
    update_id: 447,
    message: {
      message_id: 94,
      chat: { id: 10 },
      from: { id: 10 },
      text: 'buyer@example.com'
    }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].telegramUserId, '10');
  assert.equal(calls[0].productId, 'coins_150');
  assert.equal(calls[0].receiptEmail, 'buyer@example.com');
  assert.deepEqual(savedEmails, ['buyer@example.com']);
  const payButton = telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat()
    .find(({ url }) => url);
  assert.equal(payButton.url, 'https://yookassa.ru/checkout/example');

  await handleUpdate({
    update_id: 448,
    callback_query: {
      id: 'callback-448',
      data: 'billing:checkout:package:coins_150:balance',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });

  assert.equal(calls.length, 2);
  assert.equal(savedEmails.length, 1);
  assert.doesNotMatch(telegram.sent.at(-1).message.text, /e-mail для чека/i);
});

test('pending receipt email does not trap the user inside the payment flow', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    paymentService: {
      async createCheckout() {
        return {
          confirmationUrl: 'https://yookassa.ru/checkout/example',
          amountKopecks: 19_900
        };
      }
    },
    historyService: {
      async getReceiptEmail() {
        return null;
      },
      async saveReceiptEmail() {
        return true;
      }
    }
  });

  await handleUpdate({
    update_id: 449,
    callback_query: {
      id: 'callback-449',
      data: 'billing:checkout:package:coins_150:balance',
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  });
  assert.match(telegram.sent.at(-1).message.text, /e-mail для чека/u);

  await handleUpdate({
    update_id: 450,
    message: {
      message_id: 450,
      chat: { id: 10 },
      from: { id: 10 },
      text: '👤 профиль'
    }
  });

  assert.match(telegram.sent.at(-1).message.text, /профиль/u);
  assert.doesNotMatch(telegram.sent.at(-1).message.text, /нужен настоящий e-mail/u);
});

test('profile stays focused on the account after a model is selected', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 23,
    callback_query: {
      id: 'callback-23',
      data: 'model:nano_banana_pro',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 231,
    callback_query: {
      id: 'callback-231',
      data: 'use:nano_banana_pro',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({ update_id: 24, message: { chat: { id: 10 }, text: '/profile' } });

  assert.match(telegram.sent.at(-1).message.text, /^👤 <b>профиль<\/b>/);
  assert.doesNotMatch(telegram.sent.at(-1).message.text, /Nano Banana Pro|текущая модель/i);
});

test('profile history buttons open generation history and dialog branches', async () => {
  const telegram = createTelegramMock();
  const calls = [];
  const historyService = {
    async listGenerations(payload) {
      calls.push(['listGenerations', payload]);
      return {
        items: [{
          id: 'generation-id',
          kind: 'text',
          subjectId: 'gpt_oss_20b_free',
          status: 'completed',
          metacoinsCharged: 7,
          createdAt: '2026-07-27T00:00:00.000Z',
          finishedAt: '2026-07-27T00:01:00.000Z',
          promptPreview: 'напиши план запуска'
        }]
      };
    },
    async listDialogs(payload) {
      calls.push(['listDialogs', payload]);
      return {
        items: [{
          id: '00000000-0000-4000-8000-000000000001',
          title: 'план запуска',
          messageCount: 2,
          latestMessageAt: '2026-07-27T00:01:00.000Z',
          lastMessagePreview: 'готовый ответ'
        }]
      };
    },
    async getDialog(payload) {
      calls.push(['getDialog', payload]);
      return {
        conversation: {
          id: payload.conversationId,
          title: 'план запуска'
        },
        messages: [
          { role: 'user', content: 'напиши план запуска' },
          { role: 'assistant', content: 'готовый ответ' }
        ]
      };
    },
    async resumeDialog(payload) {
      calls.push(['resumeDialog', payload]);
      return {
        conversationId: payload.conversationId,
        kind: 'model',
        subjectId: 'gpt_56_luna',
        title: 'план запуска',
        status: 'active'
      };
    }
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    historyService
  });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  await handleUpdate(callback(24_001, 'genhist:list:0'));
  await handleUpdate({ update_id: 24_002, message: { chat: { id: 10, type: 'private' }, from: { id: 10 }, text: '/dialogs' } });
  await handleUpdate(callback(24_003, 'dialoghist:view:00000000-0000-4000-8000-000000000001'));
  await handleUpdate(callback(24_004, 'dialoghist:continue:00000000-0000-4000-8000-000000000001'));

  assert.match(telegram.sent[0].message.text, /^🖌️ <b>история генераций<\/b>/);
  assert.match(telegram.sent[0].message.text, /7 метакоинов/);
  assert.match(telegram.sent[1].message.text, /^💬 <b>история диалогов<\/b>/);
  assert.ok(telegram.sent[1].message.reply_markup.inline_keyboard.flat().some(
    ({ callback_data }) => callback_data === 'dialoghist:view:00000000-0000-4000-8000-000000000001'
  ));
  assert.match(telegram.sent[2].message.text, /^💬 <b>план запуска<\/b>/);
  assert.match(telegram.sent[3].message.text, /^выбрана GPT-5\.6 Luna/);
  assert.deepEqual(calls.map(([name]) => name), [
    'listGenerations',
    'listDialogs',
    'getDialog',
    'resumeDialog'
  ]);
});

test('request history uses short Telegram page callbacks and owner-scoped cursors', async () => {
  const telegram = createTelegramMock();
  const calls = [];
  const historyService = {
    async listDialogs(payload) {
      calls.push(payload);
      return payload.cursor
        ? {
            items: [{
              id: '00000000-0000-4000-8000-000000000002',
              title: 'вторая страница',
              messageCount: 1,
              latestMessageAt: '2026-07-27T00:02:00.000Z',
              lastMessagePreview: 'продолжение'
            }],
            nextCursor: null
          }
        : {
            items: [{
              id: '00000000-0000-4000-8000-000000000001',
              title: 'первая страница',
              messageCount: 2,
              latestMessageAt: '2026-07-27T00:01:00.000Z',
              lastMessagePreview: 'ответ'
            }],
            nextCursor: 'owner-scoped-cursor'
          };
    }
  };
  const handleUpdate = createUpdateHandler({ telegram, config: {}, historyService });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  await handleUpdate(callback(24_101, 'dialoghist:list:0'));
  await handleUpdate(callback(24_102, 'dialoghist:list:1'));

  const nextButton = telegram.sent[0].message.reply_markup.inline_keyboard.flat()
    .find(({ callback_data }) => callback_data === 'dialoghist:list:1');
  assert.equal(nextButton.text, 'дальше ›');
  assert.match(telegram.sent[1].message.text, /вторая страница/);
  assert.deepEqual(calls, [
    { telegramUserId: 10, limit: 8, status: 'active', kind: 'model' },
    {
      telegramUserId: 10,
      limit: 8,
      cursor: 'owner-scoped-cursor',
      status: 'active',
      kind: 'model'
    }
  ]);
});

test('clicking a model selects it immediately and opens its card', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: { id: `callback-${id}`, data, message: { chat: { id: 10 } } }
  });

  await handleUpdate(callback(4, 'task:models'));
  await handleUpdate(callback(5, 'modelcat:llm'));
  await handleUpdate(callback(6, 'family:openai'));
  await handleUpdate(callback(7, 'model:gpt_56_terra'));
  await handleUpdate({ update_id: 8, message: { chat: { id: 10 }, text: 'напиши пост' } });

  assert.match(telegram.sent[0].message.text, /^<b>💬 текст \/ код \/ поиск<\/b>/);
  assert.match(telegram.sent[1].message.text, /^<b>💬 текст \/ код \/ поиск<\/b>/);
  assert.match(telegram.sent[2].message.text, /^<b>GPT<\/b>/);
  assert.match(telegram.sent[3].message.text, /^<b>GPT-5.6 Terra<\/b>/);
  assert.match(telegram.sent[3].message.text, /<b>стоимость: (?:🪙|<tg-emoji[^>]+>🪙<\/tg-emoji>) \d+(?:–\d+)? метакоинов<\/b>/);
  assert.equal(telegram.sent[3].message.reply_markup.inline_keyboard.flat().some((button) => button.text === 'использовать'), false);
  assert.match(telegram.sent[4].message.text, /нужен платный тариф/);
  assert.ok(telegram.sent[4].message.reply_markup.inline_keyboard.flat()
    .some((button) => button.callback_data === 'billing:plans:profile'));
});

test('model settings can be changed and reset without a mini app', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: { id: `callback-${id}`, data, message: { chat: { id: 10 } } }
  });

  await handleUpdate(callback(50, 'model:nano_banana_pro'));
  await handleUpdate(callback(51, 'settings:nano_banana_pro'));
  await handleUpdate(callback(52, 'set:aspect_ratio:16:9'));
  await handleUpdate(callback(53, 'settings:reset:nano_banana_pro'));

  assert.match(telegram.sent[0].message.text, /^<b>Nano Banana Pro<\/b>/);
  assert.match(telegram.sent[1].message.text, /соотношение сторон:<\/b> 1:1/);
  assert.match(telegram.sent[2].message.text, /соотношение сторон:<\/b> 16:9/);
  assert.match(telegram.sent[3].message.text, /соотношение сторон:<\/b> 1:1/);
});

test('video models open their card first and keep back navigation on the card', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  await handleUpdate(callback(54, 'model:flux_3'));
  const card = telegram.sent.at(-1).message;
  assert.match(card.text, /^<b>FLUX 3<\/b>/u);
  assert.doesNotMatch(card.text, /выбери режим работы/u);
  assert.ok(card.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'video:new:_'));
  assert.equal(card.reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'settings:flux_3'), false);

  await handleUpdate(callback(55, 'video:new:_'));
  const modePicker = telegram.sent.at(-1).message;
  assert.match(modePicker.text, /<b>выбери режим работы:<\/b>/u);
  assert.ok(modePicker.reply_markup.inline_keyboard.flat()
    .some(({ text, callback_data }) => text === '‹ назад к карточке' && callback_data === 'model:flux_3'));

  await handleUpdate(callback(56, 'video:choose:first_frame'));
  const unifiedSettings = telegram.sent.at(-1).message;
  assert.match(unifiedSettings.text, /^<b>⚙️ параметры FLUX 3<\/b>/u);
  assert.match(unifiedSettings.text, /<b>режим:<\/b> 🖼 кадр → видео/u);
  assert.ok(unifiedSettings.reply_markup.inline_keyboard.flat()
    .some(({ text, callback_data }) => text === '‹ назад к карточке' && callback_data === 'model:flux_3'));

  await handleUpdate(callback(57, 'video:done'));
  const finalReview = telegram.sent.at(-1).message;
  assert.match(finalReview.text, /^<b>👁‍🗨 проверь, что всё на месте<\/b>/u);
  assert.match(finalReview.text, /<b>модель:<\/b> FLUX 3/u);
  assert.ok(finalReview.reply_markup.inline_keyboard.flat()
    .some(({ text, callback_data }) => text === '‹ назад к параметрам' && callback_data === 'video:settings'));

  await handleUpdate(callback(58, 'model:flux_3'));
  assert.match(telegram.sent.at(-1).message.text, /^<b>FLUX 3<\/b>/u);
  assert.doesNotMatch(telegram.sent.at(-1).message.text, /выбери режим работы/u);
});

test('Seedance reference uploads open a dedicated multimodal screen', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  await handleUpdate(callback(59_001, 'model:seedance_25'));
  await handleUpdate(callback(59_002, 'video:new:_'));
  await handleUpdate(callback(59_003, 'video:choose:references'));
  const parameters = telegram.sent.at(-1).message;
  const parameterButtons = parameters.reply_markup.inline_keyboard.flat();
  assert.ok(parameterButtons.some(({ callback_data }) => callback_data === 'video:references'));
  assert.ok(parameterButtons.some(({ callback_data }) => callback_data === 'video:reset'));
  assert.ok(parameterButtons.some(({ callback_data }) => callback_data === 'video:done'));

  await handleUpdate(callback(59_004, 'video:references'));
  const uploads = telegram.sent.at(-1).message;
  const uploadButtons = uploads.reply_markup.inline_keyboard.flat();
  assert.match(uploads.text, /^<b>🎞 референсы Seedance 2\.5<\/b>/u);
  assert.match(uploads.text, /до 50/u);
  assert.match(uploads.text, /изображение, видео и аудио/u);
  assert.equal(uploadButtons.some(({ callback_data = '' }) => callback_data.startsWith('video:slot:reference_')), false);
  assert.ok(uploadButtons.some(({ callback_data }) => callback_data === 'video:settings'));
});

test('settings and dialogs commands stay inside Telegram', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({ update_id: 60, message: { chat: { id: 10 }, text: '/settings' } });
  await handleUpdate({ update_id: 61, message: { chat: { id: 10 }, text: '/dialogs' } });

  assert.match(telegram.sent[0].message.text, /^⚙️ <b>настройки<\/b>/);
  assert.match(telegram.sent[0].message.text, /язык ответов/i);
  assert.match(telegram.sent[0].message.text, /объём ответа/i);
  assert.doesNotMatch(telegram.sent[0].message.text, /выбери модель|параметры модели/i);
  assert.ok(telegram.sent[0].message.reply_markup.inline_keyboard.flat()
    .some((button) => button.callback_data === 'prefs:language'));
  assert.match(telegram.sent[1].message.text, /^💬 <b>история диалогов<\/b>/);
  assert.ok(telegram.sent[0].message.reply_markup.inline_keyboard.flat().some((button) => button.callback_data === 'task:profile'));
});

test('global preferences opened from an LLM return to that model settings screen', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: `callback-${id}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  await handleUpdate(callback(62, 'model:gpt_56_luna'));
  await handleUpdate(callback(63, 'settings:gpt_56_luna'));
  await handleUpdate(callback(64, 'task:settings'));

  const preferences = telegram.sent.at(-1).message;
  assert.ok(preferences.reply_markup.inline_keyboard.flat().some(({ text, callback_data }) => (
    text === '‹ назад к настройкам модели' && callback_data === 'settings:gpt_56_luna'
  )));

  await handleUpdate(callback(65, 'settings:gpt_56_luna'));
  assert.match(telegram.sent.at(-1).message.text, /^<b>⚙️ параметры GPT-5\.6 Luna<\/b>/);
});

test('generation replies always contain a profile shortcut', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    referralService: createPaidReferralService(50_000)
  });

  await handleUpdate({
    update_id: 80,
    callback_query: {
      id: 'callback-80',
      data: 'model:nano_banana_pro',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({ update_id: 81, message: { chat: { id: 10 }, text: 'сделай афишу' } });

  const buttons = telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some((button) => button.callback_data === 'task:profile'));
});

test('selected media models accept the attachment types promised by their cards', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    referralService: createPaidReferralService(50_000)
  });

  await handleUpdate({
    update_id: 801,
    callback_query: {
      id: 'callback-801',
      data: 'model:seedance_20',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 802,
    message: {
      message_id: 601,
      chat: { id: 10 },
      photo: [{ file_id: 'small' }, { file_id: 'large' }],
      caption: 'оживи этот кадр'
    }
  });

  assert.match(telegram.sent.at(-1).message.text, /Seedance 2\.0/);
  assert.match(telegram.sent.at(-1).message.text, /метакоины не списаны/);
});

test('Telegram albums are collected into one model request', async () => {
  const scheduled = [];
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    referralService: createPaidReferralService(50_000),
    setTimeoutFn(callback) {
      scheduled.push(callback);
      return scheduled.length;
    },
    clearTimeoutFn() {}
  });

  await handleUpdate({
    update_id: 805,
    callback_query: {
      id: 'callback-805',
      data: 'model:seedance_20',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 806,
    message: {
      message_id: 603,
      media_group_id: 'album-1',
      chat: { id: 10 },
      photo: [{ file_id: 'first-small' }, { file_id: 'first-large' }],
      caption: 'собери ролик из двух кадров'
    }
  });
  await handleUpdate({
    update_id: 807,
    message: {
      message_id: 604,
      media_group_id: 'album-1',
      chat: { id: 10 },
      photo: [{ file_id: 'second-small' }, { file_id: 'second-large' }]
    }
  });

  assert.equal(telegram.sent.length, 1);
  await scheduled.at(-1)();
  assert.equal(telegram.sent.length, 2);
  assert.match(telegram.sent.at(-1).message.text, /Seedance 2\.0/);
});

test('tool models with strict input counts keep the user on the input card', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    referralService: createPaidReferralService()
  });

  await handleUpdate({
    update_id: 810,
    callback_query: {
      id: 'callback-810',
      data: 'model:three_d_multi_image',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 811,
    message: {
      message_id: 606,
      chat: { id: 10 },
      photo: [{ file_id: 'one-photo' }]
    }
  });

  assert.match(telegram.sent.at(-1).message.text, /собрать 3d по нескольким фото/i);
  assert.match(telegram.sent.at(-1).message.text, /прикрепи фотографии/i);
  assert.match(telegram.sent.at(-1).message.text, /стоимость:/i);
});

test('media sent as a Telegram document uses its MIME type', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    referralService: createPaidReferralService()
  });

  await handleUpdate({
    update_id: 808,
    callback_query: {
      id: 'callback-808',
      data: 'model:photo_remove_bg',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 809,
    message: {
      message_id: 605,
      chat: { id: 10 },
      document: { file_id: 'png-file', mime_type: 'image/png' }
    }
  });

  assert.match(telegram.sent.at(-1).message.text, /убрать фон/i);
  assert.doesNotMatch(telegram.sent.at(-1).message.text, /принимает только/i);
});

test('unsupported attachments are rejected using the selected model input contract', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 803,
    callback_query: {
      id: 'callback-803',
      data: 'model:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 804,
    message: {
      message_id: 602,
      chat: { id: 10 },
      audio: { file_id: 'audio-file' }
    }
  });

  assert.match(telegram.sent.at(-1).message.text, /принимает только/i);
  assert.match(telegram.sent.at(-1).message.text, /текст/i);
});

test('new prompts replace the previous bot screen and remove handled user messages', async () => {
  const deleted = [];
  const telegram = createTelegramMock({
    async deleteMessage(chatId, messageId) { deleted.push({ chatId, messageId }); }
  });
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 82,
    callback_query: {
      id: 'callback-82',
      data: 'model:nano_banana_pro',
      message: { message_id: 70, chat: { id: 10 } }
    }
  });
  await handleUpdate({ update_id: 83, message: { message_id: 501, chat: { id: 10 }, text: 'сделай афишу' } });
  await handleUpdate({ update_id: 84, message: { message_id: 502, chat: { id: 10 }, text: 'теперь квадратную' } });

  assert.deepEqual(deleted, [
    { chatId: 10, messageId: 501 },
    { chatId: 10, messageId: 100 },
    { chatId: 10, messageId: 502 },
    { chatId: 10, messageId: 101 }
  ]);
});

test('text without a model selection opens the LLM catalog', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({ update_id: 9, message: { chat: { id: 10 }, text: 'привет' } });

  assert.match(telegram.sent[0].message.text, /^<b>💬 текст \/ код \/ поиск<\/b>/);
});

test('selected free model invokes only the free route', async () => {
  const telegram = createTelegramMock();
  let invocation;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    invokeLlm: async (options) => {
      invocation = options;
      return { text: 'готово', provider: 'openrouter' };
    }
  });

  await handleUpdate({
    update_id: 10,
    callback_query: {
      id: 'callback-10',
      data: 'model:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 101,
    callback_query: {
      id: 'callback-101',
      data: 'use:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({ update_id: 11, message: { chat: { id: 10 }, text: 'тест' } });

  assert.equal(invocation.allowSecondaryProviders, false);
  assert.equal(telegram.sent.at(-1).message.text, 'готово');
});

test('text model results offer context clearing without regeneration', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    invokeLlm: async () => ({ text: 'готово', provider: 'openrouter' })
  });

  await handleUpdate({
    update_id: 11_001,
    callback_query: {
      id: 'callback-11-001',
      data: 'model:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 11_002,
    callback_query: {
      id: 'callback-11-002',
      data: 'use:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({ update_id: 11_003, message: { chat: { id: 10 }, text: 'тест' } });

  const buttons = telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some(({ text }) => text === '⛔️ очистить контекст'));
  assert.equal(buttons.some(({ text }) => text === '🔁 перегенерировать'), false);
  assert.equal(buttons.some(({ text }) => text === '💬 новый диалог'), false);
});

test('parallel delivery of one text update invokes the provider and history only once', async () => {
  const telegram = createTelegramMock();
  let releaseProvider;
  let providerCalls = 0;
  let historyStarts = 0;
  const providerResult = new Promise((resolve) => {
    releaseProvider = resolve;
  });
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    historyService: {
      async claimFreeWeeklyRequest() {
        return { allowed: true, used: 1, limit: 50, remaining: 49, duplicate: true };
      },
      async startGeneration() {
        historyStarts += 1;
        return {
          generationId: 'generation-id',
          conversationId: 'conversation-id',
          telegramUserId: '10'
        };
      },
      async completeGeneration() {}
    },
    invokeLlm: async () => {
      providerCalls += 1;
      return providerResult;
    }
  });

  await handleUpdate({
    update_id: 700,
    callback_query: {
      id: 'callback-700',
      data: 'model:gpt_oss_20b_free',
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });
  const update = {
    update_id: 701,
    message: {
      message_id: 71,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: 'один запрос'
    }
  };
  const first = handleUpdate(update);
  await flushAsyncWork();
  const duplicate = handleUpdate(update);
  await flushAsyncWork();

  assert.equal(providerCalls, 1);
  assert.equal(historyStarts, 1);
  releaseProvider({ text: 'один ответ', provider: 'openrouter' });
  await Promise.all([first, duplicate]);
  assert.equal(telegram.sent.filter(({ message }) => message.text === 'один ответ').length, 1);
});

test('new dialog keeps the current model branch when one is selected', async () => {
  const telegram = createTelegramMock();
  const resets = [];
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    historyService: {
      resetUserDialogs() {
        resets.push(true);
      }
    }
  });

  await handleUpdate({
    update_id: 702,
    callback_query: {
      id: 'callback-702',
      data: 'dialog:new',
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  assert.deepEqual(resets, []);
  assert.match(telegram.sent[0].message.text, /^<b>💬 текст \/ код \/ поиск<\/b>/);
});

test('clearing model context confirms briefly, cleans up, and returns to the model card', async () => {
  const telegram = createTelegramMock();
  const rotations = [];
  const timers = [];
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    setTimeoutFn(callback, delay) {
      timers.push({ callback, delay });
      return { unref() {} };
    },
    historyService: {
      rotateConversation(payload) {
        rotations.push(payload);
      }
    }
  });
  const callback = (id, data) => ({
    update_id: id,
    callback_query: {
      id: 'callback-' + id,
      data,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  await handleUpdate(callback(11_101, 'model:gpt_56_luna'));
  await handleUpdate(callback(11_102, 'dialog:new:model:gpt_56_luna'));

  assert.equal(telegram.sent.length, 3);
  assert.equal(telegram.sent[1].message.text, 'контекст модели успешно очищен');
  assert.equal(telegram.sent[1].message.reply_markup, undefined);
  assert.match(telegram.sent[2].message.text, /^<b>GPT-5\.6 Luna/);
  assert.deepEqual(telegram.events, [
    { type: 'send', chatId: 10, messageId: 100 },
    { type: 'send', chatId: 10, messageId: 101 },
    { type: 'delete', chatId: 10, messageId: 100 },
    { type: 'send', chatId: 10, messageId: 102 }
  ]);
  assert.deepEqual(telegram.deleted, [{ chatId: 10, messageId: 100 }]);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 3_000);
  assert.equal(telegram.deleted.some(({ messageId }) => messageId === 101), false);

  await timers[0].callback();

  assert.deepEqual(telegram.deleted, [
    { chatId: 10, messageId: 100 },
    { chatId: 10, messageId: 101 }
  ]);
  assert.deepEqual(telegram.events, [
    { type: 'send', chatId: 10, messageId: 100 },
    { type: 'send', chatId: 10, messageId: 101 },
    { type: 'delete', chatId: 10, messageId: 100 },
    { type: 'send', chatId: 10, messageId: 102 },
    { type: 'delete', chatId: 10, messageId: 101 }
  ]);
  const cardButtons = telegram.sent[2].message.reply_markup.inline_keyboard.flat();
  assert.ok(cardButtons.some(({ text }) => text === '💬 история диалогов'));
  assert.equal(cardButtons.some(({ text }) => text === '💬 новый диалог'), false);
  assert.deepEqual(rotations, [{
    telegramUserId: 10,
    subjectType: 'model',
    subjectId: 'gpt_56_luna'
  }]);
});

test('dialog history uses context clearing for the selected model and keeps account navigation', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    historyService: {
      async listDialogs() {
        return {
          items: [{
            id: 'dialog-1',
            title: 'план запуска',
            messageCount: 4,
            latestMessageAt: '2026-08-07T01:00:00.000Z',
            lastMessagePreview: 'готовый ответ'
          }]
        };
      }
    }
  });

  const callback = (updateId, data) => ({
    update_id: updateId,
    callback_query: {
      id: 'callback-' + updateId,
      data,
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  await handleUpdate(callback(11_200, 'model:gpt_56_luna'));
  await handleUpdate(callback(11_201, 'dialoghist:list:0'));

  const message = telegram.sent.at(-1).message;
  const buttons = message.reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some(({ text, callback_data }) => (
    text === 'план запуска · 4' && callback_data === 'dialoghist:view:dialog-1'
  )));
  assert.ok(buttons.some(({ text, callback_data }) => (
    text === '⛔️ очистить контекст' && callback_data === 'dialog:new'
  )));
  assert.equal(buttons.some(({ text }) => text === '💬 новый диалог'), false);
  assert.ok(buttons.some(({ text, callback_data }) => (
    text === '👤 профиль' && callback_data === 'task:profile'
  )));
  assert.ok(buttons.some(({ text, callback_data }) => (
    text === '🏠 главное меню' && callback_data === 'task:menu'
  )));
});

test('dialog history omits context clearing without a selected model', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    historyService: {
      async listDialogs() {
        return { items: [] };
      }
    }
  });

  await handleUpdate({
    update_id: 11_202,
    callback_query: {
      id: 'callback-11-202',
      data: 'dialoghist:list:0',
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  const buttons = telegram.sent[0].message.reply_markup.inline_keyboard.flat();
  assert.equal(buttons.some(({ text }) => text === '⛔️ очистить контекст'), false);
  assert.equal(buttons.some(({ text }) => text === '💬 новый диалог'), false);
});

test('new dialog rotates context without losing the selected model', async () => {
  const telegram = createTelegramMock();
  const rotations = [];
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    historyService: {
      rotateConversation(payload) {
        rotations.push(payload);
      }
    }
  });

  await handleUpdate({
    update_id: 703,
    callback_query: {
      id: 'callback-703',
      data: 'use:gpt_oss_20b_free',
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });
  await handleUpdate({
    update_id: 704,
    callback_query: {
      id: 'callback-704',
      data: 'dialog:new',
      from: { id: 10 },
      message: { chat: { id: 10, type: 'private' } }
    }
  });

  assert.deepEqual(rotations, [{
    telegramUserId: 10,
    subjectType: 'model',
    subjectId: 'gpt_oss_20b_free'
  }]);
  assert.match(telegram.sent.at(-1).message.text, /^<b>gpt-oss-20b free/u);
  assert.ok(telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat()
    .some(({ text }) => text === '💬 история диалогов'));
 assert.doesNotMatch(telegram.sent.at(-1).message.text, /текст \/ код \/ поиск/u);
});

test('newcomer weekly quota blocks the 51st free request before the provider call', async () => {
  const telegram = createTelegramMock();
  let providerCalls = 0;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    historyService: {
      async claimFreeWeeklyRequest() {
        return { allowed: false, used: 50, limit: 50, remaining: 0, duplicate: false };
      }
    },
    invokeLlm: async () => {
      providerCalls += 1;
      return { text: 'не должно прийти', provider: 'openrouter' };
    }
  });

  await handleUpdate({
    update_id: 104,
    callback_query: {
      id: 'callback-104',
      data: 'model:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({ update_id: 105, message: { chat: { id: 10 }, text: 'ещё запрос' } });

  assert.equal(providerCalls, 0);
  assert.match(telegram.sent.at(-1).message.text, /50 запросов/);
});

test('failed free provider call releases the newcomer weekly quota claim', async () => {
  const telegram = createTelegramMock();
  const released = [];
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    historyService: {
      async claimFreeWeeklyRequest() {
        return { allowed: true, used: 1, limit: 50, remaining: 49, duplicate: false };
      },
      async releaseFreeWeeklyRequest(payload) {
        released.push(payload);
        return true;
      }
    },
    invokeLlm: async () => { throw new Error('upstream timeout'); }
  });

  await handleUpdate({
    update_id: 106,
    callback_query: {
      id: 'callback-106',
      data: 'model:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({ update_id: 107, message: { chat: { id: 10 }, text: 'тест' } });

  assert.deepEqual(released, [{
    telegramUserId: 10,
    requestKey: 'message-update:10:107',
    quotaKey: 'text'
  }]);
});

test('provider failures show a retry-safe message and support shortcut', async () => {
  const telegram = createTelegramMock();
  const errors = [];
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    invokeLlm: async () => { throw new Error('upstream timeout'); },
    onError: (error) => errors.push(error)
  });

  await handleUpdate({
    update_id: 1001,
    callback_query: {
      id: 'callback-1001',
      data: 'model:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({ update_id: 1002, message: { chat: { id: 10 }, text: 'тест' } });

  const message = telegram.sent.at(-1).message;
  assert.match(message.text, /модель временно недоступна/);
  assert.match(message.text, /@metaflora_support/);
  assert.ok(message.reply_markup.inline_keyboard.flat()
    .some(({ url }) => url === 'https://t.me/metaflora_support'));
  assert.equal(errors.length, 1);
});

test('another model button opens the matching catalog without deleting the error card', async () => {
  const edited = [];
  const deleted = [];
  const telegram = createTelegramMock({
    async editMessageText(chatId, messageId, message) {
      edited.push({ chatId, messageId, message });
      return { message_id: messageId };
    },
    async deleteMessage(chatId, messageId) {
      deleted.push({ chatId, messageId });
    }
  });
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    invokeLlm: async () => { throw new Error('upstream timeout'); }
  });

  await handleUpdate({
    update_id: 1020,
    callback_query: {
      id: 'callback-1020',
      data: 'model:gpt_oss_20b_free',
      message: { message_id: 77, chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 1021,
    message: { message_id: 78, chat: { id: 10 }, text: 'тест' }
  });

  const errorMessage = telegram.sent.at(-1);
  const anotherModel = errorMessage.message.reply_markup.inline_keyboard
    .flat()
    .find(({ callback_data: data }) => data?.startsWith('modelcat:'));
  assert.ok(anotherModel);
  deleted.length = 0;
  const sentBeforeNavigation = telegram.sent.length;

  await handleUpdate({
    update_id: 1022,
    callback_query: {
      id: 'callback-1022',
      data: anotherModel.callback_data,
      message: {
        message_id: errorMessage.result.message_id,
        chat: { id: 10 }
      }
    }
  });

  assert.match(edited.at(-1).message.text, /^<b>💬 текст \/ код \/ поиск<\/b>/);
  assert.equal(edited.at(-1).messageId, errorMessage.result.message_id);
  assert.equal(telegram.sent.length, sentBeforeNavigation);
  assert.deepEqual(deleted, []);
});

test('unexpected bot failures show the aggregator support message', async () => {
  const telegram = createTelegramMock();
  const errors = [];
  const referralService = {
    registerUser() { return { telegramId: '10' }; },
    markStarted() {},
    account() { throw new Error('database unavailable'); }
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {},
    referralService,
    onError: (error) => errors.push(error)
  });

  await handleUpdate({
    update_id: 1010,
    message: { chat: { id: 10 }, from: { id: 10 }, text: '/profile' }
  });

  const message = telegram.sent.at(-1).message;
  assert.match(message.text, /не получилось обработать запрос/);
  assert.match(message.text, /@metaflora_support/);
  assert.ok(message.reply_markup.inline_keyboard.flat()
    .some(({ url }) => url === 'https://t.me/metaflora_support'));
  assert.equal(errors.length, 1);
});

test('private account data is never rendered in a group chat', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 1011,
    message: {
      chat: { id: -10010, type: 'group' },
      from: { id: 10 },
      text: '/profile'
    }
  });

  const message = telegram.sent.at(-1).message;
  assert.match(message.text, /доступны в личном чате/);
  assert.doesNotMatch(message.text, /метакоинов|реферальная ссылка|потрачено|тариф «/i);
  assert.equal(
    message.reply_markup.inline_keyboard.flat().find(({ url }) => url)?.url,
    'https://t.me/neuro_metaflora_bot'
  );
});

test('a Telegram delivery retry reuses the generated result without another provider call', async () => {
  let invokeCount = 0;
  let failedOnce = false;
  const telegram = createTelegramMock({
    async sendMessage(chatId, message) {
      if (message.text === 'готово' && !failedOnce) {
        failedOnce = true;
        throw new Error('temporary Telegram error');
      }
      const result = { message_id: this.sent.length + 100 };
      this.sent.push({ chatId, message, result });
      return result;
    }
  });
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    invokeLlm: async () => {
      invokeCount += 1;
      return { text: 'готово', provider: 'openrouter' };
    },
    rateLimit: { maxRequests: 1, windowMs: 60_000 },
    now: () => 1_000
  });
  const promptUpdate = {
    update_id: 1013,
    message: { message_id: 501, chat: { id: 10 }, text: 'тест' }
  };

  await handleUpdate({
    update_id: 1012,
    callback_query: {
      id: 'callback-1012',
      data: 'model:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate(promptUpdate);
  await handleUpdate(promptUpdate);

  assert.equal(invokeCount, 1);
  assert.equal(telegram.sent.at(-1).message.text, 'готово');
});

test('LLM instructions are saved natively and forwarded with the next prompt', async () => {
  const telegram = createTelegramMock();
  let invocation;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    invokeLlm: async (options) => {
      invocation = options;
      return { text: 'готово', provider: 'openrouter' };
    }
  });
  const callback = (updateId, data) => ({
    update_id: updateId,
    callback_query: {
      id: `callback-${updateId}`,
      data,
      message: { chat: { id: 10 } }
    }
  });

  await handleUpdate(callback(901, 'model:gpt_oss_20b_free'));
  await handleUpdate(callback(902, 'instructions:gpt_oss_20b_free'));
  await handleUpdate({ update_id: 903, message: { message_id: 903, chat: { id: 10 }, text: 'отвечай кратко' } });
  assert.match(telegram.sent.at(-1).message.text, /инструкции для ии:<\/b> заданы/);

  await handleUpdate({ update_id: 904, message: { message_id: 904, chat: { id: 10 }, text: 'тест' } });
  assert.equal(invocation.settings.instructions, 'отвечай кратко');

  await handleUpdate(callback(905, 'instructions:clear:gpt_oss_20b_free'));
  await handleUpdate(callback(906, 'instructions:clear:gpt_oss_20b_free'));
  await handleUpdate({ update_id: 907, message: { message_id: 907, chat: { id: 10 }, text: 'ещё тест' } });
  assert.equal(invocation.settings.instructions, '');
});

test('leaving the instructions screen cancels text capture', async () => {
  const telegram = createTelegramMock();
  let calls = 0;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    invokeLlm: async () => {
      calls += 1;
      return { text: 'готово', provider: 'openrouter' };
    }
  });
  const callback = (updateId, data) => ({
    update_id: updateId,
    callback_query: {
      id: `callback-${updateId}`,
      data,
      message: { chat: { id: 10 } }
    }
  });

  await handleUpdate(callback(911, 'model:gpt_oss_20b_free'));
  await handleUpdate(callback(912, 'instructions:gpt_oss_20b_free'));
  await handleUpdate(callback(913, 'settings:gpt_oss_20b_free'));
  await handleUpdate({ update_id: 914, message: { message_id: 914, chat: { id: 10 }, text: 'обычный запрос' } });

  assert.equal(calls, 1);
  assert.equal(telegram.sent.at(-1).message.text, 'готово');
});

test('free model calls are rate limited per chat without blocking navigation', async () => {
  const telegram = createTelegramMock();
  let calls = 0;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { enableFreeLlmTestCalls: true, providerKeys: { openrouter: 'secret' } },
    invokeLlm: async () => {
      calls += 1;
      return { text: 'готово', provider: 'openrouter' };
    },
    rateLimit: { maxRequests: 1, windowMs: 60_000 },
    now: () => 1_000
  });

  await handleUpdate({
    update_id: 30,
    callback_query: {
      id: 'callback-30',
      data: 'model:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({
    update_id: 301,
    callback_query: {
      id: 'callback-301',
      data: 'use:gpt_oss_20b_free',
      message: { chat: { id: 10 } }
    }
  });
  await handleUpdate({ update_id: 31, message: { chat: { id: 10 }, text: 'первый' } });
  await handleUpdate({ update_id: 32, message: { chat: { id: 10 }, text: 'второй' } });
  await handleUpdate({ update_id: 33, message: { chat: { id: 10 }, text: '/menu' } });

  assert.equal(calls, 1);
  assert.match(telegram.sent.at(-2).message.text, /слишком много запросов/);
  assert.match(telegram.sent.at(-1).message.text, /добро пожаловать/);
});

test('unknown callbacks and oversized prompts are ignored safely', async () => {
  const telegram = createTelegramMock();
  const handleUpdate = createUpdateHandler({ telegram, config: {} });

  await handleUpdate({
    update_id: 12,
    callback_query: { id: 'callback-12', data: 'unknown:value', message: { chat: { id: 10 } } }
  });
  await handleUpdate({ update_id: 13, message: { chat: { id: 10 }, text: 'x'.repeat(12_001) } });

  assert.equal(telegram.sent.length, 0);
});
