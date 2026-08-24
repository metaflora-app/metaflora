import assert from "node:assert/strict";
import test from "node:test";

import {
  MetacoinAdjustmentError,
  MetacoinAdjustmentMigrationRequiredError,
  SubscriptionChangeError,
  SupabaseCrmReadAdapter,
  SupabaseCrmRequestError,
  createSupabaseCrmAdapterFromEnv,
} from "./supabase-crm.js";

const NOW = "2026-07-30T10:00:00.000Z";
const ENV = Object.freeze({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "server-only-service-role-secret",
});

const TABLE_ROWS = Object.freeze({
  telegram_stars_ledger: [],
  telegram_stars_receivables: [],
  users: [
    {
      id: "user-1",
      telegram_user_id: 10001,
      username: "irina_ai",
      first_name: "Ирина",
      last_name: "Волкова",
      is_blocked: false,
      first_seen_at: "2026-07-01T10:00:00.000Z",
      last_seen_at: "2026-07-30T09:30:00.000Z",
    },
    {
      id: "user-2",
      telegram_user_id: 10002,
      username: "",
      first_name: "Максим",
      last_name: "",
      is_blocked: true,
      first_seen_at: "2026-07-02T10:00:00.000Z",
      last_seen_at: "2026-07-29T09:30:00.000Z",
    },
  ],
  crm_subscription_overview: [
    {
      id: "sub-1",
      user_id: "user-1",
      telegram_user_id: 10001,
      username: "irina_ai",
      plan_id: "researcher",
      effective_status: "active",
      starts_at: "2026-07-01T10:00:00.000Z",
      ends_at: "2026-08-01T10:00:00.000Z",
      price_kopecks: 199000,
      metacoins_credited: 2000,
      metacoins_expire: false,
      paid_access_active: true,
      current_metacoin_balance: 720,
      subscription_metacoins_total: 850,
      subscription_metacoins_remaining: 620,
      general_metacoin_balance: 720,
      package_metacoin_balance: 100,
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-01T10:01:00.000Z",
    },
  ],
  subscription_upgrade_audit: [
    {
      id: "upgrade-audit-1",
      payment_id: "pay-upgrade-1",
      user_id: "user-1",
      telegram_user_id: 10001,
      from_plan_id: "author",
      to_plan_id: "researcher",
      duration_months: 1,
      before_subscription_total: 300,
      before_subscription_remaining: 120,
      target_subscription_total: 850,
      credited_delta: 730,
      after_subscription_total: 850,
      after_subscription_remaining: 850,
      before_general_balance: 220,
      after_general_balance: 950,
      payment_amount_kopecks: 124100,
      occurred_at: "2026-07-01T10:01:00.000Z",
      created_at: "2026-07-01T10:01:00.000Z",
    },
  ],
  crm_provider_funding_overview: [
    {
      allocation_key: "pay-1:api_reserve:polza",
      external_payment_id: "pay-1",
      user_id: "user-1",
      provider: "polza",
      allocated_kopecks: 1990,
      funded_kopecks: 0,
      remaining_kopecks: 1990,
      currency: "RUB",
      funding_status: "manual",
      occurred_at: "2026-07-01T10:01:00.000Z",
      updated_at: "2026-07-01T10:01:00.000Z",
    },
  ],
  payments: [
    {
      id: "payment-row-1",
      user_id: "user-1",
      payment_id: "pay-1",
      provider: "yookassa",
      product_type: "subscription",
      product_id: "researcher",
      amount_kopecks: 199000,
      currency: "RUB",
      payment_method: "card",
      status: "succeeded",
      base_metacoins: 2000,
      bonus_metacoins: 0,
      receipt_email: "receipt@example.ru",
      receipt_registration: "succeeded",
      receipt_sent_at: "2026-07-01T10:01:01.000Z",
      paid_at: "2026-07-01T10:01:00.000Z",
      created_at: "2026-07-01T10:00:00.000Z",
    },
  ],
  finance_allocations: [
    {
      id: "allocation-1",
      allocation_key: "pay-1:api_reserve:polza",
      external_payment_id: "pay-1",
      user_id: "user-1",
      category: "api_reserve",
      provider: "polza",
      amount_kopecks: 1990,
      currency: "RUB",
      status: "reserved",
      source: "payment_webhook",
      metadata: {},
      occurred_at: "2026-07-01T10:01:00.000Z",
      created_at: "2026-07-01T10:01:00.000Z",
    },
    {
      id: "allocation-2",
      allocation_key: "pay-1:owner_share:all",
      external_payment_id: "pay-1",
      user_id: "user-1",
      category: "owner_share",
      provider: null,
      amount_kopecks: 17010,
      currency: "RUB",
      status: "reserved",
      source: "payment_webhook",
      metadata: {},
      occurred_at: "2026-07-01T10:01:00.000Z",
      created_at: "2026-07-01T10:01:00.000Z",
    },
  ],
  finance_wallet_ledger: [],
  finance_yookassa_confirmations: [],
  finance_payouts: [
    {
      id: "payout-1",
      withdrawal_id: "withdrawal-1",
      user_id: "user-1",
      telegram_user_id: 10001,
      amount_kopecks: 25000,
      currency: "RUB",
      payout_method: "sbp",
      provider: "yookassa_payouts",
      external_payout_id: "yk-payout-1",
      payout_fee_kopecks: null,
      status: "succeeded",
      payout_status: "succeeded",
      destination_hint: "+7••• •••-12-34",
      error_code: null,
      requested_at: "2026-07-02T10:00:00.000Z",
      processed_at: "2026-07-02T10:00:03.000Z",
      updated_at: "2026-07-02T10:00:03.000Z",
    },
  ],
  provider_topup_requests: [
    {
      id: "topup-1",
      allocation_key: "pay-1:api_reserve:polza",
      provider: "polza",
      amount_kopecks: 1990,
      currency: "RUB",
      status: "manual",
      external_id: null,
      error_code: null,
      created_at: "2026-07-01T10:01:00.000Z",
      updated_at: "2026-07-01T10:01:00.000Z",
    },
  ],
  metacoin_ledger: [
    {
      id: "ledger-1",
      user_id: "user-1",
      idempotency_key: "idem-ledger-1",
      delta: 2000,
      balance_after: 2000,
      source: "subscription",
      reference_type: "payment",
      reference_id: "pay-1",
      description: "тариф исследователь",
      created_at: "2026-07-01T10:01:00.000Z",
    },
    {
      id: "ledger-2",
      user_id: "user-1",
      idempotency_key: "idem-ledger-2",
      delta: -1280,
      balance_after: 720,
      source: "generation",
      reference_type: "generation",
      reference_id: "generation-1",
      description: "использование модели",
      created_at: "2026-07-30T09:00:00.000Z",
    },
  ],
  generations: [
    {
      id: "generation-1",
      user_id: "user-1",
      request_key: "request-generation-1",
      kind: "text",
      subject_id: "gpt-5.6",
      provider: "openrouter",
      provider_model_id: "openai/gpt-5.6",
      status: "completed",
      metacoins_quoted: 12,
      metacoins_charged: 12,
      provider_cost_usd: "0.020000",
      error_code: null,
      error_message: null,
      started_at: "2026-07-30T09:00:00.000Z",
      finished_at: "2026-07-30T09:00:01.250Z",
      created_at: "2026-07-30T09:00:00.000Z",
    },
  ],
  provider_api_calls: [
    {
      id: "call-1",
      request_key: "provider-call-1",
      generation_id: "generation-1",
      telegram_user_id: 10001,
      provider: "openrouter",
      operation: "chat",
      endpoint_host: "openrouter.ai",
      endpoint_path: "/api/v1/chat/completions",
      provider_request_id: "provider-request-1",
      http_status: 200,
      status: "succeeded",
      error_code: null,
      error_message: null,
      input_tokens: 100,
      output_tokens: 80,
      provider_cost_usd: "0.020000",
      duration_ms: 1250,
      started_at: "2026-07-30T09:00:00.000Z",
      finished_at: "2026-07-30T09:00:01.250Z",
    },
    {
      id: "call-2",
      request_key: "provider-call-2",
      generation_id: null,
      telegram_user_id: 10002,
      provider: "replicate",
      operation: "image",
      endpoint_host: "api.replicate.com",
      endpoint_path: "/v1/predictions",
      provider_request_id: null,
      http_status: 503,
      status: "failed",
      error_code: "provider_unavailable",
      error_message: "upstream unavailable",
      input_tokens: null,
      output_tokens: null,
      provider_cost_usd: null,
      duration_ms: 2400,
      started_at: "2026-07-30T08:00:00.000Z",
      finished_at: "2026-07-30T08:00:02.400Z",
    },
  ],
  product_events: [
    {
      id: "event-1",
      event_name: "legal.accepted",
      category: "legal",
      telegram_user_id: 10001,
      request_key: "event-request-1",
      subject_type: "legal",
      subject_id: "terms",
      occurred_at: "2026-07-30T07:00:00.000Z",
      created_at: "2026-07-30T07:00:00.000Z",
    },
  ],
  promo_codes: [
    {
      code: "WELCOME20",
      reward_type: "discount_percent",
      reward_value: 20,
      max_uses: 100,
      uses: 3,
      per_user_limit: 1,
      active: true,
      starts_at: null,
      expires_at: "2026-08-30T10:00:00.000Z",
      created_by: "admin",
      created_at: "2026-07-01T10:00:00.000Z",
    },
  ],
  promo_redemptions: [
    {
      id: "redemption-1",
      promo_code: "WELCOME20",
      user_id: "user-1",
      payment_id: "payment-row-1",
      reward_applied: 20,
      status: "applied",
      redeemed_at: "2026-07-01T10:00:00.000Z",
    },
  ],
  lifecycle_notifications: [
    {
      id: "notification-1",
      notification_key: "newcomer:10002:after24h",
      user_id: "user-2",
      payment_id: null,
      scenario: "newcomer_after_24h",
      due_at: "2026-07-31T10:00:00.000Z",
      status: "pending",
      attempt_count: 0,
      sent_at: null,
      cancelled_at: null,
      cancellation_reason: null,
      created_at: "2026-07-30T10:00:00.000Z",
    },
  ],
  system_jobs: [
    {
      id: "job-1",
      job_key: "provider-health-1",
      job_type: "provider_health",
      status: "failed",
      attempt_count: 2,
      error_message: "replicate health check failed",
      scheduled_at: "2026-07-30T08:00:00.000Z",
      started_at: "2026-07-30T08:00:00.000Z",
      finished_at: "2026-07-30T08:00:03.000Z",
      created_at: "2026-07-30T08:00:00.000Z",
      updated_at: "2026-07-30T08:00:03.000Z",
    },
  ],
  legal_consent_status: [
    {
      user_id: "user-1",
      terms_accepted: true,
      terms_version: "2026-07-27",
      terms_accepted_at: "2026-07-30T07:00:00.000Z",
      personal_data_accepted: true,
      personal_data_version: "2026-07-27",
      personal_data_accepted_at: "2026-07-30T07:01:00.000Z",
      completed_at: "2026-07-30T07:01:00.000Z",
      updated_at: "2026-07-30T07:01:00.000Z",
    },
  ],
  referral_relations: [{
    referred_user_id: "user-2",
    referrer_user_id: "user-1",
    referral_code: "ref-irina",
    referred_at: "2026-08-01T08:00:00.000Z",
  }],
  referral_qualifying_payments: [{
    id: "ref-payment-1", payment_key: "pay-ref-1", referred_user_id: "user-2", referrer_user_id: "user-1",
    product_kind: "package", product_id: "package_400", gross_amount_kopecks: 89900,
    cash_earning_kopecks: 26970, paid_at: "2026-08-02T08:00:00.000Z", status: "confirmed", created_at: "2026-08-02T08:00:00.000Z",
  }],
  referral_level_snapshots: [{
    payment_id: "ref-payment-1", referrer_user_id: "user-1", level_code: "silver", paid_referrals_count: 3,
    cash_percent: 30, captured_at: "2026-08-02T08:00:00.000Z",
  }],
  referral_cash_earnings: [{
    id: "earning-1", payment_id: "ref-payment-1", referrer_user_id: "user-1", referred_user_id: "user-2",
    amount_kopecks: 26970, percent: 30, status: "available", available_at: "2026-08-16T08:00:00.000Z",
    created_at: "2026-08-02T08:00:00.000Z", updated_at: "2026-08-16T08:00:00.000Z",
  }],
  referral_metacoin_bonuses: [
    { id: "bonus-1", payment_id: "ref-payment-1", beneficiary_user_id: "user-2", beneficiary_role: "invitee", amount_metacoins: 100, status: "applied", applied_at: "2026-08-02T08:00:01.000Z", created_at: "2026-08-02T08:00:00.000Z" },
    { id: "bonus-2", payment_id: "ref-payment-1", beneficiary_user_id: "user-1", beneficiary_role: "inviter", amount_metacoins: 100, status: "pending", applied_at: null, created_at: "2026-08-02T08:00:00.000Z" },
  ],
  referral_payout_requests: [{
    id: "ref-payout-1", withdrawal_id: "withdrawal-ref-1", user_id: "user-1", amount_kopecks: 10000,
    payout_method: "sbp", destination_hint: "+79991231234", status: "processing", external_payout_id: "tb-1",
    payout_fee_kopecks: 100, error_code: "manual_review_required", attempt_count: 1, requested_at: "2026-08-17T08:00:00.000Z",
    processed_at: null, updated_at: "2026-08-17T08:01:00.000Z",
  }],
  referral_payout_events: [{
    id: 1, payout_request_id: "ref-payout-1", from_status: "pending", to_status: "processing",
    external_payout_id: "tb-1", error_code: null, created_at: "2026-08-17T08:01:00.000Z",
  }],
  referral_partner_profiles: [{
    user_id: "user-1", legal_status: "self_employed", inn: "123456789012", full_name: "Ирина Волкова",
    verification_status: "verified", payout_enabled: true, created_at: "2026-08-14T08:00:00.000Z", updated_at: "2026-08-14T08:00:00.000Z",
  }],
  referral_offer_acceptances: [{
    id: "offer-1", user_id: "user-1", offer_version: "referral-1.0", accepted_at: "2026-08-14T08:00:00.000Z", created_at: "2026-08-14T08:00:00.000Z",
  }],
});

