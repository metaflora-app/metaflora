import { describe, expect, it, vi } from "vitest";

import {
  adjustMetacoinBalance,
  changeSubscription,
  loadAuthStatus,
  loadAdminSession,
  loadUserDetails,
  probeProvider,
  requestLoginCode,
  verifyLoginCode,
} from "./admin-client.js";
import * as adminClient from "./admin-client.js";

describe("admin client", () => {
  it("deletes a promo through the protected endpoint", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { csrfToken: "csrf-token-123" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: "CINEMA15", deleted: true } }),
      });

    await expect(adminClient.deletePromoCode("cinema15", fetchImpl)).resolves.toEqual({
      id: "CINEMA15",
      deleted: true,
    });
    expect(fetchImpl.mock.calls[1]).toEqual([
      "/api/admin/promos/CINEMA15",
      expect.objectContaining({
        method: "DELETE",
        credentials: "same-origin",
        headers: expect.objectContaining({ "x-csrf-token": "csrf-token-123" }),
      }),
    ]);
  });

  it("creates a promo through CSRF and refreshes the persisted promo list", async () => {
    const persistedPromos = [{
      id: "MODELS42",
      code: "MODELS42",
      rewardType: "discount_percent",
      rewardValue: 42,
      modelIds: ["gpt_56_luna", "gpt_56_terra"],
      status: "active",
    }];
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { csrfToken: "csrf-token-123" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: persistedPromos[0] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { promos: persistedPromos } }),
      });

    expect(typeof adminClient.createPromoCode).toBe("function");
    await expect(adminClient.createPromoCode({
      code: "MODELS42",
      rewardType: "discount_percent",
      rewardValue: 42,
      modelIds: ["gpt_56_luna", "gpt_56_terra"],
    }, fetchImpl)).resolves.toEqual(persistedPromos);

    expect(fetchImpl.mock.calls[1][0]).toBe("/api/admin/promos");
    expect(fetchImpl.mock.calls[1][1]).toEqual(expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      headers: expect.objectContaining({ "x-csrf-token": "csrf-token-123" }),
    }));
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual(expect.objectContaining({
      rewardType: "discount_percent",
      rewardValue: 42,
      modelIds: ["gpt_56_luna", "gpt_56_terra"],
    }));
    expect(fetchImpl.mock.calls[2][0]).toBe("/api/dashboard");
  });

  it("requests and verifies a one-time Telegram code", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { challengeId: "challenge-1", expiresAt: "2026-07-31T00:05:00Z" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { authenticated: true, expiresAt: "2026-07-31T08:00:00Z" },
        }),
      });

    await requestLoginCode(fetchImpl);
    await verifyLoginCode("challenge-1", "123456", fetchImpl);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "/api/auth/request-code",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "/api/auth/verify",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({ challengeId: "challenge-1", code: "123456" }),
      }),
    );
  });

  it("loads authentication status without exposing credentials", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { authenticated: false },
      }),
    });

    await expect(loadAuthStatus(fetchImpl)).resolves.toEqual({
      authenticated: false,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/auth/status",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("loads an authenticated CSRF session", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { csrfToken: "csrf-token-123" },
      }),
    });

    await expect(loadAdminSession(fetchImpl)).resolves.toEqual({
      csrfToken: "csrf-token-123",
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/session",
      expect.objectContaining({
        method: "GET",
        credentials: "same-origin",
      }),
    );
  });

  it("posts an arbitrary metacoin delta with a unique idempotency key", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { csrfToken: "csrf-token-123" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { balanceAfter: 417 },
        }),
      });

    await expect(
      adjustMetacoinBalance(
        {
          userId: "87607ae0-9e42-4661-877a-304e4fde0101",
          delta: -37,
          reason: "ручная компенсация",
        },
        fetchImpl,
      ),
    ).resolves.toEqual({ balanceAfter: 417 });

    const [, request] = fetchImpl.mock.calls[1];
    expect(fetchImpl.mock.calls[1][0]).toBe("/api/admin/metacoins/adjust");
    expect(request.headers["x-csrf-token"]).toBe("csrf-token-123");
    expect(JSON.parse(request.body)).toEqual(
      expect.objectContaining({
        userId: "87607ae0-9e42-4661-877a-304e4fde0101",
        direction: "debit",
        amount: 37,
        reason: "ручная компенсация",
        idempotencyKey: expect.stringMatching(/^crm\./),
      }),
    );
  });

  it("loads a safe detailed user projection", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: { id: "87607ae0-9e42-4661-877a-304e4fde0101" },
          payments: [],
          ledgerEntries: [],
          generations: [],
          providerCalls: [],
          audit: [],
        },
      }),
    });

    const result = await loadUserDetails(
      "87607ae0-9e42-4661-877a-304e4fde0101",
      fetchImpl,
    );
    expect(result.user.id).toBe("87607ae0-9e42-4661-877a-304e4fde0101");
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/users/87607ae0-9e42-4661-877a-304e4fde0101/details",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("changes a user tariff through the protected CRM endpoint", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { csrfToken: "csrf-token-123" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            planId: "author",
            metacoins: 300,
            balanceAfter: 970,
            expiresAt: "2026-08-29T00:00:00.000Z",
          },
        }),
      });

    await expect(
      changeSubscription({
        userId: "87607ae0-9e42-4661-877a-304e4fde0101",
        planId: "author",
        durationMonths: 1,
        reason: "компенсация",
      }, fetchImpl),
    ).resolves.toEqual(expect.objectContaining({ planId: "author", balanceAfter: 970 }));

    expect(fetchImpl.mock.calls[1][0]).toBe("/api/admin/subscriptions/change");
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual(expect.objectContaining({
      userId: "87607ae0-9e42-4661-877a-304e4fde0101",
      planId: "author",
      durationMonths: 1,
      reason: "компенсация",
      idempotencyKey: expect.stringMatching(/^crm\./),
    }));
  });

  it("runs a protected provider probe instead of simulating success locally", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { csrfToken: "csrf-token-123" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: "polza", health: "healthy", probeStatus: "ok" },
        }),
      });

    await expect(probeProvider("polza", fetchImpl)).resolves.toEqual({
      id: "polza",
      health: "healthy",
      probeStatus: "ok",
    });
    expect(fetchImpl.mock.calls[1]).toEqual([
      "/api/admin/providers/probe",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-csrf-token": "csrf-token-123",
        }),
        body: JSON.stringify({ providerId: "polza" }),
      }),
    ]);
  });

  it("surfaces a safe server error without applying a local fallback", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: "недостаточно метакоинов",
      }),
    });

    await expect(
      loadUserDetails(
        "87607ae0-9e42-4661-877a-304e4fde0101",
        fetchImpl,
      ),
    ).rejects.toThrow("недостаточно метакоинов");
  });
});
