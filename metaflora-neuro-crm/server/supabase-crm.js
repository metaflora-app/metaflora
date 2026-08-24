import { getFinanceConfiguration, getProviderConfiguration } from "./provider-config.js";
import { createProviderProbeService } from "./provider-probes.js";
import { createSupabaseDiagnosticStore } from "./diagnostic-supabase-store.js";

const DEFAULT_SCHEMA = "neuro";
const DEFAULT_LIMIT = 2_000;

const TABLE_QUERIES = Object.freeze({
  users: Object.freeze({
    select:
      "id,telegram_user_id,username,first_name,last_name,is_blocked,receipt_email,first_seen_at,last_seen_at,avatar_storage_path,avatar_updated_at",
    order: "last_seen_at.desc",
  }),
  crm_subscription_overview: Object.freeze({
    select:
      "id,user_id,telegram_user_id,username,plan_id,effective_status,starts_at,ends_at,price_kopecks,metacoins_credited,subscription_metacoins_total,subscription_metacoins_remaining,metacoins_expire,paid_access_active,current_metacoin_balance,general_metacoin_balance,package_metacoin_balance,created_at,updated_at",
    order: "updated_at.desc",
  }),
  subscription_upgrade_audit: Object.freeze({
    select:
      "id,payment_id,user_id,telegram_user_id,from_plan_id,to_plan_id,duration_months,before_subscription_total,before_subscription_remaining,target_subscription_total,credited_delta,after_subscription_total,after_subscription_remaining,before_general_balance,after_general_balance,payment_amount_kopecks,occurred_at,created_at",
    order: "occurred_at.desc",
  }),
  crm_provider_funding_overview: Object.freeze({
    select:
      "allocation_key,external_payment_id,user_id,provider,allocated_kopecks,funded_kopecks,remaining_kopecks,currency,funding_status,occurred_at,updated_at",
    order: "occurred_at.desc",
  }),
  payments: Object.freeze({
    select:
      "id,user_id,payment_id,provider,product_type,product_id,amount_kopecks,amount_xtr,currency,payment_method,status,base_metacoins,bonus_metacoins,receipt_email,receipt_registration,receipt_sent_at,paid_at,created_at",
    order: "created_at.desc",
  }),
  finance_allocations: Object.freeze({
    select:
      "id,allocation_key,external_payment_id,user_id,category,provider,amount_kopecks,currency,status,source,metadata,occurred_at,created_at,updated_at",
    order: "occurred_at.desc",
  }),
  finance_wallet_ledger: Object.freeze({
    select:
      "id,entry_key,external_payment_id,allocation_key,user_id,account,category,provider,direction,amount_kopecks,currency,status,source,metadata,occurred_at,created_at,updated_at",
    order: "occurred_at.desc",
  }),
  finance_payouts: Object.freeze({
    select:
      "id,withdrawal_id,user_id,telegram_user_id,amount_kopecks,currency,payout_method,provider,external_payout_id,payout_fee_kopecks,status,payout_status,destination_hint,error_code,requested_at,processed_at,updated_at",
    order: "requested_at.desc",
  }),
  provider_topup_requests: Object.freeze({
    select:
      "id,allocation_key,provider,amount_kopecks,currency,status,external_id,error_code,attempt_count,observed_transaction_id,observed_amount_kopecks,observed_balance_kopecks,observed_at,processed_at,metadata,created_at,updated_at",
    order: "created_at.desc",
  }),
  finance_yookassa_confirmations: Object.freeze({
    select:
      "id,external_event_id,payment_id,amount_kopecks,currency,event,status,source,confirmed_at,created_at,updated_at",
    order: "confirmed_at.desc",
  }),
  telegram_stars_ledger: Object.freeze({
    select:
      "id,ledger_key,charge_id,payment_id,user_id,entry_type,xtr_delta,metadata,occurred_at,created_at",
    order: "occurred_at.desc",
  }),
  telegram_stars_receivables: Object.freeze({
    select:
      "id,charge_id,payment_id,user_id,xtr_amount,status,settlement_id,settlement_currency,settlement_amount_kopecks,settled_at,metadata,created_at,updated_at",
    order: "created_at.desc",
  }),
  metacoin_ledger: Object.freeze({
    select:
      "id,user_id,idempotency_key,delta,balance_after,source,reference_type,reference_id,description,created_at",
    order: "created_at.desc",
  }),
  generations: Object.freeze({
    select:
      "id,user_id,request_key,kind,subject_id,provider,provider_model_id,status,metacoins_quoted,metacoins_charged,provider_cost_usd,error_code,parameters,started_at,finished_at,created_at",
    order: "created_at.desc",
  }),
  provider_api_calls: Object.freeze({
    select:
      "id,request_key,generation_id,telegram_user_id,provider,operation,endpoint_host,endpoint_path,provider_request_id,http_status,status,error_code,input_tokens,output_tokens,provider_cost_usd,duration_ms,started_at,finished_at",
    order: "started_at.desc",
  }),
  product_events: Object.freeze({
    select:
      "id,event_name,category,telegram_user_id,request_key,subject_type,subject_id,occurred_at,created_at",
    order: "occurred_at.desc",
  }),
  promo_codes: Object.freeze({
    select:
      "code,reward_type,reward_value,max_uses,uses,per_user_limit,applicable_product_ids,active,starts_at,expires_at,created_by,created_at",
    order: "created_at.desc",
  }),
  promo_redemptions: Object.freeze({
    select:
      "id,promo_code,user_id,payment_id,reward_applied,status,redeemed_at",
    order: "redeemed_at.desc",
  }),
  lifecycle_notifications: Object.freeze({
    select:
      "id,notification_key,user_id,payment_id,scenario,due_at,status,attempt_count,sent_at,cancelled_at,cancellation_reason,created_at",
    order: "created_at.desc",
  }),
  system_jobs: Object.freeze({
    select:
      "id,job_key,job_type,status,attempt_count,scheduled_at,started_at,finished_at,created_at,updated_at",
    order: "created_at.desc",
  }),
  legal_consent_status: Object.freeze({
    select:
      "user_id,terms_accepted,terms_version,terms_accepted_at,personal_data_accepted,personal_data_version,personal_data_accepted_at,completed_at,updated_at",
    order: "updated_at.desc",
  }),
  referral_relations: Object.freeze({
    select: "referred_user_id,referrer_user_id,referral_code,referred_at",
    order: "referred_at.desc",
  }),
  referral_qualifying_payments: Object.freeze({
    select: "id,payment_key,referred_user_id,referrer_user_id,product_kind,product_id,gross_amount_kopecks,cash_earning_kopecks,paid_at,status,created_at",
    order: "paid_at.desc",
  }),
  referral_level_snapshots: Object.freeze({
    select: "payment_id,referrer_user_id,level_code,paid_referrals_count,cash_percent,captured_at",
    order: "captured_at.desc",
  }),
  referral_cash_earnings: Object.freeze({
    select: "id,payment_id,referrer_user_id,referred_user_id,amount_kopecks,percent,status,available_at,reversed_at,created_at,updated_at",
    order: "created_at.desc",
  }),
  referral_metacoin_bonuses: Object.freeze({
    select: "id,payment_id,beneficiary_user_id,beneficiary_role,amount_metacoins,status,applied_at,reversed_at,created_at",
    order: "created_at.desc",
  }),
  referral_payout_requests: Object.freeze({
    select: "id,withdrawal_id,user_id,amount_kopecks,payout_method,destination_hint,status,external_payout_id,payout_fee_kopecks,error_code,attempt_count,requested_at,processed_at,updated_at",
    order: "requested_at.desc",
  }),
  referral_payout_events: Object.freeze({
    select: "id,payout_request_id,from_status,to_status,external_payout_id,error_code,created_at",
    order: "created_at.desc",
  }),
  referral_partner_profiles: Object.freeze({
    select: "user_id,legal_status,inn,verification_status,payout_enabled,created_at,updated_at",
    order: "updated_at.desc",
  }),
  referral_offer_acceptances: Object.freeze({
    select: "id,user_id,offer_version,accepted_at,created_at",
    order: "accepted_at.desc",
  }),
});

const PLAN_LABELS = Object.freeze({
  newcomer: "новичок",
  novice: "новичок",
  free: "новичок",
  amateur: "любитель",
  lover: "любитель",
  creator: "автор",
  author: "автор",
  researcher: "исследователь",
  research: "исследователь",
  expert: "эксперт",
});

const OBSOLETE_PLAN_IDS = new Set(["test_140", "test_110", "final_test_130"]);

const PROVIDER_LABELS = Object.freeze({
  kie: "GPTunnel",
  kieai: "GPTunnel",
  gptunnel: "GPTunnel",
  routerai: "RouterAI",
  polza: "Polza AI",
  tbank: "Т-Банк",
  tinkoff: "Т-Банк",
  telegram_stars: "Telegram Stars",
  yookassa: "ЮKassa",
  yookassa_payouts: "ЮKassa Payouts API",
});

const RECEIPT_STATUS_LABELS = Object.freeze({
  pending: "pending",
  succeeded: "succeeded",
  canceled: "canceled",
  failed: "failed",
  unknown: "unknown",
});

const FORBIDDEN_KEYS = new Set([
  "prompt",
  "output_text",
  "content",
  "request_payload",
  "response_payload",
  "provider_payload",
]);

export class SupabaseCrmRequestError extends Error {
  constructor(message = "Supabase CRM read failed.", statusCode = null) {
    super(message);
    this.name = "SupabaseCrmRequestError";
    this.statusCode = statusCode;
  }
}

export class MetacoinAdjustmentError extends Error {
  constructor(code = "adjustment_failed") {
    const messages = {
      insufficient_balance: "На балансе недостаточно метакоинов.",
      idempotency_conflict: "Ключ операции уже использован с другими параметрами.",
      user_not_found: "Пользователь не найден.",
      adjustment_failed: "Не удалось изменить баланс метакоинов.",
    };
    super(messages[code] ?? messages.adjustment_failed);
    this.name = "MetacoinAdjustmentError";
    this.code = Object.hasOwn(messages, code) ? code : "adjustment_failed";
  }
}

export class MetacoinAdjustmentMigrationRequiredError extends Error {
  constructor() {
    super("Атомарная корректировка баланса ещё не подключена.");
    this.name = "MetacoinAdjustmentMigrationRequiredError";
    this.code = "migration_required";
  }
}

export class SubscriptionChangeError extends Error {
  constructor(code = "subscription_change_failed") {
    const messages = {
      idempotency_conflict: "Ключ изменения тарифа уже использован с другими параметрами.",
      user_not_found: "Пользователь не найден.",
      subscription_change_failed: "Не удалось изменить тариф.",
    };
    super(messages[code] ?? messages.subscription_change_failed);
    this.name = "SubscriptionChangeError";
    this.code = Object.hasOwn(messages, code) ? code : "subscription_change_failed";
  }
}

