import { describe, expect, it } from "vitest";
import { getSafeInternalRedirect } from "@/lib/safe-redirect";

describe("safe internal redirects", () => {
  it("preserves internal paths with query strings", () => {
    expect(getSafeInternalRedirect("/dashboard?tab=billing")).toBe(
      "/dashboard?tab=billing",
    );
  });

  it("rejects external and malformed redirect values", () => {
    expect(getSafeInternalRedirect("https://example.com")).toBe("/dashboard");
    expect(getSafeInternalRedirect("//example.com/path")).toBe("/dashboard");
    expect(getSafeInternalRedirect("javascript:alert(1)")).toBe("/dashboard");
  });

  it("uses a custom fallback route when provided", () => {
    expect(getSafeInternalRedirect(undefined, "/login")).toBe("/login");
  });
});
