import test from "node:test";
import assert from "node:assert/strict";
import {
  RouterAiBrowserManager,
  extractRouterAiPaymentReference,
  isRouterAiPaymentResponse,
  parseRouterAiBalance
} from "../src/routerai-browser.js";

function locator({ visible = false, enabled = visible, text = "", value = "" } = {}) {
  return {
    first() { return this; },
    last() { return this; },
    locator() { return this; },
    filter() { return this; },
    async isVisible() { return visible; },
    async isEnabled() { return enabled; },
    async innerText() { return text; },
    async getAttribute(name) { return name === "value" ? value : null; },
    async waitFor() {},
    async click() {},
    async fill() {}
  };
}

test("parses RouterAI RUB balances without losing kopecks", () => {
  assert.equal(parseRouterAiBalance("Баланс 1 234,56 ₽"), 123456);
  assert.equal(parseRouterAiBalance("0 ₽"), 0);
  assert.equal(parseRouterAiBalance("нет баланса"), null);
});

test("matches only same-origin RouterAI payment creation responses", () => {
  assert.equal(isRouterAiPaymentResponse("https://routerai.ru/settings/billing/invoices"), true);
  assert.equal(isRouterAiPaymentResponse("https://routerai.ru/api/v1/payments/42"), true);
  assert.equal(isRouterAiPaymentResponse("https://mc.yandex.ru/watch/payment"), false);
  assert.equal(isRouterAiPaymentResponse("https://evil.example/payments"), false);
});

test("ignores RouterAI billing history GET responses during payment creation", () => {
  const history = {
    url: () => "https://routerai.ru/settings/billing/invoices",
    request: () => ({ method: () => "GET" })
  };
  const creation = {
    url: () => "https://routerai.ru/settings/billing/invoices",
    request: () => ({ method: () => "POST" })
  };
  assert.equal(isRouterAiPaymentResponse(history), false);
  assert.equal(isRouterAiPaymentResponse(creation), true);
  assert.equal(isRouterAiPaymentResponse({
    url: () => "https://routerai.ru/settings/invoices",
    request: () => ({ method: () => "POST" })
  }), true);
});

test("extracts a payment reference without retaining secrets", () => {
  assert.deepEqual(extractRouterAiPaymentReference({
    invoice: { id: "inv-100", status: "pending", confirmation_url: "https://securepay.tinkoff.ru/order/100" },
    token: "must-not-leak"
  }), {
    transactionId: "inv-100",
    status: "pending",
    redirectUrl: "https://securepay.tinkoff.ru/order/100"
  });
});

test("never treats an unrelated nested object id as a payment id", () => {
  assert.deepEqual(extractRouterAiPaymentReference({
    analytics: { id: "unrelated" },
    invoice: { status: "pending" }
  }), { status: "pending" });
});

test("extracts the authoritative RouterAI invoice amount and currency", () => {
  assert.deepEqual(extractRouterAiPaymentReference({
    invoice: { id: "inv-amount", status: "paid", amount: "100.00", currency: "RUB" }
  }), {
    transactionId: "inv-amount",
    status: "paid",
    amountKopecks: 10000,
    currency: "RUB"
  });
});

test("rejects RouterAI funding below 100 RUB before navigation", async () => {
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => { throw new Error("must not navigate"); } },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: { get: () => null }
  });
  manager.status = async () => ({ authorization: "authorized", automation: "ready" });
  await assert.rejects(
    () => manager.charge({ amountKopecks: 9999, idempotencyKey: "small" }),
    (error) => error.code === "invalid_amount" && error.externalChargeStarted === false
  );
});

test("returns an already completed RouterAI allocation without opening checkout", async () => {
  let pageCalls = 0;
  const records = new Map([
    ["routerai-operation:sale:one", { status: "succeeded", transactionId: "inv-100", amountKopecks: 10000 }],
    ["routerai-transaction:inv-100", { status: "succeeded", transactionId: "inv-100", amountKopecks: 10000 }]
  ]);
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => { pageCalls += 1; } },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: { get: (key) => records.get(key) }
  });
  manager.status = async () => ({ authorization: "authorized", automation: "ready" });

  assert.deepEqual(await manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:one" }), {
    transactionId: "inv-100", amountKopecks: 10000, currency: "RUB"
  });
  assert.deepEqual(await manager.verifyTransaction({
    transactionId: "inv-100", expectedAmountKopecks: 10000, currency: "RUB"
  }), { transactionId: "inv-100", amountKopecks: 10000, currency: "RUB" });
  assert.equal(pageCalls, 0);
});

