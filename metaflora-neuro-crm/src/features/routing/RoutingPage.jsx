import { ArrowRight, CheckCircle, Clock, Flask, ShieldWarning } from "@phosphor-icons/react";
import { StatusBadge, Toggle } from "../../components/ui";

function providerLabel(value) {
  const normalized = String(value ?? "").toLocaleLowerCase("ru-RU").replace(/[^a-zа-яё0-9]/g, "");
  return ["kie", "kieai"].includes(normalized) ? "GPTunnel" : value;
}

export function RoutingPage({ routes, onToggleRoute, onSimulate }) {
  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">каскад без дублей и повторных списаний</span>
          <h2>правила маршрутизации</h2>
          <p>каждая задача идёт по порядку: здоровый провайдер, лимит стоимости, таймаут и только потом резервный путь.</p>
        </div>
        <button className="primary-action" type="button" onClick={onSimulate}>
          <Flask size={15} />
          проверить маршрут
        </button>
      </section>

      <section className="routing-list">
        {routes.map((route) => (
          <article className="panel route-card" key={route.id}>
            <header className="route-card__header">
              <div>
                <span className="eyebrow">{route.capability}</span>
                <h3>{route.label}</h3>
              </div>
              <Toggle
                checked={route.enabled}
                onChange={(checked) => onToggleRoute(route.id, checked)}
                label={route.enabled ? "включён" : "выключен"}
              />
            </header>
            <div className="route-steps">
              {route.steps.map((step, index) => (
                <div className="route-step" key={`${route.id}-${step.provider}`}>
                  <span className={`route-step__index${step.status === "open" ? " route-step__index--warning" : ""}`}>
                    {step.status === "healthy" ? <CheckCircle size={16} weight="fill" /> : <ShieldWarning size={16} weight="fill" />}
                  </span>
                  <span className="route-step__copy">
                    <strong>{providerLabel(step.provider)}</strong>
                    <small>{step.model}</small>
                  </span>
                  <span className="route-step__meta">
                    <Clock size={13} /> {step.timeout}с
                  </span>
                  <span className="route-step__meta">до {step.maxCost} ₽</span>
                  <StatusBadge tone={step.status === "healthy" ? "success" : "warning"}>
                    {step.status === "healthy" ? "готов" : "circuit open"}
                  </StatusBadge>
                  {index < route.steps.length - 1 ? <ArrowRight className="route-step__arrow" size={16} /> : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
