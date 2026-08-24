import {
  ArrowsClockwise,
  ChartLineUp,
  CurrencyDollar,
  Database,
  GitBranch,
  Pulse,
  WarningCircle,
} from "@phosphor-icons/react";
import { resolveProviderIdentity } from "./provider-identities.js";

const HEALTH_LABELS = {
  healthy: "стабилен",
  degraded: "деградация",
  down: "недоступен",
  unknown: "нет данных",
  frozen: "заморожен",
};

const CIRCUIT_LABELS = {
  closed: "контур закрыт",
  "half-open": "контур на проверке",
  open: "контур открыт",
};

const number = new Intl.NumberFormat("ru-RU");
const decimal = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const money = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const ALERT_LABELS = {
  provider_auth_unverified: "доступность API проверена, ключ — нет",
  provider_auth_failed: "ключ API отклонён",
  provider_insufficient_credits: "недостаточно средств",
  provider_rate_limited: "лимит запросов",
  provider_timeout: "таймаут",
  provider_5xx: "ошибка провайдера",
  provider_probe_failed: "проверка не прошла",
  provider_invalid_response: "API вернул неожиданный ответ",
  provider_not_configured: "ключ не настроен",
  provider_low_balance: "низкий баланс",
};

const NON_MODEL_PROVIDER_IDS = new Set([
  "supabase",
  "yookassa",
  "yookassaapi",
  "юkassa",
  "юкасса",
]);

function isModelApiProvider(provider) {
  const values = [provider?.id, provider?.name]
    .map(normalizeProviderName)
    .filter(Boolean);
  return !values.some((value) => NON_MODEL_PROVIDER_IDS.has(value));
}

