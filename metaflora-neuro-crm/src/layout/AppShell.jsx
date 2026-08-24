import {
  Bell,
  ChartDonut,
  CirclesThreePlus,
  Books,
  Coins,
  CreditCard,
  Database,
  Gauge,
  Gift,
  House,
  ListMagnifyingGlass,
  Moon,
  Pulse,
  Robot,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  UsersThree,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

const navGroups = [
  {
    label: "основное",
    items: [
      { id: "overview", label: "обзор", icon: House },
      { id: "users", label: "пользователи", icon: UsersThree },
      { id: "finance", label: "деньги", icon: Coins },
      { id: "referrals", label: "партнёры", icon: UsersThree },
      { id: "generations", label: "генерации", icon: CirclesThreePlus },
      { id: "catalog", label: "каталог продукта", icon: Books },
    ],
  },
  {
    label: "управление",
    items: [
      { id: "providers", label: "провайдеры", icon: Database },
      { id: "alerts", label: "инциденты", icon: Bell },
      { id: "subscriptions", label: "подписки", icon: CreditCard },
      { id: "promos", label: "промокоды", icon: Gift },
    ],
  },
  {
    label: "система",
    items: [
      { id: "audit", label: "журнал действий", icon: ListMagnifyingGlass },
      { id: "agent", label: "ИИ-мастер", icon: Robot },
      { id: "settings", label: "настройки", icon: SlidersHorizontal },
    ],
  },
];

const pageMeta = {
  overview: ["обзор", "состояние продукта и деньги"],
  users: ["пользователи", "аккаунты, тарифы и действия"],
  finance: ["деньги", "платежи, проводки и маржа"],
  referrals: ["партнёры", "приглашения, начисления и выплаты"],
  generations: ["генерации", "метаданные запросов без содержимого"],
  catalog: ["каталог продукта", "модели, агенты, инструменты и сценарии"],
  providers: ["провайдеры", "здоровье API, расходы и лимиты"],
  alerts: ["инциденты", "ошибки, деградации и восстановление"],
  subscriptions: ["подписки", "тарифы и ручные изменения"],
  promos: ["промокоды", "правила, лимиты и применения"],
  audit: ["журнал действий", "неизменяемая история администрирования"],
  agent: ["ИИ-мастер", "диагностика и безопасные исправления"],
  settings: ["настройки", "доступ, правила и хранение данных"],
};

const THEME_STORAGE_KEY = "metaflora-crm-theme";

function getInitialTheme() {
  try {
    const savedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    return "dark";
  }
  try {
    return globalThis.matchMedia?.("(prefers-color-scheme: light)")?.matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

export function AppShell({
  activePage,
  onNavigate,
  period,
  onPeriodChange,
  children,
  systemHealthy,
  incidentCount = 0,
  lastCheckedAt = null,
}) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [title, subtitle] = pageMeta[activePage] ?? pageMeta.overview;
  const checkedAtLabel = lastCheckedAt
    ? new Intl.DateTimeFormat("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(lastCheckedAt))
    : "нет данных";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Theme persistence is optional; the visual switch still works for the session.
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => onNavigate("overview")}>
          <span className="brand__mark">
            <img src="/assets/metaflora-favicon.png" alt="логотип МЕТАФЛОРА* нейро" />
          </span>
          <span className="brand__copy">
            <strong>МЕТАФЛОРА* нейро</strong>
          </span>
        </button>

        <nav className="sidebar__nav" aria-label="разделы CRM">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group__label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    className={`nav-item${activePage === item.id ? " is-active" : ""}`}
                    type="button"
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    data-testid={`nav-${item.id}`}
                  >
                    <Icon size={17} weight="regular" />
                    <span>{item.label}</span>
                    {item.id === "alerts" && incidentCount > 0 ? (
                      <span className="nav-item__badge">{incidentCount}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar__health">
          <div className="sidebar__health-head">
            <span>
              <Pulse size={15} />
              контур
            </span>
            <span className={`health-dot${systemHealthy ? "" : " health-dot--error"}`} />
          </div>
          <strong>{systemHealthy ? "все системы отвечают" : "есть деградация"}</strong>
          <small>последняя проверка: {checkedAtLabel}</small>
        </div>

        <div className="admin-chip">
          <img
            className="admin-chip__avatar"
            src="/assets/ivan-mishchenko.jpg"
            alt="Иван Мищенко"
          />
          <span>
            <strong>Иван Мищенко</strong>
            <small>главный администратор</small>
          </span>
          <ShieldCheck size={17} weight="fill" />
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar__title">
            <h1>{title}</h1>
            <span>{subtitle}</span>
          </div>
          <div className="topbar__tools">
            <label className="period-select">
              <Gauge size={15} />
              <select value={period} onChange={(event) => onPeriodChange(event.target.value)}>
                <option value="day">сегодня</option>
                <option value="week">7 дней</option>
                <option value="month">30 дней</option>
              </select>
            </label>
            <button
              aria-label={theme === "light" ? "включить тёмную тему" : "включить светлую тему"}
              aria-pressed={theme === "light"}
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
            >
              <span className="theme-toggle__track" aria-hidden="true">
                <span className="theme-toggle__thumb">
                  {theme === "light" ? <Moon size={12} weight="fill" /> : <Sun size={12} weight="fill" />}
                </span>
              </span>
            </button>
            <button className="icon-button icon-button--alert" type="button" onClick={() => onNavigate("alerts")}>
              <Bell size={17} />
              <span />
            </button>
            <button className="primary-action" type="button" onClick={() => onNavigate("agent")}>
              <Robot size={15} />
              открыть ИИ-мастер
            </button>
          </div>
        </header>
        <main className="workspace__content">{children}</main>
      </section>
    </div>
  );
}

export { navGroups, pageMeta };
