import assert from 'node:assert/strict';
import test from 'node:test';

import { loadConfig } from '../src/config.js';
import { createMediaModelExecutor, getMediaFallbackStatus } from '../src/media-model-executor.js';
import { getProviderAdapter } from '../src/provider-adapters.js';
import { exactProviderRoutesFor, normalizeProvider } from '../src/provider-route-matrix.js';
import { buildProviderPlan, checkProviderHealth } from '../src/provider-router.js';

const GPTUNNEL_CREATE_ENDPOINT = 'https://gptunnel.ru/api/v2/media/tasks';
const GPTUNNEL_STATUS_ENDPOINT = 'https://gptunnel.ru/api/v2/media/tasks/{requestId}';

test('GPTunnel key is read only from its dedicated environment variable', () => {
  const config = loadConfig({
    METAFLORA_ENV_FILE: '/definitely/missing',
    GPTUNNEL_API_KEY: 'test-gptunnel-key',
    KIE_API_KEY: 'legacy-test-key'
  });

  assert.equal(config.providerKeys.gptunnel, 'test-gptunnel-key');
  assert.equal(config.providerKeys.kie, 'legacy-test-key');
});

test('GPTunnel remains a historical adapter without active media routes', () => {
  assert.equal(normalizeProvider(' GPTunneL '), 'gptunnel');
  assert.equal(normalizeProvider('gptunnel.ai'), 'gptunnel');

  assert.deepEqual(exactProviderRoutesFor('seedance-2.5'), []);
  assert.deepEqual(exactProviderRoutesFor('flux-3'), []);
});

test('confirmed LLM route replaces its old Polza route with RouterAI', () => {
  const routes = exactProviderRoutesFor('openai/gpt-5.6-terra');

  assert.deepEqual(routes.map(({ provider }) => provider), ['routerai']);
  assert.deepEqual(routes[0], {
    provider: 'routerai',
    providerModelId: 'openai/gpt-5.6-terra',
    endpoint: 'https://routerai.ru/api/v1/chat/completions',
    protocol: 'chat',
    supportedParameters: [
      'reasoning',
      'include_reasoning',
      'seed',
      'max_tokens',
      'response_format',
      'structured_outputs',
      'tools',
      'tool_choice',
      'reasoning_effort'
    ]
  });
});

test('Seedance 2 media uses RouterAI first instead of KIE', () => {
  const routes = exactProviderRoutesFor('bytedance/seedance-2');

  assert.deepEqual(routes.map(({ provider }) => provider), ['routerai']);
  assert.equal(routes.some(({ provider }) => provider === 'kie'), false);
  assert.equal(routes[0].providerModelId, 'bytedance/seedance-2.0');

  const fallback = getMediaFallbackStatus({
    id: 'seedance_20',
    provider: 'polza',
    providerModelId: 'bytedance/seedance-2',
    category: 'video'
  });
  assert.equal(fallback.provider, 'routerai');
  assert.equal(fallback.status, 'compatible');
  assert.equal(fallback.model, 'bytedance/seedance-2.0');
});

test('default provider planning and health checks use RouterAI as the fallback', async () => {
  assert.deepEqual(buildProviderPlan('image'), ['polza', 'routerai']);
  assert.deepEqual(buildProviderPlan('video'), ['polza', 'routerai']);

  const requests = [];
  const health = await checkProviderHealth({
    polza: 'test-polza-key',
    routerai: 'test-routerai-key',
    kie: 'legacy-test-key'
  }, async (url) => {
    requests.push(url);
    return new Response('{}', { status: 200 });
  });

  assert.deepEqual(health, { polza: 'healthy', routerai: 'healthy' });
  assert.equal(requests.some((url) => url.includes('api.kie.ai')), false);
  assert.equal(requests.some((url) => url === 'https://routerai.ru/api/v1/models'), true);
});

test('GPTunnel adapter serializes the CreativeLab v2 task contract', () => {
  const adapter = getProviderAdapter('gptunnel');
  const route = {
    endpoint: GPTUNNEL_CREATE_ENDPOINT,
    model: 'flux-3'
  };
  const body = adapter.submissionBody(route, {
    input: {
      prompt: 'editorial portrait',
      aspect_ratio: '4:3',
      image_urls: ['https://uploads.example.test/reference.jpg']
    }
  });

  assert.equal(adapter.submissionUrl(route), GPTUNNEL_CREATE_ENDPOINT);
  assert.deepEqual(body, {
    model: 'flux-3',
    prompt: 'editorial portrait',
    params: { aspect_ratio: '4:3' },
    inputs: { image: ['https://uploads.example.test/reference.jpg'] }
  });
  assert.deepEqual(adapter.parseSubmission({
    code: 0,
    id: '6a61e021a6e77553a989c41d',
    status: 'queued',
    result: []
  }), {
    requestId: '6a61e021a6e77553a989c41d',
    state: 'pending'
  });
  assert.deepEqual(adapter.parseStatus({
    code: 0,
    id: '6a61e021a6e77553a989c41d',
    status: 'done',
    result: [{ url: 'https://media.example.test/flux.webp' }]
  }), {
    state: 'succeeded',
    output: [{ url: 'https://media.example.test/flux.webp' }]
  });
  assert.throws(() => adapter.submissionBody(route, {
    input: {
      prompt: 'unsafe reference',
      image_urls: ['http://127.0.0.1/internal.jpg']
    }
  }), /URL.*not allowed/i);
});

for (const model of [
  { id: 'seedance_25', providerModelId: 'bytedance/seedance-2.5', category: 'video' },
  { id: 'flux_3', providerModelId: 'black-forest-labs/flux-3-video', category: 'video' }
]) {
  test(`${model.id} is a RouterAI-only media runtime route`, async () => {
    let capturedConfig;
    const execute = createMediaModelExecutor({
      providerKeys: { routerai: 'test-routerai-key' },
      invoke: async (_request, { config }) => {
        capturedConfig = config;
        return { provider: 'routerai' };
      }
    });

    await execute({
      model: { ...model, provider: 'routerai' },
      telegramInput: { text: 'cinematic scene' }
    });

    assert.deepEqual(capturedConfig.providers, {
      polza: { apiKey: '' },
      routerai: { apiKey: 'test-routerai-key' }
    });
    assert.deepEqual(capturedConfig.routes.model.map(({ provider }) => provider), ['routerai']);
    assert.equal(capturedConfig.routes.model[0].endpoint, 'https://routerai.ru/api/v1/videos');
    assert.equal(capturedConfig.routes.model[0].statusEndpoint, 'https://routerai.ru/api/v1/videos/{requestId}');
    assert.equal(capturedConfig.routes.model[0].model, model.providerModelId);
  });
}
