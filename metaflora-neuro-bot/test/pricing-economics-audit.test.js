import test from 'node:test';
import assert from 'node:assert/strict';

import { listAgents } from '../src/agent-catalog.js';
import { calculateAgentRunCost } from '../src/agent-economics.js';
import { resolveAgentModelRoute } from '../src/agent-runtime.js';
import { listCatalogModels } from '../src/model-catalog.js';
import { inputProfileFor } from '../src/model-profiles.js';
import {
  calculateMetacoinPrice,
  getMetacoinPriceRange,
  METACOIN_PRICING_POLICY,
  minimumTariffRublesPerMetacoin,
  providerCostRublesToMetacoins
} from '../src/model-pricing.js';
import { POLZA_PUBLIC_MODELS } from '../src/provider-model-snapshot.js';
import { isPolzaEmbeddingModel } from '../src/polza-snapshot-filters.js';
import {
  confirmedProviderCostRangeRubles,
  confirmedProviderPriceFor,
  isTrustedSnapshotProviderPrice,
  LLM_PRICE_RANGE_PROFILE,
  routeraiImageOutputTokensForSettings
} from '../src/provider-pricing.js';
import { TOOL_CATALOG } from '../src/tool-catalog.js';
import {
  getToolMetacoinPriceRange,
  toolSettingsProfileFor
} from '../src/tool-model-adapter.js';

const EPSILON = 1e-9;
const APPROVED_SEEDANCE_OWNER_MARGIN_PERCENT = 40;
const APPROVED_POLZA_RESERVE_PERCENT = 6;

function settingCombinations(profile, index = 0, current = {}) {
  if (index >= profile.length) return [current];
  const definition = profile[index];
  if (definition.values.length === 0) {
    return settingCombinations(profile, index + 1, {
      ...current,
      [definition.key]: definition.defaultValue
    });
  }
  return definition.values.flatMap(({ value }) => settingCombinations(
    profile,
    index + 1,
    { ...current, [definition.key]: value }
  ));
}

