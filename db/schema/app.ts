import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

/**
 * Example tenant-scoped resource.
 *
 * `userId` (the creator/owner) is always set. `organizationId` is set in
 * multi-tenant mode and null in single-tenant mode — queries scope by whichever
 * applies (see lib/data/projects.ts), so the same table serves both models.
 */
export const project = pgTable(
  "project",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("project_organizationId_idx").on(t.organizationId),
    index("project_userId_idx").on(t.userId),
  ],
);

export const projectRelations = relations(project, ({ one }) => ({
  organization: one(organization, {
    fields: [project.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
}));

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;

/**
 * Append-only record of sensitive application decisions and mutations.
 *
 * Rows use the same user/organization scope as the operation that produced
 * them. RLS permits tenant reads and inserts, but intentionally defines no
 * update or delete policy.
 */
export const auditEvent = pgTable(
  "audit_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    action: text("action").notNull(),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "restrict",
    }),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    result: text("result").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("auditEvent_actorUserId_createdAt_idx").on(
      t.actorUserId,
      t.createdAt,
    ),
    index("auditEvent_organizationId_createdAt_idx").on(
      t.organizationId,
      t.createdAt,
    ),
    index("auditEvent_resource_idx").on(t.resourceType, t.resourceId),
  ],
);

export type AuditEvent = typeof auditEvent.$inferSelect;
export type NewAuditEvent = typeof auditEvent.$inferInsert;

/**
 * Personal AI chat history (enabled by starter.config.ts -> integrations.ai.persistHistory).
 * `message.id` is the AI SDK UIMessage id; `parts` stores the UIMessage parts
 * array as JSON.
 */
export const chat = pgTable(
  "chat",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull().default("New chat"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("chat_userId_idx").on(t.userId)],
);

export const message = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    parts: jsonb("parts").$type<unknown[]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("message_chatId_idx").on(t.chatId)],
);

export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, { fields: [chat.userId], references: [user.id] }),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, { fields: [message.chatId], references: [chat.id] }),
}));

export type Chat = typeof chat.$inferSelect;
export type Message = typeof message.$inferSelect;
