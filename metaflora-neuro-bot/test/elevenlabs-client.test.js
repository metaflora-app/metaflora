import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ElevenLabsApiError,
  createElevenLabsClient
} from '../src/elevenlabs-client.js';

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) }
  });
}

function binaryResponse(body = [1, 2, 3], init = {}) {
  return new Response(Uint8Array.from(body), {
    status: init.status ?? 200,
    headers: {
      'content-type': init.contentType ?? 'audio/mpeg',
      ...(init.headers ?? {})
    }
  });
}

function recorder(responses) {
  const calls = [];
  return {
    calls,
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      const response = responses.shift();
      if (!response) throw new Error('unexpected request');
      return response;
    }
  };
}

function sample(name = 'sample.mp3', type = 'audio/mpeg') {
  return new File([Uint8Array.from([7, 8, 9])], name, { type });
}

test('client requires an injected API key and never puts it in the URL', async () => {
  assert.throws(
    () => createElevenLabsClient({ apiKey: '   ', fetchImpl: async () => {} }),
    /api key/i
  );
  assert.throws(
    () => createElevenLabsClient({ apiKey: 'secret', fetchImpl: null }),
    /fetch/i
  );

  const recorded = recorder([jsonResponse({ voices: [] })]);
  const client = createElevenLabsClient({
    apiKey: '  secret-key  ',
    fetchImpl: recorded.fetch
  });
  await client.listVoices({ pageSize: 20, search: 'диктор' });

  const [{ url, init }] = recorded.calls;
  assert.equal(
    url,
    'https://api.elevenlabs.io/v2/voices?page_size=20&search=%D0%B4%D0%B8%D0%BA%D1%82%D0%BE%D1%80'
  );
  assert.equal(init.headers['xi-api-key'], 'secret-key');
  assert.doesNotMatch(url, /secret-key/u);
});

test('JSON generation endpoints return binary media with response metadata', async () => {
  const recorded = recorder([
    binaryResponse([1], { headers: { 'request-id': 'tts-1' } }),
    binaryResponse([2]),
    binaryResponse([3]),
    binaryResponse([4], { headers: { 'song-id': 'song-1' } })
  ]);
  const client = createElevenLabsClient({ apiKey: 'key', fetchImpl: recorded.fetch });

  assert.deepEqual(
    await client.textToSpeech({
      voiceId: 'voice_1',
      text: 'привет',
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
      voiceSettings: { stability: 0.4 }
    }),
    {
      data: Uint8Array.from([1]),
      contentType: 'audio/mpeg',
      requestId: 'tts-1',
      songId: null
    }
  );
  await client.createDialogue({
    inputs: [
      { text: 'привет', voiceId: 'voice_1' },
      { text: 'добрый день', voiceId: 'voice_2' }
    ]
  });
  await client.createSoundEffect({
    text: 'шаги по снегу',
    durationSeconds: 4,
    loop: false
  });
  const music = await client.composeMusic({
    prompt: 'спокойный инструментал без вокала',
    musicLengthMs: 30_000,
    forceInstrumental: true,
    modelId: 'music_v2'
  });

  assert.deepEqual(music, {
    data: Uint8Array.from([4]),
    contentType: 'audio/mpeg',
    requestId: null,
    songId: 'song-1'
  });
  assert.equal(
    recorded.calls[0].url,
    'https://api.elevenlabs.io/v1/text-to-speech/voice_1?output_format=mp3_44100_128'
  );
  assert.deepEqual(JSON.parse(recorded.calls[0].init.body), {
    text: 'привет',
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.4 }
  });
  assert.equal(recorded.calls[1].url, 'https://api.elevenlabs.io/v1/text-to-dialogue');
  assert.deepEqual(JSON.parse(recorded.calls[1].init.body), {
    inputs: [
      { text: 'привет', voice_id: 'voice_1' },
      { text: 'добрый день', voice_id: 'voice_2' }
    ],
    model_id: 'eleven_v3'
  });
  assert.equal(recorded.calls[2].url, 'https://api.elevenlabs.io/v1/sound-generation');
  assert.deepEqual(JSON.parse(recorded.calls[2].init.body), {
    text: 'шаги по снегу',
    duration_seconds: 4,
    loop: false
  });
  assert.deepEqual(JSON.parse(recorded.calls[3].init.body), {
    prompt: 'спокойный инструментал без вокала',
    music_length_ms: 30000,
    model_id: 'music_v2',
    force_instrumental: true
  });
});

