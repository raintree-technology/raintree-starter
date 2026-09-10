import "server-only";
import { features as flags } from "@/lib/config";
import { env } from "@/lib/env";

export const site = {
  name: flags.appName,
  title: `${flags.appName} workspace`,
  description: "Sign in to manage your account, workspace, and projects.",
  shortDescription: "Your account and workspace.",
  url: env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""),
  language: "en",
  category: "web application",
  contactPath: "/privacy",
} as const;

const routeCatalog = [
  {
    path: "/",
    title: flags.appName,
    description: "Sign in to manage your account, workspace, and projects.",
    markdown: "/page.md",
    schema: "/schema/home.json",
    priority: 1,
  },
  {
    path: "/pricing",
    title: "Pricing",
    description:
      "Compare free and paid starter plans, including per-seat team billing.",
    markdown: "/pricing.md",
    schema: "/schema/pricing.json",
    priority: 0.8,
  },
  {
    path: "/privacy",
    title: "Privacy",
    description:
      "How this application handles account, organization, billing, and product data.",
    markdown: null,
    schema: null,
    priority: 0.6,
  },
] as const;

export const publicRoutes = flags.seo
  ? routeCatalog.filter((route) => route.path !== "/pricing" || flags.billing)
  : [];

export const privateCrawlPaths = [
  "/accept-invitation",
  "/admin",
  "/api",
  "/dashboard",
  "/forgot-password",
  "/login",
  "/maintenance",
  "/onboarding",
  "/reset-password",
  "/settings",
  "/signup",
  "/two-factor",
  "/verify-email",
] as const;

export const aiCrawlerAgents = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
] as const;

export const discoveryResources = [
  { path: "/llms.txt", title: "LLM-facing site index", type: "text/plain" },
  { path: "/llms-full.txt", title: "Expanded LLM index", type: "text/plain" },
  { path: "/sitemap.xml", title: "Primary sitemap", type: "application/xml" },
  {
    path: "/sitemap-index.xml",
    title: "Sitemap index",
    type: "application/xml",
  },
  {
    path: "/media-sitemap.xml",
    title: "Media sitemap",
    type: "application/xml",
  },
  { path: "/feed.xml", title: "RSS feed", type: "application/rss+xml" },
  { path: "/feed.json", title: "JSON Feed", type: "application/feed+json" },
  { path: "/schemamap.xml", title: "Schema map", type: "application/xml" },
  {
    path: "/.well-known/security.txt",
    title: "Security contact",
    type: "text/plain",
  },
  {
    path: "/.well-known/api-catalog",
    title: "API catalog",
    type: "application/linkset+json",
  },
  {
    path: "/.well-known/agent-card.json",
    title: "Agent card",
    type: "application/json",
  },
  {
    path: "/.well-known/agent-skills.json",
    title: "Agent skills",
    type: "application/json",
  },
  {
    path: "/ask",
    title: "NLWeb-style discovery endpoint",
    type: "application/json",
  },
] as const;

const apiCatalog = [
  {
    href: "/api/auth",
    type: "application/json",
    title: "Authentication API add-on",
    description: "Better Auth endpoint family for account and session flows.",
  },
  {
    href: "/api/chat",
    type: "text/event-stream",
    title: "AI chat API add-on",
    description: "Streaming chat endpoint backed by the configured AI gateway.",
  },
  {
    href: "/api/ai/object",
    type: "application/json",
    title: "Structured AI generation API",
    description: "Example endpoint for structured object generation.",
  },
] as const;

export const publicApiResources = apiCatalog.filter(
  (resource) =>
    resource.href === "/api/auth" ||
    (resource.href === "/api/chat" && flags.aiChat) ||
    (resource.href === "/api/ai/object" && flags.aiStructured),
);

export const agentSkills = [
  {
    id: "starter-discovery",
    name: `${site.name} discovery`,
    description: `Use ${site.name} public resources to understand routes, feeds, structured data, and Markdown sources.`,
    entrypoint: "/llms.txt",
    tags: ["sitemap", "llms", "schema"],
    examples: ["List the public routes.", "Fetch the pricing Markdown source."],
  },
] as const;

