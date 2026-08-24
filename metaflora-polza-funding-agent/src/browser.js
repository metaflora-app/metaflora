import { chromium } from "playwright";
import { FundingError } from "./mcp.js";

function topupUrl(value, allowedHosts = []) {
  if (typeof value === "string") {
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();
      const allowed = allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
      return url.protocol === "https:" && allowed ? url.href : null;
    } catch { return null; }
  }
  if (Array.isArray(value)) {
    for (const item of value) { const found = topupUrl(item, allowedHosts); if (found) return found; }
  }
  if (value && typeof value === "object") {
    for (const key of ["payment_url", "paymentUrl", "topup_url", "topupUrl", "url", "link"]) {
      if (key in value) { const found = topupUrl(value[key], allowedHosts); if (found) return found; }
    }
    for (const item of Object.values(value)) { const found = topupUrl(item, allowedHosts); if (found) return found; }
  }
  return null;
}

function isLoginUrl(url) {
  return /(?:login|sign-in|auth)/iu.test(url);
}

function billingUrl(dashboardUrl) {
  const url = new URL(dashboardUrl);
  url.pathname = "/dashboard/billing";
  url.search = "";
  url.hash = "";
  return url.href;
}

function paymentResponseSummary(value) {
  const summary = Object.create(null);
  const visit = (item, depth = 0) => {
    if (!item || depth > 5) return;
    if (Array.isArray(item)) return item.slice(0, 10).forEach((entry) => visit(entry, depth + 1));
    if (typeof item !== "object") return;
    for (const [key, nested] of Object.entries(item)) {
      const safeKey = String(key).replace(/[^a-z0-9_-]/giu, "_").slice(0, 64);
      if (/^(?:id|payment_?id|deposit_?id|operation_?id|status|state|payment_?status)$/iu.test(key)
        && ["string", "number", "boolean"].includes(typeof nested)) {
        summary[safeKey] = String(nested).slice(0, 255);
      } else if (typeof nested === "object") {
        visit(nested, depth + 1);
      }
    }
  };
  visit(value);
  return summary;
}

function safeDiagnosticValue(value) {
  return String(value ?? "")
    .replace(/https?:\/\/\S+/giu, "[url]")
    .replace(/Bearer\s+\S+/giu, "Bearer [redacted]")
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 255);
}

function paymentStatusSummary(value) {
  const summary = {
    httpStatus: Number(value?.httpStatus) || 0,
    ok: value?.ok === true,
  };
  const aliases = new Map([
    ["paymentid", "paymentId"],
    ["depositid", "depositId"],
    ["operationid", "operationId"],
    ["status", "status"],
    ["state", "state"],
    ["paymentstatus", "paymentStatus"],
    ["errorcode", "errorCode"],
    ["code", "code"],
    ["reason", "reason"],
    ["message", "message"],
    ["description", "description"],
  ]);
  const visit = (item, depth = 0) => {
    if (!item || depth > 5) return;
    if (Array.isArray(item)) return item.slice(0, 10).forEach((entry) => visit(entry, depth + 1));
    if (typeof item !== "object") return;
    for (const [key, nested] of Object.entries(item)) {
      const alias = aliases.get(String(key).replace(/[^a-z0-9]/giu, "").toLowerCase());
      if (alias && ["string", "number", "boolean"].includes(typeof nested)) {
        summary[alias] = safeDiagnosticValue(nested);
      } else if (nested && typeof nested === "object") {
        visit(nested, depth + 1);
      }
    }
  };
  visit(value?.body);
  return summary;
}

export class BrowserManager {
  constructor({ profileDir, executablePath = "/usr/bin/google-chrome", dashboardUrl, mcp, stateStore, allowedPaymentHosts = [], transactionTimeoutMs = 180000, launcher = chromium }) {
    this.profileDir = profileDir;
    this.executablePath = executablePath;
    this.dashboardUrl = dashboardUrl;
    this.mcp = mcp;
    this.stateStore = stateStore;
    this.allowedPaymentHosts = allowedPaymentHosts;
    this.transactionTimeoutMs = transactionTimeoutMs;
    this.launcher = launcher;
    this.context = null;
    this.page = null;
    this.inFlight = new Map();
  }

