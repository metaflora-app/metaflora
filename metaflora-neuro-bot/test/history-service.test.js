import test from 'node:test';
import assert from 'node:assert/strict';

import { createHistoryService } from '../src/history-service.js';

function repositoryDouble() {
  const calls = [];
  return {
    calls,
    async upsertUser(payload) {
      calls.push(['upsertUser', payload]);
      return 'user-id';
    },
    async recordEvent(payload) {
      calls.push(['recordEvent', payload]);
      return 'event-id';
    },
    async ensureConversation(payload) {
      calls.push(['ensureConversation', payload]);
      return 'conversation-id';
    },
    async appendMessage(payload) {
      calls.push(['appendMessage', payload]);
      return 'message-id';
    },
    async startGeneration(payload) {
      calls.push(['startGeneration', payload]);
      return 'generation-id';
    },
    async completeGeneration(payload) {
      calls.push(['completeGeneration', payload]);
      return payload.generationId;
    },
    async failGeneration(payload) {
      calls.push(['failGeneration', payload]);
      return payload.generationId;
    },
    async recordMetacoinTransaction(payload) {
      calls.push(['recordMetacoinTransaction', payload]);
      return 'ledger-id';
    },
    async listGenerations(payload) {
      calls.push(['listGenerations', payload]);
      return {
        items: [{
          id: 'generation-id',
          kind: 'image',
          subjectLabel: 'убрать фон',
          prompt: 'сделай фон прозрачным',
          status: 'completed',
          metacoinsCharged: 7,
          createdAt: '2026-07-27T00:00:00.000Z'
        }],
        total: 1,
        hasMore: false
      };
    },
    async getGeneration(payload) {
      calls.push(['getGeneration', payload]);
      return {
        id: payload.generationId,
        kind: 'image',
        status: 'completed'
      };
    },
    async claimFreeWeeklyRequest(payload) {
      calls.push(['claimFreeWeeklyRequest', payload]);
      return { allowed: true, used: 1, limit: 50, remaining: 49, duplicate: false };
    },
    async releaseFreeWeeklyRequest(payload) {
      calls.push(['releaseFreeWeeklyRequest', payload]);
      return true;
    },
    async listConversations(payload) {
      calls.push(['listConversations', payload]);
      return {
        items: [{
          id: 'conversation-id',
          kind: 'model',
          subjectId: 'gpt_5_mini',
          title: 'новый диалог',
          status: 'active',
          latestMessageAt: '2026-07-27T00:00:00.000Z',
          createdAt: '2026-07-27T00:00:00.000Z',
          messageCount: 1,
          lastMessagePreview: 'привет'
        }],
        nextCursor: null
      };
    },
    async getConversationThread(payload) {
      calls.push(['getConversationThread', payload]);
      return {
        conversation: {
          id: 'conversation-id',
          kind: 'model',
          subjectId: 'gpt_5_mini',
          title: 'новый диалог',
          status: 'active',
          latestMessageAt: '2026-07-27T00:00:00.000Z',
          createdAt: '2026-07-27T00:00:00.000Z'
        },
        messages: [],
        nextCursor: null
      };
    },
    async archiveConversation(payload) {
      calls.push(['archiveConversation', payload]);
      return {
        conversationId: payload.conversationId,
        status: 'archived',
        kind: 'model',
        subjectId: 'gpt_5_mini'
      };
    },
    async activateConversation(payload) {
      calls.push(['activateConversation', payload]);
      return {
        conversationId: payload.conversationId,
        conversationKey: 'model:10:gpt_5_mini:existing-branch',
        kind: 'model',
        subjectId: 'gpt_5_mini',
        title: 'план запуска',
        status: 'active'
      };
    },
    async close() {
      calls.push(['close']);
    }
  };
}

test('history service claims and releases one idempotent newcomer request', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  const quota = await history.claimFreeWeeklyRequest({
    telegramUserId: '10',
    requestKey: 'message:10:1'
  });
  const released = await history.releaseFreeWeeklyRequest({
    telegramUserId: '10',
    requestKey: 'message:10:1'
  });

  assert.equal(quota.remaining, 49);
  assert.equal(released, true);
  assert.deepEqual(repository.calls, [
    ['claimFreeWeeklyRequest', { telegramUserId: '10', requestKey: 'message:10:1' }],
    ['releaseFreeWeeklyRequest', { telegramUserId: '10', requestKey: 'message:10:1' }]
  ]);
});

