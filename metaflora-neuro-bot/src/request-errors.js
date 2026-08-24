const supportButton = Object.freeze({
  text: 'написать',
  url: 'https://t.me/metaflora_support'
});

function safeCode(value, fallback = null) {
  const code = String(value ?? '').trim();
  return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/u.test(code) ? code : fallback;
}

function safeProvider(value) {
  const provider = String(value ?? '').trim().toLowerCase();
  return /^[a-z][a-z0-9_-]{0,39}$/u.test(provider) ? provider : null;
}

function safeModel(value) {
  const model = String(value ?? '').trim();
  return /^[A-Za-z0-9][A-Za-z0-9._/-]{0,160}$/u.test(model) ? model : null;
}

function safeRequestId(value) {
  const requestId = String(value ?? '').trim();
  return /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,255}$/u.test(requestId) ? requestId : null;
}

function safeCause(cause) {
  if (!cause) return undefined;
  const sanitized = new Error('Provider request failed.');
  sanitized.name = 'ProviderRequestError';
  const code = safeCode(cause.code);
  if (code) sanitized.code = code;
  return sanitized;
}

export class ProviderRequestError extends Error {
  constructor(message, options) {
    const cause = options?.cause;
    super(message, { cause: safeCause(cause) });
    this.name = 'ProviderRequestError';
    const source = cause ?? options ?? {};
    this.code = safeCode(options?.code ?? source.code, 'provider_error');
    this.provider = safeProvider(options?.provider ?? source.provider);
    this.providerModelId = safeModel(options?.providerModelId ?? source.providerModelId);
    this.requestId = safeRequestId(options?.requestId ?? source.requestId);
    const status = Number(options?.httpStatus ?? source.httpStatus);
    this.httpStatus = Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
    this.providerCode = safeCode(options?.providerCode ?? source.providerCode);
    this.acceptedJob = Boolean(options?.acceptedJob ?? source.acceptedJob);
  }
}

export class ResultDeliveryError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'ResultDeliveryError';
    this.code = options?.code ?? 'delivery_failed';
    this.retryCallbackData = options?.retryCallbackData ?? null;
  }
}

function utilityNavigation() {
  return [
    [supportButton],
    [
      { text: '👤 профиль', callback_data: 'task:profile' },
      { text: '🏠 главное меню', callback_data: 'task:menu' }
    ]
  ];
}

function providerErrorNavigation(model) {
  const category = model?.category ?? 'llm';
  const categoryCallback = model?.source === 'tool' ? 'toolcat' : 'modelcat';
  return [
    ...(model?.id
      ? [[{ text: 'повторить', callback_data: `use:${model.id}` }]]
      : []),
    [{ text: 'выбрать другую модель', callback_data: `${categoryCallback}:${category}` }],
    [{
      text: '‹ назад',
      callback_data: model?.id ? `model:${model.id}` : `${categoryCallback}:${category}`
    }],
    ...utilityNavigation()
  ];
}

