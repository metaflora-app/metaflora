import test from 'node:test';
import assert from 'node:assert/strict';

import { buildModelCard, getModelById, listCatalogModels } from '../src/model-catalog.js';
import { isNewModel } from '../src/brand-icons.js';
import { cardProfileFor } from '../src/model-profiles.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';

const EXPECTED = Object.freeze([
  Object.freeze({
    id: 'gemini_37_flash',
    name: 'Gemini 3.7 Flash',
    providerModelId: 'google/gemini-3.7-flash',
    contextLength: 1_000_000,
    inputRublesPerMillion: 41,
    outputRublesPerMillion: 207,
    requiredParameters: ['max_tokens', 'temperature', 'tool_choice', 'tools', 'reasoning']
  }),
  Object.freeze({
    id: 'qwen_38_27b',
    name: 'Qwen3.8 27B',
    providerModelId: 'qwen/qwen3.8-27b',
    contextLength: 1_000_000,
    inputRublesPerMillion: 44,
    outputRublesPerMillion: 332,
    requiredParameters: ['max_tokens', 'temperature', 'tool_choice', 'tools', 'reasoning']
  }),
  Object.freeze({
    id: 'hy_mt2_30b_a3b',
    name: 'Hy-MT2-30B-A3B',
    providerModelId: 'tencent/hy-mt2-30b-a3b',
    contextLength: 8_000,
    inputRublesPerMillion: 8,
    outputRublesPerMillion: 32,
    requiredParameters: ['max_tokens', 'temperature', 'response_format', 'stop', 'structured_outputs']
  })
]);

test('August 2026 RouterAI chat additions are visible, routable, priced and fully described', () => {
  const visibleIds = new Set(listCatalogModels().map(({ id }) => id));

  for (const expected of EXPECTED) {
    const model = getModelById(expected.id);
    assert.ok(model, `${expected.id}: missing model`);
    assert.equal(visibleIds.has(expected.id), true, `${expected.id}: hidden from catalog`);
    assert.equal(model.name, expected.name, expected.id);
    assert.equal(model.category, 'llm', expected.id);
    assert.equal(model.provider, 'routerai', expected.id);
    assert.equal(model.providerModelId, expected.providerModelId, expected.id);
    assert.equal(model.contextLength, expected.contextLength, expected.id);
    assert.equal(model.providerPricing?.inputRublesPerMillion, expected.inputRublesPerMillion, expected.id);
    assert.equal(model.providerPricing?.outputRublesPerMillion, expected.outputRublesPerMillion, expected.id);
    assert.equal(isNewModel(expected.id, Date.parse('2026-08-20T12:00:00.000Z')), true, `${expected.id}: NEW badge`);

    for (const parameter of expected.requiredParameters) {
      assert.ok(model.supportedParameters.includes(parameter), `${expected.id}: ${parameter}`);
    }

    const routes = exactProviderRoutesFor(expected.providerModelId);
    assert.equal(routes.length, 1, `${expected.id}: exact RouterAI route`);
    assert.equal(routes[0]?.provider, 'routerai', expected.id);
    assert.equal(routes[0]?.providerModelId, expected.providerModelId, expected.id);
    assert.equal(routes[0]?.protocol, 'chat', expected.id);

    const profile = cardProfileFor(model);
    assert.ok(profile.description.length >= 120, `${expected.id}: substantive card description`);
    assert.match(profile.instruction, /напиши|пришли|вставь|опиши|задай/iu, expected.id);
    assert.match(buildModelCard(model).text, /стоимость:.*метакоинов/iu, expected.id);
  }
});

test('August 2026 RouterAI chat additions do not duplicate public ids', () => {
  const catalog = listCatalogModels();

  for (const expected of EXPECTED) {
    assert.equal(catalog.filter(({ id }) => id === expected.id).length, 1, expected.id);
    assert.equal(
      catalog.filter(({ providerModelId }) => providerModelId === expected.providerModelId).length,
      1,
      expected.providerModelId
    );
  }
});
