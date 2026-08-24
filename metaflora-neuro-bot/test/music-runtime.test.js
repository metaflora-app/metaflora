import assert from 'node:assert/strict';
import test from 'node:test';

import { createMusicRuntime } from '../src/music-runtime.js';

test('runtime отправляет проверенный FAL payload и нормализует трек', async () => {
  const calls = [];
  const runtime = createMusicRuntime({
    falKey: 'test-key',
    subscribe: async (endpoint, options) => {
      calls.push({ endpoint, options });
      return { data: { audio: { url: 'https://media.example.test/song.mp3', content_type: 'audio/mpeg' } } };
    }
  });
  const result = await runtime.execute({
    operation: 'generate_song',
    inputs: {
      contractId: 'fal_elevenlabs_music',
      prompt: 'bright pop',
      durationSeconds: 60,
      instrumental: false
    },
    idempotencyKey: 'music:10:1',
    markExternalStarted() {}
  });
  assert.equal(calls[0].endpoint, 'fal-ai/elevenlabs/music');
  assert.deepEqual(calls[0].options.input, {
    prompt: 'bright pop',
    music_length_ms: 60000,
    force_instrumental: false
  });
  assert.equal(result.tracks[0].url, 'https://media.example.test/song.mp3');
  assert.equal(runtime.supports('generate_song'), true);
});

test('runtime закрывает неизвестные, неактивные и неподключённые маршруты', async () => {
  const runtime = createMusicRuntime({ falKey: '', subscribe: async () => ({}) });
  assert.equal(runtime.supports('generate_song'), false);
  await assert.rejects(() => runtime.execute({
    operation: 'generate_song',
    inputs: { contractId: 'kie_suno_generate_v5', prompt: 'test' },
    markExternalStarted() {}
  }), /неактивен|ключ/u);
});

test('runtime запускает и опрашивает подтверждённый Replicate reference-to-song маршрут', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') return new Response(JSON.stringify({
      id: 'prediction-1', status: 'starting', urls: { get: 'https://api.replicate.com/v1/predictions/prediction-1' }
    }), { status: 201, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({
      id: 'prediction-1', status: 'succeeded', output: 'https://replicate.delivery/song.wav'
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const runtime = createMusicRuntime({ replicateToken: 'replicate-key', fetchImpl });
  const result = await runtime.execute({
    operation: 'generate_song',
    inputs: {
      contractId: 'replicate_minimax_music_01',
      lyrics: '[verse]\nhello',
      referenceAudioUrl: 'https://files.example.test/reference.wav'
    },
    markExternalStarted() {}
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers.Authorization, 'Token replicate-key');
  assert.equal(result.tracks[0].url, 'https://replicate.delivery/song.wav');
});

test('runtime отправляет основной музыкальный сценарий в Suno через Polza', async () => {
  const calls = [];
  const runtime = createMusicRuntime({
    polzaKey: 'polza-key',
    invoke: async (request, options) => {
      calls.push({ request, options });
      await options.onAttempt();
      return { url: 'https://media.example.test/suno.mp3', mimeType: 'audio/mpeg' };
    }
  });
  let externalStarts = 0;
  const result = await runtime.execute({
    operation: 'generate_song',
    inputs: {
      contractId: 'polza_suno_generate',
      prompt: 'bright pop',
      instrumental: false
    },
    markExternalStarted() { externalStarts += 1; }
  });
  assert.equal(calls[0].request.routeId, 'music');
  assert.deepEqual(calls[0].request.input, { prompt: 'bright pop', instrumental: false });
  assert.equal(calls[0].options.config.routes.music[0].provider, 'polza');
  assert.equal(calls[0].options.config.routes.music[0].model, 'suno/generate');
  assert.equal(calls[0].options.config.providers.polza.apiKey, 'polza-key');
  assert.equal(externalStarts, 1);
  assert.equal(result.tracks[0].url, 'https://media.example.test/suno.mp3');
});
