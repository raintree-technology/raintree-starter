"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import {
  AuthField,
  AuthLoadingButton,
  getFormString,
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

const RESET_EMAIL_ERROR = "Could not send reset email";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const resetEmail = useAuthAction();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = getFormString(formData, "email");

    await resetEmail.run(async () => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (error) {
        toastAuthError(error, RESET_EMAIL_ERROR);
        return;
      }
      setSent(true);
    }, RESET_EMAIL_ERROR);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Reset your password</CardTitle>
        <CardDescription aria-live="polite">
          {sent
            ? "If an account exists for that email, a reset link is on its way. It can take a minute to arrive — check spam too."
            : "Enter your email and we'll send you a reset link."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
          />
          <AuthLoadingButton
            type="submit"
            loading={resetEmail.loading}
            loadingText="Sending…"
          >
            {sent ? "Resend link" : "Send reset link"}
          </AuthLoadingButton>
        </form>
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
