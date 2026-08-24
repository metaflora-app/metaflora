const PROVIDER_LABELS = Object.freeze({
  openrouter: "OpenRouter",
  polza: "Polza AI",
  polzaai: "Polza AI",
  kie: "GPTunnel",
  kieai: "GPTunnel",
  gptunnel: "GPTunnel",
  routerai: "RouterAI",
  requesty: "Requesty",
  replicate: "Replicate",
  fal: "fal.ai",
  falai: "fal.ai",
  elevenlabs: "ElevenLabs",
  suno: "Suno",
  yookassa: "платёжный архив",
});

const PROVIDER_IDS = Object.freeze({
  openrouter: "openrouter",
  polza: "polza",
  polzaai: "polza",
  kie: "gptunnel",
  kieai: "gptunnel",
  gptunnel: "gptunnel",
  routerai: "routerai",
  requesty: "requesty",
  replicate: "replicate",
  fal: "fal",
  falai: "fal",
  elevenlabs: "elevenlabs",
  suno: "suno",
  yookassa: "yookassa",
});

const UNKNOWN_VALUES = new Set([
  "",
  "-",
  "n/a",
  "na",
  "null",
  "undefined",
  "unknown",
  "unknownprovider",
  "неизвестный",
  "неизвестныйпровайдер",
]);

const SOURCE_LABELS = Object.freeze({
  provider_api_calls: "вызов провайдера",
  routing_engine: "маршрутизация",
  system_jobs: "системная задача",
  generations: "генерация",
  payments: "платежи",
});

const ACTION_LABELS = Object.freeze({
  retry_check: "повторить проверку",
  check_route: "проверить маршрут",
  open_provider: "открыть провайдера",
});

const SAFE_ACTION_ALIASES = Object.freeze({
  probe: "retry_check",
  probe_provider: "retry_check",
  repeat_check: "retry_check",
  retry: "retry_check",
  retry_check: "retry_check",
  check_route: "check_route",
  route_check: "check_route",
  open_provider: "open_provider",
  provider: "open_provider",
});

const REASON_DEFINITIONS = Object.freeze({
  auth: Object.freeze({
    title: "провайдер отклонил доступ",
    reason: "проверка доступа не прошла; секреты не показываются",
    action: "open_provider",
  }),
  balance: Object.freeze({
    title: "у провайдера недостаточно средств",
    reason: "провайдер не подтвердил доступный лимит для запроса",
    action: "open_provider",
  }),
  rate: Object.freeze({
    title: "провайдер ограничил частоту запросов",
    reason: "временный лимит запросов провайдера исчерпан",
    action: "retry_check",
  }),
  timeout: Object.freeze({
    title: "провайдер не ответил вовремя",
    reason: "ответ не пришёл в допустимое время",
    action: "retry_check",
  }),
  unavailable: Object.freeze({
    title: "провайдер временно недоступен",
    reason: "провайдер вернул временную ошибку; детали ответа скрыты",
    action: "retry_check",
  }),
  invalid: Object.freeze({
    title: "провайдер вернул неподдерживаемый ответ",
    reason: "ответ не соответствует ожидаемому формату; детали ответа скрыты",
    action: "retry_check",
  }),
  configuration: Object.freeze({
    title: "провайдер не настроен",
    reason: "для провайдера не подтверждена рабочая конфигурация; секреты не показываются",
    action: "open_provider",
  }),
  probe: Object.freeze({
    title: "проверка провайдера не прошла",
    reason: "проверка доступности не завершилась успешно",
    action: "retry_check",
  }),
  job: Object.freeze({
    title: "системная задача завершилась с ошибкой",
    reason: "операционная задача не завершилась; подробности серверного журнала скрыты",
    action: null,
  }),
  generic: Object.freeze({
    title: "не удалось выполнить генерацию",
    reason: "безопасная причина не определена; детали ответа скрыты",
    action: null,
  }),
});

