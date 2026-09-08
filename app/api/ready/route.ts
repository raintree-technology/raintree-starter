import { sql } from "drizzle-orm";
import { db } from "@/db";
import { authDb } from "@/db/auth-client";
import { runReadinessChecks } from "@/lib/readiness";
import { withRequestContext } from "@/lib/request-context";
import { apiOptionsResponse, noStoreJson } from "@/lib/route-handlers";

export async function GET(request: Request) {
  return withRequestContext(request, async ({ log }) => {
    const result = await runReadinessChecks([
      {
        name: "database",
        check: async () => {
          await db.execute(sql`select 1`);
        },
      },
      {
        name: "auth-database",
        check: async () => {
          await authDb.execute(sql`select 1`);
        },
      },
    ]);
    if (!result.ready) log.warn({ checks: result.checks }, "readiness.failed");
    return noStoreJson(result, { status: result.ready ? 200 : 503 });
  });
}

export function OPTIONS() {
  return apiOptionsResponse();
}
