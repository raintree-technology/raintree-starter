import { describe, expect, it } from "vitest";
import { DEFAULT_ADDON_IDS } from "@/lib/scaffold/addons";
import {
  parseAddonIds,
  renderEnvExample,
  renderScaffoldManifest,
  renderScaffoldReadme,
  renderStarterConfig,
  resolveAddonIds,
  resolveScaffold,
} from "@/lib/scaffold/render";

describe("scaffold add-ons", () => {
  it("keeps the website-spec baseline enabled by default", () => {
    expect(DEFAULT_ADDON_IDS).toEqual(
      expect.arrayContaining([
        "seo",
        "accessibility",
        "security",
        "performance",
        "privacy",
        "resilience",
        "agent-readiness",
      ]),
    );
  });

  it("resolves service dependencies for selected add-ons", () => {
    expect(resolveAddonIds(["stripe"], false)).toEqual([
      "neon",
      "better-auth",
      "stripe",
    ]);
    expect(resolveAddonIds(["agent-readiness"], false)).toEqual([
      "seo",
      "agent-readiness",
    ]);
  });

  it("resolves coherent product profiles and allows additive overrides", () => {
    const portal = resolveScaffold({
      appName: "Portal",
      addons: [],
      profile: "client-portal",
    });
    expect(portal.profile).toBe("client-portal");
    expect(portal.tenancy).toBe("multi");
    expect(portal.addonIds).toEqual(
      expect.arrayContaining([
        "seo",
        "accessibility",
        "security",
        "neon",
        "better-auth",
        "audit",
        "oauth",
        "passkeys",
        "resend",
        "upstash",
      ]),
    );
    expect(portal.addonIds).not.toContain("stripe");
    expect(portal.addonIds).not.toContain("ai");
    expect(
      renderStarterConfig({
        appName: "Portal",
        addons: [],
        profile: "client-portal",
      }),
    ).toContain("audit: true");

    const portalWithBilling = resolveScaffold({
      appName: "Portal",
      addons: ["stripe"],
      profile: "client-portal",
    });
    expect(portalWithBilling.addonIds).toContain("stripe");
  });

  it("keeps internal tools private by default and manifests deterministic", () => {
    const options = {
      appName: "Internal",
      addons: [],
      profile: "internal-tool" as const,
    };
    expect(resolveScaffold(options).addonIds).not.toContain("seo");
    expect(renderScaffoldManifest(options)).toBe(
      renderScaffoldManifest(options),
    );
    expect(renderScaffoldManifest(options)).not.toContain("generatedAt");
  });

  it("renders config and env files from the selected stack", () => {
    const options = {
      appName: "Acme",
      addons: parseAddonIds("stripe,ai,agent-readiness"),
      includeDefaults: false,
      tenancy: "multi" as const,
    };

    expect(renderStarterConfig(options)).toContain('appName: "Acme"');
    expect(renderStarterConfig(options)).toContain('"stripe"');
    expect(renderStarterConfig(options)).toContain("billing: true");
    expect(renderStarterConfig(options)).toContain("persistHistory: true");

    const env = renderEnvExample(options);
    expect(env).toContain("DATABASE_URL=");
    expect(env).toContain("BETTER_AUTH_SECRET=");
    expect(env).toContain("STRIPE_SECRET_KEY=");
    expect(env).toContain("AI_GATEWAY_API_KEY=");
    expect(renderScaffoldReadme(options)).toContain(
      "tracks all 162 current checklist items",
    );
  });

  it("renders a machine-readable scaffold manifest", () => {
    const manifest = JSON.parse(
      renderScaffoldManifest({
        appName: "Acme",
        addons: parseAddonIds("stripe,agent-readiness"),
        includeDefaults: false,
        tenancy: "single",
      }),
    );

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.profile).toBeNull();
    expect(manifest.tenancy).toBe("single");
    expect(manifest.addons.selected).toEqual([
      "seo",
      "agent-readiness",
      "neon",
      "better-auth",
      "stripe",
    ]);
    expect(manifest.addons.disabled).toContain("ai");
    expect(
      manifest.env.map((variable: { name: string }) => variable.name),
    ).toEqual(
      expect.arrayContaining([
        "DATABASE_URL",
        "BETTER_AUTH_SECRET",
        "STRIPE_SECRET_KEY",
      ]),
    );
    expect(manifest.websiteSpec.itemCount).toBe(162);
    expect(manifest.pruning.mode).toBe("config-gated");
  });

  it("covers the scaffold matrix used for customer generation", () => {
    const matrix = [
      { addons: "", includeDefaults: true, tenancy: "multi" as const },
      { addons: "", includeDefaults: false, tenancy: "single" as const },
      { addons: "all", includeDefaults: true, tenancy: "multi" as const },
      {
        addons: "neon,better-auth,stripe,resend,upstash,ai",
        includeDefaults: true,
        tenancy: "multi" as const,
      },
      {
        addons: "neon,better-auth,stripe,resend,upstash,ai",
        includeDefaults: true,
        tenancy: "single" as const,
      },
    ];

    for (const entry of matrix) {
      const resolved = resolveScaffold({
        appName: "Matrix",
        addons: parseAddonIds(entry.addons),
        includeDefaults: entry.includeDefaults,
        tenancy: entry.tenancy,
      });
      const config = renderStarterConfig({
        appName: "Matrix",
        addons: parseAddonIds(entry.addons),
        includeDefaults: entry.includeDefaults,
        tenancy: entry.tenancy,
      });

      expect(resolved.tenancy).toBe(entry.tenancy);
      expect(new Set(resolved.addonIds).size).toBe(resolved.addonIds.length);
      expect(config).toContain(`tenancy: "${entry.tenancy}"`);
    }
  });
});
