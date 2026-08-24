import { normalizeProvider } from './provider-route-matrix.js';

function requestId(value) {
  const id = String(value ?? '');
  if (!/^[A-Za-z0-9_.:-]{1,256}$/u.test(id)) {
    throw new Error('Provider returned an invalid request id.');
  }
  return id;
}

function parseJsonString(value) {
  if (typeof value !== 'string') return value;
  if (!/^\s*[\[{]/u.test(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Provider returned invalid result data.');
  }
}

function routeRuntimeValue(route, name) {
  return route?.[name] ?? route?.runtime?.[name];
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function providerInputField(value) {
  if (
    typeof value !== 'string'
    || !/^[A-Za-z][A-Za-z0-9_]*$/u.test(value)
    || ['constructor', 'prototype'].includes(value)
  ) {
    throw new Error('Media route provider input field is invalid.');
  }
  return value;
}

function mappedInput(route, input) {
  const inputMap = routeRuntimeValue(route, 'inputMap');
  if (inputMap === undefined) return { ...input };
  if (!inputMap || typeof inputMap !== 'object' || Array.isArray(inputMap)) {
    throw new Error('Media route input map is invalid.');
  }

  const mapped = {};
  const assign = (target, value) => {
    const field = providerInputField(target);
    if (Object.hasOwn(mapped, field)) {
      throw new Error(`Media route maps more than one input to "${field}".`);
    }
    mapped[field] = value;
  };
  for (const [key, value] of Object.entries(input)) {
    const target = inputMap[key];
    if (target === undefined) {
      assign(key, value);
      continue;
    }
    if (typeof target === 'string') {
      assign(target, value);
      continue;
    }
    if (target && typeof target === 'object' && !Array.isArray(target)) {
      const mediaType = value?.type;
      const providerField = target[mediaType];
      const mediaValue = value?.url ?? value?.value;
      if (
        typeof providerField !== 'string'
        || !/^[A-Za-z][A-Za-z0-9_]*$/u.test(providerField)
        || typeof mediaValue !== 'string'
        || mediaValue.trim().length === 0
      ) {
        throw new Error(`Media route input mapping for "${key}" is ambiguous.`);
      }
      assign(providerField, mediaValue);
      continue;
    }
    throw new Error(`Media route input mapping for "${key}" is invalid.`);
  }
  return mapped;
}

function polzaReference(value) {
  if (isRecord(value)) {
    const type = value.type;
    const data = value.data;
    if (
      (type === 'url' || type === 'base64')
      && typeof data === 'string'
      && data.trim().length > 0
    ) {
      if (type === 'base64') return { type, data: data.trim() };
      value = data;
    } else {
      throw new Error('Polza media reference is invalid.');
    }
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Polza media reference is invalid.');
  }
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Polza media reference URL is invalid.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Polza media reference URL is not allowed.');
  }
  return { type: 'url', data: value.trim() };
}

const POLZA_INPUT_ALIASES = Object.freeze({
  resolution: Object.freeze(['resolution', 'image_resolution', 'mode']),
  generate_audio: Object.freeze(['generate_audio', 'sound']),
  prompt_expansion: Object.freeze(['prompt_expansion', 'enable_prompt_expansion']),
  web_search: Object.freeze(['web_search', 'enable_web_search'])
});

function polzaParameterKeys(route) {
  if (!Array.isArray(route?.providerParameters)) return null;
  return new Set(route.providerParameters
    .map(({ key }) => key)
    .filter((key) => typeof key === 'string' && /^[A-Za-z][A-Za-z0-9_]*$/u.test(key)));
}

function polzaTargetKey(key, allowedKeys) {
  if (allowedKeys.has(key)) return key;
  const aliases = POLZA_INPUT_ALIASES[key];
  return aliases?.find((candidate) => allowedKeys.has(candidate)) ?? null;
}

function filterPolzaInput(route, input) {
  const allowedKeys = polzaParameterKeys(route);
  if (!allowedKeys) return input;

  const filtered = {};
  for (const [key, value] of Object.entries(input)) {
    // Prompt and references are common API envelope fields even when a model
    // snapshot advertises no optional scalar parameters.
    if (key === 'prompt' || key === 'images' || key === 'videos') {
      if (key !== 'prompt' || (typeof value === 'string' && value.trim().length > 0)) {
        filtered[key] = value;
      }
      continue;
    }
    const target = polzaTargetKey(key, allowedKeys);
    if (!target || Object.hasOwn(filtered, target)) continue;
    filtered[target] = value;
  }
  return filtered;
}

function polzaMediaInput(route, input) {
  const mapped = mappedInput(route, input);
  const result = { ...mapped };
  if (Object.hasOwn(result, 'audio_urls')) {
    throw new Error('Polza media audio references are not confirmed for this route.');
  }
  for (const [source, target] of [['image_urls', 'images'], ['video_urls', 'videos']]) {
    if (!Object.hasOwn(result, source)) continue;
    if (Object.hasOwn(result, target)) {
      throw new Error(`Polza media input maps both ${source} and ${target}.`);
    }
    const references = Array.isArray(result[source]) ? result[source] : [result[source]];
    result[target] = references.map(polzaReference);
    delete result[source];
  }
  return filterPolzaInput(route, result);
}

function polzaAudioOperation(route) {
  const operation = routeRuntimeValue(route, 'operation');
  return operation === 'transcription' || operation === 'speech' ? operation : null;
}

function polzaAudioScalarInput(route, input) {
  const allowedKeys = polzaParameterKeys(route);
  const result = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (key === 'prompt' || key === 'input' || key === 'audio_urls') continue;
    const target = allowedKeys ? polzaTargetKey(key, allowedKeys) : key;
    if (!target || Object.hasOwn(result, target)) continue;
    if (value !== undefined && value !== null && value !== '' && value !== 'auto') {
      result[target] = value;
    }
  }
  return result;
}

function polzaAudioRequestId(body) {
  return requestId(
    body?.id
      ?? body?.request_id
      ?? body?.requestId
      ?? `polza-audio-${Date.now()}`
  );
}

function polzaAudioData(value) {
  const raw = String(value ?? '').trim();
  const encoded = raw.match(/^data:[^;]+;base64,(.+)$/u)?.[1] ?? raw;
  if (
    encoded.length === 0
    || encoded.length > 70 * 1024 * 1024
    || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(encoded)
  ) {
    throw new Error('Provider audio output is invalid.');
  }
  const data = Buffer.from(encoded, 'base64');
  if (data.byteLength === 0) throw new Error('Provider audio output is invalid.');
  return data;
}

async function polzaAudioSubmissionBody(route, request, runtime) {
  const operation = polzaAudioOperation(route);
  if (operation === 'transcription') {
    const audioUrl = Array.isArray(request.input?.audio_urls)
      ? request.input.audio_urls[0]
      : request.input?.audio_url;
    if (typeof audioUrl !== 'string' || audioUrl.trim().length === 0) {
      throw new Error('Polza transcription audio input is required.');
    }
    const downloaded = await downloadFileInput(
      runtime?.fetchImpl ?? fetch,
      audioUrl,
      routeRuntimeValue(route, 'maxInputBytes') ?? 50 * 1024 * 1024
    );
    const formData = new FormData();
    formData.set('file', downloaded.blob, downloaded.fileName);
    formData.set('model', route.model);
    const scalar = polzaAudioScalarInput(route, request.input);
    for (const [key, value] of Object.entries(scalar)) formData.set(key, String(value));
    if (typeof request.input?.prompt === 'string' && request.input.prompt.trim()) {
      formData.set('prompt', request.input.prompt.trim());
    }
    return formData;
  }

  if (operation === 'speech') {
    const text = String(request.input?.prompt ?? request.input?.input ?? '').trim();
    if (!text) throw new Error('Polza speech input is required.');
    return {
      model: route.model,
      input: text,
      ...polzaAudioScalarInput(route, request.input)
    };
  }
  return null;
}

async function polzaAudioParseSubmissionResponse(response, route) {
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('Provider returned an invalid audio response.');
  }
  const operation = polzaAudioOperation(route);
  if (operation === 'transcription') {
    const text = body?.text ?? body?.transcript ?? body?.output?.text;
    if (typeof text !== 'string') throw new Error('Provider transcription output is invalid.');
    return {
      requestId: polzaAudioRequestId(body),
      state: 'succeeded',
      output: { text }
    };
  }
  if (operation === 'speech') {
    const rawAudio = body?.audio ?? body?.data?.audio ?? body?.output?.audio;
    const data = polzaAudioData(rawAudio);
    return {
      requestId: polzaAudioRequestId(body),
      state: 'succeeded',
      output: {
        audio: {
          data,
          content_type: body?.contentType ?? body?.content_type ?? 'audio/mpeg',
          file_size: data.byteLength
        }
      }
    };
  }
  throw new Error('Polza audio operation is not configured.');
}

function polzaAudioHeaders(providerConfig, body) {
  const headers = bearerHeaders(providerConfig);
  if (!(body instanceof FormData)) return headers;
  const { 'content-type': _contentType, ...multipartHeaders } = headers;
  return multipartHeaders;
}

function directProviderEndpoint(route, baseUrl, providerName, body = {}, request = {}) {
  let endpoint = String(route?.endpoint ?? '');
  if (endpoint.includes('{voice_id}')) {
    const voiceId = String(
      body.voice_id
        ?? request.input?.voice_id
        ?? request.input?.voice
        ?? routeRuntimeValue(route, 'voiceId')
        ?? ''
    ).trim();
    if (!/^[A-Za-z0-9_-]{1,128}$/u.test(voiceId)) {
      throw new Error(`Media route ${providerName} voice id is invalid.`);
    }
    endpoint = endpoint.replaceAll('{voice_id}', encodeURIComponent(voiceId));
  }
  if (/^\/v\d+(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%-]+)+$/u.test(endpoint)) {
    return `${baseUrl}${endpoint}`;
  }
  throw new Error(`Media route ${providerName} endpoint is invalid.`);
}

