"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  AuthLoadingButton,
  toastAuthError,
  useAuthAction,
} from "@/components/auth/form-parts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const RESEND_EMAIL_ERROR = "Could not resend";

export function VerifyEmailCard({ email }: { email?: string }) {
  const resendEmail = useAuthAction();

  async function resend() {
    if (!email) {
      toast.error("No email on file — try signing up again");
      return;
    }

    await resendEmail.run(async () => {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      });
      if (error) {
        toastAuthError(error, RESEND_EMAIL_ERROR);
        return;
      }
      toast.success("Verification email sent");
    }, RESEND_EMAIL_ERROR);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Check your email</CardTitle>
        <CardDescription>
          {email ? (
            <>
              We sent a verification link to{" "}
              <span className="font-medium">{email}</span>. Click it to activate
              your account.
            </>
          ) : (
            "We sent you a verification link. Click it to activate your account."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthLoadingButton
          onClick={resend}
          variant="outline"
          loading={resendEmail.loading}
          loadingText="Sending…"
        >
          Resend email
        </AuthLoadingButton>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
