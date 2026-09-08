import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const initMigration = readFileSync(
  join(process.cwd(), "db/migrations/0000_init.sql"),
  "utf8",
);
const chatMigration = readFileSync(
  join(process.cwd(), "db/migrations/0001_ai_chat.sql"),
  "utf8",
);
const migration = readFileSync(
  join(process.cwd(), "db/migrations/0002_rls.sql"),
  "utf8",
);
const auditMigration = readFileSync(
  join(process.cwd(), "db/migrations/0003_audit_events.sql"),
  "utf8",
);
const appSchema = readFileSync(join(process.cwd(), "db/schema/app.ts"), "utf8");
const authSchema = readFileSync(
  join(process.cwd(), "db/schema/auth.ts"),
  "utf8",
);
const rlsHelper = readFileSync(join(process.cwd(), "lib/db/rls.ts"), "utf8");
const migrationJournal = readFileSync(
  join(process.cwd(), "db/migrations/meta/_journal.json"),
  "utf8",
);

describe("row level security", () => {
  it("enables and forces RLS on tenant-owned starter tables", () => {
    for (const table of ['"project"', '"chat"', '"message"']) {
      expect(migration).toContain(
        `alter table ${table} enable row level security`,
      );
      expect(migration).toContain(
        `alter table ${table} force row level security`,
      );
    }
  });

  it("defines tenant policies backed by request-scoped settings", () => {
    expect(migration.match(/create policy/g)?.length).toBeGreaterThanOrEqual(
      12,
    );
    expect(migration).toContain("current_setting('app.user_id', true)");
    expect(migration).toContain("current_setting('app.organization_id', true)");
  });

  it("requires active organization membership for organization-scoped projects", () => {
    expect(migration).toContain('"organization_id" = nullif(current_setting');
    expect(migration).toContain(
      "nullif(current_setting('app.organization_id', true), '') is null",
    );
    expect(migration).toContain('from "member"');
    expect(migration).toContain(
      '"member"."organization_id" = "project"."organization_id"',
    );
    expect(migration).toContain('"member"."user_id" = nullif(current_setting');
  });

  it("keeps AI chat history personal instead of organization-scoped", () => {
    expect(chatMigration).not.toContain('"organization_id"');
    expect(migration).not.toContain('"chat"."organization_id"');
    expect(appSchema).not.toContain("chat_organizationId_idx");
  });

  it("keeps starter indexes aligned with common billing lookups", () => {
    expect(initMigration).not.toContain("organization_slug_uidx");
    expect(authSchema).not.toContain("organization_slug_uidx");
    expect(initMigration).toContain('"subscription_referenceId_status_idx"');
    expect(initMigration).toContain('"subscription_stripeCustomerId_idx"');
    expect(initMigration).toContain('"subscription_stripeSubscriptionId_uidx"');
    expect(authSchema).toContain("subscription_referenceId_status_idx");
    expect(authSchema).toContain("subscription_stripeCustomerId_idx");
    expect(authSchema).toContain("subscription_stripeSubscriptionId_uidx");
  });

  it("stamps database access with actor and organization context", () => {
    expect(rlsHelper).toContain("set_config('app.user_id'");
    expect(rlsHelper).toContain("set_config('app.organization_id'");
  });

  it("keeps durable audit history tenant-scoped and append-only", () => {
    expect(migrationJournal).toContain('"tag": "0003_audit_events"');
    const normalizedAuditMigration = auditMigration.toLowerCase();
    expect(normalizedAuditMigration).toContain(
      'alter table "audit_event" enable row level security',
    );
    expect(normalizedAuditMigration).toContain(
      'alter table "audit_event" force row level security',
    );
    expect(normalizedAuditMigration).toContain(
      'create policy "audit_event_tenant_select"',
    );
    expect(normalizedAuditMigration).toContain(
      'create policy "audit_event_tenant_insert"',
    );
    expect(normalizedAuditMigration).toContain(
      '"actor_user_id" = nullif(current_setting',
    );
    expect(normalizedAuditMigration).toContain('from "member"');
    expect(auditMigration).not.toMatch(
      /create policy "audit_event_[^"]*update"/i,
    );
    expect(auditMigration).not.toMatch(
      /create policy "audit_event_[^"]*delete"/i,
    );
  });
});
