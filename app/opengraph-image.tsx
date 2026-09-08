import { site } from "@/lib/discovery";
import { createOgImage, ogImageContentType, ogImageSize } from "@/lib/og-image";

export const alt = `${site.name} workspace`;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function OpengraphImage() {
  return createOgImage({
    title: site.name,
    description:
      "Better Auth, Stripe, Neon, SEO, agent readiness, and production defaults in one starter.",
    footer: ["Better Auth", "Stripe", "Neon", "Agent-ready"],
  });
}
