import { FundingError } from "./mcp.js";

const SUCCESS_STATUSES = /^(?:authorized|confirmed|complete|paid|paid_over|wrong_amount)$/iu;
const FAILURE_STATUSES = /^(?:failed|declined|cancelled|canceled|error|not_paid)$/iu;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseRublesToKopecks(value) {
  const match = String(value ?? "").replace(/\u00a0/gu, " ").match(/(\d[\d ]*)(?:[,.](\d{1,2}))?\s*₽/u);
  if (!match) return null;
  const rubles = Number(match[1].replace(/\s/gu, ""));
  const kopecks = Number(String(match[2] ?? "").padEnd(2, "0") || "0");
  return Number.isSafeInteger(rubles) && rubles >= 0 ? (rubles * 100) + kopecks : null;
}

export function extractPaymentReference(value) {
  const result = { orderId: null, redirectUrl: null, status: null };
  let fallbackId = null;
  const visit = (item, depth = 0) => {
    if (!item || depth > 7) return;
    if (Array.isArray(item)) return item.slice(0, 20).forEach((entry) => visit(entry, depth + 1));
    if (typeof item !== "object") return;
    for (const [key, nested] of Object.entries(item)) {
      const normalized = key.replace(/[^a-z0-9]/giu, "").toLowerCase();
      if (["orderid", "paymentid"].includes(normalized)
        && ["string", "number"].includes(typeof nested)) result.orderId = String(nested).slice(0, 160);
      if (!fallbackId && normalized === "id" && ["string", "number"].includes(typeof nested)) {
        fallbackId = String(nested).slice(0, 160);
      }
      if (!result.redirectUrl && ["redirecturl", "paymenturl", "url"].includes(normalized)
        && typeof nested === "string") {
        try {
          const url = new URL(nested);
          if (url.protocol === "https:" && /(?:tinkoff|tbank|securepay)\./iu.test(url.hostname)) {
            result.redirectUrl = url.href;
          }
        } catch {}
      }
      if (!result.status && ["status", "state", "paymentstatus"].includes(normalized)
        && ["string", "number"].includes(typeof nested)) result.status = String(nested).slice(0, 80);
      if (nested && typeof nested === "object") visit(nested, depth + 1);
    }
  };
  visit(value);
  if (!result.orderId) result.orderId = fallbackId;
  return Object.fromEntries(Object.entries(result).filter(([, item]) => item !== null));
}

export function isGptunnelPaymentCreationResponse(value) {
  try {
    const url = new URL(typeof value === "string" ? value : value.url());
    return url.origin === "https://gptunnel.ru" && url.pathname === "/trpc/user.pay";
  } catch {
    return false;
  }
}

function transactionKey(transactionId) {
  return `gptunnel-transaction:${transactionId}`;
}

function recurringMethodKind(method) {
  const descriptor = [method?.type, method?.kind, method?.provider, method?.methodType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/fps|sbp|qr/iu.test(descriptor) || method?.bank) return "sbp";
  if (/card/iu.test(descriptor)
    || method?.maskedPan || method?.cardMask || method?.cardLastFour) return "card";
  return "unknown";
}

export async function prepareGptunnelCardPayment(page, amountInput, amountKopecks) {
  await amountInput.fill(String(amountKopecks / 100));

  // GPTunnel keeps all method labels in the DOM while the custom picker is
  // collapsed. Clicking the hidden card label directly is intercepted by the
  // picker overlay, so the picker must be opened first.
  const methodLabel = page.getByText(/^Метод оплаты$/iu).last();
  await methodLabel.locator("..").click();

  const cardMethod = page.getByText(/^Оплата картой$/iu).last();
  await cardMethod.waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
  if (!await cardMethod.isVisible().catch(() => false)) {
    throw new FundingError("payment_method_required", "GPTunnel card payment method is unavailable", { userActionRequired: true, externalChargeStarted: false });
  }
  await cardMethod.click();
}

