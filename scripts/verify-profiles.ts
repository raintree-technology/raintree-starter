#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PROFILES } from "../lib/scaffold/profiles";

const output = mkdtempSync(join(tmpdir(), "next-starter-profiles-"));
const results: { profile: string; directory: string; passed: boolean }[] = [];
for (const profile of PROFILES) {
  const directory = join(output, profile.id);
  const generated = spawnSync(
    process.execPath,
    [
      "scripts/scaffold.ts",
      "--dir",
      directory,
      "--name",
      "Reference Workspace",
      "--profile",
      profile.id,
    ],
    { encoding: "utf8" },
  );
  let log = `${generated.stdout}${generated.stderr}`;
  let passed = generated.status === 0;
  if (passed) {
    const manifest = JSON.parse(
      readFileSync(join(directory, ".scaffold-manifest.json"), "utf8"),
    );
    passed =
      manifest.profile === profile.id &&
      manifest.addons.selected.includes("stripe") ===
        profile.addons.includes("stripe") &&
      manifest.addons.selected.includes("ai") ===
        profile.addons.includes("ai") &&
      manifest.addons.selected.includes("seo") === profile.includeDefaults;
  }
  for (const args of [
    ["install", "--frozen-lockfile"],
    ["run", "validate"],
    ["run", "build:ci"],
  ]) {
    if (!passed) break;
    const check = spawnSync(process.execPath, args, {
      cwd: directory,
      encoding: "utf8",
      timeout: 300_000,
      maxBuffer: 10_000_000,
    });
    log += `\n$ bun ${args.join(" ")}\n${check.stdout}${check.stderr}`;
    passed = check.status === 0;
  }
  if (passed && profile.id === "client-portal") {
    const runtime = spawnSync(
      "node",
      ["scripts/test-built-runtime.mjs", directory],
      {
        encoding: "utf8",
        timeout: 60_000,
      },
    );
    log += "\\nBuilt runtime checks\\n" + runtime.stdout + runtime.stderr;
    passed = runtime.status === 0;
  }
  writeFileSync(join(output, `${profile.id}.log`), log);
  results.push({ profile: profile.id, directory, passed });
  console.log(`${profile.id}: ${passed ? "passed" : "failed"} (${directory})`);
}
writeFileSync(
  join(output, "results.json"),
  `${JSON.stringify(results, null, 2)}\n`,
);
console.log(`Evidence: ${output}`);
process.exitCode = results.every((result) => result.passed) ? 0 : 1;
