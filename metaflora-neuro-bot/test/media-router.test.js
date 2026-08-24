import test from 'node:test';
import assert from 'node:assert/strict';

import { invokeMediaTool } from '../src/media-router.js';

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers }
  });
}

const polling = Object.freeze({
  pollIntervalMs: 0,
  maxPollAttempts: 4,
  requestTimeoutMs: 100,
  requestRetries: 1,
  retryDelayMs: 0
});

test('fal adapter submits and polls configured endpoints and normalizes media output', async () => {
  const calls = [];
  const config = {
    ...polling,
    providers: { fal: { apiKey: 'fal-secret' } },
    routes: {
      image: [{
        provider: 'fal',
        endpoint: 'https://queue.fal.test/custom-model',
        type: 'image',
        mimeType: 'image/png'
      }]
    }
  };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') {
      return jsonResponse({
        request_id: 'fal-request-1',
        status_url: 'https://queue.fal.test/custom-model/requests/fal-request-1/status',
        response_url: 'https://queue.fal.test/custom-model/requests/fal-request-1'
      });
    }
    if (url.endsWith('/status')) return jsonResponse({ status: 'COMPLETED' });
    return jsonResponse({
      images: [{ url: 'https://media.example.test/result.png', content_type: 'image/png' }]
    });
  };

  const result = await invokeMediaTool(
    { routeId: 'image', input: { prompt: 'garden' } },
    { config, fetchImpl }
  );

  assert.deepEqual(result, {
    type: 'image',
    url: 'https://media.example.test/result.png',
    mimeType: 'image/png',
    provider: 'fal',
    requestId: 'fal-request-1'
  });
  assert.equal(calls[0].url, 'https://queue.fal.test/custom-model');
  assert.equal(calls[0].options.headers.authorization, 'Key fal-secret');
  assert.deepEqual(JSON.parse(calls[0].options.body), { prompt: 'garden' });
});

test('provider tunnel reports the primary-to-KIE fallback before a job is accepted', async () => {
  const attempts = [];
  const config = {
    ...polling,
    providers: { fal: { apiKey: 'primary-key' }, kie: { apiKey: 'fallback-key' } },
    routes: {
      image: [
        { provider: 'fal', endpoint: 'https://primary.example.test/model', type: 'image', mimeType: 'image/png' },
        {
          provider: 'kie',
          endpoint: 'https://fallback.example.test/api/v1/jobs',
          statusEndpoint: 'https://fallback.example.test/api/v1/jobs/{requestId}',
          model: 'fallback/model',
          type: 'image',
          mimeType: 'image/png'
        }
      ]
    }
  };
  const fetchImpl = async (url, options = {}) => {
    if (url.includes('primary')) return jsonResponse({ error: 'temporary outage' }, 503);
    if (options.method === 'POST') return jsonResponse({ code: 200, data: { taskId: 'kie-task-1' } });
    return jsonResponse({ code: 200, msg: 'success', data: {
      state: 'success',
      resultJson: JSON.stringify({ url: 'https://media.example.test/fallback.png' })
    } });
  };

  const result = await invokeMediaTool(
    { routeId: 'image', input: { prompt: 'fallback' } },
    {
      config,
      fetchImpl,
      onAttempt: async ({ route }) => attempts.push(route.provider)
    }
  );

  assert.deepEqual(attempts, ['fal', 'kie']);
  assert.equal(result.provider, 'kie');
  assert.equal(result.url, 'https://media.example.test/fallback.png');
});

