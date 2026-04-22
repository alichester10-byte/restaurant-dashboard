import { SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanFromPriceId, getStripe, getStripeWebhookSecret, mapStripeStatus } from "@/lib/stripe";

async function syncBusinessFromSubscription(subscription: Stripe.Subscription) {
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const mappedStatus = mapStripeStatus(subscription.status);
  const currentPeriodEnd = subscription.items.data.reduce<number | null>((latest, item) => {
    if (!item.current_period_end) {
      return latest;
    }

    return latest === null ? item.current_period_end : Math.max(latest, item.current_period_end);
  }, null);

  await prisma.business.updateMany({
    where: {
      OR: [
        { stripeCustomerId },
        { stripeSubscriptionId: subscription.id }
      ]
    },
    data: {
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionPlan: getPlanFromPriceId(priceId),
      subscriptionStatus: mappedStatus,
      subscriptionCurrentPeriodEndsAt: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000)
        : null,
      trialEndsAt: mappedStatus === SubscriptionStatus.ACTIVE ? null : undefined
    }
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch (error) {
    return new NextResponse(`Webhook Error: ${(error as Error).message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription && session.customer) {
        const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
        await syncBusinessFromSubscription(subscription);

        const businessId = session.metadata?.businessId ?? session.client_reference_id;
        if (businessId) {
          await prisma.business.update({
            where: {
              id: businessId
            },
            data: {
              stripeCustomerId: String(session.customer),
              stripeSubscriptionId: String(session.subscription),
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionPlan: getPlanFromPriceId(subscription.items.data[0]?.price.id),
              stripePriceId: subscription.items.data[0]?.price.id ?? null,
              trialEndsAt: null,
              lastPaymentFailedAt: null
            }
          });
        }
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await syncBusinessFromSubscription(subscription);

      if (event.type === "customer.subscription.deleted") {
        await prisma.business.updateMany({
          where: {
            stripeSubscriptionId: subscription.id
          },
          data: {
            subscriptionStatus: SubscriptionStatus.CANCELED,
            subscriptionCurrentPeriodEndsAt: null
          }
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        await prisma.business.updateMany({
          where: {
            stripeCustomerId: customerId
          },
          data: {
            subscriptionStatus: SubscriptionStatus.PAST_DUE,
            lastPaymentFailedAt: new Date()
          }
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