function binaryOutputFromBuffer(data, contentType) {
  const mimeType = String(contentType ?? '').split(';', 1)[0].trim().toLowerCase();
  if (!/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/iu.test(mimeType)) {
    throw new Error('Provider binary response MIME type is invalid.');
  }
  return {
    data,
    content_type: mimeType,
    file_size: data.byteLength
  };
}

function outputAtPath(output, path) {
  if (path === undefined) return output;
  if (
    typeof path !== 'string'
    || path.length === 0
    || path.length > 512
    || !/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/u.test(path)
  ) {
    throw new Error('Media route output path is invalid.');
  }

  let current = output;
  for (const segment of path.split('.')) {
    if (
      ['__proto__', 'prototype', 'constructor'].includes(segment)
      || current === null
      || (typeof current !== 'object' && !Array.isArray(current))
      || !Object.hasOwn(current, segment)
    ) {
      throw new Error('Provider result does not contain the configured output path.');
    }
    current = current[segment];
  }
  return current;
}

function outputSize(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = outputSize(item);
      if (found !== null) return found;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  const direct = value.file_size ?? value.fileSize ?? value.content_length ?? value.contentLength;
  if (direct !== undefined) return direct;
  for (const key of ['images', 'video', 'audio', 'output', 'model_glb']) {
    const found = outputSize(value[key]);
    if (found !== null) return found;
  }
  return null;
}

