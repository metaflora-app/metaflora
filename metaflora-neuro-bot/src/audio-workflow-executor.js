import { audioWorkflowCatalog } from './audio-workflow-catalog.js';
import { mixDubbedVideo } from './audio-video-mixer.js';

const route = (workflowId, adapter, operation, inputType) => Object.freeze({
  workflowId,
  adapter,
  operation,
  inputType
});

/*
 * Every public workflow has an explicit execution contract. A route is not the
 * same as a promise that a provider supports it: availability is resolved from
 * the injected adapters before quoting or reserving metacoins.
 */
export const AUDIO_WORKFLOW_EXECUTION_ROUTES = Object.freeze([
  route('music_song', 'music', 'generate_song', 'text'),
  route('music_instrumental', 'music', 'generate_song', 'text'),
  route('music_video_score', 'music', 'score_video', 'video+text'),
  route('music_jingle', 'tool', 'audio_music', 'text'),
  route('music_loop', 'music', 'generate_loop', 'text'),
  route('music_hum_to_track', 'music', 'hum_to_track', 'audio+text'),
  route('music_extend', 'music', 'extend_track', 'audio'),
  route('music_rework', 'music', 'rework_track', 'audio+text'),
  route('music_remix', 'music', 'remix_track', 'audio+text'),
  route('music_mashup', 'music', 'mashup_tracks', 'audio[]'),
  route('music_cover', 'music', 'create_cover', 'audio[]'),
  route('audio_stems', 'music', 'separate_stems', 'audio'),
  route('audio_karaoke', 'music', 'create_karaoke', 'audio'),
  route('audio_master', 'music', 'master_audio', 'audio'),
  route('audio_scene_sfx', 'music', 'score_scene_sfx', 'video'),
  route('voice_tts', 'eleven', 'textToSpeech', 'text+voice'),
  route('voice_longform', 'composite', 'longform_tts', 'text+voice'),
  route('voice_dialogue', 'eleven', 'renderDialogue', 'text+voice[]'),
  route('voice_ad', 'eleven', 'createAdvertisement', 'text+voice'),
  route('voice_design', 'eleven', 'designVoice', 'text'),
  route('voice_clone', 'eleven', 'cloneVoice', 'audio+consent'),
  route('voice_change', 'eleven', 'changeVoice', 'audio+voice'),
  route('voice_dub_video', 'eleven', 'dubVideo', 'video+language'),
  route('voice_translate_preserve', 'eleven', 'translateSpeech', 'audio+language'),
  route('voice_replace_phrase', 'eleven', 'replacePhrase', 'audio+text'),
  route('voice_transcribe', 'tool', 'audio_stt', 'audio'),
  route('voice_meeting', 'composite', 'meeting_summary', 'audio'),
  route('voice_subtitles', 'composite', 'timed_subtitles', 'video'),
  route('voice_cleanup', 'tool', 'audio_isolation', 'audio'),
  route('voice_shorten', 'music', 'shorten_speech', 'audio')
]);

