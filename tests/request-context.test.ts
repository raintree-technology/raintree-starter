import { describe, expect, it } from "vitest";
import { requestContext, withRequestContext } from "@/lib/request-context";

describe("request context", () => {
  it("preserves a caller request id", () => {
    const context = requestContext(
      new Request("https://example.com/api/test", {
        headers: { "x-request-id": "request-123" },
      }),
    );
    expect(context.requestId).toBe("request-123");
  });

  it("generates and returns a request id on responses", async () => {
    const response = await withRequestContext(
      new Request("https://example.com/api/test"),
      () => Response.json({ ok: true }),
    );
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });
});
