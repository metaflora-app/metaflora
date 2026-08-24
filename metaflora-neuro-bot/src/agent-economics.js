import { getModelById } from './model-catalog.js';
import {
  calculateMetacoinPrice,
  confirmedProviderModelMetacoinRange,
  getMetacoinPriceRange
} from './model-pricing.js';
import { resolveAgentModelRoute } from './agent-runtime.js';

function modelPrice(modelId, providerModelId) {
  if (providerModelId !== null && providerModelId !== undefined) {
    const range = confirmedProviderModelMetacoinRange(providerModelId);
    if (!range) return null;
    return Object.freeze({
      estimateMetacoins: range.min,
      ceilingMetacoins: range.max
    });
  }
  if (providerModelId === null) return null;

  const model = getModelById(modelId);
  return Object.freeze({
    estimateMetacoins: calculateMetacoinPrice(model),
    ceilingMetacoins: getMetacoinPriceRange(model).max
  });
}

function selectedModelId(route, requestedModelId) {
  const modelId = requestedModelId ?? route.primaryModel;
  if (!route.routeCandidates.some((candidate) => candidate.modelId === modelId)) {
    throw new RangeError('Selected model is not configured for this agent.');
  }
  return modelId;
}

export function calculateAgentRunCost(agent, { modelId } = {}) {
  const route = resolveAgentModelRoute(agent);
  const byModel = Object.freeze(Object.fromEntries(
    route.routeCandidates
      .map(({ modelId: candidateModelId, providerModelId }) => [
        candidateModelId,
        modelPrice(candidateModelId, providerModelId)
      ])
      .filter(([, price]) => price !== null)
  ));
  const ceilingMetacoins = Math.max(
    ...Object.values(byModel).map((price) => price.ceilingMetacoins)
  );
  const selectedModel = selectedModelId(route, modelId);

  return Object.freeze({
    primaryModel: route.primaryModel,
    fallbackModels: route.fallbackModels,
    selectedModel,
    selectedMetacoins: byModel[selectedModel]?.ceilingMetacoins ?? ceilingMetacoins,
    byModel,
    metacoins: ceilingMetacoins,
    ceilingMetacoins
  });
}

export function calculateAgentRunPrice(agent) {
  return calculateAgentRunCost(agent).ceilingMetacoins;
}
