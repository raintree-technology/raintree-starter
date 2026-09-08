CREATE TABLE "audit_event" (
  "id" text PRIMARY KEY NOT NULL,
  "action" text NOT NULL,
  "actor_user_id" text NOT NULL,
  "organization_id" text,
  "resource_type" text NOT NULL,
  "resource_id" text,
  "result" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_user_id_user_id_fk"
  FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "auditEvent_actorUserId_createdAt_idx"
  ON "audit_event" USING btree ("actor_user_id", "created_at");
--> statement-breakpoint
CREATE INDEX "auditEvent_organizationId_createdAt_idx"
  ON "audit_event" USING btree ("organization_id", "created_at");
--> statement-breakpoint
CREATE INDEX "auditEvent_resource_idx"
  ON "audit_event" USING btree ("resource_type", "resource_id");
--> statement-breakpoint
ALTER TABLE "audit_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_event" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "audit_event_tenant_select" ON "audit_event"
  FOR SELECT
  USING (
    (
      "organization_id" IS NULL
      AND NULLIF(current_setting('app.organization_id', true), '') IS NULL
      AND "actor_user_id" = NULLIF(current_setting('app.user_id', true), '')
    )
    OR (
      "organization_id" IS NOT NULL
      AND "organization_id" = NULLIF(current_setting('app.organization_id', true), '')
      AND EXISTS (
        SELECT 1
        FROM "member"
        WHERE "member"."organization_id" = "audit_event"."organization_id"
          AND "member"."user_id" = NULLIF(current_setting('app.user_id', true), '')
      )
    )
  );
--> statement-breakpoint
CREATE POLICY "audit_event_tenant_insert" ON "audit_event"
  FOR INSERT
  WITH CHECK (
    "actor_user_id" = NULLIF(current_setting('app.user_id', true), '')
    AND (
      (
        "organization_id" IS NULL
        AND NULLIF(current_setting('app.organization_id', true), '') IS NULL
      )
      OR (
        "organization_id" = NULLIF(current_setting('app.organization_id', true), '')
        AND EXISTS (
          SELECT 1
          FROM "member"
          WHERE "member"."organization_id" = "audit_event"."organization_id"
            AND "member"."user_id" = NULLIF(current_setting('app.user_id', true), '')
        )
      )
    )
  );

-- Intentionally no UPDATE or DELETE policies: tenant audit rows are append-only.
