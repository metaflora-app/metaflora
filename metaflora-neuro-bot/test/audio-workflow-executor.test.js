import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AUDIO_WORKFLOW_EXECUTION_ROUTES,
  createAudioWorkflowExecutor,
  createMemoryWorkflowStageStore,
  listAudioWorkflowExecutionRoutes,
  renderSubtitles,
  splitLongformText
} from '../src/audio-workflow-executor.js';
import { audioWorkflowCatalog } from '../src/audio-workflow-catalog.js';

const reservation = (events, total = 20) => ({
  quote: async ({ workflowId }) => ({ currency: 'METACOIN', total, workflowId }),
  reserve: async (payload) => {
    events.push(['reserve', payload]);
    return { id: `reservation:${payload.requestKey}`, ...payload };
  },
  settle: async (payload) => {
    events.push(['settle', payload]);
    return payload;
  },
  release: async (payload) => {
    events.push(['release', payload]);
    return payload;
  }
});

test('splitLongformText keeps content in order and respects the chunk limit', () => {
  const source = [
    'первый абзац содержит несколько коротких предложений. он нужен для проверки границ.',
    'второй абзац заметно длиннее и тоже должен остаться в исходном порядке без потери слов.',
    'последняя строка.'
  ].join('\n\n');
  const chunks = splitLongformText(source, { maxCharacters: 100 });

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 100));
  assert.equal(
    chunks.join(' ').replace(/\s+/gu, ' ').trim(),
    source.replace(/\s+/gu, ' ').trim()
  );
});

test('execution contract covers all 30 catalog workflows exactly once', () => {
  const catalogIds = audioWorkflowCatalog.map(({ id }) => id).sort();
  const routeIds = AUDIO_WORKFLOW_EXECUTION_ROUTES.map(({ workflowId }) => workflowId).sort();

  assert.equal(catalogIds.length, 30);
  assert.equal(new Set(routeIds).size, 30);
  assert.deepEqual(routeIds, catalogIds);
  assert.ok(AUDIO_WORKFLOW_EXECUTION_ROUTES.every(({ operation, inputType }) =>
    typeof operation === 'string' && operation.length > 2
    && typeof inputType === 'string' && inputType.length > 2
  ));
});

test('route inspection distinguishes runnable and inactive workflows without provider calls', () => {
  let calls = 0;
  const dependencies = {
    toolExecutor: async () => {
      calls += 1;
    },
    elevenService: {
      textToSpeech: async () => {
        calls += 1;
      },
      changeVoice: async () => {
        calls += 1;
      }
    }
  };
  const routes = listAudioWorkflowExecutionRoutes(dependencies);

  assert.equal(routes.length, 30);
  assert.equal(routes.find(({ workflowId }) => workflowId === 'voice_tts').state, 'runnable');
  assert.equal(routes.find(({ workflowId }) => workflowId === 'voice_dialogue').state, 'inactive');
  assert.equal(routes.find(({ workflowId }) => workflowId === 'music_song').state, 'inactive');
  assert.equal(routes.find(({ workflowId }) => workflowId === 'voice_meeting').state, 'runnable');
  assert.equal(calls, 0);
});

test('splitLongformText rejects empty text and impossible limits', () => {
  assert.throws(() => splitLongformText('  '), /текст/i);
  assert.throws(() => splitLongformText('текст', { maxCharacters: 20 }), /не меньше 100/i);
});

test('renderSubtitles produces valid srt and vtt timestamps', () => {
  const segments = [
    { start: 0, end: 1.25, text: 'первая строка' },
    { start: 61.005, end: 63.1, text: 'вторая\nстрока' }
  ];

  assert.equal(renderSubtitles(segments, { format: 'srt' }), [
    '1',
    '00:00:00,000 --> 00:00:01,250',
    'первая строка',
    '',
    '2',
    '00:01:01,005 --> 00:01:03,100',
    'вторая строка'
  ].join('\n'));
  assert.equal(renderSubtitles(segments, { format: 'vtt' }), [
    'WEBVTT',
    '',
    '00:00:00.000 --> 00:00:01.250',
    'первая строка',
    '',
    '00:01:01.005 --> 00:01:03.100',
    'вторая строка'
  ].join('\n'));
});

