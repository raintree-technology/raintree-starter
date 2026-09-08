import "server-only";
import { desc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { createOperationLogger } from "@/lib/logger";

export const listPasskeys = cache(async function listPasskeys(userId: string) {
  const operation = createOperationLogger({ module: "data.account", userId });

  try {
    const passkeys = await db
      .select({
        id: schema.passkey.id,
        name: schema.passkey.name,
        deviceType: schema.passkey.deviceType,
        createdAt: schema.passkey.createdAt,
      })
      .from(schema.passkey)
      .where(eq(schema.passkey.userId, userId))
      .orderBy(desc(schema.passkey.createdAt));
    operation.debug(
      { count: passkeys.length },
      "account.passkeys.list.completed",
    );
    return passkeys;
  } catch (err) {
    operation.error({ err }, "account.passkeys.list.failed");
    throw err;
  }
});

export const listUserSessions = cache(async function listUserSessions(
  userId: string,
) {
  const operation = createOperationLogger({ module: "data.account", userId });

  try {
    const sessions = await db
      .select({
        id: schema.session.id,
        token: schema.session.token,
        userAgent: schema.session.userAgent,
        ipAddress: schema.session.ipAddress,
        createdAt: schema.session.createdAt,
      })
      .from(schema.session)
      .where(eq(schema.session.userId, userId))
      .orderBy(desc(schema.session.createdAt));
    operation.debug(
      { count: sessions.length },
      "account.sessions.list.completed",
    );
    return sessions;
  } catch (err) {
    operation.error({ err }, "account.sessions.list.failed");
    throw err;
  }
});
