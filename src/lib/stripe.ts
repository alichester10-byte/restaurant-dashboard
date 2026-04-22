import Stripe from "stripe";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil"
  });

  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return secret;
}

export function getPriceIdForPlan(plan: SubscriptionPlan) {
  if (plan === SubscriptionPlan.PRO) {
    const priceId = process.env.STRIPE_PRICE_PRO;
    if (!priceId) {
      throw new Error("STRIPE_PRICE_PRO is not configured.");
    }
    return priceId;
  }

  return null;
}

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "past_due":
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
    case "paused":
      return SubscriptionStatus.CANCELED;
    default:
      return SubscriptionStatus.PAST_DUE;
  }
}

export function getPlanFromPriceId(priceId?: string | null) {
  if (!priceId) {
    return SubscriptionPlan.STARTER;
  }

  if (priceId === process.env.STRIPE_PRICE_PRO) {
    return SubscriptionPlan.PRO;
  }

  return SubscriptionPlan.ENTERPRISE;
}