test('history service exposes the durable lifecycle notification operations', async () => {
  const repository = repositoryDouble();
  Object.assign(repository, {
    async schedulePaymentAbandonmentReminders(payload) {
      repository.calls.push(['schedulePaymentAbandonmentReminders', payload]);
    },
    async scheduleNewcomerReminder(payload) {
      repository.calls.push(['scheduleNewcomerReminder', payload]);
    },
    async claimDueLifecycleNotifications(payload) {
      repository.calls.push(['claimDueLifecycleNotifications', payload]);
      return [];
    },
    async markLifecycleNotificationSent(id) {
      repository.calls.push(['markLifecycleNotificationSent', id]);
      return true;
    },
    async cancelLifecycleNotification(id, reason) {
      repository.calls.push(['cancelLifecycleNotification', id, reason]);
      return true;
    },
    async getPaymentRecord(id) {
      repository.calls.push(['getPaymentRecord', id]);
      return { paymentId: id, status: 'pending' };
    },
    async getNewcomerReminderEligibility(payload) {
      repository.calls.push(['getNewcomerReminderEligibility', payload]);
      return { eligible: true, reason: 'newcomer' };
    }
  });
  const history = createHistoryService({ repository });

  await history.schedulePaymentAbandonmentReminders({ paymentId: 'payment-1' });
  await history.scheduleNewcomerReminder({ telegramUserId: '10' });
  assert.deepEqual(await history.claimDueLifecycleNotifications({ limit: 1 }), []);
  assert.equal(await history.markLifecycleNotificationSent('notification-1'), true);
  assert.equal(await history.cancelLifecycleNotification('notification-1', 'paid_plan'), true);
  assert.deepEqual(await history.getPaymentRecord('payment-1'), { paymentId: 'payment-1', status: 'pending' });
  assert.deepEqual(await history.getNewcomerReminderEligibility({ telegramUserId: '10' }), {
    eligible: true,
    reason: 'newcomer'
  });

  assert.deepEqual(repository.calls.map(([name]) => name), [
    'schedulePaymentAbandonmentReminders',
    'scheduleNewcomerReminder',
    'claimDueLifecycleNotifications',
    'markLifecycleNotificationSent',
    'cancelLifecycleNotification',
    'getPaymentRecord',
    'getNewcomerReminderEligibility'
  ]);
});

test('history service captures Telegram update without raw binary payloads', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  await history.captureUpdate({
    update_id: 100,
    message: {
      message_id: 20,
      chat: { id: 10, type: 'private' },
      from: {
        id: 10,
        username: 'mishchenko_is',
        first_name: 'Иван',
        language_code: 'ru',
        is_premium: true
      },
      text: '/menu'
    }
  });

  assert.equal(repository.calls[0][0], 'upsertUser');
  assert.equal(repository.calls[1][0], 'recordEvent');
  assert.equal(repository.calls[1][1].eventName, 'telegram.message.received');
  assert.deepEqual(repository.calls[1][1].metadata, {
    chatType: 'private',
    contentType: 'text',
    command: 'menu',
    textLength: 5
  });
});

test('history service stores a complete text generation as a dialog', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  const run = await history.startGeneration({
    telegramUserId: '10',
    telegramChatId: '10',
    telegramMessageId: '20',
    requestKey: 'message:10:20',
    kind: 'text',
    subjectType: 'model',
    subjectId: 'gpt_5_mini',
    title: 'GPT-5 Mini',
    prompt: 'привет',
    parameters: { temperature: '0.7' },
    metacoinsQuoted: 2
  });
  await history.completeGeneration(run, {
    outputText: 'привет!',
    metacoinsCharged: 2,
    provider: 'openrouter',
    providerModelId: 'openai/gpt-5-mini'
  });

  assert.deepEqual(run, {
    generationId: 'generation-id',
    conversationId: 'conversation-id',
    telegramUserId: '10'
  });
  assert.deepEqual(repository.calls.map(([name]) => name), [
    'ensureConversation',
    'appendMessage',
    'startGeneration',
    'recordEvent',
    'appendMessage',
    'completeGeneration',
    'recordEvent'
  ]);
});

test('history service stores media and tool generations without creating model conversations', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  const mediaRun = await history.startGeneration({
    telegramUserId: '10',
    telegramChatId: '10',
    telegramMessageId: '30',
    requestKey: 'media:10:30',
    kind: 'image',
    subjectType: 'model',
    subjectId: 'nano_banana_pro',
    title: 'Nano Banana Pro',
    prompt: 'афиша',
    metacoinsQuoted: 7
  });
  const toolRun = await history.startGeneration({
    telegramUserId: '10',
    telegramChatId: '10',
    telegramMessageId: '31',
    requestKey: 'tool:10:31',
    kind: 'tool',
    subjectType: 'tool',
    subjectId: 'remove_background',
    title: 'убрать фон',
    prompt: 'сделай фон прозрачным',
    metacoinsQuoted: 7
  });

  assert.equal(mediaRun.conversationId, null);
  assert.equal(toolRun.conversationId, null);
  assert.deepEqual(repository.calls.map(([name]) => name), [
    'startGeneration',
    'recordEvent',
    'startGeneration',
    'recordEvent'
  ]);
  assert.equal(repository.calls[0][1].conversationId, null);
  assert.equal(repository.calls[2][1].conversationId, null);
});

