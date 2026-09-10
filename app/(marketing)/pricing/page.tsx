import { Check } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLANS } from "@/lib/billing/plans";
import { features } from "@/lib/config";
import { absoluteUrl, site } from "@/lib/discovery";
import { createPageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Compare free and paid starter plans, including per-seat team billing.",
  path: "/pricing",
  markdownPath: "/pricing.md",
  imagePath: "/pricing/opengraph-image",
  imageAlt: "Pricing plans for Next Starter",
});

function priceLabel(cents: number, perSeat: boolean): string {
  if (cents === 0) return "$0";
  return `$${(cents / 100).toFixed(0)}${perSeat ? "/seat" : ""}`;
}

export default async function PricingPage() {
  "use cache";
  cacheLife("days");
  if (!features.billing) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: site.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pricing",
        item: absoluteUrl("/pricing"),
      },
    ],
  };

  return (
    <div className="content-width py-20">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is serialized as data and HTML delimiters are escaped.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Example pricing plans
        </h1>
        <p className="mt-4 text-muted-foreground">
          These sample prices are not an offer. Configure your plans before
          launch.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const highlighted = plan.name === "pro";
          return (
            <Card
              key={plan.name}
              className={cn(
                "flex flex-col p-6",
                highlighted && "ring-2 ring-ring",
              )}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-title">{plan.label}</h2>
                {highlighted && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">
                    Example
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {priceLabel(plan.monthlyPriceCents, plan.perSeat)}
                </span>
                {plan.monthlyPriceCents > 0 && (
                  <span className="text-sm text-muted-foreground">/mo</span>
                )}
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-8"
                variant={highlighted ? "default" : "outline"}
              >
                <Link href="/signup">
                  {plan.monthlyPriceCents === 0
                    ? "Get started"
                    : `Choose ${plan.label}`}
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
