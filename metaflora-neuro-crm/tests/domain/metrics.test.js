import { describe, expect, it } from "vitest";

import {
  calculateDashboardMetrics,
  calculateLedgerMetrics,
  calculateProviderMetrics,
  calculateUserMetrics,
} from "../../src/domain/metrics.js";

describe("dashboard metrics", () => {
  const now = new Date("2026-07-30T12:00:00.000Z");

  it("calculates user totals without mutating the input", () => {
    const users = Object.freeze([
      Object.freeze({
        id: "usr-1",
        status: "active",
        registeredAt: "2026-07-02T00:00:00.000Z",
        lastActiveAt: "2026-07-29T00:00:00.000Z",
      }),
      Object.freeze({
        id: "usr-2",
        status: "active",
        registeredAt: "2026-06-01T00:00:00.000Z",
        lastActiveAt: "2026-06-01T00:00:00.000Z",
      }),
      Object.freeze({
        id: "usr-3",
        status: "blocked",
        registeredAt: "2026-07-30T00:00:00.000Z",
        lastActiveAt: "2026-07-30T00:00:00.000Z",
      }),
    ]);

    expect(calculateUserMetrics(users, { now, activeWithinDays: 30 })).toEqual({
      totalUsers: 3,
      activeUsers: 1,
      blockedUsers: 1,
      newUsersThisMonth: 2,
    });
  });

  it("calculates ledger and provider metrics from settled activity", () => {
    const ledger = [
      { type: "credit", amount: 100, status: "settled" },
      { type: "debit", amount: 35, status: "settled" },
      { type: "credit", amount: 99, status: "void" },
    ];
    const attempts = [
      { status: "success", latencyMs: 100 },
      { status: "failure", latencyMs: 300 },
    ];

    expect(calculateLedgerMetrics(ledger)).toEqual({
      totalCredited: 100,
      totalDebited: 35,
      metacoinInCirculation: 65,
    });
    expect(calculateProviderMetrics(attempts)).toEqual({
      totalRequests: 2,
      successfulRequests: 1,
      successRate: 50,
      averageLatencyMs: 200,
    });
  });

  it("composes the complete dashboard result", () => {
    expect(
      calculateDashboardMetrics(
        {
          users: [
            {
              status: "active",
              registeredAt: "2026-07-01T00:00:00.000Z",
              lastActiveAt: "2026-07-29T00:00:00.000Z",
            },
          ],
          ledgerEntries: [
            { type: "credit", amount: 50, status: "settled" },
          ],
          providerAttempts: [],
        },
        { now },
      ),
    ).toMatchObject({
      totalUsers: 1,
      activeUsers: 1,
      metacoinInCirculation: 50,
      totalRequests: 0,
      successRate: 0,
      averageLatencyMs: 0,
    });
  });
});
