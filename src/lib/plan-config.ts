import "server-only";

import { ChatMessageRole, IntegrationProvider, IntegrationStatus, Prisma, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PlanFeatureKey =
  | "aiAssistant"
  | "advancedAi"
  | "whatsappIntegration"
  | "instagramIntegration"
  | "multiLocation"
  | "prioritySupport";

export type PlanUsageKey =
  | "monthlyReservationRequests"
  | "monthlyAiMessages"
  | "services"
  | "staff"
  | "resources"
  | "connectedIntegrations"
  | "businesses";

type PlanConfig = {
  title: string;
  monthlyReservationRequests: number | null;
  monthlyAiMessages: number | null;
  maxBusinesses: number | null;
  maxServices: number | null;
  maxStaff: number | null;
  maxResources: number | null;
  aiAssistantEnabled: boolean;
  advancedAi: boolean;
  whatsappInstagramEnabled: boolean;
  multiLocation: boolean;
  prioritySupport: boolean;
  amountMinor: number;
  amountLabel: string;
  durationDays: number;
  description: string;
  cta: string;
  purchasable: boolean;
};

export class PlanLimitError extends Error {
  code: PlanUsageKey | PlanFeatureKey;
  upgradeTo?: SubscriptionPlan;

  constructor(code: PlanUsageKey | PlanFeatureKey, message: string, upgradeTo?: SubscriptionPlan) {
    super(message);
    this.code = code;
    this.upgradeTo = upgradeTo;
  }
}

function buildUpgradeMessage(planTitle: string) {
  return `Your current plan limit has been reached. Please upgrade to continue. (${planTitle})`;
}

export const planConfig: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.FREE]: {
    title: "Free",
    monthlyReservationRequests: 50,
    monthlyAiMessages: 0,
    maxBusinesses: 1,
    maxServices: 3,
    maxStaff: 1,
    maxResources: 3,
    aiAssistantEnabled: false,
    advancedAi: false,
    whatsappInstagramEnabled: false,
    multiLocation: false,
    prioritySupport: false,
    amountMinor: 0,
    amountLabel: "Ücretsiz",
    durationDays: 30,
    description: "Temel kullanım ve ilk kanal talepleri için başlangıç planı.",
    cta: "Ücretsiz Başla",
    purchasable: false
  },
  [SubscriptionPlan.STARTER]: {
    title: "Starter",
    monthlyReservationRequests: 300,
    monthlyAiMessages: 120,
    maxBusinesses: 1,
    maxServices: 10,
    maxStaff: 5,
    maxResources: 10,
    aiAssistantEnabled: true,
    advancedAi: false,
    whatsappInstagramEnabled: false,
    multiLocation: false,
    prioritySupport: false,
    amountMinor: 0,
    amountLabel: "Başlangıç Planı",
    durationDays: 30,
    description: "Temel operasyon, sınırlı AI ve çoklu hizmet yapısı için.",
    cta: "Starter'a Geç",
    purchasable: false
  },
  [SubscriptionPlan.PRO]: {
    title: "Pro",
    monthlyReservationRequests: 1500,
    monthlyAiMessages: 1500,
    maxBusinesses: 1,
    maxServices: null,
    maxStaff: 20,
    maxResources: 50,
    aiAssistantEnabled: true,
    advancedAi: false,
    whatsappInstagramEnabled: true,
    multiLocation: false,
    prioritySupport: false,
    amountMinor: 29990,
    amountLabel: "299,90 TL / ay",
    durationDays: 30,
    description: "Canlı operasyon, AI asistan ve sosyal kanal bağlantıları için.",
    cta: "PAYTR ile Öde",
    purchasable: true
  },
  [SubscriptionPlan.BUSINESS]: {
    title: "Business",
    monthlyReservationRequests: 5000,
    monthlyAiMessages: 5000,
    maxBusinesses: 5,
    maxServices: null,
    maxStaff: null,
    maxResources: null,
    aiAssistantEnabled: true,
    advancedAi: true,
    whatsappInstagramEnabled: true,
    multiLocation: true,
    prioritySupport: true,
    amountMinor: 0,
    amountLabel: "Teklif usulü",
    durationDays: 30,
    description: "Çok lokasyon, gelişmiş AI ve öncelikli destek gerektiren işletmeler için.",
    cta: "Satış ile Görüş",
    purchasable: false
  },
  [SubscriptionPlan.ENTERPRISE]: {
    title: "Enterprise",
    monthlyReservationRequests: null,
    monthlyAiMessages: null,
    maxBusinesses: null,
    maxServices: null,
    maxStaff: null,
    maxResources: null,
    aiAssistantEnabled: true,
    advancedAi: true,
    whatsappInstagramEnabled: true,
    multiLocation: true,
    prioritySupport: true,
    amountMinor: 0,
    amountLabel: "Kurumsal teklif",
    durationDays: 30,
    description: "Özel limitler, sözleşmeli destek ve ileri entegrasyonlar için.",
    cta: "Özel Teklif",
    purchasable: false
  }
};

export const planOrder: SubscriptionPlan[] = [
  SubscriptionPlan.FREE,
  SubscriptionPlan.STARTER,
  SubscriptionPlan.PRO,
  SubscriptionPlan.BUSINESS,
  SubscriptionPlan.ENTERPRISE
];

