import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";
import MagicLinkEmail from "@/emails/magic-link";
import OrganizationInviteEmail from "@/emails/organization-invite";
import ResetPasswordEmail from "@/emails/reset-password";
import VerifyEmail from "@/emails/verify-email";
import WelcomeEmail from "@/emails/welcome";
import { features } from "@/lib/config";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Transactional email via Resend.
 *
 * When RESEND_API_KEY is unset (local dev), emails are logged to the console
 * instead of sent — including verification/reset links — so you can develop the
 * full auth flow without an email provider.
 */
const APP_NAME = features.appName;
const emailLogger = logger.child({ module: "email" });
let resend: Resend | null | undefined;

function getResend(): Resend | null {
  if (resend !== undefined) return resend;

  resend =
    features.email && env.RESEND_API_KEY
      ? new Resend(env.RESEND_API_KEY)
      : null;
  return resend;
}

async function send({
  to,
  subject,
  react,
  template,
  actionUrl,
}: {
  to: string;
  subject: string;
  react: ReactElement;
  template: string;
  /** The email's primary link (verification, reset, invite…), logged in dev. */
  actionUrl?: string;
}) {
  const client = getResend();

  if (!client) {
    // Dev transport: surface the action link so auth flows are completable
    // without an email provider. Logged at warn so default levels show it.
    // Never log the URL in production — these are single-use bearer-token
    // links, and a misconfigured deploy must not leak them into log sinks.
    const includeUrl = process.env.NODE_ENV !== "production";
    emailLogger.warn(
      {
        to,
        subject,
        template,
        transport: "dev",
        ...(includeUrl
          ? { actionUrl }
          : { actionUrl: "[redacted in production]" }),
      },
      "email.skipped (dev transport — use actionUrl to continue the flow)",
    );
    return;
  }

  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    react,
  });
  if (error) {
    emailLogger.error(
      { err: error, to, subject, template },
      "email.send.failed",
    );
    return;
  }

  emailLogger.info({ to, subject, template }, "email.sent");
}

export function sendVerificationEmail(to: string, url: string) {
  return send({
    to,
    subject: `Verify your email for ${APP_NAME}`,
    template: "verify-email",
    actionUrl: url,
    react: <VerifyEmail url={url} appName={APP_NAME} />,
  });
}

export function sendResetPasswordEmail(to: string, url: string) {
  return send({
    to,
    subject: `Reset your ${APP_NAME} password`,
    template: "reset-password",
    actionUrl: url,
    react: <ResetPasswordEmail url={url} appName={APP_NAME} />,
  });
}

export function sendMagicLinkEmail(to: string, url: string) {
  return send({
    to,
    subject: `Your ${APP_NAME} sign-in link`,
    template: "magic-link",
    actionUrl: url,
    react: <MagicLinkEmail url={url} appName={APP_NAME} />,
  });
}

export function sendOrganizationInvitation(args: {
  email: string;
  teamName: string;
  invitedByUsername?: string;
  inviteLink: string;
}) {
  return send({
    to: args.email,
    subject: `Join ${args.teamName} on ${APP_NAME}`,
    template: "organization-invite",
    actionUrl: args.inviteLink,
    react: (
      <OrganizationInviteEmail
        inviteLink={args.inviteLink}
        teamName={args.teamName}
        invitedByUsername={args.invitedByUsername}
        appName={APP_NAME}
      />
    ),
  });
}

export function sendWelcomeEmail(to: string, name?: string) {
  return send({
    to,
    subject: `Welcome to ${APP_NAME}`,
    template: "welcome",
    react: (
      <WelcomeEmail
        name={name}
        dashboardUrl={`${env.NEXT_PUBLIC_APP_URL}/dashboard`}
        appName={APP_NAME}
      />
    ),
  });
}