test('KIE rejects a media request before acceptance and the router uses the next route', async () => {
  const attempts = [];
  const config = {
    ...polling,
    providers: { kie: { apiKey: 'kie-key' }, fal: { apiKey: 'fal-key' } },
    routes: {
      image: [
        {
          provider: 'kie',
          endpoint: 'https://api.kie.test/api/v1/jobs/createTask',
          statusEndpoint: 'https://api.kie.test/api/v1/jobs/recordInfo?taskId={requestId}',
          model: 'unsupported/model',
          type: 'image',
          mimeType: 'image/png'
        },
        {
          provider: 'fal',
          endpoint: 'https://queue.fal.test/fallback',
          type: 'image',
          mimeType: 'image/png'
        }
      ]
    }
  };
  const fetchImpl = async (url, options = {}) => {
    if (url.includes('api.kie.test')) return jsonResponse({ code: 422, msg: 'model unavailable' });
    if (options.method === 'POST') {
      return jsonResponse({ request_id: 'fal-after-kie-reject', status_url: 'https://queue.fal.test/fallback/status' });
    }
    if (url.endsWith('/status')) return jsonResponse({ status: 'COMPLETED', response_url: 'https://queue.fal.test/fallback/result' });
    return jsonResponse({ images: [{ url: 'https://media.example.test/after-kie-reject.png' }] });
  };

  const result = await invokeMediaTool(
    { routeId: 'image', input: { prompt: 'fallback after rejection' } },
    { config, fetchImpl, onAttempt: async ({ route }) => attempts.push(route.provider) }
  );

  assert.deepEqual(attempts, ['kie', 'fal']);
  assert.equal(result.provider, 'fal');
});

test('Polza media adapter submits and polls its asynchronous media contract', async () => {
  const calls = [];
  const config = {
    ...polling,
      providers: { polza: { apiKey: 'polza-secret' } },
    routes: {
      video: [{
        provider: ' Polza.AI ',
        endpoint: 'https://polza.ai/api/v1/media',
        statusEndpoint: 'https://polza.ai/api/v1/media/{requestId}',
        providerModelId: ' bytedance/seedance-2 ',
        type: 'video',
        mimeType: 'video/mp4'
      }]
    }
  };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') {
      return jsonResponse({ id: 'polza-media-1', status: 'pending' });
    }
    return jsonResponse({
      id: 'polza-media-1',
      status: 'completed',
      data: { url: 'https://media.example.test/polza-result.mp4' }
    });
  };

  const result = await invokeMediaTool(
    { routeId: 'video', input: { prompt: 'waves' } },
    { config, fetchImpl }
  );

  assert.equal(calls[0].url, 'https://polza.ai/api/v1/media');
  assert.equal(calls[0].options.headers.authorization, 'Bearer polza-secret');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    model: 'bytedance/seedance-2',
    input: { prompt: 'waves' },
    async: true
  });
  assert.equal(calls[1].url, 'https://polza.ai/api/v1/media/polza-media-1');
  assert.deepEqual(result, {
    type: 'video',
    url: 'https://media.example.test/polza-result.mp4',
    mimeType: 'video/mp4',
    provider: 'polza',
    providerModelId: 'bytedance/seedance-2',
    model: 'bytedance/seedance-2',
    requestId: 'polza-media-1'
  });
});

test('router preserves normalized provider metadata and sanitizes ambiguous submission errors', async () => {
  const secret = 'route-secret-token';
  const config = {
    ...polling,
    providers: { kie: { apiKey: secret } },
    routes: {
      image: [{
        provider: ' KIE.AI ',
        providerModelId: ' configured/image-model ',
        endpoint: 'https://api.kie.test/jobs/createTask',
        statusEndpoint: 'https://api.kie.test/jobs/status?taskId={requestId}',
        type: 'image',
        mimeType: 'image/png'
      }]
    }
  };

  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: { prompt: 'secret-safe error' } },
      {
        config,
        fetchImpl: async () => {
          throw new Error(`provider response body contains ${secret}`);
        }
      }
    ),
    (error) => {
      assert.equal(error.provider, 'kie');
      assert.equal(error.providerModelId, 'configured/image-model');
      assert.equal(error.acceptedJob, true);
      assert.equal(error.message.includes(secret), false);
      assert.equal(String(error.cause?.message ?? '').includes(secret), false);
      return true;
    }
  );
});

