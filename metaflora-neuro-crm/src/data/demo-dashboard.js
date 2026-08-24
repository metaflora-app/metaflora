const now = "2026-07-30T10:00:00.000Z";

function freezeDeep(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freezeDeep);
  return Object.freeze(value);
}

const users = [
  ["usr-1001", "Ирина Волкова", "@irina_ai", "active", "любитель", 740, 260, 449, "2026-07-04T09:14:00.000Z", "2026-07-30T08:42:00.000Z"],
  ["usr-1002", "Максим Орлов", "@max_orlov", "active", "эксперт", 2480, 520, 2990, "2026-06-12T13:30:00.000Z", "2026-07-29T19:05:00.000Z"],
  ["usr-1003", "Анна Ким", "@annakim_ru", "blocked", "новичок", 35, 0, 0, "2026-05-21T16:10:00.000Z", "2026-06-03T10:20:00.000Z"],
  ["usr-1004", "Дмитрий Лебедев", "@d_lebedev", "active", "новичок", 110, 40, 0, "2026-07-27T06:50:00.000Z", "2026-07-28T14:12:00.000Z"],
  ["usr-1005", "Ольга Миронова", "@olga_mir", "active", "автор", 1280, 430, 749, "2026-07-18T11:02:00.000Z", "2026-07-30T07:55:00.000Z"],
  ["usr-1006", "Сергей Шум", "@sergey_shum", "pending", "исследователь", 0, 0, 0, "2026-07-30T05:12:00.000Z", "2026-07-30T05:12:00.000Z"],
  ["usr-1007", "Марта Рэй", "@marta_ray", "active", "исследователь", 1860, 910, 1990, "2026-07-02T20:01:00.000Z", "2026-07-30T09:12:00.000Z"],
  ["usr-1008", "Павел Нестеров", "@pavel_nes", "archived", "любитель", 0, 640, 449, "2026-04-03T12:33:00.000Z", "2026-06-18T12:20:00.000Z"],
  ["usr-1009", "Алиса Хан", "@alisa_khan", "active", "новичок", 18, 82, 0, "2026-07-29T10:22:00.000Z", "2026-07-30T09:50:00.000Z"],
  ["usr-1010", "Иван Соколов", "@ivan_sokol", "active", "автор", 640, 360, 749, "2026-07-08T08:00:00.000Z", "2026-07-29T22:14:00.000Z"],
  ["usr-1011", "Никита Барс", "@nikita_bars", "pending", "новичок", 50, 0, 0, "2026-07-30T06:40:00.000Z", "2026-07-30T06:41:00.000Z"],
  ["usr-1012", "Елена Громова", "@elena_grom", "blocked", "эксперт", 320, 1180, 2990, "2026-06-24T17:05:00.000Z", "2026-07-22T18:18:00.000Z"],
].map(([id, name, telegramUsername, status, plan, metacoinBalance, totalMetacoinsSpent, totalPaidRub, registeredAt, lastSeenAt]) => ({
  id,
  name,
  email: `${telegramUsername.slice(1)}@example.ru`,
  receiptEmail: `${telegramUsername.slice(1)}@example.ru`,
  telegramUsername,
  status,
  plan,
  registeredAt,
  lastSeenAt,
  lastActiveAt: lastSeenAt,
  metacoinBalance,
  totalMetacoinsSpent,
  totalPaidRub,
  requestCount: totalMetacoinsSpent > 0 ? Math.max(1, Math.round(totalMetacoinsSpent / 12)) : 0,
  initials: name.split(" ").map((part) => part[0]).join("").slice(0, 2),
  subscriptionEnds: plan === "новичок" ? "бесплатный тариф" : "27 авг",
}));

