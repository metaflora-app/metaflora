import test from 'node:test';
import assert from 'node:assert/strict';

import { createUpdateHandler } from '../src/bot.js';
import { formatModelMetacoinPrice, getModelById } from '../src/model-catalog.js';

const NOW = new Date('2026-07-25T12:00:00.000Z');
const PAID_CALLS_CONFIG = Object.freeze({
  providerTestMode: false,
  enablePaidProviderCalls: true,
  enableFreeLlmTestCalls: true,
  botOwnerId: '994500304',
  providerKeys: { openrouter: 'test-key' }
});

function createTelegramMock(overrides = {}) {
  const sent = [];
  return {
    sent,
    async sendMessage(chatId, message) {
      const result = { message_id: sent.length + 100 };
      sent.push({ chatId, message, result });
      return result;
    },
    async answerCallbackQuery() {},
    async setMyCommands() {},
    async sendPhoto(chatId, url, options) {
      const result = { message_id: sent.length + 100 };
      sent.push({ chatId, url, options, kind: 'photo', result });
      return result;
    },
    async sendVideo(chatId, url, options) {
      const result = { message_id: sent.length + 100 };
      sent.push({ chatId, url, options, kind: 'video', result });
      return result;
    },
    ...overrides
  };
}

function account(overrides = {}) {
  return {
    subscriptionPlanId: 'newcomer',
    subscriptionExpiresAt: null,
    metacoinBalance: 0,
    ...overrides
  };
}

function createReferralServiceMock(currentAccount) {
  const debitCalls = [];
  const debitsByRequestKey = new Map();

  return {
    debitCalls,
    debitsByRequestKey,
    registerUser({ id }) {
      return { telegramId: String(id) };
    },
    markStarted() {},
    account() {
      return { ...currentAccount };
    },
    debitMetacoins(payload) {
      debitCalls.push({ ...payload });
      const previous = debitsByRequestKey.get(payload.requestKey);
      if (previous) {
        assert.deepEqual(payload, previous.payload);
        return { ...previous.result, status: 'duplicate' };
      }

      assert.ok(payload.amount > 0);
      assert.ok(currentAccount.metacoinBalance >= payload.amount);
      currentAccount.metacoinBalance -= payload.amount;
      const result = {
        status: 'debited',
        requestKey: payload.requestKey,
        amount: payload.amount,
        balance: currentAccount.metacoinBalance
      };
      debitsByRequestKey.set(payload.requestKey, {
        payload: { ...payload },
        result
      });
      return result;
    }
  };
}

function createTwoPhaseReferralService(currentAccount) {
  const reservations = new Map();
  const commits = new Map();
  return {
    reservations,
    commits,
    registerUser({ id }) {
      return { telegramId: String(id) };
    },
    markStarted() {},
    account() {
      return { ...currentAccount };
    },
    reserveMetacoins({ amount, requestKey }) {
      const existing = reservations.get(requestKey);
      if (existing?.status === 'reserved') return { status: 'reserved', balance: currentAccount.metacoinBalance };
      if (existing?.status === 'committed') return { status: 'duplicate', balance: currentAccount.metacoinBalance };
      if (currentAccount.metacoinBalance < amount) {
        return { status: 'insufficient_funds', balance: currentAccount.metacoinBalance };
      }
      currentAccount.metacoinBalance -= amount;
      reservations.set(requestKey, { amount, status: 'reserved' });
      return { status: 'reserved', balance: currentAccount.metacoinBalance };
    },
    commitMetacoins({ amount, requestKey }) {
      const reservation = reservations.get(requestKey);
      assert.ok(reservation);
      if (reservation.status === 'committed') {
        return { status: 'duplicate', balance: currentAccount.metacoinBalance };
      }
      assert.equal(reservation.status, 'reserved');
      reservation.status = 'committed';
      commits.set(requestKey, amount);
      return { status: 'committed', balance: currentAccount.metacoinBalance };
    },
    releaseMetacoins({ requestKey }) {
      const reservation = reservations.get(requestKey);
      assert.ok(reservation);
      if (reservation.status === 'reserved') {
        currentAccount.metacoinBalance += reservation.amount;
        reservation.status = 'released';
      }
      return { status: reservation.status, balance: currentAccount.metacoinBalance };
    }
  };
}

function callback(updateId, data) {
  return {
    update_id: updateId,
    callback_query: {
      id: `callback-${updateId}`,
      data,
      from: { id: 10 },
      message: { chat: { id: 10 } }
    }
  };
}

