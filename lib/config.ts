import { starterConfig } from "@/starter.config";

const i = starterConfig.integrations;
const tenancy = starterConfig.tenancy as "single" | "multi";

/**
 * Effective feature flags derived from `starter.config.ts`. Client-safe (no env),
 * so it can gate both server routes and client UI. Whether an integration also
 * *works* depends on its env keys being present at runtime.
 */
export const features = {
  appName: starterConfig.appName,
  seo: starterConfig.seo,
  tenancyMulti: tenancy === "multi",
  oauth: {
    google: i.oauth.google,
    github: i.oauth.github,
    any: i.oauth.google || i.oauth.github,
  },
  billing: i.billing,
  email: i.email,
  rateLimit: i.rateLimit,
  twoFactor: i.twoFactor,
  passkeys: i.passkeys,
  magicLink: i.magicLink,
  ai: i.ai.enabled,
  aiChat: i.ai.enabled && i.ai.chat,
  aiStructured: i.ai.enabled && i.ai.structuredOutput,
  aiPersist: i.ai.enabled && i.ai.persistHistory,
} as const;
