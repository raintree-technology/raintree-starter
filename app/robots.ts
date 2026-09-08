import type { MetadataRoute } from "next";
import { features } from "@/lib/config";
import {
  absoluteUrl,
  aiCrawlerAgents,
  privateCrawlPaths,
} from "@/lib/discovery";

export default function robots(): MetadataRoute.Robots {
  if (!features.seo) return { rules: { userAgent: "*", disallow: "/" } };
  const disallow = [...privateCrawlPaths];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      ...aiCrawlerAgents.map((agent) => ({
        userAgent: agent,
        allow: ["/", "/llms.txt", "/llms-full.txt", "/page.md", "/pricing.md"],
        disallow,
      })),
    ],
    sitemap: [
      absoluteUrl("/sitemap-index.xml"),
      absoluteUrl("/sitemap.xml"),
      absoluteUrl("/media-sitemap.xml"),
    ],
    host: absoluteUrl(),
  };
}
