import {
  AuditCategory,
  CallOutcome,
  IntegrationProvider,
  IntegrationStatus,
  Prisma,
  ReminderStatus,
  ReservationRequestStatus,
  ReservationSource,
  ReservationStatus,
  TableStatus
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay } from "@/lib/utils";

const activeReservationStatuses = new Set<ReservationStatus>([
  ReservationStatus.CONFIRMED,
  ReservationStatus.PENDING,
  ReservationStatus.SEATED,
  ReservationStatus.COMPLETED
]);

const visitReservationStatuses = new Set<ReservationStatus>([
  ReservationStatus.SEATED,
  ReservationStatus.COMPLETED
]);

const answeredCallOutcomes = new Set<CallOutcome>([
  CallOutcome.ANSWERED,
  CallOutcome.RESERVATION_INQUIRY,
  CallOutcome.INFO_REQUEST
]);

const reservationInclude = {
  customer: true,
  assignedTable: true
} satisfies Prisma.ReservationInclude;

function getCustomerValueLabel(metrics: {
  completedReservations: number;
  noShowCount: number;
}) {
  if (metrics.noShowCount >= 2) {
    return "Riskli / No-show";
  }

  if (metrics.completedReservations >= 8) {
    return "VIP";
  }

  if (metrics.completedReservations >= 3) {
    return "Regular";
  }

  return "Yeni";
}

function aggregateSourceRows(reservations: Array<{ source: ReservationSource }>) {
  const totals = reservations.reduce<Record<string, number>>((acc, reservation) => {
    const key =
      reservation.source === ReservationSource.PHONE || reservation.source === ReservationSource.WALK_IN
        ? "MANUAL"
        : reservation.source;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return [
    { source: "MANUAL", total: totals.MANUAL ?? 0 },
    { source: ReservationSource.WEBSITE, total: totals.WEBSITE ?? 0 },
    { source: ReservationSource.WHATSAPP, total: totals.WHATSAPP ?? 0 },
    { source: ReservationSource.INSTAGRAM, total: totals.INSTAGRAM ?? 0 },
    { source: ReservationSource.GOOGLE, total: totals.GOOGLE ?? 0 },
    { source: ReservationSource.AI, total: totals.AI ?? 0 }
  ];
}

export async function getDashboardData() {
  throw new Error("businessId is required. Use getDashboardDataForBusiness instead.");
}

export async function getDashboardDataForBusiness(businessId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayStart = startOfDay(new Date(now.getTime() - 86400000));
  const yesterdayEnd = endOfDay(new Date(now.getTime() - 86400000));

  const [settings, reservationsToday, reservationsYesterday, callsToday, callsYesterday, tables, upcomingReservations] = await Promise.all([
    prisma.restaurantSettings.findFirstOrThrow({
      where: {
        businessId
      }
    }),
    prisma.reservation.findMany({
      where: { businessId, startAt: { gte: todayStart, lte: todayEnd } },
      include: reservationInclude,
      orderBy: { startAt: "asc" }
    }),
    prisma.reservation.findMany({
      where: { businessId, startAt: { gte: yesterdayStart, lte: yesterdayEnd } }
    }),
    prisma.callLog.findMany({
      where: { businessId, startedAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { startedAt: "desc" }
    }),
    prisma.callLog.findMany({
      where: { businessId, startedAt: { gte: yesterdayStart, lte: yesterdayEnd } }
    }),
    prisma.diningTable.findMany({
      where: {
        businessId
      },
      orderBy: { number: "asc" }
    }),
    prisma.reservation.findMany({
      where: {
        businessId,
        startAt: { gte: now },
        status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] }
      },
      include: reservationInclude,
      take: 6,
      orderBy: { startAt: "asc" }
    })
  ]);

  const activeReservationsToday = reservationsToday.filter((reservation) => activeReservationStatuses.has(reservation.status));

  const totalGuests = activeReservationsToday.reduce((sum, reservation) => sum + reservation.guestCount, 0);
  const occupancyRate = settings.seatingCapacity === 0 ? 0 : (totalGuests / settings.seatingCapacity) * 100;
  const answeredCalls = callsToday.filter((call) => answeredCallOutcomes.has(call.outcome)).length;
  const missedCalls = callsToday.filter((call) => call.outcome === CallOutcome.MISSED).length;

  const trend = (current: number, previous: number) => {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }
    return ((current - previous) / previous) * 100;
  };

  const last7Days = await Promise.all(
    Array.from({ length: 7 }).map(async (_, index) => {
      const date = startOfDay(new Date(now.getTime() - (6 - index) * 86400000));
      const next = endOfDay(date);
      const total = await prisma.reservation.count({
        where: {
          businessId,
          startAt: { gte: date, lte: next },
          status: { not: ReservationStatus.CANCELLED }
        }
      });

      return {
        label: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(date),
        total
      };
    })
  );

  const sourceRows = await prisma.reservation.groupBy({
    by: ["source"],
    _count: { _all: true },
    where: {
      businessId,
      startAt: { gte: startOfDay(new Date(now.getTime() - 6 * 86400000)), lte: todayEnd }
    }
  });

  return {
    settings,
    stats: {
      dailyReservations: reservationsToday.length,
      totalGuests,
      occupancyRate,
      answeredCalls,
      missedCalls,
      trends: {
        dailyReservations: trend(reservationsToday.length, reservationsYesterday.length),
        totalGuests: trend(
          totalGuests,
          reservationsYesterday.reduce((sum, reservation) => sum + reservation.guestCount, 0)
        ),
        answeredCalls: trend(
          answeredCalls,
          callsYesterday.filter((call) => answeredCallOutcomes.has(call.outcome)).length
        ),
        missedCalls: trend(
          missedCalls,
          callsYesterday.filter((call) => call.outcome === CallOutcome.MISSED).length
        )
      }
    },
    callsToday,
    tables,
    upcomingReservations,
    charts: {
      reservationsByDay: last7Days,
      reservationsBySource: sourceRows
    }
  };
}