function tableFromUrl(rawUrl) {
  const url = new URL(rawUrl);
  return url.pathname.split("/").at(-1);
}

function createFetch(rows = TABLE_ROWS) {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    const table = tableFromUrl(url);
    return new Response(JSON.stringify(rows[table] ?? []), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return { fetchImpl, requests };
}

test("constructor requires server-only Supabase configuration", () => {
  assert.throws(
    () => new SupabaseCrmReadAdapter({ supabaseUrl: "", serviceRoleKey: "secret" }),
    /SUPABASE_URL/,
  );
  assert.throws(
    () => new SupabaseCrmReadAdapter({ supabaseUrl: ENV.SUPABASE_URL, serviceRoleKey: "" }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
});

test("environment factory configures a read-only adapter without exposing its key", () => {
  const adapter = createSupabaseCrmAdapterFromEnv(ENV);

  assert.equal(adapter.schema, "neuro");
  assert.equal(JSON.stringify(adapter).includes(ENV.SUPABASE_SERVICE_ROLE_KEY), false);
});

test("persists a promo through the server adapter without exposing credentials", async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    return new Response(JSON.stringify([{
      code: "MODELS42",
      reward_type: "discount_percent",
      reward_value: 42,
      applicable_product_ids: ["gpt_56_luna", "gpt_56_terra"],
      active: true,
    }]), { status: 201, headers: { "content-type": "application/json" } });
  };
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
    now: () => NOW,
  });

  const created = await adapter.createPromo({
    code: "MODELS42",
    rewardType: "discount_percent",
    rewardValue: 42,
    modelIds: ["gpt_56_luna", "gpt_56_terra"],
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.method, "POST");
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    code: "MODELS42",
    reward_type: "discount_percent",
    reward_value: 42,
    applicable_product_ids: ["gpt_56_luna", "gpt_56_terra"],
    max_uses: 1_000_000,
    created_by: "crm-admin",
  });
  assert.deepEqual(created.modelIds, ["gpt_56_luna", "gpt_56_terra"]);
  assert.equal(JSON.stringify(created).includes(ENV.SUPABASE_SERVICE_ROLE_KEY), false);
});

