import { useMemo, useState } from "react";

const sectionLabels = Object.freeze({
  all: "весь каталог",
  models: "модели",
  agents: "агенты",
  tools: "инструменты",
  workflows: "сценарии",
  entertainments: "развлечения",
});

const categoryLabels = Object.freeze({
  llm: "текст",
  image: "изображения",
  video: "видео",
  audio: "аудио",
  voice: "голос",
  photo: "фото",
  business: "бизнес",
  content: "контент",
  development: "разработка",
  education: "обучение",
  personal: "личное",
  entertainment: "развлечения",
});

const modeLabels = Object.freeze({
  text_to_video: "текст → видео",
  first_frame: "первый кадр → видео",
  references: "референсы → видео",
  extend: "продолжение видео",
});

const readinessLabels = Object.freeze({
  ready: "готово",
  partial: "частично",
  early_access: "ранний доступ",
  unavailable: "недоступно",
});

function normalized(value) {
  return String(value ?? "").trim().toLocaleLowerCase("ru-RU");
}

function catalogEntries(manifest, section) {
  const sections = section === "all" ? ["models", "agents", "tools", "workflows", "entertainments"] : [section];
  return sections.flatMap((key) => (manifest?.[key] ?? []).map((item) => ({ ...item, section: key })));
}

export function ProductCatalogPage({ manifest }) {
  const [section, setSection] = useState("all");
  const [query, setQuery] = useState("");
  const entries = useMemo(() => {
    const wanted = normalized(query);
    return catalogEntries(manifest, section).filter((item) => !wanted || normalized(`${item.name} ${item.id} ${item.category}`).includes(wanted));
  }, [manifest, query, section]);

  const summary = manifest?.summary ?? {};
  return (
    <section className="crm-page crm-catalog-page" aria-labelledby="catalog-title">
      <header className="crm-page__header">
        <div>
          <span className="crm-eyebrow">релиз {manifest?.release?.version || "—"}</span>
          <h1 id="catalog-title">каталог продукта</h1>
          <p>что уже доступно пользователям и что ещё требует внимания</p>
        </div>
        <span className="crm-page__count">manifest {manifest?.schemaVersion || "—"}</span>
      </header>

      <div className="crm-catalog-summary" aria-label="сводка каталога">
        {[["models", "моделей"], ["agents", "агентов"], ["tools", "инструмента"], ["workflows", "сценариев"], ["entertainments", "развлечений"], ["voices", "готовых голосов"]].map(([key, label]) => (
          <article className="crm-catalog-stat" key={key}><strong>{summary[key] ?? 0}</strong><span>{label}</span></article>
        ))}
      </div>

      <section className="crm-coverage" aria-label="готовность возможностей">
        <div className="crm-section-heading"><h2>готовность возможностей</h2><span>{manifest?.coverage?.length ?? 0} направлений</span></div>
        <div className="crm-coverage-grid">
          {(manifest?.coverage ?? []).map((item) => (
            <article className="crm-coverage-card" key={item.id}>
              <span className={`crm-status crm-status--${item.state}`}>{readinessLabels[item.state] || item.state}</span>
              <strong>{item.label}</strong><small>{item.scope}</small>
            </article>
          ))}
        </div>
        <p className="crm-safe-note">{manifest?.voiceProfile?.curatedCount ?? 0} голосов · {manifest?.musicProfile?.runnableWorkflows ?? 0} музыкальных сценариев · {manifest?.entertainmentProfile?.ready ?? 0} из {manifest?.entertainmentProfile?.total ?? 0} развлечений готовы</p>
      </section>

      <div className="crm-toolbar crm-catalog-filters">
        <label className="crm-search"><span className="crm-visually-hidden">поиск по каталогу</span><input type="search" aria-label="поиск по каталогу" placeholder="название, ID или категория" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="crm-field"><span>раздел</span><select aria-label="раздел каталога" value={section} onChange={(event) => setSection(event.target.value)}>{Object.entries(sectionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>

      <div className="crm-catalog-list" aria-live="polite">
        {entries.slice(0, 120).map((item) => (
          <article className="crm-catalog-item" key={`${item.section}:${item.id}`}>
            <div><small>{sectionLabels[item.section]} · {categoryLabels[item.category] || item.category || "без категории"}</small><strong>{item.name}</strong><code>{item.id}</code>{item.description ? <p>{item.description}</p> : null}</div>
            <div className="crm-catalog-tags">
              {(item.modes ?? []).map((mode) => <span key={mode}>{modeLabels[mode] || mode}</span>)}
              {(item.settings ?? []).slice(0, 5).map((setting) => <span key={setting}>{setting}</span>)}
              {item.flowKind ? <span>{item.flowKind === "guided" ? "пошаговый" : "с выбором"}</span> : null}
              {(item.accepts ?? []).map((media) => <span key={media}>вход: {media}</span>)}
              {item.output ? <span>выход: {item.output}</span> : null}
              {Number.isFinite(item.entryOptions) ? <span>вариантов: {item.entryOptions}</span> : null}
              {item.active === false ? <span>выключено</span> : null}
            </div>
          </article>
        ))}
        {entries.length > 120 ? <p className="crm-safe-note">Показаны первые 120 из {entries.length}; уточни поиск или раздел.</p> : null}
        {entries.length === 0 ? <div className="crm-empty-state"><strong>ничего не найдено</strong><span>измени поиск или раздел</span></div> : null}
      </div>
    </section>
  );
}