  async start() {
    this.context = await this.launcher.launchPersistentContext(this.profileDir, {
      executablePath: this.executablePath,
      ignoreDefaultArgs: ["--disable-extensions"],
      headless: false,
      viewport: null,
      args: [
        "--start-maximized",
        "--disable-dev-shm-usage",
        "--disable-session-crashed-bubble",
        "--hide-crash-restore-bubble",
        "--remote-debugging-address=127.0.0.1",
        "--remote-debugging-port=9222"
      ]
    });
    this.page = this.context.pages()[0] ?? await this.context.newPage();
    await this.page.goto(this.dashboardUrl, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => null);
  }

  async status() {
    if (!this.page || this.page.isClosed()) return { persistent: true, profileMode: "persistent", authorization: "unknown", automation: "unavailable", cardEnrollment: "unknown", loginPerPayment: false };
    const url = this.page.url();
    const sameOrigin = url.startsWith(new URL(this.dashboardUrl).origin);
    const loginPage = isLoginUrl(url);
    const dashboardMarker = sameOrigin && !loginPage
      && await this.page.locator('text=/выйти|платежи|API-ключи|организация/iu').first().isVisible().catch(() => false);
    const hasAccessToken = sameOrigin && !loginPage
      && await this.page.evaluate(() => Boolean(localStorage.getItem("accessToken")?.trim())).catch(() => false);
    const authenticated = dashboardMarker || hasAccessToken;
    const cookies = await this.context.cookies(new URL(this.dashboardUrl).origin).catch(() => []);
    const persistentExpirations = cookies.map((cookie) => Number(cookie.expires)).filter((expires) => Number.isFinite(expires) && expires > 0);
    return {
      persistent: true,
      profileMode: "persistent",
      authorization: authenticated ? "authorized" : "required_once",
      automation: authenticated ? "ready" : "blocked",
      cardEnrollment: authenticated ? "ready" : "unknown",
      loginPerPayment: false,
      sessionEvidence: dashboardMarker ? "dashboard" : hasAccessToken ? "access_token" : "none",
      cookieCount: cookies.length,
      sessionCookieCount: cookies.filter((cookie) => Number(cookie.expires) <= 0).length,
      persistentCookieExpiresAt: persistentExpirations.length ? new Date(Math.max(...persistentExpirations) * 1000).toISOString() : null
    };
  }

  async resumeCheckout(value) {
    const url = topupUrl(value, this.allowedPaymentHosts);
    if (!url) throw new FundingError("checkout_url_rejected", "Checkout URL is not allowlisted", { externalChargeStarted: false });
    await this.page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    const payButton = this.page.getByRole("button", { name: /оплатить|пополнить|продолжить/iu }).last();
    const visible = await payButton.isVisible().catch(() => false);
    const enabled = visible && await payButton.isEnabled().catch(() => false);
    return { checkout: "ready", paymentControl: enabled ? "enabled" : visible ? "disabled" : "missing" };
  }

