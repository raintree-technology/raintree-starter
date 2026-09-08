import { describe, expect, it } from "vitest";
import {
  getPlan,
  isPerSeatPlan,
  PLANS,
  toStripePlans,
} from "@/lib/billing/plans";

describe("billing plans", () => {
  it("defines free, pro, and team tiers", () => {
    expect(PLANS.map((p) => p.name)).toEqual(["free", "pro", "team"]);
  });

  it("marks the team plan as per-seat and pro as flat", () => {
    expect(isPerSeatPlan("team")).toBe(true);
    expect(isPerSeatPlan("pro")).toBe(false);
    expect(isPerSeatPlan("free")).toBe(false);
  });

  it("resolves plans by name", () => {
    expect(getPlan("pro")?.label).toBe("Pro");
    expect(getPlan("nope")).toBeUndefined();
  });

  it("maps configured Stripe prices, including the annual discount price", () => {
    const stripePlans = toStripePlans();
    const team = stripePlans.find((p) => p.name === "team");
    expect(team?.priceId).toBe("price_team_test");
    expect(team?.annualDiscountPriceId).toBe("price_team_year_test");
    // Free plan has no price and must be excluded.
    expect(stripePlans.find((p) => p.name === "free")).toBeUndefined();
  });
});
