import { providerCostRublesToMetacoins, providerCostUsdToMetacoins } from './model-pricing.js';

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
};

const KIE_POLL_ENDPOINT = 'https://api.kie.ai/api/v1/generate/record-info';
const KIE_PENDING_STATES = new Set(['PENDING', 'TEXT_SUCCESS', 'FIRST_SUCCESS']);
const KIE_FAILED_STATES = new Set([
  'CREATE_TASK_FAILED',
  'GENERATE_AUDIO_FAILED',
  'CALLBACK_EXCEPTION',
  'SENSITIVE_WORD_ERROR'
]);

const endpoints = [
  'fal-ai/minimax-music/v2',
  'fal-ai/lyria2',
  'fal-ai/elevenlabs/music',
  'https://api.replicate.com/v1/models/google/lyria-2/predictions',
  'https://api.replicate.com/v1/models/minimax/music-01/predictions',
  'https://api.kie.ai/api/v1/generate',
  'https://api.kie.ai/api/v1/generate/extend',
  'https://api.kie.ai/api/v1/generate/upload-cover',
  'https://api.kie.ai/api/v1/generate/mashup',
  'https://polza.ai/api/v1/media',
  KIE_POLL_ENDPOINT
];

export const MUSIC_ROUTE_ENDPOINT_ALLOWLIST = new Set(endpoints);

const fixedUsd = (usd) => ({ kind: 'fixed_usd', usd });
const fixedRubles = (rubles) => ({ kind: 'fixed_rubles', rubles });
const outputSecondsUsd = (usdPerSecond, billedSeconds) => ({
  kind: 'output_seconds_usd',
  usdPerSecond,
  billedSeconds
});
const roundedMinuteUsd = (usdPerMinute) => ({
  kind: 'rounded_output_minute_usd',
  usdPerMinute
});
const providerCredits = (credits) => ({
  kind: 'provider_credits',
  credits,
  requiresLiveCreditRate: true
});

const contract = ({
  id,
  provider,
  submitEndpoint,
  pollEndpoint,
  capabilities,
  role,
  priority,
  outputPath,
  inputKind,
  pricing,
  active = true,
  inactiveReason
}) => deepFreeze({
  id,
  provider,
  submitEndpoint,
  ...(pollEndpoint ? { pollEndpoint } : {}),
  capabilities,
  role,
  priority,
  outputPath,
  inputKind,
  pricing,
  active,
  verified: true,
  ...(inactiveReason ? { inactiveReason } : {})
});

