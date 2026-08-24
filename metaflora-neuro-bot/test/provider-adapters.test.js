import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractProviderOutput,
  getProviderAdapter
} from '../src/provider-adapters.js';

test('provider adapters build validated provider-specific submissions', () => {
  const fal = getProviderAdapter('fal');
  const kie = getProviderAdapter('kie');
  const replicate = getProviderAdapter('replicate');
  const route = {
    endpoint: 'fal-ai/test/model',
    model: 'model-version',
    runtime: {
      inputMap: {
        text: 'prompt',
        media: { audio: 'audio_url', video: 'video_url' }
      }
    }
  };
  const request = {
    input: {
      text: 'hello',
      media: { type: 'audio', value: 'https://input.example.test/audio.mp3' }
    }
  };

  assert.equal(fal.submissionUrl(route), 'https://queue.fal.run/fal-ai/test/model');
  assert.deepEqual({ ...fal.submissionBody(route, request) }, {
    prompt: 'hello',
    audio_url: 'https://input.example.test/audio.mp3'
  });
  assert.deepEqual(kie.submissionBody(route, request), {
    model: 'model-version',
    input: {
      prompt: 'hello',
      audio_url: 'https://input.example.test/audio.mp3'
    }
  });
  assert.deepEqual(replicate.submissionBody(route, request), {
    version: 'model-version',
    input: {
      prompt: 'hello',
      audio_url: 'https://input.example.test/audio.mp3'
    }
  });
});

test('RouterAI image adapter maps the public image count to the provider n field', async () => {
  const routerai = getProviderAdapter('routerai');
  const body = await routerai.submissionBody({
    provider: 'routerai',
    model: 'openai/gpt-5-image',
    runtime: { operation: 'image' }
  }, {
    input: {
      prompt: 'афиша с крупным заголовком',
      num_images: '3',
      quality: 'high'
    }
  });

  assert.equal(body.n, 3);
  assert.equal(body.quality, 'high');
  assert.equal('num_images' in body, false);
});

test('RouterAI Seedance 2.5 separates keyframes from reference images', async () => {
  const routerai = getProviderAdapter('routerai');
  const route = {
    provider: 'routerai',
    model: 'bytedance/seedance-2.5',
    runtime: { operation: 'video' }
  };

  assert.deepEqual(await routerai.submissionBody(route, {
    input: {
      prompt: 'камера медленно приближается',
      duration: 8,
      resolution: '480p',
      aspect_ratio: '16:9',
      _constructorMode: 'first_frame',
      image_urls: [
        'https://uploads.example.test/first.jpg',
        'https://uploads.example.test/last.jpg'
      ]
    }
  }), {
    model: 'bytedance/seedance-2.5',
    prompt: 'камера медленно приближается',
    duration: 8,
    resolution: '480p',
    aspect_ratio: '16:9',
    frame_images: [
      {
        type: 'image_url',
        image_url: { url: 'https://uploads.example.test/first.jpg' },
        frame_type: 'first_frame'
      },
      {
        type: 'image_url',
        image_url: { url: 'https://uploads.example.test/last.jpg' },
        frame_type: 'last_frame'
      }
    ]
  });

  assert.deepEqual(await routerai.submissionBody(route, {
    input: {
      prompt: 'сохрани персонажа и стиль',
      _constructorMode: 'references',
      image_urls: ['https://uploads.example.test/reference.jpg']
    }
  }), {
    model: 'bytedance/seedance-2.5',
    prompt: 'сохрани персонажа и стиль',
    input_references: [{
      type: 'image_url',
      image_url: { url: 'https://uploads.example.test/reference.jpg' }
    }]
  });
});

test('RouterAI Seedance 2.5 forwards multimodal references with their media types', async () => {
  const routerai = getProviderAdapter('routerai');
  const route = {
    provider: 'routerai',
    model: 'bytedance/seedance-2.5',
    runtime: { operation: 'video' }
  };
  assert.deepEqual(await routerai.submissionBody(route, {
    input: {
      prompt: 'сохрани героя, движение и голос',
      _constructorMode: 'references',
      image_urls: ['https://uploads.example.test/hero.jpg'],
      video_urls: ['https://uploads.example.test/motion.mp4'],
      audio_urls: ['https://uploads.example.test/voice.mp3']
    }
  }), {
    model: 'bytedance/seedance-2.5',
    prompt: 'сохрани героя, движение и голос',
    input_references: [
      { type: 'image_url', image_url: { url: 'https://uploads.example.test/hero.jpg' } },
      { type: 'video_url', video_url: { url: 'https://uploads.example.test/motion.mp4' } },
      { type: 'audio_url', audio_url: { url: 'https://uploads.example.test/voice.mp3' } }
    ]
  });
});

