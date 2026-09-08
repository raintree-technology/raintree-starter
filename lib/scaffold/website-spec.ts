import { WEBSITE_SPEC_CATEGORIES, WEBSITE_SPEC_SOURCE } from "./addons";

export type WebsiteSpecLevel =
  | "Required"
  | "Recommended"
  | "Optional"
  | "Avoid";

export type WebsiteSpecChecklistItem = {
  category: string;
  title: string;
  level: WebsiteSpecLevel;
};

function items(
  category: string,
  values: readonly [title: string, level: WebsiteSpecLevel][],
): WebsiteSpecChecklistItem[] {
  return values.map(([title, level]) => ({ category, title, level }));
}

export const WEBSITE_SPEC_CHECKLIST: WebsiteSpecChecklistItem[] = [
  ...items("Foundations", [
    ["The HTML doctype", "Required"],
    ["The lang attribute on <html>", "Required"],
    ["<meta charset>", "Required"],
    ["<meta viewport>", "Required"],
    ["The <title> element", "Required"],
    ['<meta name="description">', "Recommended"],
    ['Canonical URL (rel="canonical")', "Recommended"],
    ["Favicons and app icons", "Recommended"],
    ['<meta name="theme-color">', "Recommended"],
    ['<meta name="color-scheme">', "Recommended"],
    ["Open Graph protocol", "Recommended"],
    ['Feed discovery with rel="alternate"', "Recommended"],
    ["Feed content hygiene", "Recommended"],
    ["Popover API", "Recommended"],
    ["CSS anchor positioning", "Recommended"],
    ["Balanced text wrapping", "Recommended"],
    ["CSS container queries", "Recommended"],
    ["Invoker commands", "Optional"],
  ]),
  ...items("SEO", [
    ["robots.txt", "Recommended"],
    ["XML sitemaps", "Recommended"],
    ["Sitemap index files", "Recommended"],
    ["Image and video sitemap extensions", "Optional"],
    ["URL structure", "Recommended"],
    ["Redirects (301/302/308)", "Required"],
    ["Server-side rendering", "Recommended"],
    ["Soft 404s", "Avoid"],
    ["Meta robots and X-Robots-Tag", "Required"],
    ["Heading hierarchy", "Required"],
    ["Internal linking", "Recommended"],
    ["Structured data (JSON-LD)", "Recommended"],
    ["Breadcrumbs", "Recommended"],
    ["IndexNow", "Optional"],
  ]),
  ...items("Accessibility", [
    ["Colour contrast", "Required"],
    ["Automatic contrasting colour", "Optional"],
    ["Forced colours mode", "Recommended"],
    ["Image alt text", "Required"],
    ["Form labels", "Required"],
    ["Keyboard navigation", "Required"],
    ["Visible focus indicators", "Required"],
    ["Skip links", "Required"],
    ["The inert attribute", "Recommended"],
    ["Semantic HTML and landmarks", "Required"],
    ["ARIA - first rule of ARIA", "Recommended"],
    ["Descriptive link text", "Required"],
    ["Empty links and buttons", "Avoid"],
    ["Accessible form errors", "Required"],
    ["Accessible authentication", "Recommended"],
    ["Redundant entry", "Recommended"],
    ["Consistent help", "Recommended"],
    ["Document and parts language", "Required"],
    ["Reduced motion", "Required"],
    ["Accessibility overlays", "Avoid"],
    ["Captions and transcripts", "Required"],
    ["Accessible data tables", "Required"],
    ["Touch target size", "Required"],
    ["Dragging movements", "Recommended"],
    ["Hidden until found", "Recommended"],
    ["Mobile-friendly form inputs", "Recommended"],
    ["Native interactive elements", "Recommended"],
    ["CSS state and relational selectors", "Recommended"],
  ]),
  ...items("Security", [
    ["HTTPS and TLS", "Required"],
    ["HSTS (Strict-Transport-Security)", "Required"],
    ["Mixed content and upgrade-insecure-requests", "Recommended"],
    ["Content Security Policy (CSP)", "Recommended"],
    ["Reporting API (Reporting-Endpoints)", "Recommended"],
    ["/.well-known/security.txt", "Recommended"],
    ["X-Content-Type-Options: nosniff", "Required"],
    ["Clickjacking protection (frame-ancestors / X-Frame-Options)", "Required"],
    ["Cross-origin isolation (COOP / COEP / CORP)", "Recommended"],
    ["Referrer-Policy", "Recommended"],
    ["Permissions-Policy", "Recommended"],
    ["Subresource Integrity (SRI)", "Recommended"],
    ["Digest Fields (Content-Digest and Repr-Digest)", "Optional"],
    ["Trusted Types", "Recommended"],
    ["Cookie attributes - Secure, HttpOnly, SameSite", "Required"],
    ["Clear-Site-Data", "Optional"],
    ["DNS CAA records", "Recommended"],
    ["DNSSEC", "Optional"],
  ]),
  ...items("Well-Known URIs", [
    ["Well-known URIs", "Recommended"],
    ["/.well-known/change-password", "Optional"],
    ["/.well-known/webauthn", "Optional"],
    ["/.well-known/openid-configuration", "Optional"],
    ["/.well-known/oauth-authorization-server", "Optional"],
    ["/.well-known/oauth-protected-resource", "Optional"],
    ["/.well-known/api-catalog", "Recommended"],
    ["/.well-known/webfinger", "Optional"],
    ["/.well-known/apple-app-site-association", "Optional"],
    ["/.well-known/assetlinks.json", "Optional"],
    ["/.well-known/nodeinfo", "Optional"],
    ["/.well-known/traffic-advice", "Optional"],
  ]),
  ...items("Agent Readiness", [
    ["Agent readiness", "Recommended"],
    ["/llms.txt", "Recommended"],
    ["/llms-full.txt", "Optional"],
    ["Per-page Markdown source endpoints", "Recommended"],
    ["robots.txt for AI crawlers", "Recommended"],
    ["Content Signals in robots.txt", "Optional"],
    ["Web Bot Auth - verifiable bot identity", "Optional"],
    ["Stable URLs", "Required"],
    ["Structured data for agents", "Recommended"],
    ["Machine-readable formats", "Recommended"],
    ["HTTP Link headers for discovery", "Recommended"],
    ["MCP and tool discovery", "Optional"],
    ["A2A agent cards", "Optional"],
    ["Agent Skills discovery", "Recommended"],
    ["DNS for AI Discovery (DNS-AID)", "Optional"],
    ["Agentic Resource Discovery (ARD)", "Optional"],
    ["NLWeb - conversational interface discovery", "Optional"],
    ["WebMCP - browser-native tools for agents", "Optional"],
    ["Open Knowledge Format (OKF) bundle", "Optional"],
    ["Schemamap - discoverable JSON-LD endpoints per resource", "Optional"],
  ]),
  ...items("Performance", [
    ["Core Web Vitals (LCP, INP, CLS)", "Required"],
    ["Image optimisation", "Required"],
    ["Lazy loading images, iframes, and video", "Recommended"],
    ["Preload, prefetch, preconnect", "Recommended"],
    ["103 Early Hints", "Optional"],
    ["Cache-Control headers", "Required"],
    ["Conditional requests (ETag, Last-Modified, 304)", "Recommended"],
    ["No-Vary-Search response header", "Recommended"],
    ["Compression (gzip, brotli, zstd)", "Required"],
    ["Web font loading", "Recommended"],
    ["Critical CSS and render-blocking resources", "Recommended"],
    ["Script loading - defer, async, module", "Recommended"],
    ["HTTP/2 and HTTP/3", "Recommended"],
    ["HTTP/1.1 workarounds: sharding, sprites, and bundling", "Avoid"],
    ["Speculation Rules", "Recommended"],
    ["Resource hints overview", "Recommended"],
    ["View Transitions", "Optional"],
    ["Back/forward cache (BFCache)", "Recommended"],
    ["Visibility-aware rendering", "Optional"],
    ["CSS containment", "Optional"],
    ["Scroll-driven animations", "Optional"],
    ["Scrollbar gutter", "Recommended"],
    ["Dynamic viewport units (dvh, svh, lvh)", "Recommended"],
    ["Compression Dictionary Transport", "Optional"],
    ["Server-Timing header", "Optional"],
  ]),
  ...items("Privacy", [
    ["Privacy policy", "Required"],
    ["Cookie consent", "Required"],
    ["Global Privacy Control (GPC)", "Recommended"],
    ["Third-party scripts and privacy", "Recommended"],
    ["Storage Access API", "Optional"],
    ["Privacy-respecting analytics", "Recommended"],
    ["Data minimisation", "Recommended"],
  ]),
  ...items("Resilience", [
    ["Custom error pages (404, 500)", "Required"],
    ["Maintenance pages and 503", "Recommended"],
    ["Graceful degradation when JavaScript fails", "Recommended"],
    ["Offline support and service workers", "Optional"],
    ["Web app manifest", "Recommended"],
    ["Monitoring and uptime", "Recommended"],
    ["Deprecation and Sunset", "Optional"],
  ]),
  ...items("Internationalisation", [
    ["International URL structure", "Recommended"],
    ["hreflang for language and regional URLs", "Recommended"],
    ["Localised page metadata", "Recommended"],
    ["hreflang in XML sitemaps", "Optional"],
    ["Avoid automatic IP-based language redirects", "Avoid"],
    ["lang attribute on inline content", "Required"],
    ["translate attribute for untranslatable content", "Optional"],
    ["Language switcher", "Recommended"],
    ["RTL and bidirectional text", "Recommended"],
    ["Writing modes and CJK line breaking", "Optional"],
    ["Locale-aware content", "Recommended"],
    ["Plural rules and grammatical number", "Recommended"],
    ["Internationalised Domain Names (IDN)", "Optional"],
  ]),
];

export const WEBSITE_SPEC_ITEM_COUNT = WEBSITE_SPEC_CHECKLIST.length;

export function websiteSpecCategoryCounts() {
  return WEBSITE_SPEC_CATEGORIES.map((category) => ({
    ...category,
    itemCount: WEBSITE_SPEC_CHECKLIST.filter(
      (item) => item.category === category.label,
    ).length,
  }));
}

export function websiteSpecLevelCounts() {
  return WEBSITE_SPEC_CHECKLIST.reduce<Record<WebsiteSpecLevel, number>>(
    (counts, item) => {
      counts[item.level] += 1;
      return counts;
    },
    { Required: 0, Recommended: 0, Optional: 0, Avoid: 0 },
  );
}