const payments = [
  ["pay-2001", "usr-1001", 449, "succeeded", "RUB", "Т-Банк", "card"],
  ["pay-2002", "usr-1002", 2990, "succeeded", "RUB", "Т-Банк", "sbp"],
  ["pay-2003", "usr-1006", 1990, "pending", "RUB", "Т-Банк", "sbp"],
  ["pay-2004", "usr-1007", 1990, "succeeded", "RUB", "Т-Банк", "card"],
  ["pay-2005", "usr-1008", 449, "refunded", "RUB", "Т-Банк", "card"],
  ["pay-2006", "usr-1012", 2990, "failed", "RUB", "Т-Банк", "sbp"],
  ["pay-2007", "usr-1010", 749, "canceled", "RUB", "Т-Банк", "card"],
  ["pay-2008", "usr-1005", 749, "succeeded", "XTR", "Telegram Stars", "telegram_stars"],
].map(([id, userId, amount, status, currency, provider, paymentMethod], index) => {
  const user = users.find((item) => item.id === userId);
  return {
    id,
    userId,
    userName: user?.name,
    amount,
    currency,
    status,
    provider,
    paymentMethod,
    receiptEmail: paymentMethod === "telegram_stars" ? null : user?.receiptEmail || null,
    receiptStatus: paymentMethod === "telegram_stars"
      ? "unknown"
      : status === "succeeded" ? "succeeded" : status === "pending" ? "pending" : status === "canceled" || status === "failed" ? "failed" : "unknown",
    receiptSentAt: paymentMethod === "telegram_stars" || status !== "succeeded"
      ? null
      : `2026-07-${String(24 + index).padStart(2, "0")}T09:12:00.000Z`,
    environment: "test",
    idempotencyKey: `idem_${id}`,
    createdAt: `2026-07-${String(24 + index).padStart(2, "0")}T09:1${index}:00.000Z`,
  };
});

const ledgerEntries = [
  ["tx-3001", "usr-1001", "credit", 1000, "plan_purchase", "settled", "pay-2001"],
  ["tx-3002", "usr-1001", "debit", 260, "ai_usage", "settled", null],
  ["tx-3003", "usr-1002", "credit", 3000, "plan_purchase", "settled", "pay-2002"],
  ["tx-3004", "usr-1002", "debit", 520, "ai_usage", "settled", null],
  ["tx-3005", "usr-1003", "credit", 35, "welcome_bonus", "settled", null],
  ["tx-3006", "usr-1004", "credit", 150, "welcome_bonus", "settled", null],
  ["tx-3007", "usr-1004", "debit", 40, "generation", "settled", null],
  ["tx-3008", "usr-1006", "credit", 1990, "plan_purchase", "pending", "pay-2003"],
  ["tx-3009", "usr-1008", "debit", 449, "refund", "reversed", "pay-2005"],
  ["tx-3010", "usr-1010", "credit", 749, "promo", "settled", null],
].map(([id, userId, type, amount, reason, status, paymentId], index) => ({
  id,
  userId,
  userName: users.find((item) => item.id === userId)?.name,
  type,
  amount,
  reason,
  status,
  paymentId,
  idempotencyKey: `idem_${id}`,
  createdAt: `2026-07-${String(24 + index).padStart(2, "0")}T10:0${index % 10}:00.000Z`,
}));

const financeAllocations = [
  {
    id: "allocation-demo-polza",
    allocationKey: "pay-2002:api_reserve:polza",
    externalPaymentId: "pay-2002",
    userId: "usr-1002",
    userName: "Максим Орлов",
    category: "api_reserve",
    provider: "Polza",
    amount: 365,
    amountKopecks: 36_500,
    currency: "RUB",
    status: "reserved",
    source: "payment_webhook",
    occurredAt: "2026-07-25T09:12:00.000Z",
  },
  {
    id: "allocation-demo-routerai",
    allocationKey: "pay-2002:api_reserve:routerai",
    externalPaymentId: "pay-2002",
    userId: "usr-1002",
    userName: "Максим Орлов",
    category: "api_reserve",
    provider: "RouterAI",
    amount: 100,
    amountKopecks: 10_000,
    currency: "RUB",
    status: "reserved",
    source: "payment_webhook",
    occurredAt: "2026-07-25T09:12:00.000Z",
  },
];

