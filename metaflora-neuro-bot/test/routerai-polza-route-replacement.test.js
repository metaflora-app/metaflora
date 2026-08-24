import assert from 'node:assert/strict';
import test from 'node:test';

import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';

test('legacy Polza LLM identifiers that exist unchanged in RouterAI are RouterAI-only routes', () => {
  for (const providerModelId of [
    'openai/gpt-3.5-turbo',
    'anthropic/claude-opus-4.5',
    'google/gemini-2.5-flash-lite',
    'meta-llama/llama-3.3-70b-instruct',
    'qwen/qwen3-235b-a22b',
    'yandex/aliceai-llm'
  ]) {
    const routes = exactProviderRoutesFor(providerModelId);
    assert.deepEqual(routes.map(({ provider }) => provider), ['routerai'], providerModelId);
    assert.equal(routes[0].providerModelId, providerModelId);
    assert.equal(routes[0].protocol, 'chat');
  }
});

test('Polza-only models stay on Polza, including every Suno route', () => {
  for (const providerModelId of [
    'suno/v4.5',
    'suno/v4.5-plus',
    'suno/v5'
  ]) {
    const routes = exactProviderRoutesFor(providerModelId);
    if (routes.length === 0) continue;
    assert.deepEqual(routes.map(({ provider }) => provider), ['polza'], providerModelId);
  }
});
