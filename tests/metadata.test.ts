import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { features } from "@/lib/config";
import { privateCrawlPaths, publicRoutes } from "@/lib/discovery";

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

describe("app metadata conventions", () => {
  const appDir = join(process.cwd(), "app");
  const files = walk(appDir);

  it("defines metadata for every routable page", () => {
    const missingMetadata = files
      .filter((file) => basename(file) === "page.tsx")
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return !/export (const metadata|async function generateMetadata|function generateMetadata)/.test(
          source,
        );
      })
      .map((file) => relative(process.cwd(), file));

    expect(missingMetadata).toEqual([]);
  });

  it("defines stable generated OG image endpoints for public social previews", () => {
    const ogFiles = files
      .filter((file) => {
        const path = relative(process.cwd(), file);
        return (
          basename(file) === "opengraph-image.tsx" ||
          path.endsWith("opengraph-image/route.ts")
        );
      })
      .map((file) => relative(process.cwd(), file));

    expect(ogFiles).toEqual(
      expect.arrayContaining([
        "app/opengraph-image.tsx",
        "app/(marketing)/pricing/opengraph-image/route.ts",
        "app/(marketing)/privacy/opengraph-image/route.ts",
      ]),
    );
  });

  it("keeps transactional and private pages out of robots.txt crawl paths", () => {
    expect([...privateCrawlPaths]).toEqual(
      expect.arrayContaining([
        "/accept-invitation",
        "/admin",
        "/api",
        "/dashboard",
        "/forgot-password",
        "/login",
        "/maintenance",
        "/onboarding",
        "/reset-password",
        "/settings",
        "/signup",
        "/two-factor",
        "/verify-email",
      ]),
    );
  });

  it("keeps public discovery descriptions aligned with page metadata", () => {
    expect(
      publicRoutes.find((route) => route.path === "/pricing")?.description,
    ).toBe(
      features.seo && features.billing
        ? "Compare free and paid starter plans, including per-seat team billing for generated SaaS apps."
        : undefined,
    );
    expect(
      publicRoutes.find((route) => route.path === "/privacy")?.description,
    ).toBe(
      features.seo
        ? "How generated apps should handle account, organization, billing, and product data."
        : undefined,
    );
  });
});
