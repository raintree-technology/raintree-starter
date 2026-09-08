export type DeploymentEnvironment = "development" | "preview" | "production";

type EnvironmentInput = Record<string, string | undefined>;

function optionalUrl(key: string, value: string | undefined): URL | null {
  const normalized = value?.trim();
  if (!normalized) return null;
  try {
    return new URL(normalized);
  } catch {
    throw new Error(`${key} must be a valid absolute URL.`);
  }
}

function requiredUrl(key: string, value: string | undefined): URL {
  const parsed = optionalUrl(key, value);
  if (!parsed) throw new Error(`${key} is required for hosted deployments.`);
  return parsed;
}

function assertHttps(key: string, url: URL): void {
  if (url.protocol !== "https:") {
    throw new Error(`${key} must use HTTPS for hosted deployments.`);
  }
}

function requireDistinctCredentials(
  entries: Array<[key: string, value: string | undefined]>,
): void {
  for (const [key, value] of entries) {
    if (!value?.trim())
      throw new Error(`${key} is required for hosted deployments.`);
  }
  for (let index = 0; index < entries.length; index += 1) {
    for (let other = index + 1; other < entries.length; other += 1) {
      if (entries[index]?.[1]?.trim() === entries[other]?.[1]?.trim()) {
        throw new Error(
          `${entries[index]?.[0]} and ${entries[other]?.[0]} must use different database credentials.`,
        );
      }
    }
  }
}

export function resolveDeploymentEnvironment(
  env: EnvironmentInput,
): DeploymentEnvironment {
  const explicit = env.DEPLOYMENT_ENV?.trim().toLowerCase();
  const vercel = env.VERCEL_ENV?.trim().toLowerCase();
  const value = explicit || vercel;
  if (value === "production" || value === "preview") return value;
  return "development";
}

export function assertDeploymentEnvironment(env: EnvironmentInput): void {
  const deployment = resolveDeploymentEnvironment(env);
  if (deployment === "development") return;

  const appUrl = requiredUrl("NEXT_PUBLIC_APP_URL", env.NEXT_PUBLIC_APP_URL);
  const authUrl = requiredUrl("BETTER_AUTH_URL", env.BETTER_AUTH_URL);
  assertHttps("NEXT_PUBLIC_APP_URL", appUrl);
  assertHttps("BETTER_AUTH_URL", authUrl);
  if (authUrl.origin !== appUrl.origin) {
    throw new Error(
      "BETTER_AUTH_URL must match NEXT_PUBLIC_APP_URL in hosted deployments.",
    );
  }

  const canonicalUrl = optionalUrl("CANONICAL_APP_URL", env.CANONICAL_APP_URL);
  if (canonicalUrl) assertHttps("CANONICAL_APP_URL", canonicalUrl);

  if (deployment === "production") {
    if (!canonicalUrl) {
      throw new Error("CANONICAL_APP_URL is required for production.");
    }
    if (appUrl.origin !== canonicalUrl.origin) {
      throw new Error(
        "Production NEXT_PUBLIC_APP_URL must match CANONICAL_APP_URL.",
      );
    }
  } else if (canonicalUrl && appUrl.origin === canonicalUrl.origin) {
    throw new Error(
      "Preview NEXT_PUBLIC_APP_URL must not target the production canonical origin.",
    );
  }

  requireDistinctCredentials([
    ["DATABASE_URL", env.DATABASE_URL],
    ["AUTH_DATABASE_URL", env.AUTH_DATABASE_URL],
    ["DIRECT_DATABASE_URL", env.DIRECT_DATABASE_URL],
  ]);
}