test('router preserves safe provider status and code for CRM diagnostics', async () => {
  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: { prompt: 'invalid-contract' } },
      {
        config: {
          ...polling,
          providers: { polza: { apiKey: 'polza-secret' } },
          routes: {
            image: [{
              provider: 'polza',
              endpoint: 'https://polza.ai/api/v1/media',
              providerModelId: 'openai/gpt-5.4-image-2',
              type: 'image',
              mimeType: 'image/png',
            }],
          },
        },
        fetchImpl: async () => jsonResponse({
          error: {
            code: 'INVALID_INPUT',
            message: 'private upstream payload must not be exposed',
          },
        }, 422),
      },
    ),
    (error) => {
      assert.equal(error.code, 'provider_rejected');
      assert.equal(error.httpStatus, 422);
      assert.equal(error.providerCode, 'INVALID_INPUT');
      assert.equal(error.acceptedJob, false);
      assert.equal(error.message.includes('private'), false);
      assert.equal(String(error.cause?.message ?? '').includes('private'), false);
      return true;
    },
  );
});

test('Polza media submission falls back to KIE without resubmitting an accepted job', async () => {
  const attempts = [];
  const submissions = [];
  const config = {
    ...polling,
    providers: {
      polza: { apiKey: 'polza-secret' },
      kie: { apiKey: 'kie-secret' }
    },
    routes: {
      video: [
        {
          provider: 'polza',
          endpoint: 'https://polza.ai/api/v1/media',
          statusEndpoint: 'https://polza.ai/api/v1/media/{requestId}',
          model: 'bytedance/seedance-2',
          type: 'video',
          mimeType: 'video/mp4'
        },
        {
          provider: 'kie',
          endpoint: 'https://api.kie.ai/api/v1/jobs/createTask',
          statusEndpoint: 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId={requestId}',
          model: 'bytedance/seedance-2',
          type: 'video',
          mimeType: 'video/mp4'
        }
      ]
    }
  };
  const fetchImpl = async (url, options = {}) => {
    if (options.method === 'POST') submissions.push(url);
    if (url === 'https://polza.ai/api/v1/media') {
      return jsonResponse({ error: 'temporary outage' }, 503);
    }
    if (options.method === 'POST') {
      return jsonResponse({ code: 200, data: { taskId: 'kie-seedance-1' } });
    }
    return jsonResponse({
      code: 200,
      msg: 'success',
      data: {
        state: 'success',
        resultJson: JSON.stringify({ video_url: 'https://media.example.test/kie-result.mp4' })
      }
    });
  };

  const result = await invokeMediaTool(
    { routeId: 'video', input: { prompt: 'fallback' } },
    {
      config,
      fetchImpl,
      onAttempt: async ({ route }) => attempts.push(route.provider)
    }
  );

  assert.deepEqual(attempts, ['polza', 'kie']);
  assert.deepEqual(submissions, [
    'https://polza.ai/api/v1/media',
    'https://api.kie.ai/api/v1/jobs/createTask'
  ]);
  assert.equal(result.provider, 'kie');
  assert.equal(result.url, 'https://media.example.test/kie-result.mp4');
});

test('fal adapter converts a model endpoint to its queue URL and applies input/output mappings', async () => {
  const calls = [];
  const config = {
    ...polling,
    providers: { fal: { apiKey: 'fal-secret' } },
    routes: {
      restore: [{
        provider: 'fal',
        endpoint: 'fal-ai/image-editing/photo-restoration',
        type: 'image',
        mimeType: 'image/png',
        runtime: {
          inputMap: { image: 'image_url', text: 'prompt' },
          outputPath: 'images.0'
        }
      }]
    }
  };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') {
      return jsonResponse({
        request_id: 'mapped-request',
        status_url: 'https://queue.fal.run/fal-ai/image-editing/photo-restoration/requests/mapped-request/status'
      });
    }
    return jsonResponse({
      status: 'COMPLETED',
      payload: {
        images: [{
          url: 'https://media.example.test/restored.png',
          content_type: 'image/png'
        }]
      }
    });
  };

  const result = await invokeMediaTool(
    {
      routeId: 'restore',
      input: {
        image: 'https://input.example.test/photo.jpg',
        text: 'restore scratches',
        output_format: 'png'
      }
    },
    { config, fetchImpl }
  );

  assert.equal(
    calls[0].url,
    'https://queue.fal.run/fal-ai/image-editing/photo-restoration'
  );
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    image_url: 'https://input.example.test/photo.jpg',
    prompt: 'restore scratches',
    output_format: 'png'
  });
  assert.equal(result.url, 'https://media.example.test/restored.png');
});

