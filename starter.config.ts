/** Starter configuration. This file contains no secrets. */
export const starterConfig = {
  appName: "Next Starter",
  seo: true,

  /** "single" bills each user directly; "multi" enables organizations + per-seat billing. */
  tenancy: "multi",

  integrations: {
    oauth: { google: true, github: true },
    billing: false, // Stripe
    email: true, // Resend
    rateLimit: true, // Upstash
    twoFactor: true,
    passkeys: true,
    magicLink: true,
    ai: {
      enabled: false,
      chat: false,
      structuredOutput: false,
      persistHistory: false,
    },
  },

  capabilities: {
    audit: true,
  },
} as const;

export type StarterConfig = typeof starterConfig;
