"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import {
  AuthDivider,
  AuthField,
  AuthLoadingButton,
  getFormString,
  toastAuthError,
  useAuthAction,
} from "@/components/auth/form-parts";
import {
  type EnabledProviders,
  OAuthButtons,
} from "@/components/auth/oauth-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/validation";

const SIGN_UP_ERROR = "Could not create account";

export function SignupForm({ providers }: { providers: EnabledProviders }) {
  const router = useRouter();
  const signUp = useAuthAction();
  const hasOAuth = providers.google || providers.github;
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      name: getFormString(formData, "name"),
      email: getFormString(formData, "email"),
      password: getFormString(formData, "password"),
    });

    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      setFieldErrors({
        name: flat.fieldErrors.name?.[0],
        email: flat.fieldErrors.email?.[0],
        password: flat.fieldErrors.password?.[0],
      });
      return;
    }
    setFieldErrors({});

    await signUp.run(async () => {
      const { name, email, password } = parsed.data;
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/dashboard",
      });
      if (error) {
        toastAuthError(error, SIGN_UP_ERROR);
        return;
      }
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    }, SIGN_UP_ERROR);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Create your account</CardTitle>
        <CardDescription>Start your free account in seconds.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasOAuth && (
          <>
            <OAuthButtons providers={providers} />
            <AuthDivider />
          </>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField
            id="name"
            label="Name"
            autoComplete="name"
            required
            error={fieldErrors.name}
          />
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            error={fieldErrors.email}
          />
          <AuthField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            description="At least 8 characters."
            error={fieldErrors.password}
          />
          <AuthLoadingButton
            type="submit"
            loading={signUp.loading}
            loadingText="Creating account…"
          >
            Create account
          </AuthLoadingButton>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="ml-1 font-medium text-foreground hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