const SENSITIVE_TEXT = /(?:api[_ -]?key|access[_ -]?token|authorization|bearer|token|secret|password|prompt|response[_ -]?payload|request[_ -]?payload|generated[_ -]?output|https?:\/\/|-----begin)/i;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$/;
const SAFE_PROVIDER_ID = /^[a-z0-9][a-z0-9_-]{0,39}$/i;

function compactKey(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/[\s._-]+/g, "");
}

function codeKey(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/[\s.-]+/g, "_");
}

function safeText(value, maxLength = 120) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text || text.length > maxLength || SENSITIVE_TEXT.test(text)) return null;
  if ([...text].some((character) => character.charCodeAt(0) < 32)) return null;
  return text;
}

function safeId(value) {
  const text = safeText(value);
  return text && SAFE_ID.test(text) ? text : null;
}

function safeProviderId(value) {
  const text = String(value ?? "").trim().toLocaleLowerCase("en-US");
  return SAFE_PROVIDER_ID.test(text) ? text : null;
}

function isUnknownValue(value) {
  return UNKNOWN_VALUES.has(compactKey(value));
}

function providerInfo(incident, generation) {
  const candidates = [
    [incident?.providerId, true],
    [incident?.provider_id, true],
    [incident?.provider, false],
    [generation?.providerId, true],
    [generation?.provider_id, true],
    [generation?.provider, false],
    [incident?.service, false],
  ];

  for (const [candidate, isId] of candidates) {
    if (candidate === undefined || candidate === null || isUnknownValue(candidate)) {
      continue;
    }
    const key = compactKey(candidate);
    if (PROVIDER_LABELS[key]) {
      return Object.freeze({
        id: PROVIDER_IDS[key] ?? safeProviderId(candidate) ?? key,
        label: PROVIDER_LABELS[key],
      });
    }
    if (["providerapicalls", "routingengine", "systemjobs", "generations"].includes(key)) {
      continue;
    }
    const label = safeText(candidate, 80);
    const id = isId ? safeProviderId(candidate) : safeProviderId(key);
    if (label && id) return Object.freeze({ id, label });
  }

  return Object.freeze({ id: null, label: "провайдер не определён" });
}

function modelLabel(incident, generation) {
  const candidates = [
    incident?.model,
    incident?.providerModel,
    incident?.providerModelId,
    incident?.provider_model_id,
    incident?.subjectId,
    incident?.subject_id,
    generation?.model,
    generation?.providerModel,
    generation?.providerModelId,
    generation?.provider_model_id,
    generation?.subjectId,
    generation?.subject_id,
  ];
  for (const candidate of candidates) {
    const label = safeText(candidate, 120);
    if (label && !isUnknownValue(label)) return label;
  }
  return "модель не определена";
}

function generationId(incident, generation) {
  return safeId(
    incident?.generationId ??
      incident?.generation_id ??
      generation?.id ??
      null,
  );
}

function routeId(incident) {
  return safeId(incident?.routeId ?? incident?.route_id ?? null);
}

function incidentCode(incident, generation) {
  const explicit = [
    incident?.reasonCode,
    incident?.reason_code,
    incident?.errorCode,
    incident?.error_code,
    incident?.providerCode,
    incident?.provider_code,
    incident?.code,
    incident?.failureCode,
    generation?.errorCode,
    generation?.error_code,
  ]
    .map(codeKey)
    .find(Boolean);
  if (explicit) return explicit;

  const searchable = [incident?.title, incident?.summary, incident?.reason]
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase("ru-RU");
  if (/timeout|таймаут|timed out/.test(searchable)) return "provider_timeout";
  if (/rate[_ -]?limit|too[_ -]?many|лимит/.test(searchable)) return "provider_rate_limited";
  if (/auth|unauthor|forbidden|invalid[_ -]?key|доступ/.test(searchable)) {
    return "provider_auth_failed";
  }
  if (/5xx|unavailable|upstream|provider[_ -]?error|ошибк/.test(searchable)) {
    return "provider_error";
  }
  return "";
}

