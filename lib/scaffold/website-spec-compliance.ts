import { WEBSITE_SPEC_SOURCE } from "./addons";
import {
  WEBSITE_SPEC_CHECKLIST,
  WEBSITE_SPEC_ITEM_COUNT,
  type WebsiteSpecChecklistItem,
} from "./website-spec";

type WebsiteSpecApplicability =
  | "default"
  | "opt-in"
  | "project-specific"
  | "deployment"
  | "not-applicable";

type WebsiteSpecStatus =
  | "implemented"
  | "partially-implemented"
  | "documented"
  | "not-applicable";

type WebsiteSpecEvidence = {
  files: string[];
  routes: string[];
  headers: string[];
  tests: string[];
  docs: string[];
  commands: string[];
};

export type WebsiteSpecComplianceItem = WebsiteSpecChecklistItem & {
  id: string;
  source: string;
  applicability: WebsiteSpecApplicability;
  status: WebsiteSpecStatus;
  evidence: WebsiteSpecEvidence;
  notes: string;
};

type ComplianceDefaults = {
  applicability: WebsiteSpecApplicability;
  status: WebsiteSpecStatus;
  evidence: Partial<WebsiteSpecEvidence>;
  notes: string;
};

type ComplianceOverride = Partial<Omit<ComplianceDefaults, "evidence">> & {
  evidence?: Partial<WebsiteSpecEvidence>;
};

const emptyEvidence: WebsiteSpecEvidence = {
  files: [],
  routes: [],
  headers: [],
  tests: [],
  docs: [],
  commands: [],
};

const sharedEvidence: Partial<WebsiteSpecEvidence> = {
  files: [
    "lib/scaffold/website-spec.ts",
    "lib/scaffold/website-spec-compliance.ts",
  ],
  routes: ["/website-spec.json", "/website-spec.md"],
  tests: ["tests/website-spec.test.ts"],
  docs: ["docs/website-spec-compliance.md"],
};

