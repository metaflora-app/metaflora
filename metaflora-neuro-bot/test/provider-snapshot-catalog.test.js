import test from 'node:test';
import assert from 'node:assert/strict';

import { POLZA_PUBLIC_MODELS } from '../src/provider-model-snapshot.js';
import { isPolzaEmbeddingModel } from '../src/polza-snapshot-filters.js';
import {
  PROVIDER_SNAPSHOT_CATEGORY_MODELS,
  PROVIDER_SNAPSHOT_LLM_MODELS_BY_FAMILY,
  PROVIDER_SNAPSHOT_MODELS_BY_ID
} from '../src/provider-snapshot-catalog.js';
import { ROUTERAI_LIVE_PRICING } from '../src/routerai-live-pricing.js';

test('published Polza inventory is projected into existing public model surfaces', () => {
  const projected = Object.values(PROVIDER_SNAPSHOT_MODELS_BY_ID);
  const expected = POLZA_PUBLIC_MODELS.filter(
    ({ category, providerModelId }) => (
      category !== 'embedding'
        && !isPolzaEmbeddingModel({ category, providerModelId })
        && !/^openai\/gpt-5\.6-sol(?:-pro)?$/u.test(providerModelId)
    )
  );

  assert.equal(projected.length, expected.length);
  assert.equal(new Set(projected.map(({ id }) => id)).size, projected.length);
  assert.equal(new Set(projected.map(({ providerModelId }) => providerModelId)).size, projected.length);
  assert.ok(projected.every(({ id }) => Buffer.byteLength(`model:${id}`) <= 64));
  assert.ok(projected.every(({ provider }) => provider === 'polza'));
  assert.ok(projected.every(({ availability }) => ['available', 'unavailable'].includes(availability)));

  const familyIds = Object.keys(PROVIDER_SNAPSHOT_LLM_MODELS_BY_FAMILY);
  assert.deepEqual(familyIds, [
    'openai', 'anthropic', 'google', 'xai', 'kimi', 'deepseek', 'qwen', 'other', 'search', 'russian'
  ]);
  assert.deepEqual(Object.keys(PROVIDER_SNAPSHOT_CATEGORY_MODELS), [
    'image', 'video', 'audio', 'voice'
  ]);
});

test('every projected public model keeps its exact confirmed provider id', () => {
  const confirmedIds = new Set(POLZA_PUBLIC_MODELS.map(({ providerModelId }) => providerModelId));
  for (const model of Object.values(PROVIDER_SNAPSHOT_MODELS_BY_ID)) {
    assert.ok(confirmedIds.has(model.providerModelId), model.providerModelId);
    if (model.availability === 'available') {
      assert.deepEqual(model.providerModels, [model.providerModelId]);
    } else {
      assert.equal(model.providerModels, undefined);
    }
  }
});

test('Veo snapshots use the current RouterAI per-second contracts, not stale Polza request prices', () => {
  const quality = Object.values(PROVIDER_SNAPSHOT_MODELS_BY_ID)
    .find(({ providerModelId }) => providerModelId === 'google/veo3');
  const fast = Object.values(PROVIDER_SNAPSHOT_MODELS_BY_ID)
    .find(({ providerModelId }) => providerModelId === 'google/veo3_fast');

  for (const [snapshot, routerModelId] of [
    [quality, 'google/veo-3.1'],
    [fast, 'google/veo-3.1-fast']
  ]) {
    assert.equal(snapshot?.providerPricing.type, 'video_seconds');
    assert.equal(snapshot?.providerPricing.provider, 'routerai');
    assert.equal(snapshot?.providerPricing.providerModelId, routerModelId);
    assert.equal(snapshot?.providerPricing.minRublesPerSecond, ROUTERAI_LIVE_PRICING[routerModelId].seconds);
    assert.equal(snapshot?.providerPricing.maxRublesPerSecond, ROUTERAI_LIVE_PRICING[routerModelId].seconds);
  }
});