function numeric(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function minimumMarginPercent(metacoins, providerCostRubles) {
  const grossRevenueRubles = metacoins * minimumTariffRublesPerMetacoin();
  const acquiringRubles = grossRevenueRubles * (METACOIN_PRICING_POLICY.paymentFeePercent / 100);
  const polzaReserveRubles = grossRevenueRubles * (METACOIN_PRICING_POLICY.polzaReservePercent / 100);
  const reservedProviderCostRubles = providerCostRubles
    * (1 + (METACOIN_PRICING_POLICY.failoverReservePercent / 100));
  return (
    (grossRevenueRubles - acquiringRubles - polzaReserveRubles - reservedProviderCostRubles)
    / grossRevenueRubles
  ) * 100;
}

function assertMargin(record, metacoins, providerCostRubles) {
  assert.ok(Number.isInteger(metacoins), `${record}: metacoin price is not integer`);
  assert.ok(metacoins >= 0, `${record}: metacoin price is negative`);
  const margin = minimumMarginPercent(metacoins, providerCostRubles);
  assert.ok(
    margin + EPSILON >= METACOIN_PRICING_POLICY.targetGrossMarginPercent,
    `${record}: margin ${margin.toFixed(4)}% is below ${METACOIN_PRICING_POLICY.targetGrossMarginPercent}%`
  );
}

function assertApprovedSeedanceMargin(record, metacoins, providerCostRubles) {
  const grossRevenueRubles = metacoins * minimumTariffRublesPerMetacoin();
  const acquiringRubles = grossRevenueRubles * (METACOIN_PRICING_POLICY.paymentFeePercent / 100);
  const polzaReserveRubles = grossRevenueRubles * (APPROVED_POLZA_RESERVE_PERCENT / 100);
  const ownerMarginPercent = (
    (grossRevenueRubles - acquiringRubles - polzaReserveRubles - providerCostRubles)
    / grossRevenueRubles
  ) * 100;
  assert.ok(
    ownerMarginPercent + EPSILON >= APPROVED_SEEDANCE_OWNER_MARGIN_PERCENT,
    `${record}: owner margin ${ownerMarginPercent.toFixed(4)}% is below ${APPROVED_SEEDANCE_OWNER_MARGIN_PERCENT}%`
  );
}

function confirmedModelCosts(model, providerModelId) {
  const price = confirmedProviderPriceFor(providerModelId);
  assert.ok(price, `${model.id}: missing confirmed cost for ${providerModelId}`);
  const range = confirmedProviderCostRangeRubles(price);
  if (range.kind === 'llm') {
    return [
      {
        label: `${model.id}:${providerModelId}:min`,
        metacoins: getMetacoinPriceRange(model).min,
        providerCostRubles: range.minRubles
      },
      {
        label: `${model.id}:${providerModelId}:max`,
        metacoins: getMetacoinPriceRange(model).max,
        providerCostRubles: range.maxRubles
      }
    ];
  }
  if (range.kind === 'video_seconds') {
    return settingCombinations(inputProfileFor(model)).map((settings) => ({
      label: `${model.id}:${providerModelId}:${JSON.stringify(settings)}`,
      metacoins: calculateMetacoinPrice(model, settings),
      providerCostRubles: (
        [...(price.tierPrices ?? [])]
          .filter(({ conditions }) => Object.entries(conditions).every(([key, value]) => {
            const settingKey = key === 'mode' ? 'resolution' : key === 'sound' ? 'generate_audio' : key;
            return String(settings[settingKey] ?? '') === String(value);
          }))
          .sort((left, right) => Object.keys(right.conditions).length - Object.keys(left.conditions).length)[0]
          ?.costRubles
        ?? range.maxRubles
      ) * numeric(settings.duration, 5)
    }));
  }
  if (range.kind === 'image_output_tokens') {
    return settingCombinations(inputProfileFor(model)).map((settings) => {
      const inputTokens = LLM_PRICE_RANGE_PROFILE.maxInputTokens;
      const outputTokens = LLM_PRICE_RANGE_PROFILE.maxOutputTokens;
      const textCost = (
        (price.inputRublesPerMillion * inputTokens)
        + (price.outputRublesPerMillion * outputTokens)
      ) / 1_000_000;
      const imageCost = price.rublesPerImageOutputToken
        * routeraiImageOutputTokensForSettings(settings, price.providerModelId)
        * numeric(settings.num_images, 1);
      return {
        label: `${model.id}:${providerModelId}:${JSON.stringify(settings)}`,
        metacoins: calculateMetacoinPrice(model, settings),
        providerCostRubles: textCost + imageCost
      };
    });
  }
  if (range.kind === 'image_megapixels') {
    return [
      {
        label: `${model.id}:${providerModelId}:min`,
        metacoins: calculateMetacoinPrice(model, {}, { imageReferences: 0 }),
        providerCostRubles: range.minRubles
      },
      {
        label: `${model.id}:${providerModelId}:max`,
        metacoins: calculateMetacoinPrice(model, {}, {
          imageReferences: price.maxInputReferences
        }),
        providerCostRubles: range.maxRubles
      }
    ];
  }
  if (['request_units', 'audio_minutes', 'character_million', 'token_million'].includes(range.kind)) {
    return [
      {
        label: `${model.id}:${providerModelId}:min`,
        metacoins: getMetacoinPriceRange(model).min,
        providerCostRubles: range.minRubles
      },
      {
        label: `${model.id}:${providerModelId}:max`,
        metacoins: getMetacoinPriceRange(model).max,
        providerCostRubles: range.maxRubles
      }
    ];
  }
  throw new TypeError(`Unsupported provider cost kind: ${range.kind}`);
}

function toolUnitRange(tool) {
  const quantity = tool.settings.num_images;
  if (tool.pricing.unit === 'image' && quantity?.type === 'number') {
    return { min: quantity.min, max: quantity.max };
  }
  const duration = tool.settings.duration_seconds ?? tool.settings.duration;
  if (duration?.type === 'number') return { min: duration.min, max: duration.max };
  if (duration?.type === 'enum') {
    const values = duration.values
      .map((value) => numeric(value, Number.NaN))
      .filter(Number.isFinite);
    if (values.length > 0) return { min: Math.min(...values), max: Math.max(...values) };
  }
  const maximum = tool.input.constraints.durationSeconds?.max;
  if (maximum && ['input_second', 'output_second', 'compute_second'].includes(tool.pricing.unit)) {
    return { min: 1, max: maximum };
  }
  if (maximum && tool.pricing.unit === '5_input_seconds') {
    return { min: 0.2, max: maximum / 5 };
  }
  return { min: 1, max: 1 };
}

function toolAmountRange(tool) {
  if (tool.pricing.type === 'fixed') {
    return { min: tool.pricing.amount, max: tool.pricing.amount };
  }
  if (tool.pricing.type === 'tiered') {
    const amounts = Object.values(tool.pricing.amounts).filter(Number.isFinite);
    return { min: Math.min(...amounts), max: Math.max(...amounts) };
  }
  return { min: tool.pricing.min, max: tool.pricing.max };
}

function providerUsdRangeForTool(tool) {
  const unit = toolUnitRange(tool);
  const amount = toolAmountRange(tool);
  return {
    min: amount.min * unit.min,
    max: amount.max * unit.max
  };
}

test('every paid executable public model route keeps its approved minimum margin', () => {
  const routedModels = listCatalogModels().filter((model) => (
    model.source !== 'tool'
    && Array.isArray(model.providerModels)
    && model.providerModels.some((providerModelId) => !providerModelId.endsWith(':free'))
  ));
  assert.ok(routedModels.length >= 94);

  for (const model of routedModels) {
    for (const providerModelId of model.providerModels.filter((id) => !id.endsWith(':free'))) {
      for (const record of confirmedModelCosts(model, providerModelId)) {
        if (record.providerCostRubles === 0) {
          assert.equal(record.metacoins, 0, `${record.label}: zero provider tariff must stay free`);
          continue;
        }
        if (model.id === 'seedance_20' || model.id === 'seedance_25') {
          assertApprovedSeedanceMargin(record.label, record.metacoins, record.providerCostRubles);
        } else {
          assertMargin(record.label, record.metacoins, record.providerCostRubles);
        }
      }
    }
  }
});

test('only safe Polza snapshot prices become billable automatically and keep 40 percent owner margin', () => {
  const pricedModels = POLZA_PUBLIC_MODELS.filter(({ available, pricing }) => (
    available && isTrustedSnapshotProviderPrice(pricing)
  ));

  for (const { providerModelId } of pricedModels) {
    const price = confirmedProviderPriceFor(providerModelId);
    assert.ok(price, `${providerModelId}: snapshot pricing is not confirmed`);
    const range = confirmedProviderCostRangeRubles(price);
    if (range.minRubles === 0 && range.maxRubles === 0) {
      assert.equal(providerCostRublesToMetacoins(0), 0, `${providerModelId}: free route stays free`);
      continue;
    }
    assertMargin(
      `${providerModelId}:snapshot:min`,
      providerCostRublesToMetacoins(range.minRubles),
      range.minRubles
    );
    assertMargin(
      `${providerModelId}:snapshot:max`,
      providerCostRublesToMetacoins(range.maxRubles),
      range.maxRubles
    );
  }
});

test('the currency-only Fish transcription card is not billable or public', () => {
  assert.equal(confirmedProviderPriceFor('fish-audio/transcribe-1'), null);
  assert.equal(listCatalogModels().some(({ providerModelId }) => providerModelId === 'fish-audio/transcribe-1'), false);
});

test('all active AI tools have verified routes, confirmed USD units and 40 percent owner margin', () => {
  const activeTools = TOOL_CATALOG.filter(({ active }) => active);
  assert.equal(activeTools.length, 42);

  for (const tool of activeTools) {
    assert.ok(tool.routes.length > 0, `${tool.id}: missing executable route`);
    assert.ok(tool.routes.every(({ endpoint, verified }) => verified === true && endpoint), `${tool.id}: unverified route`);
    assert.equal(tool.pricing.currency, 'USD', `${tool.id}: pricing must use confirmed USD provider units`);
    assert.ok(toolSettingsProfileFor(tool).length >= 0, `${tool.id}: settings profile is unavailable`);

    const costUsd = providerUsdRangeForTool(tool);
    const price = getToolMetacoinPriceRange(tool);
    assertMargin(`${tool.id}:min`, price.min, costUsd.min * METACOIN_PRICING_POLICY.usdRubRate);
    assertMargin(`${tool.id}:max`, price.max, costUsd.max * METACOIN_PRICING_POLICY.usdRubRate);
  }
});

test('all 50 AI agents reserve only confirmed executable routes and keep 40 percent owner margin', () => {
  const agents = listAgents();
  assert.equal(agents.length, 50);

  for (const agent of agents) {
    const route = resolveAgentModelRoute(agent);
    const quote = calculateAgentRunCost(agent);
    assert.ok(Object.keys(quote.byModel).length > 0, `${agent.id}: no priceable model route`);

    for (const candidate of route.routeCandidates) {
      if (candidate.providerModelId === null) {
        assert.equal(quote.byModel[candidate.modelId], undefined, `${agent.id}: null route has a price`);
        continue;
      }
      const price = confirmedProviderPriceFor(candidate.providerModelId);
      assert.ok(price, `${agent.id}: missing confirmed agent route cost for ${candidate.providerModelId}`);
      const range = confirmedProviderCostRangeRubles(price);
      assert.equal(range.kind, 'llm', `${agent.id}: agent route must be an LLM price`);
      const billed = quote.byModel[candidate.modelId];
      assert.ok(billed, `${agent.id}: confirmed route is absent from quote`);
      assertMargin(`${agent.id}:${candidate.modelId}`, billed.ceilingMetacoins, range.maxRubles);
    }
  }
});