export async function getReservationsPageData(businessId: string, selectedId?: string) {
  const [reservations, tables, customers, selectedReservation, settings] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        businessId
      },
      include: reservationInclude,
      orderBy: [{ createdAt: "desc" }, { startAt: "asc" }]
    }),
    prisma.diningTable.findMany({
      where: {
        businessId
      },
      orderBy: { number: "asc" }
    }),
    prisma.customer.findMany({
      where: {
        businessId
      },
      orderBy: { name: "asc" }
    }),
    selectedId
      ? prisma.reservation.findFirst({
          where: { id: selectedId, businessId },
          include: reservationInclude
        })
      : Promise.resolve(null),
    prisma.restaurantSettings.findFirst({
      where: {
        businessId
      }
    })
  ]);

  const customerHistory = selectedReservation
    ? await prisma.reservation.findMany({
        where: {
          businessId,
          customerId: selectedReservation.customerId
        },
        orderBy: {
          startAt: "desc"
        },
        take: 24
      })
    : [];

  const completedReservations = customerHistory.filter((reservation) => reservation.status === ReservationStatus.COMPLETED).length;
  const noShowCount = customerHistory.filter((reservation) => reservation.status === ReservationStatus.NO_SHOW).length;

  return {
    reservations,
    tables,
    customers,
    selectedReservation,
    customerHistorySummary: selectedReservation
      ? {
          totalVisits: customerHistory.filter((reservation) => visitReservationStatuses.has(reservation.status)).length,
          completedReservations,
          noShowCount,
          cancelledCount: customerHistory.filter((reservation) => reservation.status === ReservationStatus.CANCELLED).length,
          lastVisitDate: customerHistory.find((reservation) => visitReservationStatuses.has(reservation.status))?.startAt ?? null,
          valueLabel: getCustomerValueLabel({
            completedReservations,
            noShowCount
          })
        }
      : null,
    reminderSettings: settings
      ? {
          enabled: settings.reminderEnabled,
          timingHours: settings.reminderTimingHours,
          channel: settings.reminderChannel
        }
      : null
  };
}

export async function getTablesPageData(businessId: string, selectedId?: string) {
  const [tables, reservations, selectedTable] = await Promise.all([
    prisma.diningTable.findMany({
      where: {
        businessId,
        archivedAt: null
      },
      include: {
        reservations: {
          where: {
            businessId,
            status: {
              in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED]
            }
          },
          include: { customer: true },
          orderBy: { startAt: "asc" }
        }
      },
      orderBy: { number: "asc" }
    }),
    prisma.reservation.findMany({
      where: {
        businessId,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED]
        }
      },
      include: reservationInclude,
      orderBy: { startAt: "asc" }
    }),
    selectedId
      ? prisma.diningTable.findFirst({
          where: { id: selectedId, businessId, archivedAt: null },
          include: {
            reservations: {
              where: {
                businessId
              },
              include: { customer: true },
              orderBy: { startAt: "desc" }
            }
          }
        })
      : Promise.resolve(null)
  ]);

  const summary = {
    empty: tables.filter((table) => table.status === TableStatus.EMPTY).length,
    occupied: tables.filter((table) => table.status === TableStatus.OCCUPIED).length,
    reserved: tables.filter((table) => table.status === TableStatus.RESERVED).length,
    maintenance: tables.filter((table) => table.status === TableStatus.MAINTENANCE).length
  };

  return { tables, reservations, selectedTable, summary };
}

