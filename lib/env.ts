import "server-only";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { assertDeploymentEnvironment } from "@/lib/deployment-environment";

/**
 * Typed, validated environment variables.
 *
 * Validation runs at import time (and therefore at build time), so a missing or
 * malformed variable fails the build instead of surfacing as a runtime crash.
 * Integration keys (Stripe, Resend, Upstash, OAuth, AI) are optional — the app
 * degrades gracefully when they are absent so the starter boots with only a
 * database and an auth secret configured.
 *
 * What's *wired in* is controlled by starter.config.ts; this file controls
 * what's *credentialed*.
 *
 * Set SKIP_ENV_VALIDATION=1 to bypass validation for tooling.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Core — required.
    DATABASE_URL: z.string().min(1),
    AUTH_DATABASE_URL: z.string().min(1).optional(),
    DIRECT_DATABASE_URL: z.string().min(1).optional(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url().optional(),

    // OAuth (optional — providers enabled only when both id + secret are set).
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // Stripe (optional — billing UI hides itself when unset).
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
    STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
    STRIPE_PRICE_TEAM_MONTHLY: z.string().optional(),
    STRIPE_PRICE_TEAM_YEARLY: z.string().optional(),

    // Email (optional — falls back to console transport in development).
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("Acme <onboarding@resend.dev>"),

    // Rate limiting (optional — disabled when unset).
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    UPSTASH_RATELIMIT_ANALYTICS: z.enum(["0", "1"]).optional(),
    UPSTASH_RATELIMIT_PROTECTION: z.enum(["0", "1"]).optional(),

    // AI — Vercel AI Gateway (optional; required for the AI features).
    AI_GATEWAY_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default("openai/gpt-5-mini"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_DATABASE_URL: process.env.AUTH_DATABASE_URL,
    DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
    STRIPE_PRICE_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
    STRIPE_PRICE_TEAM_MONTHLY: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    STRIPE_PRICE_TEAM_YEARLY: process.env.STRIPE_PRICE_TEAM_YEARLY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    UPSTASH_RATELIMIT_ANALYTICS: process.env.UPSTASH_RATELIMIT_ANALYTICS,
    UPSTASH_RATELIMIT_PROTECTION: process.env.UPSTASH_RATELIMIT_PROTECTION,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

if (!process.env.SKIP_ENV_VALIDATION) {
  assertDeploymentEnvironment(process.env);
}
