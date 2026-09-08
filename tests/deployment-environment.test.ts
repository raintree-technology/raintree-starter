import { describe, expect, it } from "vitest";
import {
  assertDeploymentEnvironment,
  resolveDeploymentEnvironment,
} from "@/lib/deployment-environment";

const hostedDatabaseEnv = {
  DATABASE_URL: "postgresql://runtime:one@db.example/app",
  AUTH_DATABASE_URL: "postgresql://auth:two@db.example/app",
  DIRECT_DATABASE_URL: "postgresql://owner:three@db.example/app",
};

describe("deployment environment isolation", () => {
  it("resolves explicit and Vercel deployment signals", () => {
    expect(resolveDeploymentEnvironment({ DEPLOYMENT_ENV: "production" })).toBe(
      "production",
    );
    expect(resolveDeploymentEnvironment({ VERCEL_ENV: "preview" })).toBe(
      "preview",
    );
    expect(resolveDeploymentEnvironment({ NODE_ENV: "production" })).toBe(
      "development",
    );
  });

  it("accepts local development without hosted-only credentials", () => {
    expect(() =>
      assertDeploymentEnvironment({
        DEPLOYMENT_ENV: "development",
        NEXT_PUBLIC_APP_URL: "http://localhost:3450",
        DATABASE_URL: "postgresql://localhost/app",
      }),
    ).not.toThrow();
  });

  it("accepts an isolated production deployment", () => {
    expect(() =>
      assertDeploymentEnvironment({
        DEPLOYMENT_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
        BETTER_AUTH_URL: "https://app.example.com",
        CANONICAL_APP_URL: "https://app.example.com",
        ...hostedDatabaseEnv,
      }),
    ).not.toThrow();
  });

  it("rejects preview traffic pointed at production", () => {
    expect(() =>
      assertDeploymentEnvironment({
        DEPLOYMENT_ENV: "preview",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
        BETTER_AUTH_URL: "https://app.example.com",
        CANONICAL_APP_URL: "https://app.example.com",
        ...hostedDatabaseEnv,
      }),
    ).toThrow("must not target the production canonical origin");
  });

  it("rejects mismatched auth and application origins", () => {
    expect(() =>
      assertDeploymentEnvironment({
        DEPLOYMENT_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
        BETTER_AUTH_URL: "https://auth.example.com",
        CANONICAL_APP_URL: "https://app.example.com",
        ...hostedDatabaseEnv,
      }),
    ).toThrow("BETTER_AUTH_URL must match NEXT_PUBLIC_APP_URL");
  });

  it("rejects shared hosted database credentials", () => {
    expect(() =>
      assertDeploymentEnvironment({
        DEPLOYMENT_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
        BETTER_AUTH_URL: "https://app.example.com",
        CANONICAL_APP_URL: "https://app.example.com",
        ...hostedDatabaseEnv,
        AUTH_DATABASE_URL: hostedDatabaseEnv.DATABASE_URL,
      }),
    ).toThrow(
      "DATABASE_URL and AUTH_DATABASE_URL must use different database credentials",
    );
  });
});
