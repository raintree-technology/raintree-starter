import { describe, expect, it } from "vitest";
import { runReadinessChecks } from "@/lib/readiness";

describe("readiness", () => {
  it("reports every dependency without exposing error details", async () => {
    const result = await runReadinessChecks([
      { name: "database", check: async () => undefined },
      {
        name: "auth-database",
        check: async () => {
          throw new Error("private connection detail");
        },
      },
    ]);
    expect(result).toEqual({
      ready: false,
      checks: [
        { name: "database", ready: true },
        { name: "auth-database", ready: false },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("private connection detail");
  });
});
