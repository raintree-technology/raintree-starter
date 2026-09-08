import { describe, expect, it } from "vitest";
import {
  type AuthAuditEvent,
  auditAuthEvent,
  setAuthAuditSink,
} from "@/lib/auth-audit";

describe("auth audit events", () => {
  it("normalizes and emits authorization decisions", async () => {
    const emitted: Required<AuthAuditEvent>[] = [];
    setAuthAuditSink((event) => {
      emitted.push(event);
    });

    await auditAuthEvent({
      type: "auth.access.denied",
      actorId: "user_123",
      organizationId: null,
      resource: "/dashboard/admin",
      result: "denied",
      at: new Date("2026-07-07T00:00:00.000Z"),
    });

    expect(emitted).toEqual([
      {
        type: "auth.access.denied",
        actorId: "user_123",
        organizationId: null,
        resource: "/dashboard/admin",
        result: "denied",
        at: new Date("2026-07-07T00:00:00.000Z"),
      },
    ]);
  });
});
