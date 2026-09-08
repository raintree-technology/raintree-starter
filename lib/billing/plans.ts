import "server-only";
import { env } from "@/lib/env";

/**
 * Application billing plans.
 *
 * Each plan maps to a Better Auth Stripe "plan" (one monthly price + an optional
 * annual price). `perSeat` plans bill by quantity = number of organization
 * members; the seat count is kept in sync with membership (see lib/billing/seats).
 */
export interface AppPlan {
  /** Stable identifier passed to the Stripe plugin and stored on subscriptions. */
  name: string;
  label: string;
  description: string;
  /** Bill one unit per organization member. */
  perSeat: boolean;
  /** Price in cents, per month, per unit — for display only. */
  monthlyPriceCents: number;
  features: string[];
  /** Soft limits surfaced to the app; enforce where relevant. */
  limits: Record<string, number>;
  prices: { monthly?: string; yearly?: string };
}

export const PLANS: AppPlan[] = [
  {
    name: "free",
    label: "Free",
    description: "Everything you need to kick the tires.",
    perSeat: false,
    monthlyPriceCents: 0,
    features: ["1 project", "Community support", "Basic analytics"],
    limits: { projects: 1, members: 1 },
    prices: {},
  },
  {
    name: "pro",
    label: "Pro",
    description: "For individuals shipping in production.",
    perSeat: false,
    monthlyPriceCents: 2000,
    features: ["Up to 100 projects", "Email support", "Advanced analytics"],
    limits: { projects: 100, members: 1 },
    prices: {
      monthly: env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: env.STRIPE_PRICE_PRO_YEARLY,
    },
  },
  {
    name: "team",
    label: "Team",
    description: "Per-seat pricing for collaborating organizations.",
    perSeat: true,
    monthlyPriceCents: 1500,
    features: [
      "Everything in Pro",
      "Per-seat billing",
      "Roles & permissions",
      "Priority support",
    ],
    limits: { projects: 1000, members: 100 },
    prices: {
      monthly: env.STRIPE_PRICE_TEAM_MONTHLY,
      yearly: env.STRIPE_PRICE_TEAM_YEARLY,
    },
  },
];

const PLANS_BY_NAME = new Map(PLANS.map((plan) => [plan.name, plan]));

export const PAID_PLANS = PLANS.filter(
  (p) => p.prices.monthly || p.prices.yearly,
);

export function getPlan(name: string): AppPlan | undefined {
  return PLANS_BY_NAME.get(name);
}

export function isPerSeatPlan(name: string | null | undefined): boolean {
  return !!name && !!getPlan(name)?.perSeat;
}

/**
 * Plans formatted for the Better Auth Stripe plugin. Only plans with a
 * configured Stripe price id are included.
 */
export function toStripePlans() {
  return PAID_PLANS.filter((p) => p.prices.monthly).map((p) => ({
    name: p.name,
    priceId: p.prices.monthly!,
    ...(p.prices.yearly ? { annualDiscountPriceId: p.prices.yearly } : {}),
    limits: p.limits,
  }));
}
