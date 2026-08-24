import { randomUUID } from 'node:crypto';

import { sanitizeAuditText } from './history-contract.js';

const PROVIDERS = Object.freeze([
  ['openrouter.ai', 'openrouter'],
  ['requesty.ai', 'requesty'],
  ['polza.ai', 'polza'],
  ['elevenlabs.io', 'elevenlabs'],
  ['fal.run', 'fal'],
  ['replicate.com', 'replicate'],
  ['kie.ai', 'kie'],
  ['googleapis.com', 'google'],
  ['nvidia.com', 'nvidia']
]);

function providerForHost(hostname) {
  const normalized = hostname.toLowerCase();
  const found = PROVIDERS.find(([suffix]) => (
    normalized === suffix || normalized.endsWith(`.${suffix}`)
  ));
  return found?.[1] ?? normalized.split('.').slice(-2, -1)[0] ?? 'unknown';
}

function boundedString(value, maximum) {
  return String(value ?? '').replace(/\u0000/g, '').slice(0, maximum);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const SECRET_FIELD = /(?:api[_-]?key|authorization|cookie|password|secret|token|file[_-]?data|buffer|bytes)/i;
const RAW_CONTENT_FIELD = /^(?:messages?|prompt|content|input|output|choices?|response|text)$/i;
const SAFE_FIELD = /^[a-zA-Z][a-zA-Z0-9_.:-]{0,99}$/;

function safeFieldNames(value) {
  if (!isRecord(value)) return [];
  return Object.keys(value)
    .filter((key) => SAFE_FIELD.test(key))
    .filter((key) => !SECRET_FIELD.test(key) && !RAW_CONTENT_FIELD.test(key))
    .slice(0, 50)
    .sort();
}

function safeFieldName(value) {
  const name = boundedString(value, 100);
  return SECRET_FIELD.test(name) || RAW_CONTENT_FIELD.test(name) ? '[REDACTED]' : name;
}

function safeModel(value) {
  return typeof value === 'string' && value.length <= 200 ? value : null;
}

function safeProviderErrorCode(value) {
  const code = String(value ?? '').trim();
  return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/u.test(code) ? code : null;
}

function safeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function chatMetadata(value) {
  const messages = Array.isArray(value?.messages) ? value.messages : null;
  if (!messages) return {};
  return {
    chatMessageCount: messages.length,
    chatRoles: messages
      .map((message) => isRecord(message) ? message.role : null)
      .filter((role) => ['system', 'user', 'assistant', 'tool'].includes(role))
      .slice(0, 20)
  };
}

function tokenUsage(value) {
  const usage = isRecord(value?.usage) ? value.usage : null;
  if (!usage) return null;
  const inputTokens = safeInteger(usage.prompt_tokens ?? usage.input_tokens);
  const outputTokens = safeInteger(usage.completion_tokens ?? usage.output_tokens);
  const totalTokens = safeInteger(usage.total_tokens);
  const result = {
    ...(inputTokens !== null ? { inputTokens } : {}),
    ...(outputTokens !== null ? { outputTokens } : {}),
    ...(totalTokens !== null ? { totalTokens } : {})
  };
  return Object.keys(result).length > 0 ? result : null;
}

function jsonPayloadMetadata(value, { includeFieldNames = true } = {}) {
  if (Array.isArray(value)) {
    return {
      rootType: 'array',
      itemCount: value.length
    };
  }
  if (!isRecord(value)) return { rootType: typeof value };
  const usage = tokenUsage(value);
  return {
    rootType: 'object',
    ...(safeModel(value.model) ? { model: safeModel(value.model) } : {}),
    ...(includeFieldNames && safeFieldNames(value).length > 0 ? { bodyFieldNames: safeFieldNames(value) } : {}),
    ...chatMetadata(value),
    ...(Array.isArray(value.choices) ? { completionChoiceCount: value.choices.length } : {}),
    ...(usage ? { tokenUsage: usage } : {}),
    ...(isRecord(value.error) ? {
      providerErrorType: boundedString(value.error.type ?? value.error.code ?? 'provider_error', 100),
      ...(safeProviderErrorCode(value.error.code ?? value.error.type)
        ? { providerErrorCode: safeProviderErrorCode(value.error.code ?? value.error.type) }
        : {})
    } : {})
  };
}

function auditContextMetadata(audit) {
  if (!isRecord(audit)) return {};
  return {
    ...(audit.parentRequestKey ? { parentRequestKey: boundedString(audit.parentRequestKey, 200) } : {})
  };
}

function bodyPayload(body, audit) {
  const context = auditContextMetadata(audit);
  if (body === undefined || body === null) return {};
  if (typeof body === 'string') {
    const byteLength = Buffer.byteLength(body, 'utf8');
    try {
      return {
        bodyType: 'json',
        ...jsonPayloadMetadata(JSON.parse(body)),
        byteLength,
        ...context
      };
    } catch {
      return { bodyType: 'text', byteLength, bodyOmitted: 'redacted', ...context };
    }
  }
  if (body instanceof URLSearchParams) {
    return {
      bodyType: 'urlencoded',
      bodyFieldNames: safeFieldNames(Object.fromEntries(body.entries())),
      byteLength: Buffer.byteLength(body.toString(), 'utf8'),
      ...context
    };
  }
  if (body instanceof FormData) {
    return {
      bodyType: 'multipart',
      fields: [...body.entries()].map(([name, value]) => ({
        name: safeFieldName(name),
        ...(typeof value === 'string'
          ? { valueLength: value.length }
          : { mimeType: value.type || null, byteLength: value.size })
      })),
      ...context
    };
  }
  if (body instanceof Blob) {
    return { bodyType: 'binary', mimeType: body.type || null, byteLength: body.size, ...context };
  }
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return { bodyType: 'binary', byteLength: body.byteLength, ...context };
  }
  return { bodyType: typeof body, ...context };
}

