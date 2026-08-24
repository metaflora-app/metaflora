import { describe, expect, it } from "vitest";

import { PROVIDER_IDENTITIES } from "./provider-identities.js";

describe("provider identities", () => {
  it("uses local brand assets for every model API provider", () => {
    expect(Object.keys(PROVIDER_IDENTITIES)).toEqual([
      "polza",
      "gptunnel",
      "routerai",
      "openrouter",
      "fal",
      "replicate",
      "elevenlabs",
      "suno",
      "requesty",
    ]);

    for (const identity of Object.values(PROVIDER_IDENTITIES)) {
      expect(identity.logo).toMatch(/\.(?:svg|png)$|^data:image\//);
      expect(identity.label).not.toBe("");
    }
  });

  it("does not include infrastructure or payment services", () => {
    expect(PROVIDER_IDENTITIES).not.toHaveProperty("supabase");
    expect(PROVIDER_IDENTITIES).not.toHaveProperty("yookassa");
    expect(PROVIDER_IDENTITIES).not.toHaveProperty("kie");
  });
});