export async function submitGptunnelCardPayment({
  page,
  amountInput,
  amountKopecks,
  createButton,
  prepare = prepareGptunnelCardPayment
}) {
  await createButton.click();

  const countryConfirm = page.getByRole("button", { name: /^подтвердить$/iu }).last();
  await countryConfirm.waitFor({ state: "visible", timeout: 2_000 }).catch(() => null);
  if (!await countryConfirm.isVisible().catch(() => false)) return;

  await countryConfirm.click();
  await amountInput.waitFor({ state: "visible", timeout: 10_000 });
  await prepare(page, amountInput, amountKopecks);
  const retryButton = page.getByRole("button", { name: /оплатить|пополнить/iu }).last();
  if (!await retryButton.isVisible().catch(() => false) || !await retryButton.isEnabled().catch(() => false)) {
    throw new FundingError("payment_control_missing", "GPTunnel payment control is unavailable after country confirmation", { externalChargeStarted: false });
  }
  await retryButton.click();
}

export class GptunnelBrowserManager {
  constructor({ context, profileUrl = "https://gptunnel.ru/profile", stateStore, transactionTimeoutMs = 180_000 }) {
    this.context = context;
    this.profileUrl = new URL(profileUrl).href;
    this.stateStore = stateStore;
    this.transactionTimeoutMs = transactionTimeoutMs;
    this.page = null;
    this.inFlight = new Map();
  }

  async start() {
    if (!this.context?.newPage) throw new Error("Shared persistent browser context is required");
    this.page = await this.context.newPage();
    await this.page.goto(this.profileUrl, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null);
  }

  async status() {
    if (!this.page || this.page.isClosed?.()) {
      return { persistent: true, profileMode: "shared_persistent", authorization: "unknown", automation: "unavailable", cardEnrollment: "unknown", loginPerPayment: false };
    }
    let currentOrigin = null;
    try { currentOrigin = new URL(this.page.url()).origin; } catch {}
    if (currentOrigin !== new URL(this.profileUrl).origin) {
      await this.page.goto(this.profileUrl, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null);
    }
    const loginVisible = await this.page.getByRole("button", { name: /войти|зарегистрироваться/iu })
      .first().isVisible().catch(() => false);
    const topupVisible = await this.page.getByRole("button", { name: /пополнить/iu })
      .first().isVisible().catch(() => false);
    const authorized = !loginVisible && topupVisible;
    let recurringSettings = null;
    if (authorized) recurringSettings = await this.readRecurringSettings().catch(() => null);
    const methods = Array.isArray(recurringSettings?.methods) ? recurringSettings.methods : [];
    const selectedMethod = methods.find((method) => String(method?.id) === String(recurringSettings?.recurringMethodId));
    const selectedKind = selectedMethod ? recurringMethodKind(selectedMethod) : null;
    const cardReady = selectedKind === "card";
    return {
      persistent: true,
      profileMode: "shared_persistent",
      authorization: authorized ? "authorized" : "required_once",
      automation: authorized
        ? (recurringSettings ? (cardReady ? "ready" : "blocked_until_card_enrollment") : "unavailable")
        : "blocked_until_authorization",
      cardEnrollment: authorized && recurringSettings ? (cardReady ? "ready" : "required_once") : "unknown",
      recurringMethodCount: methods.length,
      fundingMethod: selectedKind ? `${selectedKind}_recurring` : null,
      loginPerPayment: false
    };
  }

  async readRecurringSettings(page = this.page) {
    if (!page || page.isClosed?.()) {
      throw new FundingError("browser_unavailable", "GPTunnel browser is unavailable", { externalChargeStarted: false });
    }
    const path = "/trpc/pay.recurringSettings.getRecurringSettings?input=%7B%22json%22%3Anull%7D";
    const response = await page.evaluate(async (requestPath) => {
      const result = await fetch(requestPath, { credentials: "include" });
      return { httpStatus: result.status, body: await result.json().catch(() => null) };
    }, path);
    const settings = response?.body?.result?.data;
    if (response?.httpStatus !== 200 || !settings || !Array.isArray(settings.methods)) {
      throw new FundingError("recurring_settings_unavailable", "GPTunnel recurring settings are unavailable", { externalChargeStarted: false });
    }
    return {
      ...(Number.isFinite(settings.thresholdAmount) ? { thresholdAmount: settings.thresholdAmount } : {}),
      ...(Number.isFinite(settings.chargeAmount) ? { chargeAmount: settings.chargeAmount } : {}),
      methods: settings.methods,
      recurringMethodId: settings.recurringMethodId ?? null
    };
  }

