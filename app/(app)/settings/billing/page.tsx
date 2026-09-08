import { notFound } from "next/navigation";
import { BillingPanel } from "@/components/settings/billing-panel";
import { getAppContext } from "@/lib/app-context";
import { PAID_PLANS } from "@/lib/billing/plans";
import { features } from "@/lib/config";
import { createNoIndexMetadata } from "@/lib/metadata";
import { getOrganizationMembers } from "@/lib/organizations";
import { isStripeConfigured } from "@/lib/stripe";
import { isMultiTenant } from "@/lib/tenancy";

export const metadata = createNoIndexMetadata({
  title: "Billing",
  description: "Manage subscription, seats, and billing portal access.",
  path: "/settings/billing",
});

export default async function BillingSettingsPage() {
  if (!features.billing) notFound();

  const ctx = await getAppContext();
  if (!ctx) return null;

  const isOrg = isMultiTenant && !!ctx.activeOrganizationId;
  const seats =
    isOrg && ctx.activeOrganizationId
      ? (await getOrganizationMembers(ctx.activeOrganizationId)).length
      : 1;

  return (
    <BillingPanel
      stripeConfigured={isStripeConfigured}
      referenceId={ctx.referenceId}
      isOrg={isOrg}
      currentPlan={ctx.subscription?.plan ?? null}
      status={ctx.subscription?.status ?? null}
      seats={Math.max(seats, 1)}
      plans={PAID_PLANS.map((p) => ({
        name: p.name,
        label: p.label,
        description: p.description,
        perSeat: p.perSeat,
        monthlyPriceCents: p.monthlyPriceCents,
        features: p.features,
        hasPrice: !!p.prices.monthly,
      }))}
    />
  );
}
