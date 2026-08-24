import { useMemo, useState } from "react";

const statusLabels = {
  queued: "в очереди",
  running: "в работе",
  completed: "готово",
  failed: "ошибка",
  canceled: "отменено",
};

const modalityLabels = {
  text: "текст",
  image: "изображение",
  audio: "аудио",
  video: "видео",
};

const providerLabels = {
  polza: "Polza AI",
  polzaai: "Polza AI",
  kie: "GPTunnel",
  kieai: "GPTunnel",
  gptunnel: "GPTunnel",
  routerai: "RouterAI",
  openrouter: "OpenRouter",
  requesty: "Requesty",
  replicate: "Replicate",
  fal: "fal.ai",
  falai: "fal.ai",
};

function providerKey(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/[\s._-]+/g, "");
}

export function displayGenerationProvider(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "—";
  }
  const key = providerKey(value);
  if (["unknown", "unknownprovider", "неизвестный", "неизвестныйпровайдер"].includes(key)) {
    return "провайдер не определён";
  }
  return providerLabels[key] || String(value).trim();
}

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function formatDuration(durationMs) {
  if (!Number.isFinite(durationMs)) return "—";
  if (durationMs < 1000) return `${Math.round(durationMs)} мс`;
  return `${(durationMs / 1000).toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
  })} с`;
}

function matchesGeneration(generation, filters) {
  const query = filters.query.trim().toLocaleLowerCase("ru");
  const searchableMetadata = [
    generation.id,
    generation.userId,
    generation.userName,
    generation.model,
    generation.provider,
    generation.kind,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ru");

  return (
    (!query || searchableMetadata.includes(query)) &&
    (!filters.status || generation.status === filters.status) &&
    (!filters.modality || generation.modality === filters.modality) &&
    (!filters.kind || (generation.kind || "model") === filters.kind) &&
    (!filters.model || generation.model === filters.model)
  );
}

export function toGenerationMetadata(generation) {
  return {
    id: generation.id,
    userId: generation.userId,
    userName: generation.userName,
    model: generation.model,
    provider: displayGenerationProvider(generation.provider),
    kind: generation.kind || "model",
    modality: generation.modality,
    status: generation.status,
    durationMs: generation.durationMs,
    metacoinCost: generation.metacoinCost,
    createdAt: generation.createdAt,
    completedAt: generation.completedAt,
    errorCode: generation.errorCode,
    requestId: generation.requestId,
    mediaMode: generation.mediaMode ?? null,
    references: generation.references ?? { image: 0, video: 0, audio: 0, total: 0 },
  };
}

export function GenerationFilters({ filters, onChange }) {
  return (
    <div className="crm-toolbar crm-generation-filters">
      <label className="crm-search">
        <span className="crm-visually-hidden">поиск генераций</span>
        <input
          type="search"
          aria-label="поиск генераций"
          placeholder="ID, пользователь, модель или провайдер"
          value={filters.query}
          onChange={(event) => onChange({ query: event.target.value })}
        />
      </label>
      <label className="crm-field">
        <span>статус</span>
        <select
          aria-label="статус генерации"
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value })}
        >
          <option value="">все статусы</option>
          <option value="queued">в очереди</option>
          <option value="running">в работе</option>
          <option value="completed">готово</option>
          <option value="failed">ошибка</option>
          <option value="canceled">отменено</option>
        </select>
      </label>
      <label className="crm-field">
        <span>тип</span>
        <select aria-label="тип продукта" value={filters.kind} onChange={(event) => onChange({ kind: event.target.value })}>
          <option value="">все типы</option>
          <option value="model">модель</option>
          <option value="agent">агент</option>
          <option value="tool">инструмент</option>
          <option value="workflow">сценарий</option>
        </select>
      </label>
      <label className="crm-field">
        <span>модель</span>
        <select aria-label="модель или сценарий" value={filters.model} onChange={(event) => onChange({ model: event.target.value })}>
          <option value="">все модели и сценарии</option>
          {[...new Set(filters.availableModels ?? [])].filter(Boolean).map((model) => <option key={model} value={model}>{model}</option>)}
        </select>
      </label>
      <label className="crm-field">
        <span>формат</span>
        <select
          value={filters.modality}
          onChange={(event) => onChange({ modality: event.target.value })}
        >
          <option value="">все форматы</option>
          <option value="text">текст</option>
          <option value="image">изображение</option>
          <option value="audio">аудио</option>
          <option value="video">видео</option>
        </select>
      </label>
    </div>
  );
}

