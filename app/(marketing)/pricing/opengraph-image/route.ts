import { createOgImage } from "@/lib/og-image";

export function GET() {
  return createOgImage({
    title: "Pricing that scales with you",
    description:
      "Compare free and paid starter plans with per-seat team billing for generated SaaS apps.",
    footer: ["Free", "Pro", "Team", "Stripe-ready"],
  });
}