function reasonKind(incident, generation, code, provider) {
  const status = Number(incident?.httpStatus ?? incident?.http_status ?? incident?.statusCode);
  const source = compactKey(incident?.source);
  if (source === "systemjobs" || incident?.jobType || incident?.job_type) return "job";
  const knownTitle = Object.entries(REASON_DEFINITIONS).find(
    ([, definition]) => definition.title === incident?.title,
  )?.[0];
  if (knownTitle) return knownTitle;
  if (!provider?.id && /provider[_]?error|unknown[_]?provider/.test(code)) return "generic";
  if (/auth|unauthor|forbidden|invalid[_]?key/.test(code)) return "auth";
  if (/insufficient|credit|balance|payment[_]?required/.test(code)) return "balance";
  if (/not[_]?configured|missing[_]?config/.test(code)) return "configuration";
  if (/rate[_]?limit|too[_]?many/.test(code)) return "rate";
  if (/timeout/.test(code) || incident?.status === "timeout") return "timeout";
  if ((status >= 500 && status < 600) || /5xx|provider[_]?error|unavailable|upstream|server[_]?error/.test(code)) {
    return "unavailable";
  }
  if (/invalid[_]?response|unexpected[_]?response/.test(code)) return "invalid";
  if (/probe[_]?failed|probe/.test(code)) return "probe";
  if (
    generation ||
    source === "generations" ||
    incident?.generationId ||
    incident?.generation_id ||
    incident?.kind === "generation"
  ) {
    return "generic";
  }
  return "generic";
}

function normalizeAction(value) {
  const rawType = typeof value === "string" ? value : value?.type ?? value?.action;
  const type = SAFE_ACTION_ALIASES[codeKey(rawType)];
  if (!type) return null;
  const targetId = safeId(value?.targetId ?? value?.target_id ?? null);
  return Object.freeze({
    type,
    label: ACTION_LABELS[type],
    targetId,
  });
}

function actionForIncident(incident, provider, route, kind) {
  const explicit = normalizeAction(incident?.action ?? incident?.recommendedAction);
  const selectedType = explicit?.type ?? REASON_DEFINITIONS[kind].action;
  if (!selectedType) return null;

  const targetId = explicit?.targetId ?? (
    selectedType === "check_route" ? route : provider.id
  );
  if (selectedType !== "check_route" && !provider.id) return null;
  if (selectedType === "check_route" && !targetId) return null;
  if (!ACTION_LABELS[selectedType] || !targetId) return null;
  return Object.freeze({
    type: selectedType,
    label: ACTION_LABELS[selectedType],
    targetId,
  });
}

function normalizedStatus(value, defaultStatus = "open") {
  const status = String(value ?? "").trim().toLocaleLowerCase("ru-RU");
  if (["open", "acknowledged", "resolved"].includes(status)) return status;
  return defaultStatus;
}

function normalizedSeverity(value, kind) {
  const severity = String(value ?? "").trim().toLocaleLowerCase("ru-RU");
  if (["critical", "warning", "info"].includes(severity)) return severity;
  return ["auth", "balance", "invalid"].includes(kind) ? "critical" : "warning";
}

function normalizedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizedHttpStatus(value) {
  const status = Number(value);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

export function normalizeIncident(incident, { generation = null, fallbackId = "incident" } = {}) {
  if (!incident || typeof incident !== "object" || Array.isArray(incident)) return null;

  const linkedGeneration = generation && typeof generation === "object" ? generation : null;
  const provider = providerInfo(incident, linkedGeneration);
  const model = modelLabel(incident, linkedGeneration);
  const code = incidentCode(incident, linkedGeneration);
  const kind = reasonKind(incident, linkedGeneration, code, provider);
  const route = routeId(incident);
  const definition = REASON_DEFINITIONS[kind];
  const normalizedIncidentId = safeId(incident.id) ?? safeId(fallbackId) ?? "incident";
  const sourceKey = compactKey(incident.source);
  const sourceLabel =
    SOURCE_LABELS[sourceKey] ??
    (Object.values(SOURCE_LABELS).includes(incident.sourceLabel)
      ? incident.sourceLabel
      : null) ??
    (provider.id ? "вызов провайдера" : "операционная система");
  const normalizedGenerationId = generationId(incident, linkedGeneration);
  const httpStatus = normalizedHttpStatus(
    incident.httpStatus ?? incident.http_status ?? linkedGeneration?.httpStatus,
  );
  const providerRequestId = safeId(
    incident.providerRequestId ??
      incident.provider_request_id ??
      linkedGeneration?.providerRequestId ??
      linkedGeneration?.provider_request_id,
  );
  const operation = safeText(
    incident.operation ?? linkedGeneration?.operation,
    80,
  );
  const retryable = typeof incident.retryable === "boolean"
    ? incident.retryable
    : typeof linkedGeneration?.retryable === "boolean"
      ? linkedGeneration.retryable
      : null;

  return Object.freeze({
    id: normalizedIncidentId,
    title: definition.title,
    reason: definition.reason,
    provider: provider.label,
    providerId: provider.id,
    model,
    sourceLabel,
    severity: normalizedSeverity(incident.severity, kind),
    status: normalizedStatus(incident.status, linkedGeneration ? "open" : "open"),
    startedAt: normalizedDate(incident.startedAt ?? incident.started_at ?? linkedGeneration?.createdAt),
    generationId: normalizedGenerationId,
    routeId: route,
    errorCode: code && code !== "provider_error" ? code : null,
    httpStatus,
    providerRequestId,
    operation,
    retryable,
    service: provider.label,
    correlationId: "техническая ссылка скрыта",
    action: actionForIncident(incident, provider, route, kind),
  });
}

function generationIncident(generation, index) {
  const id = safeId(generation?.id);
  if (!id) return null;
  return normalizeIncident(
    {
      id: `generation:${id}`,
      source: "generations",
      status: "open",
      severity: generation?.severity,
      provider: generation?.provider,
      providerId: generation?.providerId,
      model: generation?.model,
      providerModelId: generation?.providerModelId ?? generation?.provider_model_id,
      errorCode: generation?.errorCode ?? generation?.error_code,
      subjectId: generation?.subjectId ?? generation?.subject_id,
      generationId: id,
      startedAt: generation?.createdAt ?? generation?.startedAt ?? generation?.started_at,
    },
    { generation, fallbackId: `generation-${index}` },
  );
}

export function normalizeIncidents(incidents = [], generations = []) {
  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const safeGenerations = Array.isArray(generations) ? generations : [];
  const generationByKey = new Map();

  for (const generation of safeGenerations) {
    if (!generation || typeof generation !== "object") continue;
    for (const key of [generation.id, generation.requestId, generation.requestKey, generation.request_key]) {
      const safeKey = safeId(key);
      if (safeKey) generationByKey.set(safeKey, generation);
    }
  }

  const normalized = safeIncidents
    .map((incident, index) => {
      const linkedGeneration = generationByKey.get(
        safeId(
          incident?.generationId ??
            incident?.generation_id ??
            incident?.requestId ??
            incident?.requestKey ??
            incident?.request_key,
        ),
      );
      return normalizeIncident(incident, {
        generation: linkedGeneration,
        fallbackId: `incident-${index}`,
      });
    })
    .filter(Boolean);
  const representedGenerationIds = new Set(
    normalized.map((incident) => incident.generationId).filter(Boolean),
  );

  const generated = safeGenerations
    .map((generation, index) => {
      if (!["failed", "error"].includes(String(generation?.status ?? "").toLowerCase())) {
        return null;
      }
      const id = safeId(generation?.id);
      if (!id || representedGenerationIds.has(id)) return null;
      return generationIncident(generation, index);
    })
    .filter(Boolean);

  return Object.freeze([...normalized, ...generated]);
}
