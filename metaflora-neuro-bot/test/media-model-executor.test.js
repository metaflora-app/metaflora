import test from 'node:test';
import assert from 'node:assert/strict';

import { createMediaModelExecutor } from '../src/media-model-executor.js';
import { getModelById, listCatalogModels } from '../src/model-catalog.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

const polling = Object.freeze({
  pollIntervalMs: 0,
  maxPollAttempts: 2,
  requestTimeoutMs: 100,
  requestRetries: 0,
  retryDelayMs: 0
});

test('specialist provider media cards remain addressable while routing migrates', () => {
  for (const id of [
    'polza_openai_gpt_4o_transcribe_0x5etzz',
    'polza_suno_generate_1xai46g'
  ]) assert.ok(getModelById(id), id);
});

test('every public media model has at least one executable provider route', () => {
  const media = listCatalogModels().filter(({ source, category }) => (
    source !== 'tool' && ['image', 'video', 'audio', 'voice'].includes(category)
  ));
  assert.ok(media.length >= 40);
  for (const model of media) {
    const providerIds = [model.providerModelId, ...(model.providerModels ?? [])].filter(Boolean);
    assert.ok(providerIds.some((providerModelId) => exactProviderRoutesFor(providerModelId).length > 0), model.id);
  }
});

test('RouterAI image generation uses the synchronous images contract', async () => {
  const calls = [];
  const executor = createMediaModelExecutor({
    telegram: null,
    providerKeys: { routerai: 'routerai-secret' },
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options });
      return jsonResponse({
        id: 'image-1',
        data: [{ b64_json: 'aGVsbG8=' }],
        usage: { cost: 7.25 }
      });
    }
  });

  const result = await executor({
    model: getModelById('flux_2_max'),
    settings: { aspect_ratio: '16:9', output_format: 'png', n: '1', seed: '42' },
    telegramInput: { text: 'нарисуй северное сияние' }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://routerai.ru/api/v1/images');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    model: 'black-forest-labs/flux.2-max',
    prompt: 'нарисуй северное сияние',
    aspect_ratio: '16:9',
    output_format: 'png',
    n: 1,
    seed: 42
  });
  assert.equal(result.provider, 'routerai');
  assert.equal(result.type, 'image');
  assert.equal(result.providerCostRubles, 7.25);
  assert.deepEqual([...new Uint8Array(result.data)], [104, 101, 108, 108, 111]);
});

test('RouterAI Gemini image generation uses chat image contract and parses its data URL', async () => {
  const calls = [];
  const executor = createMediaModelExecutor({
    telegram: null,
    providerKeys: { routerai: 'routerai-secret' },
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options });
      return jsonResponse({
        id: 'chat-image-1',
        choices: [{
          message: {
            content: 'готово',
            images: [{
              type: 'image_url',
              image_url: { url: 'data:image/png;base64,aGVsbG8=' }
            }]
          }
        }]
      });
    }
  });

  const result = await executor({
    model: getModelById('nano_banana_2'),
    settings: { aspect_ratio: '16:9', resolution: '2K' },
    telegramInput: { text: 'нарисуй северное сияние' }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://routerai.ru/api/v1/chat/completions');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    model: 'google/gemini-3.1-flash-image',
    messages: [{ role: 'user', content: 'нарисуй северное сияние' }],
    modalities: ['image', 'text'],
    image_config: { aspect_ratio: '16:9', image_size: '2K' }
  });
  assert.equal(result.provider, 'routerai');
  assert.equal(result.type, 'image');
  assert.deepEqual([...new Uint8Array(result.data)], [104, 101, 108, 108, 111]);
});

test('RouterAI speech uses the synchronous speech contract without polling', async () => {
  const calls = [];
  const executor = createMediaModelExecutor({
    telegram: null,
    providerKeys: { routerai: 'routerai-secret' },
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options });
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'content-type': 'audio/mpeg' }
      });
    }
  });

  const result = await executor({
    model: getModelById('mai_voice_2'),
    settings: { voice: 'alloy', response_format: 'mp3' },
    telegramInput: { text: 'короткая проверка озвучки' }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://routerai.ru/api/v1/audio/speech');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    model: 'microsoft/mai-voice-2',
    input: 'короткая проверка озвучки',
    voice: 'alloy',
    response_format: 'mp3'
  });
  assert.equal(result.provider, 'routerai');
  assert.equal(result.type, 'audio');
});

test('existing Lyria cards use RouterAI streaming chat audio and assemble MP3 chunks', async () => {
  for (const [id, providerModelId] of [
    ['polza_google_lyria_3_clip_preview_067fyr0', 'google/lyria-3-clip-preview'],
    ['polza_google_lyria_3_pro_preview_190ii7b', 'google/lyria-3-pro-preview']
  ]) {
    const calls = [];
    const executor = createMediaModelExecutor({
      telegram: null,
      providerKeys: { routerai: 'routerai-secret', polza: 'polza-secret' },
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, options });
        return new Response([
          'data: {"id":"lyria-stream","choices":[{"delta":{"audio":{"data":"AQ"}}}]}',
          '',
          'data: {"choices":[{"delta":{"audio":{"data":"ID"}}}]}',
          '',
          'data: [DONE]',
          ''
        ].join('\n'), { status: 200, headers: { 'content-type': 'text/event-stream' } });
      }
    });

    const result = await executor({
      model: getModelById(id),
      settings: {},
      telegramInput: { text: 'спокойный эмбиент без вокала' }
    });

    assert.equal(calls.length, 1, id);
    assert.equal(calls[0].url, 'https://routerai.ru/api/v1/chat/completions', id);
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      model: providerModelId,
      messages: [{ role: 'user', content: 'спокойный эмбиент без вокала' }],
      audio: { format: 'mp3' },
      stream: true
    }, id);
    assert.equal(result.provider, 'routerai', id);
    assert.equal(result.type, 'audio', id);
    assert.equal(result.mimeType, 'audio/mpeg', id);
    assert.deepEqual([...new Uint8Array(result.data)], [1, 2, 3], id);
  }
});

