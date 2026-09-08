import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

/**
 * Shared Stripe client.
 *
 * Lazily constructed so App Router build-time module evaluation can import
 * billing code without creating a service SDK client.
 */
export const isStripeConfigured = !!env.STRIPE_SECRET_KEY;

let stripeClient: Stripe | undefined;

function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY ?? "stripe_not_configured");
  }

  return stripeClient;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const target = getStripe();
    const value = Reflect.get(target, prop, receiver);
    return typeof value === "function" ? value.bind(target) : value;
  },
  has(_target, prop) {
    return prop in getStripe();
  },
  ownKeys() {
    return Reflect.ownKeys(getStripe());
  },
  getOwnPropertyDescriptor(_target, prop) {
    const descriptor = Reflect.getOwnPropertyDescriptor(getStripe(), prop);
    if (descriptor) descriptor.configurable = true;
    return descriptor;
  },
}) as Stripe;