export const discoveryCacheControl =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export function absoluteUrl(path = "/"): string {
  if (path === "/") return site.url;
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

function discoveryResponseInit(
  defaults: Record<string, string>,
  init?: ResponseInit,
): ResponseInit {
  const headers = new Headers({
    "Cache-Control": discoveryCacheControl,
    ...defaults,
  });
  new Headers(init?.headers).forEach((value, key) => {
    headers.set(key, value);
  });

  return { ...init, headers };
}

export function discoveryResponse(
  body: BodyInit | null,
  contentType: string,
  init?: ResponseInit,
): Response {
  return new Response(
    body,
    discoveryResponseInit({ "Content-Type": contentType }, init),
  );
}

export function discoveryJson(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, discoveryResponseInit({}, init));
}

export function text(body: string, init?: ResponseInit): Response {
  return discoveryResponse(
    body.endsWith("\n") ? body : `${body}\n`,
    "text/plain; charset=utf-8",
    init,
  );
}

export function plainText(lines: string[], init?: ResponseInit): Response {
  return text(lines.join("\n"), init);
}

export function markdown(body: string, init?: ResponseInit): Response {
  return discoveryResponse(
    body.endsWith("\n") ? body : `${body}\n`,
    "text/markdown; charset=utf-8",
    init,
  );
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function planPriceLabel(cents: number, perSeat: boolean): string {
  if (cents === 0) return "$0";
  return `$${(cents / 100).toFixed(0)}${perSeat ? " per seat" : ""} per month`;
}

export function generateLlmsTxt(): string {
  return `# ${site.name}

> ${site.shortDescription}

## Core pages

${publicRoutes
  .map((route) => `- [${route.title}](${route.path}): ${route.description}`)
  .join("\n")}

## Machine-readable resources

${discoveryResources
  .map(
    (resource) => `- [${resource.title}](${resource.path}): ${resource.type}`,
  )
  .join("\n")}

## Private application areas

${privateCrawlPaths.join(", ")} require application context or authentication and should not be crawled.
`;
}

type PublicPlan = {
  label: string;
  description: string;
  monthlyPriceCents: number;
  perSeat: boolean;
};

export function generateLlmsFullTxt(plans: readonly PublicPlan[]): string {
  const enabledFeatures = [
    "configurable integrations",
    "Better Auth for email/password sessions",
    flags.oauth.google ? "Google OAuth" : null,
    flags.oauth.github ? "GitHub OAuth" : null,
    flags.twoFactor ? "two-factor authentication" : null,
    flags.passkeys ? "passkeys" : null,
    flags.magicLink ? "magic links" : null,
    "Postgres and Drizzle for typed data access",
    flags.billing ? "Stripe billing and customer portal flows" : null,
    flags.tenancyMulti ? "organizations, roles, and invitations" : null,
    flags.ai ? "AI chat and structured generation examples" : null,
    flags.email ? "React Email and Resend transactional templates" : null,
    flags.rateLimit ? "Upstash-backed rate limiting" : null,
  ].filter(Boolean);

  return `# ${site.name}

${site.name} provides an account and workspace. Integrations require configuration by the application owner.

## Home

The application includes these configured capabilities:

${enabledFeatures.map((feature) => `- ${feature}.`).join("\n")}

## Pricing

Example plans are listed below when billing is enabled. The owner must replace these examples before selling subscriptions:

${plans
  .map(
    (plan) =>
      `- ${plan.label}: ${plan.description} ${planPriceLabel(plan.monthlyPriceCents, plan.perSeat)}.`,
  )
  .join("\n")}

## Privacy

The privacy page is a draft. The owner must supply their data practices and contact details before launch.

## Discovery

The site exposes ${discoveryResources.map((resource) => resource.path).join(", ")}.
`;
}
