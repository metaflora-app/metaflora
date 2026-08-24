import assert from "node:assert/strict";
import test from "node:test";

import {
  BrowserFundingActionRequiredError,
  BrowserFundingAuthorizationRequiredError,
  createPolzaBrowserFundingConnector,
  createPlaywrightBrowserPaymentAdapter,
  requiresCardEnrollment,
  validateAuthorizationAction,
} from "./polza-browser-funding.js";

function request(overrides = {}) {
  return {
    provider: "polza",
    allocationKey: "payment-1:reserve:polza",
    paymentId: "payment-1",
    amountKopecks: 10_000,
    currency: "RUB",
    idempotencyKey: "provider-topup:polza:payment-1:reserve",
    ...overrides,
  };
}

function confirmedAuthorizationStore() {
  return Object.freeze({
    async isConfirmed() { return true; },
    async confirm() {},
  });
}

test("card enrollment is required only when the hosted checkout exposes an editable card field", async () => {
  const field = {
    async count() { return 1; },
    async isVisible() { return true; },
    async isEditable() { return true; },
  };
  assert.equal(await requiresCardEnrollment({
    getByRole() { return { first() { return field; } }; },
  }), true);

  const rememberedCard = {
    ...field,
    async isVisible() { return false; },
  };
  assert.equal(await requiresCardEnrollment({
    getByRole() { return { first() { return rememberedCard; } }; },
  }), false);
});

test("custom browser funding uses the persistent balance page and is idempotent", async () => {
  const calls = [];
  const connector = createPolzaBrowserFundingConnector({
    mcp: {
      async createTopupLink() { throw new Error("MCP link creation must not be used for a charge"); },
    },
    browserPayment: {
      async pay(input) {
        calls.push(["pay", input]);
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { status: "succeeded", transactionId: "polza-tx-1" };
      },
    },
  });

  const [first, second] = await Promise.all([
    connector.charge(request()),
    connector.charge(request()),
  ]);

  assert.deepEqual(first, { transactionId: "polza-tx-1" });
  assert.deepEqual(second, first);
  assert.equal(calls.filter(([kind]) => kind === "link").length, 0);
  assert.equal(calls.filter(([kind]) => kind === "pay").length, 1);
  assert.equal(calls[0][1].url, "https://polza.ai/dashboard/billing");
  assert.equal(calls[0][1].flow, "balance");
  assert.equal(calls[0][1].amountRubles, 100);
  assert.equal(calls[0][1].profileMode, "persistent");
  assert.equal(calls[0][1].loginPerPayment, false);
});

test("connector exposes the persistent authorization relay used by CRM", async () => {
  const calls = [];
  const browserPayment = {
    async pay() { return { status: "succeeded", transactionId: "polza-tx-auth" }; },
    async beginAuthorization() {
      calls.push(["start"]);
      return { token: "a".repeat(64), active: true };
    },
    async getAuthorizationView(token) {
      calls.push(["view", token]);
      return { active: true };
    },
    async authorizationAction(token, action) {
      calls.push(["action", token, action]);
      return { active: true, authorization: "required_once" };
    },
    async completeAuthorization(token) {
      calls.push(["complete", token]);
      return { active: false, authorization: "authorized" };
    },
    async cancelAuthorization(token) {
      calls.push(["cancel", token]);
      return { active: false };
    },
  };
  const connector = createPolzaBrowserFundingConnector({ mcp: {}, browserPayment });

  assert.deepEqual(await connector.beginAuthorization(), { token: "a".repeat(64), active: true });
  assert.deepEqual(await connector.getAuthorizationView("token-1"), { active: true });
  assert.deepEqual(await connector.authorizationAction("token-1", { type: "reload" }), {
    active: true,
    authorization: "required_once",
  });
  assert.deepEqual(await connector.completeAuthorization("token-1"), {
    active: false,
    authorization: "authorized",
  });
  assert.deepEqual(await connector.cancelAuthorization("token-2"), { active: false });
  assert.deepEqual(calls, [
    ["start"],
    ["view", "token-1"],
    ["action", "token-1", { type: "reload" }],
    ["complete", "token-1"],
    ["cancel", "token-2"],
  ]);
});

