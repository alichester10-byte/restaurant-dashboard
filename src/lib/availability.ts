import "server-only";

import { Prisma, ReservationStatus, type BusinessType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const blockingStatuses: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.SEATED
];

type AvailabilityContext = {
  businessId: string;
  businessType: BusinessType;
  openingHours: Record<string, string> | null;
  maxPartySize: number | null;
  averageDurationMinutes: number;
  services: Array<{ id: string; name: string; durationMinutes: number | null }>;
  staffMembers: Array<{ id: string; name: string; isActive: boolean }>;
  resources: Array<{ id: string; name: string; type: string; capacity: number | null; isActive: boolean }>;
  tables: Array<{ id: string; number: string; seatCapacity: number; archivedAt: Date | null }>;
};

export type AvailabilityConflict = {
  ok: boolean;
  code?: "CLOSED" | "MAX_PARTY" | "STAFF_BUSY" | "RESOURCE_BUSY" | "TABLE_BUSY" | "CAPACITY" | "INVALID_RANGE";
  message?: string;
  suggestions?: string[];
};

type CheckConflictInput = {
  businessId: string;
  startAt: Date;
  endAt: Date;
  guestCount?: number | null;
  assignedTableId?: string | null;
  serviceId?: string | null;
  staffMemberId?: string | null;
  resourceId?: string | null;
  excludeReservationId?: string | null;
};

const reservationAvailabilityInclude = {
  assignedTable: { select: { id: true, number: true, seatCapacity: true } },
  resource: { select: { id: true, name: true, type: true, capacity: true } },
  staffMember: { select: { id: true, name: true } }
} satisfies Prisma.ReservationInclude;

function parseOpeningRange(value: string) {
  const normalized = value.trim();
  if (!normalized || /kapalı/i.test(normalized)) {
    return null;
  }

  const match = normalized.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (!match) {
    return null;
  }

  return { opensAt: match[1], closesAt: match[2] };
}

function setTimeOnDate(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function getOpeningHoursKey(date: Date) {
  const day = date.getDay();
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][day]!;
}

function formatSlot(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export async function getBusinessAvailabilityContext(businessId: string): Promise<AvailabilityContext | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      settings: { take: 1, select: { openingHours: true, maxPartySize: true, averageDiningDurationMin: true } },
      services: { where: { isActive: true }, select: { id: true, name: true, durationMinutes: true } },
      staffMembers: { where: { isActive: true }, select: { id: true, name: true, isActive: true } },
      bookableResources: { where: { isActive: true }, select: { id: true, name: true, type: true, capacity: true, isActive: true } },
      tables: { where: { archivedAt: null }, select: { id: true, number: true, seatCapacity: true, archivedAt: true } }
    }
  });

  if (!business) {
    return null;
  }

  const settings = business.settings[0];

  return {
    businessId: business.id,
    businessType: business.businessType,
    openingHours:
      settings?.openingHours && typeof settings.openingHours === "object" && !Array.isArray(settings.openingHours)
        ? (settings.openingHours as Record<string, string>)
        : null,
    maxPartySize: settings?.maxPartySize ?? null,
    averageDurationMinutes: settings?.averageDiningDurationMin ?? 90,
    services: business.services,
    staffMembers: business.staffMembers,
    resources: business.bookableResources,
    tables: business.tables
  };
}