test('history failures are reported but never break the bot flow', async () => {
  const errors = [];
  const history = createHistoryService({
    repository: {
      async upsertUser() {
        throw new Error('database unavailable');
      }
    },
    onError(error, context) {
      errors.push({ error, context });
    }
  });

  const result = await history.captureUpdate({
    update_id: 1,
    message: {
      message_id: 1,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: 'привет'
    }
  });

  assert.equal(result, null);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].context.action, 'history.capture_update');
});

test('history capture syncs a Telegram avatar and forces refresh on start', async () => {
  const repository = repositoryDouble();
  const calls = [];
  const history = createHistoryService({
    repository,
    avatarService: {
      async sync(actor, options) {
        calls.push({ actor, options });
        return { status: 'reference_only' };
      }
    }
  });

  await history.captureUpdate({
    update_id: 1,
    message: {
      message_id: 1,
      chat: { id: 10, type: 'private' },
      from: { id: 10, first_name: 'Иван' },
      text: '/start referral'
    }
  });

  assert.deepEqual(calls, [{
    actor: { id: 10, first_name: 'Иван' },
    options: { force: true }
  }]);
});

test('avatar sync failure never prevents capture of the Telegram update', async () => {
  const repository = repositoryDouble();
  const errors = [];
  const history = createHistoryService({
    repository,
    avatarService: {
      async sync() {
        throw new Error('avatar unavailable');
      }
    },
    onError(error, context) {
      errors.push({ error, context });
    }
  });

  const result = await history.captureUpdate({
    update_id: 1,
    message: {
      message_id: 1,
      chat: { id: 10, type: 'private' },
      from: { id: 10 },
      text: 'привет'
    }
  });

  assert.equal(result, 'event-id');
  assert.equal(errors[0].context.action, 'history.sync_avatar');
  assert.deepEqual(repository.calls.map(([name]) => name), [
    'upsertUser',
    'recordEvent'
  ]);
});

test('history service records debit and its product event', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  const id = await history.recordMetacoinTransaction({
    telegramUserId: '10',
    idempotencyKey: 'generation:10:55',
    delta: -7,
    balanceAfter: 93,
    source: 'generation',
    referenceType: 'generation_request',
    referenceId: 'generation:10:55',
    description: 'списание за тестовую генерацию',
    metadata: { debitStatus: 'debited' }
  });

  assert.equal(id, 'ledger-id');
  assert.deepEqual(repository.calls.map(([name]) => name), [
    'recordMetacoinTransaction',
    'recordEvent'
  ]);
  assert.equal(repository.calls[1][1].eventName, 'metacoins.debited');
  assert.equal(repository.calls[1][1].metadata.balanceAfter, 93);
});

test('history service exposes generation history scoped to the Telegram user', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  const page = await history.listGenerations({
    telegramUserId: '10',
    limit: 6,
    cursor: 'cursor-12',
    scope: 'media'
  });
  const generation = await history.getGeneration({
    telegramUserId: '10',
    generationId: 'generation-id'
  });

  assert.equal(page.items[0].subjectLabel, 'убрать фон');
  assert.equal(generation.id, 'generation-id');
  assert.deepEqual(repository.calls.slice(0, 2), [
    ['listGenerations', {
      telegramUserId: '10',
      limit: 6,
      cursor: 'cursor-12',
      kind: undefined,
      scope: 'media'
    }],
    ['getGeneration', { telegramUserId: '10', generationId: 'generation-id' }]
  ]);
});

test('history service exposes Telegram-ready dialog list and branch methods', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  const page = await history.listDialogs({
    telegramUserId: '10',
    limit: 10,
    status: 'active',
    kind: 'model'
  });
  const branch = await history.getDialog({
    telegramUserId: '10',
    conversationId: 'conversation-id'
  });

  assert.equal(page.items[0].title, 'новый диалог');
  assert.equal(branch.conversation.id, 'conversation-id');
  assert.deepEqual(repository.calls.slice(0, 2).map(([name]) => name), [
    'listConversations',
    'getConversationThread'
  ]);
  assert.equal(repository.calls[0][1].telegramUserId, '10');
  assert.equal(repository.calls[1][1].telegramUserId, '10');
});

