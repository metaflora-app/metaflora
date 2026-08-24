import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./layout/AppShell";
import { Drawer } from "./components/ui";
import { ToastStack } from "./components/feedback";
import { OverviewPage } from "./features/overview/OverviewPage";
import { UsersPage } from "./features/users";
import { FinancePage } from "./features/finance";
import { ReferralPartnersPage } from "./features/referrals";
import { GenerationsPage } from "./features/generations";
import { ProductCatalogPage } from "./features/catalog";
import productCatalogManifest from "./generated/product-catalog.v1.json";
import { ProviderOperations } from "./features/providers";
import { AlertsPanel } from "./features/alerts";
import { PromoCodesPanel } from "./features/promos";
import { SupportAgentPanel } from "./features/agent";
import { LoginScreen } from "./features/auth/LoginScreen";
import {
  AuditPage,
  SettingsPage,
  SubscriptionsPage,
} from "./features/system/SystemPages";
import { demoDashboardData } from "./data/demo-dashboard";
import { loadDashboard } from "./data/dashboard-client";
import {
  adjustMetacoinBalance,
  changeSubscription,
  loadAuthStatus,
  loadUserDetails,
  probeProvider as probeProviderApi,
  createPromoCode,
  requestLoginCode,
  verifyLoginCode,
} from "./data/admin-client";

const IS_TEST_MODE = import.meta.env.MODE === "test";
const EMPTY_DASHBOARD_DATA = Object.freeze({
  users: [],
  payments: [],
  financeAllocations: [],
  wallet: {},
  walletLedger: [],
  payouts: [],
  referralPartners: [],
  providerTopups: [],
  providerFunding: [],
  yookassaConfirmations: [],
  ledgerEntries: [],
  generations: [],
  providers: [],
  incidents: [],
  promos: [],
  routes: [],
  audit: [],
  settings: {},
  workflow: {},
});
const INITIAL_DASHBOARD_DATA = IS_TEST_MODE
  ? demoDashboardData
  : EMPTY_DASHBOARD_DATA;

const PLAN_CYCLE = {
  новичок: "любитель",
  любитель: "автор",
  автор: "исследователь",
  исследователь: "эксперт",
  эксперт: "новичок",
};

const SUBSCRIPTION_PLAN_LABELS = {
  free: "новичок",
  pro: "любитель",
  team: "автор",
  business: "исследователь",
  expert: "эксперт",
};

const PLAN_ID_BY_LABEL = Object.freeze({
  новичок: "newcomer",
  любитель: "amateur",
  автор: "author",
  исследователь: "researcher",
  эксперт: "expert",
  free: "newcomer",
  pro: "amateur",
  team: "author",
  business: "researcher",
});

const PLAN_LABEL_BY_ID = Object.freeze({
  newcomer: "новичок",
  amateur: "любитель",
  author: "автор",
  researcher: "исследователь",
  expert: "эксперт",
});

const ARCHIVED_PLAN_LABEL = "архивный тариф";
const OBSOLETE_PLAN_KEYS = new Set([
  "test_140",
  "test_110",
  "final_test_130",
  "тестовый",
  "новый тестовый",
  "финальный новый",
]);
const CURRENT_PLAN_LABELS = new Set(Object.values(PLAN_LABEL_BY_ID));

export function displaySubscriptionPlan(plan) {
  const normalized = String(plan ?? "").trim().toLowerCase();
  if (!normalized) return "новичок";
  if (OBSOLETE_PLAN_KEYS.has(normalized)) return ARCHIVED_PLAN_LABEL;
  return SUBSCRIPTION_PLAN_LABELS[normalized] ?? plan;
}

function planIdForManualChange(plan) {
  const label = displaySubscriptionPlan(plan);
  if (!CURRENT_PLAN_LABELS.has(label)) return "newcomer";
  return PLAN_ID_BY_LABEL[label] ?? "newcomer";
}