test('accepted malformed Lyria SSE is never duplicated to Polza', async () => {
  const calls = [];
  const executor = createMediaModelExecutor({
    telegram: null,
    providerKeys: { routerai: 'routerai-secret', polza: 'polza-secret' },
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options });
      return new Response('data: {"choices":[{"delta":{"audio":{"data":"not base64"}}}]}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' }
      });
    }
  });

  await assert.rejects(
    executor({
      model: getModelById('polza_google_lyria_3_clip_preview_067fyr0'),
      settings: {},
      telegramInput: { text: 'проверка' }
    }),
    (error) => error.acceptedJob === true && error.code === 'provider_invalid_response'
  );
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /routerai\.ru/u);
});

test('existing Polza transcription card is executed through RouterAI transcription API first', async () => {
  const calls = [];
  const executor = createMediaModelExecutor({
    telegram: {
      getFile: async () => ({ file_path: 'voice.ogg' }),
      downloadFile: async () => ({
        data: new Uint8Array([1, 2, 3]),
        mimeType: 'audio/ogg',
        fileName: 'voice.ogg'
      })
    },
    upload: async () => 'https://media.example/voice.ogg',
    providerKeys: { routerai: 'routerai-secret', polza: 'polza-secret' },
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (String(url).startsWith('https://media.example/')) {
        return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'audio/ogg' } });
      }
      return jsonResponse({ text: 'готово' });
    }
  });

  const result = await executor({
    model: getModelById('polza_openai_whisper_1_11ajggw'),
    settings: { response_format: 'json' },
    telegramInput: { voice: { file_id: 'voice-file' } }
  });

  const providerCall = calls.find(({ url }) => url.includes('routerai.ru'));
  assert.equal(providerCall.url, 'https://routerai.ru/api/v1/audio/transcriptions');
  assert.equal(result.provider, 'routerai');
  assert.equal(result.type, 'text');
  assert.equal(result.text, 'готово');
});

test('Seedance 2 and migrated public aliases route to RouterAI without a duplicate Polza submission', async () => {
  const routerAiOnlyAliases = [
    ['seedance_20', 'bytedance/seedance-2.0'],
    ['seedance_20_fast', 'bytedance/seedance-2.0-fast'],
    ['seedance_20_mini', 'bytedance/seedance-2.0-mini']
  ];
  const migratedAliases = [
    ['polza_bytedance_seedream_4_5_0y4bpwh', 'bytedance-seed/seedream-4.5'],
    ['polza_google_veo3_0n9pka0', 'google/veo-3.1'],
    ['polza_google_veo3_fast_0js3z3z', 'google/veo-3.1-fast'],
    ['polza_kling_v3_0r3wzac', 'kwaivgi/kling-v3.0-std'],
    ['polza_wan_2_6_0jepobw', 'alibaba/wan-2.6']
  ];
  for (const [id, routerAiId] of routerAiOnlyAliases) {
    const executor = createMediaModelExecutor({
      telegram: {},
      providerKeys: { routerai: 'routerai-secret', polza: 'polza-secret' },
      invoke: async (_request, { config }) => config.routes.model
    });
    const routes = await executor({
      model: getModelById(id),
      settings: {},
      telegramInput: { text: 'проверка' }
    });
    assert.deepEqual(routes.map(({ provider, providerModelId }) => ({ provider, providerModelId })), [
      { provider: 'routerai', providerModelId: routerAiId }
    ], id);
  }
  for (const [id, routerAiId] of migratedAliases) {
    const executor = createMediaModelExecutor({
      telegram: {},
      providerKeys: { routerai: 'routerai-secret', polza: 'polza-secret' },
      invoke: async (_request, { config }) => config.routes.model
    });
    const model = getModelById(id);
    assert.ok(model, id);
    const routes = await executor({ model, settings: {}, telegramInput: { text: 'проверка' } });
    assert.deepEqual(routes.map(({ provider, providerModelId }) => ({ provider, providerModelId })), [
      { provider: 'routerai', providerModelId: routerAiId }
    ], id);
  }
});

test('an accepted RouterAI media job is never duplicated to Polza', async () => {
  const submissions = [];
  const executor = createMediaModelExecutor({
    telegram: {},
    providerKeys: { routerai: 'routerai-secret', polza: 'polza-secret' },
    runtime: polling,
    fetchImpl: async (url, options = {}) => {
      if (options.method === 'POST') {
        submissions.push(url);
        return jsonResponse({ id: 'accepted-job', status: 'processing' });
      }
      return jsonResponse({ id: 'accepted-job', status: 'processing' });
    }
  });

  await assert.rejects(() => executor({
    model: getModelById('seedance_20'),
    settings: { duration: '5', resolution: '720p' },
    telegramInput: { text: 'сделай ролик' }
  }), /accepted|timed out|pending|processing/i);
  assert.deepEqual(submissions, ['https://routerai.ru/api/v1/videos']);
});
