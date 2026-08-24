import { FundingError } from "./mcp.js";
import { createHash } from "node:crypto";

const ROUTERAI_ORIGIN = "https://routerai.ru";
const SUCCESS_STATUS = /^(?:authorized|confirmed|complete|completed|paid|succeeded|success)$/iu;
const FAILURE_STATUS = /^(?:cancelled|canceled|declined|error|failed|not_paid)$/iu;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function transactionKey(transactionId) {
  return `routerai-transaction:${transactionId}`;
}

function operationKey(idempotencyKey) {
  return `routerai-operation:${idempotencyKey}`;
}

function safeUrl(value) {
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:") return null;
    if (url.origin === ROUTERAI_ORIGIN || /(?:^|\.)(?:tbank\.ru|tinkoff\.ru|securepay\.tinkoff\.ru)$/iu.test(url.hostname)) {
      return url.href;
    }
  } catch {}
  return null;
}

export function parseRouterAiBalance(value) {
  const text = String(value ?? "").replace(/\u00a0/gu, " ");
  const match = text.match(/(\d[\d ]*)(?:[,.](\d{1,2}))?\s*₽/u);
  if (!match) return null;
  const rubles = Number(match[1].replace(/\s/gu, ""));
  const kopecks = Number(String(match[2] ?? "").padEnd(2, "0") || "0");
  return Number.isSafeInteger(rubles) && rubles >= 0 ? (rubles * 100) + kopecks : null;
}

export function isRouterAiPaymentResponse(value) {
  try {
    const url = new URL(typeof value === "string" ? value : value.url());
    if (url.origin !== ROUTERAI_ORIGIN || !/\/(?:payments?|invoices?)(?:\/|$)/iu.test(url.pathname)) return false;
    if (typeof value?.request === "function") {
      return value.request().method() === "POST"
        && (/^\/settings\/invoices\/?$/iu.test(url.pathname)
          || /^(?:\/settings\/billing|\/api\/v1)\/(?:payments?|invoices?)\/?$/iu.test(url.pathname));
    }
    return true;
  } catch {
    return false;
  }
}

export function extractRouterAiPaymentReference(value) {
  const reference = { transactionId: null, status: null, redirectUrl: null, amountKopecks: null, currency: null };
  let fallbackId = null;
  const visit = (item, depth = 0, container = "") => {
    if (!item || depth > 7) return;
    if (Array.isArray(item)) return item.slice(0, 20).forEach((entry) => visit(entry, depth + 1, container));
    if (typeof item !== "object") return;
    for (const [key, nested] of Object.entries(item)) {
      const normalized = String(key).replace(/[^a-z0-9]/giu, "").toLowerCase();
      if (["paymentid", "invoiceid", "orderid"].includes(normalized)
        && ["string", "number"].includes(typeof nested)) reference.transactionId = String(nested).slice(0, 160);
      if (!fallbackId && normalized === "id" && (depth === 0 || /^(?:invoice|payment|order)$/u.test(container))
        && ["string", "number"].includes(typeof nested)) {
        fallbackId = String(nested).slice(0, 160);
      }
      if (!reference.status && ["status", "state", "paymentstatus"].includes(normalized)
        && ["string", "number"].includes(typeof nested)) reference.status = String(nested).slice(0, 80);
      if (reference.amountKopecks === null && normalized === "amountkopecks"
        && Number.isSafeInteger(Number(nested)) && Number(nested) >= 0) {
        reference.amountKopecks = Number(nested);
      }
      if (reference.amountKopecks === null && (normalized === "amount" || (container === "amount" && normalized === "value"))
        && ["string", "number"].includes(typeof nested)
        && /^\d+(?:[.,]\d{1,2})?$/u.test(String(nested))) {
        reference.amountKopecks = Math.round(Number(String(nested).replace(",", ".")) * 100);
      }
      if (!reference.currency && normalized === "currency" && typeof nested === "string") {
        reference.currency = nested.toUpperCase().slice(0, 8);
      }
      if (!reference.redirectUrl && ["confirmationurl", "redirecturl", "paymenturl", "url"].includes(normalized)
        && typeof nested === "string") reference.redirectUrl = safeUrl(nested);
      if (nested && typeof nested === "object") visit(nested, depth + 1, normalized);
    }
  };
  visit(value);
  if (!reference.transactionId) reference.transactionId = fallbackId;
  return Object.fromEntries(Object.entries(reference).filter(([, item]) => item !== null));
}

