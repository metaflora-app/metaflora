import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProviderPlan, checkProviderHealth } from '../src/provider-router.js';
import { createProviderAuditedFetch } from '../src/api-audit.js';

test('routing keeps only Polza as primary and RouterAI as the approved fallback', () => {
  assert.deepEqual(buildProviderPlan('llm'), ['polza', 'routerai']);
  assert.deepEqual(buildProviderPlan('image'), ['polza', 'routerai']);
  assert.deepEqual(buildProviderPlan('video'), ['polza', 'routerai']);
  assert.deepEqual(buildProviderPlan('audio'), ['polza', 'routerai']);
  assert.deepEqual(buildProviderPlan('speech'), ['polza', 'routerai']);
  assert.deepEqual(buildProviderPlan('unknown'), []);
});

test('RouterAI-first routing is exact per model and never substitutes an unsupported provider model', () => {
  assert.deepEqual(buildProviderPlan('video', 'bytedance/seedance-2'), ['routerai']);
  assert.deepEqual(buildProviderPlan('video', 'minimax-h3/text-to-video'), ['routerai']);
  assert.deepEqual(buildProviderPlan('video', 'minimax-h3/image-to-video'), ['routerai']);
  assert.deepEqual(buildProviderPlan('video', 'minimax-h3/reference-to-video'), ['routerai']);
  assert.deepEqual(buildProviderPlan('llm', 'openai/gpt-5.6-terra'), ['routerai']);
  assert.deepEqual(buildProviderPlan('video', 'unknown/lookalike-model'), []);
});

test('health checks call read-only endpoints and never include a key in the result', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return new Response('{}', { status: 200 });
  };

  const health = await checkProviderHealth({
    polza: 'polza-secret',
    routerai: 'routerai-secret'
  }, fetchImpl);

  assert.deepEqual(health, {
    polza: 'healthy',
    routerai: 'healthy'
  });
  assert.equal(requests.length, 2);
  assert.ok(requests.every(({ url }) => !url.includes('secret')));
  assert.doesNotMatch(JSON.stringify(health), /secret/);
});

test('health checks skip missing keys and isolate provider failures', async () => {
  const health = await checkProviderHealth(
    { polza: 'polza-secret', kie: '' },
    async () => { throw new Error('network failure'); }
  );

  assert.deepEqual(health, { polza: 'unhealthy' });
});

test('health check failures are auditable without storing provider keys', async () => {
  const started = [];
  const completed = [];
  const auditedFetch = createProviderAuditedFetch({
    repository: {
      async startProviderApiCall(value) {
        started.push(value);
        return 'health-call-id';
      },
      async completeProviderApiCall(value) {
        completed.push(value);
      }
    },
    fetchImpl: async () => new Response(JSON.stringify({
      error: { message: 'invalid api key' }
    }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    })
  });

  const health = await checkProviderHealth({ polza: 'polza-secret' }, auditedFetch);

  assert.deepEqual(health, { polza: 'unhealthy' });
  assert.equal(started.length, 1);
  assert.equal(started[0].provider, 'polza');
  assert.equal(started[0].operation, 'provider_health.polza');
  assert.equal(JSON.stringify(started[0]).includes('polza-secret'), false);
  assert.equal(completed[0].httpStatus, 401);
  assert.equal(completed[0].errorCode, 'provider_auth_failed');
});