test('router returns text selected by outputPath without treating it as a URL', async () => {
  const config = {
    ...polling,
    providers: { fal: { apiKey: 'fal-secret' } },
    routes: {
      speech_to_text: [{
        provider: 'fal',
        endpoint: 'fal-ai/elevenlabs/speech-to-text/scribe-v2',
        type: 'text',
        mimeType: 'text/plain',
        inputMap: { audio: 'audio_url' },
        outputPath: 'transcript.text'
      }]
    }
  };
  const fetchImpl = async (_url, options = {}) => {
    if (options.method === 'POST') {
      assert.deepEqual(JSON.parse(options.body), {
        audio_url: 'https://input.example.test/speech.mp3'
      });
      return jsonResponse({
        request_id: 'transcript-request',
        status_url: 'https://queue.fal.run/fal-ai/elevenlabs/speech-to-text/scribe-v2/requests/transcript-request/status'
      });
    }
    return jsonResponse({
      status: 'COMPLETED',
      payload: { transcript: { text: 'Ready transcript' } }
    });
  };

  const result = await invokeMediaTool(
    {
      routeId: 'speech_to_text',
      input: { audio: 'https://input.example.test/speech.mp3' }
    },
    { config, fetchImpl }
  );

  assert.deepEqual(result, {
    type: 'text',
    text: 'Ready transcript',
    mimeType: 'text/plain',
    provider: 'fal',
    requestId: 'transcript-request'
  });
});

test('router normalizes a GLB output as a size-checked document', async () => {
  const route = {
    provider: 'fal',
    endpoint: 'fal-ai/meshy/v6/text-to-3d',
    type: 'document',
    mimeType: 'model/gltf-binary',
    maxBytes: 1024,
    inputMap: { text: 'prompt' },
    outputPath: 'model_glb'
  };
  const config = {
    ...polling,
    providers: { fal: { apiKey: 'fal-secret' } },
    routes: { three_d: [route] }
  };
  const invoke = (output) => invokeMediaTool(
    { routeId: 'three_d', input: { text: 'flower sculpture' } },
    {
      config,
      fetchImpl: async (_url, options = {}) => options.method === 'POST'
        ? jsonResponse({
            request_id: 'glb-request',
            status_url: 'https://queue.fal.run/fal-ai/meshy/v6/text-to-3d/requests/glb-request/status'
          })
        : jsonResponse({ status: 'COMPLETED', payload: { model_glb: output } })
    }
  );

  assert.deepEqual(await invoke({
    url: 'https://media.example.test/model.glb',
    content_type: 'model/gltf-binary',
    file_size: 512
  }), {
    type: 'document',
    url: 'https://media.example.test/model.glb',
    mimeType: 'model/gltf-binary',
    size: 512,
    provider: 'fal',
    requestId: 'glb-request'
  });

  await assert.rejects(
    invoke({
      url: 'https://media.example.test/model.glb',
      content_type: 'text/html',
      file_size: 512
    }),
    /invalid media output/i
  );
  await assert.rejects(
    invoke({
      url: 'https://media.example.test/model.glb',
      content_type: 'model/gltf-binary',
      file_size: 2048
    }),
    /invalid media output/i
  );
});

