import { exactProviderRoutesFor } from './provider-route-matrix.js';

const freeRoutes = Object.freeze([
  {
    provider: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openai/gpt-oss-20b:free'
  },
  {
    provider: 'requesty',
    endpoint: 'https://router.requesty.ai/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct'
  }
]);

const requestedProviderEndpoints = Object.freeze({
  polza: 'https://polza.ai/api/v1/chat/completions',
  routerai: 'https://routerai.ru/api/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  requesty: 'https://router.requesty.ai/v1/chat/completions'
});

const supportedRequestedProviders = new Set([
  'polza',
  'routerai',
  'openrouter',
  'requesty'
]);

const DEFAULT_MAX_TOKENS = 900;
const MAX_RESPONSE_BYTES = 1_000_000;

class LlmProviderError extends Error {
  constructor(message, { provider, acceptedRequest = false, cause } = {}) {
    super(message, { cause });
    this.name = 'LlmProviderError';
    this.provider = provider ?? null;
    this.acceptedRequest = acceptedRequest;
  }
}

function requestedModelRoute(providerModel, provider = 'polza', routeDefinition = null, options = {}) {
  if (
    typeof providerModel !== 'string'
    || !/^[a-z0-9][a-z0-9._/-]{2,120}(?::[a-z0-9][a-z0-9._-]{0,30})?$/i.test(providerModel)
  ) {
    throw new TypeError('Invalid provider model id.');
  }
  const endpoint = routeDefinition?.endpoint ?? requestedProviderEndpoints[provider];
  if (!endpoint) throw new TypeError('Unsupported requested-model provider.');
  return Object.freeze({
    provider,
    endpoint,
    model: routeDefinition?.model ?? routeDefinition?.providerModelId ?? providerModel,
    ...(routeDefinition?.protocol ? { protocol: routeDefinition.protocol } : {}),
    ...(Array.isArray(routeDefinition?.supportedParameters)
      ? { supportedParameters: Object.freeze([...routeDefinition.supportedParameters]) }
      : {}),
    ...(options.fallbackFor ? { fallbackFor: options.fallbackFor } : {}),
    requested: true
  });
}

function requestedModelRoutes(providerModels, providerKeys) {
  if (!Array.isArray(providerModels) || providerModels.length === 0) {
    throw new TypeError('Requested provider models must be a non-empty array.');
  }
  const configuredKeys = providerKeys ?? {};
  return [...new Set(providerModels)].flatMap((model) => {
    const exactRoutes = exactProviderRoutesFor(model);
    const candidates = exactRoutes.some(({ provider }) => configuredKeys[provider])
      ? exactRoutes
      : ['openrouter', 'requesty'].map((provider) => ({
        provider,
        providerModelId: model
      }));
    return candidates
      .filter(({ provider }) => configuredKeys[provider])
      .map((route) => requestedModelRoute(
        route.providerModelId,
        route.provider,
        route
      ));
  });
}

function pinnedModelRoutes(providerModels, provider, providerKeys) {
  if (!Array.isArray(providerModels) || providerModels.length === 0) {
    throw new TypeError('Requested provider models must be a non-empty array.');
  }
  const configuredKeys = providerKeys ?? {};
  return [...new Set(providerModels)].flatMap((model) => {
    if (provider === 'polza' || provider === 'routerai') {
      const exactRoutes = exactProviderRoutesFor(model).filter((route) => (
        route.provider === provider
        || (provider === 'polza' && route.provider === 'routerai')
      ));
      return exactRoutes
        .filter(({ provider: routeProvider }) => configuredKeys[routeProvider])
        .map((route) => requestedModelRoute(
          route.providerModelId,
          route.provider,
          route,
          route.provider === 'routerai' && provider === 'polza'
            ? { fallbackFor: 'polza' }
            : undefined
        ));
    }
    if (!configuredKeys[provider]) return [];
    return [requestedModelRoute(model, provider)];
  });
}

