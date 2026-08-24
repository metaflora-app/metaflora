import {
  applyMetacoinTransaction,
  calculateMetacoinBalance,
  calculateDashboardMetrics,
  filterUsers,
} from "../domain/index.js";

function clone(value) {
  return structuredClone(value);
}

export const mockCrmSeed = Object.freeze({
  users: Object.freeze([
    Object.freeze({
      id: "usr-1001",
      name: "Ирина Волкова",
      email: "irina.volkova@example.ru",
      telegramUsername: "@irina_ai",
      status: "active",
      plan: "pro",
      registeredAt: "2026-07-04T09:14:00.000Z",
      lastActiveAt: "2026-07-30T08:42:00.000Z",
      metacoinBalance: 740,
      requestCount: 186,
    }),
    Object.freeze({
      id: "usr-1002",
      name: "Максим Орлов",
      email: "maxim.orlov@example.ru",
      telegramUsername: "@max_orlov",
      status: "active",
      plan: "business",
      registeredAt: "2026-06-12T13:30:00.000Z",
      lastActiveAt: "2026-07-29T19:05:00.000Z",
      metacoinBalance: 2_480,
      requestCount: 912,
    }),
    Object.freeze({
      id: "usr-1003",
      name: "Анна Ким",
      email: "anna.kim@example.ru",
      telegramUsername: "@annakim",
      status: "blocked",
      plan: "free",
      registeredAt: "2026-05-21T16:10:00.000Z",
      lastActiveAt: "2026-06-03T10:20:00.000Z",
      metacoinBalance: 35,
      requestCount: 24,
    }),
    Object.freeze({
      id: "usr-1004",
      name: "Дмитрий Лебедев",
      email: "d.lebedev@example.ru",
      telegramUsername: "@d_lebedev",
      status: "active",
      plan: "free",
      registeredAt: "2026-07-27T06:50:00.000Z",
      lastActiveAt: "2026-07-28T14:12:00.000Z",
      metacoinBalance: 110,
      requestCount: 15,
    }),
  ]),
  ledgerEntries: Object.freeze([
    Object.freeze({
      id: "tx-2001",
      userId: "usr-1001",
      type: "credit",
      amount: 1_000,
      reason: "plan_purchase",
      status: "settled",
      createdAt: "2026-07-04T09:15:00.000Z",
    }),
    Object.freeze({
      id: "tx-2002",
      userId: "usr-1001",
      type: "debit",
      amount: 260,
      reason: "ai_usage",
      status: "settled",
      createdAt: "2026-07-29T18:10:00.000Z",
    }),
    Object.freeze({
      id: "tx-2003",
      userId: "usr-1002",
      type: "credit",
      amount: 3_000,
      reason: "plan_purchase",
      status: "settled",
      createdAt: "2026-06-12T13:31:00.000Z",
    }),
    Object.freeze({
      id: "tx-2004",
      userId: "usr-1002",
      type: "debit",
      amount: 520,
      reason: "ai_usage",
      status: "settled",
      createdAt: "2026-07-30T07:40:00.000Z",
    }),
    Object.freeze({
      id: "tx-2005",
      userId: "usr-1003",
      type: "credit",
      amount: 35,
      reason: "welcome_bonus",
      status: "settled",
      createdAt: "2026-05-21T16:11:00.000Z",
    }),
    Object.freeze({
      id: "tx-2006",
      userId: "usr-1004",
      type: "credit",
      amount: 150,
      reason: "welcome_bonus",
      status: "settled",
      createdAt: "2026-07-27T06:51:00.000Z",
    }),
    Object.freeze({
      id: "tx-2007",
      userId: "usr-1004",
      type: "debit",
      amount: 40,
      reason: "ai_usage",
      status: "settled",
      createdAt: "2026-07-28T14:13:00.000Z",
    }),
  ]),
  providers: Object.freeze([
    Object.freeze({
      id: "openrouter",
      name: "OpenRouter",
      enabled: true,
      priority: 1,
      status: "operational",
      successRate: 99.2,
      averageLatencyMs: 1_180,
    }),
    Object.freeze({
      id: "polza",
      name: "Polza AI",
      enabled: true,
      priority: 2,
      status: "operational",
      successRate: 97.8,
      averageLatencyMs: 1_460,
    }),
    Object.freeze({
      id: "requesty",
      name: "Requesty",
      enabled: true,
      priority: 3,
      status: "degraded",
      successRate: 91.4,
      averageLatencyMs: 2_310,
    }),
  ]),
  providerAttempts: Object.freeze([
    Object.freeze({
      id: "req-3001",
      providerId: "openrouter",
      status: "success",
      latencyMs: 940,
      occurredAt: "2026-07-30T08:40:00.000Z",
    }),
    Object.freeze({
      id: "req-3002",
      providerId: "openrouter",
      status: "failure",
      latencyMs: 2_500,
      occurredAt: "2026-07-30T08:41:00.000Z",
      errorCode: "upstream_timeout",
    }),
    Object.freeze({
      id: "req-3003",
      providerId: "polza",
      status: "success",
      latencyMs: 1_360,
      occurredAt: "2026-07-30T08:41:02.000Z",
    }),
  ]),
  promos: Object.freeze([
    Object.freeze({
      id: "promo-4001",
      code: "WELCOME20",
      active: true,
      discountType: "percent",
      discountValue: 20,
      startsAt: "2026-07-01T00:00:00.000Z",
      expiresAt: "2026-08-31T21:00:00.000Z",
      redemptionCount: 143,
      maxRedemptions: 1_000,
      perUserLimit: 1,
      minimumPurchase: 100,
      allowedPlans: ["pro", "business"],
    }),
  ]),
  auditLog: Object.freeze([
    Object.freeze({
      id: "audit-5001",
      actorId: "admin-demo",
      action: "user.status_changed",
      targetId: "usr-1003",
      occurredAt: "2026-07-29T10:00:00.000Z",
      metadata: Object.freeze({
        previousStatus: "active",
        nextStatus: "blocked",
        reasonCode: "policy_violation",
      }),
    }),
  ]),
});

