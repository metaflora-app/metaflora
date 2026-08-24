import test from 'node:test';
import assert from 'node:assert/strict';

import {
  exactProviderRoutesFor,
  normalizeProvider,
  normalizeProviderModelId
} from '../src/provider-route-matrix.js';

test('provider route inputs normalize provider aliases and provider model ids', () => {
  assert.equal(normalizeProvider(' Polza.AI '), 'polza');
  assert.equal(normalizeProvider('KIE AI'), 'kie');
  assert.equal(normalizeProvider('kie_ai'), 'kie');
  assert.equal(normalizeProvider(' Router AI '), 'routerai');
  assert.equal(normalizeProvider('unknown-provider'), null);
  assert.equal(
    normalizeProviderModelId('  openai/gpt-5.6-terra  '),
    'openai/gpt-5.6-terra'
  );
  assert.equal(normalizeProviderModelId('model with spaces'), null);
});

test('confirmed LLM routes replace Polza with RouterAI', () => {
  const routes = exactProviderRoutesFor(' openai/gpt-5.6-terra ');

  assert.deepEqual(routes.map(({ provider, providerModelId }) => ({
    provider,
    providerModelId
  })), [{ provider: 'routerai', providerModelId: 'openai/gpt-5.6-terra' }]);
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

test('live exact RouterAI equivalents replace Polza routes', () => {
  const routes = exactProviderRoutesFor('deepseek/deepseek-v4-pro');
  assert.equal(routes[0].provider, 'routerai');
  assert.equal(routes[0].providerModelId, 'deepseek/deepseek-v4-pro');
  assert.deepEqual(routes[0].supportedParameters, [
    'reasoning',
    'include_reasoning',
    'max_tokens',
    'temperature',
    'tools',
    'tool_choice',
    'top_p',
    'top_k',
    'stop',
    'frequency_penalty',
    'presence_penalty',
    'seed'
  ]);
  assert.deepEqual(routes[0], {
    provider: 'routerai',
    providerModelId: 'deepseek/deepseek-v4-pro',
    endpoint: 'https://routerai.ru/api/v1/chat/completions',
    protocol: 'chat',
    supportedParameters: routes[0].supportedParameters
  });
});

test('expanded routes preserve exact RouterAI ids and make RouterAI primary', () => {
  const confirmed = new Map([
    ['openai/gpt-4o-mini', 'gpt-4o-mini'],
    ['anthropic/claude-opus-4.8', 'claude-4.8-opus'],
    ['google/gemini-2.5-pro', 'gemini-2.5-pro'],
    ['x-ai/grok-4.20', 'grok-4.20'],
    ['moonshotai/kimi-k2.7-code', 'kimi-k2.7-code'],
    ['qwen/qwen3.7-max', 'qwen3.7-max'],
    ['minimax/minimax-m3', 'minimax-m3'],
    ['z-ai/glm-5.2', 'glm-5.2'],
    ['mistralai/mistral-large-2512', 'mistral-large-2512'],
    ['meta-llama/llama-4-maverick', 'llama4-maverick']
  ]);

  for (const [polzaId] of confirmed) {
    assert.deepEqual(
      exactProviderRoutesFor(polzaId).map(({ provider, providerModelId }) => ({ provider, providerModelId })),
      [{ provider: 'routerai', providerModelId: polzaId }]
    );
  }
});

test('verified renamed models replace Polza routes with RouterAI aliases', () => {
  const routes = exactProviderRoutesFor('yandex/yandexgpt-5.1-pro');
  assert.deepEqual(
    routes.map(({ provider, providerModelId }) => ({
      provider,
      providerModelId
    })),
    [{ provider: 'routerai', providerModelId: 'yandex/gpt-pro-5.1' }]
  );
  assert.deepEqual(routes[0].supportedParameters, ['max_tokens']);
});

test('Polza exclusives never receive an invented RouterAI route', () => {
  for (const providerModelId of [
    'ai21/jamba-large-1.7',
    'kling/v3-motion-control',
    'gemini-omni-video',
    'topaz/image-upscale',
    'topaz/video-upscale',
    'tongyi-mai/z-image',
    'suno/generate'
  ]) {
    assert.deepEqual(
      exactProviderRoutesFor(providerModelId).map(({ provider }) => provider),
      ['polza'],
      providerModelId
    );
  }
});

test('RouterAI-only video routes use official ids and endpoints', () => {
  assert.deepEqual(exactProviderRoutesFor('bytedance/seedance-2.5'), [{
    provider: 'routerai',
    providerModelId: 'bytedance/seedance-2.5',
    endpoint: 'https://routerai.ru/api/v1/videos',
    statusEndpoint: 'https://routerai.ru/api/v1/videos/{requestId}'
  }]);
  assert.deepEqual(exactProviderRoutesFor('black-forest-labs/flux-3-video'), [{
    provider: 'routerai',
    providerModelId: 'black-forest-labs/flux-3-video',
    endpoint: 'https://routerai.ru/api/v1/videos',
    statusEndpoint: 'https://routerai.ru/api/v1/videos/{requestId}'
  }]);
  assert.deepEqual(exactProviderRoutesFor('flux-3'), []);
});

test('Lyria 3 uses the official RouterAI streaming chat-audio contract', () => {
  for (const providerModelId of [
    'google/lyria-3-clip-preview',
    'google/lyria-3-pro-preview'
  ]) {
    assert.deepEqual(exactProviderRoutesFor(providerModelId), [{
      provider: 'routerai',
      providerModelId,
      endpoint: 'https://routerai.ru/api/v1/chat/completions',
      protocol: 'chat_audio',
      supportedParameters: ['max_tokens', 'temperature', 'top_p', 'seed', 'response_format']
    }]);
  }
});

test('existing Polza media cards use exact live RouterAI media ids without changing card ids', () => {
  const expected = new Map([
    ['black-forest-labs/flux.2-flex', ['black-forest-labs/flux.2-flex', '/images', 'image']],
    ['black-forest-labs/flux.2-pro', ['black-forest-labs/flux.2-pro', '/images', 'image']],
    ['google/gemini-2.5-flash-image', ['google/gemini-2.5-flash-image', '/chat/completions', 'chat_image']],
    ['google/gemini-3.1-flash-image-preview', ['google/gemini-3.1-flash-image-preview', '/chat/completions', 'chat_image']],
    ['alibaba/happyhorse-1.0', ['alibaba/happyhorse-1.0', '/videos', undefined]],
    ['alibaba/happyhorse-1.1', ['alibaba/happyhorse-1.1', '/videos', undefined]],
    ['deepgram/aura-2', ['deepgram/aura-2', '/audio/speech', 'speech']],
    ['fish-audio/s1', ['fish-audio/s1', '/audio/speech', 'speech']],
    ['fish-audio/s2-pro', ['fish-audio/s2-pro', '/audio/speech', 'speech']],
    ['google/chirp-3', ['google/chirp-3', '/audio/transcriptions', 'transcription']],
    ['openai/gpt-4o-mini-transcribe', ['openai/gpt-4o-mini-transcribe', '/audio/transcriptions', 'transcription']],
    ['openai/whisper-1', ['openai/whisper-1', '/audio/transcriptions', 'transcription']],
    ['qwen/qwen3-asr-flash-2026-02-10', ['qwen/qwen3-asr-flash-2026-02-10', '/audio/transcriptions', 'transcription']]
  ]);

  for (const [oldProviderId, [routerAiId, suffix, protocol]] of expected) {
    const [route] = exactProviderRoutesFor(oldProviderId);
    assert.equal(route.provider, 'routerai', oldProviderId);
    assert.equal(route.providerModelId, routerAiId, oldProviderId);
    assert.ok(route.endpoint.endsWith(suffix), oldProviderId);
    assert.equal(route.protocol, protocol, oldProviderId);
  }
});
