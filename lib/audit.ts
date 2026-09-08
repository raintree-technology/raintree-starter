import "server-only";
import * as schema from "@/db/schema";
import type { RlsActor, RlsTransaction } from "@/lib/db/rls";

export type DurableAuditEvent = {
  action: string;
  actor: RlsActor;
  resourceType: string;
  resourceId?: string | null;
  result: "allowed" | "denied";
  metadata?: Record<string, unknown>;
};

/**
 * Write an audit event inside the transaction that performs the sensitive
 * operation. This keeps successful mutation records atomic with the mutation.
 */
export async function writeAuditEvent(
  tx: RlsTransaction,
  event: DurableAuditEvent,
): Promise<void> {
  await tx.insert(schema.auditEvent).values({
    action: event.action,
    actorUserId: event.actor.userId,
    organizationId: event.actor.organizationId,
    resourceType: event.resourceType,
    resourceId: event.resourceId ?? null,
    result: event.result,
    metadata: event.metadata ?? {},
  });
}