test("permanently deletes exactly one promo by its validated code", async () => {
  let captured;
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async (url, options = {}) => {
      captured = { url: String(url), options };
      return Response.json([{ code: "CINEMA15" }]);
    },
  });

  assert.deepEqual(await adapter.deletePromo("cinema15"), {
    id: "CINEMA15",
    code: "CINEMA15",
    deleted: true,
  });
  assert.equal(captured.options.method, "DELETE");
  assert.match(captured.url, /promo_codes\?code=eq\.CINEMA15$/u);
  await assert.rejects(() => adapter.deletePromo("../promo-1"), /promo code/u);
});

test("projects persisted promo model scope for the dashboard", async () => {
  const rows = {
    ...TABLE_ROWS,
    promo_codes: [{
      ...TABLE_ROWS.promo_codes[0],
      code: "MODELS42",
      reward_type: "discount_percent",
      reward_value: 42,
      applicable_product_ids: ["gpt_56_luna", "gpt_56_terra"],
    }],
  };
  const { fetchImpl } = createFetch(rows);
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
    now: () => NOW,
  });

  const dashboard = await adapter.getDashboardData();
  assert.deepEqual(dashboard.promos[0].modelIds, ["gpt_56_luna", "gpt_56_terra"]);
});

test("getDashboardData reads only the approved tables and safe columns", async () => {
  const { fetchImpl, requests } = createFetch();
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
    now: () => NOW,
  });

  await adapter.getDashboardData();

  assert.deepEqual(
    requests.map(({ url }) => tableFromUrl(url)).sort(),
    Object.keys(TABLE_ROWS).sort(),
  );
  for (const request of requests) {
    const url = new URL(request.url);
    const select = url.searchParams.get("select");
    assert.equal(request.options.method, "GET");
    assert.equal(request.options.headers.apikey, ENV.SUPABASE_SERVICE_ROLE_KEY);
    assert.equal(request.options.headers.Authorization, `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`);
    assert.equal(request.options.headers["Accept-Profile"], "neuro");
    assert.equal(request.url.includes(ENV.SUPABASE_SERVICE_ROLE_KEY), false);
    assert.equal(/\b(prompt|output_text|content|request_payload|response_payload|provider_payload)\b/.test(select), false);
  }
});