async function visible(locator) {
  return Boolean(locator && await locator.first().isVisible().catch(() => false));
}

async function openTopupDialog(page) {
  const openButton = page.getByRole("button", { name: /пополнить/iu }).first();
  const modal = page.locator("#add-money").first();
  await openButton.waitFor({ state: "visible", timeout: 15_000 }).catch(() => null);
  if (!await openButton.isVisible().catch(() => false)) return false;
  const clicked = await openButton.click({ timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  let triggered = clicked;
  if (!clicked && typeof openButton.evaluate === "function") {
    await openButton.evaluate((element) => element.click());
    triggered = true;
  }
  await modal.waitFor({ state: "visible", timeout: 5_000 }).catch(() => null);
  if (await modal.isVisible().catch(() => false)) return true;
  if (typeof page.evaluate === "function") {
    await page.evaluate(() => {
      const target = document.querySelector("#add-money");
      if (target && window.UIkit?.modal) window.UIkit.modal(target).show();
    }).catch(() => null);
    await modal.waitFor({ state: "visible", timeout: 5_000 }).catch(() => null);
  }
  return await modal.isVisible().catch(() => false) || triggered;
}

async function safeTopupControlDiagnostic(page) {
  if (typeof page?.evaluate !== "function") return { evaluate: false };
  return page.evaluate(() => {
    const modal = document.querySelector("#add-money");
    const root = modal || document;
    const inputs = [...root.querySelectorAll("input")].slice(0, 20).map((input) => ({
      type: String(input.getAttribute("type") || "text").slice(0, 32),
      name: String(input.getAttribute("name") || "").slice(0, 80),
      placeholder: String(input.getAttribute("placeholder") || "").slice(0, 80),
      ariaLabel: String(input.getAttribute("aria-label") || "").slice(0, 80),
      disabled: input.disabled === true
    }));
    return {
      readyState: document.readyState,
      modalExists: Boolean(modal),
      modalClass: String(modal?.className || "").slice(0, 160),
      modalHidden: modal ? modal.hidden === true : null,
      iframeCount: document.querySelectorAll("iframe").length,
      inputs
    };
  }).catch(() => ({ evaluate: false }));
}

async function visibleAmountInput(page) {
  const selectors = [
    '#add-money input[placeholder*="100"]',
    '#add-money input[name="invoice[amount]"]',
    '#add-money input[inputmode="numeric"]',
    '#add-money input[type="number"]',
    '#add-money input:visible:not([type="radio"]):not([type="checkbox"]):not([type="hidden"])',
    '[role="dialog"] input[placeholder*="100"]',
    '[aria-modal="true"] input[placeholder*="100"]'
  ];
  for (const selector of selectors) {
    const candidate = page.locator(selector).first();
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

function savedCardLocator(page) {
  return page.locator([
    '[data-controller~="auto-top-up"] [data-recurring-payment-method][data-kind="card"][data-selected="true"]',
    '[data-controller~="recurring-payment"] [data-recurring-payment-method][data-kind="card"][data-selected="true"]',
    '[data-controller~="auto-top-up"] input[name*="recurring"][value*="card"]:checked',
    '[data-controller~="recurring-payment"] input[name*="recurring"][value*="card"]:checked',
    'form[action*="recurring"] input[name*="payment_method"][value*="card"]:checked'
  ].join(", ")).first();
}

function cardChoiceLocator(page) {
  return page.locator([
    '#add-money input[type="radio"]:checked:not(:disabled)',
    '#add-money [role="radio"][aria-checked="true"]:not([aria-disabled="true"])',
    '#add-money [data-state="checked"]:not([aria-disabled="true"])',
    '[role="dialog"] input[type="radio"]:checked:not(:disabled)',
    '[role="dialog"] [role="radio"][aria-checked="true"]:not([aria-disabled="true"])',
    '[role="dialog"] [data-state="checked"]:not([aria-disabled="true"])',
    '[aria-modal="true"] input[type="radio"]:checked:not(:disabled)',
    '[aria-modal="true"] [role="radio"][aria-checked="true"]:not([aria-disabled="true"])',
    '[aria-modal="true"] [data-state="checked"]:not([aria-disabled="true"])',
    '[role="dialog"] [data-recurring-payment-method][data-kind="card"]',
    '[role="dialog"] input[name*="recurring_payment_method"][value*="card"]',
    '[role="dialog"] input[name="invoice[kind]"][value*="card"]',
    'form[action*="billing"] [data-recurring-payment-method][data-kind="card"]',
    'form[action*="billing"] input[name*="recurring_payment_method"][value*="card"]'
  ].join(", ")).first();
}

async function hasSelectedCardInTopupDialog(page) {
  if (typeof page?.evaluate !== "function") return false;
  return Boolean(await page.evaluate(() => {
    const isVisible = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden"
        && Number(style.opacity || "1") > 0 && box.width > 0 && box.height > 0;
    };
    const normalize = (value) => String(value ?? "").replace(/\s+/gu, " ").trim();
    const semanticCandidates = [...document.querySelectorAll([
      '[role="dialog"]',
      '[aria-modal="true"]',
      '[class*="modal" i]',
      '[class*="dialog" i]'
    ].join(", "))];
    const structuralCandidates = [...document.querySelectorAll("form, section, div")]
      .filter((element) => {
        const text = normalize(element.textContent);
        return text.length <= 2400 && /Пополнение баланса/iu.test(text)
          && /Новая карта/iu.test(text) && /Пополнить/iu.test(text);
      });
    const dialogCandidates = [...new Set([...semanticCandidates, ...structuralCandidates])];

    return [...dialogCandidates].some((dialog) => {
      if (!isVisible(dialog)) return false;
      const dialogText = normalize(dialog.textContent);
      if (!/Пополнение баланса/iu.test(dialogText)
        || !/Новая карта/iu.test(dialogText)
        || !/Пополнить/iu.test(dialogText)) return false;

      const selectedControls = [...dialog.querySelectorAll([
        'input[type="radio"]:checked:not(:disabled)',
        '[role="radio"][aria-checked="true"]:not([aria-disabled="true"])',
        '[data-state="checked"]:not([aria-disabled="true"])',
        '[data-selected="true"]:not([aria-disabled="true"])'
      ].join(", "))];
      return selectedControls.some((control) => {
        let row = control;
        while (row && row !== dialog) {
          const rowText = normalize(row.textContent);
          if (rowText.length <= 240
            && /(?:\*{2,}|•{2,})\s*\d{4}/u.test(rowText)
            && /(?:МИР|MIR|Visa|Mastercard|Maestro)/iu.test(rowText)) return true;
          row = row.parentElement;
        }
        return false;
      });
    });
  }).catch(() => false));
}

async function inspectSavedCardOnBillingPage(page) {
  let pathname = "";
  try { pathname = new URL(page.url()).pathname; } catch {}
  if (pathname !== "/settings/billing") return false;

  const openButton = page.getByRole("button", { name: /пополнить/iu }).first();
  if (!await visible(openButton)) return false;
  await openButton.click().catch(() => null);

  const tabCandidates = [
    page.getByRole("tab", { name: /^карта$/iu }).first(),
    page.getByRole("button", { name: /^карта$/iu }).first(),
    page.getByText(/^карта$/iu).first()
  ];
  for (const candidate of tabCandidates) {
    if (!await visible(candidate)) continue;
    await candidate.click().catch(() => null);
    break;
  }
  await delay(150);
  return hasSelectedCardInTopupDialog(page);
}

export class RouterAiBrowserManager {
  constructor({ context, billingUrl = `${ROUTERAI_ORIGIN}/settings/billing`, stateStore, transactionTimeoutMs = 180_000, pollIntervalMs = 2_500 }) {
    this.context = context;
    this.billingUrl = new URL(billingUrl).href;
    if (new URL(this.billingUrl).origin !== ROUTERAI_ORIGIN) throw new TypeError("RouterAI billing URL is invalid");
    this.stateStore = stateStore;
    this.transactionTimeoutMs = transactionTimeoutMs;
    this.pollIntervalMs = pollIntervalMs;
    this.page = null;
    this.inFlight = new Map();
    this.balanceVerificationTail = Promise.resolve();
    this.verifiedBalanceFloorKopecks = null;
    this.balanceReadTail = Promise.resolve();
    this.historyVerificationTail = Promise.resolve();
  }

  async start() {
    if (!this.context?.newPage) throw new Error("Shared persistent browser context is required");
    this.page = await this.context.newPage();
    await this.page.goto(this.billingUrl, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null);
  }

  async status() {
    if (!this.page || this.page.isClosed?.()) {
      return { persistent: true, profileMode: "shared_persistent", authorization: "unknown", automation: "unavailable", cardEnrollment: "unknown", fundingMethod: null, loginPerPayment: false, cookieCount: 0, sessionCookieCount: 0, persistentCookieExpiresAt: null };
    }
    let currentOrigin = null;
    try { currentOrigin = new URL(this.page.url()).origin; } catch {}
    // Never navigate from readiness: that could destroy an OAuth login, 3-D Secure,
    // or anti-fraud challenge. On the billing page only, readiness may open the
    // top-up dialog to inspect a selected method; it never enters an amount or submits.
    if (currentOrigin !== ROUTERAI_ORIGIN) {
      return { persistent: true, profileMode: "shared_persistent", authorization: "required_once", automation: "blocked_until_authorization", cardEnrollment: "unknown", fundingMethod: null, loginPerPayment: false, cookieCount: 0, sessionCookieCount: 0, persistentCookieExpiresAt: null };
    }
    const loginVisible = await visible(this.page.getByRole("link", { name: /войти|регистрация/iu }))
      || await visible(this.page.getByRole("button", { name: /войти|регистрация/iu }));
    const billingVisible = await visible(this.page.getByRole("button", { name: /пополнить/iu }))
      || await visible(this.page.getByText(/финансы|история платежей|баланс/iu));
    const authorized = !loginVisible && billingVisible;
    const cardReady = authorized && (
      await visible(savedCardLocator(this.page))
      || await hasSelectedCardInTopupDialog(this.page)
      || await inspectSavedCardOnBillingPage(this.page)
    );
    const cookies = this.context?.cookies
      ? await this.context.cookies(ROUTERAI_ORIGIN).catch(() => [])
      : [];
    const persistentExpirations = cookies
      .map((cookie) => Number(cookie.expires))
      .filter((expires) => Number.isFinite(expires) && expires > 0);
    return {
      persistent: true,
      profileMode: "shared_persistent",
      authorization: authorized ? "authorized" : "required_once",
      automation: authorized ? (cardReady ? "ready" : "blocked_until_card_enrollment") : "blocked_until_authorization",
      cardEnrollment: authorized ? (cardReady ? "ready" : "required_once") : "unknown",
      fundingMethod: cardReady ? "saved_card" : null,
      loginPerPayment: false,
      cookieCount: cookies.length,
      sessionCookieCount: cookies.filter((cookie) => Number(cookie.expires) <= 0).length,
      persistentCookieExpiresAt: persistentExpirations.length
        ? new Date(Math.max(...persistentExpirations) * 1000).toISOString()
        : null
    };
  }

  async #readBalancePage(page) {
    if (!page || page.isClosed?.()) throw new FundingError("browser_unavailable", "RouterAI browser is unavailable", { externalChargeStarted: false });
    await page.goto(this.billingUrl, { waitUntil: "commit", timeout: 45_000 });
    await page.getByText(/^Баланс$/iu).first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => null);
    const text = await page.locator("body").innerText({ timeout: 15_000 });
    const balanceSection = text.match(/баланс[\s\S]{0,240}?(\d[\d\s]*(?:[,.]\d{1,2})?\s*₽)/iu);
    const balanceKopecks = parseRouterAiBalance(balanceSection?.[1]);
    if (balanceKopecks === null) throw new FundingError("balance_unavailable", "RouterAI balance is unavailable", { externalChargeStarted: false });
    return { balanceKopecks, currency: "RUB" };
  }

  async readBalance(page = this.page) {
    if (page !== this.page) return this.#readBalancePage(page);
    const previous = this.balanceReadTail;
    let release;
    this.balanceReadTail = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      return await this.#readBalancePage(page);
    } finally {
      release();
    }
  }

  getBalance() {
    return this.readBalance();
  }

  async readPaymentHistory(page = this.page, { failClosed = false } = {}) {
    if (!page || page.isClosed?.() || typeof page.evaluate !== "function") {
      if (failClosed) throw new FundingError("history_unavailable", "RouterAI payment history is unavailable", { externalChargeStarted: false });
      return [];
    }
    const result = await page.evaluate(async () => {
      const response = await fetch("/settings/invoices", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "text/html" }
      }).catch(() => null);
      if (!response?.ok) return { ok: false, rows: [] };
      const html = await response.text();
      const documentCopy = new DOMParser().parseFromString(html, "text/html");
      return {
        ok: true,
        rows: [...documentCopy.querySelectorAll(".grid-table__row_billing")].slice(0, 100).map((row) => ({
          text: String(row.textContent || "").replace(/\s+/gu, " ").trim().slice(0, 600),
          amount: String(row.querySelector(".grid-table__col_billing-amount")?.textContent || "").trim(),
          status: String(row.querySelector(".grid-table__col_billing-status")?.textContent || "").trim()
        }))
      };
    }).catch(() => null);
    if (!result?.ok) {
      if (failClosed) throw new FundingError("history_unavailable", "RouterAI payment history is unavailable", { externalChargeStarted: false });
      return [];
    }
    return result.rows.map((row) => ({
      fingerprint: createHash("sha256").update(row.text).digest("hex").slice(0, 32),
      amountKopecks: parseRouterAiBalance(row.amount),
      paid: /завершено|оплачено|paid|completed/iu.test(row.status)
    })).filter((row) => row.fingerprint && row.amountKopecks !== null);
  }

  async claimCompletedHistoryRecord({ baselineHistory = [], amountKopecks, durableKey }) {
    const previous = this.historyVerificationTail;
    let release;
    this.historyVerificationTail = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      const rows = await this.readPaymentHistory();
      const baselineCounts = new Map();
      for (const row of baselineHistory) {
        baselineCounts.set(row.fingerprint, (baselineCounts.get(row.fingerprint) || 0) + 1);
      }
      const occurrences = new Map();
      for (const row of rows) {
        const occurrence = (occurrences.get(row.fingerprint) || 0) + 1;
        occurrences.set(row.fingerprint, occurrence);
        if (!row.paid || row.amountKopecks !== amountKopecks) continue;
        if (occurrence <= (baselineCounts.get(row.fingerprint) || 0)) continue;
        const transactionId = `routerai-history-${row.fingerprint}-${occurrence}`;
        if (this.stateStore?.get(transactionKey(transactionId))) continue;
        await this.stateStore?.set(transactionKey(transactionId), {
          status: "claimed",
          transactionId,
          amountKopecks,
          currency: "RUB",
          durableKey
        });
        return { transactionId, status: "paid", amountKopecks, currency: "RUB" };
      }
      return null;
    } finally {
      release();
    }
  }

  async confirmObservedBalanceGrowth({ beforeBalanceKopecks, amountKopecks }) {
    const previous = this.balanceVerificationTail;
    let release;
    this.balanceVerificationTail = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      const after = await this.readBalance().catch(() => null);
      if (!after || after.currency !== "RUB") return false;
      const allocatedFloor = Number.isSafeInteger(this.verifiedBalanceFloorKopecks)
        ? this.verifiedBalanceFloorKopecks
        : beforeBalanceKopecks;
      const requiredBalance = Math.max(beforeBalanceKopecks, allocatedFloor) + amountKopecks;
      if (after.balanceKopecks < requiredBalance) return false;
      this.verifiedBalanceFloorKopecks = requiredBalance;
      return true;
    } finally {
      release();
    }
  }

  async readPaymentStatus(transactionId, page = this.page) {
    const id = String(transactionId ?? "").trim();
    if (!/^[A-Za-z0-9_-]{1,160}$/u.test(id)) throw new TypeError("transactionId is invalid");
    if (!page || page.isClosed?.()) {
      throw new FundingError("browser_unavailable", "RouterAI browser is unavailable", { externalChargeStarted: false });
    }
    const result = await page.evaluate(async (paymentId) => {
      const encoded = encodeURIComponent(paymentId);
      const paths = [
        `/settings/billing/invoices/${encoded}.json`,
        `/settings/billing/payments/${encoded}.json`,
        `/api/v1/invoices/${encoded}`,
        `/api/v1/payments/${encoded}`
      ];
      for (const path of paths) {
        const response = await fetch(path, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" }
        }).catch(() => null);
        if (!response || !response.ok) continue;
        const body = await response.json().catch(() => null);
        if (body) return body;
      }
      return null;
    }, id);
    const reference = extractRouterAiPaymentReference(result);
    if (String(reference.transactionId || "") !== id || !reference.status) return null;
    return {
      transactionId: id,
      status: String(reference.status).toLowerCase(),
      ...(Number.isSafeInteger(reference.amountKopecks) ? { amountKopecks: reference.amountKopecks } : {}),
      ...(reference.currency ? { currency: reference.currency } : {})
    };
  }

  async verifyTransaction({ transactionId, expectedAmountKopecks, currency = "RUB" }) {
    const id = String(transactionId ?? "").trim();
    if (!id || id.length > 160) throw new TypeError("transactionId is invalid");
    const record = this.stateStore?.get(transactionKey(id));
    if (record?.status !== "succeeded" || record.transactionId !== id
      || record.amountKopecks !== expectedAmountKopecks || currency !== "RUB") {
      throw new FundingError("verification_failed", "RouterAI transaction does not match the durable funding record");
    }
    return { transactionId: id, amountKopecks: expectedAmountKopecks, currency: "RUB" };
  }

  async charge(request) {
    const key = String(request.idempotencyKey ?? "").trim();
    if (!key || key.length > 255) throw new TypeError("idempotencyKey is invalid");
    const active = this.inFlight.get(key);
    if (active) {
      if (active.amountKopecks !== request.amountKopecks) {
        throw new FundingError("idempotency_conflict", "RouterAI allocation amount does not match", { externalChargeStarted: false });
      }
      return active.promise;
    }
    const operation = this.#charge({ ...request, idempotencyKey: key });
    this.inFlight.set(key, { amountKopecks: request.amountKopecks, promise: operation });
    try {
      return await operation;
    } finally {
      this.inFlight.delete(key);
      if (this.inFlight.size === 0) this.verifiedBalanceFloorKopecks = null;
    }
  }

  async #charge({ amountKopecks, idempotencyKey }) {
    if (!Number.isSafeInteger(amountKopecks) || amountKopecks < 10_000) {
      throw new FundingError("invalid_amount", "RouterAI funding requires at least 100 RUB", { externalChargeStarted: false });
    }
    const durableKey = operationKey(idempotencyKey);
    const previous = this.stateStore?.get(durableKey);
    if (previous && previous.amountKopecks !== amountKopecks) {
      throw new FundingError("idempotency_conflict", "RouterAI allocation amount does not match", { externalChargeStarted: false });
    }
    if (previous?.status === "succeeded") {
      return { transactionId: previous.transactionId, amountKopecks, currency: "RUB" };
    }
    if (previous?.status === "failed") {
      throw new FundingError("payment_declined", "Previous RouterAI payment attempt was declined", { retryable: false, externalChargeStarted: false });
    }
    if (previous?.status === "submission_started") {
      let recovered = previous;
      if (!recovered.transactionId && Array.isArray(recovered.baselineHistory)) {
        const historyReference = await this.claimCompletedHistoryRecord({
          baselineHistory: recovered.baselineHistory,
          amountKopecks,
          durableKey
        });
        if (historyReference) {
          recovered = {
            ...recovered,
            transactionId: historyReference.transactionId,
            providerStatus: historyReference.status,
            providerAmountKopecks: historyReference.amountKopecks,
            providerCurrency: historyReference.currency
          };
          await this.stateStore?.set(durableKey, recovered);
        }
      }
      if (recovered.transactionId && Number.isSafeInteger(recovered.beforeBalanceKopecks)) {
        const historyRecord = recovered.transactionId.startsWith("routerai-history-")
          ? this.stateStore?.get(transactionKey(recovered.transactionId))
          : null;
        const latest = historyRecord
          ? {
              transactionId: recovered.transactionId,
              status: "paid",
              amountKopecks: historyRecord.amountKopecks,
              currency: historyRecord.currency
            }
          : await this.readPaymentStatus(recovered.transactionId).catch(() => null);
        const recoveredStatus = String(latest?.status || recovered.providerStatus || "").toLowerCase();
        if (SUCCESS_STATUS.test(recoveredStatus)
          && latest?.amountKopecks === amountKopecks && latest?.currency === "RUB"
          && await this.confirmObservedBalanceGrowth({
            beforeBalanceKopecks: recovered.beforeBalanceKopecks,
            amountKopecks
          })) {
          const completed = { ...recovered, status: "succeeded", providerStatus: recoveredStatus, providerAmountKopecks: latest.amountKopecks, providerCurrency: latest.currency };
          await this.stateStore?.set(durableKey, completed);
          await this.stateStore?.set(transactionKey(recovered.transactionId), completed);
          return { transactionId: recovered.transactionId, amountKopecks, currency: "RUB" };
        }
      }
      throw new FundingError("charge_result_unknown", "Previous RouterAI payment attempt is unresolved");
    }
    const readiness = await this.status();
    if (readiness.authorization !== "authorized") {
      throw new FundingError("browser_authorization_required", "RouterAI login is required", { userActionRequired: true, externalChargeStarted: false });
    }
    if (readiness.automation !== "ready") {
      throw new FundingError("payment_method_required", "A saved RouterAI chargeable card is required", { userActionRequired: true, externalChargeStarted: false });
    }

    const before = await this.readBalance();
    const baselineHistory = await this.readPaymentHistory(this.page, { failClosed: true });
    const startedAt = new Date().toISOString();
    await this.stateStore?.set(durableKey, {
      status: "prepared", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks,
      baselineHistory,
      route: "routerai_saved_card"
    });
    const chargePage = await this.context.newPage();
    let keepOpen = false;
    try {
      await chargePage.goto(this.billingUrl, { waitUntil: "commit", timeout: 45_000 });
      await chargePage.waitForLoadState?.("domcontentloaded", { timeout: 20_000 }).catch(() => null);
      await chargePage.waitForTimeout?.(1_000);
      if (!await openTopupDialog(chargePage)) {
        throw new FundingError("payment_control_missing", "RouterAI top-up control is unavailable", { externalChargeStarted: false });
      }

      const cardTab = chargePage.getByText(/^карта$/iu).first();
      if (await visible(cardTab)) await cardTab.click();

      let amountInput = await visibleAmountInput(chargePage);
      if (!amountInput) {
        await chargePage.waitForTimeout?.(1_000);
        await openTopupDialog(chargePage);
        const hydratedCardTab = chargePage.getByText(/^карта$/iu).first();
        if (await visible(hydratedCardTab)) await hydratedCardTab.click();
        await chargePage.waitForTimeout?.(1_000);
        amountInput = await visibleAmountInput(chargePage);
      }
      if (!amountInput) {
        const diagnostic = await safeTopupControlDiagnostic(chargePage);
        throw new FundingError(
          "payment_control_missing",
          `RouterAI amount field is unavailable: ${JSON.stringify(diagnostic)}`,
          { externalChargeStarted: false }
        );
      }
      await amountInput.fill(String(amountKopecks / 100));

      const savedCard = cardChoiceLocator(chargePage);
      await savedCard.waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
      if (!await savedCard.isVisible().catch(() => false)) {
        throw new FundingError("payment_method_required", "A saved RouterAI card is unavailable in checkout", { userActionRequired: true, externalChargeStarted: false });
      }
      const cardAlreadySelected = typeof savedCard.evaluate === "function"
        ? await savedCard.evaluate((element) => element.matches(
          ':checked, [aria-checked="true"], [data-state="checked"], [data-selected="true"]'
        )).catch(() => false)
        : false;
      if (!cardAlreadySelected) {
        await savedCard.click({ timeout: 5_000 }).catch(() => {
          throw new FundingError("payment_method_required", "The saved RouterAI card could not be selected", {
            userActionRequired: true,
            externalChargeStarted: false
          });
        });
      }

      const submitButton = chargePage.getByRole("button", { name: /пополнить|оплатить/iu }).last();
      if (!await submitButton.isVisible().catch(() => false) || !await submitButton.isEnabled().catch(() => false)) {
        throw new FundingError("payment_control_missing", "RouterAI payment control is unavailable", { externalChargeStarted: false });
      }
      await this.stateStore?.set(durableKey, {
        status: "submission_started", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks,
        baselineHistory,
        route: "routerai_saved_card"
      });
      const responsePromise = typeof chargePage.waitForResponse === "function"
        ? chargePage.waitForResponse(isRouterAiPaymentResponse, { timeout: 20_000 }).catch(() => null)
        : Promise.resolve(null);
      await submitButton.click();
      const paymentResponse = await responsePromise;
      const paymentBody = paymentResponse ? await paymentResponse.json().catch(() => null) : null;
      const reference = extractRouterAiPaymentReference(paymentBody);
      let transactionId = String(reference.transactionId || "").trim();
      let providerStatus = String(reference.status || "").trim().toLowerCase();
      let providerAmountKopecks = Number.isSafeInteger(reference.amountKopecks) ? reference.amountKopecks : null;
      let providerCurrency = String(reference.currency || "").toUpperCase();
      const deadline = Date.now() + this.transactionTimeoutMs;
      while (!transactionId && Date.now() < deadline) {
        const challenge = await visible(chargePage.getByText(/3-D Secure|код из смс|SmartCaptcha|подтвердите плат[её]ж/iu));
        if (challenge) {
          keepOpen = true;
          throw new FundingError("payment_confirmation_required", "Manual RouterAI payment confirmation is required", { userActionRequired: true });
        }
        const historyReference = await this.claimCompletedHistoryRecord({
          baselineHistory,
          amountKopecks,
          durableKey
        });
        if (historyReference) {
          transactionId = historyReference.transactionId;
          providerStatus = historyReference.status;
          providerAmountKopecks = historyReference.amountKopecks;
          providerCurrency = historyReference.currency;
          break;
        }
        await delay(this.pollIntervalMs);
      }
      await this.stateStore?.set(durableKey, {
        status: "submission_started", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks,
        baselineHistory,
        ...(transactionId ? { transactionId } : {}), ...(providerStatus ? { providerStatus } : {}),
        ...(providerAmountKopecks !== null ? { providerAmountKopecks } : {}),
        ...(providerCurrency ? { providerCurrency } : {}),
        route: "routerai_saved_card"
      });
      if (!transactionId) {
        keepOpen = true;
        throw new FundingError("charge_result_unknown", "RouterAI payment identifier was not returned");
      }
      if (FAILURE_STATUS.test(providerStatus)) {
        await this.stateStore?.set(durableKey, {
          status: "failed", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks,
          transactionId, providerStatus, route: "routerai_saved_card"
        });
        throw new FundingError("payment_declined", "RouterAI marked the saved-card payment as unpaid", { retryable: false });
      }

      while (Date.now() < deadline) {
        const challenge = await visible(chargePage.getByText(/3-D Secure|код из смс|SmartCaptcha|подтвердите плат[её]ж/iu));
        if (challenge) {
          keepOpen = true;
          throw new FundingError("payment_confirmation_required", "Manual RouterAI payment confirmation is required", { userActionRequired: true });
        }
        const bodyText = await chargePage.locator("body").innerText().catch(() => "");
        if (/плат[её]ж отклон[её]н|не удалось оплатить|declined|failed/iu.test(bodyText)) {
          await this.stateStore?.set(durableKey, {
            status: "failed", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks,
            transactionId, route: "routerai_saved_card"
          });
          throw new FundingError("payment_declined", "RouterAI marked the saved-card payment as unpaid", { retryable: false });
        }
        if (!SUCCESS_STATUS.test(providerStatus)) {
          const latest = await this.readPaymentStatus(transactionId).catch(() => null);
          if (latest?.status) {
            providerStatus = String(latest.status).toLowerCase();
            providerAmountKopecks = Number.isSafeInteger(latest.amountKopecks) ? latest.amountKopecks : null;
            providerCurrency = String(latest.currency || "").toUpperCase();
            await this.stateStore?.set(durableKey, {
              status: "submission_started", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks,
              transactionId, providerStatus,
              ...(providerAmountKopecks !== null ? { providerAmountKopecks } : {}),
              ...(providerCurrency ? { providerCurrency } : {}),
              route: "routerai_saved_card"
            });
          }
        }
        if (FAILURE_STATUS.test(providerStatus)) {
          await this.stateStore?.set(durableKey, {
            status: "failed", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks,
            transactionId, providerStatus, route: "routerai_saved_card"
          });
          throw new FundingError("payment_declined", "RouterAI marked the saved-card payment as unpaid", { retryable: false });
        }
        if (SUCCESS_STATUS.test(providerStatus)
          && providerAmountKopecks === amountKopecks && providerCurrency === "RUB"
          && await this.confirmObservedBalanceGrowth({
            beforeBalanceKopecks: before.balanceKopecks,
            amountKopecks
          })) {
          const completed = {
            status: "succeeded", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks,
            transactionId, providerStatus, providerAmountKopecks, providerCurrency, route: "routerai_saved_card"
          };
          await this.stateStore?.set(durableKey, completed);
          await this.stateStore?.set(transactionKey(transactionId), completed);
          return { transactionId, amountKopecks, currency: "RUB" };
        }
        await delay(this.pollIntervalMs);
      }
      throw new FundingError("charge_result_unknown", "RouterAI payment result could not be verified");
    } finally {
      if (!keepOpen) await chargePage.close().catch(() => null);
    }
  }
}
