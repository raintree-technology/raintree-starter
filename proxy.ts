import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitContext,
  rateLimiters,
} from "@/lib/rate-limit";

/**
 * Next.js proxy (formerly "middleware"). Runs on the Node.js runtime, so keep it
 * lightweight: it rate-limits auth endpoints via Upstash and performs an
 * *optimistic* auth gate (cookie presence only). Real session validation runs
 * in the protected route/page through `auth.api.getSession`, which is the
 * Better Auth + Next.js recommended split (no DB call in the proxy).
 */
const MAINTENANCE_RETRY_AFTER_SECONDS = 600;
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/settings",
  "/onboarding",
  "/command-center",
];
const MAINTENANCE_BYPASS_EXACT_PATHS = [
  "/favicon.ico",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/offline.html",
  "/sw.js",
  "/sw-register.js",
] as const;
const MAINTENANCE_BYPASS_SEGMENT_PREFIXES = [
  "/_next",
  "/maintenance-response",
  "/maintenance",
] as const;
const MAINTENANCE_BYPASS_FILE_PREFIXES = ["/web-app-manifest"] as const;

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) =>
    matchesPathOrChild(pathname, prefix),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (process.env.MAINTENANCE_MODE === "1" && !isMaintenanceBypass(pathname)) {
    return maintenanceResponse(request);
  }

  // Rate-limit auth endpoints. Skip the Stripe webhook (server-to-server).
  if (isAuthEndpoint(pathname) && pathname !== "/api/auth/stripe/webhook") {
    const clientIp = getClientIp(request);
    const { success, remaining, reset } = await checkRateLimit(
      rateLimiters.auth,
      clientIp,
      getRateLimitContext(request, clientIp),
    );
    if (!success) return tooManyRequests(request, reset);
    const res = NextResponse.next();
    if (remaining >= 0)
      res.headers.set("X-RateLimit-Remaining", String(remaining));
    if (reset > 0)
      res.headers.set("X-RateLimit-Reset", String(Math.ceil(reset / 1000)));
    return res;
  }

  if (isProtected(pathname)) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

function isMaintenanceBypass(pathname: string): boolean {
  return (
    MAINTENANCE_BYPASS_EXACT_PATHS.includes(
      pathname as (typeof MAINTENANCE_BYPASS_EXACT_PATHS)[number],
    ) ||
    MAINTENANCE_BYPASS_SEGMENT_PREFIXES.some((prefix) =>
      matchesPathOrChild(pathname, prefix),
    ) ||
    MAINTENANCE_BYPASS_FILE_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    )
  );
}

function matchesPathOrChild(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isAuthEndpoint(pathname: string): boolean {
  return pathname === "/api/auth" || pathname.startsWith("/api/auth/");
}

function tooManyRequests(request: NextRequest, reset: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  const url = new URL("/api/rate-limited", request.url);
  url.searchParams.set("retryAfter", String(retryAfter));
  return NextResponse.rewrite(url);
}

function maintenanceResponse(request: NextRequest): NextResponse {
  const url = new URL("/maintenance-response", request.url);
  if (request.nextUrl.pathname.startsWith("/api/") || wantsJson(request)) {
    url.searchParams.set("format", "json");
  }

  url.searchParams.set("retryAfter", String(MAINTENANCE_RETRY_AFTER_SECONDS));
  return NextResponse.rewrite(url);
}

function wantsJson(request: NextRequest): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json") && !accept.includes("text/html");
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|mjs|map|woff|woff2|ttf|otf)$).*)",
    },
  ],
};
