import { describe, expect, it } from "vitest";
import {
  handledStripeWebhookEvents,
  isHandledStripeWebhookEvent,
  processedStripeEventKey,
  STRIPE_WEBHOOK_EVENT_ID_IDEMPOTENCY_KEY,
} from "@/lib/billing/stripe-webhook-contract";

describe("Stripe webhook safety contract", () => {
  it("documents the Stripe events the starter expects to handle", () => {
    expect(handledStripeWebhookEvents).toEqual(
      expect.arrayContaining([
        "checkout.session.completed",
        "invoice.paid",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
      ]),
    );
  });

  it("uses the Stripe event id as the webhook idempotency boundary", () => {
    expect(STRIPE_WEBHOOK_EVENT_ID_IDEMPOTENCY_KEY).toBe("stripe_event_id");
    expect(processedStripeEventKey("evt_123")).toBe("stripe_event:evt_123");
    expect(() => processedStripeEventKey("")).toThrow("event_id");
  });

  it("narrows handled webhook event types", () => {
    expect(isHandledStripeWebhookEvent("invoice.paid")).toBe(true);
    expect(isHandledStripeWebhookEvent("customer.created")).toBe(false);
  });
});