test('Polza adapter converts canonical media URL lists to the documented media references', () => {
  const polza = getProviderAdapter(' Polza.AI ');
  const route = {
    model: 'bytedance/seedance-2',
    runtime: { async: true }
  };
  const body = polza.submissionBody(route, {
    input: {
      prompt: 'animate this frame',
      image_urls: ['https://uploads.example.test/source.jpg'],
      video_urls: ['https://uploads.example.test/source.mp4'],
      generate_audio: true
    }
  });

  assert.deepEqual(body, {
    model: 'bytedance/seedance-2',
    input: {
      prompt: 'animate this frame',
      images: [{ type: 'url', data: 'https://uploads.example.test/source.jpg' }],
      videos: [{ type: 'url', data: 'https://uploads.example.test/source.mp4' }],
      generate_audio: true
    },
    async: true
  });
  assert.throws(
    () => polza.submissionBody(route, {
      input: {
        prompt: 'use this audio reference',
        audio_urls: ['https://uploads.example.test/reference.mp3']
      }
    }),
    /audio references are not confirmed/i
  );
});

test('Polza adapter normalizes UI aliases and drops settings outside the model contract', () => {
  const polza = getProviderAdapter('polza');
  const route = {
    model: 'openai/gpt-5.4-image-2',
    providerParameters: [
      { key: 'aspect_ratio', values: ['auto', '1:1'] },
      { key: 'image_resolution', values: ['1K', '2K'] }
    ],
    runtime: { async: true }
  };

  assert.deepEqual(polza.submissionBody(route, {
    input: {
      prompt: 'сделай макет',
      aspect_ratio: 'auto',
      resolution: '1K',
      quality: 'high',
      output_format: 'png',
      image_urls: ['https://uploads.example.test/source.jpg']
    }
  }), {
    model: 'openai/gpt-5.4-image-2',
    input: {
      prompt: 'сделай макет',
      aspect_ratio: 'auto',
      image_resolution: '1K',
      images: [{ type: 'url', data: 'https://uploads.example.test/source.jpg' }]
    },
    async: true
  });
});

test('Polza adapter maps reverse aliases for provider-native mode, sound, and prompt expansion', () => {
  const polza = getProviderAdapter('polza');
  const route = {
    model: 'kling/v3',
    providerParameters: [
      { key: 'mode', values: ['std', 'pro'] },
      { key: 'sound', values: ['true', 'false'] },
      { key: 'enable_prompt_expansion', values: ['true', 'false'] }
    ]
  };

  assert.deepEqual(polza.submissionBody(route, {
    input: {
      prompt: 'сцена',
      resolution: 'pro',
      generate_audio: false,
      prompt_expansion: true,
      quality: 'high'
    }
  }), {
    model: 'kling/v3',
    input: {
      prompt: 'сцена',
      mode: 'pro',
      sound: false,
      enable_prompt_expansion: true
    },
    async: true
  });
});

test('Polza adapter treats an explicit empty parameter contract as prompt-and-reference only', () => {
  const polza = getProviderAdapter('polza');
  assert.deepEqual(polza.submissionBody({
    model: 'google/gemini-3.1-flash-image',
    providerParameters: []
  }, {
    input: {
      prompt: 'чистый лист',
      aspect_ratio: '1:1',
      resolution: '1K',
      output_format: 'png'
    }
  }), {
    model: 'google/gemini-3.1-flash-image',
    input: { prompt: 'чистый лист' },
    async: true
  });
});

