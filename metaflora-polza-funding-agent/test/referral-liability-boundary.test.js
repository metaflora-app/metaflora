import assert from 'node:assert/strict';
import test from 'node:test';

import { createServer } from '../src/http.js';

test('provider funding agent cannot consume referral payout liabilities', async (context) => {
  let providerCharges = 0;
  const config = {
    novncTarget: 'http://127.0.0.1:9',
    adminUser: 'admin',
    adminPassword: 'strong-password',
    apiToken: 'funding-secret-token'
  };
  const server = createServer({
    config,
    browser: {},
    mcp: {},
    providers: {
      polza: {
        browser: {
          async charge() { providerCharges += 1; return { transactionId: 'must-not-run' }; }
        }
      }
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const origin = `http://127.0.0.1:${server.address().port}`;
  const paths = [
    '/api/internal/referral-payouts/claim',
    '/api/internal/referral-payouts/submit',
    '/api/internal/provider-funding/referral-payout'
  ];
  for (const path of paths) {
    const response = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer funding-secret-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amountKopecks: 100_000, liability: 'referral' })
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { success: false, error: 'not_found' });
  }
  assert.equal(providerCharges, 0);
});

