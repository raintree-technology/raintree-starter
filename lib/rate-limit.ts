import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { features } from "@/lib/config";
import { noStoreText } from "@/lib/route-handlers";

/**
 * Distributed rate limiting on Upstash Redis (REST — Edge-compatible).
 *
 * When Upstash isn't configured the limiters are null and `checkRateLimit`
 * allows every request, so the app runs locally without Redis. Configure
 * Upstash for production: in-memory limiting doesn't survive serverless cold
 * starts or span multiple instances.
 */
type Window = Parameters<typeof Ratelimit.slidingWindow>[1];
export type RateLimitContext = {
  ip?: string;
  userAgent?: string;
  country?: string;
};

const REDIS_REQUEST_TIMEOUT_MS = 1_000;
const RATE_LIMIT_TIMEOUT_MS = 1_000;
const RATE_LIMIT_HEADER_VALUE_MAX_LENGTH = 512;
const RATE_LIMIT_PREFIX = `ratelimit:${slugify(features.appName)}`;

const limiterConfig = {
  ai: { tokens: 20, window: "24 h" },
  auth: { tokens: 10, window: "10 s" },
  api: { tokens: 60, window: "60 s" },
  mutation: { tokens: 20, window: "60 s" },
} satisfies Record<string, { tokens: number; window: Window }>;

type LimiterName = keyof typeof limiterConfig;

let redis: Redis | null | undefined;
const limiterCache: Partial<Record<LimiterName, Ratelimit | null>> = {};

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  redis =
    features.rateLimit && hasRedisCredentials() ? createRedisClient() : null;
  return redis;
}

function createRedisClient(): Redis {
  return Redis.fromEnv({
    enableAutoPipelining: true,
    keepAlive: true,
    latencyLogging: false,
    signal: () => AbortSignal.timeout(REDIS_REQUEST_TIMEOUT_MS),
  });
}

function hasRedisCredentials(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return Boolean(url && token);
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "app";
}

export const rateLimitEnabled = features.rateLimit && hasRedisCredentials();

function getLimiter(name: LimiterName): Ratelimit | null {
  if (Object.hasOwn(limiterCache, name)) return limiterCache[name] ?? null;

  const redis = getRedis();
  if (!redis) {
    limiterCache[name] = null;
    return null;
  }

  const { tokens, window } = limiterConfig[name];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `${RATE_LIMIT_PREFIX}:${name}`,
    timeout: RATE_LIMIT_TIMEOUT_MS,
    analytics: envFlag("UPSTASH_RATELIMIT_ANALYTICS"),
    enableProtection: envFlag("UPSTASH_RATELIMIT_PROTECTION"),
  });
  limiterCache[name] = limiter;
  return limiter;
}

/** Per-surface presets. */
export const rateLimiters = {
  get ai(): Ratelimit | null {
    return getLimiter("ai");
  },
  get auth(): Ratelimit | null {
    return getLimiter("auth");
  },
  get api(): Ratelimit | null {
    return getLimiter("api");
  },
  get mutation(): Ratelimit | null {
    return getLimiter("mutation");
  },
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
  unavailable?: boolean;
};

export async function checkRateLimit(
  rl: Ratelimit | null,
  identifier: string,
  context?: RateLimitContext,
  failurePolicy: "open" | "closed" = "open",
): Promise<RateLimitResult> {
  const unavailable: RateLimitResult =
    failurePolicy === "closed"
      ? { success: false, remaining: 0, reset: 0, unavailable: true }
      : { success: true, remaining: -1, reset: 0 };
  if (!rl) return unavailable;

  try {
    const { success, remaining, reset, pending, reason } = await rl.limit(
      identifier,
      context,
    );
    void pending.catch((error: unknown) => {
      if (process.env.NODE_ENV !== "test") {
        console.warn("rate-limit.pending_failed", formatRateLimitError(error));
      }
    });
    if (reason === "timeout" && failurePolicy === "closed") return unavailable;
    return { success, remaining, reset };
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("rate-limit.check_failed", formatRateLimitError(error));
    }
    return unavailable;
  }
}

export function getClientIp(request: NextRequest): string {
  const realIp = sanitizeHeaderValue(request.headers.get("x-real-ip"));
  if (realIp) return realIp;

  const forwardedIp = sanitizeHeaderValue(
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
  );
  return forwardedIp ?? "anonymous";
}

export function getRateLimitContext(
  request: NextRequest,
  clientIp = getClientIp(request),
): RateLimitContext {
  const context: RateLimitContext = {};
  const ip = sanitizeHeaderValue(clientIp);
  if (ip && ip !== "anonymous") context.ip = ip;

  const userAgent = sanitizeHeaderValue(request.headers.get("user-agent"));
  if (userAgent) context.userAgent = userAgent;

  const country = getCountry(request);
  if (country) context.country = country;

  return context;
}

function getCountry(request: NextRequest): string | undefined {
  return sanitizeHeaderValue(
    request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry"),
    2,
  )?.toUpperCase();
}

function sanitizeHeaderValue(
  value: string | null | undefined,
  maxLength = RATE_LIMIT_HEADER_VALUE_MAX_LENGTH,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function envFlag(name: string): boolean {
  return process.env[name] === "1";
}

function formatRateLimitError(error: unknown): string {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
}

/** Shared daily allowance for both paid AI endpoints; failures never admit spend. */
export async function checkAiUsage(userId: string): Promise<Response | null> {
  const result = await checkRateLimit(
    rateLimiters.ai,
    userId,
    undefined,
    "closed",
  );
  if (result.unavailable) {
    return noStoreText("AI usage limits are unavailable", { status: 503 });
  }
  if (!result.success) {
    return noStoreText("Daily AI limit reached", {
      status: 429,
      headers: {
        "Retry-After": String(
          Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        ),
      },
    });
  }
  return null;
}