test('Polza adapter uses dedicated audio contracts for transcription and speech', async () => {
  const polza = getProviderAdapter('polza');
  const fetchImpl = async () => new Response(new Uint8Array([1, 2, 3]), {
    status: 200,
    headers: { 'content-type': 'audio/mpeg' }
  });

  const transcriptionRoute = {
    model: 'openai/gpt-4o-transcribe',
    runtime: {
      operation: 'transcription',
      bodyType: 'multipart',
      outputPath: 'text'
    },
    providerParameters: [
      { key: 'language', values: ['ru', 'en'] },
      { key: 'response_format', values: ['json', 'text'] }
    ]
  };
  const transcriptionBody = await polza.submissionBody(
    transcriptionRoute,
    {
      input: {
        prompt: 'слова для контекста',
        audio_urls: ['https://uploads.example.test/input.mp3'],
        language: 'ru',
        response_format: 'text'
      }
    },
    { fetchImpl }
  );
  assert.equal(transcriptionBody instanceof FormData, true);
  assert.equal(transcriptionBody.get('model'), 'openai/gpt-4o-transcribe');
  assert.equal(transcriptionBody.get('language'), 'ru');
  assert.equal(transcriptionBody.get('response_format'), 'text');
  assert.equal(transcriptionBody.get('prompt'), 'слова для контекста');
  assert.equal(transcriptionBody.get('file') instanceof Blob, true);

  const speechRoute = {
    model: 'openai/gpt-4o-mini-tts',
    runtime: { operation: 'speech' },
    providerParameters: [
      { key: 'voice', values: ['alloy', 'sage'] },
      { key: 'response_format', values: ['mp3', 'wav'] }
    ]
  };
  assert.deepEqual(await polza.submissionBody(speechRoute, {
    input: { prompt: 'озвучь это', voice: 'sage', response_format: 'wav' }
  }), {
    model: 'openai/gpt-4o-mini-tts',
    input: 'озвучь это',
    voice: 'sage',
    response_format: 'wav'
  });

  const parsedSpeech = await polza.parseSubmissionResponse(
    new Response(JSON.stringify({
      audio: 'aGVsbG8=',
      contentType: 'audio/wav'
    }), { status: 200 }),
    speechRoute
  );
  assert.equal(parsedSpeech.state, 'succeeded');
  assert.equal(parsedSpeech.output.audio.content_type, 'audio/wav');
  assert.deepEqual([...new Uint8Array(parsedSpeech.output.audio.data)], [104, 101, 108, 108, 111]);
});

test('provider adapters reject unsupported providers, blank credentials and ambiguous maps', () => {
  assert.throws(() => getProviderAdapter('unknown'), /not supported/i);

  for (const provider of ['fal', 'kie', 'replicate', 'elevenlabs']) {
    assert.throws(
      () => getProviderAdapter(provider).headers({ apiKey: '   ' }),
      /credentials/i
    );
  }
  assert.equal(
    getProviderAdapter('fal').headers({ apiKey: '  token  ' }).authorization,
    'Key token'
  );
  assert.equal(
    getProviderAdapter('elevenlabs').headers({ apiKey: '  xi-token  ' })['xi-api-key'],
    'xi-token'
  );

  assert.throws(
    () => getProviderAdapter('fal').submissionBody(
      { inputMap: { first: 'prompt', second: 'prompt' } },
      { input: { first: 'a', second: 'b' } }
    ),
    /more than one input/i
  );
  assert.throws(
    () => getProviderAdapter('fal').submissionBody(
      { inputMap: { media: { audio: 'audio_url' } } },
      { input: { media: { type: 'audio', value: 42 } } }
    ),
    /ambiguous/i
  );
  assert.throws(
    () => getProviderAdapter('kie').submissionBody(
      { endpoint: 'https://api.kie.test/jobs' },
      { input: {} }
    ),
    /model is not configured/i
  );
  assert.throws(
    () => getProviderAdapter('replicate').parseSubmission({
      id: 'invalid request id',
      status: 'starting'
    }),
    /invalid request id/i
  );
});

