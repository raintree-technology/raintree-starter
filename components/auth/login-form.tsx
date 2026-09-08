"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { features } from "@/lib/config";
import { signInSchema } from "@/lib/validation";

const SIGN_IN_ERROR = "Invalid email or password";
const MAGIC_LINK_ERROR = "Could not send link";

export function LoginForm({
  redirect,
  providers,
}: {
  redirect: Route;
  providers: EnabledProviders;
}) {
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const signIn = useAuthAction();
  const magicLink = useAuthAction();
  const hasOAuth = providers.google || providers.github;
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      email: getFormString(formData, "email"),
      password: getFormString(formData, "password"),
    });

    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      setFieldErrors({
        email: flat.fieldErrors.email?.[0],
        password: flat.fieldErrors.password?.[0],
      });
      return;
    }
    setFieldErrors({});

    await signIn.run(async () => {
      const { email, password } = parsed.data;
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      });
      if (error) {
        toastAuthError(error, SIGN_IN_ERROR);
        return;
      }
      if (data && "twoFactorRedirect" in data) {
        router.push("/two-factor");
        return;
      }
      // Full navigation: the client router cache may hold payloads rendered
      // before this session existed, which would bounce back to auth screens.
      window.location.assign(redirect);
    }, SIGN_IN_ERROR);
  }

  async function sendMagicLink() {
    const email = emailInputRef.current?.value ?? "";
    if (!z.email().safeParse(email).success) {
      setFieldErrors({
        email: "Enter a valid email address to receive a link",
      });
      emailInputRef.current?.focus();
      return;
    }
    setFieldErrors({});

    await magicLink.run(async () => {
      const { error } = await authClient.signIn.magicLink({
        email,
        callbackURL: redirect,
      });
      if (error) {
        toastAuthError(error, MAGIC_LINK_ERROR);
        return;
      }
      toast.success("Check your email for a sign-in link");
    }, MAGIC_LINK_ERROR);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasOAuth && (
          <>
            <OAuthButtons providers={providers} callbackURL={redirect} />
            <AuthDivider />
          </>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField
            ref={emailInputRef}
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
            autoComplete="current-password"
            required
            error={fieldErrors.password}
            labelAction={
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot?
              </Link>
            }
          />
          <AuthLoadingButton
            type="submit"
            loading={signIn.loading}
            loadingText="Signing in…"
          >
            Sign in
          </AuthLoadingButton>
        </form>
        {features.magicLink && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={sendMagicLink}
            disabled={magicLink.loading}
            aria-busy={magicLink.loading || undefined}
          >
            {magicLink.loading ? "Sending…" : "Email me a magic link"}
          </Button>
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="ml-1 font-medium text-foreground hover:underline"
        >
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