export async function checkStaffAvailability(input: CheckConflictInput) {
  if (!input.staffMemberId) {
    return { ok: true } satisfies AvailabilityConflict;
  }

  const conflict = await prisma.reservation.findFirst({
    where: {
      businessId: input.businessId,
      staffMemberId: input.staffMemberId,
      status: { in: blockingStatuses },
      id: input.excludeReservationId ? { not: input.excludeReservationId } : undefined,
      startAt: { lt: input.endAt },
      endAt: { gt: input.startAt }
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      guestName: true,
      staffMember: { select: { name: true } }
    }
  });

  if (!conflict) {
    return { ok: true } satisfies AvailabilityConflict;
  }

  return {
    ok: false,
    code: "STAFF_BUSY",
    message: `${conflict.staffMember?.name ?? "Seçilen uzman"} bu zaman aralığında başka bir kayıtla meşgul.`,
    suggestions: suggestAvailableSlots({
      businessId: input.businessId,
      startAt: input.startAt,
      endAt: input.endAt,
      staffMemberId: input.staffMemberId,
      excludeReservationId: input.excludeReservationId ?? null
    })
  } satisfies AvailabilityConflict;
}

export async function checkResourceAvailability(input: CheckConflictInput) {
  if (!input.resourceId) {
    return { ok: true } satisfies AvailabilityConflict;
  }

  const conflict = await prisma.reservation.findFirst({
    where: {
      businessId: input.businessId,
      resourceId: input.resourceId,
      status: { in: blockingStatuses },
      id: input.excludeReservationId ? { not: input.excludeReservationId } : undefined,
      startAt: { lt: input.endAt },
      endAt: { gt: input.startAt }
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      resource: { select: { name: true, type: true } }
    }
  });

  if (!conflict) {
    return { ok: true } satisfies AvailabilityConflict;
  }

  return {
    ok: false,
    code: "RESOURCE_BUSY",
    message: `${conflict.resource?.name ?? "Seçilen kaynak"} bu zaman aralığında dolu görünüyor.`,
    suggestions: suggestAvailableSlots({
      businessId: input.businessId,
      startAt: input.startAt,
      endAt: input.endAt,
      resourceId: input.resourceId,
      excludeReservationId: input.excludeReservationId ?? null
    })
  } satisfies AvailabilityConflict;
}

export async function checkReservationConflict(input: CheckConflictInput): Promise<AvailabilityConflict> {
  if (input.endAt <= input.startAt) {
    return {
      ok: false,
      code: "INVALID_RANGE",
      message: "Başlangıç ve bitiş aralığı geçerli değil."
    };
  }

  const context = await getBusinessAvailabilityContext(input.businessId);
  if (!context) {
    return { ok: true };
  }

  const openingStatus = checkBusinessOpen(context, input.startAt, input.endAt);
  if (!openingStatus.ok) {
    return openingStatus;
  }

  if (context.maxPartySize && input.guestCount && input.guestCount > context.maxPartySize) {
    return {
      ok: false,
      code: "MAX_PARTY",
      message: `Bu işletme için tek kayıt maksimum ${context.maxPartySize} kişi ile sınırlandırılmış.`
    };
  }

  if (input.assignedTableId) {
    const table = context.tables.find((item) => item.id === input.assignedTableId);
    if (table) {
      if (input.guestCount && input.guestCount > table.seatCapacity) {
        return {
          ok: false,
          code: "CAPACITY",
          message: `${table.number} numaralı masa en fazla ${table.seatCapacity} kişi ağırlayabilir.`
        };
      }

      const tableConflict = await prisma.reservation.findFirst({
        where: {
          businessId: input.businessId,
          assignedTableId: input.assignedTableId,
          status: { in: blockingStatuses },
          id: input.excludeReservationId ? { not: input.excludeReservationId } : undefined,
          startAt: { lt: input.endAt },
          endAt: { gt: input.startAt }
        },
        select: {
          id: true,
          assignedTable: { select: { number: true } }
        }
      });

      if (tableConflict) {
        return {
          ok: false,
          code: "TABLE_BUSY",
          message: `${tableConflict.assignedTable?.number ?? "Seçilen masa"} bu saat için zaten dolu görünüyor.`,
          suggestions: suggestAvailableSlots({
            businessId: input.businessId,
            startAt: input.startAt,
            endAt: input.endAt,
            assignedTableId: input.assignedTableId,
            excludeReservationId: input.excludeReservationId ?? null
          })
        };
      }
    }
  }

  if (input.resourceId) {
    const resource = context.resources.find((item) => item.id === input.resourceId);
    if (resource?.capacity && input.guestCount && input.guestCount > resource.capacity) {
      return {
        ok: false,
        code: "CAPACITY",
        message: `${resource.name} kaynağı en fazla ${resource.capacity} kişi/kapasite destekliyor.`
      };
    }
  }

  const staffStatus = await checkStaffAvailability(input);
  if (!staffStatus.ok) {
    return staffStatus;
  }

  const resourceStatus = await checkResourceAvailability(input);
  if (!resourceStatus.ok) {
    return resourceStatus;
  }

  return { ok: true };
}

