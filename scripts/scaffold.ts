#!/usr/bin/env bun
import { execFileSync } from "node:child_process";
import { lstatSync } from "node:fs";

import {
  copyFile,
  cp,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { cwd, exit } from "node:process";
import { ADDONS, type AddonId } from "../lib/scaffold/addons";
import { isPrivateOverlayPath } from "../lib/scaffold/private-overlay";
import {
  PROFILES,
  type ProfileId,
  parseProfileId,
} from "../lib/scaffold/profiles";
import {
  parseAddonIds,
  renderAddonList,
  renderEnvExample,
  renderScaffoldManifest,
  renderScaffoldReadme,
  renderStarterConfig,
  resolveScaffold,
} from "../lib/scaffold/render";

type CliOptions = {
  addons: AddonId[];
  appName: string;
  dir: string | null;
  includeDefaults?: boolean;
  list: boolean;
  listProfiles: boolean;
  profile: ProfileId | null;
  dryRun: boolean;
  help: boolean;
  tenancy: "single" | "multi";
};

const ignoredPathParts = new Set([
  ".git",
  ".next",
  "node_modules",
  "test-results",
  "coverage",
  ".vercel",
  ".mise",
  ".turbo",
]);

const ignoredFiles = new Set([
  ".env",
  ".env.local",
  ".scaffold-manifest.json",
  "tsconfig.tsbuildinfo",
  "mise.lock",
  "mise.local.toml",
  "mise.local.lock",
]);

function usage() {
  return `Create a Next Starter project.

Usage:
  bun run create -- --dir ../acme --name Acme --addons better-auth,stripe,neon,seo
  bun run create -- --dir ../portal --name Portal --profile client-portal
  bun run create -- --dir ../acme --name Acme --all
  bun run create -- --list

Options:
  --dir <path>          Target directory to create.
  --name <name>         App name written to starter.config.ts.
  --addons <ids>        Comma-separated add-on ids. Use "all" for every add-on.
  --profile <id>        Start from a coherent product profile.
  --all                Include every add-on.
  --no-defaults        Do not include the website-spec baseline add-ons.
  --tenancy <mode>     "multi" or "single". Defaults to "multi".
  --dry-run            Print the resolved plan without writing files.
  --list               Show available add-ons.
  --list-profiles      Show available product profiles.
  --help               Show this help.
`;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    addons: [],
    appName: "Acme",
    dir: null,
    includeDefaults: undefined,
    list: false,
    listProfiles: false,
    profile: null,
    dryRun: false,
    help: false,
    tenancy: "multi",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--addons":
        if (!next)
          throw new Error("--addons requires a comma-separated value.");
        options.addons = parseAddonIds(next);
        index += 1;
        break;
      case "--all":
        options.addons = ADDONS.map((addon) => addon.id);
        break;
      case "--profile":
        if (!next) throw new Error("--profile requires a profile id.");
        options.profile = parseProfileId(next);
        index += 1;
        break;
      case "--dir":
        if (!next) throw new Error("--dir requires a target path.");
        options.dir = next;
        index += 1;
        break;
      case "--name":
        if (!next) throw new Error("--name requires an app name.");
        options.appName = next;
        index += 1;
        break;
      case "--no-defaults":
        options.includeDefaults = false;
        break;
      case "--tenancy":
        if (next !== "single" && next !== "multi") {
          throw new Error('--tenancy must be "single" or "multi".');
        }
        options.tenancy = next;
        index += 1;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--list":
        options.list = true;
        break;
      case "--list-profiles":
        options.listProfiles = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

async function isEmptyDirectory(path: string): Promise<boolean> {
  try {
    const entries = await readdir(path);
    return entries.length === 0;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return true;
    throw error;
  }
}

function shouldCopy(sourcePath: string, root: string) {
  const rel = relative(root, sourcePath);
  const parts = rel.split("/");
  const name = basename(sourcePath);

  if (lstatSync(sourcePath).isSymbolicLink()) return false;
  if (parts.some((part) => ignoredPathParts.has(part))) return false;
  if (ignoredFiles.has(name)) return false;
  if (name.startsWith(".env") && name !== ".env.example") return false;
  if (isPrivateOverlayPath(rel)) return false;

  return true;
}

async function applyScaffoldOverrides(root: string, target: string) {
  const overrides = [
    ["marketing-page.tsx.template", "app/(marketing)/page.tsx"],
    ["privacy-page.tsx.template", "app/(marketing)/privacy/page.tsx"],
    ["schema-app.ts.template", "db/schema/app.ts"],
    ["migration-journal.json.template", "db/migrations/meta/_journal.json"],
    ["agents.md.template", "AGENTS.md"],
    [
      "two-factor-snapshot.json.template",
      "db/migrations/meta/0009_snapshot.json",
    ],
    ["ci.yml.template", ".github/workflows/ci.yml"],
    ["marketing-layout.tsx.template", "app/(marketing)/layout.tsx"],
  ] as const;

  for (const [source, destination] of overrides) {
    await mkdir(dirname(join(target, destination)), { recursive: true });
    await copyFile(
      join(root, "scripts", "scaffold-overrides", source),
      join(target, destination),
    );
  }

  const packagePath = join(target, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  delete packageJson.scripts?.["command-center:sync"];
  delete packageJson.scripts?.create;
  delete packageJson.scripts?.scaffold;
  delete packageJson.scripts?.["test:profiles"];
  delete packageJson.scripts?.["test:local"];
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

async function copyTemplate(root: string, target: string) {
  await mkdir(target, { recursive: true });
  if (!(await isEmptyDirectory(target))) {
    throw new Error(`Target directory is not empty: ${target}`);
  }

  await cp(root, target, {
    recursive: true,
    filter: (sourcePath) => shouldCopy(sourcePath, root),
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(usage());
    return;
  }

  if (options.list) {
    console.log(renderAddonList());
    return;
  }

  if (options.listProfiles) {
    for (const profile of PROFILES) {
      console.log(`- ${profile.id}: ${profile.label} — ${profile.summary}`);
    }
    return;
  }

  const resolved = resolveScaffold({
    appName: options.appName,
    addons: options.addons,
    includeDefaults: options.includeDefaults,
    profile: options.profile,
    tenancy: options.tenancy,
  });

  if (options.dryRun) {
    console.log(`App: ${resolved.appName}`);
    console.log(`Tenancy: ${resolved.tenancy}`);
    console.log(`Profile: ${resolved.profile ?? "custom"}`);
    console.log(`Add-ons: ${resolved.addonIds.join(", ") || "none"}`);
    console.log(
      `Env vars: ${resolved.env.map((variable) => variable.name).join(", ") || "none"}`,
    );
    return;
  }

  if (!options.dir) {
    throw new Error(
      "--dir is required unless --list, --help, or --dry-run is used.",
    );
  }

  if (!resolved.addonIds.includes("better-auth")) {
    throw new Error(
      "Application generation requires better-auth and neon. Select a product profile or include better-auth in --addons.",
    );
  }

  const root = cwd();
  const target = resolve(root, options.dir);
  if (target === root || !relative(root, target).startsWith("..")) {
    throw new Error(
      "Generate into a directory outside the template repository.",
    );
  }
  await copyTemplate(root, target);
  await applyScaffoldOverrides(root, target);

  await writeFile(
    join(target, "starter.config.ts"),
    renderStarterConfig({
      appName: resolved.appName,
      addons: resolved.addonIds,
      includeDefaults: false,
      profile: resolved.profile,
      tenancy: resolved.tenancy,
    }),
  );
  await writeFile(
    join(target, ".env.example"),
    renderEnvExample({
      appName: resolved.appName,
      addons: resolved.addonIds,
      includeDefaults: false,
      profile: resolved.profile,
      tenancy: resolved.tenancy,
    }),
  );
  await writeFile(
    join(target, "README.md"),
    renderScaffoldReadme({
      appName: resolved.appName,
      addons: resolved.addonIds,
      includeDefaults: false,
      profile: resolved.profile,
      tenancy: resolved.tenancy,
    }),
  );
  await writeFile(
    join(target, ".scaffold-manifest.json"),
    renderScaffoldManifest({
      appName: resolved.appName,
      addons: resolved.addonIds,
      includeDefaults: false,
      profile: resolved.profile,
      tenancy: resolved.tenancy,
    }),
  );

  for (const path of [
    "starter.config.ts",
    "package.json",
    ".scaffold-manifest.json",
    "app/(marketing)/page.tsx",
    "app/(marketing)/layout.tsx",
    "app/(marketing)/privacy/page.tsx",
    "db/schema/app.ts",
  ]) {
    const destination = join(target, path);
    const formatted = execFileSync(
      join(root, "node_modules/.bin/biome"),
      ["format", `--stdin-file-path=${path}`],
      {
        cwd: root,
        input: await readFile(destination, "utf8"),
        encoding: "utf8",
      },
    );
    await writeFile(destination, formatted);
  }

  console.log(`Created ${resolved.appName} in ${target}`);
  console.log(`Add-ons: ${resolved.addonIds.join(", ") || "none"}`);
  console.log("Next steps:");
  console.log(`  cd ${options.dir}`);
  console.log("  bun install");
  console.log("  cp .env.example .env");
  console.log("  bun run dev");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  exit(1);
});
