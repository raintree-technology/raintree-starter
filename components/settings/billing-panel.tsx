"use client";

import { Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  StatusBadge,
  subscriptionStatusPresentation,
} from "@/components/ui/status-badge";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

type PlanView = {
  name: string;
  label: string;
  description: string;
  perSeat: boolean;
  monthlyPriceCents: number;
  features: string[];
  hasPrice: boolean;
};

export function BillingPanel({
  stripeConfigured,
  referenceId,
  isOrg,
  currentPlan,
  status,
  seats,
  plans,
}: {
  stripeConfigured: boolean;
  referenceId: string;
  isOrg: boolean;
  currentPlan: string | null;
  status: string | null;
  seats: number;
  plans: PlanView[];
}) {
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const customerType = isOrg ? ("organization" as const) : ("user" as const);
  const activePlan = currentPlan ?? "free";
  const activePlanDefinition = plans.find((plan) => plan.name === activePlan);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (searchParams.get("success") !== "1") return;

    toast.success("Checkout complete");
    const url = new URL(window.location.href);
    url.searchParams.delete("success");
    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [searchParams]);

  async function upgrade(plan: PlanView) {
    setBusy(plan.name);
    try {
      const { error } = await authClient.subscription.upgrade({
        plan: plan.name,
        referenceId,
        customerType,
        ...(plan.perSeat ? { seats } : {}),
        successUrl: `${origin}/settings/billing?success=1`,
        cancelUrl: `${origin}/settings/billing`,
      });
      if (error) {
        toast.error(error.message ?? "Could not start checkout");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not start checkout"));
    } finally {
      setBusy(null);
    }
  }

  async function manage() {
    setBusy("manage");
    try {
      const { error } = await authClient.subscription.billingPortal({
        referenceId,
        customerType,
        returnUrl: `${origin}/settings/billing`,
      });
      if (error) {
        toast.error(error.message ?? "Could not open billing portal");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not open billing portal"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current plan</CardTitle>
            {status && (
              <StatusBadge tone={subscriptionStatusPresentation(status).tone}>
                {subscriptionStatusPresentation(status).label}
              </StatusBadge>
            )}
          </div>
          <CardDescription>
            You are on the{" "}
            <span className="font-medium capitalize">{activePlan}</span> plan
            {isOrg
              ? ` · ${activePlanDefinition?.perSeat ? "billed per seat · " : ""}${seats} ${seats === 1 ? "member" : "members"}`
              : ""}
            .
          </CardDescription>
          {status === "past_due" && (
            <p className="text-sm font-medium">
              Your last payment failed. Update your payment method in the
              billing portal to keep this plan active.
            </p>
          )}
        </CardHeader>
        {currentPlan && (
          <CardContent>
            <Button variant="outline" onClick={manage} disabled={busy !== null}>
              {busy === "manage" ? "Opening…" : "Manage billing"}
            </Button>
          </CardContent>
        )}
      </Card>

      {!stripeConfigured && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Billing is not configured. Set{" "}
            <code className="font-mono">STRIPE_SECRET_KEY</code> and the plan
            price IDs to enable checkout.
          </CardContent>
        </Card>
      )}

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-5 text-sm text-muted-foreground">
            No paid plans are available right now.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const isCurrent = plan.name === currentPlan;
            const unavailable = !stripeConfigured || !plan.hasPrice;
            const disabled = unavailable || isCurrent || busy !== null;
            return (
              <Card key={plan.name}>
                <CardHeader>
                  <CardTitle className="text-title">{plan.label}</CardTitle>
                  <CardDescription>
                    <span className="font-medium text-foreground">
                      ${(plan.monthlyPriceCents / 100).toFixed(0)}
                    </span>
                    {plan.perSeat ? "/seat" : ""}/mo
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {unavailable && stripeConfigured && !plan.hasPrice && (
                    <p className="text-xs text-muted-foreground">
                      Checkout is not available for this plan yet.
                    </p>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => upgrade(plan)}
                    disabled={disabled}
                  >
                    {isCurrent
                      ? "Current plan"
                      : busy === plan.name
                        ? "Redirecting…"
                        : unavailable
                          ? "Unavailable"
                          : `Choose ${plan.label}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
