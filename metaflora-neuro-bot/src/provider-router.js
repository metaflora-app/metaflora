import { exactProviderRoutesFor } from './provider-route-matrix.js';

export const ACTIVE_PROVIDER_IDS = Object.freeze(['polza', 'routerai']);

const healthEndpoints = Object.freeze({
  polza: {
    url: 'https://polza.ai/api/v1/models/catalog?limit=1&page=1',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  },
  routerai: {
    url: 'https://routerai.ru/api/v1/models',
    headers: (key) => ({ Authorization: `Bearer ${key}` })
  }
});

export function buildProviderPlan(kind, providerModelId) {
  if (!['llm', 'image', 'video', 'audio', 'speech'].includes(kind)) return [];
  if (providerModelId === undefined) return [...ACTIVE_PROVIDER_IDS];
  return exactProviderRoutesFor(providerModelId).map(({ provider }) => provider);
}

export async function checkProviderHealth(keys, fetchImpl = fetch) {
  const checks = Object.entries(healthEndpoints)
    .filter(([provider]) => Boolean(keys[provider]))
    .map(async ([provider, endpoint]) => {
      try {
        const response = await fetchImpl(endpoint.url, {
          headers: endpoint.headers(keys[provider]),
          signal: AbortSignal.timeout(8_000),
          audit: {
            operation: `provider_health.${provider}`
          }
        });
        return [provider, response.ok ? 'healthy' : 'unhealthy'];
      } catch {
        return [provider, 'unhealthy'];
      }
    });

  return Object.fromEntries(await Promise.all(checks));
}
