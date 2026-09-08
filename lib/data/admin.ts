import "server-only";
import { desc } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { createOperationLogger } from "@/lib/logger";

export const listAllUsers = cache(async function listAllUsers(limit = 100) {
  const operation = createOperationLogger({ module: "data.admin" });

  try {
    const users = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        role: schema.user.role,
        banned: schema.user.banned,
        emailVerified: schema.user.emailVerified,
        createdAt: schema.user.createdAt,
      })
      .from(schema.user)
      .orderBy(desc(schema.user.createdAt))
      .limit(limit);
    operation.debug(
      { count: users.length, limit },
      "admin.users.list.completed",
    );
    return users;
  } catch (err) {
    operation.error({ err, limit }, "admin.users.list.failed");
    throw err;
  }
});
