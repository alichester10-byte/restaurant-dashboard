import {
  AuditCategory,
  AuditSeverity,
  BillingPaymentStatus,
  IntegrationProvider,
  IntegrationStatus,
  Prisma,
  ReservationRequestStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole
} from "@prisma/client";
import { isEmailDeliveryConfigured } from "@/lib/email";
import { getEmailTwoFactorSchemaStatus } from "@/lib/email-two-factor-runtime";
import { getMetaEnvironmentDiagnostics } from "@/lib/meta";
import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay } from "@/lib/utils";

function maskSecret(value?: string | null) {
  if (!value) {
    return "Eksik";
  }

  if (value.length <= 8) {
    return `${value.slice(0, 2)}••••`;
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

async function getPlatformConfig() {
  return prisma.platformConfig.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" }
  });
}

export async function getSuperAdminOverviewData() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    totalBusinesses,
    activeBusinesses,
    trialBusinesses,
    proBusinesses,
    suspendedBusinesses,
    totalUsers,
    pendingReservationRequests,
    failedIntegrations,
    todaysReservations,
    todaysMessages,
    sessionCount,
    schemaStatus
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: "ACTIVE" } }),
    prisma.business.count({ where: { subscriptionStatus: SubscriptionStatus.TRIALING } }),
    prisma.business.count({ where: { subscriptionPlan: SubscriptionPlan.PRO } }),
    prisma.business.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count(),
    prisma.reservationRequest.count({ where: { status: ReservationRequestStatus.PENDING } }),
    prisma.integrationConnection.count({ where: { status: IntegrationStatus.ERROR } }),
    prisma.reservation.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.reservationRequest.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    getEmailTwoFactorSchemaStatus()
  ]);

  const emailConfigured = isEmailDeliveryConfigured();
  const metaDiagnostics = getMetaEnvironmentDiagnostics();

  return {
    stats: {
      totalBusinesses,
      activeBusinesses,
      trialBusinesses,
      proBusinesses,
      suspendedBusinesses,
      totalUsers,
      pendingReservationRequests,
      failedIntegrations,
      todaysReservations,
      todaysMessages,
      sessionCount
    },
    systemStatus: {
      database: "healthy",
      emailConfigured,
      metaReady: metaDiagnostics.missing.length === 0,
      emailTwoFactorSchemaReady: schemaStatus.ready
    }
  };
}

export async function getSuperAdminBusinessesCenterData(input?: {
  search?: string;
  filter?: "all" | "demo" | "pro" | "suspended" | "trial";
}) {
  const search = input?.search?.trim();
  const filter = input?.filter ?? "all";

  const businesses = await prisma.business.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { ownerName: { contains: search, mode: "insensitive" } },
              { ownerEmail: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(filter === "demo"
        ? { subscriptionPlan: SubscriptionPlan.STARTER }
        : filter === "pro"
          ? { subscriptionPlan: SubscriptionPlan.PRO }
          : filter === "suspended"
            ? { status: "SUSPENDED" }
            : filter === "trial"
              ? { subscriptionStatus: SubscriptionStatus.TRIALING }
              : {})
    },
    include: {
      users: {
        orderBy: { createdAt: "asc" }
      },
      integrationConnections: true,
      billingPayments: {
        take: 1,
        orderBy: { createdAt: "desc" }
      },
      _count: {
        select: {
          reservations: true,
          customers: true,
          tables: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return businesses.map((business) => {
    const owner = business.users.find((user) => user.role === UserRole.BUSINESS_ADMIN) ?? business.users[0] ?? null;
    const lastLoginAt = business.users
      .map((user) => user.lastLoginAt)
      .filter(Boolean)
      .sort((a, b) => (b?.getTime() ?? 0) - (a?.getTime() ?? 0))[0] ?? null;
    const channels = {
      whatsapp: business.integrationConnections.some((item) => item.provider === IntegrationProvider.WHATSAPP && item.status === IntegrationStatus.CONNECTED),
      instagram: business.integrationConnections.some((item) => item.provider === IntegrationProvider.INSTAGRAM && item.status === IntegrationStatus.CONNECTED),
      website: business.integrationConnections.some((item) => item.provider === IntegrationProvider.WEBSITE_WIDGET && item.status === IntegrationStatus.CONNECTED),
      ai: business.integrationConnections.some((item) => item.provider === IntegrationProvider.AI_ASSISTANT && item.status !== IntegrationStatus.NOT_CONNECTED)
    };

    return {
      ...business,
      owner,
      lastLoginAt,
      channels,
      metaStatus: business.integrationConnections.some((item) => item.provider === IntegrationProvider.WHATSAPP || item.provider === IntegrationProvider.INSTAGRAM)
        ? business.integrationConnections.some((item) => item.status === IntegrationStatus.ERROR)
          ? "error"
          : "configured"
        : "setup_required",
      latestPayment: business.billingPayments[0] ?? null
    };
  });
}

export async function getSuperAdminUsersCenterData(input?: { search?: string }) {
  const search = input?.search?.trim();
  const schemaStatus = await getEmailTwoFactorSchemaStatus();
  const users = await prisma.user.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { business: { is: { name: { contains: search, mode: "insensitive" } } } }
            ]
          }
        : {})
    },
    include: {
      business: true
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }]
  });

  return {
    users,
    schemaStatus
  };
}

