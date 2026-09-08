export const handledStripeWebhookEvents = [
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

export type HandledStripeWebhookEvent =
  (typeof handledStripeWebhookEvents)[number];

export const STRIPE_WEBHOOK_EVENT_ID_IDEMPOTENCY_KEY = "stripe_event_id";

export function processedStripeEventKey(eventId: string): string {
  if (!eventId) {
    throw new Error("Stripe webhook event_id is required for idempotency");
  }
  return `stripe_event:${eventId}`;
}

export function isHandledStripeWebhookEvent(
  type: string,
): type is HandledStripeWebhookEvent {
  return handledStripeWebhookEvents.includes(type as HandledStripeWebhookEvent);
}