export function getEffectivePlan(input: {
  subscriptionPlan: SubscriptionPlan | null | undefined;
  subscriptionStatus?: SubscriptionStatus;
}) {
  if (!input.subscriptionPlan) {
    return SubscriptionPlan.PRO;
  }

  if (input.subscriptionPlan === SubscriptionPlan.STARTER && input.subscriptionStatus === SubscriptionStatus.ACTIVE) {
    return SubscriptionPlan.PRO;
  }

  return input.subscriptionPlan;
}

export function getPlanConfig(plan: SubscriptionPlan) {
  return planConfig[plan];
}

export function hasPlanFeature(plan: SubscriptionPlan, feature: PlanFeatureKey) {
  const config = getPlanConfig(plan);
  switch (feature) {
    case "aiAssistant":
      return config.aiAssistantEnabled;
    case "advancedAi":
      return config.advancedAi;
    case "whatsappIntegration":
    case "instagramIntegration":
      return config.whatsappInstagramEnabled;
    case "multiLocation":
      return config.multiLocation;
    case "prioritySupport":
      return config.prioritySupport;
  }
}

export function getCurrentMonthBounds() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

export async function getBusinessUsageSnapshot(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      ownerEmail: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      status: true
    }
  });

  if (!business) {
    return null;
  }

  const effectivePlan = getEffectivePlan({
    subscriptionPlan: business.subscriptionPlan,
    subscriptionStatus: business.subscriptionStatus
  });

  const { start, end } = getCurrentMonthBounds();

  const [monthlyReservationRequests, monthlyAiMessages, services, staff, resources, connectedIntegrations, businesses] = await Promise.all([
    prisma.reservationRequest.count({
      where: { businessId, createdAt: { gte: start, lt: end } }
    }),
    prisma.chatMessage.count({
      where: {
        role: ChatMessageRole.USER,
        createdAt: { gte: start, lt: end },
        session: { businessId }
      }
    }),
    prisma.service.count({ where: { businessId, isActive: true } }),
    prisma.staffMember.count({ where: { businessId, isActive: true } }),
    prisma.bookableResource.count({ where: { businessId, isActive: true } }),
    prisma.integrationConnection.count({
      where: { businessId, status: { in: [IntegrationStatus.CONNECTED, IntegrationStatus.CONNECTING] } }
    }),
    prisma.business.count({ where: { ownerEmail: business.ownerEmail } })
  ]);

  return {
    business,
    effectivePlan,
    config: getPlanConfig(effectivePlan),
    usage: {
      monthlyReservationRequests,
      monthlyAiMessages,
      services,
      staff,
      resources,
      connectedIntegrations,
      businesses
    }
  };
}

function getLimitValue(config: PlanConfig, key: PlanUsageKey) {
  switch (key) {
    case "monthlyReservationRequests":
      return config.monthlyReservationRequests;
    case "monthlyAiMessages":
      return config.monthlyAiMessages;
    case "services":
      return config.maxServices;
    case "staff":
      return config.maxStaff;
    case "resources":
      return config.maxResources;
    case "businesses":
      return config.maxBusinesses;
    case "connectedIntegrations":
      return null;
  }
}

export function getUpgradeTarget(plan: SubscriptionPlan): SubscriptionPlan | undefined {
  if (plan === SubscriptionPlan.FREE) return SubscriptionPlan.STARTER;
  if (plan === SubscriptionPlan.STARTER) return SubscriptionPlan.PRO;
  if (plan === SubscriptionPlan.PRO) return SubscriptionPlan.BUSINESS;
  if (plan === SubscriptionPlan.BUSINESS) return SubscriptionPlan.ENTERPRISE;
  return undefined;
}

export async function enforcePlanUsageLimit(businessId: string, key: PlanUsageKey, increment = 1) {
  const snapshot = await getBusinessUsageSnapshot(businessId);
  if (!snapshot) {
    return;
  }

  const limit = getLimitValue(snapshot.config, key);
  if (limit === null) {
    return;
  }

  const current = snapshot.usage[key];
  if (current + increment > limit) {
    const planName = snapshot.config.title;
    const upgradeTo = getUpgradeTarget(snapshot.effectivePlan);
    throw new PlanLimitError(
      key,
      buildUpgradeMessage(planName),
      upgradeTo
    );
  }
}

export async function enforcePlanFeature(businessId: string, feature: PlanFeatureKey, customMessage?: string) {
  const snapshot = await getBusinessUsageSnapshot(businessId);
  if (!snapshot) {
    return;
  }

  if (hasPlanFeature(snapshot.effectivePlan, feature)) {
    return;
  }

  throw new PlanLimitError(
    feature,
    customMessage ?? buildUpgradeMessage(snapshot.config.title),
    getUpgradeTarget(snapshot.effectivePlan)
  );
}

export async function getPlanOverviewForSuperAdmin() {
  const { start, end } = getCurrentMonthBounds();
  const businesses = await prisma.business.groupBy({
    by: ["subscriptionPlan"],
    _count: { _all: true }
  });
  const [monthlyRequests, monthlyAiMessages] = await Promise.all([
    prisma.reservationRequest.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.chatMessage.count({ where: { createdAt: { gte: start, lt: end }, role: ChatMessageRole.USER } })
  ]);

  return {
    businessesByPlan: businesses,
    monthlyRequests,
    monthlyAiMessages
  };
}

export function serializePlanUsage(snapshot: NonNullable<Awaited<ReturnType<typeof getBusinessUsageSnapshot>>>) {
  return {
    plan: snapshot.effectivePlan,
    config: snapshot.config,
    usage: snapshot.usage
  };
}

export type PlanUsageSnapshot = Prisma.PromiseReturnType<typeof getBusinessUsageSnapshot>;
