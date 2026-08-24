import test from 'node:test';
import assert from 'node:assert/strict';

import { brandAssets, brandForModel } from '../src/brand-icons.js';
import { buildModelCard, getModelById, listCatalogModels } from '../src/model-catalog.js';
import { cardProfileFor } from '../src/model-profiles.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';

const ROUTERAI_CHAT_ENDPOINT = 'https://routerai.ru/api/v1/chat/completions';
const REASONING_AND_TOOLS = [
  'max_tokens',
  'temperature',
  'reasoning_effort',
  'tool_choice',
  'tools'
];

const expectedModels = Object.freeze([
  Object.freeze({
    id: 'grok_46',
    name: 'SpaceXAI: Grok 4.6',
    providerModelId: 'x-ai/grok-4.6',
    contextLength: 500_000,
    inputRublesPerMillion: 228.75,
    outputRublesPerMillion: 686.25,
    brand: 'grok',
    logo: 'grok.svg'
  }),
  Object.freeze({
    id: 'deepseek_v4_pro_0813',
    name: 'DeepSeek: DeepSeek V4 Pro 0813',
    providerModelId: 'deepseek/deepseek-v4-pro-0813',
    contextLength: 1_048_576,
    inputRublesPerMillion: 49.75,
    outputRublesPerMillion: 99.51,
    brand: 'deepseek',
    logo: 'deepseek-color.svg'
  })
]);

test('new RouterAI LLM cards expose exact ids, prices, context and branded copy', () => {
  const visibleIds = new Set(listCatalogModels().map(({ id }) => id));

  for (const expected of expectedModels) {
    const model = getModelById(expected.id);
    assert.ok(model, expected.id);
    assert.equal(visibleIds.has(expected.id), true, expected.id);
    assert.equal(model.name, expected.name, expected.id);
    assert.equal(model.category, 'llm', expected.id);
    assert.equal(model.provider, 'routerai', expected.id);
    assert.equal(model.providerModelId, expected.providerModelId, expected.id);
    assert.deepEqual(model.providerModels, [expected.providerModelId], expected.id);
    assert.equal(model.availability, 'available', expected.id);
    assert.equal(model.contextLength, expected.contextLength, expected.id);
    assert.deepEqual(model.supportedParameters, REASONING_AND_TOOLS, expected.id);
    assert.equal(model.providerPricing?.type, 'llm_tokens', expected.id);
    assert.equal(
      model.providerPricing?.inputRublesPerMillion,
      expected.inputRublesPerMillion,
      expected.id
    );
    assert.equal(
      model.providerPricing?.outputRublesPerMillion,
      expected.outputRublesPerMillion,
      expected.id
    );
    assert.equal(model.providerPricing?.provider, 'routerai', expected.id);
    assert.equal(model.providerPricing?.providerModelId, expected.providerModelId, expected.id);
    assert.equal(brandForModel(model), expected.brand, expected.id);
    assert.equal(brandAssets[expected.brand], expected.logo, expected.id);

    const profile = cardProfileFor(model);
    assert.ok(profile.description.length >= 40, `${expected.id} needs useful card copy`);
    assert.match(profile.instruction, /напиши|пришли|опиши|задай/iu, expected.id);
    assert.match(buildModelCard(model).text, /стоимость:.*метакоинов/iu, expected.id);

    assert.deepEqual(exactProviderRoutesFor(expected.providerModelId), [{
      provider: 'routerai',
      providerModelId: expected.providerModelId,
      endpoint: ROUTERAI_CHAT_ENDPOINT,
      protocol: 'chat',
      supportedParameters: REASONING_AND_TOOLS
    }], expected.id);
  }
});

test('new RouterAI LLM ids and provider model ids are globally unique', () => {
  const catalog = listCatalogModels();

  for (const expected of expectedModels) {
    assert.equal(
      catalog.filter(({ id }) => id === expected.id).length,
      1,
      `${expected.id} is duplicated`
    );
    assert.equal(
      catalog.filter(({ providerModelId }) => providerModelId === expected.providerModelId).length,
      1,
      `${expected.providerModelId} is duplicated`
    );
  }
});

test('Nemotron 3.5 Lightning card uses its current RouterAI contract', () => {
  const model = getModelById('nemotron_35_lightning');

  assert.equal(model?.providerModelId, 'nvidia/nemotron-3.5-lightning');
  assert.equal(model?.contextLength, 1_000_000);
  assert.deepEqual(model?.supportedParameters, REASONING_AND_TOOLS);
  assert.equal(brandForModel(model), 'nvidia');
  assert.equal(brandAssets.nvidia, 'nvidia-color.svg');
  assert.match(buildModelCard(model).text, /1[\s\u00a0]?000[\s\u00a0]?000|1 млн/iu);
});

test('Sakana Namazu uses a clean brand asset and retired Fugu stays hidden', () => {
  const namazu = getModelById('sakana_namazu');
  const fugu = getModelById('fugu_ultra');

  assert.equal(brandForModel(namazu), 'sakana');
  assert.equal(fugu, null);
  assert.equal(brandAssets.sakana, 'local:sakana-symbol.png');
  assert.equal(brandAssets.fugu, 'local:fugu-ultra.png');
  assert.notEqual(brandAssets.sakana, brandAssets.fugu);
});
