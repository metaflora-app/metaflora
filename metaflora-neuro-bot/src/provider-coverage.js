import { listCatalogModels } from './model-catalog.js';
import { TOOL_CATALOG } from './tool-catalog.js';
import { POLZA_PUBLIC_MODELS } from './provider-model-snapshot.js';
import { exactProviderRoutesFor } from './provider-route-matrix.js';

export const ACTIVE_PAID_PROVIDERS = Object.freeze(['routerai', 'polza', 'kie']);

const toolRoutesById = new Map(TOOL_CATALOG.map(({ id, routes = [] }) => [id, routes]));

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function providersFor(model) {
  if (model.source === 'tool') {
    return sortedUnique((toolRoutesById.get(model.id) ?? []).map(({ provider }) => provider));
  }
  if (Array.isArray(model.providerModels) && model.providerModels.length > 0) {
    const routedProviders = sortedUnique(model.providerModels.flatMap((providerModelId) => (
      exactProviderRoutesFor(providerModelId).map(({ provider }) => provider)
    )));
    if (routedProviders.length > 0) return routedProviders;
  }
  if (model.provider) return [model.provider];
  return [];
}

function stateFor(model, providers) {
  if (model.category === 'beta' || model.availability === 'early_access') return 'beta';
  if (model.availability === 'unavailable') return 'unavailable';
  if (providers.some((provider) => ACTIVE_PAID_PROVIDERS.includes(provider))) return 'payable';
  if (providers.length > 0) return 'frozen';
  return 'unrouted';
}

function recordFor(model) {
  const providers = providersFor(model);
  return Object.freeze({
    id: model.id,
    name: model.name,
    category: model.category,
    state: stateFor(model, providers),
    providers: Object.freeze(providers)
  });
}

function catalogRecords() {
  const records = new Map();
  for (const model of listCatalogModels()) records.set(model.id, recordFor(model));
  return [...records.values()].sort(({ id: left }, { id: right }) => left.localeCompare(right));
}

export function coverageForModel(modelId) {
  return catalogRecords().find(({ id }) => id === modelId) ?? null;
}

export function buildProviderCoverageReport() {
  const records = catalogRecords();
  const bucket = (state) => Object.freeze(records.filter((record) => record.state === state));
  const payable = bucket('payable');
  const frozen = bucket('frozen');
  const beta = bucket('beta');
  const unavailable = bucket('unavailable');
  const unrouted = bucket('unrouted');

  return Object.freeze({
    activeProviders: ACTIVE_PAID_PROVIDERS,
    confirmedProviderModels: POLZA_PUBLIC_MODELS,
    payable,
    frozen,
    beta,
    unavailable,
    unrouted,
    unresolved: unrouted,
    summary: Object.freeze({
      total: records.length,
      payable: payable.length,
      frozen: frozen.length,
      beta: beta.length,
      unavailable: unavailable.length,
      unrouted: unrouted.length,
      confirmedProviderModels: POLZA_PUBLIC_MODELS.length
    })
  });
}