function falQueueEndpoint(route) {
  const endpoint = String(route?.endpoint ?? '');
  if (/^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)+$/u.test(endpoint)) {
    return `https://queue.fal.run/${endpoint}`;
  }

  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('Media route FAL endpoint is invalid.');
  }
  if (url.hostname === 'fal.run') url.hostname = 'queue.fal.run';
  return url.toString();
}

function firstUrl(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstUrl(item);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;

  for (const key of [
    'url',
    'audio_url',
    'video_url',
    'resultUrl',
    'result_url',
    'resultUrls',
    'urls',
    'images',
    'video',
    'audio',
    'output'
  ]) {
    const found = firstUrl(value[key]);
    if (found) return found;
  }
  return null;
}

function firstData(value) {
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value) || value instanceof Blob) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstData(item);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  if (value.data instanceof ArrayBuffer || ArrayBuffer.isView(value.data) || value.data instanceof Blob) {
    return value.data;
  }
  for (const key of ['image', 'images', 'audio', 'output', 'file']) {
    const found = firstData(value[key]);
    if (found) return found;
  }
  return null;
}

function outputMimeType(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = outputMimeType(item);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  const direct = value.content_type ?? value.contentType ?? value.mime_type ?? value.mimeType;
  if (typeof direct === 'string') return direct;
  for (const key of ['images', 'video', 'audio', 'output']) {
    const found = outputMimeType(value[key]);
    if (found) return found;
  }
  return null;
}

function falSubmission(body) {
  return {
    requestId: requestId(body?.request_id),
    state: 'pending',
    statusUrl: body?.status_url,
    resultUrl: body?.response_url
  };
}

function falStatus(body, job) {
  if (body?.status === 'COMPLETED') {
    if (body.error) return { state: 'failed' };
    return {
      state: 'succeeded',
      resultUrl: body.response_url ?? job.resultUrl,
      output: body.output ?? body.payload
    };
  }
  if (['IN_QUEUE', 'IN_PROGRESS'].includes(body?.status)) return { state: 'pending' };
  return { state: 'failed' };
}

function polzaState(body) {
  const status = String(body?.status ?? '').toLowerCase();
  if (['pending', 'queued', 'processing', 'running', 'in_progress'].includes(status)) {
    return { state: 'pending' };
  }
  if (['completed', 'succeeded', 'success'].includes(status)) {
    return {
      state: 'succeeded',
      output: body?.data ?? body?.output ?? body?.result ?? body
    };
  }
  if (['failed', 'error', 'cancelled', 'canceled'].includes(status)) {
    return { state: 'failed' };
  }
  // Some Polza responses expose only the id on submission. The job is still
  // accepted; the status endpoint is the source of truth while polling.
  return { state: 'pending' };
}

function polzaSubmission(body) {
  const state = polzaState(body);
  return {
    requestId: requestId(body?.id ?? body?.request_id),
    state: state.state,
    output: state.output,
    statusUrl: body?.status_url,
    resultUrl: body?.result_url ?? body?.resultUrl
  };
}

function polzaStatus(body) {
  return polzaState(body);
}

function kieSubmission(body) {
  if (Number(body?.code) !== 200) {
    const error = new Error('Provider rejected the media request.');
    error.code = 'provider_rejected';
    throw error;
  }
  return {
    requestId: requestId(body?.data?.taskId ?? body?.data?.task_id),
    state: 'pending'
  };
}

function kieStatus(body) {
  if (Number(body?.code) !== 200 && String(body?.msg ?? '').toLowerCase() !== 'success') {
    return { state: 'failed' };
  }
  const state = String(body?.data?.state ?? '').toLowerCase();
  if (['waiting', 'queuing', 'generating'].includes(state)) return { state: 'pending' };
  if (state === 'fail') return { state: 'failed' };
  if (state !== 'success') return { state: 'failed' };
  return {
    state: 'succeeded',
    output: parseJsonString(body.data.resultJson ?? body.data.result_json ?? body.data.result)
  };
}

const GPTUNNEL_MEDIA_INPUT_KEYS = Object.freeze({
  image_urls: 'image',
  video_urls: 'video',
  audio_urls: 'audio'
});

function isAllowedGptunnelMediaUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (/^data:(?:image|video|audio)\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/iu.test(value)) {
    return true;
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const hostname = url.hostname.toLowerCase().replaceAll(/^[\[]|[\]]$/gu, '');
  return url.protocol === 'https:'
    && !url.username
    && !url.password
    && hostname !== 'localhost'
    && !hostname.endsWith('.localhost')
    && !hostname.endsWith('.local')
    && hostname !== '::1'
    && !/^(?:(?:fc|fd)[0-9a-f]{2}|fe[89ab][0-9a-f]):/u.test(hostname)
    && !/^(?:127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/u.test(hostname);
}

function gptunnelSubmissionBody(route, request) {
  if (typeof route.model !== 'string' || route.model.length === 0) {
    throw new Error('Media route model is not configured.');
  }
  const input = mappedInput(route, request.input);
  const inputRoles = routeRuntimeValue(route, 'inputRoles') ?? GPTUNNEL_MEDIA_INPUT_KEYS;
  const prompt = typeof input.prompt === 'string' ? input.prompt : undefined;
  const inputs = {};
  const params = {};

  for (const [key, value] of Object.entries(input)) {
    if (key === 'prompt' || value === undefined || value === null || value === '') continue;
    const role = inputRoles[key];
    if (role) {
      if (!Array.isArray(value) || value.some((url) => !isAllowedGptunnelMediaUrl(url))) {
        throw new Error('GPTunnel media input URL is not allowed.');
      }
      if (value.length > 0) inputs[role] = [...value];
      continue;
    }
    params[key] = value;
  }

  return {
    model: route.model,
    ...(prompt ? { prompt } : {}),
    ...(Object.keys(params).length > 0 ? { params } : {}),
    ...(Object.keys(inputs).length > 0 ? { inputs } : {})
  };
}

function gptunnelState(body, { rejectUnknown = false } = {}) {
  if (Number(body?.code) !== 0) {
    if (rejectUnknown) {
      const error = new Error('Provider rejected the media request.');
      error.code = 'provider_rejected';
      throw error;
    }
    return { state: 'failed' };
  }
  const status = String(body?.status ?? '').toLowerCase();
  if (['queued', 'running'].includes(status)) return { state: 'pending' };
  if (status === 'failed') return { state: 'failed' };
  if (status === 'done') return { state: 'succeeded', output: body.result };
  if (rejectUnknown) {
    const error = new Error('Provider returned an invalid media task status.');
    error.code = 'provider_invalid_response';
    throw error;
  }
  return { state: 'failed' };
}

function gptunnelSubmission(body) {
  const state = gptunnelState(body, { rejectUnknown: true });
  return {
    requestId: requestId(body?.id),
    state: state.state,
    ...(state.output ? { output: state.output } : {})
  };
}

function gptunnelStatus(body) {
  return gptunnelState(body);
}

const ROUTERAI_VIDEO_PARAMETER_KEYS = new Set([
  'aspect_ratio',
  'duration',
  'resolution',
  'size',
  'generate_audio',
  'seed',
  'watermark',
  'req_key',
  'output_format',
  'safety_tolerance',
  'version'
]);

function routeraiImageReference(url) {
  return {
    type: 'image_url',
    image_url: { url }
  };
}

function routeraiMediaReference(kind, url) {
  return {
    type: `${kind}_url`,
    [`${kind}_url`]: { url }
  };
}

function routeraiFrameImages(imageUrls) {
  return imageUrls.slice(0, 2).map((url, index) => ({
    ...routeraiImageReference(url),
    frame_type: index === 0 ? 'first_frame' : 'last_frame'
  }));
}

function routeraiVideoSubmissionBody(route, request) {
  if (typeof route.model !== 'string' || route.model.length === 0) {
    throw new Error('Media route model is not configured.');
  }
  const input = mappedInput(route, request.input);
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  const isFluxVideoUpscale = route.model === 'black-forest-labs/flux-video-upscale';
  if (!prompt && !isFluxVideoUpscale) throw new Error('Media route prompt is not configured.');
  const isSeedance25References = route.model === 'bytedance/seedance-2.5'
    && input._constructorMode === 'references';
  const isMinimaxH3References = route.model === 'minimax/hailuo-3'
    && input._constructorMode === 'references';
  if (!isSeedance25References && !isMinimaxH3References && !isFluxVideoUpscale && (
    (Array.isArray(input.video_urls) && input.video_urls.length > 0)
    || (Array.isArray(input.audio_urls) && input.audio_urls.length > 0)
  )) {
    throw new Error('RouterAI video input type is not allowed.');
  }
  const imageUrls = input.image_urls ?? [];
  const videoUrls = input.video_urls ?? [];
  const audioUrls = input.audio_urls ?? [];
  if ([imageUrls, videoUrls, audioUrls].some((urls) => (
    !Array.isArray(urls) || urls.some((url) => !isAllowedGptunnelMediaUrl(url))
  ))) {
    throw new Error('RouterAI media input URL is not allowed.');
  }
  if (isFluxVideoUpscale && (
    videoUrls.length !== 1
    || imageUrls.length !== 0
    || audioUrls.length !== 0
  )) {
    throw new Error('FLUX Video Upscale requires exactly one source video.');
  }
  const parameters = Object.fromEntries(Object.entries(input).filter(([key, value]) => (
    ROUTERAI_VIDEO_PARAMETER_KEYS.has(key)
    && value !== undefined
    && value !== null
    && value !== ''
  )));
  if (String(parameters.resolution ?? '').toLowerCase() === '4k') {
    parameters.resolution = '4K';
  }
  const isSeedance25Keyframe = route.model === 'bytedance/seedance-2.5'
    && input._constructorMode === 'first_frame'
    && imageUrls.length > 0;
  const isMinimaxH3Keyframe = route.model === 'minimax/hailuo-3'
    && input._constructorMode === 'first_frame'
    && imageUrls.length > 0;
  return {
    model: route.model,
    ...(prompt ? { prompt } : {}),
    ...parameters,
    ...((isSeedance25References || isMinimaxH3References || isFluxVideoUpscale)
      && (imageUrls.length + videoUrls.length + audioUrls.length > 0)
      ? { input_references: [
        ...imageUrls.map((url) => routeraiMediaReference('image', url)),
        ...videoUrls.map((url) => routeraiMediaReference('video', url)),
        ...audioUrls.map((url) => routeraiMediaReference('audio', url))
      ] }
      : imageUrls.length > 0
      ? (isSeedance25Keyframe || isMinimaxH3Keyframe)
        ? { frame_images: routeraiFrameImages(imageUrls) }
        : { input_references: imageUrls.map(routeraiImageReference) }
      : {})
  };
}

function routeraiVideoOutput(body) {
  if (!Array.isArray(body?.unsigned_urls) || body.unsigned_urls.length === 0) {
    throw new Error('Provider returned an invalid media output.');
  }
  return body.unsigned_urls.map((value) => {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error('Provider returned an invalid media output.');
    }
    if (
      url.protocol !== 'https:'
      || url.username
      || url.password
      || url.origin !== 'https://routerai.ru'
    ) {
      throw new Error('Provider returned an invalid media output.');
    }
    return url.toString();
  });
}

