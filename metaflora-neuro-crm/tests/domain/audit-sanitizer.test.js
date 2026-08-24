import { describe, expect, it } from "vitest";

import {
  createSafeAuditEvent,
  sanitizeAuditMetadata,
} from "../../src/domain/audit-sanitizer.js";

describe("safe audit sanitizer", () => {
  it("removes secrets and user prompt/output recursively", () => {
    const input = {
      reasonCode: "manual_review",
      note: "private user text hidden under an innocent key",
      details: "sk-secret-token-value",
      prompt: "private user request",
      output: "private model response",
      apiKey: "sk-secret",
      nested: {
        token: "secret",
        safeCount: 3,
        authorization: "Bearer secret",
      },
      items: [{ password: "secret", provider: "openrouter" }],
    };

    expect(sanitizeAuditMetadata(input)).toEqual({
      reasonCode: "manual_review",
      nested: { safeCount: 3 },
      items: [{ provider: "openrouter" }],
    });
    expect(input.prompt).toBe("private user request");
  });

  it("builds a minimal immutable event and rejects unsafe event fields", () => {
    const event = createSafeAuditEvent({
      id: "audit-1",
      actorId: "admin-1",
      action: "user.credit",
      targetId: "usr-1",
      occurredAt: "2026-07-30T00:00:00.000Z",
      metadata: { amount: 50, content: "private", message: "private text" },
      prompt: "must not be accepted at the top level",
    });

    expect(event).toEqual({
      id: "audit-1",
      actorId: "admin-1",
      action: "user.credit",
      targetId: "usr-1",
      occurredAt: "2026-07-30T00:00:00.000Z",
      metadata: { amount: 50 },
    });
    expect(Object.isFrozen(event)).toBe(true);
  });
});
