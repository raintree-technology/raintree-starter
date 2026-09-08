import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { type AppPlan, getPlan } from "@/lib/billing/plans";
import { createOperationLogger } from "@/lib/logger";
import { isMultiTenant } from "@/lib/tenancy";

export type Subscription = typeof schema.subscription.$inferSelect;

const LIVE_STATUSES = ["active", "trialing", "past_due"];

/** The active/trialing subscription for a billing reference (user or org), if any. */
export const getActiveSubscription = cache(async function getActiveSubscription(
  referenceId: string,
): Promise<Subscription | null> {
  const operation = createOperationLogger({
    module: "billing.subscription",
    referenceId,
  });

  try {
    const rows = await db
      .select()
      .from(schema.subscription)
      .where(
        and(
          eq(schema.subscription.referenceId, referenceId),
          inArray(schema.subscription.status, LIVE_STATUSES),
        ),
      );
    const subscription = rows[0] ?? null;
    operation.debug(
      {
        found: subscription !== null,
        status: subscription?.status,
        plan: subscription?.plan,
      },
      "billing.subscription.lookup.completed",
    );
    return subscription;
  } catch (err) {
    operation.error({ err }, "billing.subscription.lookup.failed");
    throw err;
  }
});

/** Resolve the plan a subscription maps to (defaults to the free plan). */
export function planForSubscription(
  sub: Subscription | null,
): AppPlan | undefined {
  return sub ? getPlan(sub.plan) : getPlan("free");
}

/**
 * The id billing is attached to: the active organization in multi-tenant mode,
 * otherwise the user. Keep this the single source of truth so server and client
 * agree on what gets charged.
 */
export function billingReferenceId(opts: {
  userId: string;
  activeOrganizationId?: string | null;
}): string {
  if (isMultiTenant && opts.activeOrganizationId)
    return opts.activeOrganizationId;
  return opts.userId;
}