export async function getSuperAdminSecurityCenterData(currentUserId: string) {
  const [sessions, suspiciousLogins, failedLogins, passwordResetEvents, twoFactorLogs, activeSuperAdmins] = await Promise.all([
    prisma.session.findMany({
      where: {
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: { business: true }
        }
      },
      orderBy: { lastSeenAt: "desc" },
      take: 50
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { severity: AuditSeverity.CRITICAL },
          { action: { in: ["login_locked", "login_rate_limited", "callback_hash_invalid", "login_blocked_disabled_account"] } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 25
    }),
    prisma.auditLog.findMany({
      where: {
        category: AuditCategory.AUTH,
        action: { in: ["login_failed", "login_rate_limited", "login_locked"] }
      },
      orderBy: { createdAt: "desc" },
      take: 25
    }),
    prisma.auditLog.findMany({
      where: {
        category: AuditCategory.AUTH,
        action: { in: ["password_reset_requested", "password_reset_completed", "password_reset_forced"] }
      },
      orderBy: { createdAt: "desc" },
      take: 25
    }),
    prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "email_two_factor_enabled",
            "email_two_factor_disabled",
            "super_admin_email_two_factor_forced",
            "super_admin_email_two_factor_relaxed"
          ]
        }
      },
      orderBy: { createdAt: "desc" },
      take: 25
    }),
    prisma.user.findMany({
      where: {
        role: UserRole.SUPER_ADMIN
      },
      include: {
        business: true
      },
      orderBy: { createdAt: "asc" }
    })
  ]);

  return {
    sessions,
    suspiciousLogins,
    failedLogins,
    passwordResetEvents,
    twoFactorLogs,
    activeSuperAdmins,
    currentUserId
  };
}

export async function getSuperAdminMetaCenterData() {
  const diagnostics = getMetaEnvironmentDiagnostics();
  const [connections, recentWebhookLogs, failedCallbackLogs, platformConfig] = await Promise.all([
    prisma.integrationConnection.findMany({
      where: {
        provider: {
          in: [IntegrationProvider.WHATSAPP, IntegrationProvider.INSTAGRAM]
        }
      },
      include: {
        business: true
      },
      orderBy: [{ provider: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.auditLog.findMany({
      where: {
        category: AuditCategory.WEBHOOK
      },
      orderBy: { createdAt: "desc" },
      take: 25
    }),
    prisma.auditLog.findMany({
      where: {
        category: AuditCategory.INTEGRATION,
        severity: {
          in: [AuditSeverity.WARN, AuditSeverity.CRITICAL]
        }
      },
      orderBy: { createdAt: "desc" },
      take: 25
    }),
    getPlatformConfig()
  ]);

  return {
    diagnostics,
    platformConfig,
    connections,
    recentWebhookLogs,
    failedCallbackLogs,
    masked: {
      appId: maskSecret(process.env.META_APP_ID),
      configId: maskSecret(process.env.META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID),
      verifyToken: maskSecret(process.env.META_WEBHOOK_VERIFY_TOKEN),
      appSecret: maskSecret(process.env.META_APP_SECRET),
      accessToken: maskSecret(process.env.META_ACCESS_TOKEN)
    }
  };
}

export async function getSuperAdminBillingCenterData() {
  const [businesses, failedPayments] = await Promise.all([
    prisma.business.findMany({
      include: {
        billingPayments: {
          orderBy: { createdAt: "desc" },
          take: 3
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.billingPayment.findMany({
      where: {
        status: BillingPaymentStatus.FAILED
      },
      include: {
        business: true
      },
      orderBy: { createdAt: "desc" },
      take: 25
    })
  ]);

  return {
    businesses,
    failedPayments
  };
}

export async function getSuperAdminLegalCenterData() {
  const [platformConfig, complianceRequests, recentDeletionLogs] = await Promise.all([
    getPlatformConfig(),
    prisma.complianceRequest.findMany({
      include: {
        business: true,
        requestedByUser: true
      },
      orderBy: { createdAt: "desc" },
      take: 30
    }),
    prisma.auditLog.findMany({
      where: {
        action: {
          in: ["compliance_request_created", "compliance_request_updated", "business_data_reset"]
        }
      },
      orderBy: { createdAt: "desc" },
      take: 25
    })
  ]);

  return {
    platformConfig,
    complianceRequests,
    recentDeletionLogs
  };
}

export async function getSuperAdminAuditCenterData(input?: {
  search?: string;
  severity?: AuditSeverity | "all";
  category?: AuditCategory | "all";
}) {
  const search = input?.search?.trim();
  const severity = input?.severity ?? "all";
  const category = input?.category ?? "all";

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(severity === "all" ? {} : { severity }),
      ...(category === "all" ? {} : { category }),
      ...(search
        ? {
            OR: [
              { action: { contains: search, mode: "insensitive" } },
              { message: { contains: search, mode: "insensitive" } },
              { targetId: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return {
    logs
  };
}

export async function getSuperAdminSystemCenterData() {
  const [platformConfig, schemaStatus, reminderBusinesses, criticalLogs] = await Promise.all([
    getPlatformConfig(),
    getEmailTwoFactorSchemaStatus(),
    prisma.restaurantSettings.count({
      where: {
        reminderEnabled: true
      }
    }),
    prisma.auditLog.findMany({
      where: {
        severity: AuditSeverity.CRITICAL
      },
      orderBy: { createdAt: "desc" },
      take: 15
    })
  ]);

  const dbStatus = await prisma.$queryRaw<Array<{ ok: number }>>(Prisma.sql`SELECT 1 as ok`);
  const metaDiagnostics = getMetaEnvironmentDiagnostics();

  return {
    platformConfig,
    dbHealthy: dbStatus[0]?.ok === 1,
    emailConfigured: isEmailDeliveryConfigured(),
    metaDiagnostics,
    reminderBusinesses,
    schemaStatus,
    criticalLogs,
    cronReady: Boolean(process.env.CRON_SECRET),
    buildMarker:
      platformConfig.deploymentMarker ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.VERCEL_DEPLOYMENT_ID ??
      "local"
  };
}