const websiteSpecItemSources: Record<string, string> = {
  "Foundations:The HTML doctype":
    "https://specification.website/spec/foundations/doctype/",
  "Foundations:The lang attribute on <html>":
    "https://specification.website/spec/foundations/html-lang/",
  "Foundations:<meta charset>":
    "https://specification.website/spec/foundations/meta-charset/",
  "Foundations:<meta viewport>":
    "https://specification.website/spec/foundations/meta-viewport/",
  "Foundations:The <title> element":
    "https://specification.website/spec/foundations/title/",
  'Foundations:<meta name="description">':
    "https://specification.website/spec/foundations/meta-description/",
  'Foundations:Canonical URL (rel="canonical")':
    "https://specification.website/spec/foundations/canonical-url/",
  "Foundations:Favicons and app icons":
    "https://specification.website/spec/foundations/favicons/",
  'Foundations:<meta name="theme-color">':
    "https://specification.website/spec/foundations/theme-color/",
  'Foundations:<meta name="color-scheme">':
    "https://specification.website/spec/foundations/color-scheme/",
  "Foundations:Open Graph protocol":
    "https://specification.website/spec/foundations/open-graph/",
  'Foundations:Feed discovery with rel="alternate"':
    "https://specification.website/spec/foundations/feed-discovery/",
  "Foundations:Feed content hygiene":
    "https://specification.website/spec/foundations/feed-hygiene/",
  "Foundations:Popover API":
    "https://specification.website/spec/foundations/popover-api/",
  "Foundations:CSS anchor positioning":
    "https://specification.website/spec/foundations/anchor-positioning/",
  "Foundations:Balanced text wrapping":
    "https://specification.website/spec/foundations/text-wrap/",
  "Foundations:CSS container queries":
    "https://specification.website/spec/foundations/container-queries/",
  "Foundations:Invoker commands":
    "https://specification.website/spec/foundations/invoker-commands/",
  "SEO:robots.txt": "https://specification.website/spec/seo/robots-txt/",
  "SEO:XML sitemaps": "https://specification.website/spec/seo/xml-sitemaps/",
  "SEO:Sitemap index files":
    "https://specification.website/spec/seo/sitemap-index/",
  "SEO:Image and video sitemap extensions":
    "https://specification.website/spec/seo/image-sitemaps/",
  "SEO:URL structure": "https://specification.website/spec/seo/url-structure/",
  "SEO:Redirects (301/302/308)":
    "https://specification.website/spec/seo/redirects/",
  "SEO:Server-side rendering":
    "https://specification.website/spec/seo/server-side-rendering/",
  "SEO:Soft 404s": "https://specification.website/spec/seo/soft-404/",
  "SEO:Meta robots and X-Robots-Tag":
    "https://specification.website/spec/seo/meta-robots/",
  "SEO:Heading hierarchy":
    "https://specification.website/spec/seo/heading-hierarchy/",
  "SEO:Internal linking":
    "https://specification.website/spec/seo/internal-linking/",
  "SEO:Structured data (JSON-LD)":
    "https://specification.website/spec/seo/structured-data/",
  "SEO:Breadcrumbs": "https://specification.website/spec/seo/breadcrumbs/",
  "SEO:IndexNow": "https://specification.website/spec/seo/indexnow/",
  "Accessibility:Colour contrast":
    "https://specification.website/spec/accessibility/color-contrast/",
  "Accessibility:Automatic contrasting colour":
    "https://specification.website/spec/accessibility/contrast-color/",
  "Accessibility:Forced colours mode":
    "https://specification.website/spec/accessibility/forced-colors/",
  "Accessibility:Image alt text":
    "https://specification.website/spec/accessibility/image-alt-text/",
  "Accessibility:Form labels":
    "https://specification.website/spec/accessibility/form-labels/",
  "Accessibility:Keyboard navigation":
    "https://specification.website/spec/accessibility/keyboard-navigation/",
  "Accessibility:Visible focus indicators":
    "https://specification.website/spec/accessibility/focus-indicators/",
  "Accessibility:Skip links":
    "https://specification.website/spec/accessibility/skip-links/",
  "Accessibility:The inert attribute":
    "https://specification.website/spec/accessibility/inert-attribute/",
  "Accessibility:Semantic HTML and landmarks":
    "https://specification.website/spec/accessibility/semantic-html/",
  "Accessibility:ARIA - first rule of ARIA":
    "https://specification.website/spec/accessibility/aria-usage/",
  "Accessibility:Descriptive link text":
    "https://specification.website/spec/accessibility/link-text/",
  "Accessibility:Empty links and buttons":
    "https://specification.website/spec/accessibility/empty-links-buttons/",
  "Accessibility:Accessible form errors":
    "https://specification.website/spec/accessibility/form-errors/",
  "Accessibility:Accessible authentication":
    "https://specification.website/spec/accessibility/accessible-authentication/",
  "Accessibility:Redundant entry":
    "https://specification.website/spec/accessibility/redundant-entry/",
  "Accessibility:Consistent help":
    "https://specification.website/spec/accessibility/consistent-help/",
  "Accessibility:Document and parts language":
    "https://specification.website/spec/accessibility/document-language/",
  "Accessibility:Reduced motion":
    "https://specification.website/spec/accessibility/reduced-motion/",
  "Accessibility:Accessibility overlays":
    "https://specification.website/spec/accessibility/accessibility-overlays/",
  "Accessibility:Captions and transcripts":
    "https://specification.website/spec/accessibility/captions-and-transcripts/",
  "Accessibility:Accessible data tables":
    "https://specification.website/spec/accessibility/data-tables/",
  "Accessibility:Touch target size":
    "https://specification.website/spec/accessibility/touch-target-size/",
  "Accessibility:Dragging movements":
    "https://specification.website/spec/accessibility/dragging-movements/",
  "Accessibility:Hidden until found":
    "https://specification.website/spec/accessibility/hidden-until-found/",
  "Accessibility:Mobile-friendly form inputs":
    "https://specification.website/spec/accessibility/mobile-form-inputs/",
  "Accessibility:Native interactive elements":
    "https://specification.website/spec/accessibility/native-interactive-elements/",
  "Accessibility:CSS state and relational selectors":
    "https://specification.website/spec/accessibility/css-state-selectors/",
  "Security:HTTPS and TLS":
    "https://specification.website/spec/security/https-tls/",
  "Security:HSTS (Strict-Transport-Security)":
    "https://specification.website/spec/security/hsts/",
  "Security:Mixed content and upgrade-insecure-requests":
    "https://specification.website/spec/security/mixed-content/",
  "Security:Content Security Policy (CSP)":
    "https://specification.website/spec/security/content-security-policy/",
  "Security:Reporting API (Reporting-Endpoints)":
    "https://specification.website/spec/security/reporting-endpoints/",
  "Security:/.well-known/security.txt":
    "https://specification.website/spec/security/security-txt/",
  "Security:X-Content-Type-Options: nosniff":
    "https://specification.website/spec/security/x-content-type-options/",
  "Security:Clickjacking protection (frame-ancestors / X-Frame-Options)":
    "https://specification.website/spec/security/frame-ancestors/",
  "Security:Cross-origin isolation (COOP / COEP / CORP)":
    "https://specification.website/spec/security/cross-origin-isolation/",
  "Security:Referrer-Policy":
    "https://specification.website/spec/security/referrer-policy/",
  "Security:Permissions-Policy":
    "https://specification.website/spec/security/permissions-policy/",
  "Security:Subresource Integrity (SRI)":
    "https://specification.website/spec/security/subresource-integrity/",
  "Security:Digest Fields (Content-Digest and Repr-Digest)":
    "https://specification.website/spec/security/digest-fields/",
  "Security:Trusted Types":
    "https://specification.website/spec/security/trusted-types/",
  "Security:Cookie attributes - Secure, HttpOnly, SameSite":
    "https://specification.website/spec/security/cookie-attributes/",
  "Security:Clear-Site-Data":
    "https://specification.website/spec/security/clear-site-data/",
  "Security:DNS CAA records":
    "https://specification.website/spec/security/caa-records/",
  "Security:DNSSEC": "https://specification.website/spec/security/dnssec/",
  "Well-Known URIs:Well-known URIs":
    "https://specification.website/spec/well-known/well-known-overview/",
  "Well-Known URIs:/.well-known/change-password":
    "https://specification.website/spec/well-known/change-password/",
  "Well-Known URIs:/.well-known/webauthn":
    "https://specification.website/spec/well-known/webauthn/",
  "Well-Known URIs:/.well-known/openid-configuration":
    "https://specification.website/spec/well-known/openid-configuration/",
  "Well-Known URIs:/.well-known/oauth-authorization-server":
    "https://specification.website/spec/well-known/oauth-authorization-server/",
  "Well-Known URIs:/.well-known/oauth-protected-resource":
    "https://specification.website/spec/well-known/oauth-protected-resource/",
  "Well-Known URIs:/.well-known/api-catalog":
    "https://specification.website/spec/well-known/api-catalog/",
  "Well-Known URIs:/.well-known/webfinger":
    "https://specification.website/spec/well-known/webfinger/",
  "Well-Known URIs:/.well-known/apple-app-site-association":
    "https://specification.website/spec/well-known/apple-app-site-association/",
  "Well-Known URIs:/.well-known/assetlinks.json":
    "https://specification.website/spec/well-known/assetlinks-json/",
  "Well-Known URIs:/.well-known/nodeinfo":
    "https://specification.website/spec/well-known/nodeinfo/",
  "Well-Known URIs:/.well-known/traffic-advice":
    "https://specification.website/spec/well-known/traffic-advice/",
  "Agent Readiness:Agent readiness":
    "https://specification.website/spec/agent-readiness/agent-readiness-overview/",
  "Agent Readiness:/llms.txt":
    "https://specification.website/spec/agent-readiness/llms-txt/",
  "Agent Readiness:/llms-full.txt":
    "https://specification.website/spec/agent-readiness/llms-full-txt/",
  "Agent Readiness:Per-page Markdown source endpoints":
    "https://specification.website/spec/agent-readiness/markdown-source-endpoints/",
  "Agent Readiness:robots.txt for AI crawlers":
    "https://specification.website/spec/agent-readiness/robots-for-ai-crawlers/",
  "Agent Readiness:Content Signals in robots.txt":
    "https://specification.website/spec/agent-readiness/content-signals/",
  "Agent Readiness:Web Bot Auth - verifiable bot identity":
    "https://specification.website/spec/agent-readiness/web-bot-auth/",
  "Agent Readiness:Stable URLs":
    "https://specification.website/spec/agent-readiness/stable-urls/",
  "Agent Readiness:Structured data for agents":
    "https://specification.website/spec/agent-readiness/structured-data-for-agents/",
  "Agent Readiness:Machine-readable formats":
    "https://specification.website/spec/agent-readiness/machine-readable-formats/",
  "Agent Readiness:HTTP Link headers for discovery":
    "https://specification.website/spec/agent-readiness/link-headers/",
  "Agent Readiness:MCP and tool discovery":
    "https://specification.website/spec/agent-readiness/mcp-and-tool-discovery/",
  "Agent Readiness:A2A agent cards":
    "https://specification.website/spec/agent-readiness/a2a-agent-cards/",
  "Agent Readiness:Agent Skills discovery":
    "https://specification.website/spec/agent-readiness/agent-skills-discovery/",
  "Agent Readiness:DNS for AI Discovery (DNS-AID)":
    "https://specification.website/spec/agent-readiness/dns-aid/",
  "Agent Readiness:Agentic Resource Discovery (ARD)":
    "https://specification.website/spec/agent-readiness/agentic-resource-discovery/",
  "Agent Readiness:NLWeb - conversational interface discovery":
    "https://specification.website/spec/agent-readiness/nlweb/",
  "Agent Readiness:WebMCP - browser-native tools for agents":
    "https://specification.website/spec/agent-readiness/webmcp/",
  "Agent Readiness:Open Knowledge Format (OKF) bundle":
    "https://specification.website/spec/agent-readiness/okf-bundle/",
  "Agent Readiness:Schemamap - discoverable JSON-LD endpoints per resource":
    "https://specification.website/spec/agent-readiness/schemamap/",
  "Performance:Core Web Vitals (LCP, INP, CLS)":
    "https://specification.website/spec/performance/core-web-vitals/",
  "Performance:Image optimisation":
    "https://specification.website/spec/performance/image-optimization/",
  "Performance:Lazy loading images, iframes, and video":
    "https://specification.website/spec/performance/lazy-loading/",
  "Performance:Preload, prefetch, preconnect":
    "https://specification.website/spec/performance/preload-prefetch-preconnect/",
  "Performance:103 Early Hints":
    "https://specification.website/spec/performance/early-hints/",
  "Performance:Cache-Control headers":
    "https://specification.website/spec/performance/cache-control/",
  "Performance:Conditional requests (ETag, Last-Modified, 304)":
    "https://specification.website/spec/performance/conditional-requests/",
  "Performance:No-Vary-Search response header":
    "https://specification.website/spec/performance/no-vary-search/",
  "Performance:Compression (gzip, brotli, zstd)":
    "https://specification.website/spec/performance/compression/",
  "Performance:Web font loading":
    "https://specification.website/spec/performance/font-loading/",
  "Performance:Critical CSS and render-blocking resources":
    "https://specification.website/spec/performance/critical-css/",
  "Performance:Script loading - defer, async, module":
    "https://specification.website/spec/performance/script-loading/",
  "Performance:HTTP/2 and HTTP/3":
    "https://specification.website/spec/performance/http3/",
  "Performance:HTTP/1.1 workarounds: sharding, sprites, and bundling":
    "https://specification.website/spec/performance/http1-workarounds/",
  "Performance:Speculation Rules":
    "https://specification.website/spec/performance/speculation-rules/",
  "Performance:Resource hints overview":
    "https://specification.website/spec/performance/resource-hints/",
  "Performance:View Transitions":
    "https://specification.website/spec/performance/view-transitions/",
  "Performance:Back/forward cache (BFCache)":
    "https://specification.website/spec/performance/bfcache/",
  "Performance:Visibility-aware rendering":
    "https://specification.website/spec/performance/visibility-aware-rendering/",
  "Performance:CSS containment":
    "https://specification.website/spec/performance/css-containment/",
  "Performance:Scroll-driven animations":
    "https://specification.website/spec/performance/scroll-driven-animations/",
  "Performance:Scrollbar gutter":
    "https://specification.website/spec/performance/scrollbar-gutter/",
  "Performance:Dynamic viewport units (dvh, svh, lvh)":
    "https://specification.website/spec/performance/dynamic-viewport-units/",
  "Performance:Compression Dictionary Transport":
    "https://specification.website/spec/performance/compression-dictionary-transport/",
  "Performance:Server-Timing header":
    "https://specification.website/spec/performance/server-timing/",
  "Privacy:Privacy policy":
    "https://specification.website/spec/privacy/privacy-policy/",
  "Privacy:Cookie consent":
    "https://specification.website/spec/privacy/cookie-consent/",
  "Privacy:Global Privacy Control (GPC)":
    "https://specification.website/spec/privacy/global-privacy-control/",
  "Privacy:Third-party scripts and privacy":
    "https://specification.website/spec/privacy/third-party-scripts/",
  "Privacy:Storage Access API":
    "https://specification.website/spec/privacy/storage-access-api/",
  "Privacy:Privacy-respecting analytics":
    "https://specification.website/spec/privacy/analytics-privacy/",
  "Privacy:Data minimisation":
    "https://specification.website/spec/privacy/data-minimization/",
  "Resilience:Custom error pages (404, 500)":
    "https://specification.website/spec/resilience/error-pages/",
  "Resilience:Maintenance pages and 503":
    "https://specification.website/spec/resilience/maintenance-pages/",
  "Resilience:Graceful degradation when JavaScript fails":
    "https://specification.website/spec/resilience/graceful-degradation/",
  "Resilience:Offline support and service workers":
    "https://specification.website/spec/resilience/offline-support/",
  "Resilience:Web app manifest":
    "https://specification.website/spec/resilience/pwa-manifest/",
  "Resilience:Monitoring and uptime":
    "https://specification.website/spec/resilience/monitoring-uptime/",
  "Resilience:Deprecation and Sunset":
    "https://specification.website/spec/resilience/deprecation-and-sunset/",
  "Internationalisation:International URL structure":
    "https://specification.website/spec/i18n/international-url-structure/",
  "Internationalisation:hreflang for language and regional URLs":
    "https://specification.website/spec/i18n/hreflang/",
  "Internationalisation:Localised page metadata":
    "https://specification.website/spec/i18n/localised-metadata/",
  "Internationalisation:hreflang in XML sitemaps":
    "https://specification.website/spec/i18n/sitemap-hreflang/",
  "Internationalisation:Avoid automatic IP-based language redirects":
    "https://specification.website/spec/i18n/avoid-auto-geo-redirects/",
  "Internationalisation:lang attribute on inline content":
    "https://specification.website/spec/i18n/lang-attribute/",
  "Internationalisation:translate attribute for untranslatable content":
    "https://specification.website/spec/i18n/translate-attribute/",
  "Internationalisation:Language switcher":
    "https://specification.website/spec/i18n/language-switcher/",
  "Internationalisation:RTL and bidirectional text":
    "https://specification.website/spec/i18n/rtl-support/",
  "Internationalisation:Writing modes and CJK line breaking":
    "https://specification.website/spec/i18n/writing-modes/",
  "Internationalisation:Locale-aware content":
    "https://specification.website/spec/i18n/locale-content/",
  "Internationalisation:Plural rules and grammatical number":
    "https://specification.website/spec/i18n/plural-rules/",
  "Internationalisation:Internationalised Domain Names (IDN)":
    "https://specification.website/spec/i18n/idn-support/",
};

