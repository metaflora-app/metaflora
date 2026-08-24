import test from 'node:test';
import assert from 'node:assert/strict';

import { listAgents } from '../src/agent-catalog.js';
import { getModelById, listCatalogModels } from '../src/model-catalog.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';

const retiredModelIds = Object.freeze([
  'polza_bytedance_seedream_1p1gj11',
  'polza_bytedance_seedream_4_0flct3o',
  'polza_kling_v2_5_turbo_17zcvnf',
  'polza_kling_v2_6_0fxm8wn',
  'polza_wan_2_5_0k8ohet',
  'polza_openai_tts_1_19bzocj',
  'polza_openai_tts_1_hd_1dyowdi'
]);

test('retired superseded cards are absent while selected RouterAI additions stay public', () => {
  for (const id of retiredModelIds) assert.equal(getModelById(id), null, id);
  for (const id of [
    'kling_video_o1',
    'veo_31_lite',
    'wan_27',
    'qwen_image_3',
    'qwen_image_3_pro',
    'fish_audio_s21_pro',
    'mai_voice_2'
  ]) assert.equal(getModelById(id)?.availability, 'available', id);
});

test('all active agent model choices resolve to RouterAI as their first paid route', () => {
  const catalog = new Map(listCatalogModels().map((model) => [model.id, model]));
  for (const agent of listAgents()) {
    for (const modelId of [agent.modelId, ...(agent.fallbackModelIds ?? [])].filter(Boolean)) {
      const model = catalog.get(modelId);
      assert.ok(model, `${agent.id}:${modelId}`);
      const providerModelId = model.providerModelId ?? model.providerModels?.[0];
      const first = exactProviderRoutesFor(providerModelId)[0];
      assert.equal(first?.provider, 'routerai', `${agent.id}:${modelId}:${providerModelId}`);
    }
  }
});