function required(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} is required.`);
  }
  return value.trim();
}

function validateUrl(value) {
  let url;
  try {
    url = new URL(required(value, "SUPABASE_URL"));
  } catch {
    throw new TypeError("SUPABASE_URL must be a valid HTTPS URL.");
  }
  if (url.protocol !== "https:") {
    throw new TypeError("SUPABASE_URL must be a valid HTTPS URL.");
  }
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function validateAdjustmentCommand(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("adjustment command is required.");
  }
  const userId = String(value.userId ?? "").toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(userId)) {
    throw new TypeError("userId must be a UUID.");
  }
  const direction = String(value.direction ?? "");
  if (!["credit", "debit"].includes(direction)) {
    throw new TypeError("direction must be credit or debit.");
  }
  const amount = Number(value.amount);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 2_147_483_647) {
    throw new TypeError("amount must be a positive integer.");
  }
  const reason = String(value.reason ?? "").trim();
  if (reason.length < 3 || reason.length > 500) {
    throw new TypeError("reason must contain between 3 and 500 characters.");
  }
  const idempotencyKey = String(value.idempotencyKey ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/.test(idempotencyKey)) {
    throw new TypeError("idempotencyKey has an invalid format.");
  }
  const actor = String(value.actor ?? "").trim();
  if (actor.length < 1 || actor.length > 100) {
    throw new TypeError("actor has an invalid format.");
  }
  return Object.freeze({ userId, direction, amount, reason, idempotencyKey, actor });
}

function validateSubscriptionCommand(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("subscription command is required.");
  }
  const userId = validateUserId(value.userId);
  const planId = String(value.planId ?? "").trim().toLowerCase();
  if (!["newcomer", "amateur", "author", "researcher", "expert"].includes(planId)) {
    throw new TypeError("planId is invalid.");
  }
  const durationMonths = Number(value.durationMonths ?? 1);
  if (!Number.isInteger(durationMonths) || ![1, 3].includes(durationMonths)) {
    throw new TypeError("durationMonths must be 1 or 3.");
  }
  const reason = String(value.reason ?? "").trim();
  if (reason.length < 3 || reason.length > 500) {
    throw new TypeError("reason must contain between 3 and 500 characters.");
  }
  const idempotencyKey = String(value.idempotencyKey ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/.test(idempotencyKey)) {
    throw new TypeError("idempotencyKey has an invalid format.");
  }
  const actor = String(value.actor ?? "").trim();
  if (actor.length < 1 || actor.length > 100) {
    throw new TypeError("actor has an invalid format.");
  }
  return Object.freeze({ userId, planId, durationMonths, reason, idempotencyKey, actor });
}

function validateUserId(value) {
  const userId = String(value ?? "").toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(userId)) {
    throw new TypeError("userId must be a UUID.");
  }
  return userId;
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function timestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function displayName(user) {
  const fullName = [user.first_name, user.last_name]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return fullName || (user.username ? `@${user.username}` : `Telegram ${user.telegram_user_id}`);
}

function providerName(value) {
  const normalized = String(value ?? "").trim();
  return PROVIDER_LABELS[normalized.toLowerCase()] ?? (normalized || "неизвестный провайдер");
}

function paymentMethod(value, row = {}) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["card", "sbp", "telegram_stars", "unknown"].includes(normalized)) {
    return normalized;
  }
  if (String(row.currency ?? "").toUpperCase() === "XTR") return "telegram_stars";
  if (String(row.provider ?? "").trim().toLowerCase() === "telegram_stars") {
    return "telegram_stars";
  }
  return "unknown";
}

function receiptStatus(value) {
  const normalized = String(value ?? "unknown").trim().toLowerCase();
  return Object.hasOwn(RECEIPT_STATUS_LABELS, normalized) ? normalized : "unknown";
}

const PROVIDER_ALERTS = Object.freeze({
  provider_auth_unverified: Object.freeze({
    severity: "warning",
    label: "доступность API проверена, ключ — нет",
  }),
  provider_auth_failed: Object.freeze({
    severity: "critical",
    label: "ключ API отклонён",
  }),
  provider_insufficient_credits: Object.freeze({
    severity: "critical",
    label: "недостаточно средств",
  }),
  provider_rate_limited: Object.freeze({
    severity: "warning",
    label: "лимит запросов",
  }),
  provider_timeout: Object.freeze({
    severity: "warning",
    label: "таймаут",
  }),
  provider_5xx: Object.freeze({
    severity: "warning",
    label: "ошибка провайдера",
  }),
  provider_invalid_response: Object.freeze({
    severity: "critical",
    label: "API вернул неожиданный ответ",
  }),
});

function providerAlertCode(call) {
  const status = Number(call?.http_status);
  const errorCode = String(call?.error_code ?? call?.status ?? "").toLowerCase();
  if (
    status === 401 ||
    status === 403 ||
    /(auth|unauthor|forbidden|invalid[_ -]?key)/.test(errorCode)
  ) {
    return "provider_auth_failed";
  }
  if (
    status === 402 ||
    /(insufficient|credit|balance|payment[_ -]?required)/.test(errorCode)
  ) {
    return "provider_insufficient_credits";
  }
  if (status === 429 || /(rate[_ -]?limit|too[_ -]?many)/.test(errorCode)) {
    return "provider_rate_limited";
  }
  if (call?.status === "timeout" || /timeout/.test(errorCode)) {
    return "provider_timeout";
  }
  if (status >= 500 && status < 600) return "provider_5xx";
  return null;
}

function safeProviderDiagnosticCode(value) {
  const code = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_.-]{0,63}$/.test(code) ? code : null;
}

function providerCallRetryable(call, diagnosticCode) {
  if (call?.status === "timeout") return true;
  const status = Number(call?.http_status);
  if ([408, 425, 429, 500, 502, 503, 504].includes(status)) return true;
  return /(?:timeout|temporar|unavailable|rate[_ -]?limit|too[_ -]?many|5xx)/.test(
    String(diagnosticCode ?? "").toLowerCase(),
  );
}

function safeProviderAlerts(providerId, probe, providerCalls) {
  const alerts = new Map();
  for (const alert of Array.isArray(probe?.alerts) ? probe.alerts : []) {
    const code = String(alert?.code ?? "");
    const definition = PROVIDER_ALERTS[code] ?? {
      severity: alert?.severity === "critical" ? "critical" : "warning",
      label: String(alert?.label ?? code).slice(0, 120),
    };
    if (!code) continue;
    alerts.set(
      code,
      Object.freeze({
        id: `${providerId}:${code}`,
        code,
        severity: definition.severity,
        label: definition.label,
      }),
    );
  }
  const latestCall = providerCalls[0];
  for (const call of latestCall ? [latestCall] : []) {
    const code = providerAlertCode(call);
    const definition = PROVIDER_ALERTS[code];
    if (!definition || alerts.has(code)) continue;
    alerts.set(
      code,
      Object.freeze({
        id: `${providerId}:${code}`,
        code,
        severity: definition.severity,
        label: definition.label,
      }),
    );
  }
  return Object.freeze([...alerts.values()]);
}

function safeProviderBalance(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const available = Number(value.available);
  const used =
    value.used === null || value.used === undefined ? null : Number(value.used);
  const limit =
    value.limit === null || value.limit === undefined ? null : Number(value.limit);
  const unit = String(value.unit ?? "").slice(0, 32);
  if (
    !Number.isFinite(available) ||
    (used !== null && !Number.isFinite(used)) ||
    (limit !== null && !Number.isFinite(limit)) ||
    !unit
  ) {
    return null;
  }
  return Object.freeze({ available, used, limit, unit });
}

function planName(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (OBSOLETE_PLAN_IDS.has(normalized)) return "архивный тариф";
  return PLAN_LABELS[normalized] ?? (normalized || "новичок");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function assertSafeProjection(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new SupabaseCrmRequestError("Unsafe Supabase projection was blocked.");
    }
    assertSafeProjection(child);
  }
}

function latestByUser(rows, dateFields = ["created_at", "updated_at", "expires_at"]) {
  const result = new Map();
  for (const row of rows) {
    const current = result.get(row.user_id);
    const rowTime = Math.max(
      ...dateFields.map((field) => new Date(row[field] ?? 0).valueOf() || 0),
    );
    const currentTime = current
      ? Math.max(
          ...dateFields.map((field) => new Date(current[field] ?? 0).valueOf() || 0),
        )
      : -1;
    if (!current || rowTime > currentTime) result.set(row.user_id, row);
  }
  return result;
}

function groupBy(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const groupKey = row[key];
    const group = result.get(groupKey) ?? [];
    result.set(groupKey, [...group, row]);
  }
  return result;
}

function nearestRank(values, percentile) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * percentile) - 1);
  return sorted[index];
}

function countBreakdown(values) {
  const counts = new Map();
  for (const value of values) {
    const id = String(value ?? "").trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => Object.freeze({ id, label: id, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function successBreakdown(calls, field) {
  const groups = groupBy(calls, field);
  return [...groups.entries()]
    .filter(([id]) => String(id ?? "").trim())
    .map(([id, groupedCalls]) => {
      const completed = groupedCalls.filter(({ status }) => status !== "running");
      const succeeded = completed.filter(({ status }) => status === "succeeded").length;
      return Object.freeze({
        id: String(id),
        label: String(id),
        calls: groupedCalls.length,
        successRate: completed.length
          ? Number(((succeeded / completed.length) * 100).toFixed(1))
          : null,
      });
    })
    .sort((left, right) => right.calls - left.calls || left.label.localeCompare(right.label));
}

function createProviderTimeline(calls) {
  const dated = calls.filter(({ started_at: startedAt }) => timestamp(startedAt));
  const byDate = groupBy(
    dated.map((call) => ({
      ...call,
      day: timestamp(call.started_at).slice(0, 10),
    })),
    "day",
  );
  return [...byDate.entries()]
    .map(([date, dayCalls]) => {
      const completed = dayCalls.filter(({ status }) => status !== "running");
      const succeeded = completed.filter(({ status }) => status === "succeeded").length;
      const failed = completed.filter(({ status }) =>
        ["failed", "timeout"].includes(status),
      ).length;
      const durations = dayCalls
        .map(({ duration_ms: duration }) => finiteNumber(duration, -1))
        .filter((duration) => duration >= 0);
      const knownCosts = dayCalls
        .map(({ provider_cost_usd: cost }) => (cost === null || cost === undefined ? null : Number(cost)))
        .filter(Number.isFinite);
      return Object.freeze({
        date,
        calls: dayCalls.length,
        succeeded,
        failed,
        successRate: completed.length
          ? Number(((succeeded / completed.length) * 100).toFixed(1))
          : null,
        costUsd: knownCosts.length
          ? Number(knownCosts.reduce((sum, cost) => sum + cost, 0).toFixed(6))
          : null,
        averageLatencyMs: durations.length
          ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
          : null,
        p95LatencyMs: nearestRank(durations, 0.95),
      });
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

function createFallbackStats(calls) {
  const stats = new Map();
  const initialize = (provider) => {
    const current = stats.get(provider);
    if (current) return current;
    const created = { received: 0, recovered: 0, handedOff: 0 };
    stats.set(provider, created);
    return created;
  };
  const sequences = groupBy(
    calls.filter(({ generation_id: generationId }) => generationId),
    "generation_id",
  );
  for (const sequence of sequences.values()) {
    const ordered = [...sequence].sort(
      (left, right) => new Date(left.started_at ?? 0) - new Date(right.started_at ?? 0),
    );
    ordered.forEach((call, index) => {
      const providerStats = initialize(call.provider);
      const previous = ordered.slice(0, index);
      const later = ordered.slice(index + 1);
      if (index > 0) providerStats.received += 1;
      if (
        call.status === "succeeded" &&
        previous.some(({ status }) => ["failed", "timeout"].includes(status))
      ) {
        providerStats.recovered += 1;
      }
      if (
        ["failed", "timeout"].includes(call.status) &&
        later.some(({ provider }) => provider !== call.provider)
      ) {
        providerStats.handedOff += 1;
      }
    });
  }
  return stats;
}

function createUserProjection(rows) {
  const {
    users,
    crm_subscription_overview: subscriptionOverview,
    payments,
    metacoin_ledger: ledger,
    generations,
    legal_consent_status: legalConsent,
  } = rows;
  const activeSubscriptions = latestByUser(
    subscriptionOverview.filter(
      ({ paid_access_active: paidAccessActive }) => paidAccessActive === true,
    ),
    ["ends_at", "updated_at", "created_at"],
  );
  const latestBalances = latestByUser(ledger, ["created_at"]);
  const latestPayments = latestByUser(payments, ["created_at"]);
  const paymentsByUser = groupBy(
    payments.filter(({ status }) => status === "succeeded"),
    "user_id",
  );
  const ledgerByUser = groupBy(ledger, "user_id");
  const generationsByUser = groupBy(generations, "user_id");
  const legalByUser = latestByUser(legalConsent, ["updated_at"]);

  return users.map((user) => {
    const name = displayName(user);
    const subscription = activeSubscriptions.get(user.id);
    const userPayments = paymentsByUser.get(user.id) ?? [];
    const userLedger = ledgerByUser.get(user.id) ?? [];
    const consent = legalByUser.get(user.id);
    const latestPayment = latestPayments.get(user.id);
    const spent = userLedger
      .filter(({ delta }) => finiteNumber(delta) < 0)
      .reduce((sum, { delta }) => sum + Math.abs(finiteNumber(delta)), 0);
    const totalPaidRub =
      userPayments.reduce((sum, { amount_kopecks: amount }) => sum + finiteNumber(amount), 0) /
      100;
    const subscriptionMetacoinsTotal = finiteNumber(
      subscription?.subscription_metacoins_total ?? subscription?.metacoins_credited,
    );
    const subscriptionMetacoinsRemaining = finiteNumber(
      subscription?.subscription_metacoins_remaining ?? subscriptionMetacoinsTotal,
    );
    const generalMetacoinBalance = finiteNumber(
      subscription?.general_metacoin_balance
        ?? subscription?.current_metacoin_balance
        ?? latestBalances.get(user.id)?.balance_after,
    );
    const packageMetacoinBalance = finiteNumber(
      subscription?.package_metacoin_balance
        ?? Math.max(0, generalMetacoinBalance - subscriptionMetacoinsRemaining),
    );

    return Object.freeze({
      id: String(user.id),
      telegramUserId: String(user.telegram_user_id),
      name,
      telegramUsername: user.username ? `@${user.username}` : "",
      receiptEmail: user.receipt_email ? String(user.receipt_email) : null,
      lastReceiptStatus: receiptStatus(latestPayment?.receipt_registration),
      lastReceiptSentAt: timestamp(latestPayment?.receipt_sent_at),
      initials: name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      status: user.is_blocked ? "blocked" : "active",
      plan: planName(subscription?.plan_id),
      subscriptionStartsAt: subscription
        ? timestamp(subscription.starts_at)
        : null,
      subscriptionExpiresAt: subscription
        ? timestamp(subscription.ends_at)
        : null,
      subscriptionStatus: subscription
        ? String(subscription.effective_status)
        : "free",
      paidAccessActive: Boolean(subscription?.paid_access_active),
      registeredAt: timestamp(user.first_seen_at),
      lastSeenAt: timestamp(user.last_seen_at),
      lastActiveAt: timestamp(user.last_seen_at),
      metacoinBalance: generalMetacoinBalance,
      subscriptionMetacoinsTotal,
      subscriptionMetacoinsRemaining,
      generalMetacoinBalance,
      packageMetacoinBalance,
      totalMetacoinsSpent: spent,
      totalPaidRub,
      requestCount: (generationsByUser.get(user.id) ?? []).length,
      subscriptionEnds: subscription
        ? timestamp(subscription.ends_at)
        : "бесплатный тариф",
      legalConsentCompleted: Boolean(
        consent?.completed_at ||
          (consent?.terms_accepted && consent?.personal_data_accepted),
      ),
    });
  });
}

function financeAmount(row) {
  return String(row.currency ?? "RUB").toUpperCase() === "XTR"
    ? finiteNumber(
        row.amount_xtr ?? row.xtr_amount ?? row.xtr_delta ?? row.amount_kopecks,
      )
    : finiteNumber(row.amount_kopecks) / 100;
}

function createFinanceAllocationProjection(rows, usersById) {
  return rows.map((row) => Object.freeze({
    id: String(row.id),
    allocationKey: String(row.allocation_key),
    externalPaymentId: String(row.external_payment_id),
    userId: row.user_id ? String(row.user_id) : null,
    userName: row.user_id ? usersById.get(row.user_id)?.name ?? "неизвестный пользователь" : "общая проводка",
    category: String(row.category),
    provider: row.provider ? providerName(row.provider) : null,
    amount: financeAmount(row),
    amountKopecks: finiteNumber(row.amount_kopecks),
    currency: String(row.currency ?? "RUB"),
    status: String(row.status),
    source: String(row.source),
    occurredAt: timestamp(row.occurred_at ?? row.created_at),
    createdAt: timestamp(row.created_at),
  }));
}

function createSubscriptionUpgradeProjection(rows, usersById) {
  return rows.map((row) => Object.freeze({
    id: String(row.id),
    paymentId: String(row.payment_id),
    userId: String(row.user_id),
    userName: usersById.get(row.user_id)?.name ?? "неизвестный пользователь",
    telegramUserId: String(row.telegram_user_id),
    fromPlan: planName(row.from_plan_id),
    toPlan: planName(row.to_plan_id),
    durationMonths: finiteNumber(row.duration_months),
    beforeSubscriptionTotal: finiteNumber(row.before_subscription_total),
    beforeSubscriptionRemaining: finiteNumber(row.before_subscription_remaining),
    targetSubscriptionTotal: finiteNumber(row.target_subscription_total),
    creditedDelta: finiteNumber(row.credited_delta),
    afterSubscriptionTotal: finiteNumber(row.after_subscription_total),
    afterSubscriptionRemaining: finiteNumber(row.after_subscription_remaining),
    beforeGeneralBalance: finiteNumber(row.before_general_balance),
    afterGeneralBalance: finiteNumber(row.after_general_balance),
    paymentAmount: finiteNumber(row.payment_amount_kopecks) / 100,
    paymentAmountKopecks: finiteNumber(row.payment_amount_kopecks),
    occurredAt: timestamp(row.occurred_at),
    createdAt: timestamp(row.created_at),
  }));
}

function createProviderFundingProjection(rows, usersById) {
  return rows.map((row) => Object.freeze({
    allocationKey: String(row.allocation_key),
    externalPaymentId: String(row.external_payment_id),
    userId: row.user_id ? String(row.user_id) : null,
    userName: row.user_id
      ? usersById.get(row.user_id)?.name ?? "неизвестный пользователь"
      : "общая проводка",
    provider: providerName(row.provider),
    allocated: finiteNumber(row.allocated_kopecks) / 100,
    allocatedKopecks: finiteNumber(row.allocated_kopecks),
    funded: finiteNumber(row.funded_kopecks) / 100,
    fundedKopecks: finiteNumber(row.funded_kopecks),
    remaining: finiteNumber(row.remaining_kopecks) / 100,
    remainingKopecks: finiteNumber(row.remaining_kopecks),
    currency: String(row.currency ?? "RUB"),
    fundingStatus: String(row.funding_status ?? "not_queued"),
    occurredAt: timestamp(row.occurred_at),
    updatedAt: timestamp(row.updated_at),
  }));
}

function createFinanceByPayment(rows) {
  const grouped = groupBy(rows, "external_payment_id");
  const result = new Map();
  for (const [paymentId, allocations] of grouped.entries()) {
    const first = allocations[0];
    const summary = {
      gross: 0,
      paymentFee: 0,
      apiReserve: 0,
      referralLiability: 0,
      ownerShare: 0,
      grossMargin: 0,
      grossMarginPercent: 0,
      currency: String(first?.currency ?? "RUB"),
    };
    for (const row of allocations) {
      const amount = financeAmount(row);
      if (row.category === "gross") summary.gross += amount;
      if (row.category === "payment_fee") summary.paymentFee += amount;
      if (row.category === "api_reserve") summary.apiReserve += amount;
      if (row.category === "referral_liability") summary.referralLiability += amount;
      if (row.category === "owner_share") summary.ownerShare += amount;
    }
    summary.grossMargin = summary.gross - summary.paymentFee - summary.apiReserve;
    summary.grossMarginPercent = summary.gross > 0
      ? (summary.grossMargin / summary.gross) * 100
      : 0;
    result.set(String(paymentId), Object.freeze(summary));
  }
  return result;
}

function createPayoutProjection(rows, usersById) {
  return rows.map((row) => Object.freeze({
    id: String(row.id),
    withdrawalId: String(row.withdrawal_id),
    userId: row.user_id ? String(row.user_id) : null,
    userName: row.user_id ? usersById.get(row.user_id)?.name ?? "неизвестный пользователь" : "неизвестный пользователь",
    telegramUserId: row.telegram_user_id ? String(row.telegram_user_id) : null,
    amount: financeAmount(row),
    amountKopecks: finiteNumber(row.amount_kopecks),
    currency: String(row.currency ?? "RUB"),
    method: String(row.payout_method) === "bank_card" ? "карта РФ" : "СБП",
    provider: providerName(row.provider),
    externalPayoutId: row.external_payout_id ? String(row.external_payout_id) : null,
    payoutFee: row.payout_fee_kopecks === null || row.payout_fee_kopecks === undefined
      ? null
      : financeAmount({ amount_kopecks: row.payout_fee_kopecks, currency: row.currency }),
    status: String(row.status),
    payoutStatus: row.payout_status ? String(row.payout_status) : null,
    destinationHint: String(row.destination_hint ?? "скрыто").slice(0, 64),
    errorCode: row.error_code ? String(row.error_code).slice(0, 64) : null,
    requestedAt: timestamp(row.requested_at),
    processedAt: timestamp(row.processed_at),
    updatedAt: timestamp(row.updated_at),
  }));
}

const REFERRAL_LEVEL_LABELS = Object.freeze({
  classic: "классика",
  silver: "серебро",
  gold: "золото",
  platinum: "платина",
});

function maskInn(value) {
  const normalized = String(value ?? "").replace(/\D/gu, "");
  return normalized ? `${"•".repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}` : null;
}

function referralMethod(value) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "bank_card") return "карта РФ";
  if (normalized === "bank_account") return "расчётный счёт";
  return "СБП";
}

function maskDestinationHint(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "реквизиты скрыты";
  if (normalized.includes("•")) return normalized.slice(0, 64);
  const digits = normalized.replace(/\D/gu, "");
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7••• •••-${digits.slice(-4, -2)}-${digits.slice(-2)}`;
  }
  return digits.length >= 4 ? `••••${digits.slice(-4)}` : "реквизиты скрыты";
}