test("an unresolved submitted RouterAI payment is never submitted twice", async () => {
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => { throw new Error("must not open another checkout"); } },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: {
      get: () => ({ status: "submission_started", amountKopecks: 10000, transactionId: "inv-pending" })
    }
  });
  manager.status = async () => ({ authorization: "authorized", automation: "ready" });
  await assert.rejects(
    () => manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:pending" }),
    (error) => error.code === "charge_result_unknown"
  );
});

test("an unresolved legacy payment without a history baseline cannot claim an older payment", async () => {
  let historyClaims = 0;
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => { throw new Error("must not open another checkout"); } },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: {
      get: () => ({ status: "submission_started", amountKopecks: 10000, beforeBalanceKopecks: 0 }),
      set: async () => {}
    }
  });
  manager.claimCompletedHistoryRecord = async () => {
    historyClaims += 1;
    return { transactionId: "stale-payment", status: "paid", amountKopecks: 10000, currency: "RUB" };
  };

  await assert.rejects(
    () => manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:legacy" }),
    (error) => error.code === "charge_result_unknown"
  );
  assert.equal(historyClaims, 0);
});

test("a new RouterAI charge fails closed before checkout when payment history is unavailable", async () => {
  let pageCalls = 0;
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => { pageCalls += 1; } },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: { get: () => null, set: async () => {} }
  });
  manager.status = async () => ({ authorization: "authorized", automation: "ready" });
  manager.readBalance = async () => ({ balanceKopecks: 10000, currency: "RUB" });
  manager.page = { isClosed: () => false };

  await assert.rejects(
    () => manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:no-history" }),
    (error) => error.code === "history_unavailable" && error.externalChargeStarted === false
  );
  assert.equal(pageCalls, 0);
});