test('KIE adapter uses the configured model and status endpoint', async () => {
  const calls = [];
  const config = {
    ...polling,
    providers: { kie: { apiKey: 'kie-secret' } },
    routes: {
      video: [{
        provider: 'kie',
        endpoint: 'https://api.kie.test/jobs/create',
        statusEndpoint: 'https://api.kie.test/jobs/status?taskId={requestId}',
        model: 'configured/video-model',
        type: 'video',
        mimeType: 'video/mp4'
      }]
    }
  };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') {
      return jsonResponse({ code: 200, data: { taskId: 'kie-task-1' } });
    }
    return jsonResponse({
      code: 200,
      data: {
        taskId: 'kie-task-1',
        state: 'success',
        resultJson: JSON.stringify({ resultUrls: ['https://media.example.test/result.mp4'] })
      }
    });
  };

  const result = await invokeMediaTool(
    { routeId: 'video', input: { prompt: 'waves' } },
    { config, fetchImpl }
  );

  assert.equal(JSON.parse(calls[0].options.body).model, 'configured/video-model');
  assert.equal(calls[1].url, 'https://api.kie.test/jobs/status?taskId=kie-task-1');
  assert.deepEqual(result, {
    type: 'video',
    url: 'https://media.example.test/result.mp4',
    mimeType: 'video/mp4',
    provider: 'kie',
    providerModelId: 'configured/video-model',
    model: 'configured/video-model',
    requestId: 'kie-task-1'
  });
});

test('Replicate adapter reads its endpoint and model version from the route record', async () => {
  const calls = [];
  const config = {
    ...polling,
    providers: { replicate: { apiKey: 'replicate-secret' } },
    routes: {
      audio: [{
        provider: 'replicate',
        endpoint: 'https://api.replicate.test/predictions',
        statusEndpoint: 'https://api.replicate.test/predictions/{requestId}',
        model: 'configured-version-id',
        type: 'audio',
        mimeType: 'audio/mpeg'
      }]
    }
  };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') {
      return jsonResponse({ id: 'prediction-1', status: 'starting' });
    }
    return jsonResponse({
      id: 'prediction-1',
      status: 'succeeded',
      output: ['https://media.example.test/result.mp3']
    });
  };

  const result = await invokeMediaTool(
    { routeId: 'audio', input: { text: 'hello' } },
    { config, fetchImpl }
  );

  assert.deepEqual(JSON.parse(calls[0].options.body), {
    version: 'configured-version-id',
    input: { text: 'hello' }
  });
  assert.equal(calls[0].options.headers.authorization, 'Bearer replicate-secret');
  assert.equal(calls[1].url, 'https://api.replicate.test/predictions/prediction-1');
  assert.equal(result.url, 'https://media.example.test/result.mp3');
  assert.equal(result.provider, 'replicate');
});

test('ElevenLabs direct adapter submits JSON and normalizes binary audio output', async () => {
  const calls = [];
  const config = {
    ...polling,
    providers: { elevenlabs: { apiKey: 'xi-secret' } },
    routes: {
      audio: [{
        provider: 'elevenlabs',
        endpoint: '/v1/text-to-speech/{voice_id}',
        type: 'audio',
        mimeType: 'audio/mpeg',
        runtime: {
          adapter: 'elevenlabs.direct',
          operation: 'tts',
          inputMap: { text: 'text' },
          outputPath: 'audio'
        }
      }]
    }
  };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    assert.equal(options.method, 'POST');
    return new Response(new Uint8Array([1, 2, 3, 4]), {
      headers: {
        'content-type': 'audio/mpeg',
        'request-id': 'el-tts-1'
      }
    });
  };

  const result = await invokeMediaTool(
    {
      routeId: 'audio',
      input: {
        text: 'привет',
        voice: '21m00Tcm4TlvDq8ikWAM',
        stability: 0.5
      }
    },
    { config, fetchImpl }
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM');
  assert.equal(calls[0].options.headers['xi-api-key'], 'xi-secret');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    text: 'привет',
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5 }
  });
  assert.equal(result.type, 'audio');
  assert.equal(result.provider, 'elevenlabs');
  assert.equal(result.requestId, 'el-tts-1');
  assert.equal(result.mimeType, 'audio/mpeg');
  assert.equal(result.size, 4);
  assert.equal(result.data.byteLength, 4);
  assert.equal(result.url, undefined);
});

