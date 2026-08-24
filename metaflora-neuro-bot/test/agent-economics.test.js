import test from 'node:test';
import assert from 'node:assert/strict';

import { getModelById } from '../src/model-catalog.js';
import {
  calculateMetacoinPrice,
  confirmedProviderModelMetacoinRange,
  getMetacoinPriceRange
} from '../src/model-pricing.js';
import {
  calculateAgentRunCost,
  calculateAgentRunPrice
} from '../src/agent-economics.js';

const agent = Object.freeze({
  primaryModel: 'gpt_56_terra',
  fallbackModels: Object.freeze(['kimi_k27_code', 'gemini_31_pro']),
  systemPrompt: 'ты аналитик.',
  riskTier: 'medium'
});

test('agent run price reserves the highest upper bound across primary and fallbacks', () => {
  const expectedModelIds = ['gpt_56_terra', 'kimi_k27_code', 'gemini_31_pro'];
  const expectedCeiling = Math.max(
    confirmedProviderModelMetacoinRange('openai/gpt-5.6-terra').max,
    confirmedProviderModelMetacoinRange('moonshotai/kimi-k2.7-code').max,
    confirmedProviderModelMetacoinRange('google/gemini-3.1-pro-preview').max
  );
  const quote = calculateAgentRunCost(agent);

  assert.equal(quote.metacoins, expectedCeiling);
  assert.equal(quote.ceilingMetacoins, expectedCeiling);
  assert.equal(calculateAgentRunPrice(agent), expectedCeiling);
  assert.deepEqual(Object.keys(quote.byModel), expectedModelIds);
});

test('quote exposes existing model-pricing estimates and immutable upper bounds', () => {
  const quote = calculateAgentRunCost(agent);

  for (const [id, price] of Object.entries(quote.byModel)) {
    const model = getModelById(id);
    assert.equal(
      price.estimateMetacoins,
      confirmedProviderModelMetacoinRange(model.providerModelId).min
    );
    assert.equal(price.ceilingMetacoins, getMetacoinPriceRange(model).max);
    assert.ok(price.ceilingMetacoins >= price.estimateMetacoins);
    assert.equal(Object.isFrozen(price), true);
  }
  assert.equal(Object.isFrozen(quote), true);
  assert.equal(Object.isFrozen(quote.byModel), true);
  assert.equal(Object.isFrozen(quote.fallbackModels), true);
  assert.ok(quote.byModel.kimi_k27_code);
});

test('selected-route quote is never above the reserved run ceiling', () => {
  const fallbackQuote = calculateAgentRunCost(agent, { modelId: 'kimi_k27_code' });
  const fullQuote = calculateAgentRunCost(agent);

  assert.equal(fallbackQuote.selectedModel, 'kimi_k27_code');
  assert.ok(fallbackQuote.selectedMetacoins <= fullQuote.ceilingMetacoins);
  assert.throws(
    () => calculateAgentRunCost(agent, { modelId: 'qwen_3_vl' }),
    /not configured for this agent/i
  );
});