function textFromContent(content) {
  if (typeof content === 'string') return content.trim();
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (!part || typeof part !== 'object') return '';
      if (part.type && !['text', 'output_text'].includes(part.type)) return '';
      return typeof part.text === 'string' ? part.text : '';
    })
    .join('')
    .trim();
}

function extractText(body) {
  const chatContent = body?.choices?.[0]?.message?.content;
  const chatText = textFromContent(chatContent);
  if (chatText) return chatText;

  const messagesText = textFromContent(body?.content);
  if (messagesText) return messagesText;

  const directText = textFromContent(body?.output_text);
  if (directText) return directText;

  const responseContent = Array.isArray(body?.output)
    ? body.output.flatMap((item) => (
      item?.type === 'message'
        ? (Array.isArray(item.content) ? item.content : [item.content])
        : item?.type === 'output_text' ? [item] : []
    ))
    : [];
  const responseText = textFromContent(responseContent);
  if (responseText) return responseText;

  throw new Error('LLM response did not contain text.');
}

function parseEventStream(rawBody) {
  const payloads = rawBody
    .split(/\r?\n\r?\n/u)
    .flatMap((event) => event
      .split(/\r?\n/u)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .filter((payload) => payload && payload !== '[DONE]')
      .map((payload) => {
        try {
          return JSON.parse(payload);
        } catch {
          return null;
        }
      }))
    .filter(Boolean);
  if (!payloads.length) return null;

  const completed = payloads.find((payload) => (
    payload.output || payload.output_text || payload.choices || payload.content
  ));
  if (completed) return completed;

  const deltas = payloads
    .map((payload) => payload.delta ?? payload.text ?? '')
    .filter((value) => typeof value === 'string')
    .join('')
    .trim();
  return deltas ? { output_text: deltas } : null;
}

async function readBoundedJson(response, maxBytes = MAX_RESPONSE_BYTES) {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error('LLM response exceeded the size limit.');
  }
  const rawBody = await response.text();
  if (Buffer.byteLength(rawBody, 'utf8') > maxBytes) {
    throw new Error('LLM response exceeded the size limit.');
  }
  try {
    return JSON.parse(rawBody);
  } catch {
    const eventStreamBody = parseEventStream(rawBody);
    if (eventStreamBody) return eventStreamBody;
    throw new Error('LLM response was not valid JSON.');
  }
}

function validatedSettings(settings = {}, route = {}) {
  const result = {};
  const supported = Array.isArray(route?.supportedParameters)
    ? new Set(route.supportedParameters)
    : null;
  const supports = (key) => !supported || supported.has(key);
  const temperature = Number(settings.temperature);
  const responseTokenLimits = Object.freeze({ brief: 450, normal: 900, detailed: 2400 });
  const responseLimit = responseTokenLimits[settings.response_length];
  const maxTokens = Number(settings.max_tokens ?? responseLimit);
  if (supports('temperature') && Number.isFinite(temperature) && temperature >= 0 && temperature <= 2) {
    result.temperature = temperature;
  }
  if (Number.isInteger(maxTokens) && maxTokens >= 1 && maxTokens <= 65_536) {
    if (supports('max_tokens')) result.max_tokens = maxTokens;
    else if (supports('max_completion_tokens')) result.max_completion_tokens = maxTokens;
    else if (supports('max_output_tokens')) result.max_output_tokens = maxTokens;
  }
  if (supports('reasoning_effort') && ['low', 'medium', 'high'].includes(settings.reasoning_effort)) {
    result.reasoning_effort = settings.reasoning_effort;
  }
  return result;
}