function referralProduct(kind, id) {
  const normalizedKind = String(kind ?? "покупка").replaceAll("_", " ");
  const normalizedId = String(id ?? "").replaceAll("_", " ").replace(/^package\s+/u, "");
  if (normalizedKind === "package") return `пакет ${normalizedId}`.trim();
  if (normalizedKind === "subscription") return `тариф ${normalizedId}`.trim();
  return `${normalizedKind} · ${normalizedId}`.trim();
}

function createReferralPartnerProjection(rows, usersById) {
  const relations = rows.referral_relations ?? [];
  const payments = rows.referral_qualifying_payments ?? [];
  const snapshotsByPayment = new Map((rows.referral_level_snapshots ?? []).map((row) => [row.payment_id, row]));
  const earningsByPayment = new Map((rows.referral_cash_earnings ?? []).map((row) => [row.payment_id, row]));
  const bonusesByPayment = groupBy(rows.referral_metacoin_bonuses ?? [], "payment_id");
  const profilesByUser = new Map((rows.referral_partner_profiles ?? []).map((row) => [row.user_id, row]));
  const offersByUser = latestByUser(rows.referral_offer_acceptances ?? [], ["accepted_at", "created_at"]);
  const payoutEventsByRequest = groupBy(rows.referral_payout_events ?? [], "payout_request_id");
  const payoutsByUser = groupBy(rows.referral_payout_requests ?? [], "user_id");
  const relationsByReferrer = groupBy(relations, "referrer_user_id");
  const paymentsByRelation = new Map();
  for (const payment of payments) {
    const key = `${payment.referrer_user_id}:${payment.referred_user_id}`;
    paymentsByRelation.set(key, [...(paymentsByRelation.get(key) ?? []), payment]);
  }
  const partnerIds = new Set([
    ...relations.map(({ referrer_user_id: id }) => id),
    ...payments.map(({ referrer_user_id: id }) => id),
    ...(rows.referral_partner_profiles ?? []).map(({ user_id: id }) => id),
    ...(rows.referral_offer_acceptances ?? []).map(({ user_id: id }) => id),
    ...(rows.referral_payout_requests ?? []).map(({ user_id: id }) => id),
  ].filter(Boolean));

  return [...partnerIds].map((partnerId) => {
    const user = usersById.get(partnerId);
    const partnerPayments = payments.filter(({ referrer_user_id: id }) => id === partnerId);
    const latestSnapshot = [...partnerPayments]
      .map(({ id }) => snapshotsByPayment.get(id))
      .filter(Boolean)
      .sort((left, right) => new Date(right.captured_at ?? 0) - new Date(left.captured_at ?? 0))[0];
    const profile = profilesByUser.get(partnerId);
    const offer = offersByUser.get(partnerId);
    const withdrawals = (payoutsByUser.get(partnerId) ?? []).map((row) => Object.freeze({
      id: String(row.withdrawal_id),
      amount: finiteNumber(row.amount_kopecks) / 100,
      currency: "RUB",
      method: referralMethod(row.payout_method),
      provider: "Т-Бизнес",
      externalPayoutId: row.external_payout_id ? String(row.external_payout_id).slice(0, 128) : null,
      destinationHint: maskDestinationHint(row.destination_hint),
      status: row.status === "processing" && row.error_code ? "manual_review" : String(row.status ?? "pending"),
      errorCode: row.error_code ? String(row.error_code).slice(0, 64) : null,
      attempts: Math.max(0, Math.trunc(finiteNumber(row.attempt_count))),
      requestedAt: timestamp(row.requested_at),
      processedAt: timestamp(row.processed_at),
      events: (payoutEventsByRequest.get(row.id) ?? []).map((event) => Object.freeze({
        status: String(event.to_status),
        errorCode: event.error_code ? String(event.error_code).slice(0, 64) : null,
        createdAt: timestamp(event.created_at),
      })),
    }));
    const partnerEarnings = (rows.referral_cash_earnings ?? []).filter(({ referrer_user_id: id }) => id === partnerId);
    const available = partnerEarnings.filter(({ status }) => status === "available").reduce((sum, row) => sum + finiteNumber(row.amount_kopecks), 0);
    const consumed = withdrawals.filter(({ status }) => ["pending", "processing", "manual_review", "paid"].includes(status)).reduce((sum, row) => sum + finiteNumber(row.amount) * 100, 0);
    const ready = Boolean(offer && profile?.verification_status === "verified" && profile?.payout_enabled === true);
    return Object.freeze({
      id: String(partnerId),
      userName: user?.name ?? "неизвестный пользователь",
      telegramUserId: user?.telegramUserId ?? null,
      level: REFERRAL_LEVEL_LABELS[latestSnapshot?.level_code] ?? "классика",
      percent: finiteNumber(latestSnapshot?.cash_percent, 25),
      paidReferralsCount: Math.max(0, Math.trunc(finiteNumber(latestSnapshot?.paid_referrals_count))),
      taxStatus: String(profile?.legal_status ?? "unknown"),
      profile: Object.freeze({
        innMasked: maskInn(profile?.inn),
        verificationStatus: String(profile?.verification_status ?? "not_started"),
        payoutEnabled: profile?.payout_enabled === true,
      }),
      offer: Object.freeze({
        accepted: Boolean(offer),
        version: offer?.offer_version ? String(offer.offer_version).slice(0, 80) : null,
        acceptedAt: timestamp(offer?.accepted_at),
      }),
      payoutReadiness: Object.freeze({
        ready,
        label: ready ? "готов к выплатам через Т-Бизнес" : "нужно завершить оформление выплаты",
      }),
      balances: Object.freeze({
        hold: partnerEarnings.filter(({ status }) => status === "pending").reduce((sum, row) => sum + finiteNumber(row.amount_kopecks), 0) / 100,
        available: Math.max(0, available - consumed) / 100,
        reserved: withdrawals.filter(({ status }) => ["pending", "processing", "manual_review"].includes(status)).reduce((sum, row) => sum + row.amount, 0),
        paid: withdrawals.filter(({ status }) => status === "paid").reduce((sum, row) => sum + row.amount, 0),
        currency: "RUB",
      }),
      directReferrals: (relationsByReferrer.get(partnerId) ?? []).map((relation) => Object.freeze({
        id: `${relation.referrer_user_id}:${relation.referred_user_id}`,
        userName: usersById.get(relation.referred_user_id)?.name ?? "неизвестный пользователь",
        telegramUserId: usersById.get(relation.referred_user_id)?.telegramUserId ?? null,
        boundAt: timestamp(relation.referred_at),
        payments: (paymentsByRelation.get(`${partnerId}:${relation.referred_user_id}`) ?? []).map((payment) => {
          const earning = earningsByPayment.get(payment.id);
          const snapshot = snapshotsByPayment.get(payment.id);
          return Object.freeze({
            id: String(payment.payment_key),
            product: referralProduct(payment.product_kind, payment.product_id),
            amount: finiteNumber(payment.gross_amount_kopecks) / 100,
            currency: "RUB",
            paidAt: timestamp(payment.paid_at),
            status: String(payment.status),
            cashEarning: earning ? Object.freeze({
              percent: finiteNumber(earning.percent ?? snapshot?.cash_percent),
              amount: finiteNumber(earning.amount_kopecks) / 100,
              status: String(earning.status),
              availableAt: timestamp(earning.available_at),
            }) : null,
            bonuses: (bonusesByPayment.get(payment.id) ?? []).map((bonus) => Object.freeze({
              recipient: bonus.beneficiary_role === "invitee" ? "приглашённый" : "партнёр",
              metacoins: finiteNumber(bonus.amount_metacoins),
              status: String(bonus.status),
              appliedAt: timestamp(bonus.applied_at),
            })),
          });
        }),
      })),
      withdrawals,
    });
  });
}

