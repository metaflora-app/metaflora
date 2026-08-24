import test from 'node:test';
import assert from 'node:assert/strict';

import { isNewModel } from '../src/brand-icons.js';
import { buildModelCard, getModelById, listCatalogModels } from '../src/model-catalog.js';
import { cardProfileFor } from '../src/model-profiles.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';
import { getProviderAdapter } from '../src/provider-adapters.js';

const RELEASE_CHECK = Date.parse('2026-08-21T00:00:00.000Z');

test('Ox Alpha exposes its exact live RouterAI preview contract', () => {
  const model = getModelById('ox_alpha');
  assert.ok(model);
  assert.equal(model.name, 'Ox Alpha');
  assert.equal(model.providerModelId, 'stealth/ox-alpha');
  assert.equal(model.contextLength, 1_000_000);
  assert.equal(model.providerPricing?.inputRublesPerMillion, 0);
  assert.equal(model.providerPricing?.outputRublesPerMillion, 0);
  assert.deepEqual(exactProviderRoutesFor('stealth/ox-alpha'), [{
    provider: 'routerai',
    providerModelId: 'stealth/ox-alpha',
    endpoint: 'https://routerai.ru/api/v1/chat/completions',
    protocol: 'chat',
    supportedParameters: model.supportedParameters
  }]);
  assert.equal(isNewModel(model.id, RELEASE_CHECK), true);
  assert.match(buildModelCard(model).text, /<b>.*(?:скрыт|аноним|предпросмотр).*/iu);
});

test('Nemotron 3.5 streaming ASR uses its full live id and transcription endpoint', () => {
  const model = getModelById('nemotron_35_asr_streaming');
  assert.ok(model);
  assert.equal(model.category, 'voice');
  assert.equal(model.providerModelId, 'nvidia/nemotron-3.5-asr-streaming-multilingual-0.6b');
  assert.equal(model.providerPricing?.type, 'audio_minutes');
  assert.equal(model.providerPricing?.minRublesPerMinute, 0.02);
  assert.equal(model.providerPricing?.maxRublesPerMinute, 0.02);
  assert.equal(isNewModel(model.id, RELEASE_CHECK), true);
  assert.deepEqual(exactProviderRoutesFor(model.providerModelId), [{
    provider: 'routerai',
    providerModelId: model.providerModelId,
    endpoint: 'https://routerai.ru/api/v1/audio/transcriptions',
    protocol: 'transcription',
    supportedParameters: model.supportedParameters
  }]);
  assert.deepEqual(cardProfileFor(model).inputs, ['audio']);
  assert.match(buildModelCard(model).text, /<b>.*40 языках.*<\/b>/u);
});

test('Nemotron 3.5 ASR builds bounded multipart audio input and blocks private URLs', async () => {
  const routerai = getProviderAdapter('routerai');
  const route = {
    model: 'nvidia/nemotron-3.5-asr-streaming-multilingual-0.6b',
    runtime: { operation: 'transcription', bodyType: 'multipart', maxInputBytes: 16 }
  };
  const fetchImpl = async () => new Response(new Uint8Array([1, 2, 3]), {
    status: 200,
    headers: { 'content-type': 'audio/mpeg', 'content-length': '3' }
  });
  const body = await routerai.submissionBody(route, {
    input: { audio_urls: ['https://uploads.example.test/sample.mp3'], response_format: 'text' }
  }, { fetchImpl });
  assert.equal(body instanceof FormData, true);
  assert.equal(body.get('model'), route.model);
  assert.equal(body.get('response_format'), 'text');
  assert.equal(body.get('file') instanceof Blob, true);

  await assert.rejects(routerai.submissionBody(route, {
    input: { audio_urls: ['https://[fd00::1]/secret.mp3'] }
  }, { fetchImpl }), /URL is not allowed/u);
});
