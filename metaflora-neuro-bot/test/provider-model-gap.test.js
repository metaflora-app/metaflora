import test from 'node:test';
import assert from 'node:assert/strict';

import { getModelById, listCatalogModels } from '../src/model-catalog.js';
import { POLZA_PROVIDER_MODELS } from '../src/polza-provider-models.js';
import { PROVIDER_SNAPSHOT_MODELS_BY_ID } from '../src/provider-snapshot-catalog.js';
import { ROUTERAI_LIVE_PRICING } from '../src/routerai-live-pricing.js';

const newlyConfirmedPolzaModels = Object.freeze([
  Object.freeze({
    id: 'deepseek_v4_flash_0731',
    providerModelId: 'deepseek/deepseek-v4-flash-0731',
    inputRublesPerMillion: 15.917748,
    outputRublesPerMillion: 31.835496,
    contextLength: 262144,
    maxCompletionTokens: 131072,
    supportsReasoning: true,
    supportsTools: true
  }),
  Object.freeze({
    id: 'qwen_38_max',
    providerModelId: 'qwen/qwen3.8-max',
    inputRublesPerMillion: 227.3964,
    outputRublesPerMillion: 682.1892,
    contextLength: 1000000,
    maxCompletionTokens: 131072,
    supportsReasoning: true,
    supportsTools: true
  })
]);

test('migrated RouterAI gap models keep their stable aliases and live prices', () => {
  const catalogIds = new Set(listCatalogModels().map(({ id }) => id));

  for (const expected of newlyConfirmedPolzaModels) {
    assert.deepEqual(POLZA_PROVIDER_MODELS[expected.id], [expected.providerModelId]);
    const model = getModelById(expected.id);
    assert.ok(model, expected.id);
    assert.equal(model.availability, 'available', expected.id);
    assert.deepEqual(model.providerModels, [expected.providerModelId]);
    assert.ok(catalogIds.has(expected.id), expected.id);
    const livePrice = ROUTERAI_LIVE_PRICING[expected.providerModelId];
    assert.ok(livePrice, `RouterAI:${expected.providerModelId}`);
    assert.equal(model.provider, 'routerai');
    assert.equal(model.providerPricing.provider, 'routerai');
    assert.equal(model.providerPricing.inputRublesPerMillion, livePrice.prompt * 1_000_000);
    assert.equal(model.providerPricing.outputRublesPerMillion, livePrice.completion * 1_000_000);
    assert.equal(model.contextLength, expected.contextLength);
    assert.equal(model.maxCompletionTokens, expected.maxCompletionTokens);

    const snapshot = PROVIDER_SNAPSHOT_MODELS_BY_ID[expected.id];
    assert.ok(snapshot, `snapshot:${expected.id}`);
    assert.equal(snapshot.providerModelId, expected.providerModelId);
    assert.equal(snapshot.category, 'llm');
    assert.ok(snapshot.supportedParameters.includes('reasoning'), expected.id);
    assert.ok(snapshot.supportedParameters.includes('tools'), expected.id);
  }
});

test('newly confirmed Polza aliases do not collide with an existing provider id', () => {
  const providerIds = Object.values(POLZA_PROVIDER_MODELS).flat();
  assert.equal(new Set(newlyConfirmedPolzaModels.map(({ id }) => id)).size, newlyConfirmedPolzaModels.length);
  for (const { providerModelId } of newlyConfirmedPolzaModels) {
    assert.equal(providerIds.filter((id) => id === providerModelId).length, 1, providerModelId);
  }
});