test("custom browser funding refuses fractional rubles instead of silently rounding the ledger", async () => {
  let called = false;
  const connector = createPolzaBrowserFundingConnector({
    mcp: { async createTopupLink() { called = true; } },
    browserPayment: { async pay() { return { status: "succeeded", transactionId: "tx" }; } },
  });

  await assert.rejects(
    connector.charge(request({ amountKopecks: 10_050 })),
    (error) => error.code === "custom_amount_requires_whole_ruble"
      && error.retryable === false,
  );
  assert.equal(called, false);
});

test("authorization and 3-D Secure are surfaced as non-success states", async () => {
  const authConnector = createPolzaBrowserFundingConnector({
    mcp: {},
    browserPayment: {
      async pay() {
        throw new BrowserFundingAuthorizationRequiredError();
      },
    },
  });
  await assert.rejects(
    authConnector.charge(request()),
    (error) => error instanceof BrowserFundingAuthorizationRequiredError
      && error.retryable === false,
  );

  const challengeConnector = createPolzaBrowserFundingConnector({
    mcp: {},
    browserPayment: {
      async pay() {
        throw new BrowserFundingActionRequiredError("3ds_required");
      },
    },
  });
  await assert.rejects(
    challengeConnector.charge(request({ idempotencyKey: "provider-topup:polza:payment-2:reserve" })),
    (error) => error instanceof BrowserFundingActionRequiredError
      && error.code === "3ds_required"
      && error.retryable === false,
  );
});

test("connector reconciles a successful checkout page through MCP when the page omits its transaction id", async () => {
  const calls = [];
  const connector = createPolzaBrowserFundingConnector({
    mcp: {
      async findMatchingTransaction(input) {
        calls.push(input);
        return { transactionId: "polza-tx-reconciled" };
      },
    },
    browserPayment: {
      async pay() { return { status: "succeeded" }; },
    },
  });

  assert.deepEqual(await connector.charge(request({
    idempotencyKey: "provider-topup:polza:payment-3:reserve",
  })), { transactionId: "polza-tx-reconciled" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].amountKopecks, 10_000);
});

test("connector does not create a paid-link probe before reporting autonomous readiness", async () => {
  const calls = [];
  const connector = createPolzaBrowserFundingConnector({
    mcp: {
      async createTopupLink(input) {
        calls.push(["link", input]);
        throw new Error("status must not create a checkout link");
      },
    },
    browserPayment: {
      async pay() { throw new Error("must not charge during status"); },
      async getStatus() {
        return {
          persistent: true,
          authorization: "authorized",
          automation: "ready",
          loginPerPayment: false,
        };
      },
      async inspectCheckout(input) {
        calls.push(["inspect", input]);
        return { authorization: "authorized", automation: "ready", cardEnrollment: "ready" };
      },
    },
    allowedCheckoutHosts: ["polza.ai", "www.payanyway.ru"],
  });

  assert.deepEqual(await connector.getStatus(), {
    persistent: true,
    authorization: "authorized",
    automation: "ready",
    loginPerPayment: false,
    cardEnrollment: "ready",
  });
  assert.deepEqual(await connector.getStatus(), {
    persistent: true,
    authorization: "authorized",
    automation: "ready",
    loginPerPayment: false,
    cardEnrollment: "ready",
  });
  assert.deepEqual(calls, []);
});

