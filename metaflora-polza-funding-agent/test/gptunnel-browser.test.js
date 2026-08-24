import test from "node:test";
import assert from "node:assert/strict";
import {
  GptunnelBrowserManager,
  prepareGptunnelCardPayment,
  submitGptunnelCardPayment,
  isGptunnelPaymentCreationResponse,
  extractPaymentReference,
  parseRublesToKopecks
} from "../src/gptunnel-browser.js";

test("parses the GPTunnel profile balance without losing kopecks", () => {
  assert.equal(parseRublesToKopecks("1 234,56 ₽"), 123456);
  assert.equal(parseRublesToKopecks("0 ₽"), 0);
  assert.equal(parseRublesToKopecks("нет суммы"), null);
});

test("extracts only the payment reference fields needed for idempotent verification", () => {
  assert.deepEqual(extractPaymentReference({
    result: { data: { orderId: "order-52", redirectUrl: "https://securepay.tinkoff.ru/one" } },
    token: "must-not-leak"
  }), {
    orderId: "order-52",
    redirectUrl: "https://securepay.tinkoff.ru/one"
  });
});

test("matches only the GPTunnel payment-creation API, not analytics payment events", () => {
  assert.equal(isGptunnelPaymentCreationResponse("https://gptunnel.ru/trpc/user.pay?batch=1"), true);
  assert.equal(isGptunnelPaymentCreationResponse("https://mc.yandex.com/watch/paymentStart"), false);
  assert.equal(isGptunnelPaymentCreationResponse("https://gptunnel.ru/t/e"), false);
});

test("rejects GPTunnel funding below the configured 52-ruble obligation before navigation", async () => {
  const manager = new GptunnelBrowserManager({
    context: { newPage: async () => { throw new Error("must not navigate"); } },
    profileUrl: "https://gptunnel.ru/profile",
    stateStore: { get: () => null }
  });
  manager.status = async () => ({ authorization: "authorized" });
  await assert.rejects(
    () => manager.charge({ amountKopecks: 5199, idempotencyKey: "small" }),
    (error) => error.code === "invalid_amount" && error.externalChargeStarted === false
  );
});

test("returns and verifies an already completed GPTunnel charge without opening a page", async () => {
  let pageCalls = 0;
  const records = new Map([
    ["same", { status: "succeeded", transactionId: "order-52", amountKopecks: 5200 }],
    ["gptunnel-transaction:order-52", { status: "succeeded", transactionId: "order-52", amountKopecks: 5200 }]
  ]);
  const manager = new GptunnelBrowserManager({
    context: { newPage: async () => { pageCalls += 1; } },
    profileUrl: "https://gptunnel.ru/profile",
    stateStore: { get: (key) => records.get(key) }
  });
  manager.status = async () => ({ authorization: "authorized" });

  assert.deepEqual(await manager.charge({ amountKopecks: 5200, idempotencyKey: "same" }), {
    transactionId: "order-52", amountKopecks: 5200, currency: "RUB"
  });
  assert.deepEqual(await manager.verifyTransaction({
    transactionId: "order-52", expectedAmountKopecks: 5200, currency: "RUB"
  }), { transactionId: "order-52", amountKopecks: 5200, currency: "RUB" });
  assert.equal(pageCalls, 0);
});

test("an unresolved submitted GPTunnel payment is never charged twice", async () => {
  const manager = new GptunnelBrowserManager({
    context: { newPage: async () => { throw new Error("must not open another checkout"); } },
    profileUrl: "https://gptunnel.ru/profile",
    stateStore: {
      get: () => ({ status: "submission_started", amountKopecks: 5200, transactionId: "order-pending" })
    }
  });
  manager.status = async () => ({ authorization: "authorized" });
  await assert.rejects(
    () => manager.charge({ amountKopecks: 5200, idempotencyKey: "pending" }),
    (error) => error.code === "charge_result_unknown"
  );
});

