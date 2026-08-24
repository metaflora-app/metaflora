import test from 'node:test';
import assert from 'node:assert/strict';

import { buildModelCard, getModelById, listCatalogModels } from '../src/model-catalog.js';
import { isNewModel } from '../src/brand-icons.js';
import { cardProfileFor } from '../src/model-profiles.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';

const CHECKED_AT = Date.parse('2026-08-21T00:00:00.000Z');

const expected = Object.freeze({
  gpt_56_sol: {
    name: 'GPT-5.6 Sol',
    providerModelId: 'openai/gpt-5.6-sol',
    input: 271,
    output: 1625,
    contextLength: 1_000_000,
    inputs: ['text', 'image'],
    parameters: ['max_tokens', 'seed', 'response_format', 'structured_outputs', 'tool_choice', 'tools', 'reasoning', 'include_reasoning'],
    isNew: false
  },
  gpt_56_sol_pro: {
    name: 'GPT-5.6 Sol Pro',
    providerModelId: 'openai/gpt-5.6-sol-pro',
    input: 284,
    output: 1707,
    contextLength: 1_000_000,
    inputs: ['text', 'image'],
    parameters: ['max_tokens', 'seed', 'response_format', 'structured_outputs', 'tool_choice', 'tools', 'reasoning', 'include_reasoning'],
    isNew: false
  },
  hy_mt2_18b: {
    name: 'Hy-MT2-1.8B',
    providerModelId: 'tencent/hy-mt2-1.8b',
    input: 4.77,
    output: 19,
    contextLength: 8_000,
    inputs: ['text'],
    parameters: ['max_tokens', 'temperature', 'stop'],
    isNew: true
  }
});

for (const [id, contract] of Object.entries(expected)) {
  test(`${contract.name} exposes its exact RouterAI card and paid route`, () => {
    const model = getModelById(id);
    assert.ok(model);
    assert.equal(model.name, contract.name);
    assert.equal(model.providerModelId, contract.providerModelId);
    assert.equal(model.contextLength, contract.contextLength);
    assert.equal(model.providerPricing.inputRublesPerMillion, contract.input);
    assert.equal(model.providerPricing.outputRublesPerMillion, contract.output);
    assert.deepEqual(model.supportedParameters, contract.parameters);
    assert.deepEqual(cardProfileFor(model).inputs, contract.inputs);
    assert.equal(isNewModel(id, CHECKED_AT), contract.isNew);
    assert.match(buildModelCard(model, CHECKED_AT).text, /^<b>[^<]+<\/b>/u);
    assert.equal(listCatalogModels().filter(({ id: candidate }) => candidate === id).length, 1);
    assert.deepEqual(exactProviderRoutesFor(contract.providerModelId), [{
      provider: 'routerai',
      providerModelId: contract.providerModelId,
      endpoint: 'https://routerai.ru/api/v1/chat/completions',
      protocol: 'chat',
      supportedParameters: contract.parameters
    }]);
  });
}

test('GPT-5.4 Image 2 already has an exact live route and is not duplicated', () => {
  const model = getModelById('gpt_image_2');
  assert.ok(model.providerModels.includes('openai/gpt-5.4-image-2'));
  assert.ok(exactProviderRoutesFor('openai/gpt-5.4-image-2')
    .some(({ provider, providerModelId, endpoint }) => (
      provider === 'routerai'
      && providerModelId === 'openai/gpt-5.4-image-2'
      && endpoint === 'https://routerai.ru/api/v1/images'
    )));
  assert.equal(listCatalogModels().filter(({ id }) => id === 'gpt_image_2').length, 1);
});
