import { Business, SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";

export const planOrder: SubscriptionPlan[] = [
  SubscriptionPlan.STARTER,
  SubscriptionPlan.PRO,
  SubscriptionPlan.ENTERPRISE
];

export const paidPlans = new Set<SubscriptionPlan>([
  SubscriptionPlan.PRO
]);

export function isTrialActive(business: Pick<Business, "trialEndsAt" | "subscriptionStatus">) {
  return business.subscriptionStatus === SubscriptionStatus.TRIALING && !!business.trialEndsAt && business.trialEndsAt > new Date();
}

export function hasActiveSubscription(business: Pick<Business, "subscriptionStatus">) {
  return business.subscriptionStatus === SubscriptionStatus.ACTIVE;
}

export function hasBusinessAccess(
  business: Pick<Business, "status" | "subscriptionStatus" | "trialEndsAt">,
  role: UserRole
) {
  if (role === UserRole.SUPER_ADMIN) {
    return true;
  }

  if (business.status !== "ACTIVE") {
    return false;
  }

  return hasActiveSubscription(business) || isTrialActive(business);
}

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