function getProviderHealth(provider) {
  if (provider.frozen === true || provider.status === "frozen") return "frozen";
  if (provider.health) return provider.health;
  if (provider.status === "operational") return "healthy";
  if (provider.status === "degraded") return "degraded";
  if (provider.status === "down" || provider.status === "unavailable") return "down";
  return "unknown";
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${decimal.format(value)}%` : "нет данных";
}

function formatLatency(value) {
  return Number.isFinite(value) ? `${number.format(value)} мс` : "нет данных";
}

function formatBalance(balance) {
  if (!balance || !Number.isFinite(balance.available)) return null;
  if (balance.unit === "USD") return `${money.format(balance.available)} $`;
  if (balance.unit === "RUB") return `${money.format(balance.available)} ₽`;
  if (balance.unit === "characters") {
    return `${number.format(balance.available)} символов`;
  }
  return `${number.format(balance.available)} ${balance.unit}`;
}

function providerOrder(left, right) {
  if (left.id === "polza" && right.id !== "polza") return -1;
  if (right.id === "polza" && left.id !== "polza") return 1;
  const priority = (left.priority ?? 999) - (right.priority ?? 999);
  if (priority !== 0) return priority;
  return String(left.name ?? left.id).localeCompare(String(right.name ?? right.id));
}

function orderProviders(providers) {
  return [...providers].sort(providerOrder);
}

function normalizeProviderName(value) {
  return String(value ?? "")
    .toLocaleLowerCase("ru-RU")
    .replace(/[^a-zа-яё0-9]/g, "");
}

function providerDisplayName(value) {
  return ["kie", "kieai"].includes(normalizeProviderName(value))
    ? "GPTunnel"
    : value;
}

function routesForEnabledProviders(routes, providers) {
  const disabledAliases = providers
    .filter(({ enabled, frozen, status }) =>
      enabled === false || frozen === true || status === "frozen",
    )
    .flatMap((provider) => [
      provider.id,
      provider.name,
      resolveProviderIdentity(provider).label,
    ])
    .map(normalizeProviderName)
    .filter(Boolean);

  if (!disabledAliases.length) return routes;

  return routes.map((route) => ({
    ...route,
    steps: (route.steps ?? []).filter((step) => {
      const stepName = normalizeProviderName(step.provider);
      return !disabledAliases.some(
        (alias) => stepName === alias || stepName.startsWith(alias),
      );
    }),
  }));
}

function alertLabel(alert) {
  return ALERT_LABELS[alert?.code] ?? alert?.label ?? "ошибка провайдера";
}

function createSummary(providers) {
  const activeProviders = providers.filter(
    ({ frozen, status }) => frozen !== true && status !== "frozen",
  );
  const totalCalls = activeProviders.reduce((sum, item) => sum + (item.totalCalls ?? 0), 0);
  const completed = activeProviders.reduce((sum, item) => sum + (item.completedCalls ?? 0), 0);
  const succeeded = activeProviders.reduce((sum, item) => sum + (item.successfulCalls ?? 0), 0);
  const knownCosts = activeProviders
    .map(({ providerCostUsd }) => providerCostUsd)
    .filter(Number.isFinite);
  return {
    totalCalls,
    configured: activeProviders.filter(({ configured }) => configured).length,
    successRate: completed ? (succeeded / completed) * 100 : null,
    costUsd: knownCosts.length
      ? knownCosts.reduce((sum, cost) => sum + cost, 0)
      : null,
  };
}

function mergeTimeline(providers) {
  const rows = new Map();
  for (const provider of providers) {
    for (const point of provider.timeline ?? []) {
      const current = rows.get(point.date) ?? {
        date: point.date,
        calls: 0,
        succeeded: 0,
        failed: 0,
        knownCost: false,
        costUsd: 0,
      };
      rows.set(point.date, {
        ...current,
        calls: current.calls + point.calls,
        succeeded: current.succeeded + point.succeeded,
        failed: current.failed + point.failed,
        knownCost: current.knownCost || Number.isFinite(point.costUsd),
        costUsd:
          current.costUsd + (Number.isFinite(point.costUsd) ? point.costUsd : 0),
      });
    }
  }
  return [...rows.values()]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((row) => ({
      ...row,
      successRate:
        row.succeeded + row.failed
          ? (row.succeeded / (row.succeeded + row.failed)) * 100
          : null,
    }));
}

function KpiCard({ icon: Icon, label, value, note }) {
  return (
    <article className="provider-kpi">
      <span className="provider-kpi__icon"><Icon size={17} /></span>
      <span className="provider-kpi__label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Panel({ title, meta, children, className = "" }) {
  return (
    <section className={`provider-panel ${className}`.trim()}>
      <header className="provider-panel__heading">
        <h3>{title}</h3>
        {meta ? <span>{meta}</span> : null}
      </header>
      {children}
    </section>
  );
}

function ProviderCard({ provider, onProbe, onToggle }) {
  const health = getProviderHealth(provider);
  const circuit = provider.circuitStatus ?? "open";
  const p95 = provider.p95LatencyMs;
  const identity = resolveProviderIdentity(provider);
  const balanceLabel = formatBalance(provider.balance);
  const balanceUnsupported = provider.balanceCapability === "unsupported"
    || provider.balanceStatus === "unsupported"
    || provider.probeStatus === "unsupported";

  return (
    <article
      className={`provider-card provider-card--${health}`}
      data-health={health}
      data-testid="provider-card"
    >
      <header className="provider-card__header">
        <div className="provider-card__identity">
          <span className="provider-card__mark">
            {identity.logo ? (
              <img src={identity.logo} alt={identity.label} />
            ) : (
              <WarningCircle size={17} aria-hidden="true" />
            )}
          </span>
          <div>
            <h3>{provider.name}</h3>
            <small>{(provider.capabilities ?? []).join(" · ") || "API"}</small>
          </div>
        </div>
        <span className={`status-badge status-badge--${health}`}>
          {HEALTH_LABELS[health] ?? HEALTH_LABELS.unknown}
        </span>
      </header>

      <dl className="provider-card__metrics">
        <div><dt>успех</dt><dd>{formatPercent(provider.successRate)}</dd></div>
        <div><dt>p95</dt><dd>{formatLatency(p95)}</dd></div>
        <div><dt>вызовы</dt><dd>{number.format(provider.totalCalls ?? 0)}</dd></div>
        <div>
          <dt>расход</dt>
          <dd>
            {Number.isFinite(provider.providerCostUsd)
              ? `${money.format(provider.providerCostUsd)} $`
              : "нет данных"}
          </dd>
        </div>
      </dl>

      <div className="provider-card__route">
        <span>{CIRCUIT_LABELS[circuit] ?? "нет данных"}</span>
        <span>{provider.fallbackRecovered ?? 0} восстановления</span>
      </div>

      {balanceLabel || provider.topUpUrl || provider.alerts?.length ? (
        <div className="provider-card__balance">
          <span className="provider-card__balance-value">
            <small>баланс</small>
            {balanceLabel
              ? <strong>{balanceLabel}</strong>
              : <strong>{balanceUnsupported ? "баланс API не поддерживается" : "нет данных"}</strong>}
          </span>
          {provider.alerts?.slice(0, 2).map((alert) => (
            <span
              className={`provider-alert provider-alert--${alert.severity ?? "warning"}`}
              key={alert.id ?? alert.code}
            >
              {alertLabel(alert)}
            </span>
          ))}
          {provider.topUpUrl ? (
            <a
              href={provider.topUpUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={balanceUnsupported ? `открыть биллинг ${provider.name}` : `пополнить ${provider.name}`}
            >
              пополнить
            </a>
          ) : null}
        </div>
      ) : null}

      {provider.totalCalls === 0 ? (
        <p className="provider-empty">истории вызовов пока недостаточно</p>
      ) : null}

      <footer className="provider-card__actions">
        {onProbe ? (
          <button type="button" aria-label={`проверить ${provider.name}`} onClick={() => onProbe(provider.id)}>
            <ArrowsClockwise size={15} />
            <span>проверить</span>
          </button>
        ) : null}
        {onToggle ? (
          <button
            type="button"
            className={provider.enabled ? "button-quiet" : "button-primary"}
            aria-label={`${provider.enabled ? "отключить" : "включить"} ${provider.name}`}
            onClick={() => onToggle(provider.id, !provider.enabled)}
          >
            {provider.enabled ? "отключить" : "включить"}
          </button>
        ) : null}
      </footer>
    </article>
  );
}

function routeStepHealth(status) {
  if (["healthy", "closed", "operational"].includes(status)) return "healthy";
  if (["down", "failed", "unavailable"].includes(status)) return "down";
  return "unknown";
}

function FallbackChain({ routes = [] }) {
  const routeGroups = routes.filter(
    (route) => route.enabled && Array.isArray(route.steps) && route.steps.length,
  );

  return (
    <section className="fallback-chain" aria-label="fallback-цепочка">
      {routeGroups.length ? (
        <div className="fallback-chain__groups">
          {routeGroups.map((route) => (
            <div className="fallback-chain__group" key={route.id}>
              <h4>{route.capability || route.label}</h4>
              <ol className="fallback-chain__list">
                {route.steps.map((step, index) => {
                  const health = routeStepHealth(step.status);
                  return (
                  <li
                    key={`${route.id}:${step.provider}:${index}`}
                    className={`fallback-node fallback-node--${health}`}
                  >
                    <span className="fallback-node__index">{index + 1}</span>
                    <span className="fallback-node__body">
                      <strong>{providerDisplayName(step.provider)}</strong>
                      <small>
                        {index === 0 ? "первая попытка" : `fallback ${index}`}
                        {step.model ? ` · ${step.model}` : ""}
                      </small>
                    </span>
                    <span
                      className={`status-dot status-dot--${health}`}
                    />
                  </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <p className="provider-empty">фактические маршруты ещё не записаны</p>
      )}
    </section>
  );
}

function SuccessTimeline({ points }) {
  if (points.length < 2) {
    return <p className="provider-empty">истории вызовов пока недостаточно</p>;
  }
  return (
    <div className="provider-timeline" role="img" aria-label="успешность вызовов по дням">
      {points.map((point) => (
        <div className="provider-timeline__row" key={point.date}>
          <time dateTime={point.date}>{point.date.slice(5).replace("-", ".")}</time>
          <span className="provider-timeline__track">
            <span style={{ width: `${point.successRate ?? 0}%` }} />
          </span>
          <strong>{formatPercent(point.successRate)}</strong>
          <small>{point.calls} выз.</small>
        </div>
      ))}
    </div>
  );
}

function UsageTable({ providers }) {
  return (
    <div className="provider-table-wrap">
      <table className="provider-table">
        <thead><tr><th>провайдер</th><th>вызовы</th><th>успех</th><th>p95</th><th>расход</th></tr></thead>
        <tbody>
          {orderProviders(providers).map((provider) => (
            <tr key={provider.id}>
              <th>{provider.name}</th>
              <td>{number.format(provider.totalCalls ?? 0)}</td>
              <td>{formatPercent(provider.successRate)}</td>
              <td>{formatLatency(provider.p95LatencyMs)}</td>
              <td>
                {Number.isFinite(provider.providerCostUsd)
                  ? `${money.format(provider.providerCostUsd)} $`
                  : "нет данных"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BreakdownPanel({ providers }) {
  const operations = providers.flatMap((provider) =>
    (provider.operationBreakdown ?? []).map((item) => ({
      ...item,
      key: `${provider.id}:${item.id}`,
      provider: provider.name,
    })),
  );
  const models = providers.flatMap((provider) =>
    (provider.modelBreakdown ?? []).map((item) => ({
      ...item,
      key: `${provider.id}:${item.id}`,
      provider: provider.name,
    })),
  );
  if (!operations.length && !models.length) {
    return <p className="provider-empty">операции и модели ещё не зафиксированы</p>;
  }
  return (
    <div className="provider-breakdowns">
      <div>
        <h4>операции</h4>
        {operations.slice(0, 8).map((item) => (
          <p className="provider-breakdown-item" key={item.key}><span className="provider-breakdown-item__label" title={item.label}>{item.label}</span><strong>{item.calls}</strong></p>
        ))}
      </div>
      <div>
        <h4>модели</h4>
        {models.slice(0, 8).map((item) => (
          <p className="provider-breakdown-item" key={item.key}><span className="provider-breakdown-item__label" title={item.label}>{item.label}</span><strong>{item.calls}</strong></p>
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({ providers }) {
  const alerts = providers.flatMap((provider) =>
    (provider.alerts ?? []).map((alert) => ({
      ...alert,
      key: `${provider.id}:${alert.id ?? alert.code}`,
      provider: provider.name,
    })),
  );
  const errors = providers.flatMap((provider) =>
    (provider.errorBreakdown ?? []).map((item) => ({
      ...item,
      key: `${provider.id}:${item.id}`,
      provider: provider.name,
    })),
  );
  const incidents = providers.flatMap((provider) =>
    (provider.incidents ?? []).map((incident) => ({
      ...incident,
      provider: provider.name,
    })),
  );
  if (!alerts.length && !errors.length && !incidents.length) {
    return <p className="provider-empty">ошибок в доступной истории нет</p>;
  }
  return (
    <div className="provider-errors">
      {alerts.slice(0, 8).map((alert) => (
        <div key={alert.key} className={`provider-error provider-error--${alert.severity ?? "warning"}`}>
          <WarningCircle size={16} />
          <span><strong>{alertLabel(alert)}</strong><small>{alert.provider}</small></span>
        </div>
      ))}
      {errors.slice(0, 8).map((error) => (
        <div key={error.key}>
          <WarningCircle size={16} />
          <span><strong>{error.label}</strong><small>{error.provider}</small></span>
          <b>{error.count}</b>
        </div>
      ))}
      {incidents.slice(0, 6).map((incident) => (
        <div key={`${incident.provider}:${incident.id}`}>
          <Pulse size={16} />
          <span><strong>{incident.code}</strong><small>{incident.provider} · HTTP {incident.httpStatus ?? "—"}</small></span>
        </div>
      ))}
    </div>
  );
}

export function ProviderOperations({
  providers = [],
  routes = [],
  onProbe,
  onToggle,
  className = "",
}) {
  const modelProviders = providers.filter((provider) => (
    isModelApiProvider(provider)
    && provider.frozen !== true
    && provider.status !== "frozen"
  ));
  const orderedProviders = orderProviders(modelProviders);
  const visibleRoutes = routesForEnabledProviders(routes, orderedProviders);
  const summary = createSummary(orderedProviders);
  const timeline = mergeTimeline(orderedProviders);

  return (
    <section className={`provider-operations ${className}`.trim()}>
      <header className="feature-heading provider-feature-heading">
        <div>
          <p className="eyebrow">инфраструктура</p>
          <h2>состояние API</h2>
          <p>реальные вызовы, стоимость, ошибки и резервные маршруты</p>
        </div>
        <span className="feature-heading__meta">
          {summary.configured}/{modelProviders.length} подключены
        </span>
      </header>

      <div className="provider-kpi-grid">
        <KpiCard icon={Database} label="провайдеры" value={`${summary.configured}/${modelProviders.length}`} note="настроены в окружении" />
        <KpiCard icon={Pulse} label="API-вызовы" value={number.format(summary.totalCalls)} note="в доступной истории" />
        <KpiCard icon={ChartLineUp} label="успешность" value={formatPercent(summary.successRate)} note="по завершённым вызовам" />
        <KpiCard icon={CurrencyDollar} label="расход провайдеров" value={Number.isFinite(summary.costUsd) ? `${money.format(summary.costUsd)} $` : "нет данных"} note="по записанной себестоимости" />
      </div>

      <div className="provider-dashboard-grid">
        <Panel title="успешность по дням" meta={`${timeline.length} точек`} className="provider-panel--wide">
          <SuccessTimeline points={timeline} />
        </Panel>
        <Panel title="fallback-цепочки" meta="по типам задач">
          <FallbackChain routes={visibleRoutes} />
        </Panel>
        <Panel title="стоимость и использование" meta="без содержимого запросов" className="provider-panel--wide">
          <UsageTable providers={orderedProviders} />
        </Panel>
        <Panel title="операции и модели" meta="по фактическим вызовам">
          <BreakdownPanel providers={orderedProviders} />
        </Panel>
        <Panel title="ошибки и инциденты" meta="коды без raw payload">
          <ErrorPanel providers={orderedProviders} />
        </Panel>
      </div>

      <div className="provider-section-title">
        <div><GitBranch size={18} /><h3>подключения</h3></div>
        <span>{modelProviders.length} интеграций</span>
      </div>
      <div className="provider-grid">
        {orderedProviders.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} onProbe={onProbe} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}

export { FallbackChain, ProviderCard, createSummary, isModelApiProvider, mergeTimeline };