test("getDashboardData returns the complete UI contract with joined aggregates", async () => {
  const { fetchImpl } = createFetch();
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
    now: () => NOW,
  });

  const result = await adapter.getDashboardData();

  assert.deepEqual(
    Object.keys(result).sort(),
    [
      "audit",
      "financeAllocations",
      "yookassaConfirmations",
      "generations",
      "incidents",
      "ledgerEntries",
      "now",
      "payments",
      "payouts",
      "promos",
      "providerTopups",
      "providerFunding",
      "providers",
      "referralPartners",
      "routes",
      "settings",
      "users",
      "subscriptionUpgrades",
      "wallet",
      "walletLedger",
      "workflow",
    ].sort(),
  );
  assert.deepEqual(
    result.users.map(({ id, plan, metacoinBalance, totalMetacoinsSpent, totalPaidRub, legalConsentCompleted }) => ({
      id,
      plan,
      metacoinBalance,
      totalMetacoinsSpent,
      totalPaidRub,
      legalConsentCompleted,
    })),
    [
      {
        id: "user-1",
        plan: "исследователь",
        metacoinBalance: 720,
        totalMetacoinsSpent: 1280,
        totalPaidRub: 1990,
        legalConsentCompleted: true,
      },
      {
        id: "user-2",
        plan: "новичок",
        metacoinBalance: 0,
        totalMetacoinsSpent: 0,
        totalPaidRub: 0,
        legalConsentCompleted: false,
      },
    ],
  );
  assert.deepEqual(
    result.users.map(
      ({
        id,
        subscriptionStartsAt,
        subscriptionExpiresAt,
        subscriptionStatus,
        paidAccessActive,
        subscriptionEnds,
      }) => ({
        id,
        subscriptionStartsAt,
        subscriptionExpiresAt,
        subscriptionStatus,
        paidAccessActive,
        subscriptionEnds,
      }),
    ),
    [
      {
        id: "user-1",
        subscriptionStartsAt: "2026-07-01T10:00:00.000Z",
        subscriptionExpiresAt: "2026-08-01T10:00:00.000Z",
        subscriptionStatus: "active",
        paidAccessActive: true,
        subscriptionEnds: "2026-08-01T10:00:00.000Z",
      },
      {
        id: "user-2",
        subscriptionStartsAt: null,
        subscriptionExpiresAt: null,
        subscriptionStatus: "free",
        paidAccessActive: false,
        subscriptionEnds: "бесплатный тариф",
      },
    ],
  );
  assert.equal(result.payments[0].userName, "Ирина Волкова");
  assert.equal(result.payments[0].receiptEmail, "receipt@example.ru");
  assert.equal(result.payments[0].receiptStatus, "succeeded");
  assert.equal(result.payments[0].receiptSentAt, "2026-07-01T10:01:01.000Z");
  assert.equal(result.payments[0].paymentMethod, "card");
  assert.deepEqual(result.payments[0].finance, {
    gross: 0,
    paymentFee: 0,
    apiReserve: 19.9,
    referralLiability: 0,
    ownerShare: 170.1,
    grossMargin: -19.9,
    grossMarginPercent: 0,
    currency: "RUB",
  });
  assert.equal(result.financeAllocations[0].provider, "Polza AI");
  assert.equal(result.payouts[0].status, "succeeded");
  assert.equal(result.payouts[0].destinationHint, "+7••• •••-12-34");
  assert.equal(result.referralPartners[0].userName, "Ирина Волкова");
  assert.equal(result.referralPartners[0].directReferrals[0].userName, "Максим");
  assert.equal(result.referralPartners[0].directReferrals[0].payments[0].cashEarning.amount, 269.7);
  assert.deepEqual(result.referralPartners[0].directReferrals[0].payments[0].bonuses.map(({ recipient, metacoins }) => ({ recipient, metacoins })), [
    { recipient: "приглашённый", metacoins: 100 },
    { recipient: "партнёр", metacoins: 100 },
  ]);
  assert.equal(result.referralPartners[0].profile.innMasked, "••••••••9012");
  assert.equal(JSON.stringify(result.referralPartners).includes("123456789012"), false);
  assert.equal(result.referralPartners[0].withdrawals[0].provider, "Т-Бизнес");
  assert.equal(result.referralPartners[0].withdrawals[0].destinationHint, "+7••• •••-12-34");
  assert.equal(result.referralPartners[0].withdrawals[0].status, "manual_review");
  assert.equal(result.referralPartners[0].balances.available, 169.7);
  assert.equal(result.referralPartners[0].balances.reserved, 100);
  assert.equal(result.providerTopups[0].status, "manual");
  assert.equal(result.users[0].lastReceiptStatus, "succeeded");
  assert.deepEqual(
    {
      total: result.users[0].subscriptionMetacoinsTotal,
      remaining: result.users[0].subscriptionMetacoinsRemaining,
      general: result.users[0].generalMetacoinBalance,
      package: result.users[0].packageMetacoinBalance,
    },
    { total: 850, remaining: 620, general: 720, package: 100 },
  );
  assert.deepEqual(
    {
      fromPlan: result.subscriptionUpgrades[0].fromPlan,
      toPlan: result.subscriptionUpgrades[0].toPlan,
      creditedDelta: result.subscriptionUpgrades[0].creditedDelta,
      beforeRemaining: result.subscriptionUpgrades[0].beforeSubscriptionRemaining,
      afterRemaining: result.subscriptionUpgrades[0].afterSubscriptionRemaining,
    },
    {
      fromPlan: "автор",
      toPlan: "исследователь",
      creditedDelta: 730,
      beforeRemaining: 120,
      afterRemaining: 850,
    },
  );
  assert.deepEqual(
    {
      provider: result.providerFunding[0].provider,
      allocatedKopecks: result.providerFunding[0].allocatedKopecks,
      fundedKopecks: result.providerFunding[0].fundedKopecks,
      remainingKopecks: result.providerFunding[0].remainingKopecks,
    },
    {
      provider: "Polza AI",
      allocatedKopecks: 1990,
      fundedKopecks: 0,
      remainingKopecks: 1990,
    },
  );
  assert.equal(result.ledgerEntries[1].type, "debit");
  assert.equal(result.generations[0].model, "gpt-5.6");
  assert.equal(result.generations[0].durationMs, 1250);
  assert.deepEqual(
    result.providers.map(({ id }) => id),
    ["polza", "routerai", "gptunnel", "openrouter", "fal", "replicate", "elevenlabs", "suno"],
  );
  assert.equal(
    result.providers
      .filter(({ id }) => !["polza", "routerai"].includes(id))
      .every(({ frozen, enabled, health }) => frozen && !enabled && health === "frozen"),
    true,
  );
  assert.equal(
    result.providers
      .filter(({ id }) => ["polza", "routerai"].includes(id))
      .every(({ totalCalls }) => totalCalls === 0),
    true,
  );
  assert.equal(result.incidents.some(({ source }) => source === "provider_api_calls"), true);
  assert.equal(result.promos[0].redemptionCount, 1);
  assert.equal(result.audit.some(({ action }) => action === "legal.accepted"), true);
  assert.equal(result.workflow.diagnosis.status, "failed");
});

test("projects a completed provider worker result without exposing claim credentials", async () => {
  const rows = {
    ...TABLE_ROWS,
    provider_topup_requests: [{
      ...TABLE_ROWS.provider_topup_requests[0],
      status: "succeeded",
      external_id: "polza-tx-140",
      attempt_count: 1,
      observed_transaction_id: "polza-tx-140",
      observed_amount_kopecks: 10_000,
      observed_balance_kopecks: 25_000,
      observed_at: "2026-07-30T09:00:00.000Z",
      processed_at: "2026-07-30T09:00:01.000Z",
      metadata: {
        paymentId: "yk-test-140",
        testOnly: true,
        confirmationStatus: "pending",
      },
    }],
  };
  const { fetchImpl } = createFetch(rows);
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
    now: () => NOW,
  });

  const result = await adapter.getDashboardData();
  assert.deepEqual(result.providerTopups[0], {
    id: "topup-1",
    allocationKey: "pay-1:api_reserve:polza",
    paymentId: "yk-test-140",
    provider: "Polza AI",
    amount: 19.9,
    amountKopecks: 1990,
    currency: "RUB",
    status: "succeeded",
    confirmationStatus: "posted",
    testOnly: true,
    attemptCount: 1,
    externalId: "polza-tx-140",
    observedTransactionId: "polza-tx-140",
    observedAmount: 100,
    observedBalance: 250,
    observedAt: "2026-07-30T09:00:00.000Z",
    processedAt: "2026-07-30T09:00:01.000Z",
    errorCode: null,
    createdAt: "2026-07-01T10:01:00.000Z",
    updatedAt: "2026-07-01T10:01:00.000Z",
  });
  assert.equal(JSON.stringify(result).includes("claim_token"), false);
});

test("projects T-Bank SBP receipts and Telegram Stars receivable for finance", async () => {
  const rows = {
    ...TABLE_ROWS,
    payments: [
      {
        ...TABLE_ROWS.payments[0],
        provider: "tbank",
        payment_method: "sbp",
      },
      {
        ...TABLE_ROWS.payments[0],
        id: "payment-stars-row",
        payment_id: "pay-stars",
        provider: "telegram_stars",
        payment_method: "telegram_stars",
        amount_kopecks: null,
        amount_xtr: 499,
        currency: "XTR",
        receipt_email: null,
        receipt_registration: "unknown",
        receipt_sent_at: null,
      },
    ],
    telegram_stars_ledger: [{
      id: "stars-ledger-1",
      ledger_key: "pay-stars:payment",
      charge_id: "charge-stars-1",
      payment_id: "payment-stars-row",
      user_id: "user-1",
      entry_type: "payment",
      xtr_delta: 499,
      metadata: {},
      occurred_at: "2026-07-01T10:01:00.000Z",
      created_at: "2026-07-01T10:01:00.000Z",
    }],
    telegram_stars_receivables: [{
      id: "stars-receivable-1",
      charge_id: "charge-stars-1",
      payment_id: "payment-stars-row",
      user_id: "user-1",
      xtr_amount: 499,
      status: "pending",
      settlement_id: null,
      settlement_currency: null,
      settlement_amount_kopecks: null,
      settled_at: null,
      metadata: {},
      created_at: "2026-07-01T10:01:00.000Z",
      updated_at: "2026-07-01T10:01:00.000Z",
    }],
  };
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: createFetch(rows).fetchImpl,
    now: () => NOW,
  });

  const result = await adapter.getDashboardData();
  const tbankPayment = result.payments.find(({ id }) => id === "payment-row-1");

  assert.equal(tbankPayment.provider, "Т-Банк");
  assert.equal(tbankPayment.paymentMethod, "sbp");
  assert.equal(tbankPayment.receiptStatus, "succeeded");
  assert.equal(result.payments.find(({ id }) => id === "payment-stars-row").amount, 499);
  assert.equal(result.wallet.currencies.XTR.starsReceivable, 499);
});

