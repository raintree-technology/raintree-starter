import { describe, expect, it } from "vitest";
import { isPrivateOverlayPath } from "@/lib/scaffold/private-overlay";

describe("private scaffold overlay", () => {
  it("excludes private Command Center product files from generated projects", () => {
    for (const path of [
      "app/api/command-center/route.ts",
      "app/command-center/page.tsx",
      "components/command-center/command-center.tsx",
      "lib/command-center/projects.ts",
      "lib/google/data.ts",
      "db/migrations/0006_command_center_rls.sql",
      "db/migrations/meta/0009_snapshot.json",
      "ops/com.raintree.command-center.plist",
      "design-qa.md",
      "scripts/scaffold.ts",
      "scripts/test-local.mjs",
      ".codex/config.toml",
      ".mcp.json",
      "mise.production.local.toml",
      "mise.local.lock",
      "security/private-audit.md",
      "tests/command-center-rls.test.ts",
      "implementation-command-center.jpg",
      "scripts/sync-command-center.ts",
      "scripts/scaffold-overrides/schema-app.ts.template",
    ]) {
      expect(isPrivateOverlayPath(path)).toBe(true);
    }
  });

  it("preserves reusable starter files", () => {
    for (const path of [
      "app/(marketing)/page.tsx",
      "db/schema/app.ts",
      "db/migrations/0009_auth_two_factor_lockout.sql",
      "lib/auth.ts",
    ]) {
      expect(isPrivateOverlayPath(path)).toBe(false);
    }
  });
});
