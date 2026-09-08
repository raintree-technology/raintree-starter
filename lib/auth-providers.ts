import "server-only";
import { features } from "@/lib/config";
import { env } from "@/lib/env";

/** OAuth providers that are both enabled in config and credentialed in env. */
export function enabledOAuthProviders() {
  return {
    google:
      features.oauth.google &&
      !!env.GOOGLE_CLIENT_ID &&
      !!env.GOOGLE_CLIENT_SECRET,
    github:
      features.oauth.github &&
      !!env.GITHUB_CLIENT_ID &&
      !!env.GITHUB_CLIENT_SECRET,
  };
}