test('router falls back deterministically only across configured route records', async () => {
  const submissions = [];
  const config = {
    ...polling,
    submissionRetries: 0,
    providers: {
      kie: { apiKey: 'kie-secret' },
      replicate: { apiKey: 'replicate-secret' },
      fal: { apiKey: 'unused-secret' }
    },
    routes: {
      image: [
        {
          provider: 'kie',
          endpoint: 'https://api.kie.test/jobs/create',
          statusEndpoint: 'https://api.kie.test/jobs/status/{requestId}',
          model: 'first-model',
          type: 'image',
          mimeType: 'image/jpeg'
        },
        {
          provider: 'replicate',
          endpoint: 'https://api.replicate.test/predictions',
          statusEndpoint: 'https://api.replicate.test/predictions/{requestId}',
          model: 'second-model',
          type: 'image',
          mimeType: 'image/jpeg'
        }
      ]
    }
  };
  const fetchImpl = async (url, options = {}) => {
    if (options.method === 'POST') submissions.push(url);
    if (url.includes('kie.test')) return jsonResponse({ error: 'busy' }, 429);
    if (options.method === 'POST') {
      return jsonResponse({
        id: 'prediction-2',
        status: 'succeeded',
        output: 'https://media.example.test/fallback.jpg'
      });
    }
    throw new Error('unexpected poll');
  };

  const result = await invokeMediaTool(
    { routeId: 'image', input: { prompt: 'fallback' } },
    { config, fetchImpl }
  );

  assert.deepEqual(submissions, [
    'https://api.kie.test/jobs/create',
    'https://api.replicate.test/predictions'
  ]);
  assert.equal(result.provider, 'replicate');
});

test('accepted jobs are never resubmitted or moved to a fallback route', async () => {
  let submissions = 0;
  let polls = 0;
  const config = {
    ...polling,
    maxPollAttempts: 2,
    requestRetries: 0,
    providers: {
      replicate: { apiKey: 'replicate-secret' },
      fal: { apiKey: 'fal-secret' }
    },
    routes: {
      image: [
        {
          provider: 'replicate',
          endpoint: 'https://api.replicate.test/predictions',
          statusEndpoint: 'https://api.replicate.test/predictions/{requestId}',
          model: 'version',
          type: 'image',
          mimeType: 'image/png'
        },
        {
          provider: 'fal',
          endpoint: 'https://queue.fal.test/unused',
          type: 'image',
          mimeType: 'image/png'
        }
      ]
    }
  };
  const fetchImpl = async (_url, options = {}) => {
    if (options.method === 'POST') {
      submissions += 1;
      return jsonResponse({ id: 'accepted-1', status: 'processing' });
    }
    polls += 1;
    return jsonResponse({ id: 'accepted-1', status: 'processing' });
  };

  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: { prompt: 'wait' } },
      { config, fetchImpl }
    ),
    (error) => error.requestId === 'accepted-1'
      && error.acceptedJob === true
      && /timed out/i.test(error.message)
  );
  assert.equal(submissions, 1);
  assert.equal(polls, 2);
});

test('polling retries transient reads without repeating provider submission', async () => {
  let submissions = 0;
  let polls = 0;
  const config = {
    ...polling,
    requestRetries: 1,
    providers: { replicate: { apiKey: 'replicate-secret' } },
    routes: {
      image: [{
        provider: 'replicate',
        endpoint: 'https://api.replicate.test/predictions',
        statusEndpoint: 'https://api.replicate.test/predictions/{requestId}',
        model: 'version',
        type: 'image',
        mimeType: 'image/png'
      }]
    }
  };
  const fetchImpl = async (_url, options = {}) => {
    if (options.method === 'POST') {
      submissions += 1;
      return jsonResponse({ id: 'prediction-3', status: 'processing' });
    }
    polls += 1;
    if (polls === 1) throw new Error('temporary read failure');
    return jsonResponse({
      id: 'prediction-3',
      status: 'succeeded',
      output: 'https://media.example.test/result.png'
    });
  };

  const result = await invokeMediaTool(
    { routeId: 'image', input: { prompt: 'retry read' } },
    { config, fetchImpl }
  );

  assert.equal(result.requestId, 'prediction-3');
  assert.equal(submissions, 1);
  assert.equal(polls, 2);
});

