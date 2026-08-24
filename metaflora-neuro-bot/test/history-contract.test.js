import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeHistoryEvent,
  sanitizeAuditText,
  sanitizeHistoryMetadata
} from '../src/history-contract.js';

test('history event keeps routing metadata needed for product analytics', () => {
  const event = normalizeHistoryEvent({
    eventName: 'generation.started',
    category: 'generation',
    telegramUserId: 123456,
    telegramChatId: 123456,
    telegramUpdateId: 700,
    telegramMessageId: 42,
    requestKey: 'message:123456:42',
    conversationKey: 'model:123456:gpt_5_mini',
    subjectType: 'model',
    subjectId: 'gpt_5_mini',
    metadata: {
      inputs: ['text'],
      settings: { temperature: '0.7' }
    }
  }, new Date('2026-07-27T00:00:00.000Z'));

  assert.deepEqual(event, {
    eventName: 'generation.started',
    category: 'generation',
    telegramUserId: '123456',
    telegramChatId: '123456',
    telegramUpdateId: '700',
    telegramMessageId: '42',
    requestKey: 'message:123456:42',
    conversationKey: 'model:123456:gpt_5_mini',
    subjectType: 'model',
    subjectId: 'gpt_5_mini',
    occurredAt: '2026-07-27T00:00:00.000Z',
    metadata: {
      inputs: ['text'],
      settings: { temperature: '0.7' }
    }
  });
});

test('history metadata removes secrets and binary payloads recursively', () => {
  const metadata = sanitizeHistoryMetadata({
    prompt: 'сделай иллюстрацию',
    apiKey: 'must-not-survive',
    authorization: 'Bearer secret',
    audio: Buffer.from('binary'),
    nested: {
      password: 'secret',
      safe: true
    },
    output: {
      audio_url: 'https://cdn.example.test/result.mp3?signature=secret&expires=1',
      mime_type: 'audio/mpeg'
    }
  });

  assert.deepEqual(metadata, {
    prompt: 'сделай иллюстрацию',
    nested: { safe: true },
    output: {
      audio_url: 'https://cdn.example.test/result.mp3',
      mime_type: 'audio/mpeg'
    }
  });
});

test('audit text removes credentials, URL secrets, and raw prompt excerpts', () => {
  const text = sanitizeAuditText(
    'Provider failed: Bearer sk-secret-token at https://api.example.test/run?api_key=hidden&prompt=raw message {"prompt":"raw prompt","content":"raw content"}',
    1_000
  );

  assert.doesNotMatch(text, /sk-secret-token/);
  assert.doesNotMatch(text, /api_key=hidden/);
  assert.doesNotMatch(text, /raw prompt|raw content|raw message/);
  assert.match(text, /api_key=\[REDACTED\]/);
});

test('history contract rejects malformed identifiers and unbounded text', () => {
  assert.throws(
    () => normalizeHistoryEvent({
      eventName: 'generation.started',
      category: 'generation',
      telegramUserId: 'not-an-id'
    }),
    /Telegram user id/
  );
  assert.throws(
    () => normalizeHistoryEvent({
      eventName: 'x'.repeat(121),
      category: 'generation',
      telegramUserId: '10'
    }),
    /event name/
  );
});