function prompt(updateId, text = 'сделай', username = '', actorId = 10) {
  return {
    update_id: updateId,
    message: {
      message_id: updateId,
      chat: { id: 10 },
      from: { id: actorId, username },
      text
    }
  };
}

function callbackData(message) {
  return message.reply_markup?.inline_keyboard
    ?.flat()
    .map(({ callback_data: value }) => value)
    .filter(Boolean) ?? [];
}

async function selectAndPrompt(handleUpdate, modelId, promptUpdate) {
  await handleUpdate(callback(promptUpdate.update_id - 1, `model:${modelId}`));
  await handleUpdate(promptUpdate);
}

test('newcomer is sent to tariff plans before a paid model or tool can start', async (t) => {
  for (const [modelId, request] of [
    ['gpt_56_terra', prompt(2_002, 'напиши пост')],
    ['photo_remove_bg', {
      update_id: 2_012,
      message: {
        message_id: 2_012,
        chat: { id: 10 },
        from: { id: 10 },
        photo: [{ file_id: 'small' }, { file_id: 'large' }]
      }
    }]
  ]) {
    await t.test(modelId, async () => {
      const telegram = createTelegramMock();
      const referralService = createReferralServiceMock(account({ metacoinBalance: 1_000 }));
      let providerCalls = 0;
      const handleUpdate = createUpdateHandler({
        telegram,
        config: PAID_CALLS_CONFIG,
        referralService,
        now: () => NOW.valueOf(),
        invokeLlm: async () => {
          providerCalls += 1;
          return { text: 'готово', provider: 'test' };
        }
      });

      await selectAndPrompt(handleUpdate, modelId, request);

      assert.ok(callbackData(telegram.sent.at(-1).message).includes('billing:plans:profile'));
      assert.ok(callbackData(telegram.sent.at(-1).message).includes(`model:${modelId}`));
      assert.ok(callbackData(telegram.sent.at(-1).message).includes('task:menu'));
      assert.equal(telegram.sent.at(-1).message.reply_markup.inline_keyboard.flat().length, 3);
      assert.equal(providerCalls, 0);
      assert.equal(referralService.debitCalls.length, 0);
    });
  }
});

test('expired tariff is sent to tariff renewal before provider invocation', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralServiceMock(account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-07-25T11:59:59.000Z',
    metacoinBalance: 1_000
  }));
  let providerCalls = 0;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => {
      providerCalls += 1;
      return { text: 'готово', provider: 'test' };
    }
  });

  await selectAndPrompt(handleUpdate, 'gpt_56_terra', prompt(2_102, 'напиши пост'));

  assert.ok(callbackData(telegram.sent.at(-1).message).includes('billing:plans:profile'));
  assert.equal(providerCalls, 0);
  assert.equal(referralService.debitCalls.length, 0);
});

test('active tariff with insufficient balance is sent to metacoin packages', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralServiceMock(account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 0
  }));
  let providerCalls = 0;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => {
      providerCalls += 1;
      return { text: 'готово', provider: 'test' };
    }
  });

  await selectAndPrompt(handleUpdate, 'gpt_56_terra', prompt(2_202, 'напиши пост'));

  assert.ok(callbackData(telegram.sent.at(-1).message).includes('billing:packages:balance'));
  assert.equal(providerCalls, 0);
  assert.equal(referralService.debitCalls.length, 0);
});

test('explicitly allowlisted free model remains available to a newcomer', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralServiceMock(account());
  let providerCalls = 0;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => {
      providerCalls += 1;
      return { text: 'готово бесплатно', provider: 'openrouter' };
    }
  });

  await selectAndPrompt(handleUpdate, 'gpt_oss_20b_free', prompt(2_302, 'напиши пост'));

  assert.equal(providerCalls, 1);
  assert.equal(telegram.sent.at(-1).message.text, 'готово бесплатно');
  assert.equal(referralService.debitCalls.length, 0);
});

test('a completed text result does not offer regeneration', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralServiceMock(account());
  let providerCalls = 0;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => {
      providerCalls += 1;
      return { text: `ответ ${providerCalls}`, provider: 'openrouter' };
    }
  });

  await selectAndPrompt(handleUpdate, 'gpt_oss_20b_free', prompt(2_303, 'собери план'));

  assert.equal(
    callbackData(telegram.sent.at(-1).message).some((value) => value.startsWith('repeat:')),
    false
  );
  assert.equal(providerCalls, 1);
});