const categoryDefaults: Record<string, ComplianceDefaults> = {
  Foundations: {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: ["app/layout.tsx", "app/manifest.ts", "app/globals.css"],
      routes: ["/", "/manifest.webmanifest", "/feed.xml", "/feed.json"],
    },
    notes:
      "The App Router, Metadata API, root layout, manifest, and global CSS provide the default document baseline.",
  },
  SEO: {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: [
        "app/robots.ts",
        "app/sitemap.ts",
        "app/sitemap-index.xml/route.ts",
        "lib/discovery.ts",
      ],
      routes: [
        "/robots.txt",
        "/sitemap.xml",
        "/sitemap-index.xml",
        "/schema/home.json",
        "/schema/pricing.json",
      ],
    },
    notes:
      "Public routes are server-rendered and listed from the discovery registry.",
  },
  Accessibility: {
    applicability: "default",
    status: "partially-implemented",
    evidence: {
      files: ["app/layout.tsx", "app/globals.css", "components/ui"],
      routes: ["/"],
    },
    notes:
      "The scaffold ships accessible primitives and layout patterns; generated project content must keep using them correctly.",
  },
  Security: {
    applicability: "default",
    status: "partially-implemented",
    evidence: {
      files: ["next.config.ts", "proxy.ts", "app/api/reports/route.ts"],
      headers: [
        "Content-Security-Policy",
        "Strict-Transport-Security",
        "X-Content-Type-Options",
      ],
      routes: ["/.well-known/security.txt", "/api/reports"],
    },
    notes:
      "Source-level headers are included; transport, DNS, and CDN behavior must be checked after deployment.",
  },
  "Well-Known URIs": {
    applicability: "opt-in",
    status: "documented",
    evidence: {
      files: ["app/.well-known", "lib/discovery.ts"],
      routes: ["/.well-known/security.txt", "/.well-known/api-catalog"],
    },
    notes:
      "The scaffold emits safe well-known resources and keeps identity, app-linking, and federation metadata opt-in.",
  },
  "Agent Readiness": {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: [
        "lib/discovery.ts",
        "app/llms.txt/route.ts",
        "app/llms-full.txt/route.ts",
      ],
      routes: [
        "/llms.txt",
        "/llms-full.txt",
        "/ask",
        "/.well-known/agent-card.json",
        "/.well-known/agent-skills.json",
      ],
      headers: ["Link"],
    },
    notes: "Agent-facing resources are generated from the discovery registry.",
  },
  Performance: {
    applicability: "default",
    status: "partially-implemented",
    evidence: {
      files: ["next.config.ts", "app/globals.css", "app/layout.tsx"],
      headers: ["Cache-Control", "No-Vary-Search", "Link"],
    },
    notes:
      "The scaffold includes source-level performance defaults; real Web Vitals, compression, and protocol behavior need deployment measurement.",
  },
  Privacy: {
    applicability: "default",
    status: "partially-implemented",
    evidence: {
      files: ["app/(marketing)/privacy/page.tsx", "lib/env.ts"],
      routes: ["/privacy"],
      docs: ["docs/legal/cookies.md"],
    },
    notes:
      "No analytics or third-party tracking runs by default; project-specific data collection must update the policy and consent posture.",
  },
  Resilience: {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: [
        "app/not-found.tsx",
        "app/error.tsx",
        "app/global-error.tsx",
        "app/(app)/error.tsx",
        "components/error-page.tsx",
        "lib/error-pages.ts",
        "public/404.html",
        "public/500.html",
        "proxy.ts",
        "public/sw.js",
        "public/offline.html",
      ],
      routes: [
        "/404.html",
        "/500.html",
        "/maintenance",
        "/offline.html",
        "/manifest.webmanifest",
      ],
    },
    notes:
      "Status-correct 404 conventions, scoped 500 fallbacks, static host-level error fallbacks, maintenance, offline, and manifest defaults are present.",
  },
  Internationalisation: {
    applicability: "project-specific",
    status: "documented",
    evidence: {
      files: ["app/layout.tsx", "lib/discovery.ts", "starter.config.ts"],
      docs: ["docs/website-spec-compliance.md"],
    },
    notes:
      "The default project is English-only; multilingual routing, translations, and locale formatting are enabled per generated product.",
  },
};

