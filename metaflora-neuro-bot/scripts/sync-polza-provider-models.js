import { POLZA_PROVIDER_MODELS } from '../src/polza-provider-models.js';
import { POLZA_PUBLIC_MODELS } from '../src/provider-model-snapshot.js';

const key = process.env.POLZA_API_KEY;
if (!key) throw new Error('POLZA_API_KEY is required. Run this script through Railway env.');

const models = [];
for (let page = 1; ; page += 1) {
  const response = await fetch(`https://polza.ai/api/v1/models/catalog?limit=100&page=${page}`, {
    headers: { authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`Polza catalog returned HTTP ${response.status}.`);
  const body = await response.json();
  const batch = body.data ?? [];
  models.push(...batch);
  if (models.length >= (body.meta?.total ?? models.length) || batch.length === 0) break;
}

const availableIds = new Set(models.map(({ id }) => id));
const aliases = Object.entries(POLZA_PROVIDER_MODELS).map(([catalogId, [providerModelId]]) => ({
  catalogId,
  providerModelId,
  confirmed: availableIds.has(providerModelId)
}));
const unresolvedAliases = aliases.filter(({ confirmed }) => !confirmed);
const snapshotIds = new Set(POLZA_PUBLIC_MODELS.map(({ providerModelId }) => providerModelId));
const liveIds = new Set(models.map(({ id }) => id));
const missingFromLive = [...snapshotIds].filter((id) => !liveIds.has(id)).sort();
const missingFromSnapshot = [...liveIds].filter((id) => !snapshotIds.has(id)).sort();

process.stdout.write(`${JSON.stringify({
  provider: 'polza',
  catalogModels: models.length,
  aliases: aliases.length,
  confirmedAliases: aliases.length - unresolvedAliases.length,
  unresolvedAliases,
  snapshotModels: snapshotIds.size,
  missingFromLive,
  missingFromSnapshot
}, null, 2)}\n`);
