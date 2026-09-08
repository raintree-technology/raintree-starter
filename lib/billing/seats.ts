import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getPlan } from "@/lib/billing/plans";
import { features } from "@/lib/config";
import { createOperationLogger } from "@/lib/logger";
import { isStripeConfigured, stripe } from "@/lib/stripe";

/**
 * Per-seat billing: keep an organization's Stripe subscription quantity equal to
 * its member count. Called from the organization plugin's add/remove member
 * hooks. No-ops when Stripe is not configured or the org has no active
 * subscription, so it is always safe to call.
 */
export async function syncOrganizationSeats(
  organizationId: string,
): Promise<void> {
  const operation = createOperationLogger({
    module: "billing.seats",
    organizationId,
  });

  if (!features.billing || !isStripeConfigured) {
    operation.log.debug("billing.seats.sync.skipped");
    return;
  }

  try {
    const members = await db
      .select({ id: schema.member.id })
      .from(schema.member)
      .where(eq(schema.member.organizationId, organizationId));
    const seats = Math.max(members.length, 1);

    const subs = await db
      .select()
      .from(schema.subscription)
      .where(
        and(
          eq(schema.subscription.referenceId, organizationId),
          inArray(schema.subscription.status, ["active", "trialing"]),
        ),
      );
    const sub = subs[0];
    if (!sub?.stripeSubscriptionId) {
      operation.debug({ seats }, "billing.seats.sync.no_subscription");
      return;
    }

    const plan = getPlan(sub.plan);
    if (!plan?.perSeat) return;

    const stripeSub = await stripe.subscriptions.retrieve(
      sub.stripeSubscriptionId,
    );
    const item = stripeSub.items.data.find(
      (item) =>
        item.price.id === plan.prices.monthly ||
        item.price.id === plan.prices.yearly,
    );
    if (!item) {
      operation.warn(
        { seats, stripeSubscriptionId: sub.stripeSubscriptionId },
        "billing.seats.sync.no_subscription_item",
      );
      return;
    }
    if (item.quantity === seats) {
      operation.debug(
        { seats, stripeSubscriptionId: sub.stripeSubscriptionId },
        "billing.seats.sync.already_current",
      );
      return;
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      items: [{ id: item.id, quantity: seats }],
      proration_behavior: "create_prorations",
    });
    operation.info(
      {
        seats,
        previousSeats: item.quantity,
        stripeSubscriptionId: sub.stripeSubscriptionId,
      },
      "billing.seats.sync.updated",
    );
  } catch (err) {
    operation.error({ err }, "billing.seats.sync.failed");
    throw err;
  }
}