export function suggestAvailableSlots(input: {
  businessId: string;
  startAt: Date;
  endAt: Date;
  assignedTableId?: string | null;
  staffMemberId?: string | null;
  resourceId?: string | null;
  excludeReservationId?: string | null;
}) {
  const durationMs = input.endAt.getTime() - input.startAt.getTime();
  const suggestions: string[] = [];

  for (const offsetMinutes of [30, 60, 90, 120]) {
    const candidate = new Date(input.startAt.getTime() + offsetMinutes * 60000);
    const candidateEnd = new Date(candidate.getTime() + durationMs);
    suggestions.push(`${formatSlot(candidate)} - ${formatSlot(candidateEnd)}`);
    if (suggestions.length >= 3) {
      break;
    }
  }

  return suggestions;
}

export function resolveReservationWindow(input: {
  requestedDate: string;
  requestedTime: string;
  fallbackDurationMinutes: number;
  endDate?: string | null;
  durationMinutes?: number | null;
}) {
  const startAt = new Date(`${input.requestedDate}T${input.requestedTime}:00`);

  if (input.endDate) {
    const endAt = new Date(`${input.endDate}T${input.requestedTime}:00`);
    if (endAt > startAt) {
      return { startAt, endAt, durationMinutes: Math.round((endAt.getTime() - startAt.getTime()) / 60000) };
    }
  }

  const durationMinutes = input.durationMinutes && input.durationMinutes > 0 ? input.durationMinutes : input.fallbackDurationMinutes;
  const endAt = new Date(startAt.getTime() + durationMinutes * 60000);
  return { startAt, endAt, durationMinutes };
}

function checkBusinessOpen(context: AvailabilityContext, startAt: Date, endAt: Date): AvailabilityConflict {
  if (context.businessType === "HOTEL") {
    return { ok: true };
  }

  if (!context.openingHours) {
    return { ok: true };
  }

  const key = getOpeningHoursKey(startAt);
  const raw = context.openingHours[key];
  const parsed = raw ? parseOpeningRange(raw) : null;
  if (!parsed) {
    return {
      ok: false,
      code: "CLOSED",
      message: "İşletme seçilen gün/saat aralığında açık görünmüyor."
    };
  }

  const opensAt = setTimeOnDate(startAt, parsed.opensAt);
  let closesAt = setTimeOnDate(startAt, parsed.closesAt);
  if (closesAt <= opensAt) {
    closesAt = new Date(closesAt.getTime() + 24 * 60 * 60000);
  }

  if (startAt < opensAt || endAt > closesAt) {
    return {
      ok: false,
      code: "CLOSED",
      message: "Seçilen saat işletmenin çalışma aralığının dışında kalıyor."
    };
  }

  return { ok: true };
}

export async function findOverlappingReservations(input: {
  businessId: string;
  startAt: Date;
  endAt: Date;
  excludeReservationId?: string | null;
}) {
  return prisma.reservation.findMany({
    where: {
      businessId: input.businessId,
      status: { in: blockingStatuses },
      id: input.excludeReservationId ? { not: input.excludeReservationId } : undefined,
      startAt: { lt: input.endAt },
      endAt: { gt: input.startAt }
    },
    include: reservationAvailabilityInclude
  });
}