test('Claude Opus 5 uses its verified provider route', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralServiceMock(account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 1_000
  }));
  let invocation;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async (options) => {
      invocation = options;
      return { text: 'готово', provider: 'openrouter' };
    }
  });

  await selectAndPrompt(handleUpdate, 'claude_opus_5', prompt(2_303, 'проверь архитектуру'));

  assert.deepEqual(invocation.providerModels, ['anthropic/claude-opus-5']);
  assert.equal(telegram.sent.at(-1).message.text, 'готово');
  assert.equal(referralService.debitCalls.length, 1);
});

test('FLUX 3 callback opens its priced card without invoking or charging', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralServiceMock(account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 1_000
  }));
  let providerCalls = 0;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => {
      providerCalls += 1;
      return { text: 'не должно вызываться', provider: 'test' };
    }
  });

  await handleUpdate(callback(2_303, 'model:gpt_56_luna'));
  await handleUpdate(callback(2_304, 'model:flux_3'));

  assert.match(telegram.sent.at(-1).message.text, /^<b>FLUX 3<\/b>/u);
  assert.ok(telegram.sent.at(-1).message.text.includes(
    `${formatModelMetacoinPrice(getModelById('flux_3'))} метакоинов</b>`
  ));
  assert.doesNotMatch(telegram.sent.at(-1).message.text, /ранн(?:ий|его) доступ|недоступ/iu);
  assert.equal(providerCalls, 0);
  assert.equal(referralService.debitCalls.length, 0);
});

test('mishchenko_is has full model access on newcomer without metacoin debit', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralServiceMock(account());
  let providerCalls = 0;
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => {
      providerCalls += 1;
      return { text: 'готово', provider: 'test' };
    }
  });

  await selectAndPrompt(
    handleUpdate,
    'gpt_56_luna',
    prompt(2_352, 'напиши пост', 'mishchenko_is')
  );

  assert.equal(providerCalls, 1);
  assert.equal(telegram.sent.at(-1).message.text, 'готово');
  assert.equal(referralService.debitCalls.length, 0);
});

test('owner metered access charges the current balance and the next profile reads the debit', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralServiceMock(account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 100
  }));
  const handleUpdate = createUpdateHandler({
    telegram,
    config: { ...PAID_CALLS_CONFIG, ownerMeteredAccess: true },
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => ({ text: 'готово', provider: 'test' })
  });

  await selectAndPrompt(
    handleUpdate,
    'claude_opus_5',
    prompt(2_354, 'напиши пост', 'mishchenko_is')
  );
  await handleUpdate({ update_id: 2_355, message: { chat: { id: 10 }, text: '/profile' } });

  assert.equal(referralService.debitCalls.length, 1);
  assert.match(telegram.sent.at(-1).message.text, /баланс:.*метакоинов/u);
  assert.doesNotMatch(telegram.sent.at(-1).message.text, /баланс:.*100 метакоинов/u);
});

test('configured owner id keeps full access when Telegram omits the username', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralServiceMock(account());
  let providerCalls = 0;
  const handleUpdate = createUpdateHandler({
    telegram,
    referralService,
    config: PAID_CALLS_CONFIG,
    now: () => NOW,
    async invokeLlm() {
      providerCalls += 1;
      return { text: 'готово' };
    }
  });

  await selectAndPrompt(
    handleUpdate,
    'gpt_56_luna',
    prompt(2_353, 'напиши пост', '', 994500304)
  );

  assert.equal(providerCalls, 1);
  assert.equal(telegram.sent.at(-1).message.text, 'готово');
  assert.equal(referralService.debitCalls.length, 0);
});

test('provider failure never debits metacoins', async () => {
  const telegram = createTelegramMock();
  const referralService = createReferralServiceMock(account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 1_000
  }));
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => {
      throw new Error('provider timeout');
    }
  });

  await selectAndPrompt(handleUpdate, 'gpt_56_luna', prompt(2_402, 'напиши пост'));

  assert.match(telegram.sent.at(-1).message.text, /модель временно недоступна/i);
  assert.equal(referralService.debitCalls.length, 0);
});