function routeraiProviderCostRubles(body) {
  const value = body?.usage?.cost;
  // Provider cost is audit metadata, never a user-controlled input.  Omit a
  // malformed or implausible value instead of letting it contaminate the
  // generation history or the financial reconciliation job.
  return Number.isFinite(value) && value >= 0 && value <= 1_000_000
    ? value
    : null;
}

function routeraiVideoState(body, { rejectUnknown = false } = {}) {
  const status = String(body?.status ?? '').toLowerCase();
  if (['pending', 'in_progress'].includes(status)) return { state: 'pending' };
  if (['failed', 'cancelled', 'expired'].includes(status)) return { state: 'failed' };
  if (status === 'completed') {
    const providerCostRubles = routeraiProviderCostRubles(body);
    return {
      state: 'succeeded',
      output: routeraiVideoOutput(body),
      ...(providerCostRubles === null ? {} : { providerCostRubles })
    };
  }
  if (rejectUnknown) {
    const error = new Error('Provider returned an invalid media task status.');
    error.code = 'provider_invalid_response';
    throw error;
  }
  return { state: 'failed' };
}

function routeraiVideoSubmission(body) {
  const state = routeraiVideoState(body, { rejectUnknown: true });
  return {
    requestId: requestId(body?.id),
    state: state.state,
    ...(state.output ? { output: state.output } : {}),
    ...(state.providerCostRubles === undefined ? {} : { providerCostRubles: state.providerCostRubles })
  };
}

const ROUTERAI_IMAGE_PARAMETER_KEYS = new Set([
  'aspect_ratio', 'output_format', 'n', 'seed', 'resolution', 'quality', 'background'
]);
const ROUTERAI_SPEECH_PARAMETER_KEYS = new Set([
  'voice', 'response_format', 'temperature', 'top_p', 'seed'
]);
const ROUTERAI_TRANSCRIPTION_PARAMETER_KEYS = new Set([
  'response_format', 'temperature', 'language', 'prompt'
]);
const ROUTERAI_CHAT_AUDIO_PARAMETER_KEYS = new Set([
  'max_tokens', 'temperature', 'top_p', 'seed'
]);
const ROUTERAI_MAX_AUDIO_BYTES = 70 * 1024 * 1024;

function routeraiOperation(route) {
  return routeRuntimeValue(route, 'operation') ?? 'video';
}

function scalarRouteraiInput(input, allowedKeys) {
  return Object.fromEntries(Object.entries(input ?? {}).filter(([key, value]) => (
    allowedKeys.has(key) && value !== undefined && value !== null && value !== '' && value !== 'auto'
  )).map(([key, value]) => [
    key,
    ['n', 'seed', 'temperature', 'top_p'].includes(key) && typeof value === 'string'
      ? Number(value)
      : value
  ]));
}

async function routeraiSubmissionBody(route, request, runtime) {
  const operation = routeraiOperation(route);
  if (operation === 'video') return routeraiVideoSubmissionBody(route, request);
  if (typeof route.model !== 'string' || route.model.length === 0) {
    throw new Error('Media route model is not configured.');
  }
  const input = mappedInput(route, request.input);
  const prompt = String(input.prompt ?? input.input ?? '').trim();
  if (operation === 'transcription') {
    if (Array.isArray(input.audio_urls) && input.audio_urls.length !== 1) {
      throw new Error('RouterAI transcription requires exactly one audio input.');
    }
    const audioUrl = Array.isArray(input.audio_urls) ? input.audio_urls[0] : input.audio_url;
    if (typeof audioUrl !== 'string' || audioUrl.trim().length === 0) {
      throw new Error('RouterAI transcription audio input is required.');
    }
    const downloaded = await downloadFileInput(
      runtime?.fetchImpl ?? fetch,
      audioUrl,
      routeRuntimeValue(route, 'maxInputBytes') ?? 50 * 1024 * 1024
    );
    if (!downloaded.blob.type.startsWith('audio/')) {
      throw new Error('RouterAI transcription input must be audio.');
    }
    const formData = new FormData();
    formData.set('file', downloaded.blob, downloaded.fileName);
    formData.set('model', route.model);
    for (const [key, value] of Object.entries(scalarRouteraiInput(input, ROUTERAI_TRANSCRIPTION_PARAMETER_KEYS))) {
      formData.set(key, String(value));
    }
    return formData;
  }
  if (!prompt) throw new Error(`RouterAI ${operation} input is required.`);
  if (operation === 'speech') {
    return {
      model: route.model,
      input: prompt,
      voice: String(input.voice ?? 'alloy'),
      response_format: String(input.response_format ?? 'mp3'),
      ...scalarRouteraiInput(input, new Set(['temperature', 'top_p', 'seed']))
    };
  }
  if (operation === 'chat_image') {
    if (
      (Array.isArray(input.video_urls) && input.video_urls.length > 0)
      || (Array.isArray(input.audio_urls) && input.audio_urls.length > 0)
    ) throw new Error('RouterAI image input type is not allowed.');
    const imageUrls = input.image_urls ?? [];
    if (!Array.isArray(imageUrls) || imageUrls.some((url) => !isAllowedGptunnelMediaUrl(url))) {
      throw new Error('RouterAI media input URL is not allowed.');
    }
    const content = imageUrls.length === 0
      ? prompt
      : [
          { type: 'text', text: prompt },
          ...imageUrls.map(routeraiImageReference)
        ];
    const imageSize = input.resolution === 'auto' ? undefined : input.resolution;
    return {
      model: route.model,
      messages: [{ role: 'user', content }],
      modalities: ['image', 'text'],
      image_config: Object.fromEntries(Object.entries({
        aspect_ratio: input.aspect_ratio,
        image_size: imageSize
      }).filter(([, value]) => value !== undefined && value !== null && value !== ''))
    };
  }
  if (operation === 'chat_audio') {
    if (
      (Array.isArray(input.image_urls) && input.image_urls.length > 0)
      || (Array.isArray(input.video_urls) && input.video_urls.length > 0)
      || (Array.isArray(input.audio_urls) && input.audio_urls.length > 0)
    ) throw new Error('RouterAI chat audio input type is not allowed.');
    return {
      model: route.model,
      messages: [{ role: 'user', content: prompt }],
      audio: { format: 'mp3' },
      stream: true,
      ...scalarRouteraiInput(input, ROUTERAI_CHAT_AUDIO_PARAMETER_KEYS)
    };
  }
  if (operation !== 'image') throw new Error('RouterAI media operation is not configured.');
  if (
    (Array.isArray(input.video_urls) && input.video_urls.length > 0)
    || (Array.isArray(input.audio_urls) && input.audio_urls.length > 0)
  ) throw new Error('RouterAI image input type is not allowed.');
  const imageUrls = input.image_urls ?? [];
  if (!Array.isArray(imageUrls) || imageUrls.some((url) => !isAllowedGptunnelMediaUrl(url))) {
    throw new Error('RouterAI media input URL is not allowed.');
  }
  const providerImageInput = {
    ...input,
    ...(input.n === undefined && input.num_images !== undefined ? { n: input.num_images } : {})
  };
  return {
    model: route.model,
    prompt,
    ...scalarRouteraiInput(providerImageInput, ROUTERAI_IMAGE_PARAMETER_KEYS),
    ...(imageUrls.length > 0
      ? { input_references: imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })) }
      : {})
  };
}

