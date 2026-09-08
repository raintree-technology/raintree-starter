import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type RlsActor = {
  userId: string;
  organizationId: string | null;
};

export type RlsTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export async function withRlsContext<T>(
  actor: RlsActor,
  operation: (tx: RlsTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.user_id', ${actor.userId}, true)`,
    );
    await tx.execute(
      sql`select set_config('app.organization_id', ${actor.organizationId ?? ""}, true)`,
    );
    return operation(tx);
  });
}