  async paymentStatus(paymentId, page = this.page) {
    const normalized = String(paymentId ?? "").trim();
    if (!/^dep_[A-Za-z0-9_-]{6,128}$/u.test(normalized)) {
      throw new TypeError("paymentId is invalid");
    }
    if (!page || page.isClosed?.()) {
      throw new FundingError("browser_unavailable", "Polza browser is unavailable", { externalChargeStarted: false });
    }
    const result = await page.evaluate(async (id) => {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(`https://api.polza.ai/balance/payment/status/${encodeURIComponent(id)}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      return {
        httpStatus: response.status,
        ok: response.ok,
        body: await response.json().catch(() => null),
      };
    }, normalized);
    return paymentStatusSummary(result);
  }

  async charge(request) {
    const key = String(request.idempotencyKey ?? "");
    if (!key) throw new TypeError("idempotencyKey is required");
    if (this.inFlight.has(key)) return this.inFlight.get(key);
    const operation = this.#charge(request);
    this.inFlight.set(key, operation);
    try { return await operation; } finally { this.inFlight.delete(key); }
  }

  async #charge({ amountKopecks, idempotencyKey }) {
    if (!Number.isSafeInteger(amountKopecks) || amountKopecks < 10000) {
      throw new FundingError("invalid_amount", "Polza funding requires at least 100 RUB", { externalChargeStarted: false });
    }
    const status = await this.status();
    if (status.authorization !== "authorized") throw new FundingError("browser_authorization_required", "Polza login is required", { userActionRequired: true, externalChargeStarted: false });
    const previous = this.stateStore?.get(idempotencyKey);
    if (previous?.status === "succeeded") return { transactionId: previous.transactionId, amountKopecks, currency: "RUB" };
    if (previous?.startedAt) {
      const recovered = await this.mcp.findTransaction({ amountKopecks, after: previous.startedAt, excluded: previous.baselineTransactionIds ?? [] });
      if (recovered) {
        const verified = await this.mcp.verifyTransaction({ transactionId: recovered.transactionId, amountKopecks });
        await this.stateStore.set(idempotencyKey, { ...previous, status: "succeeded", transactionId: verified.transactionId });
        return verified;
      }
      if (previous.status !== "prepared") throw new FundingError("charge_result_unknown", "Previous payment attempt is unresolved");
    }
    const retryingPrepared = previous?.status === "prepared";
    if (retryingPrepared && previous.amountKopecks !== amountKopecks) throw new FundingError("idempotency_conflict", "Prepared payment amount does not match", { externalChargeStarted: false });
    const startedAt = retryingPrepared ? previous.startedAt : new Date().toISOString();
    const before = retryingPrepared
      ? { balanceKopecks: previous.beforeBalanceKopecks, currency: "RUB" }
      : await this.mcp.getBalance();
    const baselineTransactionIds = retryingPrepared ? previous.baselineTransactionIds : await this.mcp.getTransactionIds();
    const url = billingUrl(this.dashboardUrl);
    await this.stateStore?.set(idempotencyKey, { status: "prepared", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, baselineTransactionIds, route: "dashboard_saved_method" });
    const chargePage = this.context?.newPage ? await this.context.newPage() : this.page;
    if (!chargePage) throw new FundingError("browser_unavailable", "Polza browser is unavailable", { externalChargeStarted: false });
    const closeAfter = chargePage !== this.page;
    try {
      await chargePage.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      const openButton = chargePage.getByRole("button", { name: /Пополнить баланс/iu }).last();
      await openButton.waitFor({ state: "visible", timeout: 20_000 }).catch(() => null);
      if (!await openButton.isVisible().catch(() => false)) throw new FundingError("payment_control_missing", "Polza top-up form is unavailable", { externalChargeStarted: false });
      await openButton.click();

      const amountInput = chargePage.getByPlaceholder(/5 000 ₽|сумма пополнения/iu).last();
      await amountInput.waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
      if (!await amountInput.isVisible().catch(() => false)) throw new FundingError("payment_control_missing", "Polza amount field is unavailable", { externalChargeStarted: false });
      await amountInput.fill(String(amountKopecks / 100));

      const savedCard = chargePage.getByRole("button", { name: /Карта ••/iu }).first();
      await savedCard.waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
      if (!await savedCard.isVisible().catch(() => false)) throw new FundingError("payment_method_required", "A saved chargeable card is required", { userActionRequired: true, externalChargeStarted: false });
      await savedCard.click();

      const payButton = chargePage.getByRole("button", { name: /Оплатить в 1 клик/iu }).last();
      await payButton.waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
      if (!await payButton.isVisible().catch(() => false)) throw new FundingError("payment_control_missing", "Polza one-click payment control is unavailable", { externalChargeStarted: false });
      if (!await payButton.isEnabled().catch(() => false)) throw new FundingError("payment_method_required", "The saved card cannot be charged", { userActionRequired: true, externalChargeStarted: false });

      await this.stateStore?.set(idempotencyKey, { status: "submission_started", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, baselineTransactionIds, route: "dashboard_saved_method" });
      const paymentResponsePromise = typeof chargePage.waitForResponse === "function"
        ? chargePage.waitForResponse(
          (response) => response.url().includes("/balance/payment/create"),
          { timeout: 15_000 }
        ).catch(() => null)
        : Promise.resolve(null);
      await payButton.click();
      const paymentResponse = await paymentResponsePromise;
      const paymentBody = paymentResponse
        ? await paymentResponse.json().catch(() => null)
        : null;
      const checkoutUrl = topupUrl(paymentBody, this.allowedPaymentHosts);
      const responseSummary = paymentResponseSummary(paymentBody);
      const createdPaymentId = String(
        responseSummary.paymentId
        || responseSummary.depositId
        || responseSummary.operationId
        || ""
      ).trim();
      console.info(JSON.stringify({
        level: "info",
        event: "provider_funding.payment_created",
        provider: "polza",
        amountKopecks,
        paymentId: createdPaymentId || null,
      }));
      await this.stateStore?.set(idempotencyKey, { status: "submission_started", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, baselineTransactionIds, route: "dashboard_saved_method", responseSummary, hasCheckoutUrl: Boolean(checkoutUrl) });
      if (checkoutUrl) {
        await this.stateStore?.set(idempotencyKey, { status: "submission_started", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, baselineTransactionIds, route: "dashboard_saved_method_checkout", checkoutUrl, responseSummary, hasCheckoutUrl: true });
        await chargePage.goto(checkoutUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
        const checkoutPayButton = chargePage.getByRole("button", { name: /оплатить|пополнить|продолжить/iu }).last();
        await checkoutPayButton.waitFor({ state: "visible", timeout: 20_000 }).catch(() => null);
        const checkoutVisible = await checkoutPayButton.isVisible().catch(() => false);
        const checkoutEnabled = checkoutVisible && await checkoutPayButton.isEnabled().catch(() => false);
        if (!checkoutEnabled) {
          throw new FundingError("checkout_payment_control_missing", "The provider checkout cannot be submitted", { externalChargeStarted: false });
        }
        await checkoutPayButton.click();
      }

      const deadline = Date.now() + this.transactionTimeoutMs;
      while (Date.now() < deadline) {
        if (createdPaymentId) {
          const providerPayment = await this.paymentStatus(createdPaymentId, chargePage);
          const providerStatus = String(
            providerPayment.status
            || providerPayment.paymentStatus
            || providerPayment.state
            || ""
          ).trim().toLowerCase();
          if (/^(?:error|failed|canceled|cancelled|declined|not_paid)$/u.test(providerStatus)) {
            console.warn(JSON.stringify({
              level: "warn",
              event: "provider_funding.payment_terminal_unpaid",
              provider: "polza",
              amountKopecks,
              paymentId: createdPaymentId,
              providerStatus,
            }));
            await this.stateStore?.set(idempotencyKey, {
              status: "prepared",
              startedAt,
              amountKopecks,
              beforeBalanceKopecks: before.balanceKopecks,
              baselineTransactionIds,
              route: "dashboard_saved_method",
              lastPaymentId: createdPaymentId,
              lastPaymentStatus: providerStatus,
            });
            throw new FundingError(
              "payment_declined",
              "Polza marked the saved-card payment as unpaid",
              { retryable: true, externalChargeStarted: false, retryAfterSeconds: 3_600 },
            );
          }
        }
        const transaction = await this.mcp.findTransaction({ amountKopecks, after: startedAt, excluded: baselineTransactionIds });
        if (transaction) {
          const verified = await this.mcp.verifyTransaction({ transactionId: transaction.transactionId, amountKopecks });
          const after = await this.mcp.getBalance();
          if (after.balanceKopecks < before.balanceKopecks + amountKopecks) throw new FundingError("balance_delta_mismatch", "Polza balance did not increase by the funded amount");
          await this.stateStore?.set(idempotencyKey, { status: "succeeded", startedAt, amountKopecks, beforeBalanceKopecks: before.balanceKopecks, baselineTransactionIds, transactionId: verified.transactionId, route: "dashboard_saved_method" });
          return verified;
        }
        const challenge = await chargePage.locator('text=/3-D Secure|подтвердите|код из смс|SmartCaptcha|потяните вправо/iu').first().isVisible().catch(() => false);
        if (challenge) throw new FundingError("payment_confirmation_required", "Manual payment confirmation is required", { userActionRequired: true });
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
      throw new FundingError("charge_result_unknown", "Payment result could not be verified");
    } finally {
      if (closeAfter) await chargePage.close().catch(() => null);
    }
  }
}

export { billingUrl, paymentResponseSummary, topupUrl };
