import { extractProviderOutput, getProviderAdapter } from './provider-adapters.js';
import {
  normalizeProvider,
  normalizeProviderModelId
} from './provider-route-matrix.js';

const transientReadStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
const safeSubmissionRetryStatuses = new Set([429]);

function providerLabel(value) {
  const normalized = normalizeProvider(value);
  if (normalized) return normalized;
  if (typeof value !== 'string') return null;
  const safe = value.trim().toLowerCase().replaceAll(/[^a-z0-9._-]/gu, '');
  return safe.slice(0, 64) || null;
}

function routeModelId(route) {
  return normalizeProviderModelId(route?.providerModelId ?? route?.model);
}

function routeRuntimeValue(route, name) {
  return route?.[name] ?? route?.runtime?.[name];
}

function safeCause(cause) {
  if (!cause) return undefined;
  const sanitized = new Error('Provider request failed.');
  sanitized.name = 'ProviderRequestError';
  if (typeof cause.code === 'string' && /^[A-Za-z0-9_.-]{1,64}$/u.test(cause.code)) {
    sanitized.code = cause.code;
  }
  return sanitized;
}

function safeRouteErrorMessage(error, fallback = 'Media provider route failed.') {
  const message = String(error?.message ?? '');
  if (/credentials are not configured/iu.test(message)) {
    return 'Provider credentials are not configured.';
  }
  if (/credential-free HTTPS URL/iu.test(message)) {
    return 'Media route endpoint must be a credential-free HTTPS URL.';
  }
  if (/^Media runtime [A-Za-z][A-Za-z0-9]* is invalid\.$/u.test(message)) return message;
  if (/^Media route [A-Za-z][A-Za-z0-9 ._-]{0,96} (?:is invalid|is not configured)\.$/u.test(message)) {
    return message;
  }
  if (/^Media route provider is not supported\.$/u.test(message)) return message;
  if (/^Polza media [A-Za-z0-9 ._-]{0,128}\.$/u.test(message)) return message;
  if (/^Provider (?:returned|polling|text|media|document|binary)[^.]{0,120}\.$/u.test(message)) {
    return message;
  }
  return fallback;
}

function safeErrorCode(error, fallback = 'provider_error') {
  const code = error?.code;
  return typeof code === 'string' && /^[A-Za-z0-9_.-]{1,64}$/u.test(code)
    ? code
    : fallback;
}

function safeProviderCode(value) {
  const code = String(value ?? '').trim();
  return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/u.test(code) ? code : null;
}

async function safeProviderResponseDetails(response) {
  const status = Number(response?.status);
  let body = null;
  try {
    const readable = typeof response?.clone === 'function' ? response.clone() : response;
    body = await readable.json();
  } catch {
    body = null;
  }
  const providerCode = safeProviderCode(
    body?.error?.code
      ?? body?.error_code
      ?? body?.code
      ?? body?.type
      ?? (typeof body?.error === 'string' ? body.error : null),
  );
  return Object.freeze({
    httpStatus: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    providerCode,
  });
}

export class MediaProviderError extends Error {
  constructor(
    message,
    {
      provider,
      providerModelId,
      requestId = null,
      acceptedJob = false,
      code = 'provider_error',
      httpStatus = null,
      providerCode = null,
      cause
    } = {}
  ) {
    super(message, { cause: safeCause(cause) });
    this.name = 'MediaProviderError';
    this.provider = providerLabel(provider);
    this.providerModelId = normalizeProviderModelId(providerModelId);
    this.requestId = requestId;
    this.acceptedJob = acceptedJob;
    this.code = code;
    const inheritedStatus = Number(cause?.httpStatus);
    this.httpStatus = Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599
      ? httpStatus
      : Number.isInteger(inheritedStatus) && inheritedStatus >= 100 && inheritedStatus <= 599
        ? inheritedStatus
        : null;
    this.providerCode = safeProviderCode(providerCode ?? cause?.providerCode);
  }
}

function integerOption(config, route, name, fallback, { minimum = 0 } = {}) {
  const value = route[name] ?? config[name] ?? fallback;
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new TypeError(`Media runtime ${name} is invalid.`);
  }
  return value;
}

function routeRecords(config, routeId) {
  const configured = config?.routes;
  const records = Array.isArray(configured)
    ? configured.filter((route) => route?.id === routeId)
    : configured?.[routeId];
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(`No configured media route for "${routeId}".`);
  }
  return records.map((route) => {
    if (!route || typeof route !== 'object' || Array.isArray(route)) return route;
    const providerModelId = routeModelId(route);
    const model = normalizeProviderModelId(route.model);
    return {
      ...route,
      provider: normalizeProvider(route.provider) ?? route.provider,
      ...(providerModelId ? { providerModelId } : {}),
      ...(model ? { model } : providerModelId ? { model: providerModelId } : {})
    };
  });
}

function configuredUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${label} must be a valid URL.`);
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new TypeError(`${label} must be a credential-free HTTPS URL.`);
  }
  return url.toString();
}

function endpointForRequest(template, requestIdValue, label) {
  const endpoint = String(template ?? '');
  if (!endpoint.includes('{requestId}')) return configuredUrl(endpoint, label);
  return configuredUrl(
    endpoint.replaceAll('{requestId}', encodeURIComponent(requestIdValue)),
    label
  );
}

function trustedResponseUrl(value, routeEndpoint, label) {
  const url = configuredUrl(value, label);
  if (new URL(url).origin !== new URL(routeEndpoint).origin) {
    throw new Error(`${label} origin does not match the configured route.`);
  }
  return url;
}

function routeUrl(route, job, field, responseValue, submissionEndpoint) {
  if (route[field]) return endpointForRequest(route[field], job.requestId, `Media route ${field}`);
  if (responseValue) return trustedResponseUrl(responseValue, submissionEndpoint, `Provider ${field}`);
  throw new Error(`Media route ${field} is not configured.`);
}

function delay(milliseconds) {
  if (milliseconds === 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    throw new Error('Provider returned an invalid JSON response.');
  }
}

async function fetchWithTimeout(fetchImpl, url, options, timeoutMs) {
  return fetchImpl(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs)
  });
}

async function submit(route, request, runtime) {
  const provider = providerLabel(route.provider);
  const providerModelId = routeModelId(route);
  let adapter;
  let endpoint;
  let options;
  let retries;
  let retryDelayMs;
  let timeoutMs;
  try {
    adapter = getProviderAdapter(route.provider);
    const providerConfig = runtime.config.providers?.[provider];
    retries = integerOption(runtime.config, route, 'submissionRetries', 1);
    retryDelayMs = integerOption(runtime.config, route, 'retryDelayMs', 250);
    timeoutMs = integerOption(runtime.config, route, 'requestTimeoutMs', 15_000, { minimum: 1 });
    const body = await adapter.submissionBody(route, request, runtime);
    endpoint = configuredUrl(adapter.submissionUrl(route, request, body), 'Media route endpoint');
    options = {
      method: 'POST',
      headers: adapter.headers(providerConfig, route, body),
      body: body instanceof FormData ? body : JSON.stringify(body)
    };
  } catch (cause) {
    throw new MediaProviderError(safeRouteErrorMessage(cause), {
      provider,
      providerModelId,
      acceptedJob: false,
      code: safeErrorCode(cause),
      cause
    });
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let response;
    try {
      response = await fetchWithTimeout(runtime.fetchImpl, endpoint, options, timeoutMs);
    } catch (cause) {
      throw new MediaProviderError('Media provider submission outcome is unknown.', {
        provider,
        providerModelId,
        acceptedJob: true,
        code: 'provider_outcome_unknown',
        cause
      });
    }

    if (!response.ok) {
      if (
        safeSubmissionRetryStatuses.has(response.status)
        && attempt < retries
      ) {
        await delay(retryDelayMs * (attempt + 1));
        continue;
      }
      const details = await safeProviderResponseDetails(response);
      throw new MediaProviderError('Media provider rejected the request.', {
        provider,
        providerModelId,
        code: 'provider_rejected',
        acceptedJob: false,
        ...details
      });
    }

    try {
      if (
        typeof adapter.parseSubmissionResponse === 'function'
        && routeRuntimeValue(route, 'operation')
      ) {
        return { adapter, endpoint, job: await adapter.parseSubmissionResponse(response, route) };
      }
      const responseBody = await parseJson(response).catch((cause) => {
        throw new MediaProviderError('Media provider accepted an invalid response.', {
          provider,
          providerModelId,
          acceptedJob: true,
          code: 'provider_invalid_response',
          cause
        });
      });
      return { adapter, endpoint, job: adapter.parseSubmission(responseBody, route) };
    } catch (cause) {
      if (cause?.code === 'provider_rejected') {
        throw new MediaProviderError('Media provider rejected the request.', {
          provider,
          providerModelId,
          code: 'provider_rejected',
          acceptedJob: false,
          cause
        });
      }
      throw new MediaProviderError('Media provider accepted an invalid response.', {
        provider,
        providerModelId,
        acceptedJob: true,
        code: 'provider_invalid_response',
        cause
      });
    }
  }
  throw new MediaProviderError('Media provider rejected the request.', {
    provider,
    providerModelId,
    code: 'provider_rejected',
    acceptedJob: false
  });
}

async function readJson(route, url, runtime) {
  const adapter = getProviderAdapter(route.provider);
  const providerConfig = runtime.config.providers?.[providerLabel(route.provider)];
  const retries = integerOption(runtime.config, route, 'requestRetries', 2);
  const retryDelayMs = integerOption(runtime.config, route, 'retryDelayMs', 250);
  const timeoutMs = integerOption(runtime.config, route, 'requestTimeoutMs', 15_000, { minimum: 1 });

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let response;
    try {
      response = await fetchWithTimeout(
        runtime.fetchImpl,
        url,
        { method: 'GET', headers: adapter.headers(providerConfig) },
        timeoutMs
      );
    } catch (error) {
      if (attempt === retries) throw error;
      await delay(retryDelayMs * (attempt + 1));
      continue;
    }

    if (response.ok) return await parseJson(response);
    if (!transientReadStatuses.has(response.status)) {
      const details = await safeProviderResponseDetails(response);
      const error = new Error('Provider polling failed.');
      Object.assign(error, details);
      throw error;
    }
    if (attempt === retries) {
      const details = await safeProviderResponseDetails(response);
      const error = new Error('Provider polling failed.');
      Object.assign(error, details);
      throw error;
    }
    await delay(retryDelayMs * (attempt + 1));
  }
  throw new Error('Provider polling failed.');
}

function routeOutputValue(route, name) {
  return route[name] ?? route.runtime?.[name];
}

function resultProviderMetadata(route) {
  const providerModelId = routeModelId(route);
  return {
    provider: providerLabel(route.provider),
    ...(providerModelId
      ? { providerModelId, model: providerModelId }
      : {})
  };
}

function normalizedResult(route, job, output) {
  const extracted = extractProviderOutput(output, {
    outputPath: routeOutputValue(route, 'outputPath'),
    type: route.type
  });
  const mimeType = extracted.mimeType ?? route.mimeType;
  if (typeof mimeType !== 'string' || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/iu.test(mimeType)) {
    throw new Error('Media route MIME type is not configured.');
  }
  const normalizedMimeType = mimeType.toLowerCase();
  if (!['image', 'video', 'audio', 'document', 'text'].includes(route.type)) {
    throw new Error('Media route result type is invalid.');
  }
  if (route.type === 'text') {
    if (!normalizedMimeType.startsWith('text/')) {
      throw new Error('Provider text MIME type does not match the configured result type.');
    }
    return Object.freeze({
      type: 'text',
      text: extracted.text,
      mimeType: normalizedMimeType,
      ...resultProviderMetadata(route),
      requestId: job.requestId
    });
  }

  if (route.type !== 'document' && !normalizedMimeType.startsWith(`${route.type}/`)) {
    throw new Error('Provider media MIME type does not match the configured result type.');
  }
  if (
    route.type === 'document'
    && extracted.mimeType
    && route.mimeType
    && normalizedMimeType !== route.mimeType.toLowerCase()
  ) {
    throw new Error('Provider document MIME type does not match the configured result type.');
  }
  if (extracted.size !== null && (!Number.isSafeInteger(extracted.size) || extracted.size < 0)) {
    throw new Error('Provider media size is invalid.');
  }
  const maxBytes = routeOutputValue(route, 'maxBytes');
  if (maxBytes !== undefined) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
      throw new Error('Media route size limit is invalid.');
    }
    if (extracted.size !== null && extracted.size > maxBytes) {
      throw new Error('Provider media output exceeds the configured size limit.');
    }
  }
  const result = {
    type: route.type,
    mimeType: normalizedMimeType,
    ...resultProviderMetadata(route),
    requestId: job.requestId
  };
  if (Number.isFinite(job?.providerCostRubles)
    && job.providerCostRubles >= 0
    && job.providerCostRubles <= 1_000_000) {
    result.providerCostRubles = job.providerCostRubles;
  }
  if (extracted.data) {
    result.data = extracted.data;
  } else {
    result.url = configuredUrl(extracted.url, 'Provider media output');
  }
  if (extracted.size !== null) result.size = extracted.size;
  return Object.freeze(result);
}

async function completeAcceptedJob(route, adapter, job, submissionEndpoint, runtime) {
  const provider = providerLabel(route.provider);
  const providerModelId = routeModelId(route);
  if (job.state === 'failed') {
    throw new MediaProviderError('Media provider job failed.', {
      provider,
      providerModelId,
      requestId: job.requestId,
      acceptedJob: true,
      code: 'provider_job_failed'
    });
  }
  if (job.state === 'succeeded' && job.output) {
    try {
      return normalizedResult(route, job, job.output);
    } catch (cause) {
      throw new MediaProviderError('Media provider returned an invalid media output.', {
        provider,
        providerModelId,
        requestId: job.requestId,
        acceptedJob: true,
        code: 'provider_invalid_output',
        cause
      });
    }
  }

  const maxAttempts = integerOption(runtime.config, route, 'maxPollAttempts', 120, { minimum: 1 });
  const pollIntervalMs = integerOption(runtime.config, route, 'pollIntervalMs', 2_000);
  let currentJob = job;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0 || pollIntervalMs > 0) await delay(pollIntervalMs);
    let status;
    try {
      const statusUrl = routeUrl(
        route,
        currentJob,
        'statusEndpoint',
        currentJob.statusUrl,
        submissionEndpoint
      );
      const body = await readJson(route, statusUrl, runtime);
      status = adapter.parseStatus(body, currentJob, route);
    } catch (cause) {
      throw new MediaProviderError('Media provider polling failed.', {
        provider,
        providerModelId,
        requestId: job.requestId,
        acceptedJob: true,
        code: 'provider_polling_failed',
        cause
      });
    }

    currentJob = { ...currentJob, ...status };
    if (status.state === 'failed') {
      throw new MediaProviderError('Media provider job failed.', {
        provider,
        providerModelId,
        requestId: job.requestId,
        acceptedJob: true,
        code: 'provider_job_failed'
      });
    }
    if (status.state !== 'succeeded') continue;
    if (status.output) {
      try {
        return normalizedResult(route, currentJob, status.output);
      } catch (cause) {
        throw new MediaProviderError('Media provider returned an invalid media output.', {
          provider,
          providerModelId,
          requestId: job.requestId,
          acceptedJob: true,
          code: 'provider_invalid_output',
          cause
        });
      }
    }

    try {
      const resultUrl = routeUrl(
        route,
        currentJob,
        'resultEndpoint',
        currentJob.resultUrl,
        submissionEndpoint
      );
      const output = await readJson(route, resultUrl, runtime);
      return normalizedResult(route, currentJob, output);
    } catch (cause) {
      throw new MediaProviderError('Media provider result retrieval failed.', {
        provider,
        providerModelId,
        requestId: job.requestId,
        acceptedJob: true,
        code: 'provider_result_failed',
        cause
      });
    }
  }
  throw new MediaProviderError('Media provider polling timed out.', {
    provider,
    providerModelId,
    requestId: job.requestId,
    acceptedJob: true,
    code: 'provider_polling_timeout'
  });
}

export async function invokeMediaTool(request, {
  config,
  fetchImpl = fetch,
  onAttempt = async () => {}
} = {}) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new TypeError('Media request must be an object.');
  }
  if (typeof request.routeId !== 'string' || request.routeId.length === 0) {
    throw new TypeError('Media request routeId is required.');
  }
  if (!request.input || typeof request.input !== 'object' || Array.isArray(request.input)) {
    throw new TypeError('Media request input must be an object.');
  }
  if (!config || typeof config !== 'object' || typeof fetchImpl !== 'function' || typeof onAttempt !== 'function') {
    throw new TypeError('Media runtime configuration is invalid.');
  }

  const routes = routeRecords(config, request.routeId);
  const runtime = { config, fetchImpl };
  let lastError;
  for (const [attempt, route] of routes.entries()) {
    let acceptedJob = null;
    try {
      await onAttempt({
        route,
        attempt,
        routeId: request.routeId
      });
      const accepted = await submit(route, request, runtime);
      acceptedJob = accepted.job;
      return await completeAcceptedJob(
        route,
        accepted.adapter,
        accepted.job,
        accepted.endpoint,
        runtime
      );
    } catch (error) {
      if (error?.acceptedJob) throw error;
      if (acceptedJob) {
        throw new MediaProviderError('Media provider returned an invalid media output.', {
          provider: providerLabel(route.provider),
          providerModelId: routeModelId(route),
          requestId: acceptedJob.requestId,
          acceptedJob: true,
          code: 'provider_invalid_output',
          cause: error
        });
      }
      lastError = error instanceof MediaProviderError
        ? error
        : new MediaProviderError(safeRouteErrorMessage(error), {
          provider: providerLabel(route.provider),
          providerModelId: routeModelId(route),
          acceptedJob: false,
          code: safeErrorCode(error),
          cause: error
        });
    }
  }
  throw lastError ?? new MediaProviderError('No media provider accepted the request.', {
    code: 'provider_rejected'
  });
}
