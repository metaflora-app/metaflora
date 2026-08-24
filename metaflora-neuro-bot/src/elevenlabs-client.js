const DEFAULT_BASE_URL = 'https://api.elevenlabs.io';
const MAX_FILE_BYTES = 500 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 10 * 1024 * 1024;
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/u;
const LANGUAGE_CODE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/u;
const OUTPUT_FORMAT = /^(?:mp3|pcm|wav|ulaw|alaw|opus)_[A-Za-z0-9_]+$/u;

export class ElevenLabsApiError extends Error {
  constructor(status, requestId = null) {
    super(`ElevenLabs request failed with status ${status}.`);
    this.name = 'ElevenLabsApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

function requiredText(value, label, maxLength = 40_000) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0 || text.length > maxLength) {
    throw new TypeError(`${label} is invalid.`);
  }
  return text;
}

function optionalText(value, label, maxLength = 4_100) {
  if (value === undefined || value === null) return undefined;
  return requiredText(value, label, maxLength);
}

function safeId(value, label) {
  const id = String(value ?? '');
  if (!SAFE_ID.test(id)) throw new TypeError(`${label} is invalid.`);
  return id;
}

function languageCode(value, label) {
  const code = String(value ?? '');
  if (!LANGUAGE_CODE.test(code)) throw new TypeError(`${label} is invalid.`);
  return code;
}

function optionalBoolean(value, label) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw new TypeError(`${label} must be a boolean.`);
  return value;
}

function boundedInteger(value, label, minimum, maximum) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new TypeError(`${label} is invalid.`);
  }
  return value;
}

function boundedNumber(value, label, minimum, maximum) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new TypeError(`${label} is invalid.`);
  }
  return value;
}

function outputFormat(value) {
  if (value === undefined) return undefined;
  if (value === 'auto') return value;
  if (typeof value !== 'string' || !OUTPUT_FORMAT.test(value)) {
    throw new TypeError('output format is invalid.');
  }
  return value;
}

function mediaFile(value, label = 'file') {
  if (!(value instanceof Blob) || value.size === 0 || value.size > MAX_FILE_BYTES) {
    throw new TypeError(`${label} is invalid.`);
  }
  return value;
}

function httpsUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${label} is invalid.`);
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new TypeError(`${label} is invalid.`);
  }
  return url.toString();
}

function previewUrl(value) {
  const normalized = httpsUrl(value, 'voice preview URL');
  const url = new URL(normalized);
  const isGoogleStorage = url.hostname === 'storage.googleapis.com'
    && url.pathname.startsWith('/eleven-public-prod/');
  const isElevenLabs = url.hostname === 'elevenlabs.io'
    || url.hostname.endsWith('.elevenlabs.io');
  const isElevenS3 = url.hostname === 'eleven-public-prod.s3.amazonaws.com';
  if (!isGoogleStorage && !isElevenLabs && !isElevenS3) {
    throw new TypeError('voice preview URL is invalid.');
  }
  return normalized;
}

function optionalRecord(value, label) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} is invalid.`);
  }
  return { ...value };
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function snakeDialogueInputs(inputs) {
  if (!Array.isArray(inputs) || inputs.length === 0 || inputs.length > 50) {
    throw new TypeError('dialogue inputs are invalid.');
  }
  const normalized = inputs.map((input) => ({
    text: requiredText(input?.text, 'dialogue text', 2_000),
    voice_id: safeId(input?.voiceId, 'voice id')
  }));
  const length = normalized.reduce((total, input) => total + input.text.length, 0);
  if (length > 2_000) throw new TypeError('dialogue text is too long.');
  return normalized;
}

function append(form, key, value) {
  if (value === undefined) return;
  if (value instanceof Blob) {
    form.append(key, value);
    return;
  }
  form.append(key, typeof value === 'string' ? value : String(value));
}

function appendOptions(form, values) {
  for (const [key, value] of Object.entries(values)) append(form, key, value);
  return form;
}

function normalizeBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError('ElevenLabs base URL is invalid.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new TypeError('ElevenLabs base URL is invalid.');
  }
  return url.toString().replace(/\/$/u, '');
}

