import test from 'node:test';
import assert from 'node:assert/strict';

import {
  seedanceProviderRoute,
  serializeSeedanceProviderRequest
} from '../src/seedance-provider-contract.js';

for (const resolution of ['1080p', '4k']) {
  test(`Seedance 2.0 preserves ${resolution} in Polza and RouterAI payloads`, () => {
    const input = {
      modelId: 'seedance_20',
      prompt: 'cinematic city at night',
      settings: {
        resolution,
        duration: '15',
        aspect_ratio: '16:9',
        generate_audio: 'true'
      }
    };
    const polza = serializeSeedanceProviderRequest('polza', input);
    const routerai = serializeSeedanceProviderRequest('routerai', input);

    assert.equal(polza.body.model, 'bytedance/seedance-2');
    assert.equal(polza.body.input.resolution, resolution);
    assert.equal(routerai.body.model, 'bytedance/seedance-2.0');
    assert.equal(routerai.body.resolution, resolution === '4k' ? '4K' : resolution);
    assert.equal(routerai.body.duration, 15);
    assert.equal(routerai.body.generate_audio, true);
  });
}

test('Fast and Mini keep their provider-confirmed 720p ceiling', () => {
  for (const modelId of ['seedance_20_fast', 'seedance_20_mini']) {
    assert.throws(() => serializeSeedanceProviderRequest('polza', {
      modelId,
      prompt: 'test',
      settings: { resolution: '1080p' }
    }), /resolution/u);
  }
});

test('Seedance 2.5 RouterAI payload keeps image, video and audio references', () => {
  const request = serializeSeedanceProviderRequest('routerai', {
    modelId: 'seedance_25',
    prompt: 'cinematic product launch',
    settings: {
      resolution: '720p',
      duration: '30',
      aspect_ratio: '16:9',
      generate_audio: 'true'
    },
    referenceImageUrls: ['https://cdn.example/ref-1.png'],
    referenceVideoUrls: ['https://cdn.example/ref-2.mp4'],
    referenceAudioUrls: ['https://cdn.example/ref-3.mp3']
  });

  assert.deepEqual(request.body.input_references, [
    {
      type: 'image_url',
      image_url: { url: 'https://cdn.example/ref-1.png' }
    },
    {
      type: 'video_url',
      video_url: { url: 'https://cdn.example/ref-2.mp4' }
    },
    {
      type: 'audio_url',
      audio_url: { url: 'https://cdn.example/ref-3.mp3' }
    }
  ]);
});

test('RouterAI Seedance 2.0 still rejects video and audio references', () => {
  assert.throws(() => serializeSeedanceProviderRequest('routerai', {
    modelId: 'seedance_20',
    prompt: 'test',
    referenceVideoUrls: ['https://cdn.example/ref.mp4']
  }), /2\.0 accepts only image/u);
});

test('Seedance routes use exact provider identifiers', () => {
  assert.deepEqual(seedanceProviderRoute('polza', 'seedance_20'), {
    provider: 'polza',
    endpoint: 'https://polza.ai/api/v1/media',
    providerModelId: 'bytedance/seedance-2'
  });
  assert.deepEqual(seedanceProviderRoute('routerai', 'seedance_20'), {
    provider: 'routerai',
    endpoint: 'https://routerai.ru/api/v1/videos',
    providerModelId: 'bytedance/seedance-2.0'
  });
  assert.deepEqual(seedanceProviderRoute('routerai', 'seedance_25'), {
    provider: 'routerai',
    endpoint: 'https://routerai.ru/api/v1/videos',
    providerModelId: 'bytedance/seedance-2.5'
  });
  assert.throws(() => seedanceProviderRoute('polza', 'seedance_25'), /unsupported/i);
});
