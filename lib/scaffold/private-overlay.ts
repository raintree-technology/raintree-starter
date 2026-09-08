const privateOverlayPrefixes = [
  "app/api/command-center",
  "app/command-center",
  "audit/uiux-2026-08-02",
  "components/command-center",
  "lib/command-center",
  "lib/google",
  "ops",
  ".agents",
  ".claude",
  ".codex",
  ".cursor",
  ".github",
  "audit",
  "security",
  "scripts/scaffold-overrides",
] as const;

const privateOverlayFiles = new Set([
  "db/migrations/0004_clever_siren.sql",
  "db/migrations/0005_swift_infant_terrible.sql",
  "db/migrations/0006_command_center_rls.sql",
  "db/migrations/0007_flippant_human_cannonball.sql",
  "db/migrations/0008_short_sue_storm.sql",
  "db/migrations/meta/0004_snapshot.json",
  "db/migrations/meta/0005_snapshot.json",
  "db/migrations/meta/0006_snapshot.json",
  "db/migrations/meta/0007_snapshot.json",
  "db/migrations/meta/0008_snapshot.json",
  "db/migrations/meta/0009_snapshot.json",
  "design-qa-comparison-v1.png",
  "design-qa-comparison-v3.png",
  "design-qa-dark-comparison.png",
  "design-qa-focused-v3.png",
  "design-qa.md",
  "implementation-command-center-dark-1440.jpg",
  "implementation-command-center-dark.jpg",
  "implementation-command-center.jpg",
  "scripts/run-command-center-local.sh",
  "scripts/run-command-center-sync.sh",
  "scripts/sync-command-center.ts",
  "tests/command-center.test.ts",
  "tests/command-center-rls.test.ts",
  "scripts/scaffold.ts",
  "scripts/verify-profiles.ts",
  "scripts/test-local.mjs",
  ".mcp.json",
  "agent.json",
  "docs/retired-vercel-project-2026-07-21.json",
]);

export function isPrivateOverlayPath(path: string): boolean {
  const normalized = path.replaceAll("\\", "/").replace(/^\.\//, "");
  return (
    privateOverlayFiles.has(normalized) ||
    /(?:^|\/)mise(?:\.[^/]+)?\.local\.(?:toml|lock)$/.test(normalized) ||
    privateOverlayPrefixes.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  );
}
