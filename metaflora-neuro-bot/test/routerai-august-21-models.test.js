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

test('FLUX Video Upscale is a formatted, selectable RouterAI video card', () => {
  const model = getModelById('flux_video_upscale');
  assert.ok(model);
  assert.equal(model.category, 'video');
  assert.equal(model.providerModelId, 'black-forest-labs/flux-video-upscale');
  assert.deepEqual(model.supportedParameters, ['input_references', 'generate_audio', 'safety_tolerance']);
  assert.equal(model.providerPricing?.type, 'video_seconds');
  assert.equal(model.providerPricing?.minRublesPerSecond, 0);
  assert.equal(model.providerPricing?.maxRublesPerSecond, 0);
  assert.equal(isNewModel(model.id, RELEASE_CHECK), true);

  const profile = cardProfileFor(model);
  assert.deepEqual(profile.inputs, ['text', 'video']);
  assert.ok(profile.description.length >= 150);
  assert.match(buildModelCard(model).text, /<b>.*1,5–3 раза.*<\/b>/u);
  assert.equal(listCatalogModels().filter(({ id }) => id === model.id).length, 1);

  assert.deepEqual(exactProviderRoutesFor(model.providerModelId), [{
    provider: 'routerai',
    providerModelId: model.providerModelId,
    endpoint: 'https://routerai.ru/api/v1/videos',
    statusEndpoint: 'https://routerai.ru/api/v1/videos/{requestId}',
    supportedParameters: model.supportedParameters
  }]);
});

test('FLUX Video Upscale forwards the source video as a typed RouterAI reference', async () => {
  const routerai = getProviderAdapter('routerai');
  assert.deepEqual(await routerai.submissionBody({
    provider: 'routerai',
    model: 'black-forest-labs/flux-video-upscale',
    runtime: { operation: 'video' }
  }, {
    input: {
      prompt: 'сохрани детали лица и текст в кадре',
      video_urls: ['https://uploads.example.test/source.mp4'],
      generate_audio: false,
      safety_tolerance: 4
    }
  }), {
    model: 'black-forest-labs/flux-video-upscale',
    prompt: 'сохрани детали лица и текст в кадре',
    generate_audio: false,
    safety_tolerance: 4,
    input_references: [{
      type: 'video_url',
      video_url: { url: 'https://uploads.example.test/source.mp4' }
    }]
  });
});

test('FLUX Video Upscale rejects missing, ambiguous and private source inputs', async () => {
  const routerai = getProviderAdapter('routerai');
  const route = {
    provider: 'routerai',
    model: 'black-forest-labs/flux-video-upscale',
    runtime: { operation: 'video' }
  };
  await assert.rejects(routerai.submissionBody(route, { input: {} }), /exactly one source video/u);
  await assert.rejects(routerai.submissionBody(route, {
    input: { video_urls: ['https://uploads.example.test/a.mp4', 'https://uploads.example.test/b.mp4'] }
  }), /exactly one source video/u);
  await assert.rejects(routerai.submissionBody(route, {
    input: { video_urls: ['https://127.0.0.1/private.mp4'] }
  }), /URL is not allowed/u);
  await assert.rejects(routerai.submissionBody(route, {
    input: {
      video_urls: ['https://uploads.example.test/a.mp4'],
      image_urls: ['https://uploads.example.test/a.png']
    }
  }), /exactly one source video/u);
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