test("readiness requires an authenticated session and a saved card", async () => {
  const visible = locator({ visible: true });
  const hidden = locator();
  const manager = new RouterAiBrowserManager({
    context: {}, billingUrl: "https://routerai.ru/settings/billing", stateStore: null
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://routerai.ru/settings/billing",
    getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible,
    getByText: (pattern) => pattern.source.includes("сохран") ? visible : hidden,
    locator: (selector) => selector.includes("auto-top-up") ? visible : hidden
  };

  assert.deepEqual(await manager.status(), {
    persistent: true,
    profileMode: "shared_persistent",
    authorization: "authorized",
    automation: "ready",
    cardEnrollment: "ready",
    fundingMethod: "saved_card",
    loginPerPayment: false,
    cookieCount: 0,
    sessionCookieCount: 0,
    persistentCookieExpiresAt: null
  });
});

test("readiness remains blocked when only SBP is available", async () => {
  const visible = locator({ visible: true });
  const hidden = locator();
  const manager = new RouterAiBrowserManager({
    context: {}, billingUrl: "https://routerai.ru/settings/billing", stateStore: null
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://routerai.ru/settings/billing",
    getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible,
    getByText: () => hidden,
    locator: () => hidden
  };

  const status = await manager.status();
  assert.equal(status.authorization, "authorized");
  assert.equal(status.automation, "blocked_until_card_enrollment");
  assert.equal(status.cardEnrollment, "required_once");
});

test("readiness accepts the selected saved card in the real RouterAI top-up dialog", async () => {
  const visible = locator({ visible: true });
  const hidden = locator();
  const manager = new RouterAiBrowserManager({
    context: {}, billingUrl: "https://routerai.ru/settings/billing", stateStore: null
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://routerai.ru/settings/billing",
    getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible,
    getByText: () => hidden,
    locator: () => hidden,
    evaluate: async () => true
  };

  const status = await manager.status();
  assert.equal(status.authorization, "authorized");
  assert.equal(status.automation, "ready");
  assert.equal(status.cardEnrollment, "ready");
  assert.equal(status.fundingMethod, "saved_card");
});

test("readiness safely opens the top-up dialog to inspect a saved card after restart", async () => {
  const hidden = locator();
  let openClicks = 0;
  let cardTabClicks = 0;
  let inspections = 0;
  const openButton = {
    ...locator({ visible: true }),
    async click() { openClicks += 1; }
  };
  const cardTab = {
    ...locator({ visible: true }),
    async click() { cardTabClicks += 1; }
  };
  const manager = new RouterAiBrowserManager({
    context: {}, billingUrl: "https://routerai.ru/settings/billing", stateStore: null
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://routerai.ru/settings/billing",
    getByRole: (role, options) => {
      if (options.name.source.includes("войти")) return hidden;
      if (role === "button" && options.name.source.includes("пополнить")) return openButton;
      return hidden;
    },
    getByText: (pattern) => pattern.source.includes("финансы") ? locator({ visible: true })
      : pattern.source.toLowerCase().includes("карта") ? cardTab : hidden,
    locator: () => hidden,
    evaluate: async () => {
      inspections += 1;
      return inspections > 1;
    }
  };

  const status = await manager.status();
  assert.equal(status.automation, "ready");
  assert.equal(status.fundingMethod, "saved_card");
  assert.equal(openClicks, 1);
  assert.equal(cardTabClicks, 1);
});

test("a RouterAI challenge after submission is not treated as retryable", async () => {
  const stored = [];
  let closeCalls = 0;
  const amountInput = locator({ visible: true });
  const savedCard = locator({ visible: true });
  const submit = locator({ visible: true, enabled: true });
  const challenge = locator({ visible: true });
  const hidden = locator();
  const page = {
    async goto() {},
    async close() { closeCalls += 1; },
    locator: (selector) => {
      if (selector.includes("input") && !selector.includes("saved")) return amountInput;
      if (selector.includes("saved") || selector.includes("masked")) return savedCard;
      if (selector === "body") return locator({ visible: true, text: "SmartCaptcha" });
      return hidden;
    },
    getByRole: (role, options) => role === "button" && options.name.source.includes("пополнить") ? submit : hidden,
    getByText: (pattern) => pattern.source.includes("SmartCaptcha") ? challenge : hidden,
    waitForResponse: async () => ({
      url: () => "https://routerai.ru/settings/billing/invoices",
      json: async () => ({ invoice: { id: "inv-challenge", status: "pending" } })
    }),
    frames: () => []
  };
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => page },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: { get: () => null, set: async (_key, value) => stored.push(value) },
    transactionTimeoutMs: 10
  });
  manager.status = async () => ({ authorization: "authorized", automation: "ready" });
  manager.readPaymentHistory = async () => [];
  manager.readBalance = async () => ({ balanceKopecks: 50000, currency: "RUB" });

  await assert.rejects(
    () => manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:challenge" }),
    (error) => error.code === "payment_confirmation_required" && error.userActionRequired === true
      && error.externalChargeStarted !== false
  );
  assert.equal(stored.some((record) => record.status === "submission_started"), true);
  assert.equal(closeCalls, 0);
});

test("reads RouterAI balance only from the billing balance section", async () => {
  let navigatedTo = null;
  const manager = new RouterAiBrowserManager({
    context: {}, billingUrl: "https://routerai.ru/settings/billing", stateStore: null
  });
  const page = {
    isClosed: () => false,
    async goto(url) { navigatedTo = url; },
    getByText: () => locator({ visible: true }),
    locator: (selector) => {
      assert.equal(selector, "body");
      return locator({ visible: true, text: "Баланс\n1 025,40 ₽\nИстория платежей\n100 ₽" });
    }
  };

  assert.deepEqual(await manager.readBalance(page), { balanceKopecks: 102540, currency: "RUB" });
  assert.equal(navigatedTo, "https://routerai.ru/settings/billing");
});

test("opens the UIKit top-up dialog natively when an actionable click stalls, then submits once", async () => {
  const records = new Map();
  const calls = [];
  let buttonCall = 0;
  const amountInput = {
    ...locator({ visible: true }),
    async isVisible() { return buttonCall >= 2; },
    async fill(value) { calls.push(["amount", value]); }
  };
  const savedCard = {
    ...locator({ visible: true }),
    async click() { calls.push(["saved-card"]); }
  };
  const cardTab = {
    ...locator({ visible: true }),
    async click() { calls.push(["card-tab"]); }
  };
  const button = {
    ...locator({ visible: true, enabled: true }),
    async click() {
      buttonCall += 1;
      if (buttonCall === 1) throw new Error("UIKit hydration blocked Playwright actionability");
      calls.push([buttonCall === 2 ? "open" : "submit"]);
    },
    async evaluate(callback) {
      assert.equal(typeof callback, "function");
      calls.push(["native-open"]);
    }
  };
  const hidden = locator();
  const chargePage = {
    async goto(url, options) { calls.push(["goto", url, options?.waitUntil]); },
    async close() { calls.push(["close"]); },
    locator: (selector) => {
      if (selector.includes('placeholder*="100"')) return amountInput;
      if (selector.includes("data-recurring-payment-method")) return savedCard;
      if (selector === "body") return locator({ visible: true, text: "Платёж обрабатывается" });
      return hidden;
    },
    getByRole: () => button,
    getByText: (pattern) => pattern.source.toLowerCase().includes("карта") ? cardTab : hidden,
    waitForResponse: async (predicate) => {
      const response = {
        url: () => "https://routerai.ru/settings/billing/invoices",
      json: async () => ({ invoice: { id: "inv-success", status: "paid", amount: "100.00", currency: "RUB" } })
      };
      assert.equal(predicate(response), true);
      return response;
    }
  };
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => chargePage },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: {
      get: (key) => records.get(key),
      set: async (key, value) => records.set(key, value)
    },
    transactionTimeoutMs: 100
  });
  manager.status = async () => ({ authorization: "authorized", automation: "ready" });
  manager.readPaymentHistory = async () => [];
  let balanceReads = 0;
  manager.readBalance = async () => ({
    balanceKopecks: balanceReads++ === 0 ? 50000 : 60000,
    currency: "RUB"
  });

  assert.deepEqual(await manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:success" }), {
    transactionId: "inv-success", amountKopecks: 10000, currency: "RUB"
  });
  assert.equal(records.get("routerai-operation:sale:success").status, "succeeded");
  assert.equal(records.get("routerai-transaction:inv-success").status, "succeeded");
  assert.deepEqual(calls, [
    ["goto", "https://routerai.ru/settings/billing", "commit"],
    ["native-open"],
    ["card-tab"],
    ["open"],
    ["card-tab"],
    ["amount", "100"],
    ["saved-card"],
    ["submit"],
    ["close"]
  ]);
});