test('multipart audio endpoints use documented field names and do not set content-type manually', async () => {
  const recorded = recorder([
    binaryResponse([1]),
    binaryResponse([2]),
    jsonResponse({ voice_id: 'clone_1', requires_verification: false }),
    jsonResponse({ text: 'готово', language_code: 'ru', words: [] })
  ]);
  const client = createElevenLabsClient({ apiKey: 'key', fetchImpl: recorded.fetch });
  const audio = sample();

  await client.isolateAudio({ file: audio, fileFormat: 'other' });
  await client.changeVoice({
    voiceId: 'voice_1',
    file: audio,
    modelId: 'eleven_multilingual_sts_v2',
    removeBackgroundNoise: true
  });
  assert.deepEqual(await client.cloneVoice({
    name: 'мой голос',
    files: [audio, sample('second.wav', 'audio/wav')],
    description: 'спокойный тембр',
    labels: { language: 'ru' },
    removeBackgroundNoise: false
  }), {
    voice_id: 'clone_1',
    requires_verification: false
  });
  assert.deepEqual(await client.speechToText({
    file: audio,
    modelId: 'scribe_v2',
    languageCode: 'ru',
    diarize: true,
    numSpeakers: 2
  }), {
    text: 'готово',
    language_code: 'ru',
    words: []
  });

  const [isolation, changer, clone, transcript] = recorded.calls;
  assert.equal(isolation.url, 'https://api.elevenlabs.io/v1/audio-isolation');
  assert.equal(isolation.init.body.get('audio'), audio);
  assert.equal(isolation.init.body.get('file_format'), 'other');
  assert.equal(changer.url, 'https://api.elevenlabs.io/v1/speech-to-speech/voice_1');
  assert.equal(changer.init.body.get('audio'), audio);
  assert.equal(changer.init.body.get('model_id'), 'eleven_multilingual_sts_v2');
  assert.equal(changer.init.body.get('remove_background_noise'), 'true');
  assert.equal(clone.url, 'https://api.elevenlabs.io/v1/voices/add');
  assert.equal(clone.init.body.getAll('files')[0], audio);
  assert.equal(clone.init.body.getAll('files')[1].name, 'second.wav');
  assert.equal(clone.init.body.get('labels'), '{"language":"ru"}');
  assert.equal(transcript.url, 'https://api.elevenlabs.io/v1/speech-to-text');
  assert.equal(transcript.init.body.get('file'), audio);
  assert.equal(transcript.init.body.get('model_id'), 'scribe_v2');
  assert.equal(transcript.init.body.get('diarize'), 'true');
  assert.equal(transcript.init.body.get('num_speakers'), '2');

  for (const call of recorded.calls) {
    assert.equal(call.init.headers['content-type'], undefined);
  }
});

test('dubbing supports file and URL sources, then exposes status and binary result', async () => {
  const recorded = recorder([
    jsonResponse({ dubbing_id: 'dub_1', expected_duration_sec: 15 }),
    jsonResponse({ dubbing_id: 'dub_1', status: 'dubbed', target_languages: ['ru'] }),
    binaryResponse([5, 6], { contentType: 'video/mp4' }),
    jsonResponse({ dubbing_id: 'dub_2', expected_duration_sec: 12 })
  ]);
  const client = createElevenLabsClient({ apiKey: 'key', fetchImpl: recorded.fetch });

  const created = await client.createDubbing({
    file: sample('source.mp4', 'video/mp4'),
    targetLang: 'ru',
    sourceLang: 'en',
    name: 'ролик',
    numSpeakers: 2
  });
  assert.equal(created.dubbing_id, 'dub_1');
  assert.equal((await client.getDubbing('dub_1')).status, 'dubbed');
  assert.deepEqual(await client.getDubbingAudio('dub_1', 'ru'), {
    data: Uint8Array.from([5, 6]),
    contentType: 'video/mp4',
    requestId: null,
    songId: null
  });
  await client.createDubbing({
    sourceUrl: 'https://media.example.test/source.mp3',
    targetLang: 'de'
  });

  assert.equal(recorded.calls[0].init.body.get('file').name, 'source.mp4');
  assert.equal(recorded.calls[0].init.body.get('target_lang'), 'ru');
  assert.equal(recorded.calls[0].init.body.get('num_speakers'), '2');
  assert.equal(recorded.calls[1].url, 'https://api.elevenlabs.io/v1/dubbing/dub_1');
  assert.equal(
    recorded.calls[2].url,
    'https://api.elevenlabs.io/v1/dubbing/dub_1/audio/ru'
  );
  assert.equal(recorded.calls[3].init.body.get('source_url'), 'https://media.example.test/source.mp3');
});

test('voice management uses v2 search and v1 get/delete endpoints', async () => {
  const recorded = recorder([
    jsonResponse({ voices: [{ voice_id: 'voice_1' }], has_more: false }),
    jsonResponse({ voice_id: 'voice_1', name: 'голос' }),
    jsonResponse({ status: 'ok' })
  ]);
  const client = createElevenLabsClient({ apiKey: 'key', fetchImpl: recorded.fetch });

  assert.equal((await client.listVoices({ voiceType: 'personal' })).voices.length, 1);
  assert.equal((await client.getVoice('voice_1')).name, 'голос');
  assert.deepEqual(await client.deleteVoice('voice_1'), { status: 'ok' });

  assert.equal(recorded.calls[0].url, 'https://api.elevenlabs.io/v2/voices?voice_type=personal');
  assert.equal(recorded.calls[1].url, 'https://api.elevenlabs.io/v1/voices/voice_1');
  assert.equal(recorded.calls[2].url, 'https://api.elevenlabs.io/v1/voices/voice_1');
  assert.equal(recorded.calls[2].init.method, 'DELETE');
});