function safeMedia(media) {
  if (media === undefined) return [];
  if (!Array.isArray(media) || media.length > 10) throw new TypeError('Invalid LLM media input.');
  return media.map((item) => {
    if (item?.type !== 'image') throw new TypeError('Unsupported LLM media input.');
    let url;
    try { url = new URL(item.url); } catch { throw new TypeError('Invalid LLM media URL.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
      throw new TypeError('Invalid LLM media URL.');
    }
    return { type: 'image_url', image_url: { url: url.toString() } };
  });
}

function requestMessages(prompt, settings = {}, systemInstructionsLimit = 12_000, media = []) {
  if (
    !Number.isSafeInteger(systemInstructionsLimit)
    || systemInstructionsLimit < 1
    || systemInstructionsLimit > 500_000
  ) {
    throw new TypeError('Invalid system instruction limit.');
  }
  const instructions = typeof settings.instructions === 'string'
    ? settings.instructions.trim().slice(0, systemInstructionsLimit)
    : '';
  return [
    ...(instructions ? [{ role: 'system', content: instructions }] : []),
    { role: 'user', content: media.length
      ? [{ type: 'text', text: prompt }, ...safeMedia(media)]
      : prompt }
  ];
}

function responseInput(messages) {
  return messages.map(({ role, content }) => ({
    role,
    content: [{ type: 'input_text', text: content }]
  }));
}

function messagesRequestBody(route, messages, settings) {
  const nativeSettings = validatedSettings(settings, route);
  const supportsAnyTokenLimit = !Array.isArray(route?.supportedParameters)
    || route.supportedParameters.some((key) => ['max_tokens', 'max_completion_tokens', 'max_output_tokens'].includes(key));
  const system = messages
    .filter(({ role }) => role === 'system')
    .map(({ content }) => content)
    .join('\n\n')
    .trim();
  const conversation = messages
    .filter(({ role }) => role !== 'system')
    .map(({ role, content }) => ({ role, content }));
  return {
    model: route.model,
    ...(system ? { system } : {}),
    messages: conversation,
    ...(nativeSettings.max_tokens !== undefined
      ? { max_tokens: nativeSettings.max_tokens }
      : nativeSettings.max_completion_tokens !== undefined
        ? { max_completion_tokens: nativeSettings.max_completion_tokens }
      : supportsAnyTokenLimit ? { max_tokens: DEFAULT_MAX_TOKENS } : {}),
    ...(nativeSettings.temperature !== undefined
      ? { temperature: nativeSettings.temperature }
      : {})
  };
}

function responsesRequestBody(route, messages, settings) {
  const nativeSettings = validatedSettings(settings, route);
  return {
    model: route.model,
    stream: false,
    input: responseInput(messages),
    ...(nativeSettings.max_tokens !== undefined
      ? { max_output_tokens: nativeSettings.max_tokens }
      : nativeSettings.max_completion_tokens !== undefined
        ? { max_output_tokens: nativeSettings.max_completion_tokens }
        : nativeSettings.max_output_tokens !== undefined
          ? { max_output_tokens: nativeSettings.max_output_tokens }
      : {}),
    ...(nativeSettings.reasoning_effort
      ? { reasoning: { effort: nativeSettings.reasoning_effort } }
      : {})
  };
}

function chatRequestBody(route, messages, settings) {
  const nativeSettings = validatedSettings(settings, route);
  const supportsAnyTokenLimit = !Array.isArray(route?.supportedParameters)
    || route.supportedParameters.some((key) => ['max_tokens', 'max_completion_tokens'].includes(key));
  return {
    model: route.model,
    messages,
    ...(nativeSettings.max_tokens !== undefined
      ? { max_tokens: nativeSettings.max_tokens }
      : nativeSettings.max_completion_tokens !== undefined
        ? { max_completion_tokens: nativeSettings.max_completion_tokens }
        : supportsAnyTokenLimit ? { max_tokens: DEFAULT_MAX_TOKENS } : {}),
    ...(nativeSettings.temperature !== undefined
      ? { temperature: nativeSettings.temperature }
      : {}),
    ...(nativeSettings.reasoning_effort
      ? { reasoning_effort: nativeSettings.reasoning_effort }
      : {})
  };
}

function requestBodyForRoute(route, prompt, settings, systemInstructionsLimit, media) {
  const messages = requestMessages(prompt, settings, systemInstructionsLimit, media);
  if (route.protocol === 'responses') return responsesRequestBody(route, messages, settings);
  if (route.protocol === 'messages') return messagesRequestBody(route, messages, settings);
  return chatRequestBody(route, messages, settings);
}

async function callRoute(route, prompt, key, fetchImpl, settings, systemInstructionsLimit, media) {
  const body = requestBodyForRoute(route, prompt, settings, systemInstructionsLimit, media);
  let response;
  try {
    response = await fetchImpl(route.endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000)
    });
  } catch (cause) {
    throw new LlmProviderError('LLM provider request outcome is unknown.', {
      provider: route.provider,
      acceptedRequest: true,
      cause
    });
  }
  if (!response || typeof response.ok !== 'boolean') {
    throw new LlmProviderError('LLM provider request outcome is unknown.', {
      provider: route.provider,
      acceptedRequest: true
    });
  }
  if (!response.ok) {
    throw new LlmProviderError(`Provider ${route.provider} is unavailable.`, {
      provider: route.provider
    });
  }
  try {
    return extractText(await readBoundedJson(response));
  } catch (cause) {
    throw new LlmProviderError(cause.message, {
      provider: route.provider,
      acceptedRequest: true,
      cause
    });
  }
}