test('submission retries only an explicit transient rejection', async () => {
  let submissions = 0;
  const config = {
    ...polling,
    submissionRetries: 1,
    providers: { replicate: { apiKey: 'replicate-secret' } },
    routes: {
      image: [{
        provider: 'replicate',
        endpoint: 'https://api.replicate.test/predictions',
        model: 'version',
        type: 'image',
        mimeType: 'image/png'
      }]
    }
  };
  const fetchImpl = async (_url, options = {}) => {
    assert.equal(options.method, 'POST');
    submissions += 1;
    if (submissions === 1) return jsonResponse({ error: 'rate limited' }, 429);
    return jsonResponse({
      id: 'prediction-4',
      status: 'succeeded',
      output: 'https://media.example.test/result.png'
    });
  };

  const result = await invokeMediaTool(
    { routeId: 'image', input: { prompt: 'retry submission' } },
    { config, fetchImpl }
  );

  assert.equal(result.requestId, 'prediction-4');
  assert.equal(submissions, 2);
});

test('terminal provider failures and mismatched output MIME remain bound to the accepted job', async () => {
  let mismatchedSubmissions = 0;
  const route = {
    provider: 'replicate',
    endpoint: 'https://api.replicate.test/predictions',
    statusEndpoint: 'https://api.replicate.test/predictions/{requestId}',
    model: 'version',
    type: 'image',
    mimeType: 'image/png'
  };
  const config = {
    ...polling,
    providers: { replicate: { apiKey: 'replicate-secret' } },
    routes: { image: [route] }
  };

  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: {} },
      {
        config,
        fetchImpl: async () => jsonResponse({
          id: 'failed-1',
          status: 'failed',
          error: 'provider detail must stay private'
        })
      }
    ),
    (error) => error.requestId === 'failed-1'
      && error.acceptedJob === true
      && !error.message.includes('provider detail')
  );

  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: {} },
      {
        config: {
          ...config,
          routes: {
            image: [
              route,
              {
                ...route,
                endpoint: 'https://api.replicate.test/fallback'
              }
            ]
          }
        },
        fetchImpl: async () => {
          mismatchedSubmissions += 1;
          return jsonResponse({
            id: 'wrong-mime-1',
            status: 'succeeded',
            output: {
              url: 'https://media.example.test/result.html',
              content_type: 'text/html'
            }
          });
        }
      }
    ),
    (error) => error.acceptedJob === true
      && error.provider === 'replicate'
      && error.providerModelId === 'version'
      && /invalid media output/i.test(error.message)
  );
  assert.equal(mismatchedSubmissions, 1);
});

test('polling does not retry a non-transient HTTP failure', async () => {
  let polls = 0;
  const config = {
    ...polling,
    requestRetries: 3,
    providers: { replicate: { apiKey: 'replicate-secret' } },
    routes: {
      image: [{
        provider: 'replicate',
        endpoint: 'https://api.replicate.test/predictions',
        statusEndpoint: 'https://api.replicate.test/predictions/{requestId}',
        model: 'version',
        type: 'image',
        mimeType: 'image/png'
      }]
    }
  };
  const fetchImpl = async (_url, options = {}) => {
    if (options.method === 'POST') {
      return jsonResponse({ id: 'prediction-5', status: 'processing' });
    }
    polls += 1;
    return jsonResponse({ error: 'invalid request' }, 400);
  };

  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: {} },
      { config, fetchImpl }
    ),
    (error) => error.requestId === 'prediction-5' && error.acceptedJob === true
  );
  assert.equal(polls, 1);
});