export function GenerationsTable({ generations, onSelectGeneration }) {
  if (generations.length === 0) {
    return (
      <div className="crm-empty-state">
        <strong>подходящих генераций нет</strong>
        <span>измените фильтры и попробуйте ещё раз</span>
      </div>
    );
  }

  return (
    <div className="crm-table-wrap">
      <table className="crm-table crm-generations-table">
        <thead>
          <tr>
            <th scope="col">генерация</th>
            <th scope="col">пользователь</th>
            <th scope="col">модель</th>
            <th scope="col">статус</th>
            <th scope="col">время</th>
            <th scope="col">стоимость</th>
            <th scope="col">создано</th>
            <th scope="col"><span className="crm-visually-hidden">действие</span></th>
          </tr>
        </thead>
        <tbody>
          {generations.map((generation) => (
            <tr key={generation.id}>
              <td>
                <strong>{generation.id}</strong>
                <span className="crm-cell-note">
                  {modalityLabels[generation.modality] || "формат не указан"}
                </span>
              </td>
              <td>{generation.userName || generation.userId || "—"}</td>
              <td>
                <strong>{generation.model || "—"}</strong>
                <span className="crm-cell-note">{displayGenerationProvider(generation.provider)}</span>
                {generation.mediaMode ? <span className="crm-cell-note">режим: {generation.mediaMode}</span> : null}
                {generation.references?.total > 0 ? (
                  <span className="crm-cell-note">
                    референсы: {generation.references.total} · фото {generation.references.image} · видео {generation.references.video} · аудио {generation.references.audio}
                  </span>
                ) : null}
              </td>
              <td>
                <span className={`crm-status crm-status--${generation.status || "unknown"}`}>
                  {statusLabels[generation.status] || "неизвестно"}
                </span>
              </td>
              <td>{formatDuration(generation.durationMs)}</td>
              <td>{generation.metacoinCost ?? 0} метакоинов</td>
              <td>{formatDateTime(generation.createdAt)}</td>
              <td>
                <button
                  type="button"
                  className="crm-row-action"
                  aria-label={`открыть генерацию ${generation.id}`}
                  onClick={() =>
                    onSelectGeneration?.(toGenerationMetadata(generation))
                  }
                >
                  открыть
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GenerationsPage({
  generations = [],
  onFiltersChange,
  onSelectGeneration,
}) {
  const [filters, setFilters] = useState({
    query: "",
    status: "",
    modality: "",
    kind: "",
    model: "",
    availableModels: generations.map(({ model }) => model).filter(Boolean),
  });
  const filteredGenerations = useMemo(
    () =>
      generations.filter((generation) =>
        matchesGeneration(generation, filters),
      ),
    [filters, generations],
  );

  function updateFilters(patch) {
    const nextFilters = { ...filters, ...patch };
    setFilters(nextFilters);
    onFiltersChange?.(nextFilters);
  }

  return (
    <section
      className="crm-page crm-generations-page"
      aria-labelledby="generations-title"
    >
      <header className="crm-page__header">
        <div>
          <span className="crm-eyebrow">операционный журнал</span>
          <h1 id="generations-title">генерации</h1>
          <p>только технические метаданные — без запросов и результатов пользователей</p>
        </div>
        <span className="crm-page__count">{filteredGenerations.length} записей</span>
      </header>

      <GenerationFilters filters={filters} onChange={updateFilters} />
      <GenerationsTable
        generations={filteredGenerations}
        onSelectGeneration={onSelectGeneration}
      />
    </section>
  );
}