test("getUserDetails returns only the selected user's safe operational history", async () => {
  const requests = [];
  const fetchImpl = async (rawUrl, options = {}) => {
    const url = new URL(rawUrl);
    const table = tableFromUrl(url);
    requests.push({ table, url, options });
    let rows = TABLE_ROWS[table] ?? [];
    for (const [field, value] of url.searchParams.entries()) {
      if (!["id", "user_id", "telegram_user_id"].includes(field)) continue;
      const expected = value.replace(/^eq\./, "");
      rows = rows.filter((row) => String(row[field]) === expected);
    }
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
    now: () => NOW,
  });

  const result = await adapter.getUserDetails(
    "0f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
  );

  assert.equal(result, null);
  assert.equal(requests.length, 1);

  const users = TABLE_ROWS.users.map((user) =>
    user.id === "user-1"
      ? { ...user, id: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f" }
      : user,
  );
  const scopedRows = {
    ...TABLE_ROWS,
    users,
    crm_subscription_overview: TABLE_ROWS.crm_subscription_overview.map((row) => ({
      ...row,
      user_id: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    })),
    payments: TABLE_ROWS.payments.map((row) => ({
      ...row,
      user_id: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    })),
    metacoin_ledger: TABLE_ROWS.metacoin_ledger.map((row) => ({
      ...row,
      user_id: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    })),
    generations: TABLE_ROWS.generations.map((row) => ({
      ...row,
      user_id: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    })),
    legal_consent_status: TABLE_ROWS.legal_consent_status.map((row) => ({
      ...row,
      user_id: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    })),
    subscription_upgrade_audit: TABLE_ROWS.subscription_upgrade_audit.map((row) => ({
      ...row,
      user_id: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    })),
    crm_provider_funding_overview: TABLE_ROWS.crm_provider_funding_overview.map((row) => ({
      ...row,
      user_id: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    })),
  };
  requests.length = 0;
  const scopedFetch = async (rawUrl, options = {}) => {
    const url = new URL(rawUrl);
    const table = tableFromUrl(url);
    requests.push({ table, url, options });
    let rows = scopedRows[table] ?? [];
    for (const [field, value] of url.searchParams.entries()) {
      if (!["id", "user_id", "telegram_user_id"].includes(field)) continue;
      const expected = value.replace(/^eq\./, "");
      rows = rows.filter((row) => String(row[field]) === expected);
    }
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const scopedAdapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: scopedFetch,
    now: () => NOW,
  });
  const details = await scopedAdapter.getUserDetails(
    "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
  );

  assert.equal(details.user.name, "Ирина Волкова");
  assert.equal(details.user.plan, "исследователь");
  assert.equal(
    details.user.subscriptionExpiresAt,
    "2026-08-01T10:00:00.000Z",
  );
  assert.equal(details.user.subscriptionStatus, "active");
  assert.equal(details.user.paidAccessActive, true);
  assert.equal(details.avatarUrl, null);
  assert.equal(details.payments.length, 1);
  assert.equal(details.ledgerEntries.length, 2);
  assert.equal(details.generations.length, 1);
  assert.equal(details.providerCalls.length, 1);
  assert.equal(details.providerCalls[0].errorCode, null);
  assert.equal(details.subscriptionUpgrades[0].creditedDelta, 730);
  assert.equal(details.providerFunding[0].remainingKopecks, 1990);
  assert.equal(details.audit.some(({ action }) => action === "legal.accepted"), true);
  assert.equal(
    requests.every(({ url }) => {
      const select = url.searchParams.get("select");
      return !/\b(prompt|output_text|content|request_payload|response_payload|provider_payload)\b/.test(
        select,
      );
    }),
    true,
  );
  assert.equal(JSON.stringify(details).includes("upstream unavailable"), false);
});

test("expired paid history never turns the newcomer tariff into an unlimited paid plan", async () => {
  const expiredOverview = TABLE_ROWS.crm_subscription_overview.map((row) => ({
    ...row,
    effective_status: "expired",
    paid_access_active: false,
    ends_at: "2026-07-29T10:00:00.000Z",
  }));
  const { fetchImpl } = createFetch({
    ...TABLE_ROWS,
    crm_subscription_overview: expiredOverview,
  });
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
    now: () => NOW,
  });

  const result = await adapter.getDashboardData();
  const user = result.users.find(({ id }) => id === "user-1");

  assert.deepEqual(
    {
      plan: user.plan,
      subscriptionStartsAt: user.subscriptionStartsAt,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      subscriptionStatus: user.subscriptionStatus,
      paidAccessActive: user.paidAccessActive,
      subscriptionEnds: user.subscriptionEnds,
    },
    {
      plan: "новичок",
      subscriptionStartsAt: null,
      subscriptionExpiresAt: null,
      subscriptionStatus: "free",
      paidAccessActive: false,
      subscriptionEnds: "бесплатный тариф",
    },
  );
});

test("obsolete test tariff ids are projected as archived rather than public plans", async () => {
  const legacyOverview = TABLE_ROWS.crm_subscription_overview.map((row) => ({
    ...row,
    plan_id: "final_test_130",
  }));
  const { fetchImpl } = createFetch({
    ...TABLE_ROWS,
    crm_subscription_overview: legacyOverview,
  });
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
    now: () => NOW,
  });

  const result = await adapter.getDashboardData();
  const user = result.users.find(({ id }) => id === "user-1");

  assert.equal(user.plan, "архивный тариф");
  assert.equal(JSON.stringify(result.users).includes("финальный новый"), false);
  assert.equal(JSON.stringify(result.users).includes("final_test_130"), false);
});

test("getUserDetails validates the UUID before reading Supabase", async () => {
  let calls = 0;
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async () => {
      calls += 1;
      return new Response("[]", { status: 200 });
    },
  });

  await assert.rejects(() => adapter.getUserDetails("user-1"), /UUID/);
  assert.equal(calls, 0);
});

