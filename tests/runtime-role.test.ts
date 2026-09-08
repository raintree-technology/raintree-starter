import { describe, expect, it } from "vitest";
import { assertSafeRuntimeRole } from "@/lib/db/runtime-role";

describe("runtime database role", () => {
  it("accepts a least-privilege role", () => {
    expect(() =>
      assertSafeRuntimeRole({
        name: "app_runtime",
        superuser: false,
        bypassRls: false,
        ownedTenantTables: [],
      }),
    ).not.toThrow();
  });

  it.each([
    {
      posture: {
        name: "owner",
        superuser: true,
        bypassRls: false,
        ownedTenantTables: [],
      },
      message: "must not be a superuser",
    },
    {
      posture: {
        name: "worker",
        superuser: false,
        bypassRls: true,
        ownedTenantTables: [],
      },
      message: "must not have BYPASSRLS",
    },
    {
      posture: {
        name: "owner",
        superuser: false,
        bypassRls: false,
        ownedTenantTables: ["project"],
      },
      message: "must not own tenant tables",
    },
  ])("rejects unsafe posture: $message", ({ posture, message }) => {
    expect(() => assertSafeRuntimeRole(posture)).toThrow(message);
  });
});
