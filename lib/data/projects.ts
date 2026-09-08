import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { cache } from "react";
import * as schema from "@/db/schema";
import { withRlsContext } from "@/lib/db/rls";
import { createOperationLogger } from "@/lib/logger";

/**
 * Tenant-scoped project listing. In multi-tenant mode projects are scoped to the
 * active organization; in single-tenant mode they are scoped to the user (and
 * have no organization).
 */
export async function listProjects(opts: {
  userId: string;
  organizationId: string | null;
}) {
  return listProjectsForScope(opts.userId, opts.organizationId);
}

const listProjectsForScope = cache(async function listProjectsForScope(
  userId: string,
  organizationId: string | null,
) {
  const operation = createOperationLogger({
    module: "data.projects",
    userId,
    organizationId,
  });
  const where = organizationId
    ? eq(schema.project.organizationId, organizationId)
    : and(
        eq(schema.project.userId, userId),
        isNull(schema.project.organizationId),
      );
  try {
    const projects = await withRlsContext({ userId, organizationId }, (tx) =>
      tx
        .select()
        .from(schema.project)
        .where(where)
        .orderBy(desc(schema.project.createdAt)),
    );
    operation.debug({ count: projects.length }, "projects.list.completed");
    return projects;
  } catch (err) {
    operation.error({ err }, "projects.list.failed");
    throw err;
  }
});