export const musicProviderContracts = deepFreeze([
  contract({
    id: 'polza_suno_generate',
    provider: 'polza',
    submitEndpoint: 'https://polza.ai/api/v1/media',
    pollEndpoint: 'https://polza.ai/api/v1/media/{requestId}',
    capabilities: ['text_to_song', 'text_to_music', 'instrumental_only'],
    role: 'primary',
    priority: 5,
    outputPath: 'output',
    inputKind: 'polza_suno_generate',
    pricing: fixedRubles(15)
  }),
  contract({
    id: 'replicate_lyria_2',
    provider: 'replicate',
    submitEndpoint: 'https://api.replicate.com/v1/models/google/lyria-2/predictions',
    capabilities: ['text_to_music', 'instrumental_only', 'negative_prompt', 'seed'],
    role: 'primary',
    priority: 10,
    outputPath: 'output',
    inputKind: 'replicate_lyria',
    pricing: outputSecondsUsd(0.002, 30)
  }),
  contract({
    id: 'fal_minimax_music_v2',
    provider: 'fal',
    submitEndpoint: 'fal-ai/minimax-music/v2',
    capabilities: ['text_to_song', 'lyrics_control', 'vocal_generation'],
    role: 'primary',
    priority: 20,
    outputPath: 'audio',
    inputKind: 'fal_minimax_v2',
    pricing: fixedUsd(0.03)
  }),
  contract({
    id: 'replicate_minimax_music_01',
    provider: 'replicate',
    submitEndpoint: 'https://api.replicate.com/v1/models/minimax/music-01/predictions',
    capabilities: ['reference_to_song', 'lyrics_control', 'vocal_generation'],
    role: 'primary',
    priority: 30,
    outputPath: 'output',
    inputKind: 'replicate_minimax_01',
    pricing: fixedUsd(0.035)
  }),
  contract({
    id: 'fal_lyria_2',
    provider: 'fal',
    submitEndpoint: 'fal-ai/lyria2',
    capabilities: ['text_to_music', 'instrumental_only', 'negative_prompt', 'seed'],
    role: 'fallback',
    priority: 40,
    outputPath: 'audio',
    inputKind: 'fal_lyria',
    pricing: fixedUsd(0.1)
  }),
  contract({
    id: 'fal_elevenlabs_music',
    provider: 'fal',
    submitEndpoint: 'fal-ai/elevenlabs/music',
    capabilities: [
      'text_to_music',
      'text_to_song',
      'instrumental_only',
      'duration_control'
    ],
    role: 'fallback',
    priority: 90,
    outputPath: 'audio',
    inputKind: 'fal_elevenlabs_music',
    pricing: roundedMinuteUsd(0.8)
  }),
  contract({
    id: 'kie_suno_generate_v5',
    provider: 'kie',
    submitEndpoint: 'https://api.kie.ai/api/v1/generate',
    pollEndpoint: KIE_POLL_ENDPOINT,
    capabilities: ['text_to_song', 'text_to_music', 'lyrics_control', 'instrumental_only'],
    role: 'fallback',
    priority: 100,
    outputPath: 'tracks',
    inputKind: 'kie_generate',
    pricing: providerCredits(12),
    active: false,
    inactiveReason: 'не закреплена стоимость кредита провайдера'
  }),
  contract({
    id: 'kie_suno_extend_v5',
    provider: 'kie',
    submitEndpoint: 'https://api.kie.ai/api/v1/generate/extend',
    pollEndpoint: KIE_POLL_ENDPOINT,
    capabilities: ['music_extend'],
    role: 'fallback',
    priority: 110,
    outputPath: 'tracks',
    inputKind: 'kie_extend',
    pricing: providerCredits(12),
    active: false,
    inactiveReason: 'не закреплена стоимость кредита провайдера'
  }),
  contract({
    id: 'kie_suno_upload_cover_v5',
    provider: 'kie',
    submitEndpoint: 'https://api.kie.ai/api/v1/generate/upload-cover',
    pollEndpoint: KIE_POLL_ENDPOINT,
    capabilities: ['music_cover', 'reference_to_song'],
    role: 'fallback',
    priority: 120,
    outputPath: 'tracks',
    inputKind: 'kie_upload_cover',
    pricing: providerCredits(12),
    active: false,
    inactiveReason: 'не закреплена стоимость кредита провайдера'
  }),
  contract({
    id: 'kie_suno_mashup_v5',
    provider: 'kie',
    submitEndpoint: 'https://api.kie.ai/api/v1/generate/mashup',
    pollEndpoint: KIE_POLL_ENDPOINT,
    capabilities: ['music_mashup'],
    role: 'fallback',
    priority: 130,
    outputPath: 'tracks',
    inputKind: 'kie_mashup',
    pricing: providerCredits(12),
    active: false,
    inactiveReason: 'не закреплена стоимость кредита провайдера'
  })
]);

const contractsById = new Map(
  musicProviderContracts.map((item) => [item.id, item])
);

function requiredString(value, field, { max = 5_000 } = {}) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    throw new TypeError(`Invalid music provider input: ${field}.`);
  }
  return value.trim();
}

function optionalString(value, field, options) {
  return value === undefined || value === null || value === ''
    ? undefined
    : requiredString(value, field, options);
}

function safeInteger(value, field, { min = 0, max = 2_147_483_647 } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new TypeError(`Invalid music provider input: ${field}.`);
  }
  return value;
}

function httpsUrl(value, field) {
  const raw = requiredString(value, field, { max: 2_048 });
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new TypeError(`Invalid music provider input: ${field}.`);
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname) {
    throw new TypeError(`Invalid music provider input: ${field}.`);
  }
  return parsed.toString();
}