export async function getCustomersPageData(businessId: string, selectedId?: string) {
  const [customers, selectedCustomer] = await Promise.all([
    prisma.customer.findMany({
      where: {
        businessId
      },
      include: {
        reservations: {
          orderBy: { startAt: "desc" },
          take: 4
        }
      },
      orderBy: [{ tag: "asc" }, { name: "asc" }]
    }),
    selectedId
      ? prisma.customer.findFirst({
          where: { id: selectedId, businessId },
          include: {
            reservations: {
              where: {
                businessId
              },
              include: {
                assignedTable: true
              },
              orderBy: { startAt: "desc" }
            },
            callLogs: {
              where: {
                businessId
              },
              orderBy: { startedAt: "desc" },
              take: 6
            }
          }
        })
      : Promise.resolve(null)
  ]);

  return { customers, selectedCustomer };
}

export async function getReportsPageData(businessId: string) {
  const now = new Date();
  const start = startOfDay(new Date(now.getTime() - 13 * 86400000));
  const monthStart = startOfDay(new Date(now.getTime() - 29 * 86400000));
  const [reservations, calls, settings, customers, tables] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        businessId,
        startAt: {
          gte: monthStart
        }
      },
      include: {
        assignedTable: true
      }
    }),
    prisma.callLog.findMany({
      where: {
        businessId,
        startedAt: {
          gte: monthStart
        }
      }
    }),
    prisma.restaurantSettings.findFirstOrThrow({
      where: {
        businessId
      }
    }),
    prisma.customer.findMany({
      where: {
        businessId
      },
      include: {
        reservations: true
      }
    }),
    prisma.diningTable.findMany({
      where: {
        businessId,
        archivedAt: null
      }
    })
  ]);

  const reservationsByDay = Array.from({ length: 14 }).map((_, index) => {
    const date = startOfDay(new Date(start.getTime() + index * 86400000));
    const end = endOfDay(date);
    const dayReservations = reservations.filter((reservation) => reservation.startAt >= date && reservation.startAt <= end);
    const guests = dayReservations.reduce((sum, reservation) => sum + reservation.guestCount, 0);
    return {
      label: new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit" }).format(date),
      reservations: dayReservations.length,
      guests,
      occupancy: settings.seatingCapacity === 0 ? 0 : Math.min(100, (guests / settings.seatingCapacity) * 100)
    };
  });

  const weeklyTrend = Array.from({ length: 7 }).map((_, index) => {
    const date = startOfDay(new Date(now.getTime() - (6 - index) * 86400000));
    const end = endOfDay(date);
    return {
      label: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(date),
      total: reservations.filter((reservation) => reservation.startAt >= date && reservation.startAt <= end).length
    };
  });

  const monthlyTrend = Array.from({ length: 5 }).map((_, index) => {
    const bucketStart = startOfDay(new Date(now.getTime() - (4 - index) * 7 * 86400000));
    const bucketEnd = endOfDay(new Date(bucketStart.getTime() + 6 * 86400000));
    return {
      label: `${new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit" }).format(bucketStart)} - ${new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit" }).format(bucketEnd)}`,
      total: reservations.filter((reservation) => reservation.startAt >= bucketStart && reservation.startAt <= bucketEnd).length
    };
  });

  const callCounts = Object.entries(
    calls.reduce<Record<string, number>>((acc, call) => {
      acc[call.outcome] = (acc[call.outcome] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([outcome, total]) => ({ outcome, total }));

  const todayReservations = reservations.filter((reservation) => reservation.startAt >= startOfDay(now) && reservation.startAt <= endOfDay(now));
  const completedCount = reservations.filter((reservation) => reservation.status === ReservationStatus.COMPLETED).length;
  const noShowCount = reservations.filter((reservation) => reservation.status === ReservationStatus.NO_SHOW).length;
  const cancelledCount = reservations.filter((reservation) => reservation.status === ReservationStatus.CANCELLED).length;
  const validReservations = Math.max(1, reservations.length);
  const returningCustomers = customers.filter((customer) => customer.reservations.length >= 2).length;
  const vipCustomers = customers.filter((customer) => {
    const completedReservations = customer.reservations.filter((reservation) => reservation.status === ReservationStatus.COMPLETED).length;
    const noShows = customer.reservations.filter((reservation) => reservation.status === ReservationStatus.NO_SHOW).length;
    return getCustomerValueLabel({ completedReservations, noShowCount: noShows }) === "VIP";
  }).length;

  const popularHours = Array.from({ length: 6 }).map((_, index) => {
    const hour = 17 + index;
    return {
      label: `${hour.toString().padStart(2, "0")}:00`,
      total: reservations.filter((reservation) => reservation.startAt.getHours() === hour).length
    };
  }).sort((a, b) => b.total - a.total);

  const occupancySummary = {
    average:
      reservationsByDay.reduce((sum, row) => sum + row.occupancy, 0) /
      Math.max(1, reservationsByDay.length),
    peak:
      reservationsByDay.reduce((max, row) => Math.max(max, row.occupancy), 0),
    totalGuests: reservations.reduce((sum, reservation) => sum + reservation.guestCount, 0),
    utilization:
      tables.length === 0
        ? 0
        : Math.min(100, (reservations.filter((reservation) => reservation.assignedTableId).length / Math.max(1, tables.length * 4)) * 100)
  };

  return {
    reservationsByDay,
    weeklyTrend,
    monthlyTrend,
    sourceCounts: aggregateSourceRows(reservations),
    callCounts,
    occupancySummary,
    summaryCards: {
      todayReservations: todayReservations.length,
      noShowRate: noShowCount / validReservations,
      cancellationRate: cancelledCount / validReservations,
      completedRate: completedCount / validReservations,
      totalCustomers: customers.length,
      returningCustomers,
      vipCustomers
    },
    popularHours
  };
}

export async function getSettingsData(businessId: string) {
  return prisma.restaurantSettings.findFirstOrThrow({
    where: {
      businessId
    }
  });
}

export async function getSuperAdminData(input?: {
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
              { city: { contains: search, mode: "insensitive" } },
              { district: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(filter === "demo"
        ? { subscriptionPlan: "STARTER" }
        : filter === "pro"
          ? { subscriptionPlan: "PRO" }
          : filter === "suspended"
            ? { status: "SUSPENDED" }
            : filter === "trial"
              ? { subscriptionStatus: "TRIALING" }
              : {})
    },
    include: {
      _count: {
        select: {
          users: true,
          reservations: true,
          customers: true,
          tables: true
        }
      },
      settings: {
        take: 1
      },
      billingPayments: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      },
      users: {
        orderBy: {
          createdAt: "asc"
        },
        take: 5
      },
      auditLogs: {
        orderBy: {
          createdAt: "desc"
        },
        take: 5
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const summary = {
    total: businesses.length,
    demo: businesses.filter((business) => business.subscriptionPlan === "STARTER").length,
    pro: businesses.filter((business) => business.subscriptionPlan === "PRO").length,
    suspended: businesses.filter((business) => business.status === "SUSPENDED").length,
    trial: businesses.filter((business) => business.subscriptionStatus === "TRIALING").length
  };

  return {
    businesses,
    summary
  };
}

export async function getIntegrationsPageData(businessId: string) {
  const providers = Object.values(IntegrationProvider);
  const [connections, pendingRequests, recentRequests] = await Promise.all([
    prisma.integrationConnection.findMany({
      where: { businessId },
      orderBy: { provider: "asc" }
    }),
    prisma.reservationRequest.findMany({
      where: {
        businessId,
        status: ReservationRequestStatus.PENDING
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 12
    }),
    prisma.reservationRequest.findMany({
      where: {
        businessId,
        source: {
          in: [
            ReservationSource.WHATSAPP,
            ReservationSource.INSTAGRAM,
            ReservationSource.WEBSITE,
            ReservationSource.GOOGLE,
            ReservationSource.AI
          ]
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 30
    })
  ]);

  const connectionMap = new Map(connections.map((connection) => [connection.provider, connection]));
  const latestRequestMap = new Map<string, (typeof recentRequests)[number]>();
  for (const request of recentRequests) {
    const key =
      request.source === ReservationSource.WEBSITE || request.source === ReservationSource.GOOGLE
        ? IntegrationProvider.GOOGLE_WEB
        : request.source === ReservationSource.AI
          ? IntegrationProvider.AI_ASSISTANT
          : request.source;

    if (!latestRequestMap.has(key)) {
      latestRequestMap.set(key, request);
    }
  }

  const cards = providers.map((provider) => ({
    provider,
    connection:
      connectionMap.get(provider) ??
      ({
        provider,
        status:
          provider === IntegrationProvider.AI_ASSISTANT || provider === IntegrationProvider.GOOGLE_WEB
            ? IntegrationStatus.NEEDS_CONFIGURATION
            : IntegrationStatus.NOT_CONNECTED
      } as const)
    ,
    latestRequest: latestRequestMap.get(provider) ?? null
  }));

  return {
    cards,
    pendingRequests
  };
}

export async function getIntegrationsPageDataSafe(businessId: string) {
  try {
    const data = await getIntegrationsPageData(businessId);
    return {
      ...data,
      loadError: null as string | null
    };
  } catch (error) {
    console.error("[integrations:data_load_failed]", {
      businessId,
      error: error instanceof Error ? error.message : "unknown_error"
    });

    const providers = Object.values(IntegrationProvider);
    return {
      cards: providers.map((provider) => ({
        provider,
        connection: {
          provider,
          status:
            provider === IntegrationProvider.AI_ASSISTANT || provider === IntegrationProvider.GOOGLE_WEB
              ? IntegrationStatus.NEEDS_CONFIGURATION
              : IntegrationStatus.NOT_CONNECTED
        },
        latestRequest: null
      })),
      pendingRequests: [],
      loadError: "Entegrasyon verileri şu anda yüklenemedi. Kurulum durumu veya veritabanı güncellemeleri kontrol edilirken sayfa güvenli modda açıldı."
    };
  }
}

export async function getBusinessSecurityData(businessId: string) {
  const [recentLogins, failedAttempts, passwordResetEvents] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        businessId,
        category: AuditCategory.AUTH,
        action: {
          in: ["login_success", "login_failed", "login_locked"]
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 12
    }),
    prisma.auditLog.findMany({
      where: {
        businessId,
        category: AuditCategory.AUTH,
        action: {
          in: ["login_failed", "login_rate_limited"]
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 8
    }),
    prisma.auditLog.findMany({
      where: {
        businessId,
        category: AuditCategory.AUTH,
        action: {
          in: ["password_reset_requested", "password_reset_completed"]
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 8
    })
  ]);

  return {
    recentLogins,
    failedAttempts,
    passwordResetEvents
  };
}

export async function getSecurityLogData() {
  const [recentLogs, failedLogins, suspiciousSummary] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: { _all: true },
      where: {
        category: AuditCategory.AUTH,
        action: {
          in: ["login_failed", "login_rate_limited"]
        }
      }
    }),
    prisma.auditLog.groupBy({
      by: ["severity"],
      _count: { _all: true },
      where: {
        category: AuditCategory.SECURITY
      }
    })
  ]);

  return {
    recentLogs,
    failedLogins,
    suspiciousSummary
  };
}

export async function getSuperAdminBusinessDetail(businessId: string) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const business = await prisma.business.findUniqueOrThrow({
    where: {
      id: businessId
    },
    include: {
      users: {
        orderBy: {
          createdAt: "asc"
        }
      },
      settings: {
        take: 1
      },
      billingPayments: {
        orderBy: {
          createdAt: "desc"
        },
        take: 10
      },
      _count: {
        select: {
          reservations: true,
          customers: true,
          tables: true
        }
      }
    }
  });

  const [todayReservations, lastReservations, recentLogins, recentActivity] = await Promise.all([
    prisma.reservation.count({
      where: {
        businessId,
        startAt: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    }),
    prisma.reservation.findMany({
      where: {
        businessId
      },
      orderBy: {
        startAt: "desc"
      },
      take: 10,
      include: {
        assignedTable: true
      }
    }),
    prisma.auditLog.findMany({
      where: {
        businessId,
        category: AuditCategory.AUTH,
        action: {
          in: ["login_success", "login_failed", "login_locked"]
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    }),
    prisma.auditLog.findMany({
      where: {
        businessId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 12
    })
  ]);

  return {
    business,
    metrics: {
      totalReservations: business._count.reservations,
      todayReservations,
      totalCustomers: business._count.customers,
      totalTables: business._count.tables
    },
    lastReservations,
    recentLogins,
    recentActivity,
    lastPayment: business.billingPayments[0] ?? null
  };
}
