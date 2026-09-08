import "server-only";
import type { UIMessage } from "ai";
import { and, desc, eq } from "drizzle-orm";
import { cache } from "react";
import * as schema from "@/db/schema";
import { withRlsContext } from "@/lib/db/rls";
import { createOperationLogger } from "@/lib/logger";

/** Chat history is personal (scoped to the creating user). */
export const listChats = cache(async function listChats(userId: string) {
  const operation = createOperationLogger({ module: "data.chat", userId });

  try {
    const chats = await withRlsContext({ userId, organizationId: null }, (tx) =>
      tx
        .select({
          id: schema.chat.id,
          title: schema.chat.title,
          updatedAt: schema.chat.updatedAt,
        })
        .from(schema.chat)
        .where(eq(schema.chat.userId, userId))
        .orderBy(desc(schema.chat.updatedAt))
        .limit(50),
    );
    operation.debug({ count: chats.length }, "chat.list.completed");
    return chats;
  } catch (err) {
    operation.error({ err }, "chat.list.failed");
    throw err;
  }
});

export const getChatMessages = cache(async function getChatMessages(
  chatId: string,
  userId: string,
): Promise<UIMessage[]> {
  const operation = createOperationLogger({
    module: "data.chat",
    userId,
    chatId,
  });

  try {
    const rows = await withRlsContext(
      { userId, organizationId: null },
      async (tx) => {
        const owned = await tx
          .select({ id: schema.chat.id })
          .from(schema.chat)
          .where(
            and(eq(schema.chat.id, chatId), eq(schema.chat.userId, userId)),
          );
        if (!owned[0]) return [];

        return tx
          .select()
          .from(schema.message)
          .where(eq(schema.message.chatId, chatId))
          .orderBy(schema.message.createdAt);
      },
    );

    const messages = rows.map((m) => ({
      id: m.id,
      role: m.role as UIMessage["role"],
      parts: m.parts as UIMessage["parts"],
    }));
    operation.debug(
      { messageCount: messages.length },
      "chat.messages.completed",
    );
    return messages;
  } catch (err) {
    operation.error({ err }, "chat.messages.failed");
    throw err;
  }
});

function deriveTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  const text = firstUser?.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
  return text ? text.slice(0, 60) : "New chat";
}

export async function saveChat(args: {
  chatId: string;
  userId: string;
  messages: UIMessage[];
}): Promise<void> {
  const operation = createOperationLogger({
    module: "data.chat",
    userId: args.userId,
    chatId: args.chatId,
  });
  const title = deriveTitle(args.messages);

  try {
    await withRlsContext(
      { userId: args.userId, organizationId: null },
      async (tx) => {
        await tx
          .insert(schema.chat)
          .values({
            id: args.chatId,
            userId: args.userId,
            title,
          })
          .onConflictDoUpdate({
            target: schema.chat.id,
            set: { title, updatedAt: new Date() },
          });

        await tx
          .delete(schema.message)
          .where(eq(schema.message.chatId, args.chatId));

        if (args.messages.length > 0) {
          await tx.insert(schema.message).values(
            args.messages.map((m) => ({
              id: m.id,
              chatId: args.chatId,
              role: m.role,
              parts: m.parts as unknown[],
            })),
          );
        }
      },
    );
    operation.info(
      { messageCount: args.messages.length },
      "chat.save.completed",
    );
  } catch (err) {
    operation.error(
      { err, messageCount: args.messages.length },
      "chat.save.failed",
    );
    throw err;
  }
}