test('ElevenLabs adapter builds official JSON and binary contracts without exposing bearer auth', async () => {
  const elevenlabs = getProviderAdapter('elevenlabs');
  const route = {
    endpoint: '/v1/text-to-speech/{voice_id}',
    runtime: {
      operation: 'tts',
      inputMap: { text: 'text' }
    }
  };
  const request = {
    input: {
      text: 'привет',
      voice: '21m00Tcm4TlvDq8ikWAM',
      stability: 0.4,
      speed: 1
    }
  };
  const body = await elevenlabs.submissionBody(route, request, { fetchImpl: fetch });

  assert.equal(
    elevenlabs.submissionUrl(route, request, body),
    'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM'
  );
  assert.deepEqual(body, {
    text: 'привет',
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.4,
      speed: 1
    }
  });
  assert.equal(elevenlabs.headers({ apiKey: 'xi' }, route, body).authorization, undefined);

  const parsed = await elevenlabs.parseSubmissionResponse(
    new Response(new Uint8Array([1, 2, 3]), {
      headers: {
        'content-type': 'audio/mpeg',
        'request-id': 'el-request-1'
      }
    }),
    route
  );
  assert.equal(parsed.requestId, 'el-request-1');
  assert.equal(parsed.state, 'succeeded');
  assert.equal(parsed.output.audio.content_type, 'audio/mpeg');
  assert.equal(parsed.output.audio.file_size, 3);
});

test('ElevenLabs multipart adapter downloads only safe HTTPS file inputs', async () => {
  const elevenlabs = getProviderAdapter('elevenlabs');
  const route = {
    endpoint: '/v1/audio-isolation',
    runtime: {
      bodyType: 'multipart',
      fileFields: ['file'],
      inputMap: { audio: 'file' }
    }
  };
  const body = await elevenlabs.submissionBody(
    route,
    { input: { audio: 'https://files.example.test/input.mp3' } },
    {
      fetchImpl: async (url) => {
        assert.equal(url, 'https://files.example.test/input.mp3');
        return new Response(new Uint8Array([4, 5, 6]), {
          headers: {
            'content-type': 'audio/mpeg',
            'content-length': '3'
          }
        });
      }
    }
  );

  assert.equal(body instanceof FormData, true);
  assert.equal(elevenlabs.headers({ apiKey: 'xi' }, route, body)['content-type'], undefined);
  await assert.rejects(
    elevenlabs.submissionBody(
      route,
      { input: { audio: 'http://127.0.0.1/input.mp3' } },
      { fetchImpl: async () => null }
    ),
    /not allowed/i
  );
});

test('provider state parsers normalize successful, pending and failed jobs', () => {
  const fal = getProviderAdapter('fal');
  const kie = getProviderAdapter('kie');
  const replicate = getProviderAdapter('replicate');

  assert.deepEqual(fal.parseSubmission({
    request_id: 'fal-1',
    status_url: 'https://queue.fal.test/status',
    response_url: 'https://queue.fal.test/result'
  }), {
    requestId: 'fal-1',
    state: 'pending',
    statusUrl: 'https://queue.fal.test/status',
    resultUrl: 'https://queue.fal.test/result'
  });
  assert.deepEqual(fal.parseStatus(
    { status: 'COMPLETED', payload: { image: { url: 'https://media.test/a.png' } } },
    {}
  ), {
    state: 'succeeded',
    resultUrl: undefined,
    output: { image: { url: 'https://media.test/a.png' } }
  });
  assert.deepEqual(kie.parseStatus({
    code: 200,
    data: {
      state: 'success',
      resultJson: '{"resultUrls":["https://media.test/a.mp4"]}'
    }
  }), {
    state: 'succeeded',
    output: { resultUrls: ['https://media.test/a.mp4'] }
  });
  assert.deepEqual(replicate.parseSubmission({
    id: 'replicate-1',
    status: 'succeeded',
    output: ['https://media.test/a.mp3']
  }), {
    requestId: 'replicate-1',
    state: 'succeeded',
    output: ['https://media.test/a.mp3'],
    statusUrl: undefined
  });
});

test('provider output extraction validates paths and preserves media metadata', () => {
  assert.deepEqual(extractProviderOutput({
    payload: {
      images: [{
        url: 'https://media.example.test/result.png',
        content_type: 'image/png',
        file_size: 42
      }]
    }
  }, { outputPath: 'payload.images.0', type: 'image' }), {
    url: 'https://media.example.test/result.png',
    mimeType: 'image/png',
    size: 42
  });

  assert.deepEqual(
    extractProviderOutput('{"transcript":{"text":"hello"}}', {
      outputPath: 'transcript.text',
      type: 'text'
    }),
    { text: 'hello' }
  );
  assert.throws(
    () => extractProviderOutput({}, { outputPath: '__proto__.url' }),
    /output path/i
  );
  assert.throws(
    () => extractProviderOutput('{broken', { type: 'image' }),
    /invalid result data/i
  );
});
