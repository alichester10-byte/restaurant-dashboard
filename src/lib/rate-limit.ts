import { prisma } from "@/lib/prisma";

const defaults: Record<string, { limit: number; windowMinutes: number; blockMinutes: number }> = {
  login: { limit: 8, windowMinutes: 15, blockMinutes: 30 },
  register: { limit: 6, windowMinutes: 60, blockMinutes: 60 },
  "forgot-password": { limit: 5, windowMinutes: 30, blockMinutes: 60 },
  "payment-initiate": { limit: 8, windowMinutes: 30, blockMinutes: 30 },
  webhook: { limit: 120, windowMinutes: 1, blockMinutes: 15 },
  "reservation-request": { limit: 40, windowMinutes: 15, blockMinutes: 15 }
};

function getWindowKey(windowMinutes: number) {
  return Math.floor(Date.now() / (windowMinutes * 60 * 1000)).toString();
}

export async function rateLimitPlaceholder(identifier: string, action: string, businessId?: string | null) {
  const rule = defaults[action] ?? { limit: 30, windowMinutes: 15, blockMinutes: 15 };
  const windowKey = getWindowKey(rule.windowMinutes);
  const bucket = await prisma.rateLimitBucket.upsert({
    where: {
      action_identifier_windowKey: {
        action,
        identifier,
        windowKey
      }
    },
    update: {
      count: {
        increment: 1
      },
      lastSeenAt: new Date()
    },
    create: {
      action,
      identifier,
      windowKey,
      count: 1,
      businessId: businessId ?? undefined
    }
  });

  if (bucket.blockedUntil && bucket.blockedUntil > new Date()) {
    return {
      allowed: false,
      remaining: 0
    };
  }

  if (bucket.count > rule.limit) {
    await prisma.rateLimitBucket.update({
      where: {
        id: bucket.id
      },
      data: {
        blockedUntil: new Date(Date.now() + rule.blockMinutes * 60 * 1000)
      }
    });

    return {
      allowed: false,
      remaining: 0
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, rule.limit - bucket.count)
  };
}
