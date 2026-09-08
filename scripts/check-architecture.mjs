#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const skipped = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "test-results",
]);
const failures = [];

function filesIn(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory)) {
    if (skipped.has(entry)) continue;
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) files.push(...filesIn(absolute));
    else if (sourceExtensions.has(path.extname(entry))) files.push(absolute);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file);
}

function imports(source) {
  return [...source.matchAll(/(?:from\s+|import\(\s*)["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
}

for (const directory of ["components", "db", "lib"]) {
  for (const file of filesIn(path.join(root, directory))) {
    const source = readFileSync(file, "utf8");
    for (const specifier of imports(source)) {
      if (specifier.startsWith("@/app")) {
        failures.push(
          `${relative(file)} imports route-tree module ${specifier}`,
        );
      }
    }
    if (/^\s*["']use client["'];/u.test(source)) {
      for (const forbidden of ["server-only", "@/db", "@/lib/env"]) {
        if (
          source.includes(`"${forbidden}`) ||
          source.includes(`'${forbidden}`)
        ) {
          failures.push(
            `${relative(file)} is client code and imports ${forbidden}`,
          );
        }
      }
    }
  }
}

for (const file of filesIn(path.join(root, "app"))) {
  if (!["page.tsx", "layout.tsx", "route.ts"].includes(path.basename(file)))
    continue;
  const lines = readFileSync(file, "utf8").split("\n").length;
  if (lines > 160)
    failures.push(
      `${relative(file)} has ${lines} lines; entrypoints must stay thin`,
    );
}

if (failures.length > 0) {
  console.error("Architecture check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Architecture boundaries OK.");
