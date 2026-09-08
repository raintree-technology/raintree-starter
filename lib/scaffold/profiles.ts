import type { AddonId } from "./addons";

export type ProfileId =
  | "internal-tool"
  | "client-portal"
  | "saas"
  | "paid-saas"
  | "ai-saas";

export type ProfileDefinition = {
  id: ProfileId;
  label: string;
  summary: string;
  addons: AddonId[];
  includeDefaults: boolean;
  tenancy: "single" | "multi";
};

export const PROFILES: ProfileDefinition[] = [
  {
    id: "internal-tool",
    label: "Internal Tool",
    summary:
      "Authenticated team application with Postgres, passkeys, and rate limiting.",
    addons: ["neon", "better-auth", "audit", "passkeys", "upstash"],
    includeDefaults: false,
    tenancy: "multi",
  },
  {
    id: "client-portal",
    label: "Client Portal",
    summary:
      "Multi-tenant client workspace with invitations, OAuth, passkeys, transactional email, and rate limiting.",
    addons: [
      "neon",
      "better-auth",
      "audit",
      "oauth",
      "passkeys",
      "resend",
      "upstash",
    ],
    includeDefaults: true,
    tenancy: "multi",
  },
  {
    id: "saas",
    label: "SaaS",
    summary:
      "Public SaaS product with auth, organizations, email, discovery, and rate limiting.",
    addons: [
      "neon",
      "better-auth",
      "audit",
      "oauth",
      "passkeys",
      "resend",
      "upstash",
    ],
    includeDefaults: true,
    tenancy: "multi",
  },
  {
    id: "paid-saas",
    label: "Paid SaaS",
    summary:
      "SaaS profile with Stripe subscriptions and organization seat billing.",
    addons: [
      "neon",
      "better-auth",
      "audit",
      "oauth",
      "passkeys",
      "stripe",
      "resend",
      "upstash",
    ],
    includeDefaults: true,
    tenancy: "multi",
  },
  {
    id: "ai-saas",
    label: "AI SaaS",
    summary:
      "Paid SaaS profile with AI Gateway, streaming chat, and persisted history.",
    addons: [
      "neon",
      "better-auth",
      "audit",
      "oauth",
      "passkeys",
      "stripe",
      "resend",
      "upstash",
      "ai",
    ],
    includeDefaults: true,
    tenancy: "multi",
  },
];

export function getProfile(id: ProfileId): ProfileDefinition {
  const profile = PROFILES.find((candidate) => candidate.id === id);
  if (!profile) throw new Error(`Unknown profile "${id}".`);
  return profile;
}

export function parseProfileId(value: string): ProfileId {
  if (!PROFILES.some((profile) => profile.id === value)) {
    throw new Error(
      `Unknown profile "${value}". Available profiles: ${PROFILES.map((profile) => profile.id).join(", ")}.`,
    );
  }
  return value as ProfileId;
}
