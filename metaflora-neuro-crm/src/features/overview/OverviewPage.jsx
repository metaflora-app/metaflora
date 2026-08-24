import { ArrowRight, ChartLineUp, CheckCircle, ClockCountdown, Coins, CreditCard, Pulse, UsersThree, Warning } from "@phosphor-icons/react";
import { StatusBadge } from "../../components/ui";
import { resolveProviderIdentity } from "../providers/provider-identities.js";

function polylinePoints(values, top = 14, bottom = 88) {
  const maximum = Math.max(...values, 1);
  const lastIndex = Math.max(values.length - 1, 1);
  return values.map((value, index) => {
    const x = 4 + ((index / lastIndex) * 92);
    const y = bottom - ((Math.max(0, value) / maximum) * (bottom - top));
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function MicroTrend({ values = [], direction = "neutral" }) {
  const safeValues = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
  return (
    <svg className={`overview-kpi-card__spark overview-kpi-card__spark--${direction}`} viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={polylinePoints(safeValues, 4, 25)} />
    </svg>
  );
}

function CompactKpi({ label, value, detail, trend, values, icon: Icon }) {
  return (
    <article className="overview-kpi-card overview-kpi-card--compact">
      <div className="overview-kpi-card__top overview-kpi-card__label-slot"><span className="overview-kpi-card__icon"><Icon size={15} /></span><span>{label}</span></div>
      <div className="overview-kpi-card__value overview-kpi-card__value-slot">{value}</div>
      <div className="overview-kpi-card__bottom overview-kpi-card__detail-slot">
        <span className={`overview-kpi-card__trend overview-kpi-card__trend--${trend?.direction ?? "neutral"}`}>{trend?.label ?? detail}</span>
        {values?.length ? <MicroTrend values={values} direction={trend?.direction} /> : <span />}
      </div>
    </article>
  );
}

function ActivityChart({ revenue = [], generations = [], periodLabel = "7 дней назад" }) {
  const revenueValues = revenue.map(({ value }) => Number(value) || 0);
  const generationValues = generations.map(({ value }) => Number(value) || 0);
  const hasValues = [...revenueValues, ...generationValues].some((value) => value > 0);
  return (
    <div className="overview-activity-chart" role="img" aria-label="выручка и генерации по дням, индексированная динамика">
      <div className="overview-activity-chart__legend"><span><i className="is-revenue" />выручка</span><span><i className="is-generation" />генерации</span><small>индексированная динамика</small></div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="overview-activity-chart__grid" d="M0 18H100M0 42H100M0 66H100M0 90H100" />
        {hasValues ? <><polyline className="overview-activity-chart__line is-revenue" points={polylinePoints(revenueValues)} /><polyline className="overview-activity-chart__line is-generation" points={polylinePoints(generationValues)} /></> : <path className="overview-activity-chart__empty trend-chart__empty" d="M4 88H96" />}
      </svg>
      <div className="overview-activity-chart__axis"><span>{periodLabel}</span><span>сегодня</span></div>
    </div>
  );
}

function ModelRanking({ items }) {
  return (
    <ol className="model-usage-rank" aria-label="рейтинг популярных моделей">
      {items.length ? items.map((item, index) => (
        <li className="model-usage-rank__item" key={item.name}>
          <span className="model-usage-rank__number">{index + 1}</span>
          <div><span title={item.name}>{item.name}</span><i><b style={{ width: `${Math.max(2, item.value)}%` }} /></i></div>
          <strong>{item.value}%</strong>
        </li>
      )) : <li className="empty-state">записанных обращений пока нет</li>}
    </ol>
  );
}

export function OverviewPage({ metrics, providers, incidents, onNavigate }) {
  const p95Label = Number.isFinite(metrics.p95Ms) ? `${(metrics.p95Ms / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} с` : "—";
  const revenueValues = metrics.revenueSeries?.map(({ value }) => value) ?? [];
  const generationValues = metrics.generationSeries?.map(({ value }) => value) ?? [];
  const openIncidents = incidents.filter(({ status }) => status !== "resolved");
  return (
    <div className="page-stack overview-executive">
      <section className="overview-kpi-strip overview-kpi-grid--baseline" aria-label="ключевые показатели">
        <CompactKpi label="активные" value={metrics.activeUsers.toLocaleString("ru-RU")} detail="текущее состояние" trend={metrics.kpiTrends?.activeUsers} values={[]} icon={UsersThree} />
        <CompactKpi label="оплачено" value={`${metrics.revenue.toLocaleString("ru-RU")} ₽`} detail={`${metrics.paymentCount} платежей`} trend={metrics.kpiTrends?.revenue} values={revenueValues} icon={CreditCard} />
        <CompactKpi label="генерации" value={metrics.generationTotal.toLocaleString("ru-RU")} detail={`${metrics.metacoinsSpent} метакоинов`} trend={metrics.kpiTrends?.generations} values={generationValues} icon={Pulse} />
        <CompactKpi label="успешность" value={`${metrics.successRate}%`} detail={`p95 · ${p95Label}`} trend={metrics.kpiTrends?.successRate} values={generationValues} icon={ChartLineUp} />
      </section>

      <section className="overview-command-grid">
        <article className="panel overview-command-grid__activity">
          <header className="panel__header overview-panel-heading"><div><span className="eyebrow">темп бизнеса</span><h2>деньги и активность</h2></div><div className="overview-panel-heading__totals"><strong>{metrics.revenue.toLocaleString("ru-RU")} ₽</strong><span>{metrics.generationTotal} операций</span></div></header>
          <ActivityChart revenue={metrics.revenueSeries} generations={metrics.generationSeries} periodLabel={metrics.periodLabel} />
          <footer className="overview-activity-footer"><span><CreditCard size={14} /> {metrics.paymentCount} успешных оплат</span><span><Coins size={14} /> {metrics.metacoinsSpent} списано</span><span><UsersThree size={14} /> {metrics.paidUsers} платных</span></footer>
        </article>

        <article className="panel overview-command-grid__models">
          <header className="panel__header overview-panel-heading"><div><span className="eyebrow">структура спроса</span><h2>что запускают</h2></div><span className="overview-panel-heading__quiet">топ {metrics.modelUsage.length}</span></header>
          <ModelRanking items={metrics.modelUsage} />
        </article>

        <article className="panel overview-command-grid__providers">
          <header className="panel__header overview-panel-heading"><div><span className="eyebrow">инфраструктура</span><h2>здоровье провайдеров</h2></div><button className="text-action" type="button" onClick={() => onNavigate("providers")}>все <ArrowRight size={14} /></button></header>
          <div className="provider-health-matrix" role="grid" aria-label="состояние провайдеров">
            {providers.slice(0, 5).map((provider) => {
              const identity = resolveProviderIdentity(provider);
              const tone = provider.status === "healthy" ? "success" : provider.status === "down" ? "danger" : "warning";
              return <div role="row" key={provider.id}><span className="provider-health-matrix__identity" role="gridcell">{identity.logo ? <img src={identity.logo} alt="" /> : null}<strong>{provider.name}</strong></span><span role="gridcell">{provider.success}%</span><span role="gridcell">{provider.latency} мс</span><span role="gridcell"><StatusBadge tone={tone}>{tone === "success" ? "стабилен" : tone === "danger" ? "сбой" : "проверить"}</StatusBadge><button className="provider-health-matrix__open" type="button" aria-label={`открыть ${provider.name}`} onClick={() => onNavigate("providers")}><ArrowRight size={13} /></button></span></div>;
            })}
          </div>
        </article>

        <article className="panel overview-command-grid__incidents">
          <header className="panel__header overview-panel-heading"><div><span className="eyebrow">фокус</span><h2>требуют внимания</h2></div><button className="text-action" type="button" onClick={() => onNavigate("alerts")}>{openIncidents.length} открыто <ArrowRight size={14} /></button></header>
          <ul className="incident-summary" aria-label="инциденты, требующие внимания">
            {openIncidents.slice(0, 3).map((incident) => <li key={incident.id}><button type="button" onClick={() => onNavigate("alerts")}><span className={`incident-icon incident-icon--${incident.severity}`}>{incident.severity === "critical" ? <Warning weight="fill" /> : incident.status === "resolved" ? <CheckCircle weight="fill" /> : <ClockCountdown />}</span><span className="incident-summary__copy"><strong>{incident.title}</strong><small>{incident.service} · {incident.time}</small></span><ArrowRight size={14} /></button></li>)}
            {!openIncidents.length ? <li className="incident-summary__clear"><CheckCircle size={18} /> нет открытых инцидентов</li> : null}
          </ul>
        </article>
      </section>
    </div>
  );
}