test("rejects an idempotency key reused with a different amount", async () => {
  const manager = new RouterAiBrowserManager({
    context: {},
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: { get: () => ({ status: "succeeded", transactionId: "inv-old", amountKopecks: 10000 }) }
  });
  await assert.rejects(
    () => manager.charge({ amountKopecks: 10100, idempotencyKey: "sale:conflict" }),
    (error) => error.code === "idempotency_conflict" && error.externalChargeStarted === false
  );
});

test("does not reuse another provider's durable record with the same idempotency key", async () => {
  const records = new Map([
    ["sale:shared", { status: "succeeded", transactionId: "polza-tx", amountKopecks: 10000, route: "dashboard_saved_method" }]
  ]);
  const manager = new RouterAiBrowserManager({
    context: {},
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: { get: (key) => records.get(key) }
  });
  manager.status = async () => ({ authorization: "required_once", automation: "blocked_until_authorization" });

  await assert.rejects(
    () => manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:shared" }),
    (error) => error.code === "browser_authorization_required"
  );
});

test("concurrent reuse of an idempotency key with another amount is rejected", async () => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const manager = new RouterAiBrowserManager({
    context: {}, billingUrl: "https://routerai.ru/settings/billing", stateStore: { get: () => null }
  });
  manager.status = async () => pending;
  const first = manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:concurrent" });

  await assert.rejects(
    () => manager.charge({ amountKopecks: 20000, idempotencyKey: "sale:concurrent" }),
    (error) => error.code === "idempotency_conflict" && error.externalChargeStarted === false
  );
  release({ authorization: "required_once", automation: "blocked_until_authorization" });
  await assert.rejects(first, (error) => error.code === "browser_authorization_required");
});

