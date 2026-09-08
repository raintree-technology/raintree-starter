import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiOptionsResponse, parseJsonBody } from "@/lib/route-handlers";

function request(body: string): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

describe("route handler helpers", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("parses valid JSON bodies", async () => {
    const parsed = await parseJsonBody(request('{"name":"Ada"}'), schema);

    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data).toEqual({ name: "Ada" });
  });

  it("returns a 400 response for malformed JSON", async () => {
    const parsed = await parseJsonBody(request("{"), schema);

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.response.status).toBe(400);
      expect(parsed.response.headers.get("cache-control")).toBe("no-store");
      await expect(parsed.response.json()).resolves.toMatchObject({
        error: "Invalid JSON body",
      });
    }
  });

  it("returns a 400 response for schema-invalid JSON", async () => {
    const parsed = await parseJsonBody(request('{"name":""}'), schema);

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.response.status).toBe(400);
      await expect(parsed.response.json()).resolves.toMatchObject({
        error: "Invalid request body",
        issues: [{ path: "name" }],
      });
    }
  });

  it("returns no-store 204 preflight responses", () => {
    const response = apiOptionsResponse();

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("app route handler conventions", () => {
  const appDir = join(process.cwd(), "app");
  const libDir = join(process.cwd(), "lib");
  const files = walk(appDir);
  const routeFiles = files.filter((file) => basename(file) === "route.ts");
  const appAndLibSourceFiles = [...files, ...walk(libDir)].filter((file) =>
    /\.(ts|tsx)$/.test(file),
  );

  it("does not define a route handler beside a page at the same segment", () => {
    const pageDirs = new Set(
      files
        .filter((file) =>
          ["page.ts", "page.tsx", "page.js", "page.jsx"].includes(
            basename(file),
          ),
        )
        .map(dirname),
    );
    const conflicts = routeFiles
      .filter((file) => pageDirs.has(dirname(file)))
      .map((file) => relative(process.cwd(), file));

    expect(conflicts).toEqual([]);
  });

  it("does not use route segment cache config with Cache Components enabled", () => {
    const legacySegmentConfig = routeFiles
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return /export const (dynamic|revalidate)\b/.test(source);
      })
      .map((file) => relative(process.cwd(), file));

    expect(legacySegmentConfig).toEqual([]);
  });

  it("enables Cache Components for cacheLife scopes", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");

    expect(config).toMatch(/cacheComponents:\s*true/);
  });

  it("sets an explicit cacheLife for every use cache source file", () => {
    const missingCacheLife = appAndLibSourceFiles
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return (
          /["']use cache["']/.test(source) && !/cacheLife\s*\(/.test(source)
        );
      })
      .map((file) => relative(process.cwd(), file));

    expect(missingCacheLife).toEqual([]);
  });

  it("centralizes public discovery cache headers", () => {
    const inlinePublicCacheHeaders = routeFiles
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return /Cache-Control["']?\s*:\s*["']public,/.test(source);
      })
      .map((file) => relative(process.cwd(), file));

    expect(inlinePublicCacheHeaders).toEqual([]);
  });

  it("implements explicit OPTIONS handlers for API route handlers", () => {
    const missingOptions = routeFiles
      .filter((file) => relative(process.cwd(), file).startsWith("app/api/"))
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return (
          !source.includes("export const OPTIONS") &&
          !source.includes("export function OPTIONS")
        );
      })
      .map((file) => relative(process.cwd(), file));

    expect(missingOptions).toEqual([]);
  });
});