function createProviderTopupProjection(rows) {
  return rows.map((row) => {
    const status = String(row.status);
    const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? row.metadata
      : {};
    const confirmationStatus = metadata.confirmation_status ?? metadata.confirmationStatus;
    return Object.freeze({
      id: String(row.id),
      allocationKey: String(row.allocation_key),
      paymentId: metadata.paymentId ? String(metadata.paymentId).slice(0, 128) : null,
      provider: providerName(row.provider),
      amount: financeAmount(row),
      amountKopecks: finiteNumber(row.amount_kopecks),
      currency: String(row.currency ?? "RUB"),
      status,
      confirmationStatus: confirmationStatus === "posted" || status === "succeeded" ? "posted" : "pending",
      testOnly: metadata.testOnly === true,
      attemptCount: finiteNumber(row.attempt_count),
      externalId: row.external_id ? String(row.external_id).slice(0, 255) : null,
      observedTransactionId: row.observed_transaction_id ? String(row.observed_transaction_id).slice(0, 255) : null,
      observedAmount: row.observed_amount_kopecks === null || row.observed_amount_kopecks === undefined
        ? null
        : financeAmount({ amount_kopecks: row.observed_amount_kopecks, currency: row.currency }),
      observedBalance: row.observed_balance_kopecks === null || row.observed_balance_kopecks === undefined
        ? null
        : financeAmount({ amount_kopecks: row.observed_balance_kopecks, currency: row.currency }),
      observedAt: timestamp(row.observed_at),
      processedAt: timestamp(row.processed_at),
      errorCode: row.error_code ? String(row.error_code).slice(0, 64) : null,
      createdAt: timestamp(row.created_at),
      updatedAt: timestamp(row.updated_at),
    });
  });
}

function createYooKassaConfirmationProjection(rows) {
  return rows.map((row) => Object.freeze({
    id: String(row.id),
    eventId: String(row.external_event_id),
    paymentId: String(row.payment_id),
    amount: financeAmount(row),
    amountKopecks: finiteNumber(row.amount_kopecks),
    currency: String(row.currency ?? "RUB"),
    event: String(row.event),
    status: String(row.status),
    source: String(row.source),
    confirmedAt: timestamp(row.confirmed_at),
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  }));
}

function createWalletLedgerProjection(rows, usersById) {
  return rows.map((row) => Object.freeze({
    id: String(row.id),
    entryKey: String(row.entry_key),
    externalPaymentId: String(row.external_payment_id),
    allocationKey: row.allocation_key ? String(row.allocation_key) : null,
    userId: row.user_id ? String(row.user_id) : null,
    userName: row.user_id ? usersById.get(row.user_id)?.name ?? "неизвестный пользователь" : "общий кошелёк",
    account: String(row.account),
    category: String(row.category),
    provider: row.provider ? providerName(row.provider) : null,
    direction: String(row.direction),
    amount: financeAmount(row),
    amountKopecks: finiteNumber(row.amount_kopecks),
    currency: String(row.currency ?? "RUB"),
    status: String(row.status),
    source: String(row.source),
    occurredAt: timestamp(row.occurred_at ?? row.created_at),
    createdAt: timestamp(row.created_at),
  }));
}

