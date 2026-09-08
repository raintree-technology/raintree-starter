import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { starterConfig } from "@/starter.config";

const expectedPrefix = starterConfig.appName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

function request(headers?: HeadersInit): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/login", { headers });
}

describe("rate-limit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.doUnmock("@upstash/ratelimit");
    vi.doUnmock("@upstash/redis");
    vi.resetModules();
  });

  it("stays disabled when Redis credentials are missing", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");

    const { checkRateLimit, rateLimitEnabled, rateLimiters } = await import(
      "@/lib/rate-limit"
    );

    expect(rateLimitEnabled).toBe(false);
    expect(rateLimiters.auth).toBeNull();
    await expect(checkRateLimit(null, "anonymous")).resolves.toEqual({
      success: true,
      remaining: -1,
      reset: 0,
    });
  });

  it("creates an Upstash client with serverless-safe defaults", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubEnv("UPSTASH_RATELIMIT_ANALYTICS", "1");
    vi.stubEnv("UPSTASH_RATELIMIT_PROTECTION", "1");

    const redis = {};
    const fromEnv = vi.fn(() => redis);
    const slidingWindow = vi.fn(() => "sliding-window");
    const Ratelimit = Object.assign(
      vi.fn(function Ratelimit(this: { limit: () => void }) {
        this.limit = vi.fn();
      }),
      { slidingWindow },
    );

    vi.doMock("@upstash/redis", () => ({ Redis: { fromEnv } }));
    vi.doMock("@upstash/ratelimit", () => ({ Ratelimit }));

    const { rateLimitEnabled, rateLimiters } = await import("@/lib/rate-limit");
    const limiter = rateLimiters.auth;

    expect(rateLimitEnabled).toBe(true);
    expect(limiter).toBeTruthy();
    expect(fromEnv).toHaveBeenCalledWith(
      expect.objectContaining({
        enableAutoPipelining: true,
        keepAlive: true,
        latencyLogging: false,
        signal: expect.any(Function),
      }),
    );
    expect(slidingWindow).toHaveBeenCalledWith(10, "10 s");
    expect(Ratelimit).toHaveBeenCalledWith(
      expect.objectContaining({
        redis,
        limiter: "sliding-window",
        prefix: `ratelimit:${expectedPrefix}:auth`,
        timeout: 1_000,
        analytics: true,
        enableProtection: true,
      }),
    );
  });

  it("passes request context to the limiter", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const limit = vi.fn().mockResolvedValue({
      success: false,
      remaining: 0,
      reset: 1234,
      pending: Promise.resolve(),
    });
    const limiter = { limit } as unknown as Parameters<
      typeof checkRateLimit
    >[0];
    const context = { ip: "203.0.113.10", userAgent: "Vitest", country: "US" };

    await expect(
      checkRateLimit(limiter, "203.0.113.10", context),
    ).resolves.toEqual({
      success: false,
      remaining: 0,
      reset: 1234,
    });
    expect(limit).toHaveBeenCalledWith("203.0.113.10", context);
  });

  it("fails open when Redis rate limiting throws", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const limiter = {
      limit: vi.fn().mockRejectedValue(new Error("redis unavailable")),
    } as unknown as Parameters<typeof checkRateLimit>[0];

    await expect(checkRateLimit(limiter, "203.0.113.10")).resolves.toEqual({
      success: true,
      remaining: -1,
      reset: 0,
    });
  });

  it("extracts rate-limit metadata from forwarding headers", async () => {
    const { getClientIp, getRateLimitContext } = await import(
      "@/lib/rate-limit"
    );
    const req = request({
      "x-real-ip": "   ",
      "x-forwarded-for": "203.0.113.10, 198.51.100.4",
      "user-agent": "Vitest",
      "x-vercel-ip-country": "US",
    });

    const ip = getClientIp(req);

    expect(ip).toBe("203.0.113.10");
    expect(getRateLimitContext(req, ip)).toEqual({
      ip: "203.0.113.10",
      userAgent: "Vitest",
      country: "US",
    });
  });

  it("normalizes and caps proxy metadata before sending it to the limiter", async () => {
    const { getClientIp, getRateLimitContext } = await import(
      "@/lib/rate-limit"
    );
    const userAgent = "A".repeat(600);
    const req = request({
      "x-real-ip": " 198.51.100.42 ",
      "user-agent": ` ${userAgent} `,
      "cf-ipcountry": "usa",
    });

    expect(getClientIp(req)).toBe("198.51.100.42");
    expect(getRateLimitContext(req)).toEqual({
      ip: "198.51.100.42",
      userAgent: "A".repeat(512),
      country: "US",
    });
  });
});

it("strict limits reject missing Redis, errors and resolved timeouts", async () => {
  const { checkRateLimit } = await import("@/lib/rate-limit");
  const rejected = {
    success: false,
    remaining: 0,
    reset: 0,
    unavailable: true,
  };
  expect(await checkRateLimit(null, "user", undefined, "closed")).toEqual(
    rejected,
  );
  for (const limit of [
    vi.fn().mockRejectedValue(new Error("Unavailable")),
    vi.fn().mockResolvedValue({
      success: true,
      remaining: 0,
      reset: 0,
      reason: "timeout",
      pending: Promise.resolve(),
    }),
  ]) {
    const limiter = { limit } as unknown as Parameters<
      typeof checkRateLimit
    >[0];
    expect(await checkRateLimit(limiter, "user", undefined, "closed")).toEqual(
      rejected,
    );
  }
});
it("AI shares one daily allowance across routes and rejects unverified usage", async () => {
  const { checkAiUsage, rateLimiters } = await import("@/lib/rate-limit");
  const limit = vi.fn().mockResolvedValue({
    success: true,
    remaining: 19,
    reset: Date.now() + 60000,
    pending: Promise.resolve(),
  });
  const getter = vi.spyOn(rateLimiters, "ai", "get");
  try {
    getter.mockReturnValue({ limit } as unknown as typeof rateLimiters.ai);
    expect(await checkAiUsage("user")).toBeNull();
    expect(limit).toHaveBeenLastCalledWith("user", undefined);
    limit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    });
    const exhausted = await checkAiUsage("user");
    expect(exhausted?.status).toBe(429);
    expect(Number(exhausted?.headers.get("retry-after"))).toBeGreaterThan(0);
    getter.mockReturnValue(null);
    expect((await checkAiUsage("user"))?.status).toBe(503);
  } finally {
    getter.mockRestore();
  }
});
