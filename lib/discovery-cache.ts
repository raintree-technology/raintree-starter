import "server-only";
import { cacheLife } from "next/cache";
import { PLANS } from "@/lib/billing/plans";
import { features } from "@/lib/config";
import {
  absoluteUrl,
  agentSkills,
  discoveryResources,
  escapeXml,
  generateLlmsFullTxt,
  generateLlmsTxt,
  planPriceLabel,
  privateCrawlPaths,
  publicApiResources,
  publicRoutes,
  site,
} from "@/lib/discovery";

export async function getLlmsTxt(): Promise<string> {
  "use cache";
  cacheLife("hours");

  return generateLlmsTxt();
}

export async function getLlmsFullTxt(): Promise<string> {
  "use cache";
  cacheLife("hours");

  return generateLlmsFullTxt(features.billing ? PLANS : []);
}

export async function getHomeMarkdown(): Promise<string> {
  "use cache";
  cacheLife("hours");

  return `# ${site.name}

${site.description}

[Sign in](/login) or [create an account](/signup) to access your workspace.
${features.billing ? "\n[Example pricing plans](/pricing)" : ""}

[Privacy notice draft](/privacy)
`;
}

export async function getPricingMarkdown(): Promise<string> {
  "use cache";
  cacheLife("hours");

  const plans = PLANS.map((plan) => {
    const features = plan.features
      .map((feature) => `  - ${feature}`)
      .join("\n");
    return `## ${plan.label}

${plan.description}

Price: ${planPriceLabel(plan.monthlyPriceCents, plan.perSeat)}

Features:
${features}`;
  }).join("\n\n");

  return `# ${site.name} example pricing

These are sample plans. The owner must confirm prices and terms before launch.

${plans}
`;
}

export async function getFeedXml(): Promise<string> {
  "use cache";
  cacheLife("hours");

  const updated = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title>${escapeXml(site.name)} updates</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.shortDescription)}</description>
    <language>${site.language}</language>
    <lastBuildDate>${updated}</lastBuildDate>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />
    <sy:updatePeriod>weekly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
${publicRoutes
  .map((item) => {
    const url = absoluteUrl(item.path);
    return `    <item>
      <title>${escapeXml(`${site.name} ${item.title.toLowerCase()}`)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${updated}</pubDate>
    </item>`;
  })
  .join("\n")}
  </channel>
</rss>`;
}

export async function getFeedJson() {
  "use cache";
  cacheLife("hours");

  return {
    version: "https://jsonfeed.org/version/1.1",
    title: `${site.name} updates`,
    home_page_url: site.url,
    feed_url: absoluteUrl("/feed.json"),
    language: site.language,
    items: publicRoutes.map((route) => ({
      id: absoluteUrl(route.path),
      url: absoluteUrl(route.path),
      title: `${site.name} ${route.title.toLowerCase()}`,
      content_text: route.description,
    })),
  };
}

export async function getHomeSchema() {
  "use cache";
  cacheLife("hours");

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
  };
}

export async function getPricingSchema() {
  "use cache";
  cacheLife("hours");

  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `${site.name} pricing`,
    url: absoluteUrl("/pricing"),
    itemListElement: [],
  };
}

export async function getSchemaMapXml(): Promise<string> {
  "use cache";
  cacheLife("hours");

  return `<?xml version="1.0" encoding="UTF-8"?>
<schemamap xmlns="https://example.com/schemamap/1.0">
${publicRoutes
  .filter((resource) => resource.schema)
  .map(
    (resource) => `  <resource>
    <loc>${absoluteUrl(resource.path)}</loc>
    <schema>${absoluteUrl(resource.schema!)}</schema>
  </resource>`,
  )
  .join("\n")}
</schemamap>`;
}

export async function getSitemapIndexXml(): Promise<string> {
  "use cache";
  cacheLife("hours");

  const now = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${absoluteUrl("/sitemap.xml")}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${absoluteUrl("/media-sitemap.xml")}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
}

export async function getMediaSitemapXml(): Promise<string> {
  "use cache";
  cacheLife("hours");

  const images = [
    {
      page: "/",
      image: "/opengraph-image",
      caption: `${site.name} social preview`,
      title: site.name,
    },
    {
      page: "/pricing",
      image: "/pricing/opengraph-image",
      caption: "Pricing plans for Next Starter",
      title: "Next Starter pricing",
    },
    {
      page: "/privacy",
      image: "/privacy/opengraph-image",
      caption: "Privacy policy for Next Starter",
      title: "Next Starter privacy",
    },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${images
  .filter((entry) => publicRoutes.some((route) => route.path === entry.page))
  .map(
    (entry) => `  <url>
    <loc>${absoluteUrl(entry.page)}</loc>
    <image:image>
      <image:loc>${absoluteUrl(entry.image)}</image:loc>
      <image:caption>${escapeXml(entry.caption)}</image:caption>
      <image:title>${escapeXml(entry.title)}</image:title>
    </image:image>
  </url>`,
  )
  .join("\n")}
</urlset>`;
}

export async function getSecurityTxt(): Promise<string[]> {
  "use cache";
  cacheLife("days");

  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + 180);

  return [
    `Contact: ${absoluteUrl("/privacy")}`,
    "Preferred-Languages: en",
    `Canonical: ${absoluteUrl("/.well-known/security.txt")}`,
    `Expires: ${expires.toISOString()}`,
    "",
  ];
}

export async function getApiCatalog() {
  "use cache";
  cacheLife("days");

  return {
    linkset: [
      {
        anchor: site.url,
        item: publicApiResources.map((resource) => ({
          href: absoluteUrl(resource.href),
          type: resource.type,
          title: resource.title,
        })),
        "service-desc": discoveryResources.map((resource) => ({
          href: absoluteUrl(resource.path),
          type: resource.type,
          title: resource.title,
        })),
        "service-doc": publicRoutes.map((route) => ({
          href: absoluteUrl(route.path),
          title: route.title,
          type: "text/html",
        })),
      },
    ],
  };
}

export async function getAgentCard() {
  "use cache";
  cacheLife("days");

  return {
    name: site.name,
    description: `Public discovery card for ${site.name}'s agent-readable resources.`,
    url: site.url,
    provider: {
      organization: site.name,
      url: site.url,
    },
    version: "1.0.0",
    capabilities: {
      streaming: false,
      pushNotifications: false,
    },
    skills: agentSkills,
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/plain", "application/json"],
    endpoint: absoluteUrl("/ask"),
  };
}

export async function getAgentSkills() {
  "use cache";
  cacheLife("days");

  return { skills: agentSkills };
}

export async function getTrafficAdvice() {
  "use cache";
  cacheLife("days");

  return [
    {
      user_agent: "prefetch-proxy",
      fraction: 1.0,
    },
    {
      user_agent: "*",
      disallow: privateCrawlPaths,
    },
  ];
}

export async function getAskInfo() {
  "use cache";
  cacheLife("hours");

  const resources = publicRoutes.map((route) => ({
    title: route.title,
    url: absoluteUrl(route.path),
    markdown: route.markdown,
    description: route.description,
  }));

  return {
    name: `${site.name} NLWeb endpoint`,
    description: `POST a JSON body with a query field to discover public ${site.name} resources.`,
    resources,
  };
}
