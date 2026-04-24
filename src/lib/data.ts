import {
  AuditCategory,
  CallOutcome,
  IntegrationProvider,
  IntegrationStatus,
  Prisma,
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
  const [reservations, tables, customers, selectedReservation] = await Promise.all([
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
      : Promise.resolve(null)
  ]);

  return { reservations, tables, customers, selectedReservation };
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
  const reservations = await prisma.reservation.findMany({
    where: {
      businessId,
      startAt: {
        gte: start
      }
    },
    include: {
      assignedTable: true
    }
  });
  const calls = await prisma.callLog.findMany({
    where: {
      businessId,
      startedAt: {
        gte: start
      }
    }
  });
  const settings = await prisma.restaurantSettings.findFirstOrThrow({
    where: {
      businessId
    }
  });

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

  const sourceCounts = Object.entries(
    reservations.reduce<Record<string, number>>((acc, reservation) => {
      acc[reservation.source] = (acc[reservation.source] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([source, total]) => ({ source, total }));

  const callCounts = Object.entries(
    calls.reduce<Record<string, number>>((acc, call) => {
      acc[call.outcome] = (acc[call.outcome] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([outcome, total]) => ({ outcome, total }));

  const occupancySummary = {
    average:
      reservationsByDay.reduce((sum, row) => sum + row.occupancy, 0) /
      Math.max(1, reservationsByDay.length),
    peak:
      reservationsByDay.reduce((max, row) => Math.max(max, row.occupancy), 0),
    totalGuests: reservations.reduce((sum, reservation) => sum + reservation.guestCount, 0)
  };

  return {
    reservationsByDay,
    sourceCounts,
    callCounts,
    occupancySummary
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
  const [connections, pendingRequests] = await Promise.all([
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
    })
  ]);

  const connectionMap = new Map(connections.map((connection) => [connection.provider, connection]));
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
  }));

  return {
    cards,
    pendingRequests
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