export async function invokeFreeLlm({
  prompt,
  provider,
  providerModel,
  providerModels,
  providerKeys,
  settings,
  fetchImpl = fetch,
  allowSecondaryProviders = true,
  allowFreeFallback = false,
  systemInstructionsLimit = 12_000
  ,media
}) {
  const configuredProviderKeys = providerKeys ?? {};
  if (provider !== undefined && !supportedRequestedProviders.has(provider)) {
    throw new TypeError('Unsupported requested-model provider.');
  }
  if (provider && !providerModel && !providerModels) {
    throw new TypeError('A requested-model provider requires providerModel or providerModels.');
  }
  if (providerModel && providerModels) {
    throw new TypeError('Use providerModel or providerModels, not both.');
  }
  const requestedRoutes = providerModels
    ? (provider
      ? pinnedModelRoutes(providerModels, provider, configuredProviderKeys)
      : requestedModelRoutes(providerModels, configuredProviderKeys))
    : providerModel
      ? (provider
        ? pinnedModelRoutes([providerModel], provider, configuredProviderKeys)
        : requestedModelRoutes([providerModel], configuredProviderKeys))
      : null;
  const routes = requestedRoutes
    ? [
      ...requestedRoutes.filter(({ provider: routeProvider }) => configuredProviderKeys[routeProvider]),
      ...(allowFreeFallback
        ? freeRoutes
          .filter(({ provider: routeProvider }) => configuredProviderKeys[routeProvider])
          .map((route) => Object.freeze({ ...route, freeFallback: true }))
        : [])
    ]
    : freeRoutes.filter(({ provider: routeProvider }) => configuredProviderKeys[routeProvider]);
  if (!routes.length) {
    throw new Error(requestedRoutes
      ? 'No provider is configured for the requested model.'
      : 'No free LLM provider is configured.');
  }

  const allowedRoutes = provider
    ? routes.filter((route) => (
      route.provider === provider
      || (provider === 'polza' && route.fallbackFor === 'polza')
    ))
    : requestedRoutes || allowSecondaryProviders
      ? routes
      : routes.filter((route) => route.provider === 'openrouter');
  let lastError;
  for (const route of allowedRoutes) {
    try {
      const text = await callRoute(
        route,
        prompt,
        configuredProviderKeys[route.provider],
        fetchImpl,
        settings,
        systemInstructionsLimit,
        media
      );
      return {
        text,
        provider: route.provider,
        ...(route.requested ? { model: route.model } : {}),
        ...(route.freeFallback ? { billingTier: 'free' } : {})
      };
    } catch (error) {
      if (!(error instanceof LlmProviderError)) throw error;
      if (error.acceptedRequest) throw error;
      lastError = error;
    }
  }
  throw lastError ?? new Error('No free LLM route is available.');
}
