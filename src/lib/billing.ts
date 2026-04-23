import { Business, SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";

export const planOrder: SubscriptionPlan[] = [
  SubscriptionPlan.STARTER,
  SubscriptionPlan.PRO,
  SubscriptionPlan.ENTERPRISE
];

export const paidPlans = new Set<SubscriptionPlan>([
  SubscriptionPlan.PRO
]);

export const planCatalog: Record<
  SubscriptionPlan,
  {
    title: string;
    amountMinor: number;
    amountLabel: string;
    durationDays: number;
    description: string;
    cta: string;
    purchasable: boolean;
  }
> = {
  [SubscriptionPlan.STARTER]: {
    title: "Starter",
    amountMinor: 0,
    amountLabel: "Ücretsiz / Trial",
    durationDays: 14,
    description: "Onboarding, temel operasyon ekranları ve başlangıç kullanımı için idealdir.",
    cta: "Mevcut Trial",
    purchasable: false
  },
  [SubscriptionPlan.PRO]: {
    title: "Pro",
    amountMinor: 29990,
    amountLabel: "299,90 TL / ay",
    durationDays: 30,
    description: "Canlı restoran operasyonları, tenant erişim kontrolü ve yönetici faturalama akışı için.",
    cta: "PAYTR ile Öde",
    purchasable: true
  },
  [SubscriptionPlan.ENTERPRISE]: {
    title: "Enterprise",
    amountMinor: 0,
    amountLabel: "Teklif usulü",
    durationDays: 30,
    description: "Çok lokasyon, özel SLA, onboarding desteği ve sözleşmeli satış akışı için hazırdır.",
    cta: "Satış ile Görüş",
    purchasable: false
  }
};

export function isTrialActive(business: Pick<Business, "trialEndsAt" | "subscriptionStatus">) {
  return business.subscriptionStatus === SubscriptionStatus.TRIALING && !!business.trialEndsAt && business.trialEndsAt > new Date();
}

export function hasActiveSubscription(business: Pick<Business, "subscriptionStatus">) {
  return business.subscriptionStatus === SubscriptionStatus.ACTIVE;
}

export function getPlanPricing(plan: SubscriptionPlan) {
  return planCatalog[plan];
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

export function calculateSubscriptionPeriodEnd(plan: SubscriptionPlan, currentPeriodEndsAt?: Date | null) {
  const durationDays = planCatalog[plan].durationDays;
  const base = currentPeriodEndsAt && currentPeriodEndsAt > new Date() ? new Date(currentPeriodEndsAt) : new Date();
  base.setDate(base.getDate() + durationDays);
  return base;
}