const ROUTES_BY_ID = new Map(
  AUDIO_WORKFLOW_EXECUTION_ROUTES.map((item) => [item.workflowId, item])
);
const CATALOG_BY_ID = new Map(audioWorkflowCatalog.map((item) => [item.id, item]));
const DEFAULT_ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  if (ArrayBuffer.isView(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
};

const requireNonEmptyString = (value, label, maxCharacters = 500_000) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} должен быть непустой строкой`);
  }
  if (value.length > maxCharacters) {
    throw new RangeError(`${label} превышает допустимую длину`);
  }
  return value.trim();
};

const hasInputValue = (value) => value !== undefined
  && value !== null
  && !(typeof value === 'string' && value.trim() === '');

function validateWorkflowInputs(workflowId, inputs, settings) {
  const workflow = CATALOG_BY_ID.get(workflowId);
  if (!workflow) throw new RangeError(`аудиосценарий ${workflowId} отсутствует в каталоге`);
  for (const input of workflow.inputs.filter((item) => item.required)) {
    const compatibilityValue = input.id === 'voice'
      ? settings.voiceId ?? settings.voice ?? DEFAULT_ELEVENLABS_VOICE_ID
      : undefined;
    if (!hasInputValue(inputs[input.id]) && !hasInputValue(compatibilityValue)) {
      throw new TypeError(`для ${workflowId} нужен вход ${input.id} типа ${input.type}`);
    }
  }
  if (workflowId === 'voice_clone') {
    const consent = inputs.consent ?? settings.consent;
    if (!consent || typeof consent !== 'object' || consent.confirmed !== true) {
      throw new TypeError('для клонирования нужно подтвердить право использовать голос');
    }
  }
}

function musicCallable(musicExecutor) {
  if (typeof musicExecutor === 'function') return musicExecutor;
  if (typeof musicExecutor?.execute === 'function') {
    return (payload) => musicExecutor.execute(payload);
  }
  return null;
}

function routeAvailability(routeContract, { toolExecutor, elevenService, musicExecutor }) {
  if (!routeContract) {
    return Object.freeze({ state: 'missing', reason: 'маршрут не описан' });
  }
  if (routeContract.adapter === 'tool') {
    return typeof toolExecutor === 'function'
      ? Object.freeze({ state: 'runnable' })
      : Object.freeze({ state: 'inactive', reason: 'исполнитель ИИ-инструментов не подключён' });
  }
  if (routeContract.adapter === 'eleven') {
    return typeof elevenService?.[routeContract.operation] === 'function'
      ? Object.freeze({ state: 'runnable' })
      : Object.freeze({
        state: 'inactive',
        reason: `провайдер не поддерживает операцию ${routeContract.operation}`
      });
  }
  if (routeContract.adapter === 'music') {
    const callable = musicCallable(musicExecutor);
    if (!callable) {
      return Object.freeze({
        state: 'inactive',
        reason: `музыкальный маршрут ${routeContract.operation} не подключён`
      });
    }
    if (
      typeof musicExecutor?.supports === 'function'
      && musicExecutor.supports(routeContract.operation) !== true
    ) {
      return Object.freeze({
        state: 'inactive',
        reason: `музыкальный маршрут ${routeContract.operation} не подтверждён`
      });
    }
    return Object.freeze({ state: 'runnable' });
  }
  if (routeContract.workflowId === 'voice_longform') {
    return typeof elevenService?.textToSpeech === 'function'
      ? Object.freeze({ state: 'runnable' })
      : Object.freeze({ state: 'inactive', reason: 'длинная озвучка не подключена' });
  }
  return Object.freeze({ state: 'runnable' });
}

export function listAudioWorkflowExecutionRoutes(dependencies = {}) {
  return AUDIO_WORKFLOW_EXECUTION_ROUTES.map((item) => Object.freeze({
    ...item,
    ...routeAvailability(item, dependencies)
  }));
}

const normalizeWhitespace = (value) => value.replace(/\s+/gu, ' ').trim();

function hardSplit(value, maxCharacters) {
  const words = normalizeWhitespace(value).split(' ');
  const chunks = [];
  let current = '';
  for (const word of words) {
    if (word.length > maxCharacters) {
      if (current) chunks.push(current);
      for (let offset = 0; offset < word.length; offset += maxCharacters) {
        chunks.push(word.slice(offset, offset + maxCharacters));
      }
      current = '';
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      current = candidate;
    } else {
      chunks.push(current);
      current = word;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function splitLongformText(text, { maxCharacters = 4_500 } = {}) {
  const source = requireNonEmptyString(text, 'текст');
  if (!Number.isInteger(maxCharacters) || maxCharacters < 100 || maxCharacters > 10_000) {
    throw new RangeError('размер части должен быть целым числом не меньше 100 и не больше 10000');
  }
  if (source.length <= maxCharacters) return Object.freeze([source]);

  const units = source
    .split(/(?<=[.!?…])\s+|\n{2,}/u)
    .map(normalizeWhitespace)
    .filter(Boolean)
    .flatMap((unit) => unit.length <= maxCharacters ? [unit] : hardSplit(unit, maxCharacters));
  const chunks = [];
  let current = '';
  for (const unit of units) {
    const candidate = current ? `${current} ${unit}` : unit;
    if (candidate.length <= maxCharacters) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = unit;
    }
  }
  if (current) chunks.push(current);
  return Object.freeze(chunks);
}

function subtitleTimestamp(seconds, separator) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError('временные границы субтитров должны быть неотрицательными числами');
  }
  const milliseconds = Math.round(seconds * 1_000);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1_000);
  const millis = milliseconds % 1_000;
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    `${String(secs).padStart(2, '0')}${separator}${String(millis).padStart(3, '0')}`
  ].join(':');
}

function validateSubtitleSegments(segments) {
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new TypeError('для субтитров нужны сегменты с временными границами');
  }
  let previousStart = -1;
  return segments.map((segment) => {
    const start = Number(segment?.start);
    const end = Number(segment?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || start < previousStart) {
      throw new RangeError('временные границы сегментов должны идти по порядку');
    }
    const text = normalizeWhitespace(requireNonEmptyString(segment?.text, 'текст сегмента'));
    previousStart = start;
    return Object.freeze({ ...segment, start, end, text });
  });
}

export function renderSubtitles(segments, { format = 'srt' } = {}) {
  if (!['srt', 'vtt'].includes(format)) {
    throw new RangeError('поддерживаются форматы srt и vtt');
  }
  const valid = validateSubtitleSegments(segments);
  const separator = format === 'srt' ? ',' : '.';
  const blocks = valid.map((segment, index) => {
    const timing = `${subtitleTimestamp(segment.start, separator)} --> ${subtitleTimestamp(segment.end, separator)}`;
    return format === 'srt'
      ? `${index + 1}\n${timing}\n${segment.text}`
      : `${timing}\n${segment.text}`;
  });
  return format === 'vtt'
    ? `WEBVTT\n\n${blocks.join('\n\n')}`
    : blocks.join('\n\n');
}

export function createMemoryWorkflowStageStore() {
  const completed = new Map();
  const pending = new Map();
  return Object.freeze({
    async get(key) {
      return completed.get(key);
    },
    async run(key, operation) {
      if (completed.has(key)) return completed.get(key);
      if (pending.has(key)) return pending.get(key);
      const task = Promise.resolve()
        .then(operation)
        .then((result) => {
          completed.set(key, deepFreeze(result));
          pending.delete(key);
          return completed.get(key);
        })
        .catch((error) => {
          pending.delete(key);
          throw error;
        });
      pending.set(key, task);
      return task;
    }
  });
}

function validateDependencies({ toolExecutor, elevenService, llm, billing, stageStore }) {
  if (typeof toolExecutor !== 'function') throw new TypeError('toolExecutor обязателен');
  if (!elevenService || typeof elevenService !== 'object') throw new TypeError('elevenService обязателен');
  if (typeof llm !== 'function') throw new TypeError('llm обязателен');
  for (const method of ['quote', 'reserve', 'settle', 'release']) {
    if (typeof billing?.[method] !== 'function') {
      throw new TypeError(`billing.${method} обязателен`);
    }
  }
  if (typeof stageStore?.run !== 'function') throw new TypeError('stageStore.run обязателен');
}

function validateQuote(quote, workflowId) {
  if (
    quote?.currency !== 'METACOIN'
    || !Number.isInteger(quote.total)
    || quote.total < 1
  ) {
    throw new TypeError(`для ${workflowId} нужна целая положительная цена в метакоинах`);
  }
  return deepFreeze({
    currency: quote.currency,
    total: quote.total,
    workflowId
  });
}

const publicReservation = (reserved, quote) => deepFreeze({
  id: reserved.id,
  currency: quote.currency,
  total: quote.total
});

function longformRunner({ elevenService, runStage }) {
  return async ({ requestKey, inputs, settings }) => {
    if (typeof elevenService.textToSpeech !== 'function') {
      throw new TypeError('elevenService.textToSpeech обязателен для длинной озвучки');
    }
    const chunks = splitLongformText(inputs.text, {
      maxCharacters: settings.maxCharactersPerChunk ?? 4_500
    });
    const parts = [];
    for (const [index, text] of chunks.entries()) {
      const partNumber = index + 1;
      const part = await runStage(`${requestKey}:tts:${partNumber}`, () =>
        elevenService.textToSpeech({
          text,
          voiceId: settings.voiceId,
          voice: inputs.voice,
          ownerTelegramId: inputs.ownerTelegramId ?? settings.ownerTelegramId,
          model: settings.model,
          outputFormat: settings.outputFormat,
          settings,
          idempotencyKey: `${requestKey}:tts:${partNumber}`
        })
      );
      parts.push(deepFreeze({ index: partNumber, textCharacters: text.length, ...part }));
    }
    return deepFreeze({
      type: 'audio_manifest',
      workflowId: 'voice_longform',
      parts,
      stitching: {
        mode: 'ordered_crossfade',
        crossfadeMilliseconds: 80,
        normalizeLoudness: true
      }
    });
  };
}

function meetingRunner({ toolExecutor, llm, runStage }) {
  return async ({ requestKey, inputs, settings }) => {
    const transcript = await runStage(`${requestKey}:transcribe`, () =>
      toolExecutor({
        toolId: 'audio_stt',
        telegramInput: inputs,
        settings: {
          diarization: settings.speaker_labels ?? true,
          language: settings.language
        },
        idempotencyKey: `${requestKey}:transcribe`
      })
    );
    const analysis = await runStage(`${requestKey}:summarize`, () =>
      llm({
        task: 'meeting_summary',
        transcript,
        detail: settings.summary ?? 'средняя',
        includeActionItems: settings.action_items ?? true,
        idempotencyKey: `${requestKey}:summarize`
      })
    );
    return deepFreeze({
      type: 'meeting_manifest',
      workflowId: 'voice_meeting',
      transcript,
      analysis
    });
  };
}

function subtitleRunner({ toolExecutor, runStage }) {
  return async ({ requestKey, inputs, settings }) => {
    const transcript = await runStage(`${requestKey}:transcribe`, () =>
      toolExecutor({
        toolId: 'audio_stt',
        telegramInput: inputs,
        settings: {
          timestamps: true,
          language: settings.language,
          diarization: settings.diarization ?? false
        },
        idempotencyKey: `${requestKey}:transcribe`
      })
    );
    const format = settings.format === 'vtt' ? 'vtt' : 'srt';
    const segments = validateSubtitleSegments(transcript.segments);
    return deepFreeze({
      type: 'subtitle_manifest',
      workflowId: 'voice_subtitles',
      segments,
      transcript,
      file: {
        extension: format,
        mimeType: format === 'vtt' ? 'text/vtt' : 'application/x-subrip',
        content: renderSubtitles(segments, { format })
      }
    });
  };
}

function toolRunner({ toolExecutor, runStage, routeContract }) {
  return async ({ requestKey, inputs, settings }) => {
    const result = await runStage(`${requestKey}:${routeContract.operation}`, () =>
      toolExecutor({
        toolId: routeContract.operation,
        telegramInput: inputs,
        settings,
        idempotencyKey: `${requestKey}:${routeContract.operation}`
      })
    );
    return deepFreeze({
      type: 'audio_workflow_result',
      workflowId: routeContract.workflowId,
      operation: routeContract.operation,
      result
    });
  };
}

function elevenInput(routeContract, inputs, settings, idempotencyKey) {
  const ownerTelegramId = inputs.ownerTelegramId ?? settings.ownerTelegramId;
  const common = {
    ownerTelegramId,
    model: settings.model,
    outputFormat: settings.outputFormat,
    settings,
    idempotencyKey
  };
  if (routeContract.workflowId === 'voice_tts' || routeContract.workflowId === 'voice_ad') {
    return { ...common, text: inputs.text, voice: inputs.voice };
  }
  if (routeContract.workflowId === 'voice_clone') {
    return {
      ...common,
      name: inputs.voice_name,
      sample: inputs.sample_audio,
      consent: inputs.consent ?? settings.consent,
      retentionDays: settings.retentionDays ?? settings.retention_days ?? 30
    };
  }
  if (routeContract.workflowId === 'voice_change') {
    return { ...common, audio: inputs.audio, voice: inputs.voice };
  }
  return { ...common, ...inputs };
}

function elevenRunner({ elevenService, runStage, routeContract }) {
  return async ({ requestKey, inputs, settings }) => {
    const idempotencyKey = `${requestKey}:${routeContract.operation}`;
    let result = await runStage(`${requestKey}:${routeContract.operation}`, (stage) =>
      elevenService[routeContract.operation](
        {
          ...elevenInput(routeContract, inputs, settings, idempotencyKey),
          markExternalStarted: stage?.markExternalStarted
        }
      )
    );
    if (routeContract.workflowId === 'voice_dub_video') {
      result = await runStage(`${requestKey}:ffmpeg-mux`, async () => ({
        ...result,
        media: await mixDubbedVideo({
          dubbedAudio: Buffer.from(result.dubbedAudio),
          originalVideo: Buffer.from(result.originalVideo),
          sourcePercent: result.audioMix.sourcePercent,
          mix: result.audioMix.mode === 'mix'
        }),
        dubbedAudio: undefined,
        originalVideo: undefined,
        contentType: 'video/mp4'
      }));
    }
    return deepFreeze({
      type: 'audio_workflow_result',
      workflowId: routeContract.workflowId,
      operation: routeContract.operation,
      result
    });
  };
}

function musicRunner({ musicExecutor, runStage, routeContract }) {
  const executeMusic = musicCallable(musicExecutor);
  return async ({ requestKey, inputs, settings }) => {
    const result = await runStage(`${requestKey}:${routeContract.operation}`, (stage) =>
      executeMusic({
        workflowId: routeContract.workflowId,
        operation: routeContract.operation,
        inputs,
        settings,
        idempotencyKey: `${requestKey}:${routeContract.operation}`,
        markExternalStarted: stage?.markExternalStarted
      })
    );
    return deepFreeze({
      type: 'audio_workflow_result',
      workflowId: routeContract.workflowId,
      operation: routeContract.operation,
      result
    });
  };
}

function createRunner(routeContract, dependencies) {
  if (routeContract.workflowId === 'voice_longform') {
    return longformRunner(dependencies);
  }
  if (routeContract.workflowId === 'voice_meeting') {
    return meetingRunner(dependencies);
  }
  if (routeContract.workflowId === 'voice_subtitles') {
    return subtitleRunner(dependencies);
  }
  if (routeContract.adapter === 'tool') {
    return toolRunner({ ...dependencies, routeContract });
  }
  if (routeContract.adapter === 'eleven') {
    return elevenRunner({ ...dependencies, routeContract });
  }
  if (routeContract.adapter === 'music') {
    return musicRunner({ ...dependencies, routeContract });
  }
  throw new RangeError(`неизвестный тип маршрута ${routeContract.adapter}`);
}

export function createAudioWorkflowExecutor({
  toolExecutor,
  elevenService,
  llm,
  billing,
  musicExecutor,
  stageStore
}) {
  if (!stageStore && process.env.NODE_ENV === 'production') {
    throw new TypeError('A durable stage store is required in production.');
  }
  stageStore ??= createMemoryWorkflowStageStore();
  validateDependencies({ toolExecutor, elevenService, llm, billing, stageStore });
  const runStage = (key, operation) => stageStore.run(`stage:${key}`, operation);
  if (
    musicExecutor !== undefined
    && typeof musicExecutor !== 'function'
    && typeof musicExecutor?.execute !== 'function'
  ) {
    throw new TypeError('musicExecutor должен быть функцией или объектом с execute');
  }
  const dependencies = { toolExecutor, elevenService, llm, musicExecutor, runStage };
  const runners = new Map();
  for (const routeContract of AUDIO_WORKFLOW_EXECUTION_ROUTES) {
    const availability = routeAvailability(routeContract, dependencies);
    if (availability.state === 'runnable') {
      runners.set(routeContract.workflowId, createRunner(routeContract, dependencies));
    }
  }

  return Object.freeze({
    listRoutes() {
      return listAudioWorkflowExecutionRoutes(dependencies);
    },
    getRoute(workflowId) {
      const routeContract = ROUTES_BY_ID.get(workflowId);
      if (!routeContract) return Object.freeze({ state: 'missing' });
      return Object.freeze({
        ...routeContract,
        ...routeAvailability(routeContract, dependencies)
      });
    },
    async execute(request) {
      const workflowId = requireNonEmptyString(request?.workflowId, 'workflowId', 100);
      const routeContract = ROUTES_BY_ID.get(workflowId);
      if (!routeContract) {
        throw new RangeError(`аудиосценарий ${workflowId} не поддерживается оркестратором`);
      }
      const availability = routeAvailability(routeContract, dependencies);
      if (availability.state !== 'runnable') {
        throw new RangeError(`аудиосценарий ${workflowId} недоступен: ${availability.reason}`);
      }
      const requestKey = requireNonEmptyString(request?.requestKey, 'requestKey', 512);
      const inputs = Object.freeze(
        request?.inputs && typeof request.inputs === 'object' ? { ...request.inputs } : {}
      );
      const settings = Object.freeze(
        request?.settings && typeof request.settings === 'object' ? { ...request.settings } : {}
      );
      validateWorkflowInputs(workflowId, inputs, settings);

      return stageStore.run(`workflow:${requestKey}:${workflowId}`, async () => {
        const quote = validateQuote(await billing.quote({
          workflowId,
          inputs,
          settings,
          requestKey
        }), workflowId);
        const reserved = await billing.reserve({
          requestKey,
          workflowId,
          currency: quote.currency,
          total: quote.total
        });
        if (!reserved?.id) throw new TypeError('резерв стоимости должен содержать id');
        try {
          const result = await runners.get(workflowId)({
            workflowId,
            requestKey,
            inputs,
            settings
          });
          if (workflowId !== 'voice_dub_video') {
            await billing.settle({
              reservationId: reserved.id,
              requestKey,
              workflowId,
              currency: quote.currency,
              total: quote.total
            });
          }
          return deepFreeze({
            ...result,
            reservation: {
              ...publicReservation(reserved, quote),
              status: workflowId === 'voice_dub_video' ? 'pending_delivery' : 'settled'
            }
          });
        } catch (error) {
          if (/outcome_unknown|manual_reconcile/u.test(String(error?.message ?? ''))) {
            throw error;
          }
          await billing.release({
            reservationId: reserved.id,
            requestKey,
            workflowId,
            reason: 'workflow_failed'
          });
          throw error;
        }
      });
    },
    async settleDelivery({ requestKey, reservation }) {
      return billing.settle({
        reservationId: reservation.id,
        requestKey,
        workflowId: 'voice_dub_video',
        currency: reservation.currency,
        total: reservation.total
      });
    },
    async releaseDelivery({ requestKey, reservation }) {
      return billing.release({
        reservationId: reservation.id,
        requestKey,
        workflowId: 'voice_dub_video',
        reason: 'delivery_failed'
      });
    }
  });
}
