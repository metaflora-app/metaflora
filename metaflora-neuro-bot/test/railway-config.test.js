import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Railway config does not pin deployments to the retired drams3a region', async () => {
  const config = JSON.parse(await readFile(new URL('../railway.json', import.meta.url), 'utf8'));
  const regions = Object.keys(config?.deploy?.multiRegionConfig ?? {});

  assert.equal(regions.includes('europe-west4-drams3a'), false);
});