test("a masked card outside recurring settings never makes RouterAI ready", async () => {
  const visible = locator({ visible: true });
  const hidden = locator();
  const manager = new RouterAiBrowserManager({ context: {}, billingUrl: "https://routerai.ru/settings/billing" });
  manager.page = {
    isClosed: () => false,
    url: () => "https://routerai.ru/settings/billing",
    getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible,
    getByText: (pattern) => pattern.source.includes("карта") ? visible : hidden,
    locator: (selector) => selector.includes("payment-history") ? visible : hidden
  };

  const status = await manager.status();
  assert.equal(status.automation, "blocked_until_card_enrollment");
});

test("status reports persistent RouterAI cookie expiry from the shared profile", async () => {
  const visible = locator({ visible: true });
  const hidden = locator();
  const manager = new RouterAiBrowserManager({
    context: {
      cookies: async (origin) => {
        assert.equal(origin, "https://routerai.ru");
        return [
          { name: "session", expires: 0 },
          { name: "remember", expires: 1800000000 }
        ];
      }
    },
    billingUrl: "https://routerai.ru/settings/billing"
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://routerai.ru/settings/billing",
    getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible,
    getByText: () => hidden,
    locator: () => visible
  };

  const status = await manager.status();
  assert.equal(status.cookieCount, 2);
  assert.equal(status.sessionCookieCount, 1);
  assert.equal(status.persistentCookieExpiresAt, "2027-01-15T08:00:00.000Z");
});

test("readiness polling never navigates away from RouterAI login or a payment challenge", async () => {
  let navigations = 0;
  const visible = locator({ visible: true });
  const hidden = locator();
  const manager = new RouterAiBrowserManager({ context: {}, billingUrl: "https://routerai.ru/settings/billing" });
  manager.page = {
    isClosed: () => false,
    url: () => "https://routerai.ru/users/sign_in",
    goto: async () => { navigations += 1; },
    getByRole: (_role, options) => options.name.source.includes("войти") ? visible : hidden,
    getByText: () => hidden,
    locator: () => hidden
  };

  const status = await manager.status();
  assert.equal(status.authorization, "required_once");
  assert.equal(navigations, 0);

  manager.page.url = () => "https://securepay.tinkoff.ru/order/challenge";
  const challengeStatus = await manager.status();
  assert.equal(challengeStatus.automation, "blocked_until_authorization");
  assert.equal(navigations, 0);
});

test("a selected SBP method is never mistaken for a saved RouterAI card", async () => {
  const visible = locator({ visible: true });
  const hidden = locator();
  const manager = new RouterAiBrowserManager({ context: {}, billingUrl: "https://routerai.ru/settings/billing" });
  manager.page = {
    isClosed: () => false,
    url: () => "https://routerai.ru/settings/billing",
    getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible,
    getByText: () => hidden,
    locator: (selector) => selector.includes('value*="sbp"') ? visible : hidden
  };

  const status = await manager.status();
  assert.equal(status.automation, "blocked_until_card_enrollment");
  assert.equal(status.fundingMethod, null);
});

test("a restarted RouterAI manager reuses the same persistent browser context", async () => {
  const visible = locator({ visible: true });
  const hidden = locator();
  let pageCount = 0;
  const sharedContext = {
    cookies: async () => [{ name: "remember", expires: 1800000000 }],
    newPage: async () => {
      pageCount += 1;
      return {
        isClosed: () => false,
        url: () => "https://routerai.ru/settings/billing",
        goto: async () => {},
        getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible,
        getByText: () => hidden,
        locator: () => visible
      };
    }
  };
  const first = new RouterAiBrowserManager({ context: sharedContext, billingUrl: "https://routerai.ru/settings/billing" });
  await first.start();
  assert.equal((await first.status()).automation, "ready");

  const restarted = new RouterAiBrowserManager({ context: sharedContext, billingUrl: "https://routerai.ru/settings/billing" });
  await restarted.start();
  const status = await restarted.status();
  assert.equal(status.automation, "ready");
  assert.equal(status.cookieCount, 1);
  assert.equal(pageCount, 2);
});

test("never confirms a RouterAI allocation from balance movement without a provider invoice id", async () => {
  const records = new Map();
  const hidden = locator();
  const page = {
    async goto() {},
    async close() {},
    locator: (selector) => selector.includes('invoice[amount]')
      ? locator({ visible: true })
      : selector.includes("recurring")
        ? locator({ visible: true })
        : locator({ visible: true, text: "Баланс пополнен" }),
    getByRole: () => locator({ visible: true, enabled: true }),
    getByText: () => hidden,
    waitForResponse: async () => null
  };
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => page },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: { get: (key) => records.get(key), set: async (key, value) => records.set(key, value) },
    transactionTimeoutMs: 5
  });
  manager.status = async () => ({ authorization: "authorized", automation: "ready" });
  manager.readPaymentHistory = async () => [];
  let balanceReads = 0;
  manager.readBalance = async () => ({ balanceKopecks: balanceReads++ ? 60000 : 50000, currency: "RUB" });

  await assert.rejects(
    () => manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:no-reference" }),
    (error) => error.code === "charge_result_unknown"
  );
  assert.equal(records.get("routerai-operation:sale:no-reference").status, "submission_started");
});