function revenueSeries(payments, days = 7, anchorTimestamp) {
  const successfulPayments = payments.filter((payment) => payment.status === "succeeded");
  const latestTimestamp = successfulPayments
    .map((payment) => Date.parse(payment.createdAt))
    .filter(Number.isFinite)
    .reduce((latest, value) => Math.max(latest, value), 0);
  const seriesAnchor = Number.isFinite(anchorTimestamp) ? anchorTimestamp : latestTimestamp;
  if (!seriesAnchor) return [];

  const day = 86_400_000;
  const start = new Date(seriesAnchor);
  start.setUTCHours(0, 0, 0, 0);
  start.setTime(start.getTime() - ((days - 1) * day));
  return Array.from({ length: days }, (_, index) => {
    const from = start.getTime() + (index * day);
    const until = from + day;
    const value = successfulPayments
      .filter((payment) => {
        const createdAt = Date.parse(payment.createdAt);
        return Number.isFinite(createdAt) && createdAt >= from && createdAt < until;
      })
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return Object.freeze({ value });
  });
}

function generationSeries(generations, days = 7, anchorTimestamp) {
  const timestamps = generations
    .map((generation) => Date.parse(generation.createdAt))
    .filter(Number.isFinite);
  const latestTimestamp = timestamps.reduce((latest, value) => Math.max(latest, value), 0);
  const seriesAnchor = Number.isFinite(anchorTimestamp) ? anchorTimestamp : latestTimestamp;
  if (!seriesAnchor) return [];
  const day = 86_400_000;
  const start = new Date(seriesAnchor);
  start.setUTCHours(0, 0, 0, 0);
  start.setTime(start.getTime() - ((days - 1) * day));
  return Array.from({ length: days }, (_, index) => {
    const from = start.getTime() + (index * day);
    const until = from + day;
    return Object.freeze({
      value: generations.filter((generation) => {
        const createdAt = Date.parse(generation.createdAt);
        return Number.isFinite(createdAt) && createdAt >= from && createdAt < until;
      }).length,
    });
  });
}

function seriesTrend(points) {
  if (!points.length) return null;
  const values = points.map(({ value }) => Number(value) || 0);
  const earlier = values.slice(0, 3).reduce((sum, value) => sum + value, 0);
  const recent = values.slice(-3).reduce((sum, value) => sum + value, 0);
  if (!earlier && !recent) return null;
  const change = earlier ? Math.round(((recent - earlier) / earlier) * 100) : 100;
  return {
    direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
    value: Math.abs(change),
    label: `${change > 0 ? "+" : ""}${change}% к началу периода`,
  };
}

const PERIOD_DAYS = Object.freeze({ day: 1, week: 7, month: 30 });

export function filterRecordsByPeriod(records, period, anchorTimestamp, dateFields = ["createdAt"]) {
  const days = PERIOD_DAYS[period] ?? PERIOD_DAYS.week;
  if (!Number.isFinite(anchorTimestamp)) return [];
  const start = new Date(anchorTimestamp);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return records.filter((record) => dateFields.some((field) => {
    const timestamp = Date.parse(record?.[field]);
    return Number.isFinite(timestamp) && timestamp >= start.getTime() && timestamp <= anchorTimestamp;
  }));
}

function recordLabel(record) {
  if (!record) return "";
  if (record.kind === "payment") return `платёж ${record.data.id}`;
  if (record.kind === "ledger") return `операция ${record.data.id}`;
  return `генерация ${record.data.id}`;
}

