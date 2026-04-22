import { CallOutcome, Prisma, ReservationStatus, TableStatus } from "@prisma/client";
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
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayStart = startOfDay(new Date(now.getTime() - 86400000));
  const yesterdayEnd = endOfDay(new Date(now.getTime() - 86400000));

  const [settings, reservationsToday, reservationsYesterday, callsToday, callsYesterday, tables, upcomingReservations] = await Promise.all([
    prisma.restaurantSettings.findFirstOrThrow(),
    prisma.reservation.findMany({
      where: { startAt: { gte: todayStart, lte: todayEnd } },
      include: reservationInclude,
      orderBy: { startAt: "asc" }
    }),
    prisma.reservation.findMany({
      where: { startAt: { gte: yesterdayStart, lte: yesterdayEnd } }
    }),
    prisma.callLog.findMany({
      where: { startedAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { startedAt: "desc" }
    }),
    prisma.callLog.findMany({
      where: { startedAt: { gte: yesterdayStart, lte: yesterdayEnd } }
    }),
    prisma.diningTable.findMany({
      orderBy: { number: "asc" }
    }),
    prisma.reservation.findMany({
      where: {
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

export async function getReservationsPageData(selectedId?: string) {
  const [reservations, tables, customers, selectedReservation] = await Promise.all([
    prisma.reservation.findMany({
      include: reservationInclude,
      orderBy: { startAt: "asc" }
    }),
    prisma.diningTable.findMany({
      orderBy: { number: "asc" }
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" }
    }),
    selectedId
      ? prisma.reservation.findUnique({
          where: { id: selectedId },
          include: reservationInclude
        })
      : Promise.resolve(null)
  ]);

  return { reservations, tables, customers, selectedReservation };
}

export async function getTablesPageData(selectedId?: string) {
  const [tables, reservations, selectedTable] = await Promise.all([
    prisma.diningTable.findMany({
      include: {
        reservations: {
          where: {
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
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED]
        }
      },
      include: reservationInclude,
      orderBy: { startAt: "asc" }
    }),
    selectedId
      ? prisma.diningTable.findUnique({
          where: { id: selectedId },
          include: {
            reservations: {
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

export async function getCustomersPageData(selectedId?: string) {
  const [customers, selectedCustomer] = await Promise.all([
    prisma.customer.findMany({
      include: {
        reservations: {
          orderBy: { startAt: "desc" },
          take: 4
        }
      },
      orderBy: [{ tag: "asc" }, { name: "asc" }]
    }),
    selectedId
      ? prisma.customer.findUnique({
          where: { id: selectedId },
          include: {
            reservations: {
              include: {
                assignedTable: true
              },
              orderBy: { startAt: "desc" }
            },
            callLogs: {
              orderBy: { startedAt: "desc" },
              take: 6
            }
          }
        })
      : Promise.resolve(null)
  ]);

  return { customers, selectedCustomer };
}

export async function getReportsPageData() {
  const now = new Date();
  const start = startOfDay(new Date(now.getTime() - 13 * 86400000));
  const reservations = await prisma.reservation.findMany({
    where: {
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
      startedAt: {
        gte: start
      }
    }
  });
  const settings = await prisma.restaurantSettings.findFirstOrThrow();

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

export async function getSettingsData() {
  return prisma.restaurantSettings.findFirstOrThrow();
}
