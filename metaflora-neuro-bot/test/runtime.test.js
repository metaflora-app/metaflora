import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('container repairs ownership for every persistent database file before startup', () => {
  const entrypoint = readFileSync(new URL('../docker-entrypoint.sh', import.meta.url), 'utf8');

  assert.match(entrypoint, /chown\s+-R\s+node:node\s+\/data/);
  assert.ok(entrypoint.indexOf('exec flock') < entrypoint.indexOf('chown -R node:node /data'));
});
