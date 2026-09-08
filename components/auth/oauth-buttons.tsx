"use client";

import { useState } from "react";
import { toastAuthError } from "@/components/auth/form-parts";
import { GitHubIcon, GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export type EnabledProviders = { google: boolean; github: boolean };

const OAUTH_ERROR = "Could not start sign in";
const SOCIAL_PROVIDERS = [
  { provider: "google", label: "Google", Icon: GoogleIcon },
  { provider: "github", label: "GitHub", Icon: GitHubIcon },
] as const;

type SocialProvider = (typeof SOCIAL_PROVIDERS)[number]["provider"];

export function OAuthButtons({
  providers,
  callbackURL = "/dashboard",
}: {
  providers: EnabledProviders;
  callbackURL?: string;
}) {
  const [loading, setLoading] = useState<SocialProvider | null>(null);
  const enabledProviders = SOCIAL_PROVIDERS.filter(
    ({ provider }) => providers[provider],
  );

  if (enabledProviders.length === 0) return null;

  async function signInWith(provider: SocialProvider) {
    setLoading(provider);
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL,
      });
      if (error) {
        toastAuthError(error, OAUTH_ERROR);
      }
    } catch (error: unknown) {
      toastAuthError(error instanceof Error ? error : undefined, OAUTH_ERROR);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {enabledProviders.map(({ provider, label, Icon }) => (
        <Button
          key={provider}
          variant="outline"
          type="button"
          disabled={loading !== null}
          aria-busy={loading === provider || undefined}
          onClick={() => signInWith(provider)}
        >
          <Icon /> {label}
        </Button>
      ))}
    </div>
  );
}