const generations = [
  ["gen-4001", "usr-1001", "text", "completed", "GPT-5.6", "OpenRouter", 11, 1320],
  ["gen-4002", "usr-1002", "image", "completed", "Nano Banana 2", "fal.ai", 18, 4200],
  ["gen-4003", "usr-1004", "video", "failed", "Seedance 2.5", "RouterAI", 0, 0, "provider_timeout"],
  ["gen-4004", "usr-1007", "audio", "running", "ElevenLabs Voice", "ElevenLabs", 9, 640],
  ["gen-4005", "usr-1009", "text", "queued", "Nemotron 3 Ultra", "OpenRouter", 0, null],
  ["gen-4006", "usr-1010", "image", "canceled", "FLUX 2 Pro", "Replicate", 0, 180],
].map(([id, userId, modality, status, model, provider, metacoinCost, durationMs, errorCode], index) => ({
  id,
  userId,
  userName: users.find((item) => item.id === userId)?.name,
  modality,
  status,
  model,
  provider,
  durationMs,
  metacoinCost,
  requestId: `req_${id}`,
  createdAt: `2026-07-30T0${index + 3}:12:00.000Z`,
  completedAt: status === "completed" ? `2026-07-30T0${index + 3}:12:04.000Z` : null,
  errorCode,
}));

const providers = [
  ["openrouter", "OpenRouter", "OR", "healthy", 99.2, 1180, true, 1, "accent"],
  ["polza", "Polza AI", "PZ", "healthy", 97.8, 1460, true, 2, "cyan"],
  ["requesty", "Requesty", "RQ", "degraded", 91.4, 2310, true, 3, "warning"],
  ["routerai", "RouterAI", "RAI", "healthy", 96.6, 1740, true, 4, "violet"],
  ["replicate", "Replicate", "RP", "down", 72.2, 4200, false, 5, "muted"],
  ["elevenlabs", "ElevenLabs", "EL", "healthy", 98.4, 820, true, 6, "accent"],
  ["fal", "fal.ai", "FAL", "healthy", 98.9, 640, true, 7, "cyan"],
].map(([id, name, short, health, successRate, latencyMs, enabled, priority, tone]) => ({
  id,
  name,
  short,
  health,
  status: health === "healthy" ? "healthy" : health,
  success: successRate,
  successRate,
  latency: latencyMs,
  latencyMs,
  averageLatencyMs: latencyMs,
  enabled,
  priority,
  tone,
  circuitStatus: health === "down" ? "open" : health === "degraded" ? "half-open" : "closed",
}));

const providerAttempts = [
  ["req-5001", "openrouter", "success", 940],
  ["req-5002", "openrouter", "failure", 2500],
  ["req-5003", "polza", "success", 1360],
  ["req-5004", "fal", "success", 510],
  ["req-5005", "elevenlabs", "success", 760],
].map(([id, providerId, status, latencyMs], index) => ({
  id,
  providerId,
  status,
  latencyMs,
  occurredAt: `2026-07-30T08:4${index}:00.000Z`,
}));

const routes = [
  {
    id: "route-text",
    capability: "текст / код / поиск",
    label: "языковые модели",
    enabled: true,
    steps: [
      { provider: "OpenRouter", model: "GPT-5.6", timeout: 22, maxCost: 4, status: "healthy" },
      { provider: "Polza AI", model: "Claude Opus 5", timeout: 28, maxCost: 6, status: "healthy" },
      { provider: "Requesty", model: "Gemini 3.6", timeout: 30, maxCost: 5, status: "open" },
    ],
  },
  {
    id: "route-image",
    capability: "изображения",
    label: "генерация и редактирование",
    enabled: true,
    steps: [
      { provider: "fal.ai", model: "Nano Banana 2", timeout: 60, maxCost: 18, status: "healthy" },
      { provider: "Replicate", model: "FLUX 2 Pro", timeout: 70, maxCost: 22, status: "open" },
    ],
  },
  {
    id: "route-audio",
    capability: "голос и музыка",
    label: "озвучка и звук",
    enabled: true,
    steps: [
      { provider: "ElevenLabs", model: "ElevenLabs Voice", timeout: 45, maxCost: 12, status: "healthy" },
      { provider: "RouterAI", model: "Seedance 2.5", timeout: 90, maxCost: 24, status: "healthy" },
    ],
  },
];

