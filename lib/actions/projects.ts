"use server";

import { and, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as schema from "@/db/schema";
import { writeAuditEvent } from "@/lib/audit";
import { auditAuthEventAfterResponse } from "@/lib/auth-audit";
import { PLANS } from "@/lib/billing/plans";
import {
  billingReferenceId,
  getActiveSubscription,
  planForSubscription,
} from "@/lib/billing/subscription";
import { features } from "@/lib/config";
import { withRlsContext } from "@/lib/db/rls";
import { createOperationLogger } from "@/lib/logger";
import { getActiveOrganizationId, requireSession } from "@/lib/session";
import { isMultiTenant } from "@/lib/tenancy";
import { slugify } from "@/lib/utils";
import { createProjectSchema } from "@/lib/validation";

export type ActionState = { error?: string; success?: boolean };

function activeOrgId(
  session: Awaited<ReturnType<typeof requireSession>>,
): string | null {
  return isMultiTenant ? getActiveOrganizationId(session) : null;
}

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const actor = {
    userId: session.user.id,
    organizationId: activeOrgId(session),
  };
  const operation = createOperationLogger({
    module: "actions.projects",
    action: "create",
    ...actor,
  });
  const parsed = createProjectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    operation.warn(
      { issueCount: parsed.error.issues.length },
      "project.create.validation_failed",
    );
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Enforce the plan's project limit so pricing-page claims stay truthful.
  // Best-effort (count and insert are separate transactions); this is a
  // business limit, not a security boundary.
  const referenceId = billingReferenceId({
    userId: actor.userId,
    activeOrganizationId: actor.organizationId,
  });
  const plan = features.billing
    ? planForSubscription(await getActiveSubscription(referenceId))
    : undefined;
  const projectLimit = plan?.limits.projects;
  if (projectLimit !== undefined) {
    // Explicit tenant scope in addition to RLS, matching lib/data/projects.
    const scope = actor.organizationId
      ? eq(schema.project.organizationId, actor.organizationId)
      : and(
          eq(schema.project.userId, actor.userId),
          isNull(schema.project.organizationId),
        );
    const [{ value: projectCount }] = await withRlsContext(actor, (tx) =>
      tx.select({ value: count() }).from(schema.project).where(scope),
    );
    if (projectCount >= projectLimit) {
      auditAuthEventAfterResponse({
        type: "project.create.denied",
        actorId: actor.userId,
        organizationId: actor.organizationId,
        result: "denied",
      });
      operation.warn(
        { projectCount, projectLimit, plan: plan?.name },
        "project.create.limit_reached",
      );
      const higherPlanExists = PLANS.some(
        (p) => (p.limits.projects ?? Number.POSITIVE_INFINITY) > projectLimit,
      );
      return {
        error: `The ${plan?.label ?? "current"} plan includes ${projectLimit} ${projectLimit === 1 ? "project" : "projects"}.${higherPlanExists ? " Upgrade in Settings → Billing to add more." : " Delete a project to make room for a new one."}`,
      };
    }
  }

  try {
    const createdProject = await withRlsContext(actor, async (tx) => {
      const [created] = await tx
        .insert(schema.project)
        .values({
          name: parsed.data.name,
          slug: slugify(parsed.data.name),
          userId: actor.userId,
          organizationId: actor.organizationId,
        })
        .returning({ id: schema.project.id });
      if (!created) throw new Error("Project insert did not return a row.");
      await writeAuditEvent(tx, {
        action: "project.create",
        actor,
        resourceType: "project",
        resourceId: created.id,
        result: "allowed",
      });
      return created;
    });
    auditAuthEventAfterResponse({
      type: "project.create.allowed",
      actorId: actor.userId,
      organizationId: actor.organizationId,
      resource: createdProject.id,
      result: "allowed",
    });

    revalidatePath("/dashboard");
    operation.info({}, "project.create.completed");
    return { success: true };
  } catch (err) {
    operation.error({ err }, "project.create.failed");
    throw err;
  }
}

export async function deleteProjectAction(id: string): Promise<ActionState> {
  const session = await requireSession();
  const actor = {
    userId: session.user.id,
    organizationId: activeOrgId(session),
  };
  const operation = createOperationLogger({
    module: "actions.projects",
    action: "delete",
    projectId: id,
    ...actor,
  });

  try {
    const project = await withRlsContext(actor, async (tx) => {
      const rows = await tx
        .select()
        .from(schema.project)
        .where(eq(schema.project.id, id));
      const scopedProject = rows[0];
      if (!scopedProject) return null;

      await tx.delete(schema.project).where(eq(schema.project.id, id));
      await writeAuditEvent(tx, {
        action: "project.delete",
        actor,
        resourceType: "project",
        resourceId: scopedProject.id,
        result: "allowed",
        metadata: { name: scopedProject.name },
      });
      return scopedProject;
    });

    if (!project) {
      auditAuthEventAfterResponse({
        type: "project.delete.denied",
        actorId: actor.userId,
        organizationId: actor.organizationId,
        resource: id,
        result: "denied",
      });
      operation.warn({}, "project.delete.denied");
      return { error: "Project not found" };
    }

    auditAuthEventAfterResponse({
      type: "project.delete.allowed",
      actorId: actor.userId,
      organizationId: actor.organizationId,
      resource: id,
      result: "allowed",
    });
    revalidatePath("/dashboard");
    operation.info({}, "project.delete.completed");
    return { success: true };
  } catch (err) {
    operation.error({ err }, "project.delete.failed");
    throw err;
  }
}