test("provider catalog is merged with call history without inventing metrics", async () => {
  const { fetchImpl } = createFetch();
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
    providerConfiguration: [
      {
        id: "openrouter",
        label: "OpenRouter",
        capabilities: ["text", "routing"],
        configured: true,
        missing: [],
        source: "environment",
      },
      {
        id: "fal",
        label: "fal.ai",
        capabilities: ["image", "video", "audio"],
        configured: false,
        missing: ["FAL_KEY"],
        source: "environment",
      },
    ],
  });

  const result = await adapter.getDashboardData();
  const fal = result.providers.find(({ id }) => id === "fal");
  const openrouter = result.providers.find(({ id }) => id === "openrouter");

  assert.equal(result.providers.some(({ id }) => id === "fal"), true);
  assert.deepEqual(
    {
      configured: fal.configured,
      capabilities: fal.capabilities,
      totalCalls: fal.totalCalls,
      successRate: fal.successRate,
      averageLatencyMs: fal.averageLatencyMs,
      p95LatencyMs: fal.p95LatencyMs,
      providerCostUsd: fal.providerCostUsd,
      timeline: fal.timeline,
      modelBreakdown: fal.modelBreakdown,
    },
    {
      configured: false,
      capabilities: ["image", "video", "audio"],
      totalCalls: 0,
      successRate: null,
      averageLatencyMs: null,
      p95LatencyMs: null,
      providerCostUsd: null,
      timeline: [],
      modelBreakdown: [],
    },
  );
  assert.equal(openrouter.configured, true);
  assert.equal(JSON.stringify(result).includes("FAL_KEY"), false);
});

test("provider probes enrich the projection without exposing credentials or raw responses", async () => {
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: "https://example.supabase.co",
    serviceRoleKey: "service-role-secret",
    fetchImpl: createFetch(TABLE_ROWS).fetchImpl,
    providerConfiguration: [
      {
        id: "polza",
        label: "Polza",
        capabilities: ["text", "image", "video", "music", "voice"],
        configured: true,
        priority: 1,
        topUpUrl: "https://polza.ai/balance",
        balanceSupported: true,
        source: "environment",
      },
      {
        id: "gptunnel",
        label: "GPTunnel",
        capabilities: ["text", "image", "video", "music", "voice"],
        configured: true,
        priority: 2,
        topUpUrl: "https://gptunnel.ru/profile",
        balanceSupported: false,
        source: "environment",
      },
    ],
    providerProbeService: {
      probeAll: async () => [
        {
          id: "polza",
          probeStatus: "ok",
          checkedAt: "2026-07-30T06:30:00.000Z",
          health: "healthy",
          balance: { available: 999, used: null, limit: null, unit: "RUB" },
          lowBalance: false,
          alerts: [],
        },
        {
          id: "gptunnel",
          probeStatus: "ok",
          checkedAt: "2026-07-30T06:30:00.000Z",
          health: "healthy",
          balance: null,
          lowBalance: false,
          alerts: [],
        },
      ],
    },
  });

  const result = await adapter.getDashboardData();
  const polza = result.providers.find(({ id }) => id === "polza");
  const gptunnel = result.providers.find(({ id }) => id === "gptunnel");
  const serialized = JSON.stringify(result.providers);

  assert.equal(result.providers[0].id, "polza");
  assert.equal(polza.health, "healthy");
  assert.equal(polza.balance.available, 999);
  assert.equal(polza.alerts.length, 0);
  assert.equal(gptunnel.lowBalance, false);
  assert.equal(gptunnel.balance, null);
  assert.equal(gptunnel.topUpUrl, "https://gptunnel.ru/profile");
  assert.equal(serialized.includes("service-role-secret"), false);
});

test("provider dashboard ignores non-model providers and stale historical failures", async () => {
  const rows = {
    ...TABLE_ROWS,
    provider_api_calls: [
      {
        ...TABLE_ROWS.provider_api_calls[0],
        id: "latest-success",
        provider: "gptunnel",
        status: "succeeded",
        http_status: 200,
        error_code: null,
        started_at: "2026-07-30T09:59:00.000Z",
      },
      {
        ...TABLE_ROWS.provider_api_calls[0],
        id: "old-auth-failure",
        provider: "openrouter",
        status: "failed",
        http_status: 401,
        error_code: "raw upstream body must never render",
        started_at: "2026-07-29T09:59:00.000Z",
      },
      {
        ...TABLE_ROWS.provider_api_calls[0],
        id: "payment-infrastructure",
        provider: "yookassa",
        status: "failed",
        http_status: 500,
        error_code: "payment_error",
      },
    ],
  };
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: createFetch(rows).fetchImpl,
    now: () => NOW,
    providerConfiguration: [
      {
        id: "gptunnel",
        label: "GPTunnel",
        capabilities: ["text", "image", "video", "music", "voice"],
        configured: true,
        priority: 2,
        balanceSupported: false,
        source: "environment",
      },
    ],
  });

  const result = await adapter.getDashboardData();
  const gptunnel = result.providers[0];

  assert.deepEqual(result.providers.map(({ id }) => id), ["gptunnel"]);
  assert.deepEqual(gptunnel.alerts, []);
  assert.deepEqual(gptunnel.errorBreakdown, []);
  assert.equal(JSON.stringify(result).includes("raw upstream body"), false);
});

test("default provider catalog keeps historical GPTunnel calls visible as frozen archive rows", async () => {
  const rows = {
    ...TABLE_ROWS,
    provider_api_calls: [
      {
        ...TABLE_ROWS.provider_api_calls[0],
        id: "historical-gptunnel-call",
        provider: "gptunnel",
        status: "succeeded",
        http_status: 200,
        error_code: null,
        started_at: "2026-07-29T09:59:00.000Z",
      },
    ],
  };
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: createFetch(rows).fetchImpl,
  });

  const result = await adapter.getDashboardData();
  const archived = result.providers.find(({ id }) => id === "gptunnel");

  assert.equal(archived.name, "GPTunnel");
  assert.equal(archived.frozen, true);
  assert.equal(archived.enabled, false);
  assert.equal(archived.health, "frozen");
  assert.equal(archived.totalCalls, 1);
});

test("fallback routes contain only ordered attempts from one correlated request", async () => {
  const sharedAttempt = {
    ...TABLE_ROWS.provider_api_calls[0],
    request_key: "private-correlated-request",
    generation_id: "generation-correlated",
    operation: "chat",
  };
  const rows = {
    ...TABLE_ROWS,
    provider_api_calls: [
      {
        ...sharedAttempt,
        id: "attempt-one",
        provider: "polza",
        status: "failed",
        http_status: 503,
        started_at: "2026-07-30T09:00:00.000Z",
      },
      {
        ...sharedAttempt,
        id: "attempt-two",
        provider: "gptunnel",
        status: "succeeded",
        http_status: 200,
        started_at: "2026-07-30T09:00:02.000Z",
      },
      {
        ...sharedAttempt,
        id: "independent-call",
        request_key: "other-request",
        generation_id: "other-generation",
        provider: "openrouter",
        status: "succeeded",
        http_status: 200,
        started_at: "2026-07-30T09:01:00.000Z",
      },
    ],
  };
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: createFetch(rows).fetchImpl,
  });

  const result = await adapter.getDashboardData();

  assert.equal(result.routes.length, 1);
  assert.equal(result.routes[0].capability, "chat");
  assert.deepEqual(
    result.routes[0].steps.map(({ provider, status }) => ({ provider, status })),
    [
      { provider: "Polza", status: "failed" },
      { provider: "GPTunnel", status: "healthy" },
    ],
  );
  assert.equal(JSON.stringify(result.routes).includes("OpenRouter"), false);
  assert.equal(
    JSON.stringify(result.routes).includes("private-correlated-request"),
    false,
  );
});