const overrides: Record<string, ComplianceOverride> = {
  "Foundations:The HTML doctype": {
    evidence: { files: ["app/layout.tsx"], routes: ["/"] },
    notes:
      "Next.js emits the standards-mode doctype for App Router HTML documents.",
  },
  "Foundations:The lang attribute on <html>": {
    evidence: { files: ["app/layout.tsx"], routes: ["/"] },
    notes: "The root layout sets html lang to the configured default language.",
  },
  "Foundations:<meta charset>": {
    evidence: { files: ["app/layout.tsx"], routes: ["/"] },
    notes: "Next.js emits UTF-8 metadata for App Router pages.",
  },
  "Foundations:<meta viewport>": {
    evidence: { files: ["app/layout.tsx"], routes: ["/"] },
    notes:
      "The exported viewport config sets device-width and initial-scale without disabling zoom.",
  },
  "Foundations:The <title> element": {
    evidence: {
      files: ["app/layout.tsx", "app/(marketing)/page.tsx"],
      routes: ["/"],
    },
  },
  'Foundations:<meta name="description">': {
    evidence: {
      files: ["app/layout.tsx", "app/(marketing)/page.tsx"],
      routes: ["/"],
    },
  },
  'Foundations:Canonical URL (rel="canonical")': {
    evidence: {
      files: ["app/layout.tsx", "app/(marketing)/page.tsx"],
      routes: ["/"],
    },
  },
  "Foundations:Favicons and app icons": {
    evidence: {
      files: [
        "app/favicon.ico",
        "app/icon.svg",
        "app/apple-icon.png",
        "public/web-app-manifest-192x192.png",
      ],
      routes: [
        "/favicon.ico",
        "/icon.svg",
        "/apple-icon.png",
        "/manifest.webmanifest",
      ],
    },
  },
  'Foundations:<meta name="theme-color">': {
    evidence: {
      files: ["app/layout.tsx", "app/manifest.ts"],
      routes: ["/manifest.webmanifest"],
    },
  },
  'Foundations:<meta name="color-scheme">': {
    evidence: { files: ["app/layout.tsx", "app/globals.css"] },
  },
  "Foundations:Open Graph protocol": {
    evidence: {
      files: ["app/layout.tsx", "app/opengraph-image.tsx"],
      routes: ["/opengraph-image"],
    },
  },
  'Foundations:Feed discovery with rel="alternate"': {
    evidence: {
      files: [
        "app/layout.tsx",
        "app/feed.xml/route.ts",
        "app/feed.json/route.ts",
      ],
      routes: ["/feed.xml", "/feed.json"],
    },
  },
  "Foundations:Feed content hygiene": {
    evidence: {
      files: ["app/feed.xml/route.ts", "app/feed.json/route.ts"],
      routes: ["/feed.xml", "/feed.json"],
    },
  },
  "Foundations:Popover API": {
    applicability: "opt-in",
    status: "documented",
    notes:
      "Radix primitives are used for current menus/dialogs; native popover is documented as the preferred primitive when browser support and UI needs fit.",
  },
  "Foundations:CSS anchor positioning": {
    applicability: "opt-in",
    status: "documented",
    notes:
      "No default floating UI currently needs CSS anchor positioning; it is kept as a project-specific enhancement.",
  },
  "Foundations:CSS container queries": {
    status: "partially-implemented",
    evidence: { files: ["app/globals.css"] },
    notes:
      "The CSS baseline exposes container-query-friendly utilities; actual component queries are project-specific.",
  },
  "Foundations:Invoker commands": {
    applicability: "opt-in",
    status: "documented",
    notes:
      "Invoker commands are tracked but not emitted because the current UI does not need command/commandfor controls.",
  },

  "SEO:Redirects (301/302/308)": {
    status: "partially-implemented",
    evidence: {
      files: ["proxy.ts", "app/.well-known/change-password/route.ts"],
      routes: ["/.well-known/change-password"],
    },
    notes:
      "Built-in redirects are status-correct; product URL migrations remain project-specific.",
  },
  "SEO:Soft 404s": {
    evidence: {
      files: [
        "app/not-found.tsx",
        "app/error.tsx",
        "app/global-error.tsx",
        "components/error-page.tsx",
        "lib/error-pages.ts",
        "public/404.html",
      ],
      tests: ["tests/error-pages.test.tsx"],
    },
    notes:
      "Missing and disabled routes use framework 404 handling instead of returning a 200 soft-404 page.",
  },
  "SEO:Heading hierarchy": {
    status: "partially-implemented",
    evidence: {
      files: ["app/(marketing)/page.tsx", "app/(marketing)/pricing/page.tsx"],
      tests: ["tests/e2e/example.spec.ts"],
    },
    notes:
      "Template pages use nested headings; generated product content must preserve the outline.",
  },
  "SEO:Breadcrumbs": {
    applicability: "project-specific",
    status: "documented",
    notes:
      "The starter has shallow public routes, so visible breadcrumbs are not emitted by default.",
  },
  "SEO:IndexNow": {
    applicability: "opt-in",
    status: "documented",
    notes:
      "IndexNow needs a real key and submission policy, so it is intentionally opt-in.",
  },

  "Accessibility:Colour contrast": {
    status: "partially-implemented",
    evidence: { files: ["app/globals.css", "components/ui/button.tsx"] },
    notes:
      "Design tokens are chosen for contrast, but generated product content and brand colors still need visual/a11y review.",
  },
  "Accessibility:Automatic contrasting colour": {
    applicability: "opt-in",
    status: "documented",
    notes:
      "The CSS contrast-color() function is tracked as progressive enhancement and not required by the current token system.",
  },
  "Accessibility:Forced colours mode": {
    status: "implemented",
    evidence: { files: ["app/globals.css"] },
  },
  "Accessibility:Image alt text": {
    status: "partially-implemented",
    evidence: { files: ["app/layout.tsx", "app/opengraph-image.tsx"] },
    notes:
      "Template-owned images include alt metadata where applicable; generated content must keep every image purposeful or empty-alt decorative.",
  },
  "Accessibility:Form labels": {
    status: "implemented",
    evidence: {
      files: [
        "components/ui/label.tsx",
        "components/auth/login-form.tsx",
        "components/auth/signup-form.tsx",
      ],
    },
  },
  "Accessibility:Keyboard navigation": {
    status: "implemented",
    evidence: {
      files: [
        "components/ui/button.tsx",
        "components/ui/dialog.tsx",
        "components/ui/dropdown-menu.tsx",
      ],
    },
  },
  "Accessibility:Visible focus indicators": {
    status: "implemented",
    evidence: {
      files: [
        "app/globals.css",
        "components/ui/button.tsx",
        "components/ui/input.tsx",
      ],
    },
  },
  "Accessibility:Skip links": {
    status: "implemented",
    evidence: { files: ["app/layout.tsx", "app/globals.css"] },
  },
  "Accessibility:The inert attribute": {
    status: "partially-implemented",
    evidence: {
      files: [
        "components/ui/dialog.tsx",
        "components/ui/alert-dialog.tsx",
        "components/ui/sheet.tsx",
      ],
    },
    notes:
      "Overlay primitives manage background interaction; native inert is tracked for custom overlays.",
  },
  "Accessibility:Semantic HTML and landmarks": {
    status: "implemented",
    evidence: {
      files: [
        "app/(marketing)/layout.tsx",
        "app/(app)/layout.tsx",
        "app/layout.tsx",
      ],
    },
  },
  "Accessibility:ARIA - first rule of ARIA": {
    status: "implemented",
    evidence: { files: ["components/ui", "components/auth"] },
    notes:
      "The scaffold favors native elements and Radix primitives over hand-rolled ARIA widgets.",
  },
  "Accessibility:Descriptive link text": {
    status: "partially-implemented",
    evidence: {
      files: ["app/(marketing)/layout.tsx", "app/(marketing)/page.tsx"],
    },
  },
  "Accessibility:Empty links and buttons": {
    status: "partially-implemented",
    evidence: { files: ["components/ui/button.tsx"] },
  },
  "Accessibility:Accessible form errors": {
    status: "implemented",
    evidence: {
      files: [
        "components/auth/login-form.tsx",
        "components/auth/signup-form.tsx",
        "lib/validation.ts",
      ],
    },
  },
  "Accessibility:Accessible authentication": {
    status: "implemented",
    evidence: { files: ["components/auth", "lib/auth.ts"] },
    notes:
      "Password manager, paste-friendly, magic-link, OAuth, TOTP, and passkey flows are available when selected.",
  },
  "Accessibility:Redundant entry": {
    status: "partially-implemented",
    evidence: {
      files: [
        "components/auth/signup-form.tsx",
        "components/auth/accept-invitation.tsx",
      ],
    },
  },
  "Accessibility:Consistent help": {
    status: "partially-implemented",
    evidence: { files: ["app/(marketing)/layout.tsx", "lib/discovery.ts"] },
  },
  "Accessibility:Document and parts language": {
    status: "implemented",
    evidence: { files: ["app/layout.tsx", "lib/discovery.ts"] },
  },
  "Accessibility:Reduced motion": {
    status: "implemented",
    evidence: { files: ["app/globals.css"] },
  },
  "Accessibility:Accessibility overlays": {
    applicability: "not-applicable",
    status: "not-applicable",
    notes: "The scaffold does not load accessibility overlay widgets.",
  },
  "Accessibility:Captions and transcripts": {
    applicability: "project-specific",
    status: "documented",
    notes:
      "The default scaffold has no audio/video content; media-bearing generated projects must add captions/transcripts.",
  },
  "Accessibility:Accessible data tables": {
    status: "implemented",
    evidence: {
      files: ["components/ui/table.tsx", "app/(marketing)/page.tsx"],
    },
  },
  "Accessibility:Touch target size": {
    status: "implemented",
    evidence: {
      files: [
        "components/ui/button.tsx",
        "components/ui/input.tsx",
        "app/globals.css",
      ],
    },
  },
  "Accessibility:Dragging movements": {
    applicability: "not-applicable",
    status: "not-applicable",
    notes: "The default scaffold does not include drag-only interactions.",
  },
  "Accessibility:Hidden until found": {
    applicability: "opt-in",
    status: "documented",
    notes:
      'No default content is hidden in collapsible findable regions; use hidden="until-found" for generated docs/FAQ sections.',
  },
  "Accessibility:Mobile-friendly form inputs": {
    status: "implemented",
    evidence: { files: ["components/ui/input.tsx", "components/auth"] },
  },
  "Accessibility:Native interactive elements": {
    status: "implemented",
    evidence: {
      files: [
        "components/ui/button.tsx",
        "components/ui/dialog.tsx",
        "components/ui/dropdown-menu.tsx",
      ],
    },
  },
  "Accessibility:CSS state and relational selectors": {
    status: "partially-implemented",
    evidence: { files: ["app/globals.css", "components/ui/table.tsx"] },
  },

  "Security:HTTPS and TLS": {
    applicability: "deployment",
    status: "documented",
    evidence: { docs: ["docs/website-spec-deployment.md"] },
    notes:
      "TLS version, HTTP-to-HTTPS redirect, and certificate posture must be validated on the deployed host.",
  },
  "Security:HSTS (Strict-Transport-Security)": {
    status: "implemented",
    evidence: {
      files: ["next.config.ts"],
      headers: ["Strict-Transport-Security"],
      tests: ["tests/website-spec.test.ts"],
    },
  },
  "Security:Mixed content and upgrade-insecure-requests": {
    status: "implemented",
    evidence: {
      files: ["next.config.ts"],
      headers: ["Content-Security-Policy"],
    },
  },
  "Security:Content Security Policy (CSP)": {
    status: "implemented",
    evidence: {
      files: ["next.config.ts"],
      headers: ["Content-Security-Policy"],
      tests: ["tests/website-spec.test.ts"],
    },
  },
  "Security:Reporting API (Reporting-Endpoints)": {
    status: "implemented",
    evidence: {
      files: ["next.config.ts", "app/api/reports/route.ts"],
      headers: ["Reporting-Endpoints"],
      routes: ["/api/reports"],
    },
  },
  "Security:/.well-known/security.txt": {
    status: "implemented",
    evidence: {
      files: ["app/.well-known/security.txt/route.ts"],
      routes: ["/.well-known/security.txt", "/security.txt"],
    },
  },
  "Security:X-Content-Type-Options: nosniff": {
    status: "implemented",
    evidence: {
      files: ["next.config.ts"],
      headers: ["X-Content-Type-Options"],
    },
  },
  "Security:Clickjacking protection (frame-ancestors / X-Frame-Options)": {
    status: "implemented",
    evidence: {
      files: ["next.config.ts"],
      headers: ["Content-Security-Policy", "X-Frame-Options"],
    },
  },
  "Security:Cross-origin isolation (COOP / COEP / CORP)": {
    status: "partially-implemented",
    evidence: {
      files: ["next.config.ts"],
      headers: ["Cross-Origin-Opener-Policy", "Cross-Origin-Resource-Policy"],
    },
    notes:
      "COOP and CORP are enabled; COEP remains opt-in because it can break third-party embeds/assets.",
  },
  "Security:Referrer-Policy": {
    status: "implemented",
    evidence: { files: ["next.config.ts"], headers: ["Referrer-Policy"] },
  },
  "Security:Permissions-Policy": {
    status: "implemented",
    evidence: { files: ["next.config.ts"], headers: ["Permissions-Policy"] },
  },
  "Security:Subresource Integrity (SRI)": {
    applicability: "not-applicable",
    status: "not-applicable",
    notes:
      "The scaffold does not load third-party script or stylesheet tags by default.",
  },
  "Security:Digest Fields (Content-Digest and Repr-Digest)": {
    applicability: "opt-in",
    status: "documented",
    notes:
      "Digest headers are useful for downloads and APIs with a concrete integrity requirement; no default payload requires them.",
  },
  "Security:Trusted Types": {
    applicability: "opt-in",
    status: "documented",
    notes:
      "Tracked as a stricter CSP mode; current framework/runtime code still needs a deployment-specific compatibility audit before enforcement.",
  },
  "Security:Cookie attributes - Secure, HttpOnly, SameSite": {
    status: "implemented",
    evidence: { files: ["lib/auth.ts", "lib/session.ts"] },
  },
  "Security:Clear-Site-Data": {
    applicability: "opt-in",
    status: "documented",
    notes:
      "Logout storage clearing depends on the final auth/session policy and is kept explicit.",
  },
  "Security:DNS CAA records": {
    applicability: "deployment",
    status: "documented",
    evidence: { docs: ["docs/website-spec-deployment.md"] },
  },
  "Security:DNSSEC": {
    applicability: "deployment",
    status: "documented",
    evidence: { docs: ["docs/website-spec-deployment.md"] },
  },

  "Well-Known URIs:Well-known URIs": {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: ["app/.well-known"],
      routes: ["/.well-known/security.txt", "/.well-known/api-catalog"],
    },
  },
  "Well-Known URIs:/.well-known/change-password": {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: ["app/.well-known/change-password/route.ts"],
      routes: ["/.well-known/change-password"],
    },
  },
  "Well-Known URIs:/.well-known/api-catalog": {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: ["app/.well-known/api-catalog/route.ts"],
      routes: ["/.well-known/api-catalog"],
    },
  },
  "Well-Known URIs:/.well-known/traffic-advice": {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: ["app/.well-known/traffic-advice/route.ts"],
      routes: ["/.well-known/traffic-advice"],
    },
  },
  "Well-Known URIs:/.well-known/webauthn": {
    notes:
      "Only needed for related-origin passkeys across multiple domains; default passkeys use the app origin.",
  },
  "Well-Known URIs:/.well-known/openid-configuration": {
    notes: "Only required when the generated product is an OIDC provider.",
  },
  "Well-Known URIs:/.well-known/oauth-authorization-server": {
    notes:
      "Only required when the generated product runs an OAuth authorization server.",
  },
  "Well-Known URIs:/.well-known/oauth-protected-resource": {
    notes: "Only required for a published OAuth-protected resource server.",
  },
  "Well-Known URIs:/.well-known/webfinger": {
    notes: "Only required for Fediverse/account discovery use cases.",
  },
  "Well-Known URIs:/.well-known/apple-app-site-association": {
    notes: "Only safe to emit after Apple Team IDs and bundle IDs are known.",
  },
  "Well-Known URIs:/.well-known/assetlinks.json": {
    notes:
      "Only safe to emit after Android package names and SHA-256 fingerprints are known.",
  },
  "Well-Known URIs:/.well-known/nodeinfo": {
    notes:
      "Only required for federated software instances that publish NodeInfo.",
  },

  "Agent Readiness:Content Signals in robots.txt": {
    applicability: "opt-in",
    status: "documented",
    notes:
      "Content-Signal directives are still emerging and should match the final content licensing policy.",
  },
  "Agent Readiness:Web Bot Auth - verifiable bot identity": {
    applicability: "opt-in",
    status: "documented",
  },
  "Agent Readiness:MCP and tool discovery": {
    applicability: "opt-in",
    status: "documented",
    evidence: { files: ["agent.json", ".mcp.json"] },
    notes:
      "Local MCP configuration exists for maintainers; public MCP discovery is opt-in per generated product.",
  },
  "Agent Readiness:A2A agent cards": {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: ["app/.well-known/agent-card.json/route.ts"],
      routes: ["/.well-known/agent-card.json"],
    },
  },
  "Agent Readiness:Agent Skills discovery": {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: ["app/.well-known/agent-skills.json/route.ts"],
      routes: ["/.well-known/agent-skills.json"],
    },
  },
  "Agent Readiness:DNS for AI Discovery (DNS-AID)": {
    applicability: "deployment",
    status: "documented",
  },
  "Agent Readiness:Agentic Resource Discovery (ARD)": {
    applicability: "opt-in",
    status: "documented",
  },
  "Agent Readiness:NLWeb - conversational interface discovery": {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: ["app/ask/route.ts", "next.config.ts"],
      routes: ["/ask"],
      headers: ["Link"],
    },
  },
  "Agent Readiness:WebMCP - browser-native tools for agents": {
    applicability: "opt-in",
    status: "documented",
  },
  "Agent Readiness:Open Knowledge Format (OKF) bundle": {
    applicability: "opt-in",
    status: "documented",
  },
  "Agent Readiness:Schemamap - discoverable JSON-LD endpoints per resource": {
    applicability: "default",
    status: "implemented",
    evidence: {
      files: ["app/schemamap.xml/route.ts"],
      routes: ["/schemamap.xml"],
    },
  },

  "Performance:Core Web Vitals (LCP, INP, CLS)": {
    applicability: "deployment",
    status: "documented",
    evidence: { docs: ["docs/website-spec-deployment.md"] },
    notes:
      "The scaffold avoids obvious layout instability, but CWV thresholds require real-user or Lighthouse measurement after deployment.",
  },
  "Performance:Image optimisation": {
    status: "partially-implemented",
    evidence: {
      files: ["next.config.ts", "app/opengraph-image.tsx", "public"],
    },
  },
  "Performance:Lazy loading images, iframes, and video": {
    applicability: "project-specific",
    status: "documented",
    notes:
      "No default below-the-fold media needs lazy loading; generated content must apply native loading where appropriate.",
  },
  "Performance:Preload, prefetch, preconnect": {
    status: "partially-implemented",
    evidence: {
      files: ["app/layout.tsx", "next.config.ts"],
      headers: ["Link"],
    },
  },
  "Performance:103 Early Hints": {
    applicability: "deployment",
    status: "documented",
  },
  "Performance:Cache-Control headers": {
    status: "implemented",
    evidence: { files: ["next.config.ts"], headers: ["Cache-Control"] },
  },
  "Performance:Conditional requests (ETag, Last-Modified, 304)": {
    applicability: "deployment",
    status: "documented",
    notes:
      "Next.js/CDN can emit validators; final behavior must be checked on the hosting layer.",
  },
  "Performance:No-Vary-Search response header": {
    status: "implemented",
    evidence: { files: ["next.config.ts"], headers: ["No-Vary-Search"] },
  },
  "Performance:Compression (gzip, brotli, zstd)": {
    applicability: "deployment",
    status: "documented",
  },
  "Performance:Web font loading": {
    status: "implemented",
    evidence: { files: ["app/layout.tsx"] },
    notes:
      "next/font self-hosts Geist variable fonts from the root layout and exposes sans/mono variables for Tailwind.",
  },
  "Performance:Critical CSS and render-blocking resources": {
    status: "partially-implemented",
    evidence: { files: ["app/layout.tsx", "app/globals.css"] },
  },
  "Performance:Script loading - defer, async, module": {
    status: "implemented",
    evidence: { files: ["app/layout.tsx"] },
    notes:
      "The service-worker registration uses next/script with afterInteractive instead of a blocking head script.",
  },
  "Performance:HTTP/2 and HTTP/3": {
    applicability: "deployment",
    status: "documented",
  },
  "Performance:HTTP/1.1 workarounds: sharding, sprites, and bundling": {
    applicability: "not-applicable",
    status: "not-applicable",
    notes: "The scaffold does not use domain sharding or sprite workarounds.",
  },
  "Performance:Speculation Rules": {
    applicability: "opt-in",
    status: "documented",
  },
  "Performance:Resource hints overview": {
    status: "partially-implemented",
    evidence: {
      files: ["next.config.ts", "app/layout.tsx"],
      headers: ["Link"],
    },
  },
  "Performance:View Transitions": {
    applicability: "opt-in",
    status: "documented",
  },
  "Performance:Back/forward cache (BFCache)": {
    status: "partially-implemented",
    evidence: { files: ["app/layout.tsx", "next.config.ts"] },
    notes:
      "The scaffold avoids unload handlers and global blocking scripts; final eligibility needs browser verification.",
  },
  "Performance:Visibility-aware rendering": {
    applicability: "opt-in",
    status: "documented",
  },
  "Performance:CSS containment": {
    applicability: "opt-in",
    status: "documented",
  },
  "Performance:Scroll-driven animations": {
    applicability: "opt-in",
    status: "documented",
  },
  "Performance:Scrollbar gutter": {
    status: "implemented",
    evidence: { files: ["app/globals.css"] },
  },
  "Performance:Dynamic viewport units (dvh, svh, lvh)": {
    status: "implemented",
    evidence: {
      files: [
        "app/globals.css",
        "app/(marketing)/page.tsx",
        "app/not-found.tsx",
      ],
    },
  },
  "Performance:Compression Dictionary Transport": {
    applicability: "deployment",
    status: "documented",
  },
  "Performance:Server-Timing header": {
    applicability: "opt-in",
    status: "documented",
  },

  "Privacy:Privacy policy": {
    status: "implemented",
    evidence: {
      files: ["app/(marketing)/privacy/page.tsx"],
      routes: ["/privacy"],
    },
  },
  "Privacy:Cookie consent": {
    applicability: "not-applicable",
    status: "not-applicable",
    evidence: { docs: ["docs/legal/cookies.md"] },
    notes:
      "The scaffold sets no non-essential cookies or analytics by default; consent UI is required before adding those.",
  },
  "Privacy:Global Privacy Control (GPC)": {
    applicability: "project-specific",
    status: "documented",
    notes:
      "Generated products that sell/share personal data must honor GPC in their data layer.",
  },
  "Privacy:Third-party scripts and privacy": {
    status: "implemented",
    evidence: { files: ["app/layout.tsx", "next.config.ts"] },
    notes: "No third-party script tags are loaded by default.",
  },
  "Privacy:Storage Access API": {
    applicability: "not-applicable",
    status: "not-applicable",
    notes:
      "The default scaffold does not embed cross-site content that needs third-party storage access.",
  },
  "Privacy:Privacy-respecting analytics": {
    applicability: "project-specific",
    status: "documented",
    notes:
      "No analytics are loaded by default; analytics choices must be added deliberately.",
  },
  "Privacy:Data minimisation": {
    status: "partially-implemented",
    evidence: {
      files: [
        "db/schema",
        "lib/validation.ts",
        "app/(marketing)/privacy/page.tsx",
      ],
    },
  },

  "Resilience:Monitoring and uptime": {
    applicability: "deployment",
    status: "documented",
    evidence: { docs: ["docs/website-spec-deployment.md"] },
  },
  "Resilience:Deprecation and Sunset": {
    applicability: "opt-in",
    status: "documented",
  },

  "Internationalisation:Avoid automatic IP-based language redirects": {
    applicability: "default",
    status: "implemented",
    notes: "The scaffold does not perform IP or Accept-Language redirects.",
  },
  "Internationalisation:lang attribute on inline content": {
    applicability: "project-specific",
    status: "documented",
    evidence: { files: ["app/layout.tsx"] },
    notes:
      "The document language is set; generated mixed-language inline content must add its own lang attribute.",
  },
  "Internationalisation:translate attribute for untranslatable content": {
    applicability: "project-specific",
    status: "documented",
  },
};

