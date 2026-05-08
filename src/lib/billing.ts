import { Business, SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { getEffectivePlan, getPlanConfig, planConfig, planOrder } from "@/lib/plan-config";

export { planOrder };

export const paidPlans = new Set<SubscriptionPlan>([
  SubscriptionPlan.STARTER,
  SubscriptionPlan.PRO,
  SubscriptionPlan.BUSINESS,
  SubscriptionPlan.ENTERPRISE
]);

export const planCatalog = planConfig;

export function isTrialActive(business: Pick<Business, "trialEndsAt" | "subscriptionStatus">) {
  return business.subscriptionStatus === SubscriptionStatus.TRIALING && !!business.trialEndsAt && business.trialEndsAt > new Date();
}

export function hasActiveSubscription(business: Pick<Business, "subscriptionStatus">) {
  return business.subscriptionStatus === SubscriptionStatus.ACTIVE;
}

export function getPlanPricing(plan: SubscriptionPlan) {
  return getPlanConfig(plan);
}

type BusinessBillingSnapshot = Pick<
  Business,
  | "status"
  | "subscriptionStatus"
  | "subscriptionPlan"
  | "trialEndsAt"
  | "subscriptionCurrentPeriodEndsAt"
>;

export function hasWriteAccess(business: BusinessBillingSnapshot, role: UserRole) {
  if (role === UserRole.SUPER_ADMIN) {
    return true;
  }

  if (business.status !== "ACTIVE") {
    return false;
  }

  const plan = getEffectivePlan({
    subscriptionPlan: business.subscriptionPlan,
    subscriptionStatus: business.subscriptionStatus
  });

  if (business.subscriptionStatus === SubscriptionStatus.ACTIVE) {
    return plan !== SubscriptionPlan.FREE;
  }

  return false;
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
  const effectivePlan = getEffectivePlan({
    subscriptionPlan: business.subscriptionPlan,
    subscriptionStatus: business.subscriptionStatus
  });
  const config = getPlanConfig(effectivePlan);

  return {
    isSuperAdmin,
    canRead,
    canWrite,
    isDemo: demoMode,
    isPro: canWrite && !isSuperAdmin,
    effectivePlan,
    features: {
      aiAssistant: config.aiAssistantEnabled,
      whatsappInstagram: config.whatsappInstagramEnabled,
      multiLocation: config.multiLocation,
      advancedAi: config.advancedAi,
      prioritySupport: config.prioritySupport
    },
    modeLabel: isSuperAdmin ? "Platform Erişimi" : demoMode ? "Demo Modu" : `${config.title} Plan`,
    modeDescription: isSuperAdmin
      ? "Tüm işletmeleri kesintisiz yönetebilirsiniz."
      : demoMode
        ? "Tüm ekranları keşfedin, ancak değişiklikleri kaydetmek veya gelişmiş kanalları açmak için plan yükseltin."
        : `${config.title} planı aktif. Kullanım limitleri ve özellikler planınıza göre uygulanır.`
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
  const durationDays = getPlanConfig(plan).durationDays;
  const base = currentPeriodEndsAt && currentPeriodEndsAt > new Date() ? new Date(currentPeriodEndsAt) : new Date();
  base.setDate(base.getDate() + durationDays);
  return base;
}
