import { describe, expect, it } from "vitest";

import {
  createMockRepository,
  mockCrmSeed,
} from "../../src/data/mock-repository.js";

describe("mock CRM repository", () => {
  it("returns detached realistic records and supports filtered user reads", async () => {
    const repository = createMockRepository(mockCrmSeed);
    const users = await repository.listUsers({
      statuses: ["active"],
      query: "ирина",
    });

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      id: "usr-1001",
      status: "active",
      plan: "pro",
    });
    users[0].name = "changed outside repository";
    expect((await repository.getUser("usr-1001")).name).toBe("Ирина Волкова");
  });

  it("applies transactions immutably and idempotently", async () => {
    const repository = createMockRepository(mockCrmSeed);
    const before = await repository.listLedgerEntries({ userId: "usr-1001" });
    const transaction = {
      id: "tx-test-credit",
      userId: "usr-1001",
      type: "credit",
      amount: 25,
      reason: "admin_adjustment",
      createdAt: "2026-07-30T12:00:00.000Z",
    };

    const first = await repository.addLedgerEntry(transaction);
    const replay = await repository.addLedgerEntry(transaction);
    const after = await repository.listLedgerEntries({ userId: "usr-1001" });
    const user = await repository.getUser("usr-1001");

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(after).toHaveLength(before.length + 1);
    expect(user.metacoinBalance).toBe(765);

    await expect(
      repository.addLedgerEntry({ ...transaction, amount: 30 }),
    ).rejects.toThrow("Transaction id conflict");
  });

  it("does not expose secrets, prompts or generated output in the seed", () => {
    const serialized = JSON.stringify(mockCrmSeed).toLowerCase();

    expect(serialized).not.toMatch(
      /api[_-]?key|password|authorization|prompt|generatedoutput|modeloutput/,
    );
  });

  it("provides detached dashboard, provider, promo and audit projections", async () => {
    const repository = createMockRepository(mockCrmSeed);
    const [snapshot, metrics, providers, attempts, promos, auditEvents] =
      await Promise.all([
        repository.getSnapshot(),
        repository.getDashboardMetrics({
          now: new Date("2026-07-30T12:00:00.000Z"),
        }),
        repository.listProviders(),
        repository.listProviderAttempts({ providerId: "openrouter" }),
        repository.listPromos(),
        repository.listAuditEvents({ targetId: "usr-1003" }),
      ]);

    expect(snapshot.users).toHaveLength(4);
    expect(metrics).toMatchObject({ totalUsers: 4, blockedUsers: 1 });
    expect(providers).toHaveLength(3);
    expect(attempts.every(({ providerId }) => providerId === "openrouter")).toBe(
      true,
    );
    expect(promos[0].code).toBe("WELCOME20");
    expect(auditEvents[0].targetId).toBe("usr-1003");
  });

  it("updates status with validation and restores seed state on reset", async () => {
    const repository = createMockRepository(mockCrmSeed);

    await expect(repository.updateUserStatus("missing", "active")).rejects.toThrow(
      "User not found",
    );
    await expect(repository.updateUserStatus("usr-1001", "deleted")).rejects.toThrow(
      "Unsupported user status",
    );
    await expect(repository.getUser("missing")).resolves.toBeNull();

    await repository.updateUserStatus("usr-1001", "blocked");
    expect((await repository.getUser("usr-1001")).status).toBe("blocked");
    await repository.reset();
    expect((await repository.getUser("usr-1001")).status).toBe("active");
    expect(await repository.listProviderAttempts()).toHaveLength(3);
    expect(await repository.listLedgerEntries()).toHaveLength(7);
    expect(await repository.listAuditEvents()).toHaveLength(1);
  });

  it("validates the repository seed", () => {
    expect(() =>
      createMockRepository({ ...mockCrmSeed, users: undefined }),
    ).toThrow("Mock repository seed is missing users");
  });

  it("rejects orphan ledger entries", async () => {
    const repository = createMockRepository(mockCrmSeed);

    await expect(
      repository.addLedgerEntry({
        id: "tx-orphan",
        userId: "missing-user",
        type: "credit",
        amount: 10,
      }),
    ).rejects.toThrow("User not found");
  });

  it("normalizes a transaction user id before updating the balance", async () => {
    const repository = createMockRepository(mockCrmSeed);

    await repository.addLedgerEntry({
      id: "tx-normalized-user",
      userId: " usr-1001 ",
      type: "credit",
      amount: 10,
      reason: "admin_adjustment",
      createdAt: "2026-07-30T13:00:00.000Z",
    });

    expect((await repository.getUser("usr-1001")).metacoinBalance).toBe(750);
  });
});
