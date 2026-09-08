import "server-only";
import { runAfterResponse } from "@/lib/after";
import { logger } from "@/lib/logger";

export type AuthAuditEvent = {
  type:
    | "auth.access.allowed"
    | "auth.access.denied"
    | "project.create.allowed"
    | "project.create.denied"
    | "project.delete.allowed"
    | "project.delete.denied";
  actorId: string | null;
  organizationId?: string | null;
  resource?: string;
  result: "allowed" | "denied";
  at?: Date;
};

export type AuthAuditSink = (
  event: Required<AuthAuditEvent>,
) => Promise<void> | void;

const authAuditLogger = logger.child({ module: "auth.audit" });

let authAuditSink: AuthAuditSink = (event) => {
  authAuditLogger.info(
    {
      ...event,
      at: event.at.toISOString(),
    },
    event.type,
  );
};

export function setAuthAuditSink(sink: AuthAuditSink): void {
  authAuditSink = sink;
}

export async function auditAuthEvent(event: AuthAuditEvent): Promise<void> {
  await authAuditSink({
    ...event,
    organizationId: event.organizationId ?? null,
    resource: event.resource ?? "",
    at: event.at ?? new Date(),
  });
}

export function auditAuthEventAfterResponse(event: AuthAuditEvent): void {
  runAfterResponse(event.type, () => auditAuthEvent(event), {
    module: "auth.audit",
    auditType: event.type,
    actorId: event.actorId,
    organizationId: event.organizationId ?? null,
    resource: event.resource ?? "",
    result: event.result,
  });
}