function errorPresentation(error) {
  const providerCode = String(error?.providerCode ?? error?.code ?? '').toUpperCase();
  const status = Number(error?.httpStatus);
  if (/(?:CONTENT|MODERAT|SAFETY|NSFW|POLICY)/u.test(providerCode)) {
    return Object.freeze({
      title: 'запрос не прошёл проверку',
      body: 'убери 18+ контент, насилие, чужие личные данные или другие запрещённые детали, затем отправь запрос ещё раз.'
    });
  }
  if (status === 413 || /(?:PROMPT_TOO_LONG|CONTEXT_LENGTH|MAX_TOKENS|TOO_LARGE)/u.test(providerCode)) {
    return Object.freeze({
      title: 'промпт слишком длинный',
      body: 'сократи текст, убери повторы или часть вложений, а затем повтори запрос.'
    });
  }
  if (/(?:REFERENCE|IMAGE_INPUT|INVALID_IMAGE|MEDIA_FORMAT|ASPECT_RATIO|RESOLUTION)/u.test(providerCode)) {
    return Object.freeze({
      title: 'референс не подошёл',
      body: 'проверь формат, размер, число файлов и требования в карточке модели.'
    });
  }
  if (status === 429 || /(?:RATE_LIMIT|TOO_MANY|OVERLOAD|CAPACITY)/u.test(providerCode)) {
    return Object.freeze({
      title: 'сейчас слишком много запросов',
      body: 'подожди минуту и нажми «повторить». списания за незавершённый запрос не будет.'
    });
  }
  if (status === 402 || /(?:INSUFFICIENT_BALANCE|PAYMENT_REQUIRED)/u.test(providerCode)) {
    return Object.freeze({
      title: 'модель временно недоступна',
      body: 'запрос не запустился и списания не будет. попробуй ещё раз немного позже или выбери другую модель.'
    });
  }
  if (status === 404 || status === 503 || /(?:NO_PROVIDER|NOT_FOUND|UNAVAILABLE)/u.test(providerCode)) {
    return Object.freeze({
      title: 'модель временно недоступна',
      body: 'сейчас для неё нет свободного маршрута. попробуй ещё раз немного позже или выбери другую модель.'
    });
  }
  if ([400, 409, 415, 422].includes(status) || /(?:INVALID_INPUT|BAD_REQUEST|UNSUPPORTED)/u.test(providerCode)) {
    return Object.freeze({
      title: 'не получилось принять запрос',
      body: 'сверь файлы и параметры с карточкой модели, затем отправь запрос заново.'
    });
  }
  if ([408, 500, 502, 504].includes(status) || /(?:TIMEOUT|OUTCOME_UNKNOWN|POLLING)/u.test(providerCode)) {
    return Object.freeze({
      title: 'генерация не успела завершиться',
      body: 'подожди немного и повтори запрос. если ошибка повторится, напиши в поддержку — разберёмся.'
    });
  }
  return Object.freeze({
    title: 'модель временно недоступна',
    body: 'запрос не завершился. повтори его немного позже либо выбери другую модель.'
  });
}

export function buildProviderErrorMessage(model, error = null) {
  const presentation = errorPresentation(error);
  return {
    text: `<b>${presentation.title}</b>\n\n${presentation.body}\n\nесли ошибка повторится, напиши <a href="https://t.me/metaflora_support">@metaflora_support</a>.`,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: providerErrorNavigation(model) }
  };
}

export function buildDeliveryErrorMessage(model, retryCallbackData = null) {
  const categoryCallback = model?.source === 'tool' ? 'toolcat' : 'modelcat';
  return {
    text: '<b>не удалось отправить результат</b>\n\nпровайдер уже подготовил ответ, но Telegram не принял его. списание за этот результат не завершено — нажми «повторить» или отправь запрос ещё раз.\n\nесли ошибка повторится, напиши <a href="https://t.me/metaflora_support">@metaflora_support</a>.',
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        ...(retryCallbackData ? [[{ text: 'повторить', callback_data: retryCallbackData }]] : []),
        [{ text: 'выбрать другую модель', callback_data: `${categoryCallback}:${model?.category ?? 'llm'}` }],
        ...utilityNavigation()
      ]
    }
  };
}

export function buildAgentProviderErrorMessage(agent, error = null) {
  const category = agent?.category ?? 'personal';
  const agentId = agent?.id;
  const presentation = errorPresentation(error);
  const title = presentation.title.startsWith('модель ')
    ? 'агент временно не отвечает'
    : presentation.title;
  const body = presentation.body.replaceAll('другую модель', 'другого агента');
  return {
    text: `<b>${title}</b>\n\n${body}\n\nзапрос агента не завершился, поэтому списания не будет. если ошибка повторится, напиши <a href="https://t.me/metaflora_support">@metaflora_support</a>.`,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        ...(agentId
          ? [[{ text: '‹ назад', callback_data: `agent:${agentId}` }]]
          : []),
        [{ text: 'выбрать другого агента', callback_data: `agentcat:${category}` }],
        ...utilityNavigation()
      ]
    }
  };
}

export function buildAggregatorErrorMessage() {
  return {
    text: `<b>не получилось обработать запрос</b>\n\nошибка возникла внутри МЕТАФЛОРА* нейро. напиши <a href="https://t.me/metaflora_support">@metaflora_support</a> и коротко расскажи, что отправлял перед ошибкой.`,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: utilityNavigation() }
  };
}
