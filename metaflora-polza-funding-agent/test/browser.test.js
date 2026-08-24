import test from "node:test";
import assert from "node:assert/strict";
import { BrowserManager, paymentResponseSummary, topupUrl } from "../src/browser.js";

function control(overrides = {}) {
  return {
    isVisible: async () => true,
    isEnabled: async () => true,
    waitFor: async () => {},
    click: async () => {},
    fill: async () => {},
    first() { return this; },
    last() { return this; },
    ...overrides
  };
}

function dashboardPage({ onGoto = async () => {}, onAmount = async () => {}, onCard = async () => {}, onPay = async () => {}, payEnabled = true, paymentResponse = null } = {}) {
  const challenge = control({ isVisible: async () => false });
  return {
    goto: onGoto,
    close: async () => {},
    waitForResponse: async () => paymentResponse,
    getByPlaceholder: () => control({ fill: onAmount }),
    getByRole: (_role, options = {}) => {
      const name = String(options.name ?? "");
      if (name.includes("Пополнить баланс")) return control();
      if (name.includes("Карта")) return control({ click: onCard });
      if (/оплатить/iu.test(name)) return control({ isEnabled: async () => payEnabled, click: onPay });
      return control({ isVisible: async () => false });
    },
    locator: () => challenge
  };
}

function verifiedMcp({ initialBalance = 7350, expectedAmount = 10000, transactionId = "new" } = {}) {
  let balanceCalls = 0;
  return {
    getBalance: async () => ({ balanceKopecks: balanceCalls++ === 0 ? initialBalance : initialBalance + expectedAmount, currency: "RUB" }),
    getTransactionIds: async () => ["old"],
    findTransaction: async ({ amountKopecks, excluded }) => {
      assert.equal(amountKopecks, expectedAmount);
      assert.deepEqual(excluded, ["old"]);
      return { transactionId };
    },
    verifyTransaction: async () => ({ transactionId, amountKopecks: expectedAmount, currency: "RUB" }),
    createTopupLink: async () => { throw new Error("create_topup_link must not be called"); }
  };
}

test("extracts a nested https top-up link", () => {
  assert.equal(topupUrl({ data: { payment_url: "https://pay.example/one" } }, ["example"]), "https://pay.example/one");
  assert.equal(topupUrl("https://assistant.moneta.ru/payment", ["moneta.ru"]), "https://assistant.moneta.ru/payment");
  assert.equal(topupUrl({ url: "https://evil.test/one" }, ["example"]), null);
});

test("starts Chromium with a persistent profile and suppresses the crash-restore bubble", async () => {
  let launch = null;
  const page = { goto: async () => {} };
  const manager = new BrowserManager({
    profileDir: "/data/polza-profile",
    executablePath: "/usr/bin/google-chrome",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: {},
    launcher: {
      launchPersistentContext: async (profileDir, options) => {
        launch = { profileDir, options };
        return { pages: () => [page] };
      }
    }
  });

  await manager.start();

  assert.equal(launch.profileDir, "/data/polza-profile");
  assert.equal(launch.options.executablePath, "/usr/bin/google-chrome");
  assert.deepEqual(launch.options.ignoreDefaultArgs, ["--disable-extensions"]);
  assert.ok(launch.options.args.includes("--disable-session-crashed-bubble"));
  assert.ok(launch.options.args.includes("--hide-crash-restore-bubble"));
});