function compact(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined)
  );
}

function buildInput(inputKind, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Invalid music provider input.');
  }

  if (inputKind === 'replicate_lyria' || inputKind === 'fal_lyria') {
    return compact({
      prompt: requiredString(input.prompt, 'prompt', { max: 2_000 }),
      negative_prompt: optionalString(input.negativePrompt, 'negativePrompt', { max: 2_000 }),
      seed: input.seed === undefined ? undefined : safeInteger(input.seed, 'seed')
    });
  }

  if (inputKind === 'fal_minimax_v2') {
    return {
      prompt: requiredString(input.prompt, 'prompt', { max: 300 }),
      lyrics_prompt: requiredString(input.lyrics, 'lyrics', { max: 3_000 })
    };
  }

  if (inputKind === 'replicate_minimax_01') {
    return {
      lyrics: requiredString(input.lyrics, 'lyrics', { max: 400 }),
      song_file: httpsUrl(input.referenceAudioUrl, 'referenceAudioUrl'),
      sample_rate: 44_100,
      bitrate: 256_000
    };
  }

  if (inputKind === 'fal_elevenlabs_music') {
    const durationSeconds = input.durationSeconds === undefined
      ? undefined
      : safeInteger(input.durationSeconds, 'durationSeconds', { min: 3, max: 600 });
    return compact({
      prompt: requiredString(input.prompt, 'prompt', { max: 10_000 }),
      music_length_ms: durationSeconds === undefined ? undefined : durationSeconds * 1_000,
      force_instrumental: Boolean(input.instrumental)
    });
  }

  if (inputKind === 'polza_suno_generate') {
    return {
      prompt: requiredString(input.prompt, 'prompt', { max: 500 }),
      instrumental: Boolean(input.instrumental)
    };
  }

  if (inputKind === 'kie_generate') {
    return {
      prompt: requiredString(input.prompt, 'prompt', { max: 500 }),
      customMode: false,
      instrumental: Boolean(input.instrumental),
      model: 'V5'
    };
  }

  if (inputKind === 'kie_extend') {
    return {
      defaultParamFlag: false,
      audioId: requiredString(input.audioId, 'audioId', { max: 256 }),
      model: 'V5'
    };
  }

  if (inputKind === 'kie_upload_cover') {
    return {
      uploadUrl: httpsUrl(input.referenceAudioUrl, 'referenceAudioUrl'),
      prompt: requiredString(input.prompt, 'prompt', { max: 500 }),
      customMode: false,
      instrumental: Boolean(input.instrumental),
      model: 'V5'
    };
  }

  if (inputKind === 'kie_mashup') {
    if (!Array.isArray(input.audioUrls) || input.audioUrls.length !== 2) {
      throw new TypeError('Invalid music provider input: audioUrls.');
    }
    return {
      uploadUrlList: input.audioUrls.map((url) => httpsUrl(url, 'audioUrls')),
      prompt: requiredString(input.prompt, 'prompt', { max: 500 }),
      customMode: false,
      instrumental: Boolean(input.instrumental),
      model: 'V5'
    };
  }

  throw new Error('Unknown music provider input contract.');
}

export function getMusicProviderContract(id) {
  return contractsById.get(id) ?? null;
}

export function listActiveMusicProviderContracts({ capability } = {}) {
  return musicProviderContracts
    .filter(({ active, capabilities }) => (
      active && (!capability || capabilities.includes(capability))
    ))
    .sort((left, right) => left.priority - right.priority);
}

export function buildMusicProviderInput(contractId, input) {
  const selected = getMusicProviderContract(contractId);
  if (!selected) throw new Error('Unknown music provider contract.');
  return deepFreeze(buildInput(selected.inputKind, input));
}

function taskId(value) {
  const normalized = String(value ?? '');
  if (!/^[A-Za-z0-9_-]{1,256}$/u.test(normalized)) {
    throw new Error('Invalid KIE task id.');
  }
  return normalized;
}

