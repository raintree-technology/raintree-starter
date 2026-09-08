export type AddonId =
  | "seo"
  | "accessibility"
  | "security"
  | "performance"
  | "privacy"
  | "resilience"
  | "agent-readiness"
  | "i18n"
  | "neon"
  | "better-auth"
  | "audit"
  | "oauth"
  | "passkeys"
  | "stripe"
  | "resend"
  | "upstash"
  | "ai";

type AddonCategory =
  | "website-spec"
  | "data"
  | "auth"
  | "platform"
  | "billing"
  | "communication"
  | "ai";

type EnvVar = {
  name: string;
  required: boolean;
  description: string;
  example?: string;
};

export type AddonDefinition = {
  id: AddonId;
  label: string;
  category: AddonCategory;
  summary: string;
  dependencies: AddonId[];
  env: EnvVar[];
  files: string[];
  websiteSpec: string[];
  enabledByDefault: boolean;
};

export type WebsiteSpecCategory = {
  id: string;
  label: string;
  summary: string;
  scaffoldDefault: boolean;
};

export const WEBSITE_SPEC_SOURCE = "https://specification.website/checklist";

export const WEBSITE_SPEC_CATEGORIES: WebsiteSpecCategory[] = [
  {
    id: "foundations",
    label: "Foundations",
    summary:
      "HTML, language, metadata, icons, color scheme, and document basics.",
    scaffoldDefault: true,
  },
  {
    id: "seo",
    label: "SEO",
    summary:
      "Robots policy, canonical URLs, sitemaps, SSR content, headings, links, and JSON-LD.",
    scaffoldDefault: true,
  },
  {
    id: "accessibility",
    label: "Accessibility",
    summary:
      "Skip links, landmarks, labels, keyboard access, focus states, contrast, and reduced motion.",
    scaffoldDefault: true,
  },
  {
    id: "security",
    label: "Security",
    summary:
      "HTTPS posture, CSP, HSTS, clickjacking protection, permissions policy, and security.txt.",
    scaffoldDefault: true,
  },
  {
    id: "well-known",
    label: "Well-Known URIs",
    summary:
      "Standardized discovery paths under /.well-known for security, APIs, agents, and account flows.",
    scaffoldDefault: true,
  },
  {
    id: "agent-readiness",
    label: "Agent Readiness",
    summary:
      "llms.txt, Markdown sources, Link headers, API catalogs, agent cards, and public/private boundaries.",
    scaffoldDefault: true,
  },
  {
    id: "performance",
    label: "Performance",
    summary:
      "Cache headers, stable layouts, resource discovery, reduced JavaScript dependence, and web vitals defaults.",
    scaffoldDefault: true,
  },
  {
    id: "privacy",
    label: "Privacy",
    summary:
      "Privacy policy, cookie posture, third-party script boundaries, GPC awareness, and data minimization.",
    scaffoldDefault: true,
  },
  {
    id: "resilience",
    label: "Resilience",
    summary:
      "Real error statuses, maintenance/offline states, graceful degradation, and app manifest support.",
    scaffoldDefault: true,
  },
  {
    id: "internationalisation",
    label: "Internationalisation",
    summary:
      "BCP 47 language tags, locale-ready metadata, hreflang hooks, and locale-aware formatting.",
    scaffoldDefault: false,
  },
];

