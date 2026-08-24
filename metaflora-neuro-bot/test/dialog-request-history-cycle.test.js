import test from 'node:test';
import assert from 'node:assert/strict';

import { createHistoryService } from '../src/history-service.js';

function memoryHistoryRepository() {
  let conversations = [];
  let messages = [];
  let generations = [];

  return {
    async ensureConversation(value) {
      const existing = conversations.find((item) => (
        item.telegramUserId === String(value.telegramUserId)
        && item.conversationKey === value.conversationKey
      ));
      if (existing) return existing.id;
      const created = Object.freeze({
        id: `conversation-${conversations.length + 1}`,
        telegramUserId: String(value.telegramUserId),
        conversationKey: value.conversationKey,
        kind: value.kind,
        subjectId: value.subjectId,
        title: value.title,
        status: 'active'
      });
      conversations = [...conversations, created];
      return created.id;
    },
    async appendMessage(value) {
      const item = Object.freeze({
        id: `message-${messages.length + 1}`,
        telegramUserId: String(value.telegramUserId),
        conversationId: value.conversationId,
        role: value.role,
        content: value.content,
        status: value.status ?? 'completed',
        metacoinsCharged: value.metacoinsCharged ?? 0,
        createdAt: new Date(1_700_000_000_000 + messages.length * 1000).toISOString()
      });
      messages = [...messages, item];
      return item.id;
    },
    async startGeneration(value) {
      const item = Object.freeze({
        id: `generation-${generations.length + 1}`,
        telegramUserId: String(value.telegramUserId),
        conversationId: value.conversationId,
        status: 'running'
      });
      generations = [...generations, item];
      return item.id;
    },
    async completeGeneration(value) {
      generations = generations.map((item) => (
        item.id === value.generationId
          ? Object.freeze({ ...item, status: 'completed' })
          : item
      ));
      return value.generationId;
    },
    async recordEvent() {
      return 'event-id';
    },
    async listConversations({ telegramUserId, status, kind }) {
      const ownerId = String(telegramUserId);
      const items = conversations
        .filter((item) => (
          item.telegramUserId === ownerId
          && (!status || item.status === status)
          && (!kind || item.kind === kind)
        ))
        .map((item) => {
          const branchMessages = messages.filter(({ conversationId }) => conversationId === item.id);
          return Object.freeze({
            ...item,
            messageCount: branchMessages.length,
            lastMessagePreview: branchMessages.at(-1)?.content ?? ''
          });
        });
      return Object.freeze({ items: Object.freeze(items), nextCursor: null });
    },
    async getConversationThread({ telegramUserId, conversationId }) {
      const ownerId = String(telegramUserId);
      const conversation = conversations.find((item) => (
        item.id === conversationId && item.telegramUserId === ownerId
      ));
      if (!conversation) return null;
      return Object.freeze({
        conversation,
        messages: Object.freeze(messages.filter((item) => (
          item.conversationId === conversationId && item.telegramUserId === ownerId
        ))),
        nextCursor: null
      });
    },
    async activateConversation({ telegramUserId, conversationId }) {
      const ownerId = String(telegramUserId);
      const conversation = conversations.find((item) => (
        item.id === conversationId && item.telegramUserId === ownerId
      ));
      if (!conversation) return null;
      conversations = conversations.map((item) => (
        item.id === conversationId
          ? Object.freeze({ ...item, status: 'active' })
          : item
      ));
      return Object.freeze({
        conversationId,
        conversationKey: conversation.conversationKey,
        kind: conversation.kind,
        subjectId: conversation.subjectId,
        title: conversation.title,
        status: 'active'
      });
    },
    async archiveConversation({ telegramUserId, conversationId }) {
      const ownerId = String(telegramUserId);
      const conversation = conversations.find((item) => (
        item.id === conversationId && item.telegramUserId === ownerId
      ));
      if (!conversation) return null;
      conversations = conversations.map((item) => (
        item.id === conversationId
          ? Object.freeze({ ...item, status: 'archived' })
          : item
      ));
      return Object.freeze({ conversationId, status: 'archived' });
    }
  };
}

test('request history completes save, list, open, resume, archive and owner isolation cycle', async () => {
  const history = createHistoryService({ repository: memoryHistoryRepository() });
  const first = await history.startGeneration({
    telegramUserId: '10',
    telegramChatId: '10',
    telegramMessageId: '20',
    requestKey: 'message:10:20',
    kind: 'text',
    subjectType: 'model',
    subjectId: 'gpt_56_luna',
    title: 'план запуска',
    prompt: 'собери план запуска',
    parameters: {},
    metacoinsQuoted: 2
  });
  await history.completeGeneration(first, {
    outputText: 'готовый план',
    metacoinsCharged: 2
  });

  const list = await history.listDialogs({
    telegramUserId: '10',
    status: 'active',
    kind: 'model'
  });
  const opened = await history.getDialog({
    telegramUserId: '10',
    conversationId: first.conversationId
  });
  const resumed = await history.resumeDialog({
    telegramUserId: '10',
    conversationId: first.conversationId
  });
  const continued = await history.startGeneration({
    telegramUserId: '10',
    telegramChatId: '10',
    telegramMessageId: '21',
    requestKey: 'message:10:21',
    kind: 'text',
    subjectType: 'model',
    subjectId: resumed.subjectId,
    title: resumed.title,
    prompt: 'добавь сроки',
    parameters: {},
    metacoinsQuoted: 2
  });
  const archived = await history.archiveDialog({
    telegramUserId: '10',
    conversationId: first.conversationId,
    subjectType: 'model',
    subjectId: 'gpt_56_luna'
  });
  const чужаяВетка = await history.getDialog({
    telegramUserId: '11',
    conversationId: first.conversationId
  });

  assert.equal(list.items.length, 1);
  assert.equal(opened.messages.map(({ content }) => content).join('|'), 'собери план запуска|готовый план');
  assert.equal(resumed.conversationKey, undefined);
  assert.equal(continued.conversationId, first.conversationId);
  assert.equal(archived.status, 'archived');
  assert.equal(чужаяВетка, null);
});
