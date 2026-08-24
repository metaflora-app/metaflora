import test from 'node:test';
import assert from 'node:assert/strict';

import { getModelById } from '../src/model-catalog.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';
import { getProviderAdapter } from '../src/provider-adapters.js';

const expectedRestorations = Object.freeze([
  Object.freeze({
    cardId: 'polza_mancer_weaver_1ssc57c',
    legacyProviderModelId: 'mancer/weaver',
    routerAiProviderModelId: 'mancer/weaver',
    endpoint: 'https://routerai.ru/api/v1/chat/completions'
  }),
  Object.freeze({
    cardId: 'minimax_h3',
    legacyProviderModelId: 'minimax-h3/text-to-video',
    routerAiProviderModelId: 'minimax/hailuo-3',
    endpoint: 'https://routerai.ru/api/v1/videos'
  }),
  Object.freeze({
    cardId: 'polza_x_ai_grok_imagine_image_1e8vbmb',
    legacyProviderModelId: 'x-ai/grok-imagine-image',
    routerAiProviderModelId: 'x-ai/grok-imagine-image-quality',
    endpoint: 'https://routerai.ru/api/v1/images'
  })
]);

test('verified removed cards are restored on their current RouterAI contracts', () => {
  for (const expected of expectedRestorations) {
    assert.ok(getModelById(expected.cardId), `${expected.cardId} card must be restored`);
    const [route] = exactProviderRoutesFor(expected.legacyProviderModelId);
    assert.equal(route?.provider, 'routerai', expected.legacyProviderModelId);
    assert.equal(route?.providerModelId, expected.routerAiProviderModelId, expected.legacyProviderModelId);
    assert.equal(route?.endpoint, expected.endpoint, expected.legacyProviderModelId);
  }
});

test('restored MiniMax H3 uses the RouterAI multimodal video payload', async () => {
  const adapter = getProviderAdapter('routerai');
  const body = await adapter.submissionBody({
    provider: 'routerai',
    model: 'minimax/hailuo-3',
    endpoint: 'https://routerai.ru/api/v1/videos'
  }, {
    input: {
      prompt: 'герой идёт по городу',
      duration: 7,
      resolution: '2K',
      aspect_ratio: '16:9',
      generate_audio: true,
      _constructorMode: 'references',
      image_urls: ['https://media.example/hero.png'],
      video_urls: ['https://media.example/motion.mp4'],
      audio_urls: ['https://media.example/voice.wav']
    }
  });

  assert.deepEqual(body, {
    model: 'minimax/hailuo-3',
    prompt: 'герой идёт по городу',
    duration: 7,
    resolution: '2K',
    aspect_ratio: '16:9',
    generate_audio: true,
    input_references: [
      { type: 'image_url', image_url: { url: 'https://media.example/hero.png' } },
      { type: 'video_url', video_url: { url: 'https://media.example/motion.mp4' } },
      { type: 'audio_url', audio_url: { url: 'https://media.example/voice.wav' } }
    ]
  });
});
