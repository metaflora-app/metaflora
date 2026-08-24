import { CheckCircle, Clock, DownloadSimple, Key, LockKey, ShieldCheck } from "@phosphor-icons/react";
import { StatusBadge, Toggle } from "../../components/ui";

export function AuditPage({ audit }) {
  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <span className="eyebrow">append-only</span>
          <h2>журнал действий</h2>
        </div>
        <button className="secondary-action" type="button">
          <DownloadSimple size={15} />
          выгрузить CSV
        </button>
      </header>
      <div className="data-table audit-table">
        <div className="data-table__head">
          <span>время</span><span>кто</span><span>действие</span><span>объект</span><span>причина</span><span>результат</span>
        </div>
        {audit.map((row) => (
          <div className="data-table__row" key={row.id}>
            <span>{row.time}</span>
            <span>{row.actor}</span>
            <span>{row.action}</span>
            <span>{row.target}</span>
            <span className="truncate">{row.reason}</span>
            <span><StatusBadge tone={row.status === "success" ? "success" : "danger"}>{row.status === "success" ? "готово" : "ошибка"}</StatusBadge></span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SubscriptionsPage({ users, onOpenUser }) {
  const currentPlanNames = new Set(["новичок", "любитель", "автор", "исследователь", "эксперт"]);
  const currentUsers = users.filter((user) => currentPlanNames.has(user.plan));
  const plans = [
    ["новичок", currentUsers.filter((user) => user.plan === "новичок").length, "бесплатно", "free"],
    ["любитель", currentUsers.filter((user) => user.plan === "любитель").length, "449 ₽", "starter"],
    ["автор", currentUsers.filter((user) => user.plan === "автор").length, "749 ₽", "creator"],
    ["исследователь", currentUsers.filter((user) => user.plan === "исследователь").length, "1 990 ₽", "top"],
    ["эксперт", currentUsers.filter((user) => user.plan === "эксперт").length, "2 990 ₽", "expert"],
  ];

  const pluralizeUsers = (count) => {
    const mod100 = count % 100;
    const mod10 = count % 10;
    if (mod100 >= 11 && mod100 <= 14) return "пользователей";
    if (mod10 === 1) return "пользователь";
    if (mod10 >= 2 && mod10 <= 4) return "пользователя";
    return "пользователей";
  };

  return (
    <div className="page-stack">
      <section className="plan-grid">
        {plans.map(([name, count, price, tone]) => (
          <article className={`panel plan-card plan-card--${tone}`} key={name}>
            <header className="plan-card__head">
              <span className="plan-card__tag">
                {name === "исследователь" ? "топ" : "тариф"}
              </span>
              <span className="plan-card__state">активен</span>
            </header>
            <h2>{name}</h2>
            <div className="plan-card__metric"><strong>{count}</strong>{" "}<span>{pluralizeUsers(count)}</span></div>
            <footer className="plan-card__footer">
              <strong>{price}</strong>
              <small>{price === "бесплатно" ? "без оплаты" : "в месяц"}</small>
            </footer>
          </article>
        ))}
      </section>
      <section className="panel">
        <header className="panel__header">
          <div><span className="eyebrow">ближайшие события</span><h2>изменения подписок</h2></div>
        </header>
        <div className="compact-list">
          {currentUsers.slice(0, 6).map((user) => (
            <button type="button" key={user.id} onClick={() => onOpenUser(user)}>
              <span className="avatar">{user.initials}</span>
              <span><strong>{user.name}</strong><small>{user.telegramUsername ?? user.email ?? user.id}</small></span>
              <span>{user.plan}</span>
              <span><Clock size={14} /> {user.subscriptionEnds ?? "дата не записана"}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SettingsPage({ settings, onToggle }) {
  const payout = settings?.finance?.payout ?? {};
  const providerTopups = settings?.finance?.providerTopups ?? {};
  const mcpFundingWorker = settings?.finance?.mcpFundingWorker ?? {};
  const browserFunding = settings?.finance?.browserFunding ?? {};
  const rows = [
    ["двухфакторная защита", "обязательна для всех администраторов", "mfa"],
    ["журналировать чтение карточек", "фиксировать просмотр чувствительных данных", "readAudit"],
    ["скрывать содержимое запросов", "CRM получает только безопасные метаданные", "redaction"],
    ["ручное подтверждение ремонта", "мастер не меняет production без решения администратора", "repairApproval"],
  ];

  return (
    <div className="settings-grid">
      <section className="panel">
        <header className="panel__header">
          <div><span className="eyebrow">доступ</span><h2>защита CRM</h2></div>
          <ShieldCheck size={20} className="accent-icon" weight="fill" />
        </header>
        <div className="settings-list">
          {rows.map(([label, detail, key]) => (
            <div className="settings-row" key={key}>
              <span><strong>{label}</strong><small>{detail}</small></span>
              <Toggle checked={settings[key]} onChange={(checked) => onToggle(key, checked)} label="" />
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <header className="panel__header">
          <div><span className="eyebrow">интеграции</span><h2>серверный контур</h2></div>
          <LockKey size={20} className="accent-icon" weight="fill" />
        </header>
        <div className="integration-list">
          {[
            ["Supabase", "подключится через BFF", "configured"],
            ["ЮKassa checkout", "ключ только в bot server env", "configured"],
            [payout.label || "payouts", payout.status || "статус не передан", payout.ready ? "configured" : "pending"],
            ["Telegram", "admin allowlist", "configured"],
            ["provider API", "ключи не видны клиенту", "pending"],
            ["provider top-up", providerTopups.status || "ручная очередь", "pending"],
            ["MCP funding worker", mcpFundingWorker.status || "статус не передан; funding не подтверждено", "pending"],
            ["persistent browser connector", browserFunding.status || "выключен; авторизация требуется один раз", browserFunding.ready ? "configured" : "pending"],
          ].map(([name, detail, status]) => (
            <div key={name}>
              <span className="integration-list__icon"><Key size={16} /></span>
              <span><strong>{name}</strong><small>{detail}</small></span>
              {status === "configured" ? <CheckCircle size={17} weight="fill" className="success-icon" /> : <StatusBadge tone="warning">нужна проверка</StatusBadge>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
