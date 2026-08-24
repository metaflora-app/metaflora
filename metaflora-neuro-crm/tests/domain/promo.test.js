import { describe, expect, it } from "vitest";

import { validatePromo } from "../../src/domain/promo.js";

const promo = {
  code: "WELCOME20",
  active: true,
  discountType: "percent",
  discountValue: 20,
  startsAt: "2026-07-01T00:00:00.000Z",
  expiresAt: "2026-08-01T00:00:00.000Z",
  redemptionCount: 2,
  maxRedemptions: 100,
  perUserLimit: 1,
  minimumPurchase: 50,
  allowedPlans: ["pro"],
};

describe("promo validation", () => {
  it("normalizes code and calculates a bounded discount", () => {
    expect(
      validatePromo(promo, {
        code: " welcome20 ",
        userRedemptionCount: 0,
        purchaseAmount: 100,
        plan: "pro",
        now: new Date("2026-07-30T00:00:00.000Z"),
      }),
    ).toEqual({
      valid: true,
      normalizedCode: "WELCOME20",
      discountAmount: 20,
      finalAmount: 80,
    });
  });

  it.each([
    [{ ...promo, active: false }, {}, "inactive"],
    [{ ...promo, maxRedemptions: 2 }, {}, "exhausted"],
    [promo, { userRedemptionCount: 1 }, "user_limit"],
    [promo, { purchaseAmount: 49 }, "minimum_purchase"],
    [promo, { plan: "free" }, "plan_not_allowed"],
  ])("rejects invalid promo usage with a safe reason", (value, overrides, reason) => {
    expect(
      validatePromo(value, {
        code: "WELCOME20",
        userRedemptionCount: 0,
        purchaseAmount: 100,
        plan: "pro",
        now: new Date("2026-07-30T00:00:00.000Z"),
        ...overrides,
      }),
    ).toEqual({ valid: false, reason });
  });

  it("rejects invalid monetary and discount configuration", () => {
    expect(
      validatePromo(promo, {
        code: "WELCOME20",
        purchaseAmount: -1,
        plan: "pro",
      }),
    ).toEqual({ valid: false, reason: "invalid_purchase" });
    expect(
      validatePromo(
        { ...promo, discountValue: 101 },
        { code: "WELCOME20", purchaseAmount: 100, plan: "pro" },
      ),
    ).toEqual({ valid: false, reason: "invalid_configuration" });
  });

  it.each([
    [{ ...promo, startsAt: "not-a-date" }, {}, "invalid_configuration"],
    [{ ...promo, expiresAt: "not-a-date" }, {}, "invalid_configuration"],
    [promo, { now: "not-a-date" }, "invalid_date"],
  ])("rejects malformed date windows", (value, overrides, reason) => {
    expect(
      validatePromo(value, {
        code: "WELCOME20",
        purchaseAmount: 100,
        plan: "pro",
        ...overrides,
      }),
    ).toEqual({ valid: false, reason });
  });
});
