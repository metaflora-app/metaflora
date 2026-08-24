import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production runtime never falls back from T-Bank checkout to YooKassa', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  const httpSource = await readFile(new URL('../src/http-server.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /createPaymentService/u);
  assert.doesNotMatch(source, /tbankPaymentService\s*\?\?\s*yookassaPaymentService/u);
  assert.match(source, /const paymentService = tbankPaymentService;/u);
  assert.doesNotMatch(source, /createYooKassaClient/u);
  assert.doesNotMatch(source, /config\.yookassaPayouts/u);
  assert.doesNotMatch(source, /yookassa_payouts/u);
  assert.doesNotMatch(httpSource, /yookassa\.ru|YooKassa|ЮKassa/u);
  assert.doesNotMatch(httpSource, /\/webhooks\/yookassa/u);
});

test('bot names the ruble checkout after the active acquiring rail', async () => {
  const source = await readFile(new URL('../src/bot.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /startYooKassaCheckout/u);
  assert.match(source, /startTBankCheckout/u);
});
