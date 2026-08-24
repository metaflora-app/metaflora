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
    ...utilityNavigation()
  ];
}

export function buildProviderErrorMessage(model) {
  return {
    text: `<b>модель временно недоступна</b>\n\nпровайдер не ответил или прервал генерацию. повтори запрос немного позже либо выбери другую модель.\n\nесли ошибка повторится, напиши <a href="https://t.me/metaflora_support">@metaflora_support</a>.`,
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

export function buildAgentProviderErrorMessage(agent) {
  const category = agent?.category ?? 'personal';
  const agentId = agent?.id;
  return {
    text: '<b>агент временно не отвечает</b>\n\nзапрос не завершился, поэтому списания не будет. вернись к карточке и отправь материалы ещё раз немного позже либо выбери другого агента.\n\nесли ошибка повторится, напиши <a href="https://t.me/metaflora_support">@metaflora_support</a>.',
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        ...(agentId
          ? [[{ text: 'вернуться к агенту', callback_data: `agent:${agentId}` }]]
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