test("browser funding emits a redaction-safe lifecycle log for a custom charge", async () => {
  const events = [];
  const connector = createPolzaBrowserFundingConnector({
    mcp: {},
    browserPayment: {
      async pay() { return { status: "succeeded", transactionId: "polza-tx-log-1" }; },
    },
    logger: {
      info(event, context) { events.push({ event, context }); },
      warn(event, context) { events.push({ event, context }); },
    },
  });

  await connector.charge(request({
    paymentId: "payment-log-1",
    allocationKey: "payment-log-1:reserve:polza",
    idempotencyKey: "provider-topup:polza:payment-log-1:reserve",
  }));

  assert.deepEqual(events.map(({ event }) => event), [
    "crm.provider_funding.charge_started",
    "crm.provider_funding.browser_payment_succeeded",
    "crm.provider_funding.reconciliation_succeeded",
  ]);
  assert.equal(events[0].context.route, "persistent_balance_card");
  assert.equal(events[0].context.mcpLinkCreation, false);
  assert.equal(events[1].context.transactionId, "polza-tx-log-1");
  assert.doesNotMatch(JSON.stringify(events), /Bearer|https?:\/\//iu);
});

test("default browser payment fills a custom amount in the saved-card balance flow", async () => {
  const actions = [];
  let state = "initial";
  const locator = (kind, name) => ({
    async count() {
      if (kind === "card-number") return 0;
      if (kind === "topup" || kind === "amount" || kind === "card" || kind === "pay") return 1;
      return 0;
    },
    first() { return this; },
    async isVisible() { return true; },
    async isEditable() { return kind === "amount"; },
    async click() {
      actions.push([kind, name]);
      if (kind === "topup") state = "modal";
      if (kind === "pay") state = "success";
    },
    async fill(value) {
      actions.push(["fill", value]);
    },
  });
  const page = {
    async goto(url) { actions.push(["goto", url]); },
    async close() {},
    url() { return "https://polza.ai/dashboard/billing"; },
    async waitForTimeout() {},
    locator(selector) {
      if (selector !== "body") return locator("missing", selector);
      return { async innerText() {
        return state === "success" ? "Пополнение 100 ₽ успешно" : "Баланс Polza Пополнить баланс";
      } };
    },
    getByRole(role, options = {}) {
      const name = String(options.name ?? "");
      if (role === "textbox" && /cardNumber|номер карты/iu.test(name)) return locator("card-number", name);
      if (role === "button" && /пополнить баланс/iu.test(name)) return locator("topup", name);
      if (role === "button" && /Карта ••/iu.test(name)) return locator("card", name);
      if (role === "button" && /Оплатить в 1 клик/iu.test(name)) return locator("pay", name);
      return locator("missing", name);
    },
    getByPlaceholder(pattern) {
      return /5 000 ₽|сумма/iu.test(String(pattern)) ? locator("amount", String(pattern)) : locator("missing", String(pattern));
    },
  };
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: confirmedAuthorizationStore(),
    runtime: {
      async launchPersistentContext() {
        return { async newPage() { return page; }, async close() {} };
      },
    },
  });

  const result = await adapter.pay({
    url: "https://polza.ai/dashboard/billing",
    flow: "balance",
    amountRubles: 100,
  });

  assert.deepEqual(result, { status: "succeeded", transactionId: null });
  assert.deepEqual(actions, [
    ["goto", "https://polza.ai/dashboard/billing"],
    ["topup", "/^пополнить баланс$|^top up balance$/iu"],
    ["fill", "100"],
    ["card", "/Карта ••/iu"],
    ["pay", "/^оплатить в 1 клик$|^оплатить$|^pay$/iu"],
  ]);
});

test("balance flow accepts a delayed text/link top-up control", async () => {
  const actions = [];
  let state = "initial";
  let topupChecks = 0;
  const locator = (kind, name) => ({
    async count() {
      if (kind === "topup") return topupChecks >= 2 ? 1 : 0;
      if (["custom", "amount", "pay"].includes(kind)) return 1;
      return 0;
    },
    first() { return this; },
    async isVisible() { return true; },
    async isEditable() { return kind === "amount"; },
    async click() {
      actions.push([kind, name]);
      if (kind === "topup") state = "modal";
      if (kind === "custom") state = "custom";
      if (kind === "pay") state = "success";
    },
    async fill(value) { actions.push(["fill", value]); },
  });
  const page = {
    async goto(url) { actions.push(["goto", url]); },
    async close() {},
    url() { return "https://polza.ai/balance?payment_id=tx-delayed"; },
    async waitForTimeout() { topupChecks += 1; },
    locator(selector) {
      if (selector === "body") return { async innerText() {
        return state === "success" ? "Пополнение 100 ₽ успешно" : "Баланс Polza";
      } };
      return locator("missing", selector);
    },
    getByRole(role, options = {}) {
      const name = String(options.name ?? "");
      if (role === "button" && /другая сумма|custom amount/iu.test(name)) return locator("custom", name);
      if (role === "spinbutton") return locator("amount", name);
      if (role === "button" && /^оплатить$|^pay$/iu.test(name)) return locator("pay", name);
      return locator("missing", name);
    },
    getByText(pattern) {
      const name = String(pattern);
      if (/пополнить баланс|top up balance/iu.test(name)) return locator("topup", name);
      if (/другая сумма|custom amount/iu.test(name)) return locator("custom", name);
      if (/оплатить|pay/iu.test(name)) return locator("pay", name);
      return locator("missing", name);
    },
  };
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: confirmedAuthorizationStore(),
    runtime: {
      async launchPersistentContext() {
        return { async newPage() { return page; }, async close() {} };
      },
    },
  });

  const result = await adapter.pay({
    url: "https://polza.ai/balance",
    flow: "balance",
    amountRubles: 100,
  });

  assert.deepEqual(result, { status: "succeeded", transactionId: "tx-delayed" });
  assert.equal(actions[1][0], "topup");
  assert.equal(actions.at(-1)[0], "pay");
  assert.ok(topupChecks >= 2);
});

