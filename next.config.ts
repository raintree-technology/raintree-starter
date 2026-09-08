import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
const appOrigin = getAppOrigin();
const isHttpsOrigin = appOrigin?.startsWith("https://") ?? false;

function getAppOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      return undefined;
    }
  }

  return isDevelopment ? "http://localhost:3450" : undefined;
}

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  ...(isHttpsOrigin
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Origin-Agent-Cluster",
    value: "?1",
  },
  {
    key: "Reporting-Endpoints",
    value: 'default="/api/reports"',
  },
  {
    key: "Link",
    value: [
      '</llms.txt>; rel="llms"; type="text/plain"',
      '</sitemap.xml>; rel="sitemap"; type="application/xml"',
      '</sitemap-index.xml>; rel="sitemap"; type="application/xml"',
      '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
      '</feed.xml>; rel="alternate"; type="application/rss+xml"; title="Next Starter updates"',
      '</feed.json>; rel="alternate"; type="application/feed+json"; title="Next Starter updates"',
      '</website-spec.json>; rel="describedby"; type="application/json"',
      '</website-spec.md>; rel="describedby"; type="text/markdown"',
      '</ask>; rel="nlweb"; type="application/json"',
      '</schemamap.xml>; rel="describedby"; type="application/xml"',
    ].join(", "),
  },
  {
    key: "No-Vary-Search",
    value:
      'params=("utm_source" "utm_medium" "utm_campaign" "utm_term" "utm_content" "ref")',
  },
  {
    key: "X-XSS-Protection",
    value: "0",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "frame-src 'none'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      `connect-src 'self'${isDevelopment ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "report-uri /api/reports",
      "report-to default",
      ...(!isDevelopment && isHttpsOrigin ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [50, 75, 90],
    minimumCacheTTL: 86_400,
    maximumDiskCacheSize: 500_000_000,
    maximumRedirects: 0,
    maximumResponseBody: 10_000_000,
    dangerouslyAllowLocalIP: false,
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
    localPatterns: [
      { pathname: "/assets/images/**", search: "" },
      { pathname: "/images/**", search: "" },
    ],
    remotePatterns: [],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source:
          "/(admin|command-center|dashboard|settings|onboarding|login|signup|forgot-password|reset-password|two-factor|verify-email|accept-invitation)/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
      {
        source: "/offline.html",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/(404|500).html",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/:path*\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/sw-register.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        // CORS: restrict API access
        source: "/api/:path*",
        headers: [
          ...(appOrigin
            ? [
                { key: "Access-Control-Allow-Origin", value: appOrigin },
                { key: "Vary", value: "Origin" },
              ]
            : []),
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, x-api-key, Authorization",
          },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
