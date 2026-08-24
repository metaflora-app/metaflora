import assert from 'node:assert/strict';
import test from 'node:test';

import { createMediaModelExecutor, getMediaFallbackStatus } from '../src/media-model-executor.js';
import { getProviderAdapter } from '../src/provider-adapters.js';
import { getModelById } from '../src/model-catalog.js';

const CREATE_ENDPOINT = 'https://routerai.ru/api/v1/videos';
const STATUS_ENDPOINT = 'https://routerai.ru/api/v1/videos/{requestId}';

test('RouterAI video adapter serializes and parses the official async contract', async () => {
  const adapter = getProviderAdapter('routerai');
  const route = { endpoint: CREATE_ENDPOINT, model: 'bytedance/seedance-2.5' };
  assert.deepEqual(await adapter.submissionBody(route, {
    input: {
      prompt: 'cinematic scene',
      duration: 8,
      resolution: '720p',
      aspect_ratio: '16:9',
      generate_audio: true,
      image_urls: ['https://uploads.example.test/reference.jpg']
    }
  }), {
    model: 'bytedance/seedance-2.5',
    prompt: 'cinematic scene',
    duration: 8,
    resolution: '720p',
    aspect_ratio: '16:9',
    generate_audio: true,
    input_references: [{
      type: 'image_url',
      image_url: { url: 'https://uploads.example.test/reference.jpg' }
    }]
  });
  assert.deepEqual(adapter.parseSubmission({
    id: 'router-task-1',
    status: 'pending',
    polling_url: 'https://routerai.ru/api/v1/videos/router-task-1'
  }), { requestId: 'router-task-1', state: 'pending' });
  assert.deepEqual(adapter.parseStatus({
    id: 'router-task-1',
    status: 'completed',
    unsigned_urls: ['https://routerai.ru/api/v1/videos/router-task-1/content?index=0']
  }), {
    state: 'succeeded',
    output: ['https://routerai.ru/api/v1/videos/router-task-1/content?index=0']
  });
  await assert.rejects(() => adapter.submissionBody(route, {
    input: { prompt: 'unsafe', image_urls: ['http://127.0.0.1/internal.jpg'] }
  }), /URL.*not allowed/i);
});

test('RouterAI video adapter canonicalizes the documented 4K enum', async () => {
  const adapter = getProviderAdapter('routerai');
  const route = { endpoint: CREATE_ENDPOINT, model: 'bytedance/seedance-2.0' };
  assert.equal((await adapter.submissionBody(route, {
    input: { prompt: 'cinematic scene', resolution: '4k' }
  })).resolution, '4K');
});

for (const modelId of ['seedance_25', 'flux_3']) {
  test(`${modelId} uses RouterAI as its only primary runtime`, async () => {
    let captured;
    const execute = createMediaModelExecutor({
      providerKeys: { routerai: 'routerai-key', gptunnel: 'historical-key' },
      invoke: async (_request, { config }) => {
        captured = config;
        return { provider: 'routerai' };
      }
    });
    await execute({
      model: getModelById(modelId),
      telegramInput: { text: 'cinematic scene' }
    });
    assert.deepEqual(captured.routes.model.map(({ provider }) => provider), ['routerai']);
    assert.equal(captured.routes.model[0].endpoint, CREATE_ENDPOINT);
    assert.equal(captured.routes.model[0].statusEndpoint, STATUS_ENDPOINT);
    assert.deepEqual(captured.providers, {
      polza: { apiKey: '' },
      routerai: { apiKey: 'routerai-key' }
    });
  });
}

test('Seedance 2.0 has RouterAI as its primary executable route', () => {
  const status = getMediaFallbackStatus(getModelById('seedance_20'));
  assert.deepEqual(status, {
    provider: 'routerai',
    status: 'primary',
    reason: 'RouterAI is the primary provider for this model.'
  });
});