test("playwright adapter launches one persistent context and uses separate pages", async () => {
  const pages = [];
  const launchCalls = [];
  const context = {
    async newPage() {
      const page = {
        async goto() {},
        async close() {},
        url() { return "https://polza.ai/checkout/success"; },
        async bodyText() { return "Пополнение 100 ₽ успешно"; },
        async pay() { return { status: "succeeded", transactionId: "tx" }; },
      };
      pages.push(page);
      return page;
    },
    async close() {},
  };
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    sessionName: "polza-funding",
    autoSubmit: true,
    authorizationConfirmationStore: confirmedAuthorizationStore(),
    runtime: {
      async launchPersistentContext(profileDir, options) {
        launchCalls.push({ profileDir, options });
        return context;
      },
    },
    pagePayment: async (page) => page.pay(),
  });

  const [first, second] = await Promise.all([
    adapter.pay({ url: "https://polza.ai/checkout/1", amountRubles: 100 }),
    adapter.pay({ url: "https://polza.ai/checkout/2", amountRubles: 200 }),
  ]);

  assert.deepEqual(first, { status: "succeeded", transactionId: "tx" });
  assert.deepEqual(second, first);
  assert.equal(launchCalls.length, 1);
  assert.equal(launchCalls[0].profileDir, "/data/hermes-profile");
  assert.equal(launchCalls[0].options.sessionName, "polza-funding");
  assert.equal(launchCalls[0].options.loginPerPayment, false);
  assert.equal(pages.length, 2);
});

test("playwright status exposes only a safe probe error code when the browser cannot start", async () => {
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: confirmedAuthorizationStore(),
    runtime: {
      async launchPersistentContext() {
        throw Object.assign(new Error("private launch details"), {
          code: "browser_type_launch_error",
        });
      },
    },
  });

  const status = await adapter.getStatus();

  assert.equal(status.authorization, "unknown");
  assert.equal(status.probeErrorCode, "browser_type_launch_error");
  assert.equal(Object.hasOwn(status, "message"), false);
});

test("remote authorization reports a missing Playwright executable without leaking its path", async () => {
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: confirmedAuthorizationStore(),
    runtime: {
      async launchPersistentContext() {
        throw new Error("Executable doesn't exist at /root/.cache/ms-playwright/chromium/chrome");
      },
    },
  });

  await assert.rejects(
    adapter.beginAuthorization(),
    (error) => error?.code === "browser_executable_missing" && !/root|cache|chromium/iu.test(error.message),
  );
});

test("playwright status treats a dashboard redirect to login as authorization required", async () => {
  const page = {
    async goto() {},
    async close() {},
    url() { return "https://polza.ai/login"; },
    locator() { return { async innerText() { return "Принять"; } }; },
  };
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: confirmedAuthorizationStore(),
    runtime: {
      async launchPersistentContext() {
        return { async newPage() { return page; }, async close() {} };
      },
    },
  });

  const status = await adapter.getStatus();

  assert.equal(status.authorization, "required_once");
  assert.equal(status.automation, "configured_pending_authorization");
});