function createWalletSummary(rows, payouts = [], starsReceivables = []) {
  const byCurrency = new Map();
  const blank = () => ({
    gross: 0,
    paymentFee: 0,
    apiReserve: 0,
    providerSpend: 0,
    referralLiability: 0,
    ownerShare: 0,
    starsReceivable: 0,
    payouts: 0,
  });
  for (const row of rows) {
    const currency = String(row.currency ?? "RUB").toUpperCase();
    const summary = byCurrency.get(currency) ?? blank();
    const amount = financeAmount(row);
    const signed = row.direction === "credit" ? amount : -amount;
    const nextSummary = {
      ...summary,
      gross: summary.gross + (row.account === "cash" ? signed : 0),
      paymentFee: summary.paymentFee + (row.account === "payment_fee" ? -signed : 0),
      apiReserve: summary.apiReserve + (row.account === "api_reserve" ? -signed : 0),
      providerSpend: summary.providerSpend + (row.account === "provider_spend" ? -signed : 0),
      referralLiability: summary.referralLiability + (row.account === "referral_liability" ? -signed : 0),
      ownerShare: summary.ownerShare + (row.account === "owner_share" ? -signed : 0),
      starsReceivable: summary.starsReceivable + (row.account === "stars_receivable" ? signed : 0),
    };
    byCurrency.set(currency, nextSummary);
  }
  for (const row of payouts.filter(({ status }) => ["succeeded", "submitted"].includes(status))) {
    const currency = String(row.currency ?? "RUB").toUpperCase();
    const summary = byCurrency.get(currency) ?? blank();
    byCurrency.set(currency, { ...summary, payouts: summary.payouts + financeAmount(row) });
  }
  if (starsReceivables.length > 0) {
    const xtr = byCurrency.get("XTR") ?? blank();
    const pendingStars = starsReceivables
      .filter(({ status }) => !["settled", "cancelled", "canceled"].includes(String(status)))
      .reduce((sum, row) => sum + finiteNumber(row.xtr_amount), 0);
    byCurrency.set("XTR", { ...xtr, starsReceivable: pendingStars });
  }
  const withAvailability = Object.fromEntries([...byCurrency.entries()].map(([currency, summary]) => [
    currency,
    Object.freeze({
      ...summary,
      currency,
      grossMargin: summary.gross - summary.paymentFee - summary.apiReserve,
      grossMarginPercent: summary.gross > 0
        ? ((summary.gross - summary.paymentFee - summary.apiReserve) / summary.gross) * 100
        : 0,
      availableApiReserve: Math.max(0, summary.apiReserve - summary.providerSpend),
      availableOwnerShare: Math.max(0, summary.ownerShare - summary.payouts),
      reconciled: summary.gross > 0
        ? Math.round((summary.paymentFee + summary.apiReserve + summary.referralLiability + summary.ownerShare) * 100) / 100 === Math.round(summary.gross * 100) / 100
        : true,
    }),
  ]));
  const primaryCurrency = Object.hasOwn(withAvailability, "RUB")
    ? "RUB"
    : Object.keys(withAvailability)[0] ?? "RUB";
  const primary = withAvailability[primaryCurrency] ?? {
    ...blank(),
    currency: primaryCurrency,
    availableApiReserve: 0,
    availableOwnerShare: 0,
    reconciled: true,
  };
  return Object.freeze({
    ...primary,
    reconciled: Object.values(withAvailability).every(({ reconciled }) => reconciled),
    currencies: Object.freeze(withAvailability),
  });
}

function createPaymentProjection(rows, usersById, financeByPayment = new Map()) {
  return rows.map((row) =>
    Object.freeze({
      id: String(row.id),
      paymentId: String(row.payment_id),
      userId: String(row.user_id),
      userName: usersById.get(row.user_id)?.name ?? "неизвестный пользователь",
      amount: String(row.currency ?? "RUB").toUpperCase() === "XTR"
        ? finiteNumber(row.amount_xtr ?? row.amount_kopecks)
        : finiteNumber(row.amount_kopecks) / 100,
      amountXtr: String(row.currency ?? "RUB").toUpperCase() === "XTR"
        ? finiteNumber(row.amount_xtr ?? row.amount_kopecks)
        : null,
      currency: String(row.currency ?? "RUB"),
      status: String(row.status),
      provider: providerName(row.provider),
      paymentMethod: paymentMethod(row.payment_method, row),
      productType: String(row.product_type),
      productId: String(row.product_id),
      baseMetacoins: finiteNumber(row.base_metacoins),
      bonusMetacoins: finiteNumber(row.bonus_metacoins),
      receiptEmail: row.receipt_email ? String(row.receipt_email) : null,
      receiptStatus: receiptStatus(row.receipt_registration),
      receiptSentAt: timestamp(row.receipt_sent_at),
      paidAt: timestamp(row.paid_at),
      createdAt: timestamp(row.created_at),
      finance: financeByPayment.get(String(row.payment_id)) ?? Object.freeze({
        gross: 0,
        paymentFee: 0,
        apiReserve: 0,
        referralLiability: 0,
        ownerShare: 0,
        grossMargin: 0,
        grossMarginPercent: 0,
        currency: String(row.currency ?? "RUB"),
      }),
    }),
  );
}

function createLedgerProjection(rows, usersById) {
  return rows.map((row) => {
    const delta = finiteNumber(row.delta);
    return Object.freeze({
      id: String(row.id),
      userId: String(row.user_id),
      userName: usersById.get(row.user_id)?.name ?? "неизвестный пользователь",
      type: delta > 0 ? "credit" : "debit",
      amount: Math.abs(delta),
      delta,
      balanceAfter: finiteNumber(row.balance_after),
      reason: String(row.source),
      status: "settled",
      paymentId: row.reference_type === "payment" ? row.reference_id : null,
      referenceType: row.reference_type ? String(row.reference_type) : null,
      referenceId: row.reference_id ? String(row.reference_id) : null,
      description: row.description ? String(row.description).slice(0, 500) : "",
      idempotencyKey: String(row.idempotency_key),
      createdAt: timestamp(row.created_at),
    });
  });
}

function createGenerationProjection(rows, usersById, callsByGeneration) {
  return rows.map((row) => {
    const calls = callsByGeneration.get(row.id) ?? [];
    const latestCall = calls[0];
    const duration =
      finiteNumber(latestCall?.duration_ms, -1) >= 0
        ? finiteNumber(latestCall?.duration_ms)
        : row.started_at && row.finished_at
          ? Math.max(0, new Date(row.finished_at) - new Date(row.started_at))
          : null;
    const parameters = row.parameters && typeof row.parameters === "object" && !Array.isArray(row.parameters)
      ? row.parameters
      : {};
    const media = parameters.constructor && typeof parameters.constructor === "object"
      ? parameters.constructor
      : parameters.media && typeof parameters.media === "object"
        ? parameters.media
        : parameters.mediaCounts && typeof parameters.mediaCounts === "object"
          ? { mode: "agent_attachments", references: parameters.mediaCounts }
        : {};
    const references = media.references && typeof media.references === "object"
      ? media.references
      : {};
    const safeReferences = Object.freeze({
      image: Math.max(0, Math.trunc(finiteNumber(references.image))),
      video: Math.max(0, Math.trunc(finiteNumber(references.video))),
      audio: Math.max(0, Math.trunc(finiteNumber(references.audio))),
      total: Math.max(0, Math.trunc(finiteNumber(references.total))),
    });
    return Object.freeze({
      id: String(row.id),
      userId: String(row.user_id),
      userName: usersById.get(row.user_id)?.name ?? "неизвестный пользователь",
      modality: String(row.kind),
      status: String(row.status),
      model: String(row.subject_id ?? row.provider_model_id),
      provider: providerName(row.provider),
      durationMs: duration,
      metacoinCost: finiteNumber(row.metacoins_charged),
      metacoinsQuoted: finiteNumber(row.metacoins_quoted),
      providerCostUsd: finiteNumber(row.provider_cost_usd),
      requestId: String(row.request_key),
      createdAt: timestamp(row.created_at),
      completedAt: timestamp(row.finished_at),
      errorCode: row.error_code ? String(row.error_code) : null,
      mediaMode: typeof media.mode === "string" ? media.mode.slice(0, 40) : null,
      references: safeReferences,
    });
  });
}

