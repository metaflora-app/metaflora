import { useState } from "react";
import { normalizeIncident } from "../../domain/alert-presentation.js";

const SEVERITY_LABELS = {
  critical: "критичный",
  warning: "предупреждение",
  info: "информация",
};

const STATUS_LABELS = {
  open: "открыт",
  acknowledged: "принят",
  resolved: "закрыт",
};

function formatIncidentTime(value) {
  if (!value) return "время не указано";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "время не указано";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function IncidentCard({
  incident,
  busyAction,
  onAcknowledge,
  onResolve,
  onProbeProvider,
  onRetryCheck,
  onCheckRoute,
  onOpenProvider,
  onRunAction,
}) {
  const isBusy = busyAction?.incidentId === incident.id;
  const probeHandler = onProbeProvider ?? onRetryCheck;
  const actionHandlers = {
    retry_check: probeHandler,
    check_route: onCheckRoute,
    open_provider: onOpenProvider,
  };
  const actionHandler = incident.action
    ? actionHandlers[incident.action.type]
    : null;

  return (
    <article
      className={`incident-card incident-card--${incident.severity}`}
      data-status={incident.status}
    >
      <div className="incident-card__signal" aria-hidden="true" />
      <div className="incident-card__content">
        <header>
          <div className="incident-card__badges">
            <span className={`status-badge status-badge--${incident.severity}`}>
              {SEVERITY_LABELS[incident.severity] ?? "событие"}
            </span>
            <span className="status-badge status-badge--neutral">
              {STATUS_LABELS[incident.status] ?? incident.status}
            </span>
          </div>
          <time dateTime={incident.startedAt}>
            {formatIncidentTime(incident.startedAt)}
          </time>
        </header>

        <h3>{incident.title}</h3>
        <p>{incident.reason}</p>
        <dl className="incident-card__facts">
          <div>
            <dt>провайдер</dt>
            <dd>{incident.provider}</dd>
          </div>
          <div>
            <dt>модель</dt>
            <dd>{incident.model}</dd>
          </div>
          {incident.errorCode && incident.errorCode !== "provider_error" ? (
            <div>
              <dt>код причины</dt>
              <dd><code>{incident.errorCode}</code></dd>
            </div>
          ) : null}
          {incident.httpStatus ? (
            <div>
              <dt>HTTP</dt>
              <dd>{incident.httpStatus}</dd>
            </div>
          ) : null}
          {incident.providerRequestId ? (
            <div>
              <dt>запрос провайдера</dt>
              <dd><code>{incident.providerRequestId}</code></dd>
            </div>
          ) : null}
          {incident.operation ? (
            <div>
              <dt>операция</dt>
              <dd><code>{incident.operation}</code></dd>
            </div>
          ) : null}
        </dl>
        <span className="incident-card__source">{incident.sourceLabel}</span>

        <footer>
          {actionHandler ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                onRunAction(
                  incident.action.type,
                  incident.id,
                  actionHandler,
                  incident.action.targetId,
                )
              }
            >
              {isBusy ? `${incident.action.label}…` : incident.action.label}
            </button>
          ) : null}
          {incident.status === "open" && onAcknowledge ? (
            <button
              type="button"
              aria-label={`принять ${incident.id}`}
              disabled={isBusy}
              onClick={() =>
                onRunAction("acknowledge", incident.id, onAcknowledge)
              }
            >
              {isBusy ? "принимаем…" : "принять"}
            </button>
          ) : null}
          {incident.status !== "resolved" && onResolve ? (
            <button
              type="button"
              className="button-quiet"
              aria-label={`закрыть ${incident.id}`}
              disabled={isBusy}
              onClick={() => onRunAction("resolve", incident.id, onResolve)}
            >
              {isBusy ? "закрываем…" : "закрыть"}
            </button>
          ) : null}
        </footer>
      </div>
    </article>
  );
}

export function AlertsPanel({
  incidents = [],
  onAcknowledge,
  onResolve,
  onProbeProvider,
  onRetryCheck,
  onCheckRoute,
  onOpenProvider,
  className = "",
}) {
  const [busyAction, setBusyAction] = useState(null);
  const [actionError, setActionError] = useState("");
  const normalizedIncidents = incidents
    .map((incident, index) =>
      normalizeIncident(incident, { fallbackId: `incident-${index}` }),
    )
    .filter(Boolean);
  const activeIncidents = normalizedIncidents.filter(
    ({ status }) => status !== "resolved",
  );

  async function runAction(action, incidentId, handler, targetId = incidentId) {
    setBusyAction({ action, incidentId });
    setActionError("");
    try {
      const result = await handler(targetId);
      const requiresExplicitSuccess = !["acknowledge", "resolve"].includes(action);
      if (
        requiresExplicitSuccess &&
        (result === null || result === undefined || result === false || result?.success === false)
      ) {
        throw new Error("action failed");
      }
    } catch {
      const messages = {
        acknowledge: "не удалось принять инцидент",
        resolve: "не удалось закрыть инцидент",
        retry_check: "не удалось повторить проверку",
        check_route: "не удалось проверить маршрут",
        open_provider: "не удалось открыть провайдера",
      };
      setActionError(messages[action] ?? "действие временно недоступно");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className={`alerts-panel ${className}`.trim()}>
      <header className="feature-heading">
        <div>
          <p className="eyebrow">наблюдаемость</p>
          <h2>алерты и инциденты</h2>
        </div>
        <span className="feature-heading__meta">
          {activeIncidents.length} активных
        </span>
      </header>

      {normalizedIncidents.length ? (
        <div className="incident-list">
          {normalizedIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              busyAction={busyAction}
              onAcknowledge={onAcknowledge}
              onResolve={onResolve}
              onProbeProvider={onProbeProvider}
              onRetryCheck={onRetryCheck}
              onCheckRoute={onCheckRoute}
              onOpenProvider={onOpenProvider}
              onRunAction={runAction}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state empty-state--success">
          <span aria-hidden="true">✓</span>
          <p>активных инцидентов нет</p>
          <small>все системы работают штатно</small>
        </div>
      )}
      {actionError ? (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      ) : null}
    </section>
  );
}

export { IncidentCard };
