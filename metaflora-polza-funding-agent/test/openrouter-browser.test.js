import test from "node:test";
import assert from "node:assert/strict";
import {
  OpenRouterBrowserManager,
  createOpenRouterCreditsReader,
  inspectOpenRouterCryptoEnrollment,
  parseOpenRouterDirectInvoice,
  parseOpenRouterCreditBalance
} from "../src/openrouter-browser.js";

function hiddenLocator() {
  return { first() { return this; }, async isVisible() { return false; }, async innerText() { return ""; } };
}

test("parses OpenRouter credit totals without discarding sub-cent usage", () => {
  assert.deepEqual(parseOpenRouterCreditBalance({ data: { total_credits: 25.5, total_usage: 4.250001 } }), {
    balanceMicrousd: 21249999, currency: "USD"
  });
  assert.equal(parseOpenRouterCreditBalance({ data: { total_credits: 1, total_usage: 1.000001 } }), null);
});

test("accepts only an exact OpenRouter Coinbase Base USDC invoice", () => {
  const expiresAt = new Date(Date.now() + 300_000).toISOString();
  assert.deepEqual(parseOpenRouterDirectInvoice({ data: { checkout: {
    id: "cb-checkout-1", url: "https://commerce.coinbase.com/pay/cb-checkout-1",
    amount: "5.25", currency: "USDC", network: "base",
    address: `0x${"2".repeat(40)}`, tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", expiresAt
  } } }, { expectedPaymentUsdcMicros: 5_250_000, creditMicrousd: 5_000_000, nowMs: Date.now() }), {
    invoiceId: "cb-checkout-1", hostedUrl: "https://commerce.coinbase.com/pay/cb-checkout-1",
    recipient: `0x${"2".repeat(40)}`, amountUsdcMicros: 5_250_000,
    creditMicrousd: 5_000_000, expiresAt
  });
  assert.throws(() => parseOpenRouterDirectInvoice({ id: "x", amount: "5.24", currency: "USDC", network: "base",
    address: `0x${"2".repeat(40)}`, tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", expiresAt },
  { expectedPaymentUsdcMicros: 5_250_000, creditMicrousd: 5_000_000, nowMs: Date.now() }), /invoice/i);
});

test("direct crypto invoice follows the live Credits switch and creditAmount controls", async () => {
  const events = [];
  const records = new Map();
  const expiresAt = new Date(Date.now() + 300_000).toISOString();
  const hidden = { first() { return this; }, async isVisible() { return false; } };
  const cryptoSwitch = {
    first() { return this; },
    async isVisible() { return true; },
    async getAttribute(name) { return name === "aria-checked" ? "false" : null; },
    async click() { events.push("crypto-switch"); }
  };
  const amount = {
    first() { return this; },
    async isVisible() { return true; },
    async fill(value) { events.push(`amount:${value}`); }
  };
  const purchase = {
    last() { return this; },
    async isVisible() { return true; },
    async isEnabled() { return true; },
    async click() { events.push("purchase"); }
  };
  const page = {
    async goto() {},
    locator(selector) {
      if (selector === "#use-crypto") return cryptoSwitch;
      if (selector === 'input[name="creditAmount"]') return amount;
      return hidden;
    },
    getByRole(role, { name }) {
      if (role === "button" && /purchase/iu.test(name.source)) return purchase;
      return hidden;
    },
    async waitForResponse(predicate) {
      const response = {
        url: () => "https://openrouter.ai/api/v1/credits/purchase",
        request: () => ({ method: () => "POST" }),
        json: async () => ({ data: { checkout: {
          id: "direct-checkout-1", amount: "5.25", currency: "USDC", network: "base",
          address: `0x${"2".repeat(40)}`, tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", expiresAt
        } } })
      };
      assert.equal(predicate(response), true);
      return response;
    },
    async close() { events.push("close"); }
  };
  const manager = new OpenRouterBrowserManager({
    context: { newPage: async () => page },
    stateStore: {
      get: (key) => records.get(key),
      async set(key, value) { records.set(key, value); }
    },
    liveChargingEnabled: true
  });
  manager.status = async () => ({ authorization: "authorized" });
  manager.getBalance = async () => ({ balanceMicrousd: 10_000_000, currency: "USD" });

  const invoice = await manager.createDirectCryptoInvoice({
    idempotencyKey: "mfc_0123456789abcdef0123456789abcdef",
    creditMicrousd: 5_000_000,
    expectedPaymentUsdcMicros: 5_250_000
  });

  assert.equal(invoice.invoiceId, "direct-checkout-1");
  assert.deepEqual(events.slice(0, 3), ["crypto-switch", "amount:5.00", "purchase"]);
});

test("the credits API reader requires a separate management key", async () => {
  const calls = [];
  const reader = createOpenRouterCreditsReader({
    managementKey: "management-secret",
    fetchImpl: async (url, init) => {
      calls.push({ url, authorization: init.headers.Authorization });
      return { ok: true, json: async () => ({ data: { total_credits: 10, total_usage: 2.5 } }) };
    }
  });
  assert.deepEqual(await reader(), { balanceMicrousd: 7500000, currency: "USD", source: "management_api" });
  assert.deepEqual(calls, [{ url: "https://openrouter.ai/api/v1/credits", authorization: "Bearer management-secret" }]);
  assert.equal(createOpenRouterCreditsReader({ managementKey: "" }), null);
});

test("the management balance reader fails closed on an unauthorized response", async () => {
  const reader = createOpenRouterCreditsReader({ managementKey: "management-secret", fetchImpl: async () => ({ ok: false }) });
  await assert.rejects(() => reader(), (error) => error.code === "balance_unavailable" && error.externalChargeStarted === false);
});

test("starts on the OpenRouter credits page inside the shared persistent context", async () => {
  const navigations = [];
  const page = { async goto(url, options) { navigations.push({ url, options }); } };
  const manager = new OpenRouterBrowserManager({ context: { newPage: async () => page }, stateStore: null });
  await manager.start();
  assert.equal(manager.page, page);
  assert.deepEqual(navigations, [{ url: "https://openrouter.ai/settings/credits", options: { waitUntil: "domcontentloaded", timeout: 45000 } }]);
});

test("closed OpenRouter pages report unavailable without implying wallet readiness", async () => {
  const manager = new OpenRouterBrowserManager({ context: {}, stateStore: null, managementKey: "management-secret" });
  manager.page = { isClosed: () => true };
  const readiness = await manager.status();
  assert.equal(readiness.automation, "unavailable");
  assert.equal(readiness.signer, "not_configured");
  assert.equal(readiness.balanceVerification, "management_api");
});

test("Auto Top Up alone never counts as a saved crypto payment method", async () => {
  const enrollment = await inspectOpenRouterCryptoEnrollment({
    evaluate: async () => ({ savedCryptoPaymentMethod: false, savePaymentMethodControl: true, autoTopUpEnabled: true })
  });
  assert.deepEqual(enrollment, {
    savedCryptoPaymentMethod: false,
    savePaymentMethodControl: true,
    autoTopUpEnabled: true
  });
});

test("recognizes only an authoritative saved crypto payment method probe", async () => {
  assert.deepEqual(await inspectOpenRouterCryptoEnrollment({
    evaluate: async () => ({ savedCryptoPaymentMethod: true, savePaymentMethodControl: false, autoTopUpEnabled: false })
  }), { savedCryptoPaymentMethod: true, savePaymentMethodControl: false, autoTopUpEnabled: false });
});

test("readiness stays blocked when Auto Top Up is on but no crypto method is saved", async () => {
  const manager = new OpenRouterBrowserManager({ context: { cookies: async () => [] }, stateStore: null, liveChargingEnabled: true });
  manager.page = {
    isClosed: () => false,
    url: () => "https://openrouter.ai/settings/credits",
    getByRole: () => hiddenLocator(),
    getByText: () => ({ ...hiddenLocator(), async isVisible() { return true; } }),
    evaluate: async () => ({ savedCryptoPaymentMethod: false, savePaymentMethodControl: true, autoTopUpEnabled: true })
  };
  const readiness = await manager.status();
  assert.equal(readiness.automation, "blocked_until_wallet_enrollment");
  assert.equal(readiness.directSettlementAutomation, "ready");
  assert.equal(readiness.walletEnrollment, "required_once");
  assert.equal(readiness.autoTopUp, "enabled_fallback_only");
  assert.equal(readiness.savePaymentMethodControl, true);
  assert.match(readiness.oneTimeUserAction, /Credits → Auto Top Up → Crypto/iu);
  assert.match(readiness.oneTimeUserAction, /Auto Top Up may remain off/iu);
});

test("direct settlement stays ready when OpenRouter Auto Top Up is off and no saved wallet is enrolled", async () => {
  const manager = new OpenRouterBrowserManager({
    context: { cookies: async () => [] },
    stateStore: null,
    liveChargingEnabled: true
  });
  manager.page = {
    isClosed: () => false,
    url: () => "https://openrouter.ai/settings/credits",
    getByRole: () => hiddenLocator(),
    getByText: () => ({ ...hiddenLocator(), async isVisible() { return true; } }),
    evaluate: async () => ({ savedCryptoPaymentMethod: false, savePaymentMethodControl: true, autoTopUpEnabled: false })
  };

  const readiness = await manager.status();
  assert.equal(readiness.authorization, "authorized");
  assert.equal(readiness.automation, "blocked_until_wallet_enrollment");
  assert.equal(readiness.directSettlementAutomation, "ready");
  assert.equal(readiness.directSettlementFundingMethod, "fresh_crypto_invoice_per_sale");
  assert.equal(readiness.autoTopUp, "disabled");
  assert.equal(readiness.directSettlementRequiresSavedWallet, false);
});

test("readiness never treats an inference API key as a funding credential", async () => {
  const manager = new OpenRouterBrowserManager({ context: { cookies: async () => [] }, stateStore: null, inferenceApiKey: "sk-or-v1-must-be-ignored" });
  manager.page = {
    isClosed: () => false,
    url: () => "https://openrouter.ai/settings/credits",
    getByRole: () => hiddenLocator(),
    getByText: () => ({ ...hiddenLocator(), async isVisible() { return true; } })
  };
  const readiness = await manager.status();
  assert.equal(readiness.authorization, "authorized");
  assert.equal(readiness.automation, "blocked_until_wallet_enrollment");
  assert.equal(readiness.walletEnrollment, "required_once");
  assert.equal(readiness.inferenceKeyAcceptedForFunding, false);
});

test("rejects funding below five dollars before browser or balance access", async () => {
  const manager = new OpenRouterBrowserManager({ context: { newPage: async () => { throw new Error("must not open checkout"); } }, stateStore: { get: () => null } });
  manager.getBalance = async () => { throw new Error("must not read balance"); };
  await assert.rejects(() => manager.charge({ amountKopecks: 499, idempotencyKey: "sale:small" }), (error) => error.code === "invalid_amount" && error.externalChargeStarted === false);
});

test("idempotency is provider-scoped and conflicts fail closed", async () => {
  const records = new Map([["openrouter-operation:sale:one", { status: "succeeded", transactionId: "credit-1", amountCents: 500 }]]);
  const manager = new OpenRouterBrowserManager({ context: {}, stateStore: { get: (key) => records.get(key) } });
  assert.deepEqual(await manager.charge({ amountKopecks: 500, idempotencyKey: "sale:one" }), { transactionId: "credit-1", amountKopecks: 500, currency: "USD" });
  await assert.rejects(() => manager.charge({ amountKopecks: 600, idempotencyKey: "sale:one" }), (error) => error.code === "idempotency_conflict" && error.externalChargeStarted === false);
});

test("funding remains blocked until a server signer or wallet is enrolled", async () => {
  let opened = 0;
  const manager = new OpenRouterBrowserManager({ context: { newPage: async () => { opened += 1; } }, stateStore: { get: () => null } });
  manager.status = async () => ({ authorization: "authorized", automation: "blocked_until_wallet_enrollment" });
  await assert.rejects(() => manager.charge({ amountKopecks: 500, idempotencyKey: "sale:blocked" }), (error) => error.code === "wallet_enrollment_required" && error.userActionRequired === true && error.externalChargeStarted === false);
  assert.equal(opened, 0);
});

test("a saved wallet stays non-chargeable while the explicit live kill switch is off", async () => {
  let opened = 0;
  const manager = new OpenRouterBrowserManager({
    context: { newPage: async () => { opened += 1; } }, stateStore: { get: () => null }, liveChargingEnabled: false
  });
  manager.status = async () => ({ authorization: "authorized", walletEnrollment: "ready", automation: "blocked_until_live_validation" });
  await assert.rejects(() => manager.charge({ amountKopecks: 500, idempotencyKey: "sale:killed" }), (error) => error.code === "live_charging_disabled" && error.externalChargeStarted === false);
  assert.equal(opened, 0);
});

test("live saved-crypto flow persists submission before clicking and requires exact balance growth", async () => {
  const events = [];
  const writtenStates = [];
  const records = new Map();
  const control = (name) => ({
    first() { return this; }, last() { return this; },
    async isVisible() { return true; }, async isEnabled() { return true; },
    async click() { events.push(`click:${name}`); }, async fill(value) { events.push(`fill:${value}`); }
  });
  const chargePage = {
    async goto() {},
    getByRole(role, { name }) {
      if (role === "button" && /buy credits|add credits/iu.test(name.source)) return control("buy-or-submit");
      if (role === "tab") return control("crypto-tab");
      return control("other");
    },
    getByText() { return hiddenLocator(); },
    locator() { return control("amount"); },
    evaluate: async () => ({ savedCryptoPaymentMethod: true, savePaymentMethodControl: false, autoTopUpEnabled: false }),
    waitForResponse: async (predicate) => {
      const response = {
        url: () => "https://openrouter.ai/api/v1/credits/purchase",
        request: () => ({ method: () => "POST" }),
        json: async () => ({ data: { transaction_id: "crypto-purchase-1", status: "completed" } })
      };
      assert.equal(predicate(response), true);
      return response;
    },
    async close() { events.push("close"); }
  };
  const manager = new OpenRouterBrowserManager({
    context: { newPage: async () => chargePage },
    stateStore: {
      get: (key) => records.get(key),
      async set(key, value) { records.set(key, value); writtenStates.push(value); events.push(`state:${value.status}`); }
    },
    liveChargingEnabled: true,
    transactionTimeoutMs: 50,
    pollIntervalMs: 1
  });
  manager.status = async () => ({ authorization: "authorized", walletEnrollment: "ready", automation: "ready" });
  const balances = [
    { balanceMicrousd: 10_000_000, currency: "USD" },
    { balanceMicrousd: 15_000_000, currency: "USD" }
  ];
  manager.getBalance = async () => balances.shift();

  assert.deepEqual(await manager.charge({ amountKopecks: 500, idempotencyKey: "sale:live" }), {
    transactionId: "crypto-purchase-1", amountKopecks: 500, currency: "USD"
  });
  assert.ok(events.indexOf("state:submission_started") < events.lastIndexOf("click:buy-or-submit"));
  assert.ok(writtenStates.some((value) => value.status === "submission_started" && value.providerStatus === "completed"));
  assert.equal(records.get("openrouter-operation:sale:live").status, "succeeded");
  assert.equal(records.get("openrouter-operation:sale:live").providerStatus, "completed");
  assert.equal(records.get("openrouter-transaction:crypto-purchase-1").status, "succeeded");
});

test("verification requires an exact credit balance delta", async () => {
  const balances = [{ balanceMicrousd: 14999999, currency: "USD" }, { balanceMicrousd: 15000000, currency: "USD" }];
  const manager = new OpenRouterBrowserManager({ context: {}, stateStore: null });
  manager.getBalance = async () => balances.shift();
  await assert.rejects(() => manager.verifyExactBalanceDelta({ beforeBalanceMicrousd: 10000000, amountCents: 500 }), (error) => error.code === "balance_delta_mismatch");
  assert.deepEqual(await manager.verifyExactBalanceDelta({ beforeBalanceMicrousd: 10000000, amountCents: 500 }), { beforeBalanceMicrousd: 10000000, afterBalanceMicrousd: 15000000, amountCents: 500, currency: "USD" });
});

test("reads a sub-cent balance from the authenticated credits UI when no management key exists", async () => {
  const manager = new OpenRouterBrowserManager({ context: {}, stateStore: null });
  manager.page = {
    isClosed: () => false,
    url: () => "https://openrouter.ai/settings/credits",
    locator: () => ({ innerText: async () => "Credits balance $12.345678" })
  };
  assert.deepEqual(await manager.getBalance(), {
    balanceMicrousd: 12345678,
    balanceKopecks: 1234,
    currency: "USD",
    source: "authenticated_web_ui"
  });
});

test("verifies only provider-scoped successful durable OpenRouter transactions", async () => {
  const record = { status: "succeeded", transactionId: "credit-verified", amountCents: 500 };
  const manager = new OpenRouterBrowserManager({ context: {}, stateStore: { get: (key) => key === "openrouter-transaction:credit-verified" ? record : null } });
  assert.deepEqual(await manager.verifyTransaction({ transactionId: "credit-verified", expectedAmountKopecks: 500 }), {
    transactionId: "credit-verified", amountKopecks: 500, currency: "USD"
  });
  await assert.rejects(() => manager.verifyTransaction({ transactionId: "credit-verified", expectedAmountKopecks: 501 }), (error) => error.code === "verification_failed");
});

test("challenge and unknown submitted results remain unresolved", async () => {
  const records = new Map([
    ["openrouter-operation:challenge", { status: "challenge", amountCents: 500 }],
    ["openrouter-operation:unknown", { status: "submission_started", amountCents: 500 }]
  ]);
  const manager = new OpenRouterBrowserManager({ context: {}, stateStore: { get: (key) => records.get(key) } });
  await assert.rejects(() => manager.charge({ amountKopecks: 500, idempotencyKey: "challenge" }), (error) => error.code === "payment_confirmation_required" && error.userActionRequired === true);
  await assert.rejects(() => manager.charge({ amountKopecks: 500, idempotencyKey: "unknown" }), (error) => error.code === "charge_result_unknown");
});
