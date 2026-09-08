import "server-only";

import { passkey } from "@better-auth/passkey";
import { stripe } from "@better-auth/stripe";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink, twoFactor } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { runAfterResponse } from "@/lib/after";
import { isPerSeatPlan, toStripePlans } from "@/lib/billing/plans";
import { syncOrganizationSeats } from "@/lib/billing/seats";
import { features } from "@/lib/config";
import { sendMagicLinkEmail, sendOrganizationInvitation } from "@/lib/email";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { isStripeConfigured, stripe as stripeClient } from "@/lib/stripe";
import { isMultiTenant } from "@/lib/tenancy";

const authLogger = logger.child({ module: "auth" });

export function createTwoFactorPlugin(appName: string) {
  return twoFactor({ issuer: appName });
}

export function createPasskeyPlugin(appName: string, appUrl: URL) {
  return passkey({
    rpName: appName,
    rpID: appUrl.hostname,
    origin: appUrl.origin,
  });
}

export function createMagicLinkPlugin() {
  return magicLink({
    sendMagicLink: async ({ email, url }) => {
      await sendMagicLinkEmail(email, url);
    },
  });
}

export function createAdminPlugin() {
  return admin();
}

export function createOrganizationPlugin() {
  return organization({
    allowUserToCreateOrganization: isMultiTenant,
    sendInvitationEmail: async (data) => {
      await sendOrganizationInvitation({
        email: data.email,
        teamName: data.organization.name,
        invitedByUsername: data.inviter.user.name,
        inviteLink: `${env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`,
      });
    },
    organizationHooks: {
      afterAddMember: async ({ organization: org }) => {
        runAfterResponse(
          "auth.organization.member.added",
          async () => {
            authLogger.info(
              { organizationId: org.id },
              "auth.organization.member.added",
            );
            await syncOrganizationSeats(org.id);
          },
          { module: "auth", organizationId: org.id },
        );
      },
      afterAcceptInvitation: async ({ organization: org }) => {
        runAfterResponse(
          "auth.organization.invitation.accepted",
          () => syncOrganizationSeats(org.id),
          { module: "auth", organizationId: org.id },
        );
      },
      afterRemoveMember: async ({ organization: org }) => {
        runAfterResponse(
          "auth.organization.member.removed",
          async () => {
            authLogger.info(
              { organizationId: org.id },
              "auth.organization.member.removed",
            );
            await syncOrganizationSeats(org.id);
          },
          { module: "auth", organizationId: org.id },
        );
      },
    },
  });
}

export function createBillingPlugins() {
  if (!features.billing || !isStripeConfigured) return [];
  return [
    stripe({
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET ?? "",
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: toStripePlans(),
        requireEmailVerification: false,
        authorizeReference: async ({ user, referenceId, action }, ctx) => {
          if (referenceId === user.id) {
            authLogger.info(
              {
                userId: user.id,
                referenceId,
                referenceType: "user",
                result: "allowed",
              },
              "billing.reference.authorized",
            );
            return true;
          }
          const rows = await db
            .select({ role: schema.member.role })
            .from(schema.member)
            .where(
              and(
                eq(schema.member.organizationId, referenceId),
                eq(schema.member.userId, user.id),
              ),
            );
          const role = rows[0]?.role;
          const allowed = role === "owner" || role === "admin";
          const payload = {
            userId: user.id,
            referenceId,
            referenceType: "organization",
            role,
            result: allowed ? "allowed" : "denied",
          };
          if (allowed && action === "upgrade-subscription") {
            // Better Auth parses this body before its reference middleware. Derive
            // quantity here so checkout and upgrades cannot trust client seats.
            const [{ seats }] = await db
              .select({ seats: count() })
              .from(schema.member)
              .where(eq(schema.member.organizationId, referenceId));
            ctx.body.seats = isPerSeatPlan(ctx.body.plan)
              ? Math.max(seats, 1)
              : 1;
          }
          if (allowed) authLogger.info(payload, "billing.reference.authorized");
          else authLogger.warn(payload, "billing.reference.denied");
          return allowed;
        },
      },
    }),
  ];
}

export function createCookiePlugin() {
  return nextCookies();
}