test('history service restricts dialogs to model conversations even when the caller omits a kind', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  await history.listDialogs({
    telegramUserId: '10',
    limit: 10,
    status: 'active'
  });

  assert.equal(repository.calls.at(-1)[0], 'listConversations');
  assert.equal(repository.calls.at(-1)[1].kind, 'model');
});

test('history service exposes generation history for the current Telegram user', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  const page = await history.listGenerations({
    telegramUserId: '10',
    limit: 8
  });

  assert.equal(page.items[0].id, 'generation-id');
  assert.equal(repository.calls.at(-1)[0], 'listGenerations');
  assert.equal(repository.calls.at(-1)[1].telegramUserId, '10');
});

test('history service forwards the agent scope without changing the account owner', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  await history.listGenerations({
    telegramUserId: '10',
    limit: 6,
    scope: 'agent',
    kind: 'agent'
  });

  assert.deepEqual(repository.calls.at(-1), ['listGenerations', {
    telegramUserId: '10',
    limit: 6,
    kind: 'agent',
    scope: 'agent'
  }]);
});

test('history service creates the same new dialog for a repeated request key', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  const first = await history.startNewDialog({
    telegramUserId: '10',
    subjectType: 'model',
    subjectId: 'gpt_5_mini',
    title: 'новый диалог',
    requestKey: 'callback:10:new:gpt_5_mini'
  });
  const second = await history.startNewDialog({
    telegramUserId: '10',
    subjectType: 'model',
    subjectId: 'gpt_5_mini',
    title: 'новый диалог',
    requestKey: 'callback:10:new:gpt_5_mini'
  });

  assert.equal(first.conversationKey, second.conversationKey);
  assert.deepEqual(repository.calls.map(([name]) => name), [
    'ensureConversation',
    'recordEvent',
    'ensureConversation',
    'recordEvent'
  ]);
});

test('history service archives a dialog and rotates the active branch', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  const archived = await history.archiveDialog({
    telegramUserId: '10',
    conversationId: 'conversation-id',
    subjectType: 'model',
    subjectId: 'gpt_5_mini'
  });
  const nextKey = history.rotateConversation({
    telegramUserId: '10',
    subjectType: 'model',
    subjectId: 'gpt_5_mini'
  });

  assert.equal(archived.status, 'archived');
  assert.match(nextKey, /^model:10:gpt_5_mini:/);
  assert.deepEqual(repository.calls.map(([name]) => name), [
    'archiveConversation',
    'recordEvent'
  ]);
});

test('history service resumes an owned request branch without exposing its routing key', async () => {
  const repository = repositoryDouble();
  const history = createHistoryService({ repository });

  const resumed = await history.resumeDialog({
    telegramUserId: '10',
    conversationId: 'conversation-id'
  });
  const run = await history.startGeneration({
    telegramUserId: '10',
    telegramChatId: '10',
    telegramMessageId: '21',
    requestKey: 'message:10:21',
    kind: 'text',
    subjectType: 'model',
    subjectId: 'gpt_5_mini',
    title: 'GPT-5 Mini',
    prompt: 'продолжи',
    parameters: {},
    metacoinsQuoted: 2
  });
  await history.archiveDialog({
    telegramUserId: '10',
    conversationId: 'conversation-id'
  });
  await history.startGeneration({
    telegramUserId: '10',
    telegramChatId: '10',
    telegramMessageId: '22',
    requestKey: 'message:10:22',
    kind: 'text',
    subjectType: 'model',
    subjectId: 'gpt_5_mini',
    title: 'GPT-5 Mini',
    prompt: 'новая ветка',
    parameters: {},
    metacoinsQuoted: 2
  });

  assert.deepEqual(resumed, {
    conversationId: 'conversation-id',
    kind: 'model',
    subjectId: 'gpt_5_mini',
    title: 'план запуска',
    status: 'active'
  });
  assert.equal(resumed.conversationKey, undefined);
  const ensureCalls = repository.calls.filter(([name]) => name === 'ensureConversation');
  assert.equal(ensureCalls[0][1].conversationKey, 'model:10:gpt_5_mini:existing-branch');
  assert.notEqual(ensureCalls[1][1].conversationKey, 'model:10:gpt_5_mini:existing-branch');
  assert.equal(run.conversationId, 'conversation-id');
  assert.deepEqual(repository.calls.slice(0, 2).map(([name]) => name), [
    'activateConversation',
    'recordEvent'
  ]);
});
