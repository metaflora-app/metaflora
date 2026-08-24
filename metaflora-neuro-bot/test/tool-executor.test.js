import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createToolExecutor,
  toolUsageFromInputs
} from '../src/tool-executor.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

test('downloads Telegram files, uploads them without exposing the bot token, and invokes media runtime', async () => {
  const calls = [];
  const telegram = {
    async getFile(fileId, options) {
      calls.push(['getFile', fileId, options]);
      return { fileId, filePath: 'photos/input.jpg', fileSize: 4 };
    },
    async downloadFile(file, options) {
      calls.push(['downloadFile', file, options]);
      return {
        data: Buffer.from('test'),
        mimeType: 'image/jpeg',
        size: 4,
        fileName: 'input.jpg'
      };
    }
  };
  const upload = async (blob, options) => {
    calls.push(['upload', blob.type, blob.size, options]);
    return 'https://fal.media/files/safe-input.jpg';
  };
  const invoke = async (request, runtime) => {
    calls.push(['invoke', request, runtime]);
    return {
      type: 'image',
      url: 'https://fal.media/files/result.jpg',
      mimeType: 'image/jpeg',
      provider: 'fal',
      requestId: 'req-1'
    };
  };

  const execute = createToolExecutor({
    telegram,
    providerKeys: { fal: 'secret-fal-key' },
    upload,
    invoke
  });
  const result = await execute({
    toolId: 'photo_restore',
    telegramInput: { photo: [{ file_id: 'small' }, { file_id: 'large' }] },
    settings: {}
  });

  assert.equal(result.url, 'https://fal.media/files/result.jpg');
  const invokeCall = calls.find(([name]) => name === 'invoke');
  assert.equal(invokeCall[1].routeId, 'photo_restore');
  assert.equal(invokeCall[1].input.image_url, 'https://fal.media/files/safe-input.jpg');
  assert.equal(invokeCall[2].config.providers.fal.apiKey, 'secret-fal-key');
  assert.equal(JSON.stringify(calls).includes('bot'), false);
});

test('passes text-only tools without storage uploads', async () => {
  let uploaded = false;
  const execute = createToolExecutor({
    telegram: {},
    providerKeys: { fal: 'key' },
    upload: async () => {
      uploaded = true;
      throw new Error('must not upload');
    },
    invoke: async (request) => ({
      type: 'text',
      text: request.input.text,
      mimeType: 'text/plain',
      provider: 'fal',
      requestId: 'req-text'
    })
  });

  const result = await execute({
    toolId: 'audio_tts',
    telegramInput: { text: 'озвучь этот текст' },
    settings: {}
  });

  assert.equal(result.text, 'озвучь этот текст');
  assert.equal(uploaded, false);
});

test('calculates pricing usage from normalized tool inputs', () => {
  assert.deepEqual(toolUsageFromInputs({
    text: 'привет',
    images: ['one', 'two'],
    durationSeconds: 12
  }), {
    characters: 6,
    images: 2,
    durationSeconds: 12
  });
});

test('keeps generation audit context on every provider tunnel attempt', async () => {
  const contexts = [];
  const fetchImpl = Object.assign(async () => new Response('{}'), {
    withAuditContext(context) {
      contexts.push(context);
      return async () => new Response('{}');
    }
  });
  const execute = createToolExecutor({
    telegram: {},
    providerKeys: { fal: 'key' },
    fetchImpl,
    invoke: async (_request, runtime) => {
      assert.notEqual(runtime.fetchImpl, fetchImpl);
      return { type: 'text', text: 'ok', provider: 'fal', requestId: 'request-1' };
    }
  });

  await execute({
    toolId: 'audio_tts',
    telegramInput: { text: 'проверка' },
    settings: {},
    auditContext: { generationId: 'generation-1', requestKey: 'request-1' }
  });
  assert.deepEqual(contexts, [{ generationId: 'generation-1', requestKey: 'request-1' }]);
});

test('does not invent a RouterAI audio-isolation fallback after ElevenLabs and FAL fail', async () => {
  const attempts = [];
  const submissions = [];
  const execute = createToolExecutor({
    telegram: {},
    providerKeys: {
      fal: 'fal-secret',
      elevenlabs: 'eleven-secret',
      routerai: 'routerai-secret'
    },
    onAttempt: async ({ route }) => attempts.push(route.provider),
    fetchImpl: async (url, options = {}) => {
      if (options.method === 'POST') submissions.push(url);
      if (url === 'https://api.elevenlabs.io/v1/audio-isolation') {
        return jsonResponse({ error: 'temporary outage' }, 503);
      }
      if (url === 'https://queue.fal.run/fal-ai/elevenlabs/audio-isolation') {
        return jsonResponse({ error: 'temporary outage' }, 503);
      }
      return jsonResponse({ error: 'unexpected route' }, 500);
    }
  });

  await assert.rejects(() => execute({
    toolId: 'audio_isolation',
    telegramInput: {
      media: { type: 'audio', value: 'https://input.example.test/voice.mp3' }
    },
    settings: {}
  }), /rejected|unavailable/i);

  assert.deepEqual(attempts, ['elevenlabs', 'fal']);
  assert.deepEqual(submissions, [
    'https://queue.fal.run/fal-ai/elevenlabs/audio-isolation'
  ]);
});

test('does not expose a RouterAI fallback for video isolation input', async () => {
  let runtime;
  const execute = createToolExecutor({
    telegram: {},
    providerKeys: { fal: 'fal-secret', elevenlabs: 'eleven-secret', routerai: 'routerai-secret' },
    invoke: async (_request, passedRuntime) => {
      runtime = passedRuntime;
      return passedRuntime.config.routes.audio_isolation;
    }
  });

  const routes = await execute({
    toolId: 'audio_isolation',
    telegramInput: {
      media: { type: 'video', value: 'https://input.example.test/video.mp4' }
    },
    settings: {}
  });

  assert.deepEqual(routes.map(({ provider }) => provider), ['elevenlabs', 'fal']);
  assert.equal(runtime.config.fallbackStatus.status, 'incompatible');
  assert.match(runtime.config.fallbackStatus.reason, /RouterAI|contract/i);
});

test('keeps an incompatible tool fallback status explicit without inventing a RouterAI route', async () => {
  let runtime;
  const execute = createToolExecutor({
    telegram: {},
    providerKeys: { fal: 'fal-secret', routerai: 'routerai-secret' },
    invoke: async (_request, passedRuntime) => {
      runtime = passedRuntime;
      return passedRuntime.config.routes.audio_music;
    }
  });

  const routes = await execute({
    toolId: 'audio_music',
    telegramInput: { text: 'сделай музыку' },
    settings: {}
  });

  assert.equal(routes.some(({ provider }) => provider === 'kie'), false);
  assert.equal(runtime.config.fallbackStatus.status, 'incompatible');
  assert.match(runtime.config.fallbackStatus.reason, /RouterAI|contract|контракт/i);
});
