#!/usr/bin/env bun

import { Client } from "pg";
import { assertSafeRuntimeRole } from "@/lib/db/runtime-role";

const TENANT_TABLES = ["project", "chat", "message", "audit_event"] as const;

type RoleRow = {
  current_user: string;
  rolbypassrls: boolean;
  rolsuper: boolean;
};

async function main() {
  const connectionString =
    process.env.RUNTIME_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("RUNTIME_DATABASE_URL or DATABASE_URL is required.");
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const roleResult = await client.query<RoleRow>(`
      select current_user, role.rolsuper, role.rolbypassrls
      from pg_roles role
      where role.rolname = current_user
    `);
    const role = roleResult.rows[0];
    if (!role)
      throw new Error("Could not resolve the connected Postgres role.");
    const ownershipResult = await client.query<{ table_name: string }>(
      `
        select tablename as table_name
        from pg_tables
        where schemaname = 'public'
          and tablename = any($1::text[])
          and tableowner = current_user
      `,
      [TENANT_TABLES],
    );
    assertSafeRuntimeRole({
      name: role.current_user,
      superuser: role.rolsuper,
      bypassRls: role.rolbypassrls,
      ownedTenantTables: ownershipResult.rows.map((row) => row.table_name),
    });

    console.log(
      `Runtime database role ${role.current_user} passed: no SUPERUSER, BYPASSRLS, or tenant-table ownership.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
