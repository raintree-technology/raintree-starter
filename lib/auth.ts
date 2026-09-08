import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authDb } from "@/db/auth-client";
import * as schema from "@/db/schema";
import { runAfterResponse } from "@/lib/after";
import {
  createAdminPlugin,
  createBillingPlugins,
  createCookiePlugin,
  createMagicLinkPlugin,
  createOrganizationPlugin,
  createPasskeyPlugin,
  createTwoFactorPlugin,
} from "@/lib/auth/plugins";
import { buildSocialProviders } from "@/lib/auth/providers";
import { features } from "@/lib/config";
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "@/lib/email";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { isMultiTenant } from "@/lib/tenancy";

const APP_NAME = features.appName;
const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);
const authLogger = logger.child({ module: "auth" });

/**
 * Better Auth server instance — the single source of truth for authentication.
 *
 * Features: email/password (with verification + reset), Google & GitHub OAuth,
 * TOTP two-factor, passkeys (WebAuthn), magic links, an admin console, and
 * Stripe billing. Organizations (multi-tenant, per-seat) are mounted only when
 * NEXT_PUBLIC_TENANCY_MODE=multi; the schema always contains the org tables so
 * switching modes never requires a migration.
 */
export const auth = betterAuth({
  appName: APP_NAME,
  baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(authDb, { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },

  socialProviders: buildSocialProviders(env),

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },

  session: {
    // Revocations and role changes must take effect on the next request.
    cookieCache: { enabled: false },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          runAfterResponse(
            "auth.user.created",
            async () => {
              authLogger.info({ userId: user.id }, "auth.user.created");
              await sendWelcomeEmail(user.email, user.name);
            },
            { module: "auth", userId: user.id },
          );
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          // Default the active organization so returning users land on their
          // dashboard instead of the organization chooser on every sign-in.
          if (!isMultiTenant) return;
          const membership = await db
            .select({ organizationId: schema.member.organizationId })
            .from(schema.member)
            .where(eq(schema.member.userId, session.userId))
            .limit(1);
          const organizationId = membership[0]?.organizationId;
          if (!organizationId) return;
          return { data: { ...session, activeOrganizationId: organizationId } };
        },
      },
    },
  },

  plugins: [
    ...(features.twoFactor ? [createTwoFactorPlugin(APP_NAME)] : []),
    ...(features.passkeys ? [createPasskeyPlugin(APP_NAME, appUrl)] : []),
    ...(features.magicLink ? [createMagicLinkPlugin()] : []),
    createAdminPlugin(),
    createOrganizationPlugin(),
    ...createBillingPlugins(),
    createCookiePlugin(),
  ],
});