function RecordDetails({ record }) {
  if (!record) return null;
  const rows = Object.entries(record.data).filter(
    ([key, value]) =>
      value !== null &&
      value !== undefined &&
      !["prompt", "output", "input", "response", "content"].includes(
        key.toLowerCase(),
      ),
  );

  return (
    <dl className="record-facts">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>
            {typeof value === "object"
              ? JSON.stringify(value)
              : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function App() {
  const [authStatus, setAuthStatus] = useState(
    IS_TEST_MODE ? "authenticated" : "loading",
  );
  const [activePage, setActivePage] = useState("overview");
  const [period, setPeriod] = useState("week");
  const [dataStatus, setDataStatus] = useState(
    IS_TEST_MODE ? "ready" : "loading",
  );
  const [lastCheckedAt, setLastCheckedAt] = useState(
    IS_TEST_MODE ? new Date().toISOString() : null,
  );
  const [users, setUsers] = useState(INITIAL_DASHBOARD_DATA.users);
  const [payments, setPayments] = useState(INITIAL_DASHBOARD_DATA.payments);
  const [financeAllocations, setFinanceAllocations] = useState(
    INITIAL_DASHBOARD_DATA.financeAllocations ?? [],
  );
  const [wallet, setWallet] = useState(INITIAL_DASHBOARD_DATA.wallet ?? {});
  const [walletLedger, setWalletLedger] = useState(INITIAL_DASHBOARD_DATA.walletLedger ?? []);
  const [payouts, setPayouts] = useState(INITIAL_DASHBOARD_DATA.payouts ?? []);
  const [referralPartners, setReferralPartners] = useState(INITIAL_DASHBOARD_DATA.referralPartners ?? []);
  const [providerTopups, setProviderTopups] = useState(
    INITIAL_DASHBOARD_DATA.providerTopups ?? [],
  );
  const [providerFunding, setProviderFunding] = useState(
    INITIAL_DASHBOARD_DATA.providerFunding ?? [],
  );
  const [yookassaConfirmations, setYookassaConfirmations] = useState(
    INITIAL_DASHBOARD_DATA.yookassaConfirmations ?? [],
  );
  const [ledgerEntries, setLedgerEntries] = useState(
    INITIAL_DASHBOARD_DATA.ledgerEntries,
  );
  const [providers, setProviders] = useState(INITIAL_DASHBOARD_DATA.providers);
  const [generations, setGenerations] = useState(
    INITIAL_DASHBOARD_DATA.generations,
  );
  const [incidents, setIncidents] = useState(INITIAL_DASHBOARD_DATA.incidents);
  const [promos, setPromos] = useState(INITIAL_DASHBOARD_DATA.promos);
  const [routes, setRoutes] = useState(INITIAL_DASHBOARD_DATA.routes);
  const [audit, setAudit] = useState(INITIAL_DASHBOARD_DATA.audit);
  const [settings, setSettings] = useState(INITIAL_DASHBOARD_DATA.settings);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [selectedUserDetailsStatus, setSelectedUserDetailsStatus] =
    useState("idle");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (IS_TEST_MODE) return undefined;

    const controller = new AbortController();
    loadAuthStatus((url, options) =>
      fetch(url, { ...options, signal: controller.signal }),
    )
      .then(({ authenticated }) =>
        setAuthStatus(authenticated ? "authenticated" : "anonymous"),
      )
      .catch((error) => {
        if (error?.name !== "AbortError") setAuthStatus("anonymous");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (IS_TEST_MODE || authStatus !== "authenticated") return undefined;

    const controller = new AbortController();
    loadDashboard((url, options) =>
      fetch(url, { ...options, signal: controller.signal }),
    )
      .then((data) => {
        setUsers(data.users);
        setPayments(data.payments);
        setFinanceAllocations(data.financeAllocations);
        setWallet(data.wallet);
        setWalletLedger(data.walletLedger);
        setPayouts(data.payouts);
        setReferralPartners(data.referralPartners);
        setProviderTopups(data.providerTopups);
        setProviderFunding(data.providerFunding);
        setYookassaConfirmations(data.yookassaConfirmations);
        setLedgerEntries(data.ledgerEntries);
        setGenerations(data.generations);
        setProviders(data.providers);
        setIncidents(data.incidents);
        setPromos(data.promos);
        setRoutes(data.routes);
        setAudit(data.audit);
        setSettings((current) => ({ ...current, ...data.settings }));
        setLastCheckedAt(data.now ?? new Date().toISOString());
        setDataStatus("ready");
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setDataStatus("error");
      });

    return () => controller.abort();
  }, [authStatus]);

  useEffect(() => {
    if (IS_TEST_MODE || !selectedUserId) {
      setSelectedUserDetails(null);
      setSelectedUserDetailsStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    setSelectedUserDetails(null);
    setSelectedUserDetailsStatus("loading");
    loadUserDetails(selectedUserId, (url, options) =>
      fetch(url, { ...options, signal: controller.signal }),
    )
      .then((details) => {
        setSelectedUserDetails(details);
        setSelectedUserDetailsStatus("ready");
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setSelectedUserDetailsStatus("error");
      });

    return () => controller.abort();
  }, [selectedUserId]);

  const systemHealthy = providers.every(
    (provider) => !provider.enabled || provider.status !== "down",
  );

  const overviewProviders = useMemo(
    () =>
      providers.map((provider, index) => ({
        ...provider,
        tone: provider.tone ?? ["accent", "cyan", "violet", "warning"][index % 4],
        latency: provider.latencyMs ?? provider.averageLatencyMs ?? 0,
        success: provider.successRate ?? 0,
        status:
          provider.health === "healthy" || provider.status === "operational"
            ? "healthy"
            : provider.health === "down" || provider.status === "down"
              ? "down"
              : "degraded",
      })),
    [providers],
  );

  const overviewMetrics = useMemo(() => {
    const latestRecordTimestamp = [...payments, ...generations, ...ledgerEntries]
      .flatMap((record) => [record.createdAt, record.occurredAt, record.completedAt])
      .map((value) => Date.parse(value))
      .filter(Number.isFinite)
      .reduce((latest, value) => Math.max(latest, value), 0);
    const overviewAnchor = IS_TEST_MODE ? latestRecordTimestamp : Date.now();
    const periodPayments = filterRecordsByPeriod(payments, period, overviewAnchor);
    const periodGenerations = filterRecordsByPeriod(generations, period, overviewAnchor, ["createdAt"]);
    const periodLedgerEntries = filterRecordsByPeriod(ledgerEntries, period, overviewAnchor, ["createdAt", "occurredAt"]);
    const revenue = periodPayments
      .filter((payment) => payment.status === "succeeded")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
    const completed = periodGenerations.filter(
      (generation) => generation.status === "completed",
    ).length;
    const total = periodGenerations.length || 1;
    const knownProviderCosts = providers
      .map((provider) => Number(provider.providerCostUsd))
      .filter(Number.isFinite);
    const providerCostUsd = knownProviderCosts.length
      ? knownProviderCosts.reduce((totalCost, cost) => totalCost + cost, 0)
      : null;
    const completedDurations = periodGenerations
      .filter((generation) => generation.status === "completed")
      .map((generation) => Number(generation.durationMs))
      .filter((duration) => Number.isFinite(duration) && duration >= 0)
      .sort((left, right) => left - right);
    const p95Index = completedDurations.length
      ? Math.min(completedDurations.length - 1, Math.ceil(completedDurations.length * 0.95) - 1)
      : -1;
    const modelCounts = periodGenerations.reduce((counts, generation) => {
      const name = String(generation.model || "не указана");
      return { ...counts, [name]: (counts[name] ?? 0) + 1 };
    }, {});
    const modelUsage = Object.entries(modelCounts)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        value: total ? Math.round((count / total) * 1000) / 10 : 0,
      }));
    const paidUsers = users.filter((user) => user.plan && user.plan !== "новичок").length;
    const freeUsers = Math.max(0, users.length - paidUsers);
    const metacoinsSpent = periodLedgerEntries
      .filter((entry) => entry.type === "debit" && entry.status === "settled")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const selectedPeriodDays = PERIOD_DAYS[period] ?? PERIOD_DAYS.week;
    const revenuePoints = revenueSeries(periodPayments, selectedPeriodDays, overviewAnchor);
    const generationPoints = generationSeries(periodGenerations, selectedPeriodDays, overviewAnchor);
    return {
      activeUsers: users.filter((user) => user.status === "active").length,
      revenue,
      providerCostUsd,
      margin: null,
      successRate: Math.round((completed / total) * 1000) / 10,
      p95Ms: p95Index >= 0 ? completedDurations[p95Index] : null,
      freeUsers,
      paidUsers,
      modelUsage,
      revenueSeries: revenuePoints,
      generationSeries: generationPoints,
      generationTotal: periodGenerations.length,
      paymentCount: periodPayments.filter((payment) => payment.status === "succeeded").length,
      metacoinsSpent,
      kpiTrends: {
        activeUsers: null,
        revenue: seriesTrend(revenuePoints),
        generations: seriesTrend(generationPoints),
        successRate: periodGenerations.length ? {
          direction: Math.round((completed / total) * 1000) / 10 >= 90 ? "up" : "down",
          label: `p95 · ${p95Index >= 0 ? `${Math.round(completedDurations[p95Index] / 100) / 10} с` : "—"}`,
        } : null,
      },
      periodLabel: period === "day" ? "сегодня" : period === "month" ? "30 дней назад" : "7 дней назад",
    };
  }, [generations, ledgerEntries, payments, period, providers, users]);

  const overviewIncidents = useMemo(
    () =>
      incidents.map((incident) => ({
        ...incident,
        service: incident.service ?? incident.source ?? "system",
        correlationId: incident.correlationId ?? incident.id,
        time: incident.time ?? "только что",
      })),
    [incidents],
  );

  const subscriptionUsers = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        plan: displaySubscriptionPlan(user.plan),
        initials: user.name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join(""),
        username: (user.telegramUsername ?? user.email ?? user.id).replace(
          /^@/,
          "",
        ),
      })),
    [users],
  );

  function notify(title, detail, tone = "success") {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, title, detail, tone }]);
  }

  function appendAudit(action, target, reason, status = "success") {
    const row = {
      id: `audit-${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      actor: "Иван Мищенко",
      action,
      target,
      reason,
      status,
    };
    setAudit((items) => [row, ...items]);
  }

  function toggleUserBlocked(user) {
    const nextStatus = user.status === "blocked" ? "active" : "blocked";
    setUsers((items) =>
      items.map((item) =>
        item.id === user.id ? { ...item, status: nextStatus } : item,
      ),
    );
    appendAudit("user.status_changed", user.id, nextStatus);
    notify(
      nextStatus === "blocked" ? "пользователь заблокирован" : "доступ восстановлен",
      user.telegramUsername ?? user.id,
    );
  }

  async function changeUserPlan(user) {
    const currentPlanId = planIdForManualChange(user.plan);
    const currentLabel = PLAN_LABEL_BY_ID[currentPlanId] ?? "новичок";
    const nextPlanLabel = PLAN_CYCLE[currentLabel] ?? "новичок";
    const nextPlanId = PLAN_ID_BY_LABEL[nextPlanLabel] ?? "newcomer";

    if (!IS_TEST_MODE) {
      try {
        const result = await changeSubscription({
          userId: user.id,
          planId: nextPlanId,
          durationMonths: 1,
          reason: "ручное изменение тарифа в CRM",
        });
        setUsers((items) =>
          items.map((item) =>
            item.id === user.id
              ? {
                  ...item,
                  plan: PLAN_LABEL_BY_ID[result.planId] ?? nextPlanLabel,
                  metacoinBalance: result.balanceAfter,
                  subscriptionExpiresAt: result.expiresAt,
                  subscriptionEnds: result.expiresAt,
                }
              : item,
          ),
        );
        const details = await loadUserDetails(user.id).catch(() => null);
        if (details && selectedUserId === user.id) {
          setSelectedUserDetails(details);
          setSelectedUserDetailsStatus("ready");
        }
        appendAudit("subscription.changed", user.id, `${currentLabel} → ${nextPlanLabel}`);
        notify("тариф изменён", `${user.name}: ${nextPlanLabel}`);
        return result;
      } catch (error) {
        notify(
          "тариф не изменён",
          error instanceof Error ? error.message : "операция временно недоступна",
          "warning",
        );
        return null;
      }
    }

    setUsers((items) =>
      items.map((item) =>
        item.id === user.id ? { ...item, plan: nextPlanLabel } : item,
      ),
    );
    appendAudit("subscription.changed", user.id, `${currentLabel} → ${nextPlanLabel}`);
    notify("тариф изменён", `${user.name}: ${nextPlanLabel}`);
  }

  async function adjustMetacoins(userId, amount, reason = "admin_adjustment") {
    if (!IS_TEST_MODE) {
      try {
        const result = await adjustMetacoinBalance({
          userId,
          delta: amount,
          reason,
        });
        setUsers((items) =>
          items.map((user) =>
            user.id === userId
              ? { ...user, metacoinBalance: result.balanceAfter }
              : user,
          ),
        );
        const details = await loadUserDetails(userId).catch(() => null);
        if (details && selectedUserId === userId) {
          setSelectedUserDetails(details);
          setSelectedUserDetailsStatus("ready");
        }
        notify(
          "баланс обновлён",
          `${amount > 0 ? "+" : ""}${amount} метакоинов`,
        );
        return result;
      } catch (error) {
        notify(
          "изменение не выполнено",
          error instanceof Error ? error.message : "операция временно недоступна",
          "warning",
        );
        return null;
      }
    }

    const transaction = {
      id: `tx-admin-${Date.now()}`,
      userId,
      userName: users.find((user) => user.id === userId)?.name,
      type: amount >= 0 ? "credit" : "debit",
      amount: Math.abs(amount),
      reason,
      status: "settled",
      createdAt: new Date().toISOString(),
    };
    setUsers((items) =>
      items.map((user) =>
        user.id === userId
          ? {
              ...user,
              metacoinBalance: Math.max(0, user.metacoinBalance + amount),
            }
          : user,
      ),
    );
    setLedgerEntries((items) => [transaction, ...items]);
    appendAudit("metacoin.adjusted", userId, `${amount} metacoins`);
    notify("баланс обновлён", `${amount > 0 ? "+" : ""}${amount} метакоинов`);
    return transaction;
  }

  function refundPayment(payment) {
    if (payment.status !== "succeeded") {
      notify("возврат недоступен", "платёж не находится в статусе «прошёл»", "warning");
      return;
    }
    setPayments((items) =>
      items.map((item) =>
        item.id === payment.id ? { ...item, status: "refunded" } : item,
      ),
    );
    const metacoins = payment.metacoins ?? 0;
    if (metacoins) adjustMetacoins(payment.userId, -metacoins, "refund");
    appendAudit("payment.refunded", payment.id, "ручной возврат");
    notify("возврат зафиксирован", `${payment.amount} ${payment.currency}`);
  }

  async function probeProvider(providerId) {
    if (!IS_TEST_MODE) {
      try {
        const result = await probeProviderApi(providerId);
        setProviders((items) =>
          items.map((provider) =>
            provider.id === providerId ? { ...provider, ...result } : provider,
          ),
        );
        notify(
          "проверка завершена",
          `${result.name ?? providerId}: ${result.probeStatus}`,
        );
        return result;
      } catch (error) {
        notify(
          "проверка не выполнена",
          error instanceof Error ? error.message : "провайдер временно недоступен",
          "warning",
        );
        return null;
      }
    }
    setProviders((items) =>
      items.map((provider) =>
        provider.id === providerId
          ? {
              ...provider,
              status: "operational",
              health: "healthy",
              averageLatencyMs: Math.max(
                140,
                (provider.averageLatencyMs ?? 900) - 80,
              ),
            }
          : provider,
      ),
    );
    appendAudit("provider.probed", providerId, "manual health probe");
    notify("проверка завершена", `${providerId} отвечает`);
    return true;
  }

  function toggleProvider(providerId, enabled) {
    setProviders((items) =>
      items.map((provider) =>
        provider.id === providerId ? { ...provider, enabled } : provider,
      ),
    );
    appendAudit("provider.toggled", providerId, enabled ? "enabled" : "disabled");
    notify(enabled ? "провайдер включён" : "провайдер отключён", providerId);
  }

  async function changeIncidentStatus(incidentId, status) {
    setIncidents((items) =>
      items.map((incident) =>
        incident.id === incidentId ? { ...incident, status } : incident,
      ),
    );
    appendAudit(`incident.${status}`, incidentId, "manual admin action");
    notify(
      status === "resolved" ? "инцидент закрыт" : "инцидент принят",
      incidentId,
    );
  }

  function toggleRoute(routeId, enabled) {
    setRoutes((items) =>
      items.map((route) =>
        route.id === routeId ? { ...route, enabled } : route,
      ),
    );
    appendAudit("route.toggled", routeId, enabled ? "enabled" : "disabled");
  }

  function simulateRoute() {
    const enabledRoutes = routes.filter((route) => route.enabled);
    const allHaveFallback = enabledRoutes.every((route) => route.steps.length > 1);
    notify(
      allHaveFallback ? "маршрут проверен" : "нужен резервный путь",
      `${enabledRoutes.length} правил проверено без реальных запросов`,
      allHaveFallback ? "success" : "warning",
    );
    appendAudit("routes.simulated", "routing", `${enabledRoutes.length} routes`);
  }

  async function createPromo(promo) {
    const persisted = IS_TEST_MODE
      ? [{ ...promo, id: promo.code, status: "active", redemptionCount: 0 }, ...promos]
      : await createPromoCode(promo);
    setPromos(persisted);
    appendAudit("promo.created", promo.code, "manual creation");
    notify("промокод создан");
  }

  function changePromoStatus(promoId, status) {
    setPromos((items) =>
      items.map((promo) =>
        promo.id === promoId ? { ...promo, status } : promo,
      ),
    );
    appendAudit("promo.status_changed", promoId, status);
  }

  function openRecord(kind, data) {
    setSelectedRecord({ kind, data });
    appendAudit(`${kind}.viewed`, data.id, "metadata only");
  }

  function renderPage() {
    if (activePage === "overview") {
      return (
        <OverviewPage
          metrics={overviewMetrics}
          providers={overviewProviders}
          incidents={overviewIncidents}
          onNavigate={setActivePage}
        />
      );
    }
    if (activePage === "users") {
      return (
        <UsersPage
          users={users}
          selectedUserId={selectedUserId}
          selectedUserDetails={selectedUserDetails}
          selectedUserDetailsStatus={selectedUserDetailsStatus}
          onSelectUser={(user) => setSelectedUserId(user.id)}
          onCloseUser={() => setSelectedUserId(null)}
          onToggleBlocked={toggleUserBlocked}
          onChangePlan={changeUserPlan}
          onOpenFinance={(user) => {
            setActivePage("finance");
            notify("открыты операции пользователя", user.name, "info");
          }}
          onAdjustMetacoins={adjustMetacoins}
        />
      );
    }
    if (activePage === "finance") {
      return (
        <FinancePage
          payments={payments}
          ledgerEntries={ledgerEntries}
          financeAllocations={financeAllocations}
          wallet={wallet}
          walletLedger={walletLedger}
          payouts={payouts}
          providerTopups={providerTopups}
          providerFunding={providerFunding}
          yookassaConfirmations={yookassaConfirmations}
          settings={settings}
          onSelectPayment={(payment) => openRecord("payment", payment)}
          onSelectLedgerEntry={(entry) => openRecord("ledger", entry)}
        />
      );
    }
    if (activePage === "referrals") {
      return <ReferralPartnersPage partners={referralPartners} />;
    }
    if (activePage === "generations") {
      return (
        <GenerationsPage
          generations={generations}
          onSelectGeneration={(generation) =>
            openRecord("generation", generation)
          }
        />
      );
    }
    if (activePage === "catalog") {
      return <ProductCatalogPage manifest={productCatalogManifest} />;
    }
    if (activePage === "providers") {
      return (
        <ProviderOperations
          providers={providers}
          routes={routes}
          onProbe={probeProvider}
          onToggle={IS_TEST_MODE ? toggleProvider : undefined}
        />
      );
    }
    if (activePage === "alerts") {
      return (
        <AlertsPanel
          incidents={incidents}
          onAcknowledge={(id) => changeIncidentStatus(id, "acknowledged")}
          onResolve={(id) => changeIncidentStatus(id, "resolved")}
          onProbeProvider={probeProvider}
        />
      );
    }
    if (activePage === "subscriptions") {
      return (
        <SubscriptionsPage
          users={subscriptionUsers}
          onOpenUser={(user) => {
            setSelectedUserId(user.id);
            setActivePage("users");
          }}
        />
      );
    }
    if (activePage === "promos") {
      return (
        <PromoCodesPanel
          promos={promos}
          models={productCatalogManifest.models}
          targetMarginPercent={50}
          onCreate={createPromo}
          onStatusChange={changePromoStatus}
        />
      );
    }
    if (activePage === "audit") return <AuditPage audit={audit} />;
    if (activePage === "agent" || activePage === "automation") return <SupportAgentPanel />;
    if (activePage === "settings") {
      return (
        <SettingsPage
          settings={settings}
          onToggle={(key, checked) => {
            setSettings((current) => ({ ...current, [key]: checked }));
            appendAudit("setting.changed", key, String(checked));
          }}
        />
      );
    }
    return null;
  }

  if (authStatus === "loading") {
    return (
      <main className="crm-load-state" aria-live="polite">
        <span className="eyebrow">МЕТАФЛОРА* нейро</span>
        <h1>проверяем доступ</h1>
      </main>
    );
  }

  if (authStatus === "anonymous") {
    return (
      <LoginScreen
        onRequestCode={() => requestLoginCode()}
        onVerifyCode={async (challengeId, code) => {
          await verifyLoginCode(challengeId, code);
          setDataStatus("loading");
          setAuthStatus("authenticated");
        }}
      />
    );
  }

  if (dataStatus !== "ready") {
    return (
      <main className="crm-load-state" aria-live="polite">
        <span className="eyebrow">МЕТАФЛОРА* нейро CRM</span>
        <h1>
          {dataStatus === "loading"
            ? "загружаем реальные данные"
            : "данные временно недоступны"}
        </h1>
        <p>
          {dataStatus === "loading"
            ? "проверяем соединение с Supabase"
            : "обнови страницу через минуту; демо-данные не показываем"}
        </p>
      </main>
    );
  }

  return (
    <>
      <AppShell
        activePage={activePage}
        onNavigate={setActivePage}
        period={period}
        onPeriodChange={setPeriod}
        systemHealthy={systemHealthy}
        incidentCount={incidents.filter(({ status }) => status !== "resolved").length}
        lastCheckedAt={lastCheckedAt}
      >
        {renderPage()}
      </AppShell>
      <Drawer
        open={Boolean(selectedRecord)}
        title={recordLabel(selectedRecord)}
        eyebrow="безопасные метаданные"
        onClose={() => setSelectedRecord(null)}
        footer={
          selectedRecord?.kind === "payment" ? (
            <button
              className="secondary-action"
              type="button"
              onClick={() => refundPayment(selectedRecord.data)}
            >
              оформить возврат
            </button>
          ) : null
        }
      >
        <RecordDetails record={selectedRecord} />
      </Drawer>
      <ToastStack
        items={toasts}
        onDismiss={(id) =>
          setToasts((items) => items.filter((item) => item.id !== id))
        }
      />
    </>
  );
}
