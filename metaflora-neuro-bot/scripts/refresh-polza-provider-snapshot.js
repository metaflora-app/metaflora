import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const key = process.env.POLZA_API_KEY;
if (!key) throw new Error('POLZA_API_KEY is required. Run this script through Railway env.');

const catalog = [];
for (let page = 1; ; page += 1) {
  const response = await fetch(`https://polza.ai/api/v1/models/catalog?limit=100&page=${page}`, {
    headers: { authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`Polza catalog returned HTTP ${response.status}.`);
  const body = await response.json();
  const batch = body.data ?? [];
  catalog.push(...batch);
  if (catalog.length >= (body.meta?.total ?? catalog.length) || batch.length === 0) break;
}

async function mapWithConcurrency(items, worker, concurrency = 8) {
  const results = new Array(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }));
  return results;
}

async function hydrateModel(entry) {
  const response = await fetch(`https://polza.ai/api/v1/models/${entry.id}`, {
    headers: { authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) return entry;
  const detail = await response.json();
  return { ...entry, ...detail };
}

const hydratedCatalog = await mapWithConcurrency(catalog, hydrateModel);

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'metaflora-polza-'));
const inputPath = path.join(directory, 'catalog.json');
try {
  fs.writeFileSync(inputPath, JSON.stringify(hydratedCatalog));
  execFileSync(process.execPath, [
    'scripts/build-provider-model-snapshot.js',
    inputPath
  ], { cwd: process.cwd(), stdio: 'inherit' });
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