export const ADDONS: AddonDefinition[] = [
  {
    id: "seo",
    label: "SEO and Discovery",
    category: "website-spec",
    summary:
      "Metadata, canonicals, robots.txt, XML sitemaps, JSON-LD, Markdown page sources, and feed discovery.",
    dependencies: [],
    env: [],
    files: [
      "app/robots.ts",
      "app/sitemap.ts",
      "app/sitemap-index.xml/route.ts",
      "app/media-sitemap.xml/route.ts",
      "app/feed.xml/route.ts",
      "app/feed.json/route.ts",
      "app/schema/**",
      "app/**/page.md/route.ts",
      "lib/discovery.ts",
    ],
    websiteSpec: ["foundations", "seo", "performance"],
    enabledByDefault: true,
  },
  {
    id: "accessibility",
    label: "Accessibility Baseline",
    category: "website-spec",
    summary:
      "Skip link, semantic landmarks, visible focus states, reduced-motion defaults, and native controls.",
    dependencies: [],
    env: [],
    files: ["app/layout.tsx", "app/globals.css", "components/ui/**"],
    websiteSpec: ["accessibility", "foundations"],
    enabledByDefault: true,
  },
  {
    id: "security",
    label: "Security Headers",
    category: "website-spec",
    summary:
      "CSP, HSTS, frame blocking, nosniff, referrer policy, permissions policy, and security.txt.",
    dependencies: [],
    env: [],
    files: [
      "next.config.ts",
      "app/security.txt/route.ts",
      "app/.well-known/security.txt/route.ts",
      "app/api/health/route.ts",
      "app/api/ready/route.ts",
      "lib/request-context.ts",
      "lib/readiness.ts",
      "scripts/check-architecture.mjs",
      "tests/request-context.test.ts",
      "tests/readiness.test.ts",
    ],
    websiteSpec: ["security", "well-known"],
    enabledByDefault: true,
  },
  {
    id: "performance",
    label: "Performance Defaults",
    category: "website-spec",
    summary:
      "Static asset caching, No-Vary-Search, dynamic viewport units, font-display defaults, and speculation hooks.",
    dependencies: [],
    env: [],
    files: ["next.config.ts", "app/globals.css", "app/manifest.ts"],
    websiteSpec: ["performance", "foundations"],
    enabledByDefault: true,
  },
  {
    id: "privacy",
    label: "Privacy Posture",
    category: "website-spec",
    summary:
      "Privacy and cookie documentation, no third-party scripts by default, and data-minimization guidance.",
    dependencies: [],
    env: [],
    files: ["app/(marketing)/privacy/page.tsx", "docs/legal/**"],
    websiteSpec: ["privacy", "security"],
    enabledByDefault: true,
  },
  {
    id: "resilience",
    label: "Resilience",
    category: "website-spec",
    summary:
      "Custom 404/500 handling, maintenance page, offline fallback, service worker registration, and manifest.",
    dependencies: [],
    env: [],
    files: [
      "app/not-found.tsx",
      "app/error.tsx",
      "app/global-error.tsx",
      "app/(app)/error.tsx",
      "app/maintenance/page.tsx",
      "components/error-page.tsx",
      "lib/error-pages.ts",
      "public/404.html",
      "public/500.html",
      "public/offline.html",
      "public/sw.js",
    ],
    websiteSpec: ["resilience", "performance"],
    enabledByDefault: true,
  },
  {
    id: "agent-readiness",
    label: "Agent Readiness",
    category: "website-spec",
    summary:
      "llms.txt, llms-full.txt, API catalog, agent card, agent skills, schemamap, and NLWeb-style discovery.",
    dependencies: ["seo"],
    env: [],
    files: [
      "app/llms.txt/route.ts",
      "app/llms-full.txt/route.ts",
      "app/.well-known/api-catalog/route.ts",
      "app/.well-known/agent-card.json/route.ts",
      "app/.well-known/agent-skills.json/route.ts",
      "app/ask/route.ts",
      "app/schemamap.xml/route.ts",
    ],
    websiteSpec: ["agent-readiness", "well-known", "seo"],
    enabledByDefault: true,
  },
  {
    id: "i18n",
    label: "Internationalisation Hooks",
    category: "website-spec",
    summary:
      "Locale configuration shape, hreflang-ready discovery data, and BCP 47 language defaults.",
    dependencies: ["seo"],
    env: [],
    files: ["starter.config.ts", "lib/discovery.ts", "app/layout.tsx"],
    websiteSpec: ["internationalisation", "foundations", "seo"],
    enabledByDefault: false,
  },
  {
    id: "neon",
    label: "Neon Postgres and Drizzle",
    category: "data",
    summary:
      "Serverless Postgres driver, Drizzle schema, migrations, seed data, and typed data access helpers.",
    dependencies: [],
    env: [
      {
        name: "DATABASE_URL",
        required: true,
        description: "Neon pooled Postgres connection string.",
      },
      {
        name: "DIRECT_DATABASE_URL",
        required: false,
        description:
          "Migration-owner connection string; required for hosted deployments.",
      },
    ],
    files: [
      "db/**",
      "drizzle.config.ts",
      "lib/data/**",
      "lib/db/**",
      "lib/deployment-environment.ts",
      "tests/deployment-environment.test.ts",
      "scripts/probe-cross-tenant-rls.ts",
    ],
    websiteSpec: ["security", "privacy", "resilience"],
    enabledByDefault: false,
  },
  {
    id: "better-auth",
    label: "Better Auth",
    category: "auth",
    summary:
      "Email/password auth, verification, reset, sessions, admin plugin, organizations, and secure account flows.",
    dependencies: ["neon"],
    env: [
      {
        name: "BETTER_AUTH_SECRET",
        required: true,
        description: "32-byte secret for Better Auth session signing.",
        example: "openssl rand -base64 32",
      },
      {
        name: "AUTH_DATABASE_URL",
        required: false,
        description:
          "Dedicated Better Auth database role; required for hosted deployments.",
      },
      {
        name: "BETTER_AUTH_URL",
        required: false,
        description: "Public auth base URL. Defaults to NEXT_PUBLIC_APP_URL.",
        example: "http://localhost:3450",
      },
    ],
    files: [
      "lib/auth.ts",
      "lib/auth/**",
      "lib/auth-client.ts",
      "app/api/auth/[...all]/route.ts",
      "app/(auth)/**",
      "components/auth/**",
    ],
    websiteSpec: ["accessibility", "security", "privacy", "well-known"],
    enabledByDefault: false,
  },
  {
    id: "audit",
    label: "Authorization Audit Events",
    category: "platform",
    summary:
      "Structured authorization decisions with actor, tenant, resource, result, and replaceable sink contracts.",
    dependencies: ["better-auth"],
    env: [],
    files: [
      "lib/auth-audit.ts",
      "lib/audit.ts",
      "lib/db/runtime-role.ts",
      "scripts/check-database-role.ts",
      "db/migrations/0003_audit_events.sql",
      "tests/auth-audit.test.ts",
      "tests/durable-audit.test.ts",
      "tests/runtime-role.test.ts",
    ],
    websiteSpec: ["security", "privacy"],
    enabledByDefault: false,
  },
  {
    id: "oauth",
    label: "Google and GitHub OAuth",
    category: "auth",
    summary:
      "Optional OAuth providers wired through Better Auth with trusted account linking.",
    dependencies: ["better-auth"],
    env: [
      {
        name: "GOOGLE_CLIENT_ID",
        required: false,
        description: "Google OAuth client id.",
      },
      {
        name: "GOOGLE_CLIENT_SECRET",
        required: false,
        description: "Google OAuth client secret.",
      },
      {
        name: "GITHUB_CLIENT_ID",
        required: false,
        description: "GitHub OAuth client id.",
      },
      {
        name: "GITHUB_CLIENT_SECRET",
        required: false,
        description: "GitHub OAuth client secret.",
      },
    ],
    files: ["components/auth/oauth-buttons.tsx", "lib/auth.ts"],
    websiteSpec: ["accessibility", "security", "privacy"],
    enabledByDefault: false,
  },
  {
    id: "passkeys",
    label: "Passkeys",
    category: "auth",
    summary: "WebAuthn passkeys through Better Auth with passkey settings UI.",
    dependencies: ["better-auth"],
    env: [],
    files: ["components/settings/passkeys.tsx", "lib/auth.ts"],
    websiteSpec: ["accessibility", "security", "well-known"],
    enabledByDefault: false,
  },
  {
    id: "stripe",
    label: "Stripe Billing",
    category: "billing",
    summary:
      "Subscriptions, customer portal, per-seat team billing, webhook contract tests, and pricing UI.",
    dependencies: ["better-auth"],
    env: [
      {
        name: "STRIPE_SECRET_KEY",
        required: true,
        description: "Stripe restricted or secret API key.",
      },
      {
        name: "STRIPE_WEBHOOK_SECRET",
        required: true,
        description: "Webhook signing secret for /api/auth/stripe/webhook.",
      },
      {
        name: "STRIPE_PRICE_PRO_MONTHLY",
        required: false,
        description: "Monthly Pro price id.",
      },
      {
        name: "STRIPE_PRICE_PRO_YEARLY",
        required: false,
        description: "Yearly Pro price id.",
      },
      {
        name: "STRIPE_PRICE_TEAM_MONTHLY",
        required: false,
        description: "Monthly Team price id.",
      },
      {
        name: "STRIPE_PRICE_TEAM_YEARLY",
        required: false,
        description: "Yearly Team price id.",
      },
    ],
    files: [
      "lib/billing/**",
      "lib/stripe.ts",
      "components/settings/billing-panel.tsx",
      "app/(marketing)/pricing/**",
    ],
    websiteSpec: ["privacy", "security", "accessibility"],
    enabledByDefault: false,
  },
  {
    id: "resend",
    label: "Resend Email",
    category: "communication",
    summary:
      "React Email templates for verification, reset, magic links, invites, and welcome messages.",
    dependencies: ["better-auth"],
    env: [
      {
        name: "RESEND_API_KEY",
        required: false,
        description: "Resend API key. Missing keys log emails in development.",
      },
      {
        name: "EMAIL_FROM",
        required: false,
        description: "Transactional sender address.",
        example: "Acme <onboarding@resend.dev>",
      },
    ],
    files: ["emails/**", "lib/email.tsx"],
    websiteSpec: ["privacy", "accessibility", "resilience"],
    enabledByDefault: false,
  },
  {
    id: "upstash",
    label: "Upstash Rate Limiting",
    category: "data",
    summary:
      "Redis-backed rate limits for public and auth-adjacent routes, with graceful disabled mode.",
    dependencies: [],
    env: [
      {
        name: "UPSTASH_REDIS_REST_URL",
        required: false,
        description: "Upstash Redis REST URL.",
      },
      {
        name: "UPSTASH_REDIS_REST_TOKEN",
        required: false,
        description: "Upstash Redis REST token.",
      },
      {
        name: "UPSTASH_RATELIMIT_ANALYTICS",
        required: false,
        description: "Set to 1 to store Upstash rate-limit analytics.",
      },
      {
        name: "UPSTASH_RATELIMIT_PROTECTION",
        required: false,
        description:
          "Set to 1 to enable Upstash deny-list protection for identifiers and IPs.",
      },
    ],
    files: ["lib/rate-limit.ts", "proxy.ts"],
    websiteSpec: ["security", "resilience", "performance"],
    enabledByDefault: false,
  },
  {
    id: "ai",
    label: "AI SDK and Gateway",
    category: "ai",
    summary:
      "Streaming chat, structured object generation, AI Gateway model routing, and persisted chat history.",
    dependencies: ["neon"],
    env: [
      {
        name: "AI_GATEWAY_API_KEY",
        required: false,
        description: "Vercel AI Gateway key.",
      },
      {
        name: "AI_MODEL",
        required: false,
        description: "Gateway model id.",
        example: "openai/gpt-5-mini",
      },
    ],
    files: [
      "lib/ai.ts",
      "lib/ai-schema.ts",
      "app/api/chat/route.ts",
      "app/api/ai/object/route.ts",
      "components/ai/**",
    ],
    websiteSpec: ["agent-readiness", "privacy", "security"],
    enabledByDefault: false,
  },
];

export const DEFAULT_ADDON_IDS = ADDONS.filter(
  (addon) => addon.enabledByDefault,
).map((addon) => addon.id);

export const FULL_STACK_ADDON_IDS = ADDONS.map((addon) => addon.id);

export function getAddon(id: AddonId): AddonDefinition {
  const addon = ADDONS.find((candidate) => candidate.id === id);
  if (!addon) {
    throw new Error(`Unknown add-on: ${id}`);
  }
  return addon;
}
