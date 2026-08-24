import { normalizeIncidents } from "../domain/alert-presentation.js";

const DASHBOARD_KEYS = Object.freeze([
  "users",
  "payments",
  "financeAllocations",
  "wallet",
  "walletLedger",
  "payouts",
  "referralPartners",
  "providerTopups",
  "providerFunding",
  "subscriptionUpgrades",
  "yookassaConfirmations",
  "ledgerEntries",
  "generations",
  "providers",
  "incidents",
  "promos",
  "routes",
  "audit",
  "settings",
  "workflow",
]);

export function validateDashboardPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new TypeError("dashboard payload must be an object");
  }

  const data = {};
  for (const key of DASHBOARD_KEYS) {
    const value = payload[key];
    if (["settings", "workflow", "wallet"].includes(key)) {
      data[key] = value && typeof value === "object" ? value : {};
    } else if (key === "incidents") {
      data[key] = normalizeIncidents(value, payload.generations);
    } else {
      data[key] = Array.isArray(value) ? value : [];
    }
  }
  return data;
}

export async function loadDashboard(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetch implementation is required");
  }

  const response = await fetchImpl("/api/dashboard", {
    method: "GET",
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.success !== true) {
    throw new Error(body.error || `dashboard request failed: ${response.status}`);
  }

  return validateDashboardPayload(body.data);
}