const incidents = [
  { id: "inc-6001", title: "Replicate вернул 5xx", summary: "резервный маршрут удержал запрос без повторного списания", source: "provider_api_calls", severity: "critical", status: "open", service: "Replicate", correlationId: "corr_rep_01", startedAt: "2026-07-30T08:33:00.000Z", time: "08:33" },
  { id: "inc-6002", title: "RouterAI медленнее обычного", summary: "p95 выше лимита, circuit переведён в half-open", source: "routing_engine", severity: "warning", status: "acknowledged", service: "RouterAI", correlationId: "corr_routerai_14", startedAt: "2026-07-30T07:50:00.000Z", time: "07:50" },
  { id: "inc-6003", title: "ЮKassa webhook обработан повторно", summary: "idempotency-key сработал, повторной проводки нет", source: "payments", severity: "info", status: "resolved", service: "ЮKassa", correlationId: "corr_pay_07", startedAt: "2026-07-29T21:02:00.000Z", time: "вчера" },
];

const promos = [
  { id: "promo-7001", code: "WELCOME20", status: "active", discountType: "percent", discountValue: 20, redemptionCount: 143, maxRedemptions: 1000, expiresAt: "2026-08-31T21:00:00.000Z" },
  { id: "promo-7002", code: "FIRST100", status: "paused", discountType: "fixed", discountValue: 100, currency: "RUB", redemptionCount: 42, maxRedemptions: 300, expiresAt: null },
  { id: "promo-7003", code: "RESEARCH_TOP", status: "scheduled", discountType: "percent", discountValue: 15, redemptionCount: 0, maxRedemptions: 50, expiresAt: "2026-09-10T21:00:00.000Z" },
  { id: "promo-7004", code: "OLD_TEST", status: "expired", discountType: "percent", discountValue: 10, redemptionCount: 9, maxRedemptions: 100, expiresAt: "2026-07-01T21:00:00.000Z" },
  { id: "promo-7005", code: "DEMO_LIMIT", status: "exhausted", discountType: "fixed", discountValue: 50, currency: "RUB", redemptionCount: 20, maxRedemptions: 20, expiresAt: null },
];

const audit = [
  { id: "audit-8001", time: "08:42", actor: "admin:ИМ", action: "user.status_changed", target: "usr-1003", reason: "ручная блокировка после жалобы", status: "success" },
  { id: "audit-8002", time: "08:51", actor: "system", action: "payment.webhook_replayed", target: "pay-2001", reason: "повторный webhook, idempotency-key уже обработан", status: "success" },
  { id: "audit-8003", time: "09:02", actor: "repair-master", action: "provider.toggle", target: "replicate", reason: "попытка включения без подтверждения dry-run", status: "failure" },
];

const workflow = {
  diagnosis: { status: "idle" },
  dryRun: { status: "idle" },
  approval: { status: "idle", phrase: "ПОДТВЕРЖДАЮ" },
  verification: { status: "idle" },
};

const settings = {
  mfa: true,
  readAudit: true,
  redaction: true,
  repairApproval: true,
  liveProviderCalls: false,
  livePaymentCharges: false,
};

export const demoDashboardData = freezeDeep({
  now,
  users,
  payments,
  financeAllocations,
  ledgerEntries,
  generations,
  providers,
  providerAttempts,
  routes,
  incidents,
  promos,
  audit,
  workflow,
  settings,
});