  async readBalance(page = this.page) {
    if (!page || page.isClosed?.()) throw new FundingError("browser_unavailable", "GPTunnel browser is unavailable", { externalChargeStarted: false });
    await page.goto(this.profileUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.getByText(/^Баланс$/iu).last().waitFor({ state: "visible", timeout: 15_000 }).catch(() => null);
    const text = await page.locator("body").innerText({ timeout: 15_000 });
    const balanceSection = text.match(/баланс[\s\S]{0,300}?(\d[\d\s]*(?:[,.]\d{1,2})?\s*₽)/iu)
      ?? text.match(/(\d[\d\s]*(?:[,.]\d{1,2})?\s*₽)/u);
    const balanceKopecks = parseRublesToKopecks(balanceSection?.[1]);
    if (balanceKopecks === null) throw new FundingError("balance_unavailable", "GPTunnel balance is unavailable", { externalChargeStarted: false });
    return { balanceKopecks, currency: "RUB" };
  }

  getBalance() {
    return this.readBalance();
  }

  async verifyTransaction({ transactionId, expectedAmountKopecks, currency = "RUB" }) {
    const id = String(transactionId ?? "").trim();
    if (!id || id.length > 160) throw new TypeError("transactionId is invalid");
    const record = this.stateStore?.get(transactionKey(id));
    if (record?.status !== "succeeded" || record.transactionId !== id
      || record.amountKopecks !== expectedAmountKopecks || currency !== "RUB") {
      throw new FundingError("verification_failed", "GPTunnel transaction does not match the durable funding record");
    }
    return { transactionId: id, amountKopecks: expectedAmountKopecks, currency: "RUB" };
  }

  async charge(request) {
    const key = String(request.idempotencyKey ?? "").trim();
    if (!key) throw new TypeError("idempotencyKey is required");
    if (this.inFlight.has(key)) return this.inFlight.get(key);
    const operation = this.#charge(request);
    this.inFlight.set(key, operation);
    try { return await operation; } finally { this.inFlight.delete(key); }
  }

  async #charge({ amountKopecks, idempotencyKey }) {
    if (!Number.isSafeInteger(amountKopecks) || amountKopecks < 5_200) {
      throw new FundingError("invalid_amount", "GPTunnel funding requires at least 52 RUB", { externalChargeStarted: false });
    }
    const status = await this.status();
    if (status.authorization !== "authorized") {
      throw new FundingError("browser_authorization_required", "GPTunnel login is required", { userActionRequired: true, externalChargeStarted: false });
    }
    const previous = this.stateStore?.get(idempotencyKey);
    if (previous?.status === "succeeded") {
      return { transactionId: previous.transactionId, amountKopecks, currency: "RUB" };
    }
    if (previous?.status === "submission_started") {
      throw new FundingError("charge_result_unknown", "Previous GPTunnel payment attempt is unresolved");
    }

    const before = await this.readBalance();
    const startedAt = new Date().toISOString();
    await this.stateStore?.set(idempotencyKey, { status: "prepared", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, route: "gptunnel_saved_card" });
    const chargePage = await this.context.newPage();
    try {
      const url = new URL(this.profileUrl);
      url.searchParams.set("paywall", "top_up");
      url.searchParams.set("amount", String(amountKopecks / 100));
      await chargePage.goto(url.href, { waitUntil: "domcontentloaded", timeout: 45_000 });

      const amountInput = chargePage.locator('input[inputmode="numeric"], input[type="number"], input').last();
      await amountInput.waitFor({ state: "visible", timeout: 15_000 }).catch(() => null);
      if (!await amountInput.isVisible().catch(() => false)) {
        throw new FundingError("payment_control_missing", "GPTunnel amount field is unavailable", { externalChargeStarted: false });
      }
      await prepareGptunnelCardPayment(chargePage, amountInput, amountKopecks);

      const responsePromise = chargePage.waitForResponse(
        isGptunnelPaymentCreationResponse,
        { timeout: 20_000 }
      ).catch(() => null);
      const createButton = chargePage.getByRole("button", { name: /оплатить|пополнить/iu }).last();
      if (!await createButton.isVisible().catch(() => false) || !await createButton.isEnabled().catch(() => false)) {
        throw new FundingError("payment_control_missing", "GPTunnel payment control is unavailable", { externalChargeStarted: false });
      }
      await this.stateStore?.set(idempotencyKey, { status: "submission_started", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, route: "gptunnel_saved_card" });
      // On the first Russian-card payment GPTunnel inserts a one-time country
      // confirmation and then resets the paywall. The helper resubmits the
      // original amount and method after that confirmation.
      await submitGptunnelCardPayment({
        page: chargePage,
        amountInput,
        amountKopecks,
        createButton
      });
      const paymentResponse = await responsePromise;
      const paymentBody = paymentResponse ? await paymentResponse.json().catch(() => null) : null;
      const reference = extractPaymentReference(paymentBody);
      const transactionId = String(reference.orderId ?? "").trim();
      if (!transactionId) throw new FundingError("charge_result_unknown", "GPTunnel payment identifier was not returned");
      await this.stateStore?.set(idempotencyKey, { status: "submission_started", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, transactionId, route: "gptunnel_saved_card" });

      if (reference.redirectUrl && !chargePage.frames().some((frame) => frame.url() === reference.redirectUrl)) {
        await chargePage.goto(reference.redirectUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
      }
      const paymentFrame = chargePage.frames().find((frame) => /(?:tinkoff|tbank|securepay)/iu.test(frame.url())) ?? chargePage;
      const savedCard = paymentFrame.getByText(/(?:сохраненн|карта)[^\n]{0,40}(?:••|\*\*)\s*\d{2,4}/iu).first();
      await savedCard.waitFor({ state: "visible", timeout: 20_000 }).catch(() => null);
      if (!await savedCard.isVisible().catch(() => false)) {
        await this.stateStore?.set(idempotencyKey, { status: "prepared", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, lastPaymentId: transactionId, route: "gptunnel_saved_card" });
        throw new FundingError("payment_method_required", "A saved GPTunnel chargeable card is required", { userActionRequired: true, externalChargeStarted: false });
      }
      await savedCard.click();
      const payButton = paymentFrame.getByRole("button", { name: /оплатить|подтвердить/iu }).last();
      if (!await payButton.isVisible().catch(() => false) || !await payButton.isEnabled().catch(() => false)) {
        await this.stateStore?.set(idempotencyKey, { status: "prepared", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, lastPaymentId: transactionId, route: "gptunnel_saved_card" });
        throw new FundingError("payment_method_required", "The saved GPTunnel card cannot be charged", { userActionRequired: true, externalChargeStarted: false });
      }
      await payButton.click();

      const deadline = Date.now() + this.transactionTimeoutMs;
      while (Date.now() < deadline) {
        const bodyText = await chargePage.locator("body").innerText().catch(() => "");
        const statusMatch = bodyText.match(/\b(AUTHORIZED|CONFIRMED|complete|paid_over|wrong_amount|paid|failed|declined|cancelled|error|not_paid)\b/iu);
        const paymentStatus = String(statusMatch?.[1] ?? reference.status ?? "").toLowerCase();
        if (FAILURE_STATUSES.test(paymentStatus)) {
          await this.stateStore?.set(idempotencyKey, { status: "prepared", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, lastPaymentId: transactionId, lastPaymentStatus: paymentStatus, route: "gptunnel_saved_card" });
          throw new FundingError("payment_declined", "GPTunnel marked the saved-card payment as unpaid", { retryable: true, externalChargeStarted: false, retryAfterSeconds: 3_600 });
        }
        const after = await this.readBalance(this.page).catch(() => null);
        if (SUCCESS_STATUSES.test(paymentStatus)
          || (after && after.balanceKopecks >= before.balanceKopecks + amountKopecks)) {
          const completed = { status: "succeeded", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, transactionId, route: "gptunnel_saved_card" };
          await this.stateStore?.set(idempotencyKey, completed);
          await this.stateStore?.set(transactionKey(transactionId), completed);
          return { transactionId, amountKopecks, currency: "RUB" };
        }
        const challenge = await paymentFrame.locator('text=/3-D Secure|подтвердите|код из смс|SmartCaptcha/iu').first().isVisible().catch(() => false);
        if (challenge) throw new FundingError("payment_confirmation_required", "Manual GPTunnel payment confirmation is required", { userActionRequired: true });
        await delay(2_500);
      }
      throw new FundingError("charge_result_unknown", "GPTunnel payment result could not be verified");
    } finally {
      await chargePage.close().catch(() => null);
    }
  }
}
