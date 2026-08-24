import { describe, expect, it, vi } from "vitest";

import {
  createAdminActionState,
  executeIdempotentAdminAction,
} from "../../src/domain/admin-actions.js";

describe("idempotent admin actions", () => {
  it("runs an action once and replays the stored result", () => {
    const handler = vi.fn(() => ({
      userId: "usr-1",
      status: "blocked",
      output: "private model response",
      accessToken: "private token",
    }));
    const command = {
      idempotencyKey: "block-usr-1-001",
      actorId: "admin-1",
      action: "user.block",
      targetId: "usr-1",
      occurredAt: "2026-07-30T12:00:00.000Z",
      metadata: { reasonCode: "abuse", prompt: "must never persist" },
    };

    const first = executeIdempotentAdminAction(
      createAdminActionState(),
      command,
      handler,
    );
    const replay = executeIdempotentAdminAction(first.state, command, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.result).toEqual(first.result);
    expect(first.result).toEqual({ userId: "usr-1", status: "blocked" });
    expect(replay.state).toBe(first.state);
    expect(first.state.auditLog[0]).not.toHaveProperty("metadata.prompt");
  });

  it("rejects reuse of a key for a different administrative operation", () => {
    const first = executeIdempotentAdminAction(
      createAdminActionState(),
      {
        idempotencyKey: "admin-operation-001",
        actorId: "admin-1",
        action: "user.block",
        targetId: "usr-1",
        occurredAt: "2026-07-30T12:00:00.000Z",
      },
      () => ({ status: "blocked" }),
    );

    expect(() =>
      executeIdempotentAdminAction(
        first.state,
        {
          idempotencyKey: "admin-operation-001",
          actorId: "admin-1",
          action: "user.credit",
          targetId: "usr-2",
          occurredAt: "2026-07-30T12:01:00.000Z",
        },
        () => ({ balance: 100 }),
      ),
    ).toThrow("Idempotency key conflict");
  });

  it("rejects cross-actor reuse of an idempotency key", () => {
    const first = executeIdempotentAdminAction(
      createAdminActionState(),
      {
        idempotencyKey: "admin-operation-002",
        actorId: "admin-1",
        action: "user.block",
        targetId: "usr-1",
        occurredAt: "2026-07-30T12:00:00.000Z",
      },
      () => ({ status: "blocked" }),
    );

    expect(() =>
      executeIdempotentAdminAction(
        first.state,
        {
          idempotencyKey: "admin-operation-002",
          actorId: "admin-2",
          action: "user.block",
          targetId: "usr-1",
          occurredAt: "2026-07-30T12:01:00.000Z",
        },
        () => ({ status: "blocked" }),
      ),
    ).toThrow("Idempotency key conflict");
  });

  it("validates commands before invoking the handler", () => {
    const handler = vi.fn();

    expect(() =>
      executeIdempotentAdminAction(
        createAdminActionState(),
        { idempotencyKey: "", actorId: "admin-1", action: "user.block" },
        handler,
      ),
    ).toThrow("idempotencyKey");
    expect(handler).not.toHaveBeenCalled();
  });
});
