#!/usr/bin/env bun

import { Client } from "pg";

const ownerUrl = process.env.RLS_OWNER_DATABASE_URL;
const runtimeUrl = process.env.RLS_TEST_DATABASE_URL;
if (!ownerUrl || !runtimeUrl) {
  throw new Error(
    "RLS_OWNER_DATABASE_URL and RLS_TEST_DATABASE_URL are required.",
  );
}
if (ownerUrl === runtimeUrl) {
  throw new Error("RLS owner and runtime credentials must be different.");
}

const runId = crypto.randomUUID();
const ids = {
  userA: `rls-user-a-${runId}`,
  userB: `rls-user-b-${runId}`,
  orgA: `rls-org-a-${runId}`,
  orgB: `rls-org-b-${runId}`,
  memberA: `rls-member-a-${runId}`,
  memberB: `rls-member-b-${runId}`,
  projectA: `rls-project-a-${runId}`,
  projectB: `rls-project-b-${runId}`,
};

const owner = new Client({ connectionString: ownerUrl });
const runtime = new Client({ connectionString: runtimeUrl });

async function seed() {
  await owner.query(
    `insert into "user" (id, name, email, email_verified, created_at, updated_at)
     values ($1, 'RLS A', $2, true, now(), now()), ($3, 'RLS B', $4, true, now(), now())`,
    [
      ids.userA,
      `${ids.userA}@example.invalid`,
      ids.userB,
      `${ids.userB}@example.invalid`,
    ],
  );
  await owner.query(
    `insert into "organization" (id, name, slug, created_at)
     values ($1, 'RLS Org A', $2, now()), ($3, 'RLS Org B', $4, now())`,
    [ids.orgA, ids.orgA, ids.orgB, ids.orgB],
  );
  await owner.query(
    `insert into "member" (id, organization_id, user_id, role, created_at)
     values ($1, $2, $3, 'owner', now()), ($4, $5, $6, 'owner', now())`,
    [ids.memberA, ids.orgA, ids.userA, ids.memberB, ids.orgB, ids.userB],
  );
  await owner.query(
    `insert into "project" (id, name, slug, organization_id, user_id, created_at, updated_at)
     values ($1, 'Project A', $1, $2, $3, now(), now()),
            ($4, 'Project B', $4, $5, $6, now(), now())`,
    [ids.projectA, ids.orgA, ids.userA, ids.projectB, ids.orgB, ids.userB],
  );
}

async function probe() {
  await runtime.query("begin");
  try {
    await runtime.query(`select set_config('app.user_id', $1, true)`, [
      ids.userA,
    ]);
    await runtime.query(`select set_config('app.organization_id', $1, true)`, [
      ids.orgA,
    ]);
    const own = await runtime.query<{ id: string }>(
      `select id from "project" order by id`,
    );
    if (own.rows.length !== 1 || own.rows[0]?.id !== ids.projectA) {
      throw new Error(
        "Runtime role did not isolate organization A project reads.",
      );
    }

    await runtime.query(`select set_config('app.organization_id', $1, true)`, [
      ids.orgB,
    ]);
    const foreign = await runtime.query<{ id: string }>(
      `select id from "project" order by id`,
    );
    if (foreign.rows.length !== 0) {
      throw new Error(
        "Runtime role exposed a project from an organization without membership.",
      );
    }

    const changed = await runtime.query(
      "update project set name = $1 where id = $2 returning id",
      ["Forbidden update", ids.projectB],
    );
    if (changed.rowCount !== 0)
      throw new Error("Runtime updated a foreign project.");
    const deleted = await runtime.query(
      "delete from project where id = $1 returning id",
      [ids.projectB],
    );
    if (deleted.rowCount !== 0)
      throw new Error("Runtime deleted a foreign project.");

    await runtime.query("savepoint forbidden_insert");
    let insertDenied = false;
    try {
      await runtime.query(
        "insert into project (id,name,slug,organization_id,user_id) values ($1,$2,$1,$3,$4)",
        [crypto.randomUUID(), "Forbidden project", ids.orgB, ids.userA],
      );
    } catch (error) {
      insertDenied =
        error instanceof Error && "code" in error && error.code === "42501";
    }
    await runtime.query("rollback to savepoint forbidden_insert");
    if (!insertDenied)
      throw new Error("Runtime accepted a foreign-organization insert.");

    await owner.query("delete from member where id = $1", [ids.memberA]);
    await runtime.query("select set_config('app.organization_id', $1, true)", [
      ids.orgA,
    ]);
    const removed = await runtime.query(
      "select id from project where id = $1",
      [ids.projectA],
    );
    if (removed.rowCount !== 0)
      throw new Error("Removed member retained project access.");
  } finally {
    await runtime.query("rollback");
  }
}

async function cleanup() {
  await owner.query(`delete from "project" where id = any($1::text[])`, [
    [ids.projectA, ids.projectB],
  ]);
  await owner.query(`delete from "member" where id = any($1::text[])`, [
    [ids.memberA, ids.memberB],
  ]);
  await owner.query(`delete from "organization" where id = any($1::text[])`, [
    [ids.orgA, ids.orgB],
  ]);
  await owner.query(`delete from "user" where id = any($1::text[])`, [
    [ids.userA, ids.userB],
  ]);
}

await owner.connect();
await runtime.connect();
try {
  await seed();
  await probe();
  console.log("Cross-tenant RLS probe passed.");
} finally {
  await cleanup().catch((error) => {
    console.error("RLS fixture cleanup failed.", error);
  });
  await Promise.all([owner.end(), runtime.end()]);
}