test('shared curated voices use the official endpoint and opaque pagination cursor', async () => {
  const recorded = recorder([jsonResponse({ voices: [], has_more: false })]);
  const client = createElevenLabsClient({ apiKey: 'key', fetchImpl: recorded.fetch });
  await client.listSharedVoices({ pageSize: 100, lastSortId: 'cursor_1' });
  assert.match(recorded.calls[0].url, /\/v1\/shared-voices/u);
  assert.match(recorded.calls[0].url, /page_size=100/u);
  assert.match(recorded.calls[0].url, /last_sort_id=cursor_1/u);
});

test('voice preview fetches only an approved provider URL without forwarding the api key', async () => {
  const recorded = recorder([
    jsonResponse({
      voice_id: 'voice_1',
      preview_url: 'https://storage.googleapis.com/eleven-public-prod/voice_1/preview.mp3'
    }),
    binaryResponse([9, 8, 7])
  ]);
  const client = createElevenLabsClient({ apiKey: 'secret-key', fetchImpl: recorded.fetch });

  assert.deepEqual(await client.previewVoice({ voiceId: 'voice_1' }), {
    data: Uint8Array.from([9, 8, 7]),
    contentType: 'audio/mpeg',
    requestId: null,
    songId: null
  });
  assert.equal(recorded.calls[0].init.headers['xi-api-key'], 'secret-key');
  assert.equal(recorded.calls[1].init.headers?.['xi-api-key'], undefined);
  assert.doesNotMatch(recorded.calls[1].url, /secret-key/u);
});

test('voice preview recognizes WAV bytes when provider storage sends text/plain', async () => {
  const wavHeader = [
    ...Buffer.from('RIFF'),
    36, 0, 0, 0,
    ...Buffer.from('WAVE'),
    ...Buffer.from('fmt ')
  ];
  const recorded = recorder([
    jsonResponse({
      voice_id: 'voice_1',
      preview_url: 'https://storage.googleapis.com/eleven-public-prod/voice_1/preview.wav'
    }),
    binaryResponse(wavHeader, { contentType: 'text/plain' })
  ]);
  const client = createElevenLabsClient({ apiKey: 'secret-key', fetchImpl: recorded.fetch });
  const preview = await client.previewVoice({ voiceId: 'voice_1' });

  assert.equal(preview.contentType, 'audio/wav');
  assert.deepEqual(preview.data, Uint8Array.from(wavHeader));
});

test('voice preview blocks provider-supplied URLs outside approved storage hosts', async () => {
  const recorded = recorder([
    jsonResponse({
      voice_id: 'voice_1',
      preview_url: 'https://127.0.0.1/internal.mp3'
    })
  ]);
  const client = createElevenLabsClient({ apiKey: 'key', fetchImpl: recorded.fetch });

  await assert.rejects(client.previewVoice({ voiceId: 'voice_1' }), /preview url/i);
  assert.equal(recorded.calls.length, 1);
});

test('voice preview rejects oversized provider media before delivery', async () => {
  const client = createElevenLabsClient({
    apiKey: 'test-key',
    fetchImpl: async (url) => String(url).includes('/v1/voices/')
      ? jsonResponse({
          voice_id: 'voice_1',
          preview_url: 'https://storage.googleapis.com/eleven-public-prod/voice_1/preview.mp3'
        })
      : new Response(new Uint8Array([0x49, 0x44, 0x33]), {
          status: 200,
          headers: { 'content-type': 'audio/mpeg', 'content-length': String(10 * 1024 * 1024 + 1) }
        })
  });

  await assert.rejects(() => client.previewVoice({ voiceId: 'voice_1' }), /too large/i);
});

test('client validates identifiers, source choices and provider failures without leaking secrets', async () => {
  const recorded = recorder([
    jsonResponse(
      { detail: { message: 'provider detail containing secret-key' } },
      { status: 401, headers: { 'request-id': 'request_1' } }
    )
  ]);
  const client = createElevenLabsClient({ apiKey: 'secret-key', fetchImpl: recorded.fetch });

  assert.throws(
    () => client.textToSpeech({ voiceId: '../voices', text: 'hello' }),
    /voice id/i
  );
  assert.throws(
    () => client.createDubbing({
      file: sample(),
      sourceUrl: 'https://example.test/a.mp3',
      targetLang: 'ru'
    }),
    /exactly one/i
  );
  assert.throws(
    () => client.speechToText({ modelId: 'scribe_v2' }),
    /exactly one/i
  );
  await assert.rejects(
    client.listVoices(),
    (error) => {
      assert.equal(error instanceof ElevenLabsApiError, true);
      assert.equal(error.status, 401);
      assert.equal(error.requestId, 'request_1');
      assert.doesNotMatch(error.message, /secret-key/u);
      return true;
    }
  );
});
