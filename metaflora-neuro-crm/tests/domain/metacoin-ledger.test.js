import { describe, expect, it } from "vitest";

import {
  applyMetacoinTransaction,
  calculateMetacoinBalance,
} from "../../src/domain/metacoin-ledger.js";

describe("immutable metacoin ledger", () => {
  it("credits and debits by returning new ledger state", () => {
    const initial = Object.freeze([
      Object.freeze({
        id: "tx-1",
        userId: "usr-1",
        type: "credit",
        amount: 100,
        status: "settled",
      }),
    ]);

    const next = applyMetacoinTransaction(initial, {
      id: "tx-2",
      userId: "usr-1",
      type: "debit",
      amount: 25,
      reason: "generation",
      createdAt: "2026-07-30T12:00:00.000Z",
    });

    expect(next).not.toBe(initial);
    expect(initial).toHaveLength(1);
    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({ status: "settled", amount: 25 });
    expect(calculateMetacoinBalance(next, "usr-1")).toBe(75);
  });

  it("rejects duplicate transaction ids and insufficient balance", () => {
    const ledger = [
      {
        id: "tx-1",
        userId: "usr-1",
        type: "credit",
        amount: 10,
        status: "settled",
      },
    ];

    expect(() =>
      applyMetacoinTransaction(ledger, {
        id: " tx-1 ",
        userId: "usr-1",
        type: "credit",
        amount: 5,
      }),
    ).toThrow("Transaction id already exists");
    expect(() =>
      applyMetacoinTransaction(ledger, {
        id: "tx-2",
        userId: "usr-1",
        type: "debit",
        amount: 11,
      }),
    ).toThrow("Insufficient metacoin balance");
  });

  it("normalizes identity fields before calculating a debit", () => {
    const next = applyMetacoinTransaction(
      [
        {
          id: "tx-1",
          userId: "usr-1",
          type: "credit",
          amount: 10,
          status: "settled",
        },
      ],
      {
        id: " tx-2 ",
        userId: " usr-1 ",
        type: "debit",
        amount: 5,
      },
    );

    expect(next[1]).toMatchObject({ id: "tx-2", userId: "usr-1" });
    expect(calculateMetacoinBalance(next, "usr-1")).toBe(5);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects invalid amount %s", (amount) => {
    expect(() =>
      applyMetacoinTransaction([], {
        id: "tx-invalid",
        userId: "usr-1",
        type: "credit",
        amount,
      }),
    ).toThrow("positive integer");
  });
});
