import { describe, expect, it } from "vitest";
import { demoDashboardData } from "./demo-dashboard.js";

const FORBIDDEN_CONTENT_KEYS = new Set([
  "prompt",
  "response",
  "output",
  "input",
  "content",
  "messages",
  "transcript",
  "lyrics",
]);

function expectUniqueIds(records, collectionName) {
  const ids = records.map(({ id }) => id);
  expect(
    new Set(ids).size,
    `${collectionName} должен содержать уникальные ID`,
  ).toBe(ids.length);
}

function collectKeys(value, keys = []) {
  if (!value || typeof value !== "object") return keys;

  for (const [key, nestedValue] of Object.entries(value)) {
    keys.push(key.toLocaleLowerCase("en"));
    collectKeys(nestedValue, keys);
  }

  return keys;
}

function expectDeeplyFrozen(value) {
  if (!value || typeof value !== "object") return;
  expect(Object.isFrozen(value)).toBe(true);
  Object.values(value).forEach(expectDeeplyFrozen);
}

describe("demoDashboardData", () => {
  it("даёт CRM достаточно разных тестовых пользователей", () => {
    expect(demoDashboardData.users.length).toBeGreaterThanOrEqual(12);
    expectUniqueIds(demoDashboardData.users, "users");

    expect(new Set(demoDashboardData.users.map(({ status }) => status))).toEqual(
      new Set(["active", "blocked", "pending", "archived"]),
    );
    expect(new Set(demoDashboardData.users.map(({ plan }) => plan))).toEqual(
      new Set(["новичок", "любитель", "автор", "исследователь", "эксперт"]),
    );

    for (const user of demoDashboardData.users) {
      expect(user.telegramUsername).toMatch(/^@[a-z0-9_]{5,32}$/i);
      expect(user.metacoinBalance).toBeGreaterThanOrEqual(0);
      expect(user.totalMetacoinsSpent).toBeGreaterThanOrEqual(0);
      expect(user.totalPaidRub).toBeGreaterThanOrEqual(0);
      expect(Date.parse(user.registeredAt)).not.toBeNaN();
      expect(Date.parse(user.lastSeenAt)).not.toBeNaN();
    }
  });

  it("покрывает полный жизненный цикл тестовых платежей", () => {
    expectUniqueIds(demoDashboardData.payments, "payments");
    expect(new Set(demoDashboardData.payments.map(({ status }) => status))).toEqual(
      new Set(["succeeded", "pending", "failed", "canceled", "refunded"]),
    );
    expect(demoDashboardData.payments.some(({ paymentMethod }) => paymentMethod === "telegram_stars")).toBe(true);

    const userIds = new Set(demoDashboardData.users.map(({ id }) => id));
    for (const payment of demoDashboardData.payments) {
      expect(userIds.has(payment.userId)).toBe(true);
      expect(payment.amount).toBeGreaterThan(0);
      expect(["RUB", "XTR"]).toContain(payment.currency);
      expect(["Т-Банк", "Telegram Stars"]).toContain(payment.provider);
      expect(payment.environment).toBe("test");
      expect(payment.idempotencyKey).toMatch(/^idem_/);
    }
  });

  it("связывает ledger с пользователями и платежами без двойного списания", () => {
    expectUniqueIds(demoDashboardData.ledgerEntries, "ledgerEntries");

    const userIds = new Set(demoDashboardData.users.map(({ id }) => id));
    const paymentIds = new Set(demoDashboardData.payments.map(({ id }) => id));
    const idempotencyKeys = demoDashboardData.ledgerEntries.map(
      ({ idempotencyKey }) => idempotencyKey,
    );

    expect(new Set(idempotencyKeys).size).toBe(idempotencyKeys.length);

    for (const entry of demoDashboardData.ledgerEntries) {
      expect(userIds.has(entry.userId)).toBe(true);
      expect(["credit", "debit"]).toContain(entry.type);
      expect(entry.amount).toBeGreaterThan(0);
      expect(["settled", "pending", "reversed"]).toContain(entry.status);
      if (entry.paymentId) expect(paymentIds.has(entry.paymentId)).toBe(true);
    }
  });

  it("хранит по генерациям только технические метаданные", () => {
    expectUniqueIds(demoDashboardData.generations, "generations");
    expect(
      new Set(demoDashboardData.generations.map(({ modality }) => modality)),
    ).toEqual(new Set(["text", "image", "video", "audio"]));
    expect(
      new Set(demoDashboardData.generations.map(({ status }) => status)),
    ).toEqual(
      new Set(["queued", "running", "completed", "failed", "canceled"]),
    );

    const userIds = new Set(demoDashboardData.users.map(({ id }) => id));
    for (const generation of demoDashboardData.generations) {
      expect(userIds.has(generation.userId)).toBe(true);
      expect(generation.requestId).toMatch(/^req_/);
      expect(generation.metacoinCost).toBeGreaterThanOrEqual(0);
      expect(collectKeys(generation)).not.toEqual(
        expect.arrayContaining([...FORBIDDEN_CONTENT_KEYS]),
      );
    }
  });

  it("описывает реальных провайдеров и валидные резервные маршруты", () => {
    expectUniqueIds(demoDashboardData.providers, "providers");
    expect(demoDashboardData.providers.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "OpenRouter",
        "Polza AI",
        "Requesty",
        "RouterAI",
        "Replicate",
        "ElevenLabs",
        "fal.ai",
      ]),
    );
    expect(demoDashboardData.providers.some(({ id }) => id === "kie")).toBe(false);

    const providerNames = new Set(
      demoDashboardData.providers.map(({ name }) => name),
    );
    for (const route of demoDashboardData.routes) {
      expect(route.steps.length).toBeGreaterThanOrEqual(2);
      expect(route.steps.every(({ provider }) => providerNames.has(provider))).toBe(
        true,
      );
    }
  });

  it("показывает активные резервы Polza/RouterAI и инцидент RouterAI в CRM", () => {
    expect(demoDashboardData.financeAllocations).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "api_reserve", provider: "Polza" }),
      expect.objectContaining({ category: "api_reserve", provider: "RouterAI" }),
    ]));
    expect(demoDashboardData.incidents).toEqual(expect.arrayContaining([
      expect.objectContaining({ service: "RouterAI" }),
    ]));
    expect(JSON.stringify(demoDashboardData.incidents)).not.toMatch(/KIE/i);
  });

  it("наполняет операционные разделы инцидентами, промокодами и аудитом", () => {
    expectUniqueIds(demoDashboardData.incidents, "incidents");
    expectUniqueIds(demoDashboardData.promos, "promos");
    expectUniqueIds(demoDashboardData.audit, "audit");

    expect(new Set(demoDashboardData.incidents.map(({ status }) => status))).toEqual(
      new Set(["open", "acknowledged", "resolved"]),
    );
    expect(new Set(demoDashboardData.incidents.map(({ severity }) => severity))).toEqual(
      new Set(["critical", "warning", "info"]),
    );
    expect(new Set(demoDashboardData.promos.map(({ status }) => status))).toEqual(
      new Set(["active", "paused", "scheduled", "expired", "exhausted"]),
    );
    expect(demoDashboardData.audit.some(({ status }) => status === "failure")).toBe(
      true,
    );
  });

  it("содержит настройки безопасного серверного контура", () => {
    expect(demoDashboardData.settings).toMatchObject({
      mfa: true,
      readAudit: true,
      redaction: true,
      repairApproval: true,
      liveProviderCalls: false,
      livePaymentCharges: false,
    });
  });

  it("экспортирует полностью неизменяемый снимок", () => {
    expectDeeplyFrozen(demoDashboardData);
  });
});
