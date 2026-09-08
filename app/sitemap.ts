import type { MetadataRoute } from "next";
import { absoluteUrl, publicRoutes, site } from "@/lib/discovery";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    alternates: {
      languages: {
        [site.language]: absoluteUrl(route.path),
      },
    },
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}
