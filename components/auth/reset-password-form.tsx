"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { toast } from "sonner";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const RESET_PASSWORD_ERROR = "Could not reset password";

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const resetPassword = useAuthAction();

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h1">Invalid link</CardTitle>
          <CardDescription>
            This password reset link is missing or expired.{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-foreground hover:underline"
            >
              Request a new one
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = getFormString(formData, "password");
    const confirm = getFormString(formData, "confirm");

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }

    await resetPassword.run(async () => {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (error) {
        toastAuthError(error, RESET_PASSWORD_ERROR);
        return;
      }
      toast.success("Password updated — please sign in");
      router.push("/login");
    }, RESET_PASSWORD_ERROR);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Choose a new password</CardTitle>
        <CardDescription>
          Enter a new password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            description="At least 8 characters."
          />
          <AuthField
            id="confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <AuthLoadingButton
            type="submit"
            loading={resetPassword.loading}
            loadingText="Updating…"
          >
            Update password
          </AuthLoadingButton>
        </form>
      </CardContent>
    </Card>
  );
}
