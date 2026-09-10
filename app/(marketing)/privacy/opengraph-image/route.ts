import { createOgImage } from "@/lib/og-image";

export function GET() {
  return createOgImage({
    title: "Privacy and data handling",
    description:
      "A starter policy for account, organization, billing, and product data.",
    footer: ["Account data", "Billing", "Security", "Consent-aware"],
  });
}
