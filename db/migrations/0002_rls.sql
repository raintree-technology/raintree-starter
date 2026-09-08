-- Tenant-owned starter tables use request-scoped Postgres settings from
-- lib/db/rls.ts. Better Auth tables are intentionally left to the auth adapter.
alter table "project" enable row level security;
alter table "project" force row level security;
alter table "chat" enable row level security;
alter table "chat" force row level security;
alter table "message" enable row level security;
alter table "message" force row level security;
--> statement-breakpoint
drop policy if exists "project_tenant_select" on "project";
drop policy if exists "project_tenant_insert" on "project";
drop policy if exists "project_tenant_update" on "project";
drop policy if exists "project_tenant_delete" on "project";
--> statement-breakpoint
create policy "project_tenant_select" on "project"
  for select
  using (
    (
      "organization_id" is null
      and nullif(current_setting('app.organization_id', true), '') is null
      and "user_id" = nullif(current_setting('app.user_id', true), '')
    )
    or (
      "organization_id" is not null
      and "organization_id" = nullif(current_setting('app.organization_id', true), '')
      and exists (
        select 1
        from "member"
        where "member"."organization_id" = "project"."organization_id"
          and "member"."user_id" = nullif(current_setting('app.user_id', true), '')
      )
    )
  );
--> statement-breakpoint
create policy "project_tenant_insert" on "project"
  for insert
  with check (
    "user_id" = nullif(current_setting('app.user_id', true), '')
    and (
      (
        "organization_id" is null
        and nullif(current_setting('app.organization_id', true), '') is null
      )
      or (
        "organization_id" = nullif(current_setting('app.organization_id', true), '')
        and exists (
          select 1
          from "member"
          where "member"."organization_id" = "project"."organization_id"
            and "member"."user_id" = nullif(current_setting('app.user_id', true), '')
        )
      )
    )
  );
--> statement-breakpoint
create policy "project_tenant_update" on "project"
  for update
  using (
    (
      "organization_id" is null
      and nullif(current_setting('app.organization_id', true), '') is null
      and "user_id" = nullif(current_setting('app.user_id', true), '')
    )
    or (
      "organization_id" is not null
      and "organization_id" = nullif(current_setting('app.organization_id', true), '')
      and exists (
        select 1
        from "member"
        where "member"."organization_id" = "project"."organization_id"
          and "member"."user_id" = nullif(current_setting('app.user_id', true), '')
      )
    )
  )
  with check (
    (
      "organization_id" is null
      and nullif(current_setting('app.organization_id', true), '') is null
      and "user_id" = nullif(current_setting('app.user_id', true), '')
    )
    or (
      "organization_id" is not null
      and "organization_id" = nullif(current_setting('app.organization_id', true), '')
      and exists (
        select 1
        from "member"
        where "member"."organization_id" = "project"."organization_id"
          and "member"."user_id" = nullif(current_setting('app.user_id', true), '')
      )
    )
  );
--> statement-breakpoint
create policy "project_tenant_delete" on "project"
  for delete
  using (
    (
      "organization_id" is null
      and nullif(current_setting('app.organization_id', true), '') is null
      and "user_id" = nullif(current_setting('app.user_id', true), '')
    )
    or (
      "organization_id" is not null
      and "organization_id" = nullif(current_setting('app.organization_id', true), '')
      and exists (
        select 1
        from "member"
        where "member"."organization_id" = "project"."organization_id"
          and "member"."user_id" = nullif(current_setting('app.user_id', true), '')
      )
    )
  );
--> statement-breakpoint
drop policy if exists "chat_tenant_select" on "chat";
drop policy if exists "chat_tenant_insert" on "chat";
drop policy if exists "chat_tenant_update" on "chat";
drop policy if exists "chat_tenant_delete" on "chat";
--> statement-breakpoint
create policy "chat_tenant_select" on "chat"
  for select
  using ("user_id" = nullif(current_setting('app.user_id', true), ''));
--> statement-breakpoint
create policy "chat_tenant_insert" on "chat"
  for insert
  with check ("user_id" = nullif(current_setting('app.user_id', true), ''));
--> statement-breakpoint
create policy "chat_tenant_update" on "chat"
  for update
  using ("user_id" = nullif(current_setting('app.user_id', true), ''))
  with check ("user_id" = nullif(current_setting('app.user_id', true), ''));
--> statement-breakpoint
create policy "chat_tenant_delete" on "chat"
  for delete
  using ("user_id" = nullif(current_setting('app.user_id', true), ''));
--> statement-breakpoint
drop policy if exists "message_tenant_select" on "message";
drop policy if exists "message_tenant_insert" on "message";
drop policy if exists "message_tenant_update" on "message";
drop policy if exists "message_tenant_delete" on "message";
--> statement-breakpoint
create policy "message_tenant_select" on "message"
  for select
  using (
    exists (
      select 1
      from "chat"
      where "chat"."id" = "message"."chat_id"
        and "chat"."user_id" = nullif(current_setting('app.user_id', true), '')
    )
  );
--> statement-breakpoint
create policy "message_tenant_insert" on "message"
  for insert
  with check (
    exists (
      select 1
      from "chat"
      where "chat"."id" = "message"."chat_id"
        and "chat"."user_id" = nullif(current_setting('app.user_id', true), '')
    )
  );
--> statement-breakpoint
create policy "message_tenant_update" on "message"
  for update
  using (
    exists (
      select 1
      from "chat"
      where "chat"."id" = "message"."chat_id"
        and "chat"."user_id" = nullif(current_setting('app.user_id', true), '')
    )
  )
  with check (
    exists (
      select 1
      from "chat"
      where "chat"."id" = "message"."chat_id"
        and "chat"."user_id" = nullif(current_setting('app.user_id', true), '')
    )
  );
--> statement-breakpoint
create policy "message_tenant_delete" on "message"
  for delete
  using (
    exists (
      select 1
      from "chat"
      where "chat"."id" = "message"."chat_id"
        and "chat"."user_id" = nullif(current_setting('app.user_id', true), '')
    )
  );