function createProviderProjection(
  calls,
  generations,
  providerConfiguration = [],
  providerProbes = [],
) {
  const providerGroups = groupBy(calls, "provider");
  const generationsById = new Map(
    generations.map((generation) => [generation.id, generation]),
  );
  const fallbackStats = createFallbackStats(calls);
  const probesById = new Map(
    providerProbes.map((probe) => [String(probe?.id ?? ""), probe]),
  );
  const catalog = new Map(
    providerConfiguration.map((configuration) => [
      String(configuration.id),
      configuration,
    ]),
  );

  const providers = [...catalog.entries()].map(([id, configuration]) => {
    const providerCalls = providerGroups.get(id) ?? [];
    const probe = probesById.get(id);
    const completedCalls = providerCalls.filter(({ status }) => status !== "running");
    const succeeded = completedCalls.filter(({ status }) => status === "succeeded").length;
    const failed = completedCalls.filter(({ status }) =>
      ["failed", "timeout"].includes(status),
    ).length;
    const successRate = completedCalls.length ? (succeeded / completedCalls.length) * 100 : null;
    const durations = providerCalls
      .map(({ duration_ms: duration }) => finiteNumber(duration, -1))
      .filter((duration) => duration >= 0);
    const latencyMs = durations.length
      ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
      : null;
    const p95LatencyMs = nearestRank(durations, 0.95);
    const latest = providerCalls[0];
    const observedHealth = !completedCalls.length
      ? "unknown"
      : latest?.status === "failed" || latest?.status === "timeout"
        ? successRate < 50
          ? "down"
          : "degraded"
        : successRate < 90
          ? "degraded"
          : "healthy";
    const probeHasHealth =
      probe &&
      ["ok", "failed", "reachable"].includes(String(probe.probeStatus)) &&
      ["healthy", "degraded", "down", "unknown"].includes(String(probe.health));
    const frozen = configuration.frozen === true;
    const health = frozen
      ? "frozen"
      : probeHasHealth
        ? String(probe.health)
        : observedHealth;
    const knownCosts = providerCalls
      .map(({ provider_cost_usd: cost }) =>
        cost === null || cost === undefined ? null : Number(cost),
      )
      .filter(Number.isFinite);
    const inputTokens = providerCalls
      .map(({ input_tokens: count }) =>
        count === null || count === undefined ? null : Number(count),
      )
      .filter(Number.isFinite);
    const outputTokens = providerCalls
      .map(({ output_tokens: count }) =>
        count === null || count === undefined ? null : Number(count),
      )
      .filter(Number.isFinite);
    const providerFallback = fallbackStats.get(id) ?? {
      received: 0,
      recovered: 0,
      handedOff: 0,
    };
    const modelBreakdown = countBreakdown(
      providerCalls.map(({ generation_id: generationId }) => {
        const generation = generationsById.get(generationId);
        return generation?.provider_model_id ?? generation?.subject_id;
      }),
    ).map(({ id: modelId, label, count }) =>
      Object.freeze({ id: modelId, label, calls: count }),
    );
    const errorBreakdown = countBreakdown(
      providerCalls
        .filter(({ status }) => ["failed", "timeout"].includes(status))
        .map((call) => providerAlertCode(call) ?? "provider_error"),
    );
    const balanceAllowed = configuration.balanceSupported === true;
    const balance = balanceAllowed ? safeProviderBalance(probe?.balance) : null;
    const alerts = frozen ? [] : safeProviderAlerts(id, probe, providerCalls);
    const configured = Boolean(configuration.configured);
    const priority = Number.isFinite(Number(configuration.priority))
      ? Number(configuration.priority)
      : 999;

    return {
      id: String(id),
      name: configuration.label ?? providerName(id),
      short: (configuration.label ?? providerName(id))
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 3)
        .toUpperCase(),
      capabilities: Object.freeze([...(configuration.capabilities ?? [])]),
      configured,
      frozen,
      configurationSource: String(configuration.source ?? "unknown"),
      probeStatus: String(probe?.probeStatus ?? "not-run"),
      probeCheckedAt: timestamp(probe?.checkedAt),
      probeLatencyMs: Number.isFinite(Number(probe?.probeLatencyMs))
        ? Number(probe.probeLatencyMs)
        : null,
      balance,
      balanceCapability: configuration.balanceSupported === true ? "supported" : "unsupported",
      balanceStatus: balance ? "available" : configuration.balanceSupported === true ? "unavailable" : "unsupported",
      lowBalance: Boolean(probe?.lowBalance && balance),
      topUpUrl:
        typeof configuration.topUpUrl === "string"
          ? configuration.topUpUrl
          : null,
      alerts,
      health,
      status: health,
      success: successRate === null ? null : Number(successRate.toFixed(1)),
      successRate: successRate === null ? null : Number(successRate.toFixed(1)),
      latency: latencyMs,
      latencyMs,
      averageLatencyMs: latencyMs,
      p95LatencyMs,
      enabled: !frozen && configured && health !== "down",
      priority,
      circuitStatus:
        health === "healthy" ? "closed" : health === "degraded" ? "half-open" : "open",
      lastCheckedAt:
        timestamp(probe?.checkedAt) ??
        timestamp(latest?.finished_at ?? latest?.started_at),
      totalCalls: providerCalls.length,
      completedCalls: completedCalls.length,
      successfulCalls: succeeded,
      failedCalls: failed,
      providerCostUsd: knownCosts.length
        ? Number(knownCosts.reduce((sum, cost) => sum + cost, 0).toFixed(6))
        : null,
      inputTokens: inputTokens.length
        ? inputTokens.reduce((sum, count) => sum + count, 0)
        : null,
      outputTokens: outputTokens.length
        ? outputTokens.reduce((sum, count) => sum + count, 0)
        : null,
      fallbackReceived: providerFallback.received,
      fallbackRecovered: providerFallback.recovered,
      fallbackHandedOff: providerFallback.handedOff,
      operationBreakdown: Object.freeze(successBreakdown(providerCalls, "operation")),
      modelBreakdown: Object.freeze(modelBreakdown),
      errorBreakdown: Object.freeze(errorBreakdown),
      timeline: Object.freeze(createProviderTimeline(providerCalls)),
      incidents: Object.freeze(
        providerCalls
          .filter(({ status }) => ["failed", "timeout"].includes(status))
          .slice(0, 20)
          .map((call) =>
            Object.freeze({
              id: String(call.id),
              code: providerAlertCode(call) ?? "provider_error",
              httpStatus: Number.isFinite(Number(call.http_status))
                ? Number(call.http_status)
                : null,
              startedAt: timestamp(call.started_at),
            }),
          ),
      ),
    };
  });
  return providers
    .sort((left, right) => {
      if (left.priority !== right.priority) return left.priority - right.priority;
      if (left.configured !== right.configured) return left.configured ? -1 : 1;
      return left.name.localeCompare(right.name);
    })
    .map((provider) => Object.freeze({ ...provider }));
}

function createIncidents(providerCalls, jobs, generations = []) {
  const generationsById = new Map(generations.map((generation) => [generation.id, generation]));
  const providerIncidents = providerCalls
    .filter(({ status }) => ["failed", "timeout"].includes(status))
    .map((call) => {
      const generation = call.generation_id
        ? generationsById.get(call.generation_id)
        : null;
      const safeCode = safeProviderDiagnosticCode(call.error_code)
        ?? providerAlertCode(call)
        ?? "provider_error";
      return Object.freeze({
        id: `provider:${call.id}`,
        title: `${providerName(call.provider)}: ${safeCode}`,
        summary: `безопасный код ошибки: ${safeCode}`,
        source: "provider_api_calls",
        severity: finiteNumber(call.http_status) >= 500 ? "critical" : "warning",
        status: "open",
        service: String(call.provider),
        correlationId: String(call.request_key),
        generationId: call.generation_id ? String(call.generation_id) : null,
        requestKey: call.request_key ? String(call.request_key) : null,
        provider: String(call.provider),
        providerModelId: generation?.provider_model_id
          ? String(generation.provider_model_id)
          : null,
        model: generation?.subject_id ? String(generation.subject_id) : null,
        operation: call.operation ? String(call.operation) : null,
        providerRequestId: call.provider_request_id
          ? String(call.provider_request_id)
          : null,
        errorCode: safeCode,
        httpStatus: Number.isFinite(Number(call.http_status))
          ? Number(call.http_status)
          : null,
        retryable: providerCallRetryable(call, safeCode),
        startedAt: timestamp(call.started_at),
        time: timestamp(call.started_at),
      });
    });
  const jobIncidents = jobs
    .filter(({ status }) => status === "failed")
    .map((job) =>
      Object.freeze({
        id: `job:${job.id}`,
        title: `${job.job_type}: задача завершилась ошибкой`,
        summary: "системная задача завершилась ошибкой; подробности доступны только в серверном журнале",
        source: "system_jobs",
        severity: "warning",
        status: "open",
        service: String(job.job_type),
        correlationId: String(job.job_key),
        startedAt: timestamp(job.started_at ?? job.created_at),
        time: timestamp(job.started_at ?? job.created_at),
      }),
    );
  return [...providerIncidents, ...jobIncidents];
}

function createPromoProjection(codes, redemptions, now) {
  const redemptionCounts = new Map();
  for (const redemption of redemptions) {
    if (redemption.status !== "applied") continue;
    redemptionCounts.set(
      redemption.promo_code,
      (redemptionCounts.get(redemption.promo_code) ?? 0) + 1,
    );
  }
  return codes.map((code) => {
    const redemptionCount = redemptionCounts.get(code.code) ?? finiteNumber(code.uses);
    const expired = code.expires_at && new Date(code.expires_at) <= new Date(now);
    const exhausted = redemptionCount >= finiteNumber(code.max_uses);
    const scheduled = code.starts_at && new Date(code.starts_at) > new Date(now);
    const status = !code.active
      ? "paused"
      : expired
        ? "expired"
        : exhausted
          ? "exhausted"
          : scheduled
            ? "scheduled"
            : "active";
    return Object.freeze({
      id: String(code.code),
      code: String(code.code),
      status,
      discountType:
        code.reward_type === "discount_percent"
          ? "percent"
          : code.reward_type === "metacoins"
            ? "metacoins"
            : String(code.reward_type),
      discountValue: finiteNumber(code.reward_value),
      rewardType: String(code.reward_type),
      rewardValue: finiteNumber(code.reward_value),
      modelIds: Object.freeze(
        Array.isArray(code.applicable_product_ids)
          ? code.applicable_product_ids.map(String)
          : Array.isArray(code.model_ids)
            ? code.model_ids.map(String)
            : [],
      ),
      redemptionCount,
      maxRedemptions: finiteNumber(code.max_uses),
      perUserLimit: finiteNumber(code.per_user_limit, 1),
      expiresAt: timestamp(code.expires_at),
      startsAt: timestamp(code.starts_at),
      createdBy: String(code.created_by),
      createdAt: timestamp(code.created_at),
    });
  });
}

function createRoutes(calls, providers) {
  if (!calls.length) return [];
  const providersById = new Map(providers.map((provider) => [provider.id, provider]));
  const attemptGroups = new Map();

  calls.forEach((call) => {
    const correlationId = call.generation_id
      ? `generation:${call.generation_id}`
      : call.request_key
        ? `request:${call.request_key}`
        : null;
    if (!correlationId || !call.provider) return;
    const key = `${String(call.operation)}:${correlationId}`;
    const attempts = attemptGroups.get(key) ?? [];
    attemptGroups.set(key, [...attempts, call]);
  });

  return [...attemptGroups.values()]
    .map((attempts) =>
      [...attempts].sort(
        (left, right) =>
          new Date(left.started_at).getTime() - new Date(right.started_at).getTime(),
      ),
    )
    .filter(
      (attempts) =>
        new Set(attempts.map(({ provider }) => String(provider))).size > 1,
    )
    .sort(
      (left, right) =>
        new Date(right.at(-1)?.started_at).getTime() -
        new Date(left.at(-1)?.started_at).getTime(),
    )
    .slice(0, 20)
    .map((attempts) => {
      const firstAttempt = attempts[0];
      return Object.freeze({
        id: `route-${String(firstAttempt.id)}`,
        capability: String(firstAttempt.operation),
        label: `фактический fallback: ${String(firstAttempt.operation)}`,
        enabled: true,
        observedAt: timestamp(attempts.at(-1)?.started_at),
        steps: Object.freeze(
          attempts.map((attempt) => {
            const provider = providersById.get(String(attempt.provider));
            return Object.freeze({
              provider:
                provider?.name ?? providerName(String(attempt.provider)),
              model: null,
              timeout: null,
              maxCost:
                attempt.provider_cost_usd === null ||
                attempt.provider_cost_usd === undefined
                  ? null
                  : finiteNumber(attempt.provider_cost_usd),
              status:
                attempt.status === "succeeded"
                  ? "healthy"
                  : ["failed", "timeout"].includes(attempt.status)
                    ? "failed"
                    : "unknown",
              durationMs:
                attempt.duration_ms === null ||
                attempt.duration_ms === undefined
                  ? null
                  : finiteNumber(attempt.duration_ms),
            });
          }),
        ),
      });
    });
}

function createAudit(events, notifications) {
  const eventAudit = events.map((event) =>
    Object.freeze({
      id: String(event.id),
      time: timestamp(event.occurred_at),
      actor: "system",
      action: String(event.event_name),
      target: String(event.subject_id ?? event.telegram_user_id),
      reason: String(event.category),
      status: "success",
      requestKey: event.request_key ? String(event.request_key) : null,
    }),
  );
  const lifecycleAudit = notifications.map((notification) =>
    Object.freeze({
      id: `notification:${notification.id}`,
      time: timestamp(notification.sent_at ?? notification.cancelled_at ?? notification.created_at),
      actor: "automation",
      action: `lifecycle.${notification.scenario}`,
      target: String(notification.user_id),
      reason: String(notification.cancellation_reason ?? notification.status),
      status: notification.status === "cancelled" ? "failure" : "success",
      requestKey: String(notification.notification_key),
    }),
  );
  return [...eventAudit, ...lifecycleAudit].sort(
    (left, right) => new Date(right.time ?? 0) - new Date(left.time ?? 0),
  );
}

function createWorkflow(jobs) {
  const latest = jobs[0];
  return Object.freeze({
    diagnosis: Object.freeze({ status: latest?.status ?? "idle" }),
    dryRun: Object.freeze({ status: "idle" }),
    approval: Object.freeze({ status: "idle", phrase: "ПОДТВЕРЖДАЮ" }),
    verification: Object.freeze({ status: "idle" }),
  });
}

