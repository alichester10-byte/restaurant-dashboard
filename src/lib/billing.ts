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
    description: "Canlı restoran operasyonları, ekip erişimi ve tam ürün kullanımı için.",
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

type BusinessBillingSnapshot = Pick<
  Business,
  "status" | "subscriptionStatus" | "subscriptionPlan" | "trialEndsAt" | "subscriptionCurrentPeriodEndsAt"
>;

export function hasWriteAccess(business: BusinessBillingSnapshot, role: UserRole) {
  if (role === UserRole.SUPER_ADMIN) {
    return true;
  }

  if (business.status !== "ACTIVE") {
    return false;
  }

  return (
    business.subscriptionStatus === SubscriptionStatus.ACTIVE &&
    (business.subscriptionPlan === SubscriptionPlan.PRO || business.subscriptionPlan === SubscriptionPlan.ENTERPRISE)
  );
}

export function hasBusinessAccess(
  business: BusinessBillingSnapshot,
  role: UserRole
) {
  if (role === UserRole.SUPER_ADMIN) {
    return true;
  }

  return business.status === "ACTIVE";
}

export function isDemoMode(business: BusinessBillingSnapshot, role: UserRole) {
  return hasBusinessAccess(business, role) && !hasWriteAccess(business, role);
}

export function getBusinessEntitlement(business: BusinessBillingSnapshot, role: UserRole) {
  const isSuperAdmin = role === UserRole.SUPER_ADMIN;
  const canRead = hasBusinessAccess(business, role);
  const canWrite = hasWriteAccess(business, role);
  const demoMode = isDemoMode(business, role);

  return {
    isSuperAdmin,
    canRead,
    canWrite,
    isDemo: demoMode,
    isPro: canWrite && !isSuperAdmin,
    modeLabel: isSuperAdmin ? "Platform Erişimi" : demoMode ? "Demo Modu" : "Pro Mod",
    modeDescription: isSuperAdmin
      ? "Tüm işletmeleri kesintisiz yönetebilirsiniz."
      : demoMode
        ? "Tüm ekranları keşfedin, ancak değişiklikleri kaydetmek için Pro'ya geçin."
        : "Tüm operasyon araçları ve kayıt akışları aktif."
  };
}

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function getCanonicalAppUrl() {
  const baseUrl = getAppBaseUrl();

  try {
    const url = new URL(baseUrl);
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return baseUrl.replace(/\/+$/, "");
  }
}

export function calculateSubscriptionPeriodEnd(plan: SubscriptionPlan, currentPeriodEndsAt?: Date | null) {
  const durationDays = planCatalog[plan].durationDays;
  const base = currentPeriodEndsAt && currentPeriodEndsAt > new Date() ? new Date(currentPeriodEndsAt) : new Date();
  base.setDate(base.getDate() + durationDays);
  return base;
}