async function routeraiParseSubmissionResponse(response, route) {
  const operation = routeraiOperation(route);
  if (operation === 'transcription') {
    const body = await response.json();
    const text = body?.text ?? body?.transcript ?? body?.output?.text;
    if (typeof text !== 'string') throw new Error('Provider transcription output is invalid.');
    const providerCostRubles = routeraiProviderCostRubles(body);
    return {
      requestId: requestId(body?.id ?? `routerai-transcription-${Date.now()}`),
      state: 'succeeded',
      output: { text },
      ...(providerCostRubles === null ? {} : { providerCostRubles })
    };
  }
  if (operation === 'speech') {
    const data = Buffer.from(await response.arrayBuffer());
    if (data.byteLength === 0 || data.byteLength > 70 * 1024 * 1024) {
      throw new Error('Provider audio output is invalid.');
    }
    return {
      requestId: `routerai-speech-${Date.now()}`,
      state: 'succeeded',
      output: { audio: binaryOutputFromBuffer(data, response.headers.get('content-type') ?? 'audio/mpeg') }
    };
  }
  if (operation === 'chat_audio') {
    const contentType = String(response.headers.get('content-type') ?? '')
      .split(';', 1)[0]
      .trim()
      .toLowerCase();
    if (contentType !== 'text/event-stream') {
      throw new Error('Provider audio stream MIME type is invalid.');
    }
    const contentLength = response.headers.get('content-length');
    if (contentLength !== null && (
      !/^\d+$/u.test(contentLength)
      || Number(contentLength) > ROUTERAI_MAX_AUDIO_BYTES * 2
    )) throw new Error('Provider audio output is invalid.');
    const stream = await response.text();
    if (stream.length === 0 || stream.length > ROUTERAI_MAX_AUDIO_BYTES * 2) {
      throw new Error('Provider audio output is invalid.');
    }
    const chunks = [];
    let responseId = null;
    for (const line of stream.split(/\r?\n/u)) {
      const match = /^data:\s?(.*)$/u.exec(line);
      if (!match || match[1] === '' || match[1] === '[DONE]') continue;
      let event;
      try {
        event = JSON.parse(match[1]);
      } catch {
        throw new Error('Provider audio stream is invalid.');
      }
      if (responseId === null && event?.id !== undefined) responseId = requestId(event.id);
      const encoded = event?.choices?.[0]?.delta?.audio?.data;
      if (encoded !== undefined) {
        if (typeof encoded !== 'string' || encoded.length === 0) {
          throw new Error('Provider audio stream is invalid.');
        }
        chunks.push(encoded);
      }
    }
    const data = polzaAudioData(chunks.join(''));
    if (data.byteLength > ROUTERAI_MAX_AUDIO_BYTES) {
      throw new Error('Provider audio output is invalid.');
    }
    return {
      requestId: responseId ?? `routerai-chat-audio-${Date.now()}`,
      state: 'succeeded',
      output: { audio: binaryOutputFromBuffer(data, 'audio/mpeg') }
    };
  }
  if (operation === 'chat_image') {
    const body = await response.json();
    const dataUrl = body?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const match = typeof dataUrl === 'string'
      ? /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/u.exec(dataUrl)
      : null;
    if (!match) throw new Error('Provider returned an invalid media output.');
    const data = polzaAudioData(match[2]);
    const providerCostRubles = routeraiProviderCostRubles(body);
    return {
      requestId: requestId(body?.id ?? `routerai-chat-image-${Date.now()}`),
      state: 'succeeded',
      output: { image: { data, content_type: match[1], file_size: data.byteLength } },
      ...(providerCostRubles === null ? {} : { providerCostRubles })
    };
  }
  if (operation !== 'image') throw new Error('RouterAI media operation is not synchronous.');
  const body = await response.json();
  const encoded = body?.data?.[0]?.b64_json;
  const data = polzaAudioData(encoded);
  const format = String(routeRuntimeValue(route, 'outputFormat') ?? 'png').toLowerCase();
  const mime = format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : 'image/png';
  const providerCostRubles = routeraiProviderCostRubles(body);
  return {
    requestId: requestId(body?.id ?? `routerai-image-${Date.now()}`),
    state: 'succeeded',
    output: { image: { data, content_type: mime, file_size: data.byteLength } },
    ...(providerCostRubles === null ? {} : { providerCostRubles })
  };
}