test("the returned projection never contains forbidden content or payload fields", async () => {
  const contaminated = {
    ...TABLE_ROWS,
    generations: TABLE_ROWS.generations.map((row) => ({
      ...row,
      prompt: "private prompt",
      output_text: "private output",
    })),
    provider_api_calls: TABLE_ROWS.provider_api_calls.map((row) => ({
      ...row,
      request_payload: { secret: "private request" },
      response_payload: { secret: "private response" },
    })),
    payments: TABLE_ROWS.payments.map((row) => ({
      ...row,
      provider_payload: { card: "private payment payload" },
    })),
  };
  const { fetchImpl } = createFetch(contaminated);
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
  });

  const serialized = JSON.stringify(await adapter.getDashboardData());

  assert.equal(serialized.includes("private prompt"), false);
  assert.equal(serialized.includes("private output"), false);
  assert.equal(serialized.includes("private request"), false);
  assert.equal(serialized.includes("private response"), false);
  assert.equal(serialized.includes("private payment payload"), false);
  assert.equal(/prompt|output_text|request_payload|response_payload|provider_payload/.test(serialized), false);
});

test("a missing optional relation produces a controlled empty/default projection", async () => {
  const { fetchImpl } = createFetch({
    users: TABLE_ROWS.users,
    crm_subscription_overview: TABLE_ROWS.crm_subscription_overview,
  });
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
  });

  const result = await adapter.getDashboardData();

  assert.equal(result.users.length, 2);
  assert.deepEqual(result.payments, []);
  assert.deepEqual(
    result.providers.map(({ id }) => id),
    ["polza", "routerai", "gptunnel", "openrouter", "fal", "replicate", "elevenlabs", "suno"],
  );
  assert.equal(
    result.providers.every(
      (provider) => provider.totalCalls === 0 && provider.successRate === null,
    ),
    true,
  );
  assert.deepEqual(result.incidents, []);
  assert.deepEqual(result.routes, []);
  assert.deepEqual(result.settings, {
    dataSource: "supabase",
    schema: "neuro",
    readOnly: true,
    sensitiveFieldsRedacted: true,
    finance: {
      payout: {
        id: "tbank_mass_payouts",
        label: "Т‑Бизнес массовые выплаты",
        enabled: false,
        credentialsConfigured: false,
        ready: false,
        status: "отключена",
        methods: ["sbp"],
        activation: "подключи массовые выплаты Т‑Бизнеса и добавь payout-реквизиты в Railway",
      },
      apiReserve: {
        percent: 46.5,
        allocationMode: "product_aware_dual_primary_liability",
        primaryProviderBufferPercent: 5,
        providerMinimumsKopecks: { routerai: 10_000 },
        legacyProviderWeights: { polza: 349, routerai: 116 },
      },
      mcpFundingWorker: {
        id: "mcp_funding_worker",
        label: "MCP funding worker",
        tokenConfigured: false,
        workerEnabled: false,
        billingDanger: false,
        ready: false,
        status: "токен не настроен; worker выключен; billing danger выключен; ожидается результат queue/worker",
        workerResult: null,
        note: "готовность не подтверждается без фактического результата queue/worker",
      },
      routerAiBrowserFunding: {
        id: "routerai_persistent_browser",
        label: "RouterAI persistent browser worker",
        enabled: false,
        killSwitch: false,
        profileConfigured: false,
        configured: false,
        ready: false,
        minimumAmount: 100,
        minimumCurrency: "RUB",
        loginPerPayment: false,
        status: "выключен",
        note: "однократная авторизация в постоянном профиле; каждая доля от 100 ₽ отправляется отдельно, без накопления",
      },
      providerTopups: {
      mode: "tbank_confirmed_queue",
      automatic: false,
      status: "очередь создаётся после payment.succeeded; внешний шлюз не подключён",
      confirmationGate: "tbank_payment_confirmed",
      fundingGateway: "не настроен",
      note: "CRM фиксирует оплату и создаёт заявку. Для реального списания бизнес-карты нужен внешний банк/эквайер или API автопополнения провайдера; CRM не хранит PAN/CVV",
        providers: [
          {
            id: "polza",
            label: "Polza",
            mode: "provider_dashboard",
            status: "нужен внешний шлюз оплаты",
            minimumAmount: 100,
            minimumCurrency: "RUB",
            fundingMethods: ["sbp_saved_account", "sbp", "bank_card", "invoice"],
            invoiceMinimumAmount: 5_000,
            invoiceMinimumCurrency: "RUB",
            note: "карта и СБП доступны в кабинете; счёт для юрлица на скриншоте — от 5 000 ₽. CRM не может списывать бизнес-карту без отдельного шлюза",
            topUpUrl: "https://polza.ai/balance",
          },
          {
            id: "routerai",
            label: "RouterAI",
            mode: "persistent_browser_saved_card",
            executionOwner: "external_funding_agent",
            crmChargeSupported: false,
            status: "выключен",
            minimumAmount: 100,
            minimumCurrency: "RUB",
            fundingMethods: ["saved_bank_card", "sbp"],
            note: "исполняет отдельный funding-agent; CRM только наблюдает статусы. Worker использует постоянный профиль и сохранённую карту; доля меньше 100 ₽ отклоняется, а не накапливается",
            topUpUrl: "https://routerai.ru/settings/billing",
          },
        ],
      },
    },
  });
});