test('renderSubtitles validates timestamped segments', () => {
  assert.throws(
    () => renderSubtitles([{ start: 3, end: 2, text: 'ошибка' }]),
    /временные границы/i
  );
  assert.throws(
    () => renderSubtitles([{ start: 0, end: 1, text: '' }]),
    /текст сегмента/i
  );
  assert.throws(
    () => renderSubtitles([{ start: 0, end: 1, text: 'текст' }], { format: 'txt' }),
    /srt и vtt/i
  );
});

test('long-form narration reserves once and returns a stitching manifest', async () => {
  const events = [];
  const speechCalls = [];
  const executor = createAudioWorkflowExecutor({
    toolExecutor: async () => {
      throw new Error('tool executor must not be used');
    },
    elevenService: {
      async textToSpeech(payload) {
        events.push(['speech', payload.idempotencyKey]);
        speechCalls.push(payload);
        return {
          type: 'audio',
          url: `https://audio.example.test/${speechCalls.length}.mp3`,
          durationSeconds: 30
        };
      }
    },
    llm: async () => {
      throw new Error('llm must not be used');
    },
    billing: reservation(events, 17),
    stageStore: createMemoryWorkflowStageStore()
  });
  const request = {
    workflowId: 'voice_longform',
    requestKey: 'message:10:100',
    inputs: {
      text: `${'абзац с осмысленным текстом. '.repeat(180)}конец.`,
      voice: { type: 'curated', id: 'voice-1' }
    },
    settings: { voiceId: 'voice-1', maxCharactersPerChunk: 600 }
  };

  const first = await executor.execute(request);
  const repeated = await executor.execute(request);

  assert.deepEqual(repeated, first);
  assert.ok(first.parts.length > 1);
  assert.equal(first.type, 'audio_manifest');
  assert.equal(first.workflowId, 'voice_longform');
  assert.equal(first.stitching.mode, 'ordered_crossfade');
  assert.equal(first.stitching.crossfadeMilliseconds, 80);
  assert.equal(first.reservation.currency, 'METACOIN');
  assert.equal(first.reservation.total, 17);
  assert.equal(speechCalls.length, first.parts.length);
  assert.deepEqual(
    speechCalls.map(({ idempotencyKey }, index) => idempotencyKey === `message:10:100:tts:${index + 1}`),
    speechCalls.map(() => true)
  );
  assert.equal(events.filter(([name]) => name === 'reserve').length, 1);
  assert.equal(events.filter(([name]) => name === 'settle').length, 1);
  assert.equal(events.filter(([name]) => name === 'release').length, 0);
  assert.equal(events[0][0], 'reserve');
});

test('meeting workflow runs transcription and summary once per stage', async () => {
  const events = [];
  const toolCalls = [];
  const llmCalls = [];
  const executor = createAudioWorkflowExecutor({
    toolExecutor: async (payload) => {
      events.push(['tool', payload.idempotencyKey]);
      toolCalls.push(payload);
      return {
        text: 'анна: обсуждаем запуск.\nборис: подготовлю расчёт.',
        segments: [
          { start: 0, end: 2, text: 'обсуждаем запуск', speaker: 'анна' },
          { start: 2, end: 4, text: 'подготовлю расчёт', speaker: 'борис' }
        ]
      };
    },
    elevenService: {},
    llm: async (payload) => {
      events.push(['llm', payload.idempotencyKey]);
      llmCalls.push(payload);
      return {
        summary: 'обсудили запуск',
        decisions: ['запуск продолжается'],
        actionItems: [{ owner: 'борис', task: 'подготовить расчёт' }]
      };
    },
    billing: reservation(events, 9)
  });
  const request = {
    workflowId: 'voice_meeting',
    requestKey: 'message:10:101',
    inputs: { audio: 'telegram-file-id' },
    settings: { summary: 'подробная', action_items: true }
  };

  const first = await executor.execute(request);
  const repeated = await executor.execute(request);

  assert.deepEqual(repeated, first);
  assert.equal(first.type, 'meeting_manifest');
  assert.equal(first.transcript.text, 'анна: обсуждаем запуск.\nборис: подготовлю расчёт.');
  assert.equal(first.analysis.actionItems[0].owner, 'борис');
  assert.equal(toolCalls.length, 1);
  assert.equal(toolCalls[0].toolId, 'audio_stt');
  assert.equal(toolCalls[0].idempotencyKey, 'message:10:101:transcribe');
  assert.equal(llmCalls.length, 1);
  assert.equal(llmCalls[0].task, 'meeting_summary');
  assert.equal(llmCalls[0].idempotencyKey, 'message:10:101:summarize');
  assert.equal(events.filter(([name]) => name === 'reserve').length, 1);
  assert.equal(events.filter(([name]) => name === 'settle').length, 1);
});

