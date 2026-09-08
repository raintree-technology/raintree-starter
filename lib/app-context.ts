import "server-only";
import { cache } from "react";
import {
  billingReferenceId,
  getActiveSubscription,
  planForSubscription,
} from "@/lib/billing/subscription";
import { createOperationLogger } from "@/lib/logger";
import { getOrganizationsForUser } from "@/lib/organizations";
import { getActiveOrganizationId, getSession } from "@/lib/session";
import { isMultiTenant } from "@/lib/tenancy";

/**
 * Per-request app context shared by the (app) layout and its pages. Wrapped in
 * React `cache`, so calling it from the layout and a page issues the queries
 * once. Returns null when unauthenticated (the proxy normally prevents that).
 */
export const getAppContext = cache(async () => {
  const operation = createOperationLogger({ module: "app-context" });
  const session = await getSession();
  if (!session) {
    operation.debug({}, "app_context.unauthenticated");
    return null;
  }

  const organizations = isMultiTenant
    ? await getOrganizationsForUser(session.user.id)
    : [];
  // A signed session can outlive organization membership. Resolve authority anew.
  const activeOrganization =
    organizations.find(
      (organization) => organization.id === getActiveOrganizationId(session),
    ) ?? null;
  const activeOrganizationId = activeOrganization?.id ?? null;
  const referenceId = billingReferenceId({
    userId: session.user.id,
    activeOrganizationId,
  });
  const subscription = await getActiveSubscription(referenceId);

  const plan = planForSubscription(subscription);

  operation.debug(
    {
      userId: session.user.id,
      activeOrganizationId,
      organizationCount: organizations.length,
      referenceId,
      plan: plan?.name,
      isAdmin: "role" in session.user && session.user.role === "admin",
    },
    "app_context.resolved",
  );

  return {
    session,
    user: session.user,
    organizations,
    activeOrganization,
    activeOrganizationId,
    referenceId,
    subscription,
    plan,
    isAdmin: "role" in session.user && session.user.role === "admin",
  };
});