test('aggregator failure never debits metacoins', async () => {
  const telegram = createTelegramMock();
  const debitCalls = [];
  const referralService = {
    registerUser() {
      return { telegramId: '10' };
    },
    markStarted() {},
    account() {
      throw new Error('billing aggregator unavailable');
    },
    debitMetacoins(payload) {
      debitCalls.push(payload);
    }
  };
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => ({ text: 'готово', provider: 'test' })
  });

  await selectAndPrompt(handleUpdate, 'gpt_56_luna', prompt(2_502, 'напиши пост'));

  assert.match(telegram.sent.at(-1).message.text, /не получилось обработать запрос/i);
  assert.equal(debitCalls.length, 0);
});

test('successful paid generation debits once idempotently by requestKey', async () => {
  let failedDelivery = false;
  let providerCalls = 0;
  const telegram = createTelegramMock({
    async sendMessage(chatId, message) {
      if (message.text === 'готово' && !failedDelivery) {
        failedDelivery = true;
        throw new Error('temporary Telegram delivery failure');
      }
      const result = { message_id: this.sent.length + 100 };
      this.sent.push({ chatId, message, result });
      return result;
    }
  });
  const currentAccount = account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 1_000
  });
  const referralService = createReferralServiceMock(currentAccount);
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => {
      providerCalls += 1;
      return { text: 'готово', provider: 'test' };
    }
  });
  const request = prompt(2_602, 'напиши пост');

  await handleUpdate(callback(2_601, 'model:gpt_56_terra'));
  await handleUpdate(request);
  await handleUpdate(request);

  assert.equal(providerCalls, 1);
  assert.equal(referralService.debitsByRequestKey.size, 1);
  assert.equal(
    referralService.debitsByRequestKey.has('message:10:2602'),
    true
  );
  const [{ payload: { amount } }] = [...referralService.debitsByRequestKey.values()];
  assert.equal(currentAccount.metacoinBalance, 1_000 - amount);
  assert.equal(telegram.sent.at(-1).message.text, 'готово');
});

test('delivery failure releases a reservation and retry commits without another provider call', async () => {
  let failedOnce = false;
  let providerCalls = 0;
  const telegram = createTelegramMock({
    async sendMessage(chatId, message) {
      if (message.text === 'готово' && !failedOnce) {
        failedOnce = true;
        throw new Error('Telegram sendMessage failed: 400');
      }
      const result = { message_id: this.sent.length + 100 };
      this.sent.push({ chatId, message, result });
      return result;
    }
  });
  const currentAccount = account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 1_000
  });
  const referralService = createTwoPhaseReferralService(currentAccount);
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeLlm: async () => {
      providerCalls += 1;
      return { text: 'готово', provider: 'test' };
    }
  });
  const request = prompt(2_702, 'напиши пост');

  await handleUpdate(callback(2_701, 'model:gpt_56_terra'));
  await handleUpdate(request);

  assert.equal(providerCalls, 1);
  assert.equal(currentAccount.metacoinBalance, 1_000);
  assert.equal(referralService.commits.size, 0);
  assert.equal(referralService.reservations.get('message:10:2702').status, 'released');

  await handleUpdate(request);

  assert.equal(providerCalls, 1);
  assert.equal(referralService.commits.size, 1);
  const [committedAmount] = [...referralService.commits.values()];
  assert.equal(currentAccount.metacoinBalance, 1_000 - committedAmount);
  assert.equal(telegram.sent.at(-1).message.text, 'готово');
});

test('post-delivery history failure does not turn a delivered result into a delivery failure', async () => {
  const telegram = createTelegramMock();
  const currentAccount = account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 1_000
  });
  const referralService = createTwoPhaseReferralService(currentAccount);
  const errors = [];
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    historyService: {
      async startGeneration() {
        return { generationId: 'generation-post-delivery-audit' };
      },
      async completeGeneration() {
        throw new Error('history audit is temporarily unavailable');
      }
    },
    onError(error, context) {
      errors.push({ error, context });
    },
    now: () => NOW.valueOf(),
    invokeLlm: async () => ({ text: 'готово', provider: 'test' })
  });

  await selectAndPrompt(handleUpdate, 'gpt_56_terra', prompt(2_802, 'напиши пост'));

  assert.equal(referralService.reservations.get('message:10:2802').status, 'committed');
  assert.equal(telegram.sent.at(-1).message.text, 'готово');
  assert.equal(
    telegram.sent.some(({ message }) => /доставка не удалась|не принят/u.test(message?.text ?? '')),
    false
  );
  assert.equal(errors.some(({ context }) => context?.action === 'generation_history_complete'), true);
});