test('subtitle workflow renders the requested file from timestamped transcription', async () => {
  const events = [];
  const executor = createAudioWorkflowExecutor({
    toolExecutor: async ({ idempotencyKey }) => {
      events.push(['tool', idempotencyKey]);
      return {
        segments: [
          { start: 0, end: 1.5, text: 'готово' },
          { start: 2, end: 3, text: 'можно смотреть' }
        ]
      };
    },
    elevenService: {},
    llm: async () => {
      throw new Error('llm must not be used');
    },
    billing: reservation(events, 4)
  });

  const result = await executor.execute({
    workflowId: 'voice_subtitles',
    requestKey: 'message:10:102',
    inputs: { video: 'telegram-video-id' },
    settings: { format: 'vtt', language: 'русский' }
  });

  assert.equal(result.type, 'subtitle_manifest');
  assert.equal(result.file.extension, 'vtt');
  assert.match(result.file.content, /^WEBVTT\n\n/u);
  assert.match(result.file.content, /00:00:02\.000 --> 00:00:03\.000/u);
  assert.equal(result.segments.length, 2);
});

test('failed workflow releases its reservation and does not settle it', async () => {
  const events = [];
  const executor = createAudioWorkflowExecutor({
    toolExecutor: async () => {
      throw new Error('provider unavailable');
    },
    elevenService: {},
    llm: async () => ({}),
    billing: reservation(events, 5)
  });

  await assert.rejects(executor.execute({
    workflowId: 'voice_meeting',
    requestKey: 'message:10:103',
    inputs: { audio: 'telegram-file-id' }
  }), /provider unavailable/i);

  assert.equal(events.filter(([name]) => name === 'reserve').length, 1);
  assert.equal(events.filter(([name]) => name === 'settle').length, 0);
  assert.equal(events.filter(([name]) => name === 'release').length, 1);
});

test('executor rejects unsupported workflows before reserving metacoins', async () => {
  const events = [];
  const executor = createAudioWorkflowExecutor({
    toolExecutor: async () => ({}),
    elevenService: {},
    llm: async () => ({}),
    billing: reservation(events)
  });

  await assert.rejects(executor.execute({
    workflowId: 'unknown_workflow',
    requestKey: 'message:10:104',
    inputs: {}
  }), /не поддерживается/i);
  assert.equal(events.length, 0);
});

test('inactive provider route refuses before quote, reserve, or external call', async () => {
  const events = [];
  let externalCalls = 0;
  const executor = createAudioWorkflowExecutor({
    toolExecutor: async () => {
      externalCalls += 1;
    },
    elevenService: {},
    llm: async () => {
      externalCalls += 1;
    },
    billing: reservation(events)
  });

  await assert.rejects(executor.execute({
    workflowId: 'music_song',
    requestKey: 'message:10:inactive',
    inputs: { prompt: 'короткая песня' }
  }), /недоступен/i);

  assert.equal(externalCalls, 0);
  assert.equal(events.length, 0);
});

test('voice cloning requires explicit consent before billing or provider execution', async () => {
  const events = [];
  let cloneCalls = 0;
  const executor = createAudioWorkflowExecutor({
    toolExecutor: async () => ({}),
    elevenService: {
      async cloneVoice() {
        cloneCalls += 1;
      }
    },
    llm: async () => ({}),
    billing: reservation(events)
  });

  await assert.rejects(executor.execute({
    workflowId: 'voice_clone',
    requestKey: 'message:10:clone',
    inputs: {
      sample_audio: { bytes: Buffer.from('sample'), mimeType: 'audio/mpeg' },
      voice_name: 'мой голос'
    }
  }), /подтвердить право/i);

  assert.equal(cloneCalls, 0);
  assert.equal(events.length, 0);
});

