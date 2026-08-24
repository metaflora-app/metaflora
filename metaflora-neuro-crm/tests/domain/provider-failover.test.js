import { describe, expect, it } from "vitest";

import {
  createProviderCircuitState,
  recordProviderFailure,
  recordProviderSuccess,
  selectAvailableProvider,
} from "../../src/domain/provider-failover.js";

const providers = [
  { id: "openrouter", enabled: true, priority: 1 },
  { id: "fallback", enabled: true, priority: 2 },
];

describe("provider failover and circuit state", () => {
  it("selects the highest-priority provider with a closed circuit", () => {
    const circuits = {
      openrouter: { status: "open", openedAt: 1_000, failureCount: 3 },
      fallback: createProviderCircuitState(),
    };

    expect(
      selectAvailableProvider(providers, circuits, {
        nowMs: 2_000,
        cooldownMs: 10_000,
      }),
    ).toEqual({ provider: providers[1], probe: false });
  });

  it("allows one half-open probe after the cooldown", () => {
    const circuits = {
      openrouter: { status: "open", openedAt: 1_000, failureCount: 3 },
    };

    expect(
      selectAvailableProvider(providers, circuits, {
        nowMs: 12_000,
        cooldownMs: 10_000,
      }),
    ).toEqual({ provider: providers[0], probe: true });
  });

  it("opens after threshold failures and closes after success", () => {
    const once = recordProviderFailure(createProviderCircuitState(), {
      nowMs: 1_000,
      failureThreshold: 2,
    });
    const open = recordProviderFailure(once, {
      nowMs: 2_000,
      failureThreshold: 2,
    });
    const closed = recordProviderSuccess(open);

    expect(once).toEqual({
      status: "closed",
      failureCount: 1,
      openedAt: null,
    });
    expect(open).toEqual({
      status: "open",
      failureCount: 2,
      openedAt: 2_000,
    });
    expect(closed).toEqual(createProviderCircuitState());
    expect(open).not.toBe(once);
  });

  it("returns null when no provider can be attempted", () => {
    expect(
      selectAvailableProvider(
        [{ id: "disabled", enabled: false, priority: 1 }],
        {},
        { nowMs: 0 },
      ),
    ).toBeNull();
  });
});
