import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as rateLimitedGet } from "@/app/api/rate-limited/route";
import { GET as maintenanceGet } from "@/app/maintenance-response/route";
import { proxy } from "@/proxy";

function request(
  path: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), init);
}

function rewritePath(response: Response): string | null {
  const rewrite = response.headers.get("x-middleware-rewrite");
  if (!rewrite) return null;

  const url = new URL(rewrite);
  return `${url.pathname}${url.search}`;
}

describe("proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("preserves the full path and query string in auth redirects", async () => {
    vi.stubEnv("MAINTENANCE_MODE", "0");

    const response = await proxy(request("/dashboard?tab=billing"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirect=%2Fdashboard%3Ftab%3Dbilling",
    );
  });

  it("protects the private Command Center before rendering", async () => {
    vi.stubEnv("MAINTENANCE_MODE", "0");

    const response = await proxy(request("/command-center?view=inbox"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirect=%2Fcommand-center%3Fview%3Dinbox",
    );
  });

  it("rewrites API maintenance requests to the JSON maintenance endpoint", async () => {
    vi.stubEnv("MAINTENANCE_MODE", "1");

    const response = await proxy(
      request("/api/chat", { headers: { accept: "application/json" } }),
    );

    expect(response.status).toBe(200);
    expect(rewritePath(response)).toBe(
      "/maintenance-response?format=json&retryAfter=600",
    );
  });

  it("uses segment-aware maintenance bypasses", async () => {
    vi.stubEnv("MAINTENANCE_MODE", "1");

    const maintenancePage = await proxy(request("/maintenance"));
    const similarPath = await proxy(request("/maintenance-preview"));

    expect(maintenancePage.headers.get("x-middleware-next")).toBe("1");
    expect(rewritePath(similarPath)).toBe(
      "/maintenance-response?retryAfter=600",
    );
  });

  it("serves JSON maintenance responses from the rewrite target", async () => {
    const response = maintenanceGet(
      new Request(
        "http://localhost:3000/maintenance-response?format=json&retryAfter=600",
      ),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("600");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toMatchObject({
      error: "Service unavailable",
    });
  });

  it("serves JSON rate-limit responses from the rewrite target", async () => {
    const response = rateLimitedGet(
      new Request("http://localhost:3000/api/rate-limited?retryAfter=42"),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests",
    });
  });
});

it.each([{ purpose: "prefetch" }, { "next-router-prefetch": "1" }])(
  "keeps prefetch hints inside the security matcher",
  async (headers) => {
    const { unstable_doesMiddlewareMatch } = await import(
      "next/experimental/testing/server"
    );
    const { config } = await import("@/proxy");
    for (const url of ["/api/auth/sign-in/email", "/api/chat", "/dashboard"]) {
      expect(
        unstable_doesMiddlewareMatch({ config, nextConfig: {}, url, headers }),
      ).toBe(true);
    }
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/_next/static/app.js",
        headers,
      }),
    ).toBe(false);
  },
);