export class SupabaseCrmReadAdapter {
  #serviceRoleKey;
  #fetch;
  #baseUrl;
  #now;
  #providerConfiguration;
  #providerProbeService;
  #financeConfiguration;

  constructor({
    supabaseUrl,
    serviceRoleKey,
    schema = DEFAULT_SCHEMA,
    fetchImpl = globalThis.fetch,
    maxRows = DEFAULT_LIMIT,
    now = () => new Date().toISOString(),
    providerConfiguration = getProviderConfiguration({}),
    financeConfiguration = getFinanceConfiguration({}),
    providerProbeService = null,
  }) {
    this.#baseUrl = validateUrl(supabaseUrl);
    this.#serviceRoleKey = required(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
    if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required.");
    if (!Number.isSafeInteger(maxRows) || maxRows < 1 || maxRows > 10_000) {
      throw new TypeError("maxRows must be an integer between 1 and 10000.");
    }
    if (typeof now !== "function") throw new TypeError("now must be a function.");
    if (!Array.isArray(providerConfiguration)) {
      throw new TypeError("providerConfiguration must be an array.");
    }
    if (!financeConfiguration || typeof financeConfiguration !== "object" || Array.isArray(financeConfiguration)) {
      throw new TypeError("financeConfiguration must be an object.");
    }
    if (
      providerProbeService !== null &&
      typeof providerProbeService?.probeAll !== "function"
    ) {
      throw new TypeError("providerProbeService must implement probeAll.");
    }
    this.#fetch = fetchImpl;
    this.#now = now;
    this.#providerConfiguration = providerConfiguration.map((configuration) =>
      Object.freeze({
        id: String(configuration.id),
        label: String(configuration.label ?? providerName(configuration.id)),
        capabilities: Object.freeze([...(configuration.capabilities ?? [])]),
        configured: Boolean(configuration.configured),
        frozen: configuration.frozen === true,
        source: String(configuration.source ?? "unknown"),
        priority: Number.isFinite(Number(configuration.priority))
          ? Number(configuration.priority)
          : 999,
        topUpUrl:
          typeof configuration.topUpUrl === "string"
            ? configuration.topUpUrl
            : null,
        probeSupported: Boolean(configuration.probeSupported),
        balanceSupported: Boolean(configuration.balanceSupported),
      }),
    );
    this.#providerProbeService = providerProbeService;
    this.#financeConfiguration = financeConfiguration;
    this.schema = required(schema, "SUPABASE_HISTORY_SCHEMA");
    this.maxRows = maxRows;
  }

  async #readTable(table, filters = {}) {
    const query = TABLE_QUERIES[table];
    if (!query) throw new TypeError("Unsupported Supabase table.");
    const url = new URL(`/rest/v1/${table}`, this.#baseUrl);
    url.searchParams.set("select", query.select);
    url.searchParams.set("order", query.order);
    url.searchParams.set("limit", String(this.maxRows));
    for (const [field, value] of Object.entries(filters)) {
      if (!["id", "user_id", "telegram_user_id"].includes(field)) {
        throw new TypeError("Unsupported Supabase filter.");
      }
      url.searchParams.set(field, `eq.${value}`);
    }

    let response;
    try {
      response = await this.#fetch(url, {
        method: "GET",
        headers: {
          apikey: this.#serviceRoleKey,
          Authorization: `Bearer ${this.#serviceRoleKey}`,
          "Accept-Profile": this.schema,
          Accept: "application/json",
        },
      });
    } catch {
      throw new SupabaseCrmRequestError("Supabase CRM is temporarily unavailable.");
    }

    if (!response?.ok) {
      throw new SupabaseCrmRequestError(
        "Supabase CRM read failed.",
        Number.isInteger(response?.status) ? response.status : null,
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new SupabaseCrmRequestError("Supabase CRM returned an invalid response.");
    }
    if (!Array.isArray(data)) {
      throw new SupabaseCrmRequestError("Supabase CRM returned an invalid response.");
    }
    return data;
  }

  async #readOptionalTable(table, filters = {}) {
    try {
      return await this.#readTable(table, filters);
    } catch (error) {
      if (error instanceof SupabaseCrmRequestError && error.statusCode === 404) return [];
      throw error;
    }
  }

  async #signAvatarPath(storagePath) {
    const cleanPath = String(storagePath ?? "").trim();
    if (
      !/^[1-9][0-9]{0,19}\/[A-Za-z0-9_-]{1,512}\.(?:jpg|png|webp)$/.test(
        cleanPath,
      )
    ) {
      return null;
    }
    const encodedPath = cleanPath
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    const url = new URL(
      `/storage/v1/object/sign/neuro-user-avatars/${encodedPath}`,
      this.#baseUrl,
    );
    try {
      const response = await this.#fetch(url, {
        method: "POST",
        headers: {
          apikey: this.#serviceRoleKey,
          Authorization: `Bearer ${this.#serviceRoleKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 900 }),
      });
      if (!response?.ok) return null;
      const body = await response.json();
      const signedPath = String(body?.signedURL ?? body?.signedUrl ?? "").trim();
      return signedPath ? new URL(signedPath, this.#baseUrl).href : null;
    } catch {
      return null;
    }
  }

  async #enrichUsersWithAvatars(projectedUsers, rawUsers) {
    const rawById = new Map(rawUsers.map((user) => [String(user.id), user]));
    return Promise.all(
      projectedUsers.map(async (user) => {
        const avatarUrl = await this.#signAvatarPath(
          rawById.get(user.id)?.avatar_storage_path,
        );
        return Object.freeze({ ...user, avatarUrl });
      }),
    );
  }

  async probeProvider(providerIdValue) {
    const providerId = String(providerIdValue ?? "").trim().toLowerCase();
    const configuration = this.#providerConfiguration.find(
      ({ id }) => id === providerId,
    );
    if (!configuration) return null;
    if (!this.#providerProbeService) {
      throw new SupabaseCrmRequestError(
        "Provider probe service is unavailable.",
      );
    }
    const probes = await this.#providerProbeService.probeAll({ force: true });
    const probe = probes.find(({ id }) => id === providerId);
    if (!probe) return null;
    const result = {
      id: providerId,
      name: configuration.label,
      configured: configuration.configured,
      probeStatus: String(probe.probeStatus ?? "unknown"),
      health: String(probe.health ?? "unknown"),
      checkedAt: timestamp(probe.checkedAt),
      probeLatencyMs: Number.isFinite(Number(probe.probeLatencyMs))
        ? Number(probe.probeLatencyMs)
        : null,
      balance: probe.balance ?? null,
      lowBalance: Boolean(probe.lowBalance),
      alerts: Array.isArray(probe.alerts) ? probe.alerts : [],
    };
    assertSafeProjection(result);
    return deepFreeze(result);
  }

  async getUserDetails(userIdValue) {
    const userId = validateUserId(userIdValue);
    const userRows = await this.#readTable("users", { id: userId });
    const rawUser = userRows[0];
    if (!rawUser) return null;

    const telegramUserId = String(rawUser.telegram_user_id);
    const [
      subscriptionOverview,
      payments,
      ledger,
      generations,
      providerCalls,
      events,
      notifications,
      legalConsent,
      financeAllocations,
      financePayouts,
      walletLedger,
      starsReceivables,
      subscriptionUpgrades,
      providerFunding,
    ] = await Promise.all([
      this.#readTable("crm_subscription_overview", { user_id: userId }),
      this.#readTable("payments", { user_id: userId }),
      this.#readTable("metacoin_ledger", { user_id: userId }),
      this.#readTable("generations", { user_id: userId }),
      this.#readTable("provider_api_calls", { telegram_user_id: telegramUserId }),
      this.#readTable("product_events", { telegram_user_id: telegramUserId }),
      this.#readTable("lifecycle_notifications", { user_id: userId }),
      this.#readTable("legal_consent_status", { user_id: userId }),
      this.#readTable("finance_allocations", { user_id: userId }),
      this.#readTable("finance_payouts", { user_id: userId }),
      this.#readOptionalTable("finance_wallet_ledger", { user_id: userId }),
      this.#readOptionalTable("telegram_stars_receivables", { user_id: userId }),
      this.#readOptionalTable("subscription_upgrade_audit", { user_id: userId }),
      this.#readOptionalTable("crm_provider_funding_overview", { user_id: userId }),
    ]);
    const rows = {
      users: [rawUser],
      crm_subscription_overview: subscriptionOverview,
      payments,
      metacoin_ledger: ledger,
      generations,
      legal_consent_status: legalConsent,
    };
    const users = await this.#enrichUsersWithAvatars(
      createUserProjection(rows),
      [rawUser],
    );
    const usersById = new Map(users.map((user) => [user.id, user]));
    const financeByPayment = createFinanceByPayment(financeAllocations);
    const callsByGeneration = groupBy(
      providerCalls.filter(({ generation_id: generationId }) => generationId),
      "generation_id",
    );
    const result = {
      user: users[0],
      avatarUrl: users[0]?.avatarUrl ?? null,
      payments: createPaymentProjection(payments, usersById, financeByPayment),
      financeAllocations: createFinanceAllocationProjection(financeAllocations, usersById),
      payouts: createPayoutProjection(financePayouts, usersById),
      wallet: createWalletSummary(walletLedger, financePayouts, starsReceivables),
      walletLedger: createWalletLedgerProjection(walletLedger, usersById),
      providerTopups: [],
      subscriptionUpgrades: createSubscriptionUpgradeProjection(subscriptionUpgrades, usersById),
      providerFunding: createProviderFundingProjection(providerFunding, usersById),
      ledgerEntries: createLedgerProjection(ledger, usersById),
      generations: createGenerationProjection(
        generations,
        usersById,
        callsByGeneration,
      ),
      providerCalls: providerCalls.map((call) =>
        Object.freeze({
          id: String(call.id),
          requestId: String(call.request_key),
          generationId: call.generation_id ? String(call.generation_id) : null,
          provider: providerName(call.provider),
          operation: String(call.operation),
          status: String(call.status),
          httpStatus: Number.isFinite(Number(call.http_status))
            ? Number(call.http_status)
            : null,
          errorCode: call.error_code ? String(call.error_code) : null,
          durationMs: Number.isFinite(Number(call.duration_ms))
            ? Number(call.duration_ms)
            : null,
          providerCostUsd:
            call.provider_cost_usd === null ||
            call.provider_cost_usd === undefined
              ? null
              : finiteNumber(call.provider_cost_usd),
          startedAt: timestamp(call.started_at),
          finishedAt: timestamp(call.finished_at),
        }),
      ),
      audit: createAudit(events, notifications),
    };
    assertSafeProjection(result);
    return deepFreeze(result);
  }

  async getDashboardData() {
    const tableNames = Object.keys(TABLE_QUERIES);
    const values = await Promise.all(tableNames.map((table) => (
      [
        "finance_wallet_ledger",
        "finance_yookassa_confirmations",
        "telegram_stars_ledger",
        "telegram_stars_receivables",
        "subscription_upgrade_audit",
        "crm_provider_funding_overview",
        "referral_relations",
        "referral_qualifying_payments",
        "referral_level_snapshots",
        "referral_cash_earnings",
        "referral_metacoin_bonuses",
        "referral_payout_requests",
        "referral_payout_events",
        "referral_partner_profiles",
        "referral_offer_acceptances",
      ].includes(table)
        ? this.#readOptionalTable(table)
        : this.#readTable(table)
    )));
    const rows = Object.fromEntries(tableNames.map((table, index) => [table, values[index]]));
    const users = await this.#enrichUsersWithAvatars(
      createUserProjection(rows),
      rows.users,
    );
    const usersById = new Map(users.map((user) => [user.id, user]));
    const callsByGeneration = groupBy(
      rows.provider_api_calls.filter(({ generation_id: generationId }) => generationId),
      "generation_id",
    );
    let providerProbes = [];
    if (this.#providerProbeService) {
      try {
        providerProbes = await this.#providerProbeService.probeAll();
      } catch {
        providerProbes = [];
      }
    }
    const providers = createProviderProjection(
      rows.provider_api_calls,
      rows.generations,
      this.#providerConfiguration,
      Array.isArray(providerProbes) ? providerProbes : [],
    );
    const financeByPayment = createFinanceByPayment(rows.finance_allocations);
    const now = timestamp(this.#now()) ?? new Date().toISOString();
    const result = {
      now,
      users,
      payments: createPaymentProjection(rows.payments, usersById, financeByPayment),
      financeAllocations: createFinanceAllocationProjection(rows.finance_allocations, usersById),
      payouts: createPayoutProjection(rows.finance_payouts, usersById),
      referralPartners: createReferralPartnerProjection(rows, usersById),
      wallet: createWalletSummary(
        rows.finance_wallet_ledger,
        rows.finance_payouts,
        rows.telegram_stars_receivables,
      ),
      walletLedger: createWalletLedgerProjection(rows.finance_wallet_ledger, usersById),
      providerTopups: createProviderTopupProjection(rows.provider_topup_requests),
      subscriptionUpgrades: createSubscriptionUpgradeProjection(rows.subscription_upgrade_audit, usersById),
      providerFunding: createProviderFundingProjection(rows.crm_provider_funding_overview, usersById),
      yookassaConfirmations: createYooKassaConfirmationProjection(rows.finance_yookassa_confirmations),
      ledgerEntries: createLedgerProjection(rows.metacoin_ledger, usersById),
      generations: createGenerationProjection(rows.generations, usersById, callsByGeneration),
      providers,
      routes: createRoutes(rows.provider_api_calls, providers),
      incidents: createIncidents(rows.provider_api_calls, rows.system_jobs, rows.generations),
      promos: createPromoProjection(rows.promo_codes, rows.promo_redemptions, now),
      audit: createAudit(rows.product_events, rows.lifecycle_notifications),
      workflow: createWorkflow(rows.system_jobs),
      settings: Object.freeze({
        dataSource: "supabase",
        schema: this.schema,
        readOnly: true,
        sensitiveFieldsRedacted: true,
        finance: this.#financeConfiguration,
      }),
    };
    assertSafeProjection(result);
    return deepFreeze(result);
  }

  async adjustMetacoins(command) {
    const value = validateAdjustmentCommand(command);
    const delta = value.direction === "credit" ? value.amount : -value.amount;
    const url = new URL("/rest/v1/rpc/crm_adjust_metacoins", this.#baseUrl);
    let response;
    try {
      response = await this.#fetch(url, {
        method: "POST",
        headers: {
          apikey: this.#serviceRoleKey,
          Authorization: `Bearer ${this.#serviceRoleKey}`,
          "Accept-Profile": this.schema,
          "Content-Profile": this.schema,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_user_id: value.userId,
          p_delta: delta,
          p_actor_subject: value.actor,
          p_reason: value.reason,
          p_idempotency_key: value.idempotencyKey,
          p_request_id: value.idempotencyKey,
        }),
      });
    } catch {
      throw new MetacoinAdjustmentError();
    }

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      const code = String(body?.code ?? "");
      const message = String(body?.message ?? "");
      if (
        response.status === 404 &&
        (code === "PGRST202" || message.includes("crm_adjust_metacoins"))
      ) {
        throw new MetacoinAdjustmentMigrationRequiredError();
      }
      if (
        message.includes("crm_insufficient_balance") ||
        message.includes("insufficient_balance")
      ) {
        throw new MetacoinAdjustmentError("insufficient_balance");
      }
      if (
        message.includes("crm_idempotency_conflict") ||
        message.includes("idempotency payload conflicts")
      ) {
        throw new MetacoinAdjustmentError("idempotency_conflict");
      }
      if (
        message.includes("crm_user_missing") ||
        message.includes("target user does not exist")
      ) {
        throw new MetacoinAdjustmentError("user_not_found");
      }
      throw new MetacoinAdjustmentError();
    }
    const row = Array.isArray(body) ? body[0] : body;
    if (row?.error_code === "insufficient_balance" || row?.applied === false) {
      throw new MetacoinAdjustmentError(
        row?.error_code === "insufficient_balance"
          ? "insufficient_balance"
          : "adjustment_failed",
      );
    }
    if (!row?.action_id || !row?.ledger_id || row?.applied !== true) {
      throw new MetacoinAdjustmentError();
    }
    return Object.freeze({
      actionId: String(row.action_id),
      ledgerId: String(row.ledger_id),
      balanceBefore: finiteNumber(row.balance_before),
      balanceAfter: finiteNumber(row.balance_after),
      delta,
      duplicate: Boolean(row.duplicate),
    });
  }

  async createPromo(command) {
    const url = new URL("/rest/v1/promo_codes", this.#baseUrl);
    const payload = {
      code: String(command.code),
      reward_type: String(command.rewardType),
      reward_value: Number(command.rewardValue),
      applicable_product_ids: Array.isArray(command.modelIds) ? [...command.modelIds] : [],
      max_uses: Number.isSafeInteger(command.maxRedemptions) ? command.maxRedemptions : 1_000_000,
      created_by: "crm-admin",
      ...(command.expiresAt ? { expires_at: command.expiresAt } : {}),
    };
    let response;
    try {
      response = await this.#fetch(url, {
        method: "POST",
        headers: {
          apikey: this.#serviceRoleKey,
          Authorization: `Bearer ${this.#serviceRoleKey}`,
          "Accept-Profile": this.schema,
          "Content-Profile": this.schema,
          Prefer: "return=representation",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new SupabaseCrmRequestError("Promo creation is temporarily unavailable.");
    }
    const body = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(body) || !body[0]) {
      throw new SupabaseCrmRequestError("Promo creation failed.", response.status);
    }
    return deepFreeze(createPromoProjection([body[0]], [], this.#now())[0]);
  }

  async changeSubscription(command) {
    const value = validateSubscriptionCommand(command);
    const url = new URL("/rest/v1/rpc/crm_change_subscription", this.#baseUrl);
    let response;
    try {
      response = await this.#fetch(url, {
        method: "POST",
        headers: {
          apikey: this.#serviceRoleKey,
          Authorization: `Bearer ${this.#serviceRoleKey}`,
          "Accept-Profile": this.schema,
          "Content-Profile": this.schema,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_user_id: value.userId,
          p_plan_id: value.planId,
          p_duration_months: value.durationMonths,
          p_actor_subject: value.actor,
          p_reason: value.reason,
          p_idempotency_key: value.idempotencyKey,
          p_request_id: value.idempotencyKey,
        }),
      });
    } catch {
      throw new SubscriptionChangeError();
    }

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      const code = String(body?.code ?? "");
      const message = String(body?.message ?? "");
      if (message.includes("idempotency payload conflicts")) {
        throw new SubscriptionChangeError("idempotency_conflict");
      }
      if (message.includes("target user does not exist") || message.includes("subscription user does not exist")) {
        throw new SubscriptionChangeError("user_not_found");
      }
      if (response.status === 404 && (code === "PGRST202" || message.includes("crm_change_subscription"))) {
        throw new SubscriptionChangeError();
      }
      throw new SubscriptionChangeError();
    }
    const row = Array.isArray(body) ? body[0] : body;
    if (!row?.action_id || !row?.subscription_id || row?.applied !== true) {
      throw new SubscriptionChangeError();
    }
    return Object.freeze({
      actionId: String(row.action_id),
      subscriptionId: String(row.subscription_id),
      ledgerId: row.ledger_id ? String(row.ledger_id) : null,
      planId: String(row.plan_id),
      metacoins: finiteNumber(row.metacoins),
      balanceBefore: finiteNumber(row.balance_before),
      balanceAfter: finiteNumber(row.balance_after),
      startsAt: timestamp(row.starts_at),
      expiresAt: timestamp(row.expires_at),
      duplicate: Boolean(row.duplicate),
    });
  }

  async recordYooKassaPaymentConfirmation(value) {
    const url = new URL("/rest/v1/rpc/record_yookassa_payment_confirmation", this.#baseUrl);
    let response;
    try {
      response = await this.#fetch(url, {
        method: "POST",
        headers: {
          apikey: this.#serviceRoleKey,
          Authorization: `Bearer ${this.#serviceRoleKey}`,
          "Accept-Profile": this.schema,
          "Content-Profile": this.schema,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_external_event_id: value.externalEventId,
          p_payment_id: value.paymentId,
          p_amount_kopecks: value.amountKopecks,
          p_currency: value.currency,
          p_event: value.event,
          p_confirmed_at: value.confirmedAt,
          p_metadata: value.metadata ?? {},
        }),
      });
    } catch {
      throw new SupabaseCrmRequestError("Settlement gate is temporarily unavailable.");
    }
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      const error = new SupabaseCrmRequestError(
        "YooKassa confirmation was rejected.",
        Number.isInteger(response.status) ? response.status : null,
      );
      error.statusCode = response.status === 404 ? 503 : 422;
      throw error;
    }
    const row = Array.isArray(body) ? body[0] : body;
    if (!row?.confirmation_id || !row?.payment_id || row?.status !== "succeeded") {
      throw new SupabaseCrmRequestError("YooKassa confirmation returned an invalid result.");
    }
    return Object.freeze({
      confirmationId: String(row.confirmation_id),
      duplicate: Boolean(row.duplicate),
      paymentId: String(row.payment_id),
      paymentAmountKopecks: finiteNumber(row.payment_amount_kopecks),
      providerReserveKopecks: finiteNumber(row.provider_reserve_kopecks),
      topupCount: finiteNumber(row.topup_count),
      status: String(row.status),
    });
  }

  createDiagnosticStore() {
    return createSupabaseDiagnosticStore({
      supabaseUrl: this.#baseUrl,
      serviceRoleKey: this.#serviceRoleKey,
      schema: this.schema,
      fetchImpl: this.#fetch,
    });
  }

  toJSON() {
    return {
      schema: this.schema,
      maxRows: this.maxRows,
      mode: "read-only",
    };
  }
}

export function createSupabaseCrmAdapterFromEnv(env = process.env, options = {}) {
  const {
    providerFetchImpl = globalThis.fetch,
    providerProbeService = createProviderProbeService({
      env,
      fetchImpl: providerFetchImpl,
    }),
    ...adapterOptions
  } = options;
  return new SupabaseCrmReadAdapter({
    supabaseUrl: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    schema: env.SUPABASE_HISTORY_SCHEMA || DEFAULT_SCHEMA,
    providerConfiguration: getProviderConfiguration(env),
    financeConfiguration: getFinanceConfiguration(env),
    providerProbeService,
    ...adapterOptions,
  });
}
