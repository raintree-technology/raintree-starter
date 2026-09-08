import { describe, expect, it } from "vitest";
import { features } from "@/lib/config";
import { starterConfig } from "@/starter.config";

describe("feature flags", () => {
  it("derives tenancy from the config", () => {
    const tenancy = starterConfig.tenancy as "single" | "multi";
    expect(features.tenancyMulti).toBe(tenancy === "multi");
  });

  it("derives AI sub-flags from ai.enabled", () => {
    const ai = starterConfig.integrations.ai;
    expect(features.aiChat).toBe(ai.enabled && ai.chat);
    expect(features.aiStructured).toBe(ai.enabled && ai.structuredOutput);
    expect(features.aiPersist).toBe(ai.enabled && ai.persistHistory);
    // Disabling the AI module must disable every sub-feature.
    if (!features.ai) {
      expect(features.aiChat).toBe(false);
      expect(features.aiStructured).toBe(false);
    }
  });

  it("oauth.any reflects either provider being on", () => {
    const o = starterConfig.integrations.oauth;
    expect(features.oauth.any).toBe(o.google || o.github);
  });
});
