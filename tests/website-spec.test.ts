import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { features } from "@/lib/config";
import { discoveryResources, publicRoutes, site } from "@/lib/discovery";
import { WEBSITE_SPEC_CATEGORIES } from "@/lib/scaffold/addons";
import {
  WEBSITE_SPEC_CHECKLIST,
  WEBSITE_SPEC_ITEM_COUNT,
  websiteSpecCategoryCounts,
  websiteSpecLevelCounts,
} from "@/lib/scaffold/website-spec";
import {
  assertWebsiteSpecComplianceRegistry,
  generateWebsiteSpecAuditMarkdown,
  websiteSpecComplianceItems,
  websiteSpecComplianceSummary,
} from "@/lib/scaffold/website-spec-compliance";

const nextConfig = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
const rootLayout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
const globalsCss = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const complianceDoc = generateWebsiteSpecAuditMarkdown();

describe("website specification scaffold baseline", () => {
  it("describes the workspace and its enabled public routes", () => {
    expect(site.title).toBe(`${site.name} workspace`);
    expect(site.category).toBe("web application");
    expect(publicRoutes[0]).toEqual(
      features.seo
        ? expect.objectContaining({
            path: "/",
            title: site.name,
            markdown: "/page.md",
            schema: "/schema/home.json",
          })
        : undefined,
    );
  });

  it("advertises the core machine-readable resources", () => {
    const paths = discoveryResources.map((resource) => resource.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/llms.txt",
        "/llms-full.txt",
        "/sitemap.xml",
        "/sitemap-index.xml",
        "/feed.xml",
        "/website-spec.json",
        "/website-spec.md",
        "/schemamap.xml",
        "/.well-known/api-catalog",
        "/.well-known/agent-card.json",
        "/.well-known/agent-skills.json",
        "/ask",
      ]),
    );
  });

  it("uses security headers aligned with the supplied checklist", () => {
    expect(nextConfig).toContain("Strict-Transport-Security");
    expect(nextConfig).toContain("max-age=63072000; includeSubDomains");
    expect(nextConfig).not.toContain("includeSubDomains; preload");
    expect(nextConfig).toContain("Content-Security-Policy");
    expect(nextConfig).toContain("frame-ancestors 'none'");
    expect(nextConfig).toContain("Cross-Origin-Opener-Policy");
    expect(nextConfig).toContain("Cross-Origin-Resource-Policy");
    expect(nextConfig).toContain("Reporting-Endpoints");
    expect(nextConfig).toContain("upgrade-insecure-requests");
  });

  it("self-hosts Geist fonts through next/font without third-party font hosts", () => {
    expect(rootLayout).toContain(
      'import { Geist, Geist_Mono } from "next/font/google"',
    );
    expect(rootLayout).toContain('subsets: ["latin"]');
    expect(rootLayout).toContain('variable: "--font-geist-sans"');
    expect(rootLayout).toContain('variable: "--font-geist-mono"');
    expect(rootLayout).toContain(
      "${geistSans.className} ${geistSans.variable} ${geistMono.variable}",
    );
    expect(globalsCss).toContain("var(--font-geist-sans)");
    expect(globalsCss).toContain("var(--font-geist-mono)");
    expect(globalsCss).not.toContain("--font-inter");
    expect(nextConfig).toContain("\"font-src 'self'\"");
    expect(nextConfig).not.toContain("fonts.gstatic.com");
    expect(nextConfig).not.toContain("fonts.googleapis.com");
  });

  it("tracks every Website Specification category", () => {
    expect(WEBSITE_SPEC_CATEGORIES.map((category) => category.id)).toEqual([
      "foundations",
      "seo",
      "accessibility",
      "security",
      "well-known",
      "agent-readiness",
      "performance",
      "privacy",
      "resilience",
      "internationalisation",
    ]);
    expect(complianceDoc).toContain("## Status summary");
    expect(complianceDoc).toContain("## Applicability summary");
    expect(complianceDoc).toContain("- implemented:");
    expect(complianceDoc).toContain("- opt-in:");
  });

  it("tracks every current checklist item from the Website Specification", () => {
    expect(WEBSITE_SPEC_ITEM_COUNT).toBe(162);
    expect(WEBSITE_SPEC_CHECKLIST).toHaveLength(162);
    expect(
      websiteSpecCategoryCounts().map(({ label, itemCount }) => [
        label,
        itemCount,
      ]),
    ).toEqual([
      ["Foundations", 18],
      ["SEO", 14],
      ["Accessibility", 28],
      ["Security", 18],
      ["Well-Known URIs", 12],
      ["Agent Readiness", 20],
      ["Performance", 25],
      ["Privacy", 7],
      ["Resilience", 7],
      ["Internationalisation", 13],
    ]);
    expect(websiteSpecLevelCounts()).toEqual({
      Required: 36,
      Recommended: 79,
      Optional: 42,
      Avoid: 5,
    });
  });

  it("keeps item-level compliance coverage exhaustive and evidenced", () => {
    expect(() => assertWebsiteSpecComplianceRegistry()).not.toThrow();

    const compliance = websiteSpecComplianceItems();
    const ids = new Set(compliance.map((item) => item.id));
    expect(ids.size).toBe(WEBSITE_SPEC_ITEM_COUNT);

    const implementedWithoutRuntimeEvidence = compliance.filter((item) => {
      if (item.status !== "implemented") return false;
      return (
        item.evidence.headers.length === 0 &&
        item.evidence.routes.filter(
          (route) =>
            !["/website-spec.json", "/website-spec.md"].includes(route),
        ).length === 0 &&
        item.evidence.files.filter(
          (file) =>
            !file.startsWith("lib/scaffold/") && !file.startsWith("docs/"),
        ).length === 0
      );
    });

    expect(implementedWithoutRuntimeEvidence).toEqual([]);
  });

  it("links every compliance item to a canonical spec URL", () => {
    const compliance = websiteSpecComplianceItems();
    const sources = new Set(compliance.map((item) => item.source));

    expect(sources.size).toBe(WEBSITE_SPEC_ITEM_COUNT);
    expect(
      [...sources].every((source) =>
        source.startsWith("https://specification.website/spec/"),
      ),
    ).toBe(true);
    expect(sources).toContain(
      "https://specification.website/spec/foundations/doctype/",
    );
    expect(sources).toContain(
      "https://specification.website/spec/agent-readiness/schemamap/",
    );
    expect(sources).toContain(
      "https://specification.website/spec/i18n/idn-support/",
    );
  });

  it("summarizes compliance posture without unclassified checklist items", () => {
    const summary = websiteSpecComplianceSummary();

    expect(summary.itemCount).toBe(162);
    expect(
      Object.values(summary.byStatus).reduce((sum, count) => sum + count, 0),
    ).toBe(162);
    expect(
      Object.values(summary.byApplicability).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(162);
    expect(summary.byStatus.implemented).toBeGreaterThan(60);
    expect(summary.byStatus.documented).toBeGreaterThan(20);
    expect(summary.byApplicability.default).toBeGreaterThan(80);
  });
});