function keyFor(
  item: Pick<WebsiteSpecChecklistItem, "category" | "title">,
): string {
  return `${item.category}:${item.title}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mergeEvidence(
  ...values: (Partial<WebsiteSpecEvidence> | undefined)[]
): WebsiteSpecEvidence {
  const merged: WebsiteSpecEvidence = { ...emptyEvidence };

  for (const value of values) {
    if (!value) continue;
    for (const key of Object.keys(merged) as (keyof WebsiteSpecEvidence)[]) {
      merged[key] = [...new Set([...merged[key], ...(value[key] ?? [])])];
    }
  }

  return merged;
}

function sourceFor(item: WebsiteSpecChecklistItem): string {
  const source = websiteSpecItemSources[keyFor(item)];
  if (!source) {
    throw new Error(
      `Missing Website Specification source URL for ${keyFor(item)}.`,
    );
  }
  return source;
}

export function websiteSpecComplianceItems(): WebsiteSpecComplianceItem[] {
  return WEBSITE_SPEC_CHECKLIST.map((item) => {
    const defaults = categoryDefaults[item.category];
    const override = overrides[keyFor(item)] ?? {};
    const applicability = override.applicability ?? defaults.applicability;
    const status = override.status ?? defaults.status;
    const shouldUseCategoryEvidence =
      applicability === "default" &&
      status !== "documented" &&
      status !== "not-applicable";
    const evidence = mergeEvidence(
      sharedEvidence,
      shouldUseCategoryEvidence ? defaults.evidence : undefined,
      override.evidence,
    );

    return {
      ...item,
      id: `${slugify(item.category)}.${slugify(item.title)}`,
      source: sourceFor(item),
      applicability,
      status,
      evidence,
      notes: override.notes ?? defaults.notes,
    };
  });
}

export function websiteSpecComplianceSummary(
  items = websiteSpecComplianceItems(),
) {
  return {
    source: WEBSITE_SPEC_SOURCE,
    itemCount: WEBSITE_SPEC_ITEM_COUNT,
    byLevel: countBy(items, (item) => item.level),
    byStatus: countBy(items, (item) => item.status),
    byApplicability: countBy(items, (item) => item.applicability),
    byCategory: WEBSITE_SPEC_CHECKLIST.reduce<Record<string, number>>(
      (counts, item) => {
        counts[item.category] = (counts[item.category] ?? 0) + 1;
        return counts;
      },
      {},
    ),
  };
}

export function generateWebsiteSpecAuditMarkdown(): string {
  const items = websiteSpecComplianceItems();
  const summary = websiteSpecComplianceSummary(items);
  const lines = [
    "# Website Specification audit",
    "",
    `Source: ${summary.source}`,
    "",
    `Tracked items: ${summary.itemCount}`,
    "",
    "## Status summary",
    "",
    ...Object.entries(summary.byStatus).map(
      ([status, count]) => `- ${status}: ${count}`,
    ),
    "",
    "## Applicability summary",
    "",
    ...Object.entries(summary.byApplicability).map(
      ([status, count]) => `- ${status}: ${count}`,
    ),
    "",
  ];

  for (const category of Object.keys(summary.byCategory)) {
    lines.push(`## ${category}`, "");
    for (const item of items.filter(
      (candidate) => candidate.category === category,
    )) {
      lines.push(
        `- [${item.status}] ${item.level}: ${item.title} (${item.applicability})`,
        `  Evidence: ${formatEvidence(item.evidence)}`,
        `  Notes: ${item.notes}`,
      );
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function countBy<T extends string>(
  items: WebsiteSpecComplianceItem[],
  selector: (item: WebsiteSpecComplianceItem) => T,
): Record<T, number> {
  return items.reduce<Record<T, number>>(
    (counts, item) => {
      const key = selector(item);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    },
    {} as Record<T, number>,
  );
}

function formatEvidence(evidence: WebsiteSpecEvidence): string {
  const parts = [
    evidence.files.length > 0 ? `files ${evidence.files.join(", ")}` : null,
    evidence.routes.length > 0 ? `routes ${evidence.routes.join(", ")}` : null,
    evidence.headers.length > 0
      ? `headers ${evidence.headers.join(", ")}`
      : null,
    evidence.tests.length > 0 ? `tests ${evidence.tests.join(", ")}` : null,
    evidence.docs.length > 0 ? `docs ${evidence.docs.join(", ")}` : null,
    evidence.commands.length > 0
      ? `commands ${evidence.commands.join(", ")}`
      : null,
  ].filter(Boolean);

  return parts.join("; ") || "none";
}

export function assertWebsiteSpecComplianceRegistry() {
  const items = websiteSpecComplianceItems();
  const ids = new Set(items.map((item) => item.id));

  if (items.length !== WEBSITE_SPEC_ITEM_COUNT) {
    throw new Error(
      `Expected ${WEBSITE_SPEC_ITEM_COUNT} compliance items, found ${items.length}.`,
    );
  }

  if (ids.size !== items.length) {
    throw new Error(
      "Website Specification compliance item ids must be unique.",
    );
  }

  const missingEvidence = items.filter((item) =>
    Object.values(item.evidence).every((values) => values.length === 0),
  );
  if (missingEvidence.length > 0) {
    throw new Error(
      `Compliance items missing evidence: ${missingEvidence.map((item) => item.id).join(", ")}`,
    );
  }
}
