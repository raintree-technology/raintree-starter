import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ignoredDirs = new Set([".git", ".next", "node_modules"]);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) return [];
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const requestTimeValuePattern =
  /\b(?:crypto\.randomUUID|Math\.random|Date\.now)\s*\(|\bnew Date\s*\(\s*\)/;
const requestBoundaryPattern =
  /\bconnection\s*\(|\b(?:headers|cookies|draftMode)\s*\(/;
const appRenderFilePattern =
  /^(page|layout|template|default|not-found|error|global-error|opengraph-image|twitter-image|sitemap|robots|manifest)\.(ts|tsx)$/;
const deprecatedNoStore = "unstable_" + "noStore";

describe("App Router rendering conventions", () => {
  const tsFiles = walk(process.cwd())
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) => !file.startsWith(join(process.cwd(), "tests")));

  it("does not use the deprecated no-store rendering API", () => {
    const offenders = tsFiles
      .filter((file) => readFileSync(file, "utf8").includes(deprecatedNoStore))
      .map((file) => relative(process.cwd(), file));

    expect(offenders).toEqual([]);
  });

  it("guards request-time values in Server Component render files", () => {
    const offenders = tsFiles
      .filter((file) => file.startsWith(join(process.cwd(), "app")))
      .filter((file) => appRenderFilePattern.test(basename(file)))
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        if (/^\s*["']use client["']/.test(source)) return false;
        if (!requestTimeValuePattern.test(source)) return false;
        return !requestBoundaryPattern.test(source);
      })
      .map((file) => relative(process.cwd(), file));

    expect(offenders).toEqual([]);
  });
});