test("PostgREST missing-table and operational errors fail safely", async () => {
  const missingTableAdapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async () =>
      new Response(JSON.stringify({ code: "PGRST205", message: "table missing" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
  });
  await assert.rejects(
    () => missingTableAdapter.getDashboardData(),
    (error) =>
      error instanceof SupabaseCrmRequestError &&
      error.statusCode === 404 &&
      !error.message.includes("table missing"),
  );

  const failingAdapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          message: `database error containing ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
        }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        },
      ),
  });

  let error;
  try {
    await failingAdapter.getDashboardData();
  } catch (caughtError) {
    error = caughtError;
  }
  assert.equal(error instanceof SupabaseCrmRequestError, true);
  assert.equal(error.statusCode, 500);
  assert.equal(error.message.includes(ENV.SUPABASE_SERVICE_ROLE_KEY), false);
  assert.equal(error.message.includes("database error"), false);
});

test("invalid Supabase URL and unexpected non-array responses are rejected safely", async () => {
  assert.throws(
    () =>
      new SupabaseCrmReadAdapter({
        supabaseUrl: "http://example.supabase.co",
        serviceRoleKey: "secret",
      }),
    /HTTPS/,
  );

  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async () =>
      new Response(JSON.stringify({ unexpected: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  });

  await assert.rejects(() => adapter.getDashboardData(), SupabaseCrmRequestError);
});

test("adjustMetacoins calls the atomic RPC with a safe server-side projection", async () => {
  let captured;
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async (url, options) => {
      captured = { url: String(url), options };
      return new Response(
        JSON.stringify([
          {
            action_id: "action-adjustment-1",
            ledger_id: "ledger-adjustment-1",
            applied: true,
            duplicate: false,
            balance_before: 720,
            balance_after: 970,
            error_code: null,
          },
        ]),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    },
  });

  const result = await adapter.adjustMetacoins({
    userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    direction: "credit",
    amount: 250,
    reason: "компенсация за недоступную генерацию",
    idempotencyKey: "crm-adjustment-20260730-0001",
    actor: "admin",
  });

  assert.equal(
    captured.url,
    "https://example.supabase.co/rest/v1/rpc/crm_adjust_metacoins",
  );
  assert.equal(captured.options.method, "POST");
  assert.equal(captured.options.headers["Content-Profile"], "neuro");
  assert.deepEqual(JSON.parse(captured.options.body), {
    p_user_id: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    p_delta: 250,
    p_actor_subject: "admin",
    p_reason: "компенсация за недоступную генерацию",
    p_idempotency_key: "crm-adjustment-20260730-0001",
    p_request_id: "crm-adjustment-20260730-0001",
  });
  assert.deepEqual(result, {
    actionId: "action-adjustment-1",
    ledgerId: "ledger-adjustment-1",
    balanceBefore: 720,
    balanceAfter: 970,
    delta: 250,
    duplicate: false,
  });
  assert.equal(JSON.stringify(result).includes(ENV.SUPABASE_SERVICE_ROLE_KEY), false);
});

test("adjustMetacoins maps an audited insufficient-balance result to a safe conflict", async () => {
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async () =>
      new Response(
        JSON.stringify([
          {
            action_id: "action-adjustment-rejected",
            ledger_id: null,
            applied: false,
            duplicate: false,
            balance_before: 10,
            balance_after: 10,
            error_code: "insufficient_balance",
          },
        ]),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
  });

  await assert.rejects(
    () =>
      adapter.adjustMetacoins({
        userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
        direction: "debit",
        amount: 250,
        reason: "ручная корректировка",
        idempotencyKey: "crm-adjustment-20260730-0002",
        actor: "admin",
      }),
    (error) =>
      error instanceof MetacoinAdjustmentError &&
      error.code === "insufficient_balance",
  );
});

test("adjustMetacoins fails closed when the RPC migration is not applied", async () => {
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          code: "PGRST202",
          message: "Could not find the function neuro.crm_adjust_metacoins",
        }),
        {
          status: 404,
          headers: { "content-type": "application/json" },
        },
      ),
  });

  await assert.rejects(
    () =>
      adapter.adjustMetacoins({
        userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
        direction: "credit",
        amount: 250,
        reason: "компенсация за недоступную генерацию",
        idempotencyKey: "crm-adjustment-20260730-0001",
        actor: "admin",
      }),
    MetacoinAdjustmentMigrationRequiredError,
  );
});

test("adjustMetacoins maps insufficient balance and conflicts without leaking Postgres details", async () => {
  for (const [databaseMessage, expectedCode] of [
    ["insufficient_balance", "insufficient_balance"],
    ["crm metacoin idempotency payload conflicts", "idempotency_conflict"],
  ]) {
    const adapter = new SupabaseCrmReadAdapter({
      supabaseUrl: ENV.SUPABASE_URL,
      serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            code: "P0001",
            message: `${databaseMessage}: ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
          }),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          },
        ),
    });

    let error;
    try {
      await adapter.adjustMetacoins({
        userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
        direction: "debit",
        amount: 250,
        reason: "ручная корректировка",
        idempotencyKey: "crm-adjustment-20260730-0002",
        actor: "admin",
      });
    } catch (caughtError) {
      error = caughtError;
    }
    assert.equal(error instanceof MetacoinAdjustmentError, true);
    assert.equal(error.code, expectedCode);
    assert.equal(error.message.includes(ENV.SUPABASE_SERVICE_ROLE_KEY), false);
  }
});

test("adjustMetacoins validates the command before making a network request", async () => {
  let calls = 0;
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async () => {
      calls += 1;
      return new Response("[]");
    },
  });
  const base = {
    userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    direction: "credit",
    amount: 1,
    reason: "ручная корректировка",
    idempotencyKey: "crm-adjustment-20260730-0003",
    actor: "admin",
  };

  await assert.rejects(() => adapter.adjustMetacoins({ ...base, amount: 0 }), /amount/);
  await assert.rejects(
    () => adapter.adjustMetacoins({ ...base, direction: "remove" }),
    /direction/,
  );
  await assert.rejects(() => adapter.adjustMetacoins({ ...base, reason: "" }), /reason/);
  await assert.rejects(
    () => adapter.adjustMetacoins({ ...base, userId: "not-a-uuid" }),
    /userId/,
  );
  assert.equal(calls, 0);
});

test("changeSubscription calls the audited subscription RPC with a safe command", async () => {
  let captured;
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async (url, options) => {
      captured = { url: String(url), options };
      return Response.json([{
        action_id: "action-subscription-1",
        subscription_id: "subscription-1",
        ledger_id: "ledger-subscription-1",
        applied: true,
        duplicate: false,
        plan_id: "author",
        metacoins: 300,
        balance_before: 670,
        balance_after: 970,
        starts_at: "2026-07-30T10:00:00.000Z",
        expires_at: "2026-08-29T10:00:00.000Z",
        error_code: null,
      }]);
    },
  });

  const result = await adapter.changeSubscription({
    userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    planId: "author",
    durationMonths: 1,
    reason: "ручная компенсация",
    idempotencyKey: "crm-subscription-20260730-0001",
    actor: "admin",
  });

  assert.equal(captured.url, "https://example.supabase.co/rest/v1/rpc/crm_change_subscription");
  assert.deepEqual(JSON.parse(captured.options.body), {
    p_user_id: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
    p_plan_id: "author",
    p_duration_months: 1,
    p_actor_subject: "admin",
    p_reason: "ручная компенсация",
    p_idempotency_key: "crm-subscription-20260730-0001",
    p_request_id: "crm-subscription-20260730-0001",
  });
  assert.deepEqual(result, {
    actionId: "action-subscription-1",
    subscriptionId: "subscription-1",
    ledgerId: "ledger-subscription-1",
    planId: "author",
    metacoins: 300,
    balanceBefore: 670,
    balanceAfter: 970,
    startsAt: "2026-07-30T10:00:00.000Z",
    expiresAt: "2026-08-29T10:00:00.000Z",
    duplicate: false,
  });
});

test("changeSubscription fails closed when the RPC is not installed", async () => {
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl: async () => new Response(JSON.stringify({
      code: "PGRST202",
      message: "Could not find the function neuro.crm_change_subscription",
    }), { status: 404 }),
  });

  await assert.rejects(
    () => adapter.changeSubscription({
      userId: "2f7b01ac-99c3-4a40-a0f3-5b3f46adcb4f",
      planId: "author",
      durationMonths: 1,
      reason: "ручная компенсация",
      idempotencyKey: "crm-subscription-20260730-0002",
      actor: "admin",
    }),
    SubscriptionChangeError,
  );
});

test("adapter exposes a durable diagnostic store backed by the same Supabase connection", async () => {
  const requests = [];
  const adapter = new SupabaseCrmReadAdapter({
    supabaseUrl: ENV.SUPABASE_URL,
    serviceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
    schema: "neuro",
    fetchImpl: async (url, init) => {
      requests.push({ url: String(url), init });
      return Response.json([
        {
          job_key: "crm-diagnostic:synthetic-canary",
          job_type: "crm_diagnostic_state",
          status: "succeeded",
          payload: {},
          result: { status: "healthy" },
          created_at: NOW,
          updated_at: NOW,
        },
      ]);
    },
  });

  const store = adapter.createDiagnosticStore();
  assert.equal(await store.getCanaryStatus(), "healthy");
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /\/rest\/v1\/system_jobs/);
  assert.equal(requests[0].init.headers.apikey, ENV.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(requests[0].init.headers["Accept-Profile"], "neuro");
});
