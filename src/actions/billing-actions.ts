"use server";

import { SubscriptionPlan, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAppBaseUrl } from "@/lib/billing";
import { requireBusinessAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPriceIdForPlan, getStripe } from "@/lib/stripe";

export async function createCheckoutSessionAction(formData: FormData) {
  const session = await requireBusinessAccess({
    allowInactive: true,
    roles: [UserRole.BUSINESS_ADMIN]
  });

  const plan = formData.get("plan") as SubscriptionPlan;
  if (plan !== SubscriptionPlan.PRO) {
    redirect("/billing?error=unsupported_plan");
  }

  const business = await prisma.business.findUniqueOrThrow({
    where: {
      id: session.user.businessId
    }
  });

  const stripe = getStripe();
  let customerId = business.stripeCustomerId ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: business.name,
      metadata: {
        businessId: business.id,
        businessSlug: business.slug
      }
    });
    customerId = customer.id;

    await prisma.business.update({
      where: {
        id: business.id
      },
      data: {
        stripeCustomerId: customerId
      }
    });
  }

  const baseUrl = getAppBaseUrl();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    allow_promotion_codes: true,
    success_url: `${baseUrl}/billing?checkout=success`,
    cancel_url: `${baseUrl}/billing?checkout=cancelled`,
    client_reference_id: business.id,
    metadata: {
      businessId: business.id,
      targetPlan: plan
    },
    subscription_data: {
      metadata: {
        businessId: business.id,
        targetPlan: plan
      }
    },
    line_items: [
      {
        price: getPriceIdForPlan(plan)!,
        quantity: 1
      }
    ]
  });

  if (!checkoutSession.url) {
    redirect("/billing?error=checkout_failed");
  }

  redirect(checkoutSession.url);
}

export async function createBillingPortalAction() {
  const session = await requireBusinessAccess({
    allowInactive: true,
    roles: [UserRole.BUSINESS_ADMIN]
  });

  const business = await prisma.business.findUniqueOrThrow({
    where: {
      id: session.user.businessId
    }
  });

  if (!business.stripeCustomerId) {
    redirect("/billing?error=no_customer");
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: business.stripeCustomerId,
    return_url: `${getAppBaseUrl()}/billing`
  });

  redirect(portal.url);
}

export async function openEnterpriseContactAction() {
  await requireBusinessAccess({
    allowInactive: true,
    roles: [UserRole.BUSINESS_ADMIN]
  });
  redirect("mailto:sales@limonmasa.com?subject=Enterprise%20Plan%20Talebi");
}