test("readiness polling never navigates away from an in-progress GPTunnel login", async () => {
  let navigations = 0;
  const hidden = { first() { return this; }, isVisible: async () => false };
  const manager = new GptunnelBrowserManager({
    context: {}, profileUrl: "https://gptunnel.ru/profile", stateStore: null
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://gptunnel.ru/auth/sign-in",
    goto: async () => { navigations += 1; },
    getByRole: () => hidden
  };

  const status = await manager.status();

  assert.equal(navigations, 0);
  assert.equal(status.authorization, "required_once");
});

test("an authorized GPTunnel session stays blocked until its own merchant card is verified", async () => {
  const visible = { first() { return this; }, isVisible: async () => true };
  const hidden = { first() { return this; }, isVisible: async () => false };
  const manager = new GptunnelBrowserManager({
    context: {},
    profileUrl: "https://gptunnel.ru/profile",
    stateStore: { get: () => null }
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://gptunnel.ru/profile",
    getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible
  };
  manager.readRecurringSettings = async () => ({
    thresholdAmount: 50,
    chargeAmount: 500,
    methods: [],
    recurringMethodId: null
  });

  const status = await manager.status();

  assert.equal(status.authorization, "authorized");
  assert.equal(status.automation, "blocked_until_card_enrollment");
  assert.equal(status.cardEnrollment, "required_once");
  assert.equal(status.recurringMethodCount, 0);
  assert.equal(status.fundingMethod, null);
});

test("a stale local enrollment marker never reports GPTunnel recurring as ready", async () => {
  const visible = { first() { return this; }, isVisible: async () => true };
  const hidden = { first() { return this; }, isVisible: async () => false };
  const manager = new GptunnelBrowserManager({
    context: {},
    profileUrl: "https://gptunnel.ru/profile",
    stateStore: { get: () => ({ status: "ready" }) }
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://gptunnel.ru/profile",
    getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible
  };
  manager.readRecurringSettings = async () => ({ methods: [], recurringMethodId: null });

  const status = await manager.status();

  assert.equal(status.automation, "blocked_until_card_enrollment");
  assert.equal(status.cardEnrollment, "required_once");
});

test("reports ready only for an authoritative selected card recurring method", async () => {
  const visible = { first() { return this; }, isVisible: async () => true };
  const hidden = { first() { return this; }, isVisible: async () => false };
  const manager = new GptunnelBrowserManager({ context: {}, profileUrl: "https://gptunnel.ru/profile" });
  manager.page = {
    isClosed: () => false,
    url: () => "https://gptunnel.ru/profile",
    getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible
  };
  manager.readRecurringSettings = async () => ({
    methods: [{ id: "card-one", type: "card", maskedPan: "****0207" }],
    recurringMethodId: "card-one"
  });

  const status = await manager.status();

  assert.equal(status.automation, "ready");
  assert.equal(status.cardEnrollment, "ready");
  assert.equal(status.fundingMethod, "card_recurring");
});

test("does not mistake a selected SBP recurring account for a chargeable card", async () => {
  const visible = { first() { return this; }, isVisible: async () => true };
  const hidden = { first() { return this; }, isVisible: async () => false };
  const manager = new GptunnelBrowserManager({ context: {}, profileUrl: "https://gptunnel.ru/profile" });
  manager.page = {
    isClosed: () => false,
    url: () => "https://gptunnel.ru/profile",
    getByRole: (_role, options) => options.name.source.includes("войти") ? hidden : visible
  };
  manager.readRecurringSettings = async () => ({
    methods: [{ id: "sbp-one", type: "fps", provider: "tbank", bank: { name: "T-Bank" } }],
    recurringMethodId: "sbp-one"
  });

  const status = await manager.status();

  assert.equal(status.automation, "blocked_until_card_enrollment");
  assert.equal(status.fundingMethod, "sbp_recurring");
});

test("reads the authoritative recurring settings through the authenticated page", async () => {
  const manager = new GptunnelBrowserManager({ context: {}, profileUrl: "https://gptunnel.ru/profile" });
  manager.page = {
    isClosed: () => false,
    evaluate: async (_callback, path) => {
      assert.match(path, /getRecurringSettings/);
      return {
        httpStatus: 200,
        body: { result: { data: { thresholdAmount: 50, chargeAmount: 500, methods: [], recurringMethodId: null } } }
      };
    }
  };

  assert.deepEqual(await manager.readRecurringSettings(), {
    thresholdAmount: 50,
    chargeAmount: 500,
    methods: [],
    recurringMethodId: null
  });
});

test("opens the GPTunnel method picker before selecting card payment", async () => {
  const calls = [];
  const amountInput = { fill: async (value) => calls.push(["amount", value]) };
  const methodLabel = {
    locator: (selector) => {
      assert.equal(selector, "..");
      return { click: async () => calls.push(["open-method-picker"]) };
    }
  };
  const cardMethod = {
    waitFor: async () => calls.push(["wait-card"]),
    isVisible: async () => true,
    click: async () => calls.push(["select-card"])
  };
  const page = {
    getByText: (pattern) => pattern.source.includes("Метод оплаты")
      ? { last: () => methodLabel }
      : { last: () => cardMethod }
  };

  await prepareGptunnelCardPayment(page, amountInput, 5200);

  assert.deepEqual(calls, [
    ["amount", "52"],
    ["open-method-picker"],
    ["wait-card"],
    ["select-card"]
  ]);
});

test("rebuilds and resubmits the GPTunnel card paywall after first-country confirmation", async () => {
  const calls = [];
  const countryConfirm = {
    waitFor: async () => calls.push("wait-country"),
    isVisible: async () => true,
    click: async () => calls.push("confirm-country")
  };
  const retryButton = {
    isVisible: async () => true,
    isEnabled: async () => true,
    click: async () => calls.push("retry-payment")
  };
  const page = {
    getByRole: (_role, options) => options.name.source.includes("подтвердить")
      ? { last: () => countryConfirm }
      : { last: () => retryButton }
  };
  const createButton = { click: async () => calls.push("create-payment") };
  const amountInput = { waitFor: async () => calls.push("wait-amount") };
  const prepare = async () => calls.push("prepare-card-payment");

  await submitGptunnelCardPayment({
    page, amountInput, amountKopecks: 5200, createButton, prepare
  });

  assert.deepEqual(calls, [
    "create-payment",
    "wait-country",
    "confirm-country",
    "wait-amount",
    "prepare-card-payment",
    "retry-payment"
  ]);
});