async function responsePayload(response, maximumBytes) {
  const contentType = String(response.headers.get('content-type') ?? '').toLowerCase();
  const contentLength = Number(response.headers.get('content-length'));
  const base = {
    contentType: contentType.split(';', 1)[0] || null,
    ...(Number.isSafeInteger(contentLength) && contentLength >= 0 ? { byteLength: contentLength } : {})
  };
  if (!contentType.includes('json') && !contentType.startsWith('text/')) return base;
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    return { ...base, bodyOmitted: 'too_large' };
  }
  const text = await response.clone().text();
  if (Buffer.byteLength(text, 'utf8') > maximumBytes) {
    return { ...base, bodyOmitted: 'too_large' };
  }
  if (contentType.includes('json')) {
    try {
      return { ...base, body: jsonPayloadMetadata(JSON.parse(text), { includeFieldNames: false }) };
    } catch {
      return { ...base, bodyOmitted: 'invalid_json' };
    }
  }
  return { ...base, bodyOmitted: 'redacted_text', byteLength: Buffer.byteLength(text, 'utf8') };
}

function requestTarget(input) {
  const raw = input instanceof Request ? input.url : String(input);
  const url = new URL(raw);
  return {
    provider: providerForHost(url.hostname),
    endpointHost: url.hostname.toLowerCase(),
    endpointPath: url.pathname
  };
}

function normalizedErrorCodeForHttpStatus(status) {
  if (status === 401 || status === 403) return 'provider_auth_failed';
  if (status === 402) return 'provider_payment_required';
  if (status === 408) return 'provider_timeout';
  if (status === 429) return 'provider_rate_limited';
  if (status >= 500 && status <= 599) return 'provider_unavailable';
  if (status >= 400 && status <= 499) return 'provider_bad_request';
  return null;
}

function normalizedErrorCodeForError(error) {
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return 'provider_timeout';
  return boundedString(error?.code ?? error?.name ?? 'network_error', 80);
}

function normalizedStatusForError(error) {
  return normalizedErrorCodeForError(error) === 'provider_timeout' ? 'timeout' : 'failed';
}

function auditContext(value) {
  return isRecord(value) ? value : {};
}

function providerRequestKey(parentRequestKey) {
  if (!parentRequestKey) return `provider:${randomUUID()}`;
  return `${boundedString(parentRequestKey, 120)}:provider:${randomUUID()}`;
}

function fetchInitWithoutAudit(init) {
  if (!isRecord(init) || !Object.hasOwn(init, 'audit')) return init;
  const { audit, ...fetchInit } = init;
  return fetchInit;
}

export function createProviderAuditedFetch({
  repository,
  fetchImpl = fetch,
  onError = () => {},
  maximumResponseBytes = 1_000_000
}) {
  if (!repository?.startProviderApiCall || !repository?.completeProviderApiCall) {
    throw new TypeError('Provider API audit repository is required.');
  }
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation is required.');

  async function auditedFetch(input, init = {}) {
    const target = requestTarget(input);
    const method = String(init.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const audit = auditContext(init.audit);
    const started = performance.now();
    const parentRequestKey = audit.requestKey ?? audit.parentRequestKey ?? null;
    const requestKey = providerRequestKey(parentRequestKey);
    let callId = null;
    try {
      callId = await repository.startProviderApiCall({
        requestKey,
        generationId: audit.generationId ?? null,
        telegramUserId: audit.telegramUserId ?? null,
        provider: target.provider,
        operation: audit.operation ?? `${method} ${target.endpointPath}`,
        endpointHost: target.endpointHost,
        endpointPath: target.endpointPath,
        requestPayload: bodyPayload(init.body, { parentRequestKey })
      });
    } catch (error) {
      onError(error, { action: 'history.provider_api.start' });
    }

    try {
      const response = await fetchImpl(input, fetchInitWithoutAudit(init));
      if (callId) {
        try {
          const responseMetadata = await responsePayload(response, maximumResponseBytes);
          await repository.completeProviderApiCall({
            callId,
            status: response.ok ? 'succeeded' : 'failed',
            httpStatus: response.status,
            providerRequestId: response.headers.get('x-request-id')
              ?? response.headers.get('request-id'),
            responsePayload: responseMetadata,
            errorCode: response.ok
              ? null
              : responseMetadata.body?.providerErrorCode
                ?? normalizedErrorCodeForHttpStatus(response.status),
            durationMs: Math.round(performance.now() - started)
          });
        } catch (error) {
          onError(error, { action: 'history.provider_api.complete' });
        }
      }
      return response;
    } catch (error) {
      if (callId) {
        try {
          await repository.completeProviderApiCall({
            callId,
            status: normalizedStatusForError(error),
            errorCode: normalizedErrorCodeForError(error),
            errorMessage: sanitizeAuditText(error?.message ?? 'provider request failed'),
            durationMs: Math.round(performance.now() - started)
          });
        } catch (auditError) {
          onError(auditError, { action: 'history.provider_api.fail' });
        }
      }
      throw error;
    }
  }

  auditedFetch.withAuditContext = (context = {}) => (
    (input, init = {}) => auditedFetch(input, {
      ...init,
      audit: {
        ...auditContext(init.audit),
        ...auditContext(context)
      }
    })
  );

  return auditedFetch;
}