function replicateSubmission(body) {
  const state = replicateState(body);
  return {
    requestId: requestId(body?.id),
    state: state.state,
    output: state.output,
    statusUrl: body?.urls?.get
  };
}

function replicateState(body) {
  if (body?.status === 'succeeded') return { state: 'succeeded', output: body.output };
  if (['starting', 'processing'].includes(body?.status)) return { state: 'pending' };
  return { state: 'failed' };
}

function bearerHeaders(providerConfig) {
  const token = providerConfig?.apiKey ?? providerConfig?.token;
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('Provider credentials are not configured.');
  }
  return { authorization: `Bearer ${token.trim()}`, 'content-type': 'application/json' };
}

function elevenHeaders(providerConfig) {
  const token = providerConfig?.apiKey ?? providerConfig?.token;
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('Provider credentials are not configured.');
  }
  return { 'xi-api-key': token.trim() };
}

function safeRemoteInputUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Media route ElevenLabs file URL is invalid.');
  }
  const hostname = url.hostname.toLowerCase().replaceAll(/^[\[]|[\]]$/gu, '');
  if (
    url.protocol !== 'https:'
    || url.username
    || url.password
    || hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || /^(?:127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/u.test(hostname)
    || hostname === '::1'
    || /^(?:(?:fc|fd)[0-9a-f]{2}|fe[89ab][0-9a-f]):/u.test(hostname)
  ) {
    throw new Error('Media route ElevenLabs file URL is not allowed.');
  }
  return url;
}

