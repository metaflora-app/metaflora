import { FundingError } from "./mcp.js";

const OPENROUTER_ORIGIN = "https://openrouter.ai";
const DEFAULT_CREDITS_URL = `${OPENROUTER_ORIGIN}/settings/credits`;
const MINIMUM_FUNDING_CENTS = 500;
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ADDRESS = /^0x[a-fA-F0-9]{40}$/u;
const HASH = /^0x[a-fA-F0-9]{64}$/u;
const PURCHASE_RESPONSE_PATH = /\/(?:api\/[^?#]*\/)?(?:credits?|checkout|purchase|payment)(?:\/|$)/iu;
const WALLET_ENROLLMENT_ACTION = "Open Credits → Auto Top Up → Crypto in the persistent browser, connect the intended USDC wallet, enable Save payment method, and complete the one-time save authorization; Auto Top Up may remain off.";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function operationKey(idempotencyKey) {
  return `openrouter-operation:${idempotencyKey}`;
}

function transactionKey(transactionId) {
  return `openrouter-transaction:${transactionId}`;
}

function exactMicrousd(value) {
  if (!["number", "string"].includes(typeof value)) return null;
  const normalized = String(value);
  if (!/^\d+(?:\.\d{1,6})?$/u.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const microusd = (Number(whole) * 1_000_000) + Number(fraction.padEnd(6, "0"));
  return Number.isSafeInteger(microusd) ? microusd : null;
}

function invoiceObject(value) {
  const queue = [value];
  const seen = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    if ((current.id || current.checkoutId || current.checkout_id)
      && (current.address || current.recipient || current.paymentAddress || current.payment_address)
      && (current.amount || current.total || current.amountUsdc || current.amount_usdc)) return current;
    queue.push(...Object.values(current));
  }
  return null;
}

export function parseOpenRouterDirectInvoice(value, { expectedPaymentUsdcMicros, creditMicrousd, nowMs = Date.now() } = {}) {
  const invoice = invoiceObject(value);
  const amount = exactMicrousd(invoice?.amount ?? invoice?.total ?? invoice?.amountUsdc ?? invoice?.amount_usdc);
  const invoiceId = String(invoice?.id ?? invoice?.checkoutId ?? invoice?.checkout_id ?? "").trim();
  const recipient = String(invoice?.address ?? invoice?.recipient ?? invoice?.paymentAddress ?? invoice?.payment_address ?? "");
  const currency = String(invoice?.currency ?? invoice?.asset ?? "").toUpperCase();
  const network = String(invoice?.network ?? invoice?.chain ?? "").toLowerCase();
  const token = String(invoice?.tokenAddress ?? invoice?.token_address ?? invoice?.contractAddress ?? invoice?.contract_address ?? "").toLowerCase();
  const expiresAt = String(invoice?.expiresAt ?? invoice?.expires_at ?? "");
  const expiresMs = Date.parse(expiresAt);
  let hostedUrl = null;
  try {
    const candidate = new URL(invoice?.url ?? invoice?.hostedUrl ?? invoice?.hosted_url ?? "");
    if (["commerce.coinbase.com", "pay.coinbase.com"].includes(candidate.hostname) && candidate.protocol === "https:") hostedUrl = candidate.href;
  } catch {}
  if (!Number.isSafeInteger(expectedPaymentUsdcMicros) || expectedPaymentUsdcMicros <= 0
    || !Number.isSafeInteger(creditMicrousd) || creditMicrousd < 5_000_000
    || !invoiceId || invoiceId.length > 180 || !ADDRESS.test(recipient)
    || amount !== expectedPaymentUsdcMicros || currency !== "USDC" || network !== "base"
    || token !== BASE_USDC.toLowerCase() || !Number.isFinite(expiresMs) || expiresMs <= nowMs + 30_000) {
    throw new FundingError("invoice_mismatch", "OpenRouter crypto invoice does not match the signed allocation", { externalChargeStarted: false });
  }
  return Object.freeze({ invoiceId, ...(hostedUrl ? { hostedUrl } : {}), recipient, amountUsdcMicros: amount, creditMicrousd, expiresAt });
}

export function parseOpenRouterCreditBalance(value) {
  const totalCreditsMicrousd = exactMicrousd(value?.data?.total_credits);
  const totalUsageMicrousd = exactMicrousd(value?.data?.total_usage);
  if (totalCreditsMicrousd === null || totalUsageMicrousd === null || totalUsageMicrousd > totalCreditsMicrousd) return null;
  return { balanceMicrousd: totalCreditsMicrousd - totalUsageMicrousd, currency: "USD" };
}

export function createOpenRouterCreditsReader({ managementKey, fetchImpl = globalThis.fetch } = {}) {
  const key = String(managementKey ?? "").trim();
  if (!key) return null;
  return async () => {
    const response = await fetchImpl(`${OPENROUTER_ORIGIN}/api/v1/credits`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${key}` }
    });
    if (!response?.ok) {
      throw new FundingError("balance_unavailable", "OpenRouter management credits lookup failed", { externalChargeStarted: false });
    }
    const parsed = parseOpenRouterCreditBalance(await response.json().catch(() => null));
    if (!parsed) throw new FundingError("balance_unavailable", "OpenRouter credits response cannot be represented exactly", { externalChargeStarted: false });
    return { ...parsed, source: "management_api" };
  };
}

function visible(locator) {
  return locator?.first().isVisible().catch(() => false) ?? false;
}

function parseUiBalance(text) {
  const match = String(text ?? "").replace(/,/gu, "").match(/(?:balance|credits?)[^$]{0,80}\$\s*(\d+(?:\.\d{1,6})?)/iu);
  if (!match) return null;
  const balanceMicrousd = exactMicrousd(match[1]);
  return balanceMicrousd === null ? null : { balanceMicrousd, currency: "USD", source: "authenticated_web_ui" };
}

export async function inspectOpenRouterCryptoEnrollment(page) {
  if (!page || typeof page.evaluate !== "function") {
    return { savedCryptoPaymentMethod: false, savePaymentMethodControl: false, autoTopUpEnabled: false };
  }
  const result = await page.evaluate(() => {
    const visible = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && !element.hidden;
    };
    const text = (element) => String(element?.textContent || "").replace(/\s+/gu, " ").trim();
    const elements = [...document.querySelectorAll("button, label, [role=button], [role=radio], [data-testid], [data-payment-method], [data-saved-payment-method]")]
      .filter(visible);
    const savedCryptoPaymentMethod = elements.some((element) => {
      const value = `${text(element)} ${element.getAttribute("data-testid") || ""} ${element.getAttribute("data-payment-method-type") || ""}`;
      const authoritativeState = /saved payment method|payment method saved|connected wallet|disconnect wallet|remove payment method|saved-crypto/iu.test(value)
        || (element.hasAttribute("data-saved-payment-method") && element.getAttribute("data-payment-method-type") === "crypto");
      return authoritativeState && /crypto|wallet|usdc|0x[a-f0-9]{4,}/iu.test(value);
    });
    const savePaymentMethodControl = elements.some((element) => /^save payment method$/iu.test(text(element)));
    const autoTopUpEnabled = [...document.querySelectorAll('input[type="checkbox"], [role="switch"]')]
      .filter(visible)
      .some((element) => {
        const containerText = text(element.closest("label, section, form, div"));
        const enabled = element.matches(":checked") || element.getAttribute("aria-checked") === "true";
        return enabled && /auto top up/iu.test(containerText);
      });
    return { savedCryptoPaymentMethod, savePaymentMethodControl, autoTopUpEnabled };
  }).catch(() => null);
  return {
    savedCryptoPaymentMethod: result?.savedCryptoPaymentMethod === true,
    savePaymentMethodControl: result?.savePaymentMethodControl === true,
    autoTopUpEnabled: result?.autoTopUpEnabled === true
  };
}

function isPurchaseResponse(response) {
  try {
    const url = new URL(response.url());
    return url.origin === OPENROUTER_ORIGIN && response.request().method() === "POST" && PURCHASE_RESPONSE_PATH.test(url.pathname);
  } catch { return false; }
}

function purchaseReference(value) {
  const source = value?.data ?? value;
  const transactionId = String(source?.transaction_id ?? source?.transactionId ?? source?.payment_id ?? source?.paymentId ?? "").trim();
  const status = String(source?.status ?? source?.state ?? "").trim().toLowerCase();
  return {
    ...(transactionId && transactionId.length <= 160 ? { transactionId } : {}),
    ...(status && status.length <= 80 ? { status } : {})
  };
}

async function firstVisible(page, selectors) {
  for (const selector of selectors) {
    const candidate = page.locator(selector).first();
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

export class OpenRouterBrowserManager {
  constructor({ context, creditsUrl = DEFAULT_CREDITS_URL, stateStore, managementKey = "", fetchImpl, liveChargingEnabled = false, transactionTimeoutMs = 180_000, pollIntervalMs = 2_500 } = {}) {
    this.context = context;
    this.creditsUrl = new URL(creditsUrl).href;
    if (new URL(this.creditsUrl).origin !== OPENROUTER_ORIGIN) throw new TypeError("OpenRouter credits URL is invalid");
    this.stateStore = stateStore;
    this.managementCreditsReader = createOpenRouterCreditsReader({ managementKey, fetchImpl });
    this.liveChargingEnabled = liveChargingEnabled === true;
    this.transactionTimeoutMs = transactionTimeoutMs;
    this.pollIntervalMs = pollIntervalMs;
    this.page = null;
    this.inFlight = new Map();
  }

  async start() {
    if (!this.context?.newPage) throw new Error("Shared persistent browser context is required");
    this.page = await this.context.newPage();
    await this.page.goto(this.creditsUrl, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null);
  }

  async status() {
    if (!this.page || this.page.isClosed?.()) {
      return {
        persistent: true, profileMode: "shared_persistent", authorization: "unknown",
        automation: "unavailable", walletEnrollment: "unknown", signer: "not_configured",
        balanceVerification: this.managementCreditsReader ? "management_api" : "authenticated_web_ui_required",
        inferenceKeyAcceptedForFunding: false, loginPerPayment: false,
        oneTimeUserAction: "Sign in to OpenRouter once in the persistent browser, then enroll the saved crypto payment method."
      };
    }
    let sameOrigin = false;
    try { sameOrigin = new URL(this.page.url()).origin === OPENROUTER_ORIGIN; } catch {}
    const loginVisible = await visible(this.page.getByRole("link", { name: /sign in|log in/iu }))
      || await visible(this.page.getByRole("button", { name: /sign in|log in/iu }));
    const creditsVisible = await visible(this.page.getByText(/buy credits|add credits|credit balance|remaining credits/iu));
    const authenticated = sameOrigin && !loginVisible && creditsVisible;
    const enrollment = authenticated
      ? await inspectOpenRouterCryptoEnrollment(this.page)
      : { savedCryptoPaymentMethod: false, savePaymentMethodControl: false, autoTopUpEnabled: false };
    const enrolled = enrollment.savedCryptoPaymentMethod;
    const cookies = this.context?.cookies ? await this.context.cookies(OPENROUTER_ORIGIN).catch(() => []) : [];
    return {
      persistent: true,
      profileMode: "shared_persistent",
      authorization: authenticated ? "authorized" : "required_once",
      automation: !authenticated
        ? "blocked_until_authorization"
        : !enrolled
          ? "blocked_until_wallet_enrollment"
          : this.liveChargingEnabled ? "ready" : "blocked_until_live_validation",
      directSettlementAutomation: !authenticated
        ? "blocked_until_authorization"
        : this.liveChargingEnabled ? "ready" : "blocked_until_live_validation",
      directSettlementFundingMethod: "fresh_crypto_invoice_per_sale",
      directSettlementRequiresSavedWallet: false,
      walletEnrollment: authenticated ? (enrolled ? "ready" : "required_once") : "unknown",
      signer: enrolled ? "openrouter_saved_crypto_method" : "not_configured",
      fundingMethod: enrolled ? "saved_crypto_wallet" : null,
      autoTopUp: enrollment.autoTopUpEnabled ? "enabled_fallback_only" : "disabled",
      savePaymentMethodControl: enrollment.savePaymentMethodControl,
      oneTimeUserAction: !authenticated
        ? "Sign in to OpenRouter once in the persistent browser, then enroll the saved crypto payment method."
        : enrolled ? null : WALLET_ENROLLMENT_ACTION,
      balanceVerification: this.managementCreditsReader ? "management_api" : authenticated ? "authenticated_web_ui" : "unavailable",
      inferenceKeyAcceptedForFunding: false,
      loginPerPayment: false,
      cookieCount: cookies.length,
      sessionCookieCount: cookies.filter((cookie) => Number(cookie.expires) <= 0).length
    };
  }

  async getBalance() {
    if (this.managementCreditsReader) {
      const balance = await this.managementCreditsReader();
      return { ...balance, balanceKopecks: Math.floor(balance.balanceMicrousd / 10_000) };
    }
    if (!this.page || this.page.isClosed?.()) {
      throw new FundingError("balance_unavailable", "OpenRouter authenticated credits page is unavailable", { externalChargeStarted: false });
    }
    let sameOrigin = false;
    try { sameOrigin = new URL(this.page.url()).origin === OPENROUTER_ORIGIN; } catch {}
    if (!sameOrigin) throw new FundingError("browser_authorization_required", "OpenRouter login is required", { userActionRequired: true, externalChargeStarted: false });
    const text = await this.page.locator("body").innerText({ timeout: 15_000 }).catch(() => "");
    const balance = parseUiBalance(text);
    if (!balance) throw new FundingError("balance_unavailable", "OpenRouter credit balance is unavailable", { externalChargeStarted: false });
    return { ...balance, balanceKopecks: Math.floor(balance.balanceMicrousd / 10_000) };
  }

  async verifyExactBalanceDelta({ beforeBalanceMicrousd, amountCents }) {
    if (!Number.isSafeInteger(beforeBalanceMicrousd) || !Number.isSafeInteger(amountCents) || amountCents <= 0) throw new TypeError("OpenRouter balance delta input is invalid");
    const after = await this.getBalance();
    const expectedAfterMicrousd = beforeBalanceMicrousd + (amountCents * 10_000);
    if (after.currency !== "USD" || after.balanceMicrousd !== expectedAfterMicrousd) {
      throw new FundingError("balance_delta_mismatch", "OpenRouter credit balance did not increase by the exact funded amount");
    }
    return { beforeBalanceMicrousd, afterBalanceMicrousd: after.balanceMicrousd, amountCents, currency: "USD" };
  }

  async verifyTransaction({ transactionId, expectedAmountKopecks, currency = "USD" }) {
    const id = String(transactionId ?? "").trim();
    const record = this.stateStore?.get(transactionKey(id));
    if (!id || record?.status !== "succeeded" || record.transactionId !== id
      || record.amountCents !== expectedAmountKopecks || currency !== "USD") {
      throw new FundingError("verification_failed", "OpenRouter transaction does not match the durable funding record");
    }
    return { transactionId: id, amountKopecks: expectedAmountKopecks, currency: "USD" };
  }

  async createDirectCryptoInvoice({ idempotencyKey, creditMicrousd, expectedPaymentUsdcMicros }) {
    const key = String(idempotencyKey ?? "").trim();
    if (!key || key.length > 255 || !Number.isSafeInteger(creditMicrousd) || creditMicrousd < 5_000_000
      || creditMicrousd % 10_000 !== 0 || !Number.isSafeInteger(expectedPaymentUsdcMicros)
      || expectedPaymentUsdcMicros < creditMicrousd || expectedPaymentUsdcMicros % 10_000 !== 0) {
      throw new TypeError("OpenRouter direct invoice request is invalid");
    }
    const durableKey = `openrouter-direct-invoice:${key}`;
    const previous = this.stateStore?.get(durableKey);
    if (previous && (previous.creditMicrousd !== creditMicrousd || previous.expectedPaymentUsdcMicros !== expectedPaymentUsdcMicros)) {
      throw new FundingError("idempotency_conflict", "OpenRouter direct invoice allocation does not match", { externalChargeStarted: false });
    }
    if (previous?.status === "invoice_created" && Date.parse(previous.expiresAt) > Date.now() + 30_000) return Object.freeze(previous.invoice);
    const readiness = await this.status();
    if (readiness.authorization !== "authorized") throw new FundingError("browser_authorization_required", "OpenRouter login is required", { userActionRequired: true, externalChargeStarted: false });
    if (!this.liveChargingEnabled) throw new FundingError("live_charging_disabled", "OpenRouter direct crypto funding is disabled", { externalChargeStarted: false });
    const before = await this.getBalance();
    const page = await this.context.newPage();
    let keepOpen = false;
    try {
      await page.goto(this.creditsUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
      const cryptoSwitch = page.locator("#use-crypto").first();
      if (!await cryptoSwitch.isVisible().catch(() => false)) {
        throw new FundingError("payment_control_missing", "OpenRouter crypto funding switch is unavailable", { externalChargeStarted: false });
      }
      if (await cryptoSwitch.getAttribute("aria-checked").catch(() => null) !== "true") {
        await cryptoSwitch.click();
      }
      const amountInput = await firstVisible(page, [
        'input[name="creditAmount"]'
      ]);
      if (!amountInput) throw new FundingError("payment_control_missing", "OpenRouter credit amount field is unavailable", { externalChargeStarted: false });
      await amountInput.fill((creditMicrousd / 1_000_000).toFixed(2));
      const submit = page.getByRole("button", { name: /purchase|buy credits|continue|pay with crypto/iu }).last();
      if (!await submit.isVisible().catch(() => false) || !await submit.isEnabled().catch(() => false)) {
        throw new FundingError("payment_control_missing", "OpenRouter direct crypto checkout control is unavailable", { externalChargeStarted: false });
      }
      await this.stateStore?.set(durableKey, {
        status: "invoice_request_started", creditMicrousd, expectedPaymentUsdcMicros,
        beforeBalanceMicrousd: before.balanceMicrousd, startedAt: new Date().toISOString()
      });
      const responsePromise = page.waitForResponse(isPurchaseResponse, { timeout: 30_000 }).catch(() => null);
      await submit.click();
      const response = await responsePromise;
      if (!response) { keepOpen = true; throw new FundingError("invoice_result_unknown", "OpenRouter direct crypto invoice response is unavailable"); }
      const invoice = parseOpenRouterDirectInvoice(await response.json().catch(() => null), {
        expectedPaymentUsdcMicros, creditMicrousd
      });
      await this.stateStore?.set(durableKey, {
        status: "invoice_created", creditMicrousd, expectedPaymentUsdcMicros,
        beforeBalanceMicrousd: before.balanceMicrousd, invoice, expiresAt: invoice.expiresAt
      });
      await this.stateStore?.set(`openrouter-direct-invoice-id:${invoice.invoiceId}`, { durableKey });
      return invoice;
    } finally {
      if (!keepOpen) await page.close().catch(() => null);
    }
  }

  async verifyDirectCryptoFunding({ invoiceId, transactionHash, creditMicrousd, paymentUsdcMicros }) {
    const id = String(invoiceId ?? "").trim();
    const hash = String(transactionHash ?? "").toLowerCase();
    if (!id || id.length > 180 || !HASH.test(hash) || !Number.isSafeInteger(creditMicrousd)
      || !Number.isSafeInteger(paymentUsdcMicros)) throw new TypeError("OpenRouter direct funding proof is invalid");
    const index = this.stateStore?.get(`openrouter-direct-invoice-id:${id}`);
    const durableKey = String(index?.durableKey ?? "");
    const record = durableKey ? this.stateStore?.get(durableKey) : null;
    if (!record || record?.invoice?.invoiceId !== id || record.creditMicrousd !== creditMicrousd
      || record.expectedPaymentUsdcMicros !== paymentUsdcMicros) {
      throw new FundingError("verification_failed", "OpenRouter invoice is not in the durable funding ledger");
    }
    const delta = await this.verifyExactBalanceDelta({ beforeBalanceMicrousd: record.beforeBalanceMicrousd, amountCents: creditMicrousd / 10_000 });
    const completed = { ...record, status: "succeeded", transactionHash: hash, transactionId: id, afterBalanceMicrousd: delta.afterBalanceMicrousd };
    await this.stateStore?.set(durableKey, completed);
    await this.stateStore?.set(transactionKey(id), { status: "succeeded", transactionId: id, amountCents: creditMicrousd / 10_000 });
    return Object.freeze({ transactionId: id });
  }

  async charge(request) {
    const key = String(request.idempotencyKey ?? "").trim();
    if (!key || key.length > 255) throw new TypeError("idempotencyKey is invalid");
    const amountCents = request.amountKopecks;
    if (!Number.isSafeInteger(amountCents) || amountCents < MINIMUM_FUNDING_CENTS) {
      throw new FundingError("invalid_amount", "OpenRouter funding requires at least 5 USD", { externalChargeStarted: false });
    }
    const active = this.inFlight.get(key);
    if (active) {
      if (active.amountCents !== amountCents) throw new FundingError("idempotency_conflict", "OpenRouter allocation amount does not match", { externalChargeStarted: false });
      return active.promise;
    }
    const promise = this.#charge({ amountCents, idempotencyKey: key });
    this.inFlight.set(key, { amountCents, promise });
    try { return await promise; } finally { this.inFlight.delete(key); }
  }

  async #charge({ amountCents, idempotencyKey }) {
    const durableKey = operationKey(idempotencyKey);
    const previous = this.stateStore?.get(durableKey);
    if (previous && previous.amountCents !== amountCents) {
      throw new FundingError("idempotency_conflict", "OpenRouter allocation amount does not match", { externalChargeStarted: false });
    }
    if (previous?.status === "succeeded") return { transactionId: previous.transactionId, amountKopecks: amountCents, currency: "USD" };
    if (previous?.status === "challenge") throw new FundingError("payment_confirmation_required", "OpenRouter wallet confirmation is unresolved", { userActionRequired: true });
    if (previous?.status === "submission_started") throw new FundingError("charge_result_unknown", "Previous OpenRouter credit purchase is unresolved");
    const readiness = await this.status();
    if (readiness.authorization !== "authorized") throw new FundingError("browser_authorization_required", "OpenRouter login is required", { userActionRequired: true, externalChargeStarted: false });
    if (readiness.walletEnrollment !== "ready") {
      throw new FundingError("wallet_enrollment_required", "OpenRouter requires a saved crypto payment method", { userActionRequired: true, externalChargeStarted: false });
    }
    if (!this.liveChargingEnabled) {
      throw new FundingError("live_charging_disabled", "OpenRouter live charging is disabled until the saved crypto flow is validated", { externalChargeStarted: false });
    }
    return this.#executeSavedCryptoPurchase({ amountCents, durableKey });
  }

  async #executeSavedCryptoPurchase({ amountCents, durableKey }) {
    const before = await this.getBalance();
    const chargePage = await this.context.newPage();
    let keepOpen = false;
    const startedAt = new Date().toISOString();
    try {
      await chargePage.goto(this.creditsUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
      const buyButton = chargePage.getByRole("button", { name: /buy credits|add credits/iu }).first();
      if (!await buyButton.isVisible().catch(() => false)) throw new FundingError("payment_control_missing", "OpenRouter Buy Credits control is unavailable", { externalChargeStarted: false });
      await buyButton.click();
      const cryptoTab = chargePage.getByRole("tab", { name: /crypto|usdc/iu }).first();
      const cryptoButton = chargePage.getByRole("button", { name: /crypto|usdc/iu }).first();
      const cryptoControl = await cryptoTab.isVisible().catch(() => false) ? cryptoTab : cryptoButton;
      if (!await cryptoControl.isVisible().catch(() => false)) throw new FundingError("payment_control_missing", "OpenRouter crypto funding tab is unavailable", { externalChargeStarted: false });
      await cryptoControl.click();
      const enrollment = await inspectOpenRouterCryptoEnrollment(chargePage);
      if (!enrollment.savedCryptoPaymentMethod) throw new FundingError("wallet_enrollment_required", "The saved OpenRouter crypto method is unavailable in checkout", { userActionRequired: true, externalChargeStarted: false });
      const amountInput = await firstVisible(chargePage, [
        'input[name="amount"]', 'input[inputmode="decimal"]', 'input[type="number"]', 'input[placeholder*="$5"]'
      ]);
      if (!amountInput) throw new FundingError("payment_control_missing", "OpenRouter credit amount field is unavailable", { externalChargeStarted: false });
      await amountInput.fill((amountCents / 100).toFixed(2));
      const submitButton = chargePage.getByRole("button", { name: /buy credits|pay.*usdc|purchase credits|continue/iu }).last();
      if (!await submitButton.isVisible().catch(() => false) || !await submitButton.isEnabled().catch(() => false)) {
        throw new FundingError("payment_control_missing", "OpenRouter saved-crypto purchase control is unavailable", { externalChargeStarted: false });
      }
      await this.stateStore?.set(durableKey, {
        status: "submission_started", startedAt, amountCents, beforeBalanceMicrousd: before.balanceMicrousd,
        route: "openrouter_saved_crypto_web"
      });
      const responsePromise = chargePage.waitForResponse(isPurchaseResponse, { timeout: 20_000 }).catch(() => null);
      await submitButton.click();
      const response = await responsePromise;
      const reference = purchaseReference(response ? await response.json().catch(() => null) : null);
      await this.stateStore?.set(durableKey, {
        status: "submission_started", startedAt, amountCents, beforeBalanceMicrousd: before.balanceMicrousd,
        ...(reference.transactionId ? { transactionId: reference.transactionId } : {}),
        ...(reference.status ? { providerStatus: reference.status } : {}),
        route: "openrouter_saved_crypto_web"
      });
      const deadline = Date.now() + this.transactionTimeoutMs;
      while (Date.now() < deadline) {
        const challenge = await visible(chargePage.getByText(/confirm in wallet|wallet confirmation|sign (?:the )?transaction|verification required|challenge/iu));
        if (challenge) {
          keepOpen = true;
          await this.stateStore?.set(durableKey, {
            status: "challenge", startedAt, amountCents, beforeBalanceMicrousd: before.balanceMicrousd,
            ...(reference.transactionId ? { transactionId: reference.transactionId } : {}),
            ...(reference.status ? { providerStatus: reference.status } : {}),
            route: "openrouter_saved_crypto_web"
          });
          throw new FundingError("payment_confirmation_required", "Manual OpenRouter wallet confirmation is required", { userActionRequired: true });
        }
        if (reference.transactionId) {
          try {
            await this.verifyExactBalanceDelta({ beforeBalanceMicrousd: before.balanceMicrousd, amountCents });
            const completed = {
              status: "succeeded", startedAt, amountCents, beforeBalanceMicrousd: before.balanceMicrousd,
              transactionId: reference.transactionId, providerStatus: reference.status || "balance_verified",
              route: "openrouter_saved_crypto_web"
            };
            await this.stateStore?.set(durableKey, completed);
            await this.stateStore?.set(transactionKey(reference.transactionId), completed);
            return { transactionId: reference.transactionId, amountKopecks: amountCents, currency: "USD" };
          } catch (error) {
            if (error?.code !== "balance_delta_mismatch") throw error;
          }
        }
        await delay(this.pollIntervalMs);
      }
      keepOpen = true;
      throw new FundingError("charge_result_unknown", "OpenRouter credit purchase could not be verified");
    } finally {
      if (!keepOpen) await chargePage.close().catch(() => null);
    }
  }
}
