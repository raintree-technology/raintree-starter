import "client-only";
import { passkeyClient } from "@better-auth/passkey/client";
import { stripeClient } from "@better-auth/stripe/client";
import {
  adminClient,
  magicLinkClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { publicEnv } from "@/lib/public-env";

/**
 * Browser-side auth client. Plugins mirror the server (lib/auth.ts). The
 * organization client is only included in multi-tenant mode.
 */
export const authClient = createAuthClient({
  baseURL: publicEnv.NEXT_PUBLIC_APP_URL,
  plugins: [
    twoFactorClient(),
    passkeyClient(),
    magicLinkClient(),
    adminClient(),
    organizationClient(),
    stripeClient({ subscription: true }),
  ],
});
