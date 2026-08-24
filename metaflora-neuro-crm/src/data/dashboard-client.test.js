import { describe, expect, it, vi } from "vitest";
import { loadDashboard, validateDashboardPayload } from "./dashboard-client";

describe("dashboard client", () => {
  it("normalizes missing collections without mutating input", () => {
    const source = { users: [{ id: "u-1" }], settings: { compact: true } };
    const normalized = validateDashboardPayload(source);
    expect(normalized.users).toEqual([{ id: "u-1" }]);
    expect(normalized.payments).toEqual([]);
    expect(normalized.settings).toEqual({ compact: true });
    expect(source).toEqual({
      users: [{ id: "u-1" }],
      settings: { compact: true },
    });
  });

  it("normalizes failed generations into safe incidents with provider and model metadata", () => {
    const source = {
      generations: [
        {
          id: "gen-failed-1",
          status: "failed",
          provider: "kie",
          model: "Kling 3",
          requestId: "req_gen-failed-1",
          errorCode: "provider_timeout",
        },
      ],
      incidents: [
        {
          id: "provider:call-1",
          title: "unknown provider: provider_error",
          summary: "Authorization: Bearer private-token",
          source: "provider_api_calls",
          service: "unknown provider",
          errorCode: "provider_error",
          status: "open",
          severity: "warning",
        },
      ],
    };

    const normalized = validateDashboardPayload(source);
    const generationIncident = normalized.incidents.find(
      ({ id }) => id === "generation:gen-failed-1",
    );
    const providerIncident = normalized.incidents.find(
      ({ id }) => id === "provider:call-1",
    );

    expect(generationIncident).toMatchObject({
      title: "провайдер не ответил вовремя",
      provider: "GPTunnel",
      model: "Kling 3",
      reason: "ответ не пришёл в допустимое время",
      action: { type: "retry_check", targetId: "gptunnel" },
    });
    expect(providerIncident).toMatchObject({
      title: "не удалось выполнить генерацию",
      provider: "провайдер не определён",
      model: "модель не определена",
    });
    expect(JSON.stringify(normalized.incidents)).not.toMatch(
      /provider_error|unknown provider|private-token|Authorization/i,
    );
    expect(source.incidents[0].summary).toBe("Authorization: Bearer private-token");
  });

  it("loads a successful envelope", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { users: [{ id: "u-1" }] },
      }),
    });
    const data = await loadDashboard(fetchImpl);
    expect(data.users).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/dashboard",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("keeps safe provider diagnostics linked to the failed generation", () => {
    const normalized = validateDashboardPayload({
      generations: [
        {
          id: "gen-42",
          status: "failed",
          provider: "polza",
          providerModelId: "openai/gpt-5.4-image-2",
          model: "GPT-5.4 Image 2",
        },
      ],
      incidents: [
        {
          id: "provider:call-42",
          source: "provider_api_calls",
          provider: "polza",
          generationId: "gen-42",
          providerModelId: "openai/gpt-5.4-image-2",
          errorCode: "provider_rejected",
          httpStatus: 422,
          providerRequestId: "polza-job-42",
          operation: "generation.media",
          retryable: false,
        },
      ],
    });

    expect(normalized.incidents[0]).toMatchObject({
      provider: "Polza AI",
      model: "openai/gpt-5.4-image-2",
      generationId: "gen-42",
      errorCode: "provider_rejected",
      httpStatus: 422,
      providerRequestId: "polza-job-42",
      operation: "generation.media",
      retryable: false,
    });
  });

  it("rejects an error envelope", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ success: false, error: "offline" }),
    });
    await expect(loadDashboard(fetchImpl)).rejects.toThrow("offline");
  });
});