test('an ambiguous submission network failure never triggers fallback', async () => {
  let submissions = 0;
  const secret = 'do-not-leak';
  const config = {
    ...polling,
    providers: {
      fal: { apiKey: secret },
      replicate: { apiKey: 'unused' }
    },
    routes: {
      image: [
        {
          provider: 'fal',
          endpoint: 'https://queue.fal.test/model',
          type: 'image',
          mimeType: 'image/png'
        },
        {
          provider: 'replicate',
          endpoint: 'https://api.replicate.test/predictions',
          model: 'unused',
          type: 'image',
          mimeType: 'image/png'
        }
      ]
    }
  };

  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: {} },
      {
        config,
        fetchImpl: async () => {
          submissions += 1;
          throw new Error(`failed with ${secret}`);
        }
      }
    ),
    (error) => !error.message.includes(secret) && error.acceptedJob === true
  );
  assert.equal(submissions, 1);
});

test('router validates route configuration and request input', async () => {
  await assert.rejects(
    invokeMediaTool(
      { routeId: 'missing', input: {} },
      { config: { routes: {}, providers: {} }, fetchImpl: fetch }
    ),
    /No configured media route/
  );

  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: 'invalid' },
      { config: { routes: {}, providers: {} }, fetchImpl: fetch }
    ),
    /input must be an object/
  );

  await assert.rejects(
    invokeMediaTool(
      { routeId: 'unsafe_path', input: {} },
      {
        config: {
          ...polling,
          providers: { fal: { apiKey: 'fal-secret' } },
          routes: {
            unsafe_path: [{
              provider: 'fal',
              endpoint: 'fal-ai/test/model',
              type: 'image',
              mimeType: 'image/png',
              outputPath: 'constructor.result'
            }]
          }
        },
        fetchImpl: async (_url, options = {}) => options.method === 'POST'
          ? jsonResponse({
              request_id: 'unsafe-path',
              status_url: 'https://queue.fal.run/fal-ai/test/model/requests/unsafe-path/status'
            })
          : jsonResponse({
              status: 'COMPLETED',
              payload: {
                constructor: {
                  result: 'https://media.example.test/result.png'
                }
              }
            })
      }
    ),
    /invalid media output/i
  );
});

test('router rejects blank provider credentials before making a request', async () => {
  let calls = 0;
  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: { prompt: 'hello' } },
      {
        config: {
          ...polling,
          providers: { fal: { apiKey: '   ' } },
          routes: {
            image: [{
              provider: 'fal',
              endpoint: 'fal-ai/test/model',
              type: 'image',
              mimeType: 'image/png'
            }]
          }
        },
        fetchImpl: async () => {
          calls += 1;
          return jsonResponse({});
        }
      }
    ),
    /credentials/i
  );
  assert.equal(calls, 0);
});

test('router rejects malformed requests, runtime options and insecure endpoints', async () => {
  const emptyConfig = { routes: {}, providers: {} };
  await assert.rejects(
    invokeMediaTool(null, { config: emptyConfig, fetchImpl: fetch }),
    /request must be an object/i
  );
  await assert.rejects(
    invokeMediaTool(
      { routeId: '', input: {} },
      { config: emptyConfig, fetchImpl: fetch }
    ),
    /routeId is required/i
  );
  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: {} },
      { config: null, fetchImpl: fetch }
    ),
    /configuration is invalid/i
  );

  const route = {
    provider: 'replicate',
    endpoint: 'https://api.replicate.test/predictions',
    model: 'version',
    type: 'image',
    mimeType: 'image/png'
  };
  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: {} },
      {
        config: {
          providers: { replicate: { apiKey: 'token' } },
          submissionRetries: -1,
          routes: { image: [route] }
        },
        fetchImpl: fetch
      }
    ),
    /submissionRetries is invalid/i
  );
  await assert.rejects(
    invokeMediaTool(
      { routeId: 'image', input: {} },
      {
        config: {
          providers: { replicate: { apiKey: 'token' } },
          routes: {
            image: [{ ...route, endpoint: 'http://api.replicate.test/predictions' }]
          }
        },
        fetchImpl: fetch
      }
    ),
    /credential-free HTTPS URL/i
  );
});
