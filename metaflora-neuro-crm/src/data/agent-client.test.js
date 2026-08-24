import { describe, expect, it, vi } from "vitest";

import {
  executeDiagnosticRepair,
  injectControlledDiagnosticFailure,
  loadAgentDiagnostics,
  loadAgentStatus,
  sendAgentMessage,
} from "./agent-client";

describe("agent client", () => {
  it("loads fail-closed status without exposing secrets", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          connected: false,
          missingEnv: ["OPENROUTER_API_KEY", "CRM_AGENT_MODEL"],
          model: null,
        },
      }),
    });

    const status = await loadAgentStatus(fetchImpl);

    expect(status.connected).toBe(false);
    expect(status.missingEnv).toEqual(["OPENROUTER_API_KEY", "CRM_AGENT_MODEL"]);
    expect(JSON.stringify(status)).not.toMatch(/secret|sk-|bearer/i);
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/agent/status",
      expect.objectContaining({ method: "GET", credentials: "same-origin" }),
    );
  });

  it("sends chat messages through the server endpoint only", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { csrfToken: "csrf-test-token" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            answer: "План готов.",
            repairPlan: ["Проверить readiness"],
            toolActions: [{ id: "inspect_readiness", mode: "read-only" }],
          },
        }),
      });

    const result = await sendAgentMessage(
      [{ role: "user", content: "что сломано?" }],
      fetchImpl,
    );

    expect(result.repairPlan).toEqual(["Проверить readiness"]);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "/api/session",
      expect.objectContaining({ method: "GET", credentials: "same-origin" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "/api/agent/chat",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "x-csrf-token": "csrf-test-token",
        },
      }),
    );
  });

  it("rejects disconnected envelopes with the server message", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { csrfToken: "csrf-test-token" },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ success: false, error: "агент не подключён" }),
      });

    await expect(
      sendAgentMessage([{ role: "user", content: "помоги" }], fetchImpl),
    ).rejects.toThrow("агент не подключён");
  });

  it("loads the managed diagnostic snapshot", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          status: "degraded",
          checkedAt: "2026-08-02T10:00:00.000Z",
          checks: [{ id: "synthetic-canary", status: "failed" }],
          audit: [],
        },
      }),
    });

    const result = await loadAgentDiagnostics(fetchImpl);

    expect(result.status).toBe("degraded");
    expect(result.checks[0].status).toBe("failed");
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/agent/diagnostics",
      expect.objectContaining({ method: "GET", credentials: "same-origin" }),
    );
  });

  it("runs protected diagnostic test and repair commands with independent idempotency keys", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { csrfToken: "csrf-test-token" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { status: "failed" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { csrfToken: "csrf-test-token" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { status: "healthy", verified: true } }),
      });

    await injectControlledDiagnosticFailure(fetchImpl);
    const repaired = await executeDiagnosticRepair("repair_synthetic_canary", fetchImpl);

    expect(repaired).toEqual(expect.objectContaining({ status: "healthy", verified: true }));
    expect(fetchImpl.mock.calls[1][0]).toBe("/api/agent/diagnostics/test-failure");
    expect(fetchImpl.mock.calls[3][0]).toBe("/api/agent/diagnostics/repair");
    const failureBody = JSON.parse(fetchImpl.mock.calls[1][1].body);
    const repairBody = JSON.parse(fetchImpl.mock.calls[3][1].body);
    expect(failureBody.idempotencyKey).not.toBe(repairBody.idempotencyKey);
    expect(repairBody).toEqual(expect.objectContaining({
      actionId: "repair_synthetic_canary",
      approval: "ПОДТВЕРЖДАЮ",
    }));
  });
});