export function parseKieSunoSubmission(body) {
  if (body?.code !== 200 || body?.msg !== 'success') {
    throw new Error('KIE rejected the music request.');
  }
  return Object.freeze({
    requestId: taskId(body?.data?.taskId),
    state: 'pending'
  });
}

export function buildKieSunoPollUrl(requestId) {
  const url = new URL(KIE_POLL_ENDPOINT);
  url.searchParams.set('taskId', taskId(requestId));
  return url.toString();
}

function normalizedTrack(track) {
  const url = httpsUrl(track?.audioUrl ?? track?.audio_url, 'output');
  const duration = Number(track?.duration);
  return compact({
    id: optionalString(track?.id, 'output id', { max: 256 }),
    url,
    durationSeconds: Number.isFinite(duration) && duration >= 0 ? duration : undefined,
    title: optionalString(track?.title, 'output title', { max: 256 })
  });
}

export function parseKieSunoStatus(body) {
  if (body?.code !== 200 || body?.msg && body.msg !== 'success') {
    return Object.freeze({ state: 'failed' });
  }
  const status = body?.data?.status;
  if (KIE_PENDING_STATES.has(status)) return Object.freeze({ state: 'pending' });
  if (KIE_FAILED_STATES.has(status) || status !== 'SUCCESS') {
    return Object.freeze({ state: 'failed' });
  }
  const tracks = body?.data?.response?.sunoData;
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return Object.freeze({ state: 'failed' });
  }
  return deepFreeze({
    state: 'succeeded',
    output: { tracks: tracks.map(normalizedTrack) }
  });
}

function mimeTypeFromUrl(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith('.wav')) return 'audio/wav';
  if (pathname.endsWith('.flac')) return 'audio/flac';
  if (pathname.endsWith('.ogg')) return 'audio/ogg';
  return 'audio/mpeg';
}

function normalizedMediaFile(value) {
  const raw = typeof value === 'string' ? { url: value } : value;
  const url = httpsUrl(raw?.url, 'output');
  const size = Number(raw?.file_size ?? raw?.fileSize);
  return compact({
    url,
    mimeType: optionalString(
      raw?.content_type ?? raw?.contentType,
      'output mime type',
      { max: 128 }
    ) ?? mimeTypeFromUrl(url),
    size: Number.isSafeInteger(size) && size >= 0 ? size : undefined
  });
}

export function normalizeMusicOutput(contractId, output) {
  const selected = getMusicProviderContract(contractId);
  if (!selected) throw new Error('Unknown music provider contract.');

  if (selected.provider === 'kie') {
    if (!Array.isArray(output?.tracks) || output.tracks.length === 0) {
      throw new Error('Invalid music provider output.');
    }
    return deepFreeze({
      tracks: output.tracks.map((track) => ({
        ...track,
        url: httpsUrl(track.url, 'output')
      }))
    });
  }

  const file = selected.provider === 'fal' ? output?.audio : output;
  try {
    return deepFreeze({ tracks: [normalizedMediaFile(file)] });
  } catch {
    throw new Error('Invalid music provider output.');
  }
}

export function quoteMusicRouteMetacoins(contractId, { durationSeconds } = {}) {
  const selected = getMusicProviderContract(contractId);
  if (!selected) throw new Error('Unknown music provider contract.');
  const pricing = selected.pricing;

  if (pricing.kind === 'fixed_usd') {
    return providerCostUsdToMetacoins(pricing.usd);
  }
  if (pricing.kind === 'fixed_rubles') {
    return providerCostRublesToMetacoins(pricing.rubles);
  }
  if (pricing.kind === 'output_seconds_usd') {
    return providerCostUsdToMetacoins(
      pricing.usdPerSecond * pricing.billedSeconds
    );
  }
  if (pricing.kind === 'rounded_output_minute_usd') {
    const seconds = Number(durationSeconds ?? 60);
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 600) {
      throw new TypeError('Invalid output duration.');
    }
    return providerCostUsdToMetacoins(
      pricing.usdPerMinute * Math.ceil(seconds / 60)
    );
  }
  throw new Error('Для маршрута нужен живой тарифный коэффициент провайдера.');
}