test("a terminal decline is never resubmitted with the same RouterAI idempotency key", async () => {
  let pageCalls = 0;
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => { pageCalls += 1; } },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: {
      get: (key) => key === "routerai-operation:sale:declined"
        ? { status: "failed", amountKopecks: 10000, transactionId: "inv-declined", providerStatus: "declined" }
        : null
    }
  });

  await assert.rejects(
    () => manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:declined" }),
    (error) => error.code === "payment_declined" && error.retryable === false
      && error.externalChargeStarted === false
  );
  assert.equal(pageCalls, 0);
});

test("a pending RouterAI creation becomes successful only after authoritative status turns paid", async () => {
  const records = new Map();
  const hidden = locator();
  const page = {
    async goto() {},
    async close() {},
    locator: (selector) => selector.includes('invoice[amount]') || selector.includes("recurring")
      ? locator({ visible: true })
      : locator({ visible: true, text: "Обрабатывается" }),
    getByRole: () => locator({ visible: true, enabled: true }),
    getByText: () => hidden,
    waitForResponse: async () => ({
      url: () => "https://routerai.ru/settings/billing/invoices",
      request: () => ({ method: () => "POST" }),
      json: async () => ({ invoice: { id: "inv-later", status: "pending" } })
    })
  };
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => page },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: { get: (key) => records.get(key), set: async (key, value) => records.set(key, value) },
    transactionTimeoutMs: 100
  });
  manager.status = async () => ({ authorization: "authorized", automation: "ready" });
  manager.readPaymentHistory = async () => [];
  let balanceReads = 0;
  manager.readBalance = async () => ({ balanceKopecks: balanceReads++ ? 60000 : 50000, currency: "RUB" });
  manager.readPaymentStatus = async (transactionId) => {
    assert.equal(transactionId, "inv-later");
    return { transactionId, status: "paid", amountKopecks: 10000, currency: "RUB" };
  };

  assert.deepEqual(await manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:later" }), {
    transactionId: "inv-later", amountKopecks: 10000, currency: "RUB"
  });
  assert.equal(records.get("routerai-operation:sale:later").providerStatus, "paid");
});

