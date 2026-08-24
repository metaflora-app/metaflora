import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAggregatorErrorMessage,
  buildProviderErrorMessage,
  ProviderRequestError
} from '../src/request-errors.js';

function buttons(message) {
  return message.reply_markup.inline_keyboard.flat();
}

test('provider error wrapper preserves safe diagnostics from the selected route', () => {
  const error = new ProviderRequestError('provider failed', {
    cause: Object.assign(new Error('private response body'), {
      code: 'provider_rejected',
      provider: 'polza',
      providerModelId: 'openai/gpt-5.4-image-2',
      httpStatus: 422,
      providerCode: 'INVALID_INPUT',
      requestId: 'polza-job-42',
      acceptedJob: false
    })
  });

  assert.equal(error.code, 'provider_rejected');
  assert.equal(error.provider, 'polza');
  assert.equal(error.providerModelId, 'openai/gpt-5.4-image-2');
  assert.equal(error.httpStatus, 422);
  assert.equal(error.providerCode, 'INVALID_INPUT');
  assert.equal(error.requestId, 'polza-job-42');
  assert.equal(error.acceptedJob, false);
  assert.equal(String(error.cause?.message ?? '').includes('private'), false);
});

test('provider error offers retry, another model and support', () => {
  const message = buildProviderErrorMessage({ id: 'flux_pro', category: 'image' });
  const actions = buttons(message);

  assert.match(message.text, /@metaflora_support/);
  assert.doesNotMatch(message.text, /stack|exception|api key/i);
  assert.ok(actions.some(({ text, callback_data }) => (
    text === 'повторить'
    && callback_data === 'use:flux_pro'
  )));
  assert.ok(actions.some(({ text, callback_data }) => (
    text === 'выбрать другую модель'
    && callback_data === 'modelcat:image'
  )));
  assert.ok(actions.some(({ url }) => url === 'https://t.me/metaflora_support'));
  assert.ok(actions.some(({ callback_data }) => callback_data === 'task:profile'));
  assert.ok(actions.some(({ callback_data }) => callback_data === 'task:menu'));
});

test('provider error returns tool models to their tool category', () => {
  const message = buildProviderErrorMessage({
    id: 'web_search',
    category: 'search',
    source: 'tool'
  });
  const actions = buttons(message);

  assert.ok(actions.some(({ text, callback_data }) => (
    text === 'повторить'
    && callback_data === 'use:web_search'
  )));
  assert.ok(actions.some(({ text, callback_data }) => (
    text === 'выбрать другую модель'
    && callback_data === 'toolcat:search'
  )));
});

test('provider error without a selected model omits an unusable retry action', () => {
  const actions = buttons(buildProviderErrorMessage());

  assert.ok(!actions.some(({ text }) => text === 'повторить'));
  assert.ok(actions.some(({ callback_data }) => callback_data === 'modelcat:llm'));
});

test('aggregator error directs the user to support without model actions', () => {
  const message = buildAggregatorErrorMessage({ id: 'flux_pro', category: 'image' });
  const actions = buttons(message);

  assert.match(message.text, /@metaflora_support/);
  assert.doesNotMatch(message.text, /stack|exception|api key/i);
  assert.ok(actions.some(({ url }) => url === 'https://t.me/metaflora_support'));
  assert.ok(!actions.some(({ text }) => text === 'повторить'));
  assert.ok(!actions.some(({ text }) => text === 'выбрать другую модель'));
  assert.ok(actions.some(({ callback_data }) => callback_data === 'task:profile'));
  assert.ok(actions.some(({ callback_data }) => callback_data === 'task:menu'));
});