export function createElevenLabsClient({
  apiKey,
  fetchImpl = globalThis.fetch,
  baseUrl = DEFAULT_BASE_URL
} = {}) {
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (key.length === 0) throw new TypeError('ElevenLabs API key is required.');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation is required.');
  const apiBase = normalizeBaseUrl(baseUrl);

  function url(path, query = {}) {
    const target = new URL(path, `${apiBase}/`);
    for (const [name, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) target.searchParams.set(name, String(value));
    }
    return target.toString();
  }

  function call(path, { method = 'GET', query, json, form } = {}) {
    const headers = { 'xi-api-key': key };
    let body;
    if (json !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(json);
    } else if (form !== undefined) {
      body = form;
    }
    return fetchImpl(url(path, query), { method, headers, body });
  }

  async function checked(response) {
    if (!response?.ok) {
      throw new ElevenLabsApiError(
        Number(response?.status ?? 0),
        response?.headers?.get?.('request-id') ?? null
      );
    }
    return response;
  }

  async function jsonRequest(path, options) {
    const response = await checked(await call(path, options));
    return response.json();
  }

  async function binaryRequest(path, options) {
    const response = await checked(await call(path, options));
    return {
      data: new Uint8Array(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
      requestId: response.headers.get('request-id'),
      songId: response.headers.get('song-id')
    };
  }

  async function externalBinaryRequest(target) {
    const response = await checked(await fetchImpl(target, {
      method: 'GET',
      headers: {},
      redirect: 'error'
    }));
    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_PREVIEW_BYTES) {
      throw new TypeError('voice preview is too large.');
    }
    const chunks = [];
    let total = 0;
    if (response.body?.getReader) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_PREVIEW_BYTES) {
          await reader.cancel().catch(() => null);
          throw new TypeError('voice preview is too large.');
        }
        chunks.push(value);
      }
    } else {
      const value = new Uint8Array(await response.arrayBuffer());
      total = value.byteLength;
      if (total > MAX_PREVIEW_BYTES) throw new TypeError('voice preview is too large.');
      chunks.push(value);
    }
    const data = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return {
      data,
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
      requestId: response.headers.get('request-id'),
      songId: response.headers.get('song-id')
    };
  }

  function previewContentType(result) {
    const bytes = result.data;
    const isWave = bytes.length >= 12
      && Buffer.from(bytes.subarray(0, 4)).toString('ascii') === 'RIFF'
      && Buffer.from(bytes.subarray(8, 12)).toString('ascii') === 'WAVE';
    const isMp3 = bytes.length >= 3 && (
      Buffer.from(bytes.subarray(0, 3)).toString('ascii') === 'ID3'
      || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
    );
    if (isWave) return 'audio/wav';
    if (isMp3) return 'audio/mpeg';
    return result.contentType;
  }

  return Object.freeze({
    textToSpeech(options = {}) {
      const voiceId = safeId(options.voiceId, 'voice id');
      const format = outputFormat(options.outputFormat);
      return binaryRequest(`/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        query: compact({
          output_format: format,
          enable_logging: optionalBoolean(options.enableLogging, 'enable logging')
        }),
        json: compact({
          text: requiredText(options.text, 'text'),
          model_id: options.modelId === undefined
            ? 'eleven_multilingual_v2'
            : safeId(options.modelId, 'model id'),
          language_code: options.languageCode === undefined
            ? undefined
            : languageCode(options.languageCode, 'language code'),
          voice_settings: optionalRecord(options.voiceSettings, 'voice settings'),
          seed: options.seed === undefined
            ? undefined
            : boundedInteger(options.seed, 'seed', 0, 4_294_967_295)
        })
      });
    },

    createDialogue(options = {}) {
      const format = outputFormat(options.outputFormat);
      return binaryRequest('/v1/text-to-dialogue', {
        method: 'POST',
        query: compact({ output_format: format }),
        json: compact({
          inputs: snakeDialogueInputs(options.inputs),
          model_id: options.modelId === undefined
            ? 'eleven_v3'
            : safeId(options.modelId, 'model id'),
          language_code: options.languageCode === undefined
            ? undefined
            : languageCode(options.languageCode, 'language code'),
          settings: optionalRecord(options.settings, 'dialogue settings'),
          seed: options.seed === undefined
            ? undefined
            : boundedInteger(options.seed, 'seed', 0, 4_294_967_295)
        })
      });
    },

    createSoundEffect(options = {}) {
      const format = outputFormat(options.outputFormat);
      return binaryRequest('/v1/sound-generation', {
        method: 'POST',
        query: compact({ output_format: format }),
        json: compact({
          text: requiredText(options.text, 'text', 4_100),
          duration_seconds: options.durationSeconds === undefined
            ? undefined
            : boundedNumber(options.durationSeconds, 'duration', 0.5, 30),
          prompt_influence: options.promptInfluence === undefined
            ? undefined
            : boundedNumber(options.promptInfluence, 'prompt influence', 0, 1),
          loop: optionalBoolean(options.loop, 'loop')
        })
      });
    },

    composeMusic(options = {}) {
      const prompt = optionalText(options.prompt, 'prompt');
      const compositionPlan = optionalRecord(options.compositionPlan, 'composition plan');
      if ((prompt === undefined) === (compositionPlan === undefined)) {
        throw new TypeError('exactly one music prompt or composition plan is required.');
      }
      const format = outputFormat(options.outputFormat);
      return binaryRequest('/v1/music', {
        method: 'POST',
        query: compact({ output_format: format }),
        json: compact({
          prompt,
          composition_plan: compositionPlan,
          music_length_ms: options.musicLengthMs === undefined
            ? undefined
            : boundedInteger(options.musicLengthMs, 'music length', 3_000, 600_000),
          model_id: options.modelId === undefined
            ? 'music_v1'
            : safeId(options.modelId, 'model id'),
          seed: options.seed === undefined
            ? undefined
            : boundedInteger(options.seed, 'seed', 0, 2_147_483_647),
          force_instrumental: optionalBoolean(options.forceInstrumental, 'force instrumental')
        })
      });
    },

    isolateAudio(options = {}) {
      const file = mediaFile(options.file, 'audio file');
      const fileFormat = options.fileFormat ?? 'other';
      if (!['other', 'pcm_s16le_16'].includes(fileFormat)) {
        throw new TypeError('file format is invalid.');
      }
      const form = appendOptions(new FormData(), {
        audio: file,
        file_format: fileFormat,
        preview_b64: optionalText(options.previewBase64, 'preview', 2_000_000)
      });
      return binaryRequest('/v1/audio-isolation', { method: 'POST', form });
    },

    changeVoice(options = {}) {
      const voiceId = safeId(options.voiceId, 'voice id');
      const file = mediaFile(options.file, 'audio file');
      const form = appendOptions(new FormData(), {
        audio: file,
        model_id: options.modelId === undefined
          ? 'eleven_multilingual_sts_v2'
          : safeId(options.modelId, 'model id'),
        voice_settings: options.voiceSettings === undefined
          ? undefined
          : JSON.stringify(optionalRecord(options.voiceSettings, 'voice settings')),
        seed: options.seed === undefined
          ? undefined
          : boundedInteger(options.seed, 'seed', 0, 4_294_967_295),
        remove_background_noise: optionalBoolean(
          options.removeBackgroundNoise,
          'remove background noise'
        ),
        file_format: options.fileFormat
      });
      return binaryRequest(`/v1/speech-to-speech/${voiceId}`, {
        method: 'POST',
        query: compact({ output_format: outputFormat(options.outputFormat) }),
        form
      });
    },

    cloneVoice(options = {}) {
      const name = requiredText(options.name, 'voice name', 100);
      if (!Array.isArray(options.files) || options.files.length === 0 || options.files.length > 25) {
        throw new TypeError('voice files are invalid.');
      }
      const form = new FormData();
      for (const file of options.files) append(form, 'files', mediaFile(file, 'voice file'));
      appendOptions(form, {
        name,
        description: optionalText(options.description, 'voice description', 500),
        labels: options.labels === undefined
          ? undefined
          : JSON.stringify(optionalRecord(options.labels, 'voice labels')),
        remove_background_noise: optionalBoolean(
          options.removeBackgroundNoise,
          'remove background noise'
        )
      });
      return jsonRequest('/v1/voices/add', { method: 'POST', form });
    },

    createDubbing(options = {}) {
      const hasFile = options.file !== undefined && options.file !== null;
      const hasUrl = options.sourceUrl !== undefined && options.sourceUrl !== null;
      if (hasFile === hasUrl) {
        throw new TypeError('exactly one dubbing file or source URL is required.');
      }
      const form = appendOptions(new FormData(), {
        file: hasFile ? mediaFile(options.file, 'dubbing file') : undefined,
        source_url: hasUrl ? httpsUrl(options.sourceUrl, 'source URL') : undefined,
        target_lang: languageCode(options.targetLang, 'target language'),
        source_lang: options.sourceLang === undefined
          ? undefined
          : languageCode(options.sourceLang, 'source language'),
        name: optionalText(options.name, 'dubbing name', 200),
        num_speakers: options.numSpeakers === undefined
          ? undefined
          : boundedInteger(options.numSpeakers, 'number of speakers', 0, 32),
        watermark: optionalBoolean(options.watermark, 'watermark'),
        drop_background_audio: optionalBoolean(
          options.dropBackgroundAudio,
          'drop background audio'
        ),
        disable_voice_cloning: optionalBoolean(
          options.disableVoiceCloning,
          'disable voice cloning'
        ),
        voice_id: options.voiceId === undefined
          ? undefined
          : safeId(options.voiceId, 'voice id')
      });
      return jsonRequest('/v1/dubbing', { method: 'POST', form });
    },

    getDubbing(dubbingId) {
      return jsonRequest(`/v1/dubbing/${safeId(dubbingId, 'dubbing id')}`);
    },

    getDubbingAudio(dubbingId, targetLanguage) {
      const id = safeId(dubbingId, 'dubbing id');
      const language = languageCode(targetLanguage, 'target language');
      return binaryRequest(`/v1/dubbing/${id}/audio/${language}`);
    },

    listVoices(options = {}) {
      const pageSize = options.pageSize === undefined
        ? undefined
        : boundedInteger(options.pageSize, 'page size', 1, 100);
      const sortDirection = options.sortDirection;
      if (sortDirection !== undefined && !['asc', 'desc'].includes(sortDirection)) {
        throw new TypeError('sort direction is invalid.');
      }
      return jsonRequest('/v2/voices', {
        query: compact({
          next_page_token: optionalText(options.nextPageToken, 'next page token', 1_000),
          page_size: pageSize,
          search: optionalText(options.search, 'voice search', 200),
          sort: options.sort,
          sort_direction: sortDirection,
          voice_type: options.voiceType,
          category: options.category,
          include_total_count: optionalBoolean(
            options.includeTotalCount,
            'include total count'
          )
        })
      });
    },

    listSharedVoices(options = {}) {
      const pageSize = options.pageSize === undefined
        ? 100
        : boundedInteger(options.pageSize, 'page size', 1, 100);
      return jsonRequest('/v1/shared-voices', {
        query: compact({
          page_size: pageSize,
          last_sort_id: optionalText(options.lastSortId, 'last sort id', 1_000)
        })
      });
    },

    getVoice(voiceId) {
      return jsonRequest(`/v1/voices/${safeId(voiceId, 'voice id')}`);
    },

    async previewVoice(options = {}) {
      const voice = await jsonRequest(`/v1/voices/${safeId(options.voiceId, 'voice id')}`);
      const result = await externalBinaryRequest(previewUrl(voice?.preview_url ?? voice?.previewUrl));
      return { ...result, contentType: previewContentType(result) };
    },

    deleteVoice(voiceId) {
      return jsonRequest(`/v1/voices/${safeId(voiceId, 'voice id')}`, {
        method: 'DELETE'
      });
    },

    speechToText(options = {}) {
      const hasFile = options.file !== undefined && options.file !== null;
      const hasUrl = options.sourceUrl !== undefined && options.sourceUrl !== null;
      if (hasFile === hasUrl) {
        throw new TypeError('exactly one transcription file or source URL is required.');
      }
      const form = appendOptions(new FormData(), {
        file: hasFile ? mediaFile(options.file, 'transcription file') : undefined,
        source_url: hasUrl ? httpsUrl(options.sourceUrl, 'source URL') : undefined,
        model_id: options.modelId === undefined
          ? 'scribe_v2'
          : safeId(options.modelId, 'model id'),
        language_code: options.languageCode === undefined
          ? undefined
          : languageCode(options.languageCode, 'language code'),
        tag_audio_events: optionalBoolean(options.tagAudioEvents, 'tag audio events'),
        num_speakers: options.numSpeakers === undefined
          ? undefined
          : boundedInteger(options.numSpeakers, 'number of speakers', 1, 32),
        timestamps_granularity: options.timestampsGranularity,
        diarize: optionalBoolean(options.diarize, 'diarize')
      });
      return jsonRequest('/v1/speech-to-text', {
        method: 'POST',
        query: compact({
          enable_logging: optionalBoolean(options.enableLogging, 'enable logging')
        }),
        form
      });
    }
  });
}