async function downloadFileInput(fetchImpl, value, limit) {
  const url = safeRemoteInputUrl(value);
  const response = await fetchImpl(url.toString(), {
    method: 'GET',
    redirect: 'error',
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error('Media route ElevenLabs file download failed.');
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null && (!/^\d+$/u.test(contentLength) || Number(contentLength) > limit)) {
    throw new Error('Media route ElevenLabs file is too large.');
  }
  const data = await response.arrayBuffer();
  if (data.byteLength > limit) throw new Error('Media route ElevenLabs file is too large.');
  const mimeType = String(response.headers.get('content-type') ?? 'application/octet-stream')
    .split(';', 1)[0]
    .trim()
    .toLowerCase();
  return {
    blob: new Blob([data], { type: mimeType || 'application/octet-stream' }),
    fileName: url.pathname.split('/').at(-1) || 'upload.bin'
  };
}

async function jsonOrFormData(route, input, runtime) {
  const bodyType = routeRuntimeValue(route, 'bodyType') ?? 'json';
  const mapped = elevenMappedInput(route, mappedInput(route, input));
  if (bodyType === 'json') return mapped;
  if (bodyType !== 'multipart') throw new Error('Media route ElevenLabs body type is invalid.');

  const files = new Set(routeRuntimeValue(route, 'fileFields') ?? []);
  const limit = routeRuntimeValue(route, 'maxInputBytes') ?? 50 * 1024 * 1024;
  const formData = new FormData();
  for (const [key, originalValue] of Object.entries(mapped)) {
    const value = files.has(key) && typeof originalValue === 'string'
      ? await downloadFileInput(runtime.fetchImpl, originalValue, limit)
      : originalValue;
    if (value === undefined || value === null || value === '') continue;
    if (files.has(key)) {
      if (value instanceof Blob) {
        formData.set(key, value, `upload.${String(value.type || 'application/octet-stream').split('/').at(-1)}`);
        continue;
      }
      if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        formData.set(key, new Blob([value]), 'upload.bin');
        continue;
      }
      if (isRecord(value) && value.blob instanceof Blob) {
        formData.set(key, value.blob, value.fileName ?? 'upload.bin');
        continue;
      }
      throw new Error('Media route ElevenLabs file input is invalid.');
    }
    formData.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  return formData;
}

function removeBlankFields(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function elevenMappedInput(route, mapped) {
  const operation = routeRuntimeValue(route, 'operation');
  if (!operation) return mapped;
  const result = { ...mapped };
  if (result.voice && !result.voice_id) {
    result.voice_id = result.voice;
    delete result.voice;
  }
  if (operation === 'tts' || operation === 'speech_to_speech') {
    const voiceSettings = removeBlankFields({
      stability: result.stability,
      similarity_boost: result.similarity_boost,
      style: result.style,
      speed: result.speed,
      use_speaker_boost: result.use_speaker_boost
    });
    for (const key of ['stability', 'similarity_boost', 'style', 'speed', 'use_speaker_boost']) {
      delete result[key];
    }
    if (Object.keys(voiceSettings).length > 0) result.voice_settings = voiceSettings;
    result.model_id ??= routeRuntimeValue(route, 'modelId') ?? 'eleven_multilingual_v2';
  }
  if (operation === 'stt') {
    result.model_id ??= routeRuntimeValue(route, 'modelId') ?? 'scribe_v1';
  }
  if (String(route?.endpoint ?? '').includes('{voice_id}')) {
    delete result.voice_id;
  }
  return removeBlankFields(result);
}

function elevenSubmissionBody(route, request, runtime) {
  return jsonOrFormData(route, request.input, runtime);
}

async function elevenParseSubmissionResponse(response, route) {
  const responseType = routeRuntimeValue(route, 'responseType') ?? 'binary';
  if (responseType === 'binary') {
    const data = await response.arrayBuffer();
    return {
      requestId: requestId(response.headers.get('request-id') ?? `elevenlabs:${Date.now()}`),
      state: 'succeeded',
      output: { audio: binaryOutputFromBuffer(data, response.headers.get('content-type')) }
    };
  }
  if (responseType !== 'json') throw new Error('Media route ElevenLabs response type is invalid.');
  const body = await response.json();
  const idField = routeRuntimeValue(route, 'requestIdPath') ?? 'request_id';
  return {
    requestId: requestId(outputAtPath(body, idField)),
    state: 'pending',
    output: body
  };
}

function elevenStatus(body, job, route) {
  const success = routeRuntimeValue(route, 'successStatus') ?? 'done';
  const failure = new Set(routeRuntimeValue(route, 'failureStatuses') ?? ['failed', 'error']);
  const statusPath = routeRuntimeValue(route, 'statusPath') ?? 'status';
  const state = String(outputAtPath(body, statusPath) ?? '').toLowerCase();
  if (state === success) return { state: 'succeeded', output: body };
  if (failure.has(state)) return { state: 'failed' };
  return { state: 'pending' };
}

const adapters = Object.freeze({
  fal: Object.freeze({
    submissionUrl: falQueueEndpoint,
    headers(providerConfig) {
      const token = providerConfig?.apiKey ?? providerConfig?.token;
      if (typeof token !== 'string' || token.trim().length === 0) {
        throw new Error('Provider credentials are not configured.');
      }
      return { authorization: `Key ${token.trim()}`, 'content-type': 'application/json' };
    },
    submissionBody(route, request) {
      return mappedInput(route, request.input);
    },
    parseSubmission: falSubmission,
    parseStatus: falStatus
  }),
  polza: Object.freeze({
    submissionUrl(route) {
      return route.endpoint;
    },
    headers(providerConfig, route, body) {
      return polzaAudioOperation(route)
        ? polzaAudioHeaders(providerConfig, body)
        : bearerHeaders(providerConfig);
    },
    submissionBody(route, request, runtime) {
      if (typeof route.model !== 'string' || route.model.length === 0) {
        throw new Error('Media route model is not configured.');
      }
      if (polzaAudioOperation(route)) return polzaAudioSubmissionBody(route, request, runtime);
      const body = {
        model: route.model,
        input: polzaMediaInput(route, request.input),
        async: routeRuntimeValue(route, 'async') ?? true
      };
      const user = routeRuntimeValue(route, 'user');
      const callBackUrl = routeRuntimeValue(route, 'callBackUrl');
      if (user !== undefined) body.user = user;
      if (callBackUrl !== undefined) body.callBackUrl = callBackUrl;
      return body;
    },
    parseSubmissionResponse: polzaAudioParseSubmissionResponse,
    parseSubmission: polzaSubmission,
    parseStatus: polzaStatus
  }),
  kie: Object.freeze({
    submissionUrl(route) {
      return route.endpoint;
    },
    headers: bearerHeaders,
    submissionBody(route, request) {
      if (typeof route.model !== 'string' || route.model.length === 0) {
        throw new Error('Media route model is not configured.');
      }
      return { model: route.model, input: mappedInput(route, request.input) };
    },
    parseSubmission: kieSubmission,
    parseStatus: kieStatus
  }),
  gptunnel: Object.freeze({
    submissionUrl(route) {
      return route.endpoint;
    },
    headers: bearerHeaders,
    submissionBody: gptunnelSubmissionBody,
    parseSubmission: gptunnelSubmission,
    parseStatus: gptunnelStatus
  }),
  routerai: Object.freeze({
    submissionUrl(route) {
      return route.endpoint;
    },
    headers: bearerHeaders,
    submissionBody: routeraiSubmissionBody,
    parseSubmissionResponse: routeraiParseSubmissionResponse,
    parseSubmission: routeraiVideoSubmission,
    parseStatus: routeraiVideoState
  }),
  replicate: Object.freeze({
    submissionUrl(route) {
      return route.endpoint;
    },
    headers: bearerHeaders,
    submissionBody(route, request) {
      const input = mappedInput(route, request.input);
      return route.model
        ? { version: route.model, input }
        : { input };
    },
    parseSubmission: replicateSubmission,
    parseStatus: replicateState
  }),
  elevenlabs: Object.freeze({
    submissionUrl(route, request, body) {
      return directProviderEndpoint(route, 'https://api.elevenlabs.io', 'ElevenLabs', body, request);
    },
    headers(providerConfig, _route, body) {
      const base = elevenHeaders(providerConfig);
      return body instanceof FormData ? base : { ...base, 'content-type': 'application/json' };
    },
    submissionBody: elevenSubmissionBody,
    parseSubmissionResponse: elevenParseSubmissionResponse,
    parseStatus: elevenStatus
  })
});

export function getProviderAdapter(provider) {
  const normalizedProvider = normalizeProvider(provider);
  const adapter = normalizedProvider ? adapters[normalizedProvider] : null;
  if (!adapter) throw new Error('Media route provider is not supported.');
  return adapter;
}

export function extractProviderOutput(output, { outputPath, type } = {}) {
  const parsed = parseJsonString(output);
  const selected = outputAtPath(parsed, outputPath);
  if (type === 'text') {
    if (typeof selected !== 'string') {
      throw new Error('Provider text output is invalid.');
    }
    return Object.freeze({ text: selected });
  }
  const url = firstUrl(selected);
  const data = firstData(selected);
  return Object.freeze({
    ...(url ? { url } : {}),
    ...(data ? { data } : {}),
    mimeType: outputMimeType(selected),
    size: outputSize(selected)
  });
}