test('generic tool, ElevenLabs, and music routes reserve before their idempotent provider stage', async () => {
  const events = [];
  const providerCalls = [];
  const elevenService = {
    async textToSpeech(payload) {
      providerCalls.push(['eleven', payload]);
      events.push(['provider', 'eleven']);
      return { audio: Buffer.from('voice'), contentType: 'audio/mpeg' };
    }
  };
  const musicExecutor = async (payload) => {
    providerCalls.push(['music', payload]);
    events.push(['provider', 'music']);
    return { url: 'https://audio.example.test/song.mp3' };
  };
  const executor = createAudioWorkflowExecutor({
    toolExecutor: async (payload) => {
      providerCalls.push(['tool', payload]);
      events.push(['provider', 'tool']);
      return { text: 'готово' };
    },
    elevenService,
    musicExecutor,
    llm: async () => ({}),
    billing: reservation(events, 6)
  });

  await executor.execute({
    workflowId: 'voice_tts',
    requestKey: 'message:10:tts',
    inputs: {
      text: 'короткая проверка',
      voice: { type: 'curated', id: 'voice-1' }
    }
  });
  await executor.execute({
    workflowId: 'voice_transcribe',
    requestKey: 'message:10:stt',
    inputs: { audio: 'telegram-audio-id' }
  });
  await executor.execute({
    workflowId: 'music_song',
    requestKey: 'message:10:song',
    inputs: { prompt: 'песня о летнем городе' }
  });

  assert.deepEqual(providerCalls.map(([adapter]) => adapter), ['eleven', 'tool', 'music']);
  assert.equal(providerCalls[0][1].idempotencyKey, 'message:10:tts:textToSpeech');
  assert.equal(providerCalls[1][1].idempotencyKey, 'message:10:stt:audio_stt');
  assert.equal(providerCalls[2][1].idempotencyKey, 'message:10:song:generate_song');
  for (const adapter of ['eleven', 'tool', 'music']) {
    const providerIndex = events.findIndex(([name, value]) => name === 'provider' && value === adapter);
    const precedingReserve = events
      .slice(0, providerIndex)
      .some(([name]) => name === 'reserve');
    assert.equal(precedingReserve, true);
  }
});

test('concurrent retries share the same pending workflow', async () => {
  const events = [];
  let releaseSpeech;
  const speechReady = new Promise((resolve) => {
    releaseSpeech = resolve;
  });
  let calls = 0;
  const executor = createAudioWorkflowExecutor({
    toolExecutor: async () => ({}),
    elevenService: {
      async textToSpeech() {
        calls += 1;
        await speechReady;
        return { type: 'audio', url: 'https://audio.example.test/one.mp3' };
      }
    },
    llm: async () => ({}),
    billing: reservation(events, 3)
  });
  const request = {
    workflowId: 'voice_longform',
    requestKey: 'message:10:105',
    inputs: {
      text: 'короткий текст для озвучки',
      voice: { type: 'curated', id: 'voice-1' }
    }
  };

  const first = executor.execute(request);
  const second = executor.execute(request);
  releaseSpeech();

  assert.deepEqual(await second, await first);
  assert.equal(calls, 1);
  assert.equal(events.filter(([name]) => name === 'reserve').length, 1);
});

test('production executor refuses an in-memory stage store', () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.throws(() => createAudioWorkflowExecutor({
      toolExecutor: async () => ({}),
      elevenService: {},
      llm: async () => ({}),
      billing: reservation([])
    }), /durable stage store/i);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test('music marks the paid provider boundary and never retries an unknown outcome', async () => {
  let calls = 0;
  let unknown = false;
  const stageStore = {
    async run(key, operation) {
      if (key.includes(':generate_song')) {
        if (unknown) throw new Error('manual_reconcile: external outcome is unknown.');
        let started = false;
        try {
          return await operation({ markExternalStarted() { started = true; } });
        } catch (error) {
          if (started) {
            unknown = true;
            throw new Error('outcome_unknown: manual reconciliation required.', { cause: error });
          }
          throw error;
        }
      }
      return operation({ markExternalStarted() {} });
    }
  };
  const events = [];
  const executor = createAudioWorkflowExecutor({
    toolExecutor: async () => ({}),
    elevenService: {},
    llm: async () => ({}),
    musicExecutor: async ({ markExternalStarted }) => {
      calls += 1;
      markExternalStarted();
      throw new Error('socket closed after submit');
    },
    billing: reservation(events, 5),
    stageStore
  });
  const request = {
    workflowId: 'music_song', requestKey: 'music:10:unknown',
    inputs: { prompt: 'песня о городе' }
  };
  await assert.rejects(executor.execute(request), /outcome_unknown/);
  await assert.rejects(executor.execute(request), /manual_reconcile/);
  assert.equal(calls, 1);
  assert.equal(events.some(([name]) => name === 'release'), false);
});