function validateSeed(seed) {
  for (const collection of [
    "users",
    "ledgerEntries",
    "providers",
    "providerAttempts",
    "promos",
    "auditLog",
  ]) {
    if (!Array.isArray(seed[collection])) {
      throw new TypeError(`Mock repository seed is missing ${collection}`);
    }
  }
}

function isSameTransaction(existing, candidate) {
  return (
    existing.userId === candidate.userId?.trim() &&
    existing.type === candidate.type &&
    existing.amount === candidate.amount &&
    existing.reason === candidate.reason &&
    existing.createdAt === candidate.createdAt
  );
}

export function createMockRepository(seed = mockCrmSeed) {
  validateSeed(seed);
  let state = clone(seed);

  return Object.freeze({
    async getSnapshot() {
      return clone(state);
    },

    async getDashboardMetrics(options) {
      return calculateDashboardMetrics(state, options);
    },

    async listUsers(filters = {}) {
      return clone(filterUsers(state.users, filters));
    },

    async getUser(userId) {
      const user = state.users.find(({ id }) => id === userId);
      return user ? clone(user) : null;
    },

    async updateUserStatus(userId, status) {
      if (!["active", "blocked"].includes(status)) {
        throw new TypeError("Unsupported user status");
      }
      const user = state.users.find(({ id }) => id === userId);
      if (!user) throw new Error("User not found");
      state = {
        ...state,
        users: state.users.map((item) =>
          item.id === userId ? { ...item, status } : item,
        ),
      };
      return clone({ ...user, status });
    },

    async listLedgerEntries({ userId } = {}) {
      return clone(
        userId
          ? state.ledgerEntries.filter((entry) => entry.userId === userId)
          : state.ledgerEntries,
      );
    },

    async addLedgerEntry(transaction) {
      const userId = transaction.userId?.trim();
      if (!state.users.some(({ id }) => id === userId)) {
        throw new Error("User not found");
      }
      const normalizedTransaction = { ...transaction, userId };
      const existing = state.ledgerEntries.find(
        ({ id }) => id === transaction.id?.trim(),
      );
      if (existing) {
        if (!isSameTransaction(existing, normalizedTransaction)) {
          throw new Error("Transaction id conflict");
        }
        return { entry: clone(existing), replayed: true };
      }

      const ledgerEntries = applyMetacoinTransaction(
        state.ledgerEntries,
        normalizedTransaction,
      );
      const users = state.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              metacoinBalance: calculateMetacoinBalance(
                ledgerEntries,
                userId,
              ),
            }
          : user,
      );
      state = { ...state, ledgerEntries, users };
      return {
        entry: clone(ledgerEntries[ledgerEntries.length - 1]),
        replayed: false,
      };
    },

    async listProviders() {
      return clone(state.providers);
    },

    async listProviderAttempts({ providerId } = {}) {
      return clone(
        providerId
          ? state.providerAttempts.filter(
              (attempt) => attempt.providerId === providerId,
            )
          : state.providerAttempts,
      );
    },

    async listPromos() {
      return clone(state.promos);
    },

    async listAuditEvents({ targetId } = {}) {
      return clone(
        targetId
          ? state.auditLog.filter((event) => event.targetId === targetId)
          : state.auditLog,
      );
    },

    async reset() {
      state = clone(seed);
    },
  });
}