test("playwright status restores confirmation from an authenticated persistent profile", async () => {
  let confirmed = false;
  const page = {
    async goto() {},
    async close() {},
    url() { return "https://polza.ai/dashboard"; },
    isClosed() { return false; },
    locator() {
      return {
        async innerText() {
          return "Нейростудия API-ключи MCP Сервер Хранилище Организация Пополнить баланс";
        },
      };
    },
    async screenshot() { return Buffer.from("png"); },
  };
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: {
      async isConfirmed() { return confirmed; },
      async confirm() { confirmed = true; },
    },
    runtime: {
      async launchPersistentContext() {
        return { async newPage() { return page; }, async close() {} };
      },
    },
  });

  const status = await adapter.getStatus();

  assert.equal(status.authorization, "authorized");
  assert.equal(status.automation, "ready");
  assert.equal(confirmed, true);
});

test("playwright status keeps an unconfirmed logged-out profile blocked", async () => {
  let confirmed = false;
  const page = {
    async goto() {},
    async close() {},
    url() { return "https://polza.ai/login"; },
    locator() {
      return { async innerText() { return "Войти пароль"; } };
    },
  };
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: {
      async isConfirmed() { return confirmed; },
      async confirm() { confirmed = true; },
    },
    runtime: {
      async launchPersistentContext() {
        return { async newPage() { return page; }, async close() {} };
      },
    },
  });

  const status = await adapter.getStatus();

  assert.equal(status.authorization, "required_once");
  assert.equal(status.automation, "configured_pending_authorization");
  assert.equal(confirmed, false);
});

test("playwright status does not treat an unrecognised page as an authorized dashboard", async () => {
  const page = {
    async goto() {},
    async close() {},
    url() { return "https://polza.ai/dashboard"; },
    locator() { return { async innerText() { return "Loading application"; } }; },
  };
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: {
      async isConfirmed() { return true; },
      async confirm() {},
    },
    runtime: {
      async launchPersistentContext() {
        return { async newPage() { return page; }, async close() {} };
      },
    },
  });

  const status = await adapter.getStatus();

  assert.equal(status.authorization, "unknown");
  assert.equal(status.automation, "configured_pending_authorization");
});

test("playwright status does not reopen the dashboard on every health check", async () => {
  let pageCount = 0;
  const page = {
    async goto() {},
    async close() {},
    url() { return "https://polza.ai/login"; },
    locator() { return { async innerText() { return "Войти пароль"; } }; },
  };
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: confirmedAuthorizationStore(),
    runtime: {
      async launchPersistentContext() {
        return {
          async newPage() {
            pageCount += 1;
            return page;
          },
          async close() {},
        };
      },
    },
  });

  const first = await adapter.getStatus();
  const second = await adapter.getStatus();

  assert.equal(first.authorization, "required_once");
  assert.deepEqual(second, first);
  assert.equal(pageCount, 1);
});

test("playwright status classifies a generic runtime error without exposing its message", async () => {
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: confirmedAuthorizationStore(),
    runtime: {
      async launchPersistentContext() {
        throw new Error("chromium executable is unavailable at /private/path");
      },
    },
  });

  const status = await adapter.getStatus();

  assert.equal(status.probeErrorCode, "browser_runtime_unavailable");
});

test("playwright status classifies container sandbox failures safely", async () => {
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: confirmedAuthorizationStore(),
    runtime: {
      async launchPersistentContext() {
        throw new Error("running as root without --no-sandbox is not supported");
      },
    },
  });

  const status = await adapter.getStatus();

  assert.equal(status.probeErrorCode, "browser_sandbox_blocked");
});