test('successful tool generation reserves the debit and delivers media exactly once', async () => {
  const telegram = createTelegramMock();
  const currentAccount = account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 1_000
  });
  const referralService = createReferralServiceMock(currentAccount);
  const toolCalls = [];
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {
      ...PAID_CALLS_CONFIG,
      providerKeys: { ...PAID_CALLS_CONFIG.providerKeys, fal: 'test-fal-key' }
    },
    referralService,
    now: () => NOW.valueOf(),
    invokeTool: async (request) => {
      toolCalls.push(request);
      return {
        type: 'image',
        url: 'https://cdn.example.test/result.png',
        mimeType: 'image/png',
        provider: 'fal',
        requestId: 'fal-request-1'
      };
    }
  });
  const request = {
    update_id: 2_702,
    message: {
      message_id: 2_702,
      chat: { id: 10 },
      from: { id: 10 },
      photo: [{ file_id: 'small' }, { file_id: 'large' }]
    }
  };

  await selectAndPrompt(handleUpdate, 'photo_remove_bg', request);

  assert.equal(toolCalls.length, 1);
  assert.equal(toolCalls[0].toolId, 'photo_remove_bg');
  assert.equal(toolCalls[0].telegramInput.photo.at(-1).file_id, 'large');
  assert.equal(telegram.sent.at(-1).kind, 'photo');
  assert.equal(telegram.sent.at(-1).url, 'https://cdn.example.test/result.png');
  assert.equal(referralService.debitCalls.length, 1);
  assert.equal(referralService.debitCalls[0].requestKey, 'message:10:2702');
  assert.ok(referralService.debitCalls[0].amount > 0);
});

test('paid media is never submitted to a provider before its metacoin reservation succeeds', async () => {
  const telegram = createTelegramMock();
  const currentAccount = account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 1_000
  });
  const referralService = {
    ...createTwoPhaseReferralService(currentAccount),
    // Simulate a concurrent debit after the access check but before this
    // request can reserve its balance.
    reserveMetacoins() {
      return { status: 'insufficient_funds', balance: 0 };
    }
  };
  const mediaCalls = [];
  const handleUpdate = createUpdateHandler({
    telegram,
    config: PAID_CALLS_CONFIG,
    referralService,
    now: () => NOW.valueOf(),
    invokeMediaModel: async (request) => {
      mediaCalls.push(request);
      return {
        type: 'video',
        url: 'https://cdn.example.test/should-not-exist.mp4',
        mimeType: 'video/mp4',
        provider: 'routerai'
      };
    }
  });

  await selectAndPrompt(handleUpdate, 'seedance_20', prompt(2_790, 'сделай ролик'));

  assert.equal(mediaCalls.length, 0);
  assert.match(
    telegram.sent.at(-1).message.text,
    /не хватает метакоинов/i
  );
  assert.equal(referralService.reservations.size, 0);
});

test('paid Seedance model uses the provider tunnel and delivers the result', async () => {
  const telegram = createTelegramMock();
  const currentAccount = account({
    subscriptionPlanId: 'author',
    subscriptionExpiresAt: '2026-08-25T12:00:00.000Z',
    metacoinBalance: 1_000
  });
  const referralService = createReferralServiceMock(currentAccount);
  const mediaCalls = [];
  const handleUpdate = createUpdateHandler({
    telegram,
    config: {
      ...PAID_CALLS_CONFIG,
      providerKeys: { polza: 'polza-key', kie: 'kie-key' }
    },
    referralService,
    now: () => NOW.valueOf(),
    invokeMediaModel: async (request) => {
      mediaCalls.push(request);
      return {
        type: 'video',
        url: 'https://cdn.example.test/seedance.mp4',
        mimeType: 'video/mp4',
        provider: 'polza',
        requestId: 'seedance-job-1'
      };
    }
  });

  await selectAndPrompt(handleUpdate, 'seedance_20', prompt(2_800, 'сделай ролик'));

  assert.equal(mediaCalls.length, 1);
  assert.equal(mediaCalls[0].model.id, 'seedance_20');
  assert.equal(mediaCalls[0].telegramInput.text, 'сделай ролик');
  assert.equal(telegram.sent.at(-1).kind, 'video');
  assert.equal(telegram.sent.at(-1).url, 'https://cdn.example.test/seedance.mp4');
  assert.equal(referralService.debitCalls.length, 1);
  assert.ok(referralService.debitCalls[0].amount > 0);
});