test("never confirms paid RouterAI invoices with a mismatched amount or insufficient balance growth", async () => {
  for (const scenario of [
    { name: "provider amount mismatch", providerAmountKopecks: 10100, afterBalanceKopecks: 60000 },
    { name: "insufficient aggregate balance growth", providerAmountKopecks: 10000, afterBalanceKopecks: 59999 }
  ]) {
    const records = new Map();
    const hidden = locator();
    const page = {
      async goto() {},
      async close() {},
      locator: (selector) => selector.includes('invoice[amount]') || selector.includes("recurring")
        ? locator({ visible: true })
        : locator({ visible: true, text: scenario.name }),
      getByRole: () => locator({ visible: true, enabled: true }),
      getByText: () => hidden,
      waitForResponse: async () => ({
        url: () => "https://routerai.ru/settings/billing/invoices",
        request: () => ({ method: () => "POST" }),
        json: async () => ({
          invoice: { id: `inv-${scenario.providerAmountKopecks}`, status: "paid", amount_kopecks: scenario.providerAmountKopecks, currency: "RUB" }
        })
      })
    };
    const manager = new RouterAiBrowserManager({
      context: { newPage: async () => page },
      billingUrl: "https://routerai.ru/settings/billing",
      stateStore: { get: (key) => records.get(key), set: async (key, value) => records.set(key, value) },
      transactionTimeoutMs: 5,
      pollIntervalMs: 0
    });
    manager.status = async () => ({ authorization: "authorized", automation: "ready" });
    manager.readPaymentHistory = async () => [];
    let balanceReads = 0;
    manager.readBalance = async () => ({
      balanceKopecks: balanceReads++ ? scenario.afterBalanceKopecks : 50000,
      currency: "RUB"
    });

    await assert.rejects(
      () => manager.charge({ amountKopecks: 10000, idempotencyKey: `sale:${scenario.name}` }),
      (error) => error.code === "charge_result_unknown"
    );
  }
});

test("accepts an exact paid invoice when concurrent top-ups make the aggregate balance delta larger", async () => {
  const records = new Map();
  const hidden = locator();
  const page = {
    async goto() {},
    async close() {},
    locator: (selector) => selector.includes('invoice[amount]') || selector.includes("recurring")
      ? locator({ visible: true })
      : locator({ visible: true, text: "processing" }),
    getByRole: () => locator({ visible: true, enabled: true }),
    getByText: () => hidden,
    waitForResponse: async () => ({
      url: () => "https://routerai.ru/settings/billing/invoices",
      request: () => ({ method: () => "POST" }),
      json: async () => ({ invoice: { id: "inv-concurrent", status: "paid", amount_kopecks: 10000, currency: "RUB" } })
    })
  };
  const manager = new RouterAiBrowserManager({
    context: { newPage: async () => page },
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: { get: (key) => records.get(key), set: async (key, value) => records.set(key, value) },
    transactionTimeoutMs: 50,
    pollIntervalMs: 0
  });
  manager.status = async () => ({ authorization: "authorized", automation: "ready" });
  manager.readPaymentHistory = async () => [];
  let balanceReads = 0;
  manager.readBalance = async () => ({
    balanceKopecks: balanceReads++ ? 70100 : 50000,
    currency: "RUB"
  });

  assert.deepEqual(await manager.charge({ amountKopecks: 10000, idempotencyKey: "sale:concurrent" }), {
    transactionId: "inv-concurrent", amountKopecks: 10000, currency: "RUB"
  });
});

test("allocates one observed balance increment to only one parallel paid invoice", async () => {
  const manager = new RouterAiBrowserManager({
    context: {}, billingUrl: "https://routerai.ru/settings/billing", stateStore: null
  });
  manager.readBalance = async () => ({ balanceKopecks: 60000, currency: "RUB" });

  const confirmations = await Promise.all([
    manager.confirmObservedBalanceGrowth({ beforeBalanceKopecks: 50000, amountKopecks: 10000 }),
    manager.confirmObservedBalanceGrowth({ beforeBalanceKopecks: 50000, amountKopecks: 10000 })
  ]);

  assert.deepEqual(confirmations.sort(), [false, true]);
});

test("allocates duplicate completed history rows to distinct parallel operations", async () => {
  const records = new Map();
  const manager = new RouterAiBrowserManager({
    context: {},
    billingUrl: "https://routerai.ru/settings/billing",
    stateStore: { get: (key) => records.get(key), set: async (key, value) => records.set(key, value) }
  });
  manager.readPaymentHistory = async () => [
    { fingerprint: "same", amountKopecks: 10000, paid: true },
    { fingerprint: "same", amountKopecks: 10000, paid: true }
  ];

  const first = await manager.claimCompletedHistoryRecord({ baselineHistory: [], amountKopecks: 10000, durableKey: "op-1" });
  const second = await manager.claimCompletedHistoryRecord({ baselineHistory: [], amountKopecks: 10000, durableKey: "op-2" });

  assert.equal(first.transactionId, "routerai-history-same-1");
  assert.equal(second.transactionId, "routerai-history-same-2");
});