test("remote authorization relay keeps the persistent page, returns a volatile token, and closes only after confirmation", async () => {
  const actions = [];
  let currentUrl = "https://polza.ai/login";
  let closed = false;
  let authorizationConfirmed = false;
  const page = {
    async goto(url) {
      actions.push(["goto", url]);
      currentUrl = "https://polza.ai/login";
    },
    url() { return currentUrl; },
    isClosed() { return closed; },
    async close() { closed = true; actions.push(["close"]); },
    locator() {
      return { async innerText() {
        return currentUrl.endsWith("/login")
          ? "Войти пароль"
          : "Нейростудия API-ключи MCP Сервер Хранилище Организация Пополнить баланс";
      } };
    },
    async screenshot() { return Buffer.from("png"); },
    mouse: {
      async click(x, y) {
        actions.push(["click", x, y]);
        currentUrl = "https://polza.ai/dashboard";
      },
      async wheel(x, y) { actions.push(["wheel", x, y]); },
    },
    keyboard: {
      async insertText(value) { actions.push(["type", value]); },
      async press(value) { actions.push(["press", value]); },
    },
    async waitForTimeout() {},
    async reload() { actions.push(["reload"]); },
    async goBack() { actions.push(["back"]); currentUrl = "https://polza.ai/login"; },
  };
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    authorizationConfirmationStore: {
      async isConfirmed() { return authorizationConfirmed; },
      async confirm() { authorizationConfirmed = true; },
    },
    runtime: {
      async launchPersistentContext() {
        return {
          async newPage() { return page; },
          async close() {},
        };
      },
    },
  });

  const started = await adapter.beginAuthorization();
  assert.equal(started.active, true);
  assert.equal(started.authorization, "required_once");
  assert.match(started.image, /^data:image\/png;base64,/u);
  assert.equal(started.token.length, 64);

  const view = await adapter.authorizationAction(started.token, {
    type: "click",
    x: 12,
    y: 24,
  });
  assert.equal(view.authorization, "authorized");
  assert.equal((await adapter.getStatus()).automation, "configured_pending_authorization");
  await assert.rejects(
    adapter.authorizationAction("wrong-token", { type: "press", key: "Enter" }),
    (error) => error.code === "authorization_session_invalid",
  );

  assert.deepEqual(await adapter.completeAuthorization(started.token), {
    active: false,
    authorization: "authorized",
    automation: "ready",
    cardEnrollment: "ready",
  });
  assert.equal((await adapter.getAuthorizationView(started.token)).active, false);
  assert.equal((await adapter.getStatus()).automation, "ready");
  assert.deepEqual(actions, [
    ["goto", "https://polza.ai/dashboard/billing"],
    ["click", 12, 24],
    ["close"],
  ]);
});

test("remote authorization relay forwards a manually selected pointer drag", async () => {
  const actions = [];
  const page = {
    async goto() {},
    url() { return "https://polza.ai/login"; },
    isClosed() { return false; },
    async close() {},
    locator() { return { async innerText() { return "Войти пароль"; } }; },
    async screenshot() { return Buffer.from("png"); },
    mouse: {
      async move(x, y, options) { actions.push(["move", x, y, options]); },
      async down() { actions.push(["down"]); },
      async up() { actions.push(["up"]); },
      async click() {},
      async wheel() {},
    },
    keyboard: {
      async insertText() {},
      async press() {},
    },
    async waitForTimeout() {},
    async reload() {},
    async goBack() {},
  };
  const adapter = createPlaywrightBrowserPaymentAdapter({
    profileDir: "/data/hermes-profile",
    autoSubmit: true,
    runtime: {
      async launchPersistentContext() {
        return { async newPage() { return page; }, async close() {} };
      },
    },
  });

  const started = await adapter.beginAuthorization();
  await adapter.authorizationAction(started.token, {
    type: "drag",
    startX: 120,
    startY: 240,
    endX: 760,
    endY: 240,
  });

  assert.deepEqual(actions, [
    ["move", 120, 240, undefined],
    ["down"],
    ["move", 760, 240, { steps: 20 }],
    ["up"],
  ]);
});

test("remote authorization relay rejects arbitrary keyboard shortcuts, coordinates, and unknown fields", () => {
  assert.deepEqual(
    validateAuthorizationAction({ type: "drag", startX: 10, startY: 20, endX: 100, endY: 20 }),
    { type: "drag", startX: 10, startY: 20, endX: 100, endY: 20 },
  );
  assert.throws(
    () => validateAuthorizationAction({ type: "press", key: "Control+L" }),
    /not allowed/iu,
  );
  assert.throws(
    () => validateAuthorizationAction({ type: "click", x: 1281, y: 10 }),
    /outside/iu,
  );
  assert.throws(
    () => validateAuthorizationAction({ type: "drag", startX: -1, startY: 10, endX: 100, endY: 10 }),
    /outside/iu,
  );
  assert.throws(
    () => validateAuthorizationAction({ type: "type", text: "secret", extra: true }),
    /unknown field/iu,
  );
});