test("recognizes a persisted Polza access token when dashboard copy changes", async () => {
  const manager = new BrowserManager({
    profileDir: "/data/polza-profile",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: {}
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://polza.ai/dashboard/billing",
    locator: () => control({ isVisible: async () => false }),
    evaluate: async () => true
  };
  manager.context = {
    cookies: async () => [{ name: "session", expires: 1_900_000_000 }]
  };

  const status = await manager.status();

  assert.equal(status.authorization, "authorized");
  assert.equal(status.automation, "ready");
  assert.equal(status.sessionEvidence, "access_token");
});

test("never treats a login page as authorized even if stale storage remains", async () => {
  const manager = new BrowserManager({
    profileDir: "/data/polza-profile",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: {}
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://polza.ai/login",
    locator: () => control({ isVisible: async () => false }),
    evaluate: async () => true
  };
  manager.context = { cookies: async () => [] };

  const status = await manager.status();

  assert.equal(status.authorization, "required_once");
  assert.equal(status.automation, "blocked");
});

test("keeps only safe payment identifiers from a provider response", () => {
  assert.deepEqual(
    { ...paymentResponseSummary({ data: { paymentId: "pay-1", status: "pending", secret: "hidden" } }) },
    { paymentId: "pay-1", status: "pending" }
  );
});

test("resumes only an allowlisted checkout without submitting it", async () => {
  let navigated = null;
  const manager = new BrowserManager({
    profileDir: "/tmp/test",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: {},
    allowedPaymentHosts: ["payanyway.ru"]
  });
  manager.page = {
    goto: async (url) => { navigated = url; },
    getByRole: () => control({ isEnabled: async () => false })
  };

  const result = await manager.resumeCheckout("https://assistant.payanyway.ru/order/card");

  assert.equal(navigated, "https://assistant.payanyway.ru/order/card");
  assert.deepEqual(result, { checkout: "ready", paymentControl: "disabled" });
  await assert.rejects(
    () => manager.resumeCheckout("https://evil.test/order"),
    (error) => error.code === "checkout_url_rejected" && error.externalChargeStarted === false
  );
});

test("rejects unsupported amount before an external operation", async () => {
  const manager = new BrowserManager({ profileDir: "/tmp/test", dashboardUrl: "https://polza.ai/dashboard", mcp: {} });
  manager.status = async () => ({ authorization: "authorized" });
  await assert.rejects(() => manager.charge({ amountKopecks: 9999, idempotencyKey: "one" }), (error) => error.code === "invalid_amount" && error.externalChargeStarted === false);
});

test("deduplicates concurrent requests with the same idempotency key", async () => {
  const manager = new BrowserManager({ profileDir: "/tmp/test", dashboardUrl: "https://polza.ai/dashboard", mcp: {} });
  let statusCalls = 0;
  manager.status = async () => {
    statusCalls += 1;
    return { authorization: "required_once" };
  };
  const first = manager.charge({ amountKopecks: 10000, idempotencyKey: "same" });
  const second = manager.charge({ amountKopecks: 10000, idempotencyKey: "same" });
  const results = await Promise.allSettled([first, second]);
  assert.deepEqual(results.map((result) => result.reason.code), ["browser_authorization_required", "browser_authorization_required"]);
  assert.equal(statusCalls, 1);
});

test("does not create a second payment for an unresolved durable operation", async () => {
  let pageCalls = 0;
  const manager = new BrowserManager({
    profileDir: "/tmp/test",
    dashboardUrl: "https://polza.ai/dashboard",
    stateStore: { get: () => ({ status: "submission_started", startedAt: "2026-08-08T00:00:00.000Z", baselineTransactionIds: [] }) },
    mcp: { findTransaction: async () => null }
  });
  manager.status = async () => ({ authorization: "authorized" });
  manager.context = { newPage: async () => { pageCalls += 1; return dashboardPage(); } };
  await assert.rejects(() => manager.charge({ amountKopecks: 10000, idempotencyKey: "durable" }), (error) => error.code === "charge_result_unknown");
  assert.equal(pageCalls, 0);
});

test("reconciles a prepared payment before opening the dashboard", async () => {
  let pageCalls = 0;
  const stored = [];
  const manager = new BrowserManager({
    profileDir: "/tmp/test",
    dashboardUrl: "https://polza.ai/dashboard",
    stateStore: {
      get: () => ({ status: "prepared", startedAt: "2026-08-08T00:00:00.000Z", amountKopecks: 10000, beforeBalanceKopecks: 7350, baselineTransactionIds: ["old"] }),
      set: async (_key, value) => stored.push(value)
    },
    mcp: {
      findTransaction: async () => ({ transactionId: "manual-payment" }),
      verifyTransaction: async () => ({ transactionId: "manual-payment", amountKopecks: 10000, currency: "RUB" })
    }
  });
  manager.status = async () => ({ authorization: "authorized" });
  manager.context = { newPage: async () => { pageCalls += 1; return dashboardPage(); } };

  const result = await manager.charge({ amountKopecks: 10000, idempotencyKey: "prepared" });

  assert.equal(result.transactionId, "manual-payment");
  assert.equal(pageCalls, 0);
  assert.equal(stored.at(-1).status, "succeeded");
});

test("submits an arbitrary amount through the saved-card dashboard route", async () => {
  const actions = [];
  const stored = [];
  const amountKopecks = 13700;
  const page = dashboardPage({
    onGoto: async (url) => actions.push(["goto", url]),
    onAmount: async (value) => actions.push(["amount", value]),
    onCard: async () => actions.push(["card"]),
    onPay: async () => actions.push(["pay"])
  });
  const manager = new BrowserManager({
    profileDir: "/tmp/test",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: verifiedMcp({ expectedAmount: amountKopecks }),
    stateStore: { get: () => null, set: async (_key, value) => stored.push(value) }
  });
  manager.status = async () => ({ authorization: "authorized" });
  manager.context = { newPage: async () => page };

  const result = await manager.charge({ amountKopecks, idempotencyKey: "payment:137" });

  assert.equal(result.transactionId, "new");
  assert.deepEqual(actions, [
    ["goto", "https://polza.ai/dashboard/billing"],
    ["amount", "137"],
    ["card"],
    ["pay"]
  ]);
  assert.equal(stored.at(-1).status, "succeeded");
});

test("preserves kopecks when a verified aggregate is not a whole-ruble amount", async () => {
  const actions = [];
  const amountKopecks = 11001;
  const page = dashboardPage({ onAmount: async (value) => actions.push(value) });
  const manager = new BrowserManager({
    profileDir: "/tmp/test",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: verifiedMcp({ expectedAmount: amountKopecks }),
    stateStore: { get: () => null, set: async () => {} }
  });
  manager.status = async () => ({ authorization: "authorized" });
  manager.context = { newPage: async () => page };

  await manager.charge({ amountKopecks, idempotencyKey: "payment:110.01" });

  assert.deepEqual(actions, ["110.01"]);
});

test("reads a redacted Polza payment status through the authenticated browser", async () => {
  const manager = new BrowserManager({
    profileDir: "/data/polza-profile",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: {},
    stateStore: null,
  });
  manager.page = {
    isClosed() { return false; },
    async evaluate(_callback, paymentId) {
      assert.equal(paymentId, "dep_2197555309337645057");
      return {
        httpStatus: 200,
        ok: true,
        body: {
          paymentId,
          status: "failed",
          errorCode: "payment_declined",
          message: "Недостаточно средств",
          secret: "must-not-leak",
        },
      };
    },
  };

  assert.deepEqual(await manager.paymentStatus("dep_2197555309337645057"), {
    httpStatus: 200,
    ok: true,
    paymentId: "dep_2197555309337645057",
    status: "failed",
    errorCode: "payment_declined",
    message: "Недостаточно средств",
  });
});

test("a terminal unpaid Polza operation becomes safely retryable without waiting for the timeout", async () => {
  const stored = [];
  const page = dashboardPage({
    paymentResponse: {
      json: async () => ({ paymentId: "dep_failed_one" }),
    },
  });
  const manager = new BrowserManager({
    profileDir: "/tmp/test",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: {
      getBalance: async () => ({ balanceKopecks: 7350, currency: "RUB" }),
      getTransactionIds: async () => ["old"],
      findTransaction: async () => null,
    },
    stateStore: { get: () => null, set: async (_key, value) => stored.push(value) },
    transactionTimeoutMs: 180000,
  });
  manager.status = async () => ({ authorization: "authorized" });
  manager.context = { newPage: async () => page };
  manager.paymentStatus = async () => ({
    httpStatus: 200,
    ok: true,
    paymentId: "dep_failed_one",
    status: "error",
  });

  await assert.rejects(
    () => manager.charge({ amountKopecks: 11000, idempotencyKey: "payment:declined" }),
    (error) => error.code === "payment_declined"
      && error.retryable === true
      && error.externalChargeStarted === false
      && error.retryAfterSeconds === 3_600,
  );
  assert.equal(stored.at(-1).status, "prepared");
  assert.equal(stored.at(-1).lastPaymentStatus, "error");
});

test("follows an allowlisted checkout returned by the saved-method payment request", async () => {
  const actions = [];
  const paymentResponse = {
    json: async () => ({ paymentUrl: "https://assistant.moneta.ru/payment/one" })
  };
  const page = dashboardPage({
    paymentResponse,
    onGoto: async (url) => actions.push(["goto", url]),
    onPay: async () => actions.push(["pay"])
  });
  const manager = new BrowserManager({
    profileDir: "/tmp/test",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: verifiedMcp(),
    stateStore: { get: () => null, set: async () => {} },
    allowedPaymentHosts: ["moneta.ru"]
  });
  manager.status = async () => ({ authorization: "authorized" });
  manager.context = { newPage: async () => page };

  await manager.charge({ amountKopecks: 10000, idempotencyKey: "checkout-follow" });

  assert.deepEqual(actions, [
    ["goto", "https://polza.ai/dashboard/billing"],
    ["pay"],
    ["goto", "https://assistant.moneta.ru/payment/one"],
    ["pay"]
  ]);
});

test("waits for the hydrated billing controls before declaring them missing", async () => {
  const actions = [];
  let hydrated = false;
  const openButton = control({
    waitFor: async ({ state, timeout }) => {
      assert.equal(state, "visible");
      assert.equal(timeout, 20_000);
      hydrated = true;
    },
    isVisible: async () => hydrated,
    click: async () => actions.push("open")
  });
  let cardHydrated = false;
  let payHydrated = false;
  const savedCard = control({
    waitFor: async () => { cardHydrated = true; },
    isVisible: async () => cardHydrated
  });
  const payButton = control({
    waitFor: async () => { payHydrated = true; },
    isVisible: async () => payHydrated
  });
  const page = dashboardPage();
  page.getByRole = (_role, options = {}) => {
    const name = String(options.name ?? "");
    if (name.includes("Пополнить баланс")) return openButton;
    if (name.includes("Карта")) return savedCard;
    if (name.includes("Оплатить в 1 клик")) return payButton;
    return control({ isVisible: async () => false });
  };
  const manager = new BrowserManager({
    profileDir: "/tmp/test",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: verifiedMcp(),
    stateStore: { get: () => null, set: async () => {} }
  });
  manager.status = async () => ({ authorization: "authorized" });
  manager.context = { newPage: async () => page };

  await manager.charge({ amountKopecks: 10000, idempotencyKey: "hydrated-controls" });

  assert.deepEqual(actions, ["open"]);
});

test("reports when no saved chargeable card is available", async () => {
  const manager = new BrowserManager({
    profileDir: "/tmp/test",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: {
      getBalance: async () => ({ balanceKopecks: 7350, currency: "RUB" }),
      getTransactionIds: async () => []
    },
    stateStore: { get: () => null, set: async () => {} }
  });
  manager.status = async () => ({ authorization: "authorized" });
  manager.context = { newPage: async () => dashboardPage({ payEnabled: false }) };

  await assert.rejects(
    () => manager.charge({ amountKopecks: 10000, idempotencyKey: "card-required" }),
    (error) => error.code === "payment_method_required" && error.externalChargeStarted === false && error.userActionRequired === true
  );
});

test("different payments can prepare in parallel without a global queue", async () => {
  let opened = 0;
  let release;
  const bothOpened = new Promise((resolve) => { release = resolve; });
  const manager = new BrowserManager({
    profileDir: "/tmp/test",
    dashboardUrl: "https://polza.ai/dashboard",
    mcp: {
      getBalance: async () => ({ balanceKopecks: 7350, currency: "RUB" }),
      getTransactionIds: async () => []
    },
    stateStore: { get: () => null, set: async () => {} }
  });
  manager.status = async () => ({ authorization: "authorized" });
  manager.context = {
    newPage: async () => dashboardPage({
      onGoto: async () => {
        opened += 1;
        if (opened === 2) release();
        await bothOpened;
      },
      payEnabled: false
    })
  };

  const results = await Promise.race([
    Promise.allSettled([
      manager.charge({ amountKopecks: 10000, idempotencyKey: "parallel:1" }),
      manager.charge({ amountKopecks: 20000, idempotencyKey: "parallel:2" })
    ]),
    new Promise((_, reject) => setTimeout(() => reject(new Error("payments were serialized")), 250))
  ]);

  assert.equal(opened, 2);
  assert.deepEqual(results.map((result) => result.reason.code), ["payment_method_required", "payment_method_required"]);
});
