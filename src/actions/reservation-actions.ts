"use server";

import { AuditCategory, ReminderStatus, ReservationStatus, TableStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessWriteAccess } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { buildReminderSchedule } from "@/lib/reminders";
import { reservationSchema, tableAssignSchema, tableUpdateSchema } from "@/lib/validation";

function buildReservationDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function withQueryParam(pathname: string, key: string, value: string) {
  const [base, search = ""] = pathname.split("?");
  const params = new URLSearchParams(search);
  params.set(key, value);
  const nextSearch = params.toString();
  return nextSearch ? `${base}?${nextSearch}` : base;
}

async function syncTableStatus(businessId: string, tableId?: string | null, status?: ReservationStatus) {
  if (!tableId) {
    return;
  }

  const tableStatus =
    status === ReservationStatus.CANCELLED || status === ReservationStatus.NO_SHOW || status === ReservationStatus.COMPLETED
      ? TableStatus.EMPTY
      : status === ReservationStatus.SEATED
        ? TableStatus.OCCUPIED
        : TableStatus.RESERVED;

  await prisma.diningTable.updateMany({
    where: { id: tableId, businessId },
    data: { status: tableStatus }
  });
}

async function findOrCreateCustomerForReservation(input: {
  businessId: string;
  customerName: string;
  phone: string;
}) {
  const existingCustomer = await prisma.customer.findUnique({
    where: {
      businessId_phone: {
        businessId: input.businessId,
        phone: input.phone
      }
    }
  });

  if (existingCustomer) {
    return existingCustomer;
  }

  return prisma.customer.create({
    data: {
      businessId: input.businessId,
      name: input.customerName,
      phone: input.phone
    }
  });
}

export async function saveReservationAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    feature: "reservations"
  });
  const businessId = session.user.businessId;

  const redirectTo = String(formData.get("redirectTo") ?? "/reservations");
  const parsed = reservationSchema.safeParse({
    id: formData.get("id"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    reservationDate: formData.get("reservationDate"),
    reservationTime: formData.get("reservationTime"),
    guestCount: formData.get("guestCount"),
    status: formData.get("status"),
    source: formData.get("source"),
    tableId: formData.get("tableId"),
    occasion: formData.get("occasion"),
    notes: formData.get("notes"),
    redirectTo
  });

  if (!parsed.success) {
    redirect(`${redirectTo}?error=reservation_validation`);
  }

  const startAt = buildReservationDateTime(parsed.data.reservationDate, parsed.data.reservationTime);
  const endAt = new Date(startAt.getTime() + 100 * 60000);
  const settings = await prisma.restaurantSettings.findFirstOrThrow({
    where: {
      businessId
    }
  });
  const reminderConfig = buildReminderSchedule({
    startAt,
    reminderEnabled: settings.reminderEnabled,
    reminderTimingHours: settings.reminderTimingHours
  });

  if (parsed.data.tableId) {
    const table = await prisma.diningTable.findFirst({
      where: {
        id: parsed.data.tableId,
        businessId
      }
    });

    if (!table) {
      redirect(`${redirectTo}?error=table_missing`);
    }
  }

  if (parsed.data.id) {
    const existing = await prisma.reservation.findFirst({
      where: { id: parsed.data.id, businessId },
      include: {
        customer: true
      }
    });

    if (!existing) {
      redirect(`${redirectTo}?error=reservation_missing`);
    }

    const customer =
      existing.customer.phone === parsed.data.phone
        ? existing.customer
        : await findOrCreateCustomerForReservation({
            businessId,
            customerName: parsed.data.customerName,
            phone: parsed.data.phone
          });

    const reservation = await prisma.reservation.update({
      where: { id: existing.id },
      data: {
        customerId: customer.id,
        guestName: parsed.data.customerName,
        guestPhone: parsed.data.phone,
        assignedTableId: parsed.data.tableId || null,
        status: parsed.data.status,
        source: parsed.data.source,
        startAt,
        endAt,
        guestCount: parsed.data.guestCount,
        occasion: parsed.data.occasion || null,
        notes: parsed.data.notes || null,
        reminderStatus:
          parsed.data.status === ReservationStatus.CANCELLED ||
          parsed.data.status === ReservationStatus.NO_SHOW ||
          parsed.data.status === ReservationStatus.COMPLETED ||
          parsed.data.status === ReservationStatus.SEATED
            ? ReminderStatus.NOT_SCHEDULED
            : reminderConfig.reminderStatus,
        reminderScheduledAt:
          parsed.data.status === ReservationStatus.CANCELLED ||
          parsed.data.status === ReservationStatus.NO_SHOW ||
          parsed.data.status === ReservationStatus.COMPLETED ||
          parsed.data.status === ReservationStatus.SEATED
            ? null
            : reminderConfig.reminderScheduledAt,
        reminderSentAt: null,
        lastReminderError: null
      }
    });

    if (existing?.assignedTableId && existing.assignedTableId !== reservation.assignedTableId) {
      await prisma.diningTable.updateMany({
        where: { id: existing.assignedTableId, businessId },
        data: { status: TableStatus.EMPTY }
      });
    }

    await syncTableStatus(businessId, reservation.assignedTableId, reservation.status);
    await createAuditLog({
      businessId,
      actorUserId: session.user.id,
      actorRole: session.user.role,
      category: AuditCategory.RESERVATION,
      action: "reservation_updated",
      message: "Reservation updated.",
      targetType: "Reservation",
      targetId: reservation.id
    });
    revalidatePath("/dashboard");
    revalidatePath("/reservations");
    revalidatePath("/tables");
    revalidatePath("/reports");
    redirect(withQueryParam(redirectTo, "saved", "updated"));
  } else {
    const customer = await findOrCreateCustomerForReservation({
      businessId,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone
    });

    const reservation = await prisma.reservation.create({
      data: {
        businessId,
        customerId: customer.id,
        guestName: parsed.data.customerName,
        guestPhone: parsed.data.phone,
        assignedTableId: parsed.data.tableId || null,
        status: parsed.data.status,
        source: parsed.data.source,
        startAt,
        endAt,
        guestCount: parsed.data.guestCount,
        occasion: parsed.data.occasion || null,
        notes: parsed.data.notes || null,
        reminderStatus: reminderConfig.reminderStatus,
        reminderScheduledAt: reminderConfig.reminderScheduledAt
      }
    });

    await syncTableStatus(businessId, reservation.assignedTableId, reservation.status);
    await createAuditLog({
      businessId,
      actorUserId: session.user.id,
      actorRole: session.user.role,
      category: AuditCategory.RESERVATION,
      action: "reservation_created",
      message: "Reservation created.",
      targetType: "Reservation",
      targetId: reservation.id
    });
    revalidatePath("/dashboard");
    revalidatePath("/reservations");
    revalidatePath("/tables");
    revalidatePath("/reports");
    redirect(withQueryParam(`/reservations?reservationId=${reservation.id}`, "saved", "created"));
  }
}

export async function updateReservationStatusAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    feature: "reservations"
  });
  const businessId = session.user.businessId;

  const id = String(formData.get("id"));
  const status = formData.get("status") as ReservationStatus;
  const redirectTo = String(formData.get("redirectTo") ?? "/reservations");

  const existing = await prisma.reservation.findFirst({
    where: {
      id,
      businessId
    }
  });

  if (!existing) {
    redirect(`${redirectTo}?error=reservation_missing`);
  }

  const reservation = await prisma.reservation.update({
    where: { id: existing.id },
    data: {
      status,
      reminderStatus:
        status === ReservationStatus.CANCELLED ||
        status === ReservationStatus.NO_SHOW ||
        status === ReservationStatus.COMPLETED ||
        status === ReservationStatus.SEATED
          ? ReminderStatus.NOT_SCHEDULED
          : existing.reminderStatus,
      reminderScheduledAt:
        status === ReservationStatus.CANCELLED ||
        status === ReservationStatus.NO_SHOW ||
        status === ReservationStatus.COMPLETED ||
        status === ReservationStatus.SEATED
          ? null
          : existing.reminderScheduledAt
    }
  });

  await syncTableStatus(businessId, reservation.assignedTableId, status);
  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.RESERVATION,
    action: "reservation_status_updated",
    message: "Reservation attendance status updated.",
    targetType: "Reservation",
    targetId: reservation.id,
    metadata: {
      status
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/tables");
  revalidatePath("/reports");
  redirect(withQueryParam(redirectTo, "saved", "status"));
}

export async function updateTableStatusAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    feature: "tables"
  });
  const businessId = session.user.businessId;

  const parsed = tableUpdateSchema.safeParse({
    tableId: formData.get("tableId"),
    status: formData.get("status"),
    redirectTo: formData.get("redirectTo")
  });

  if (!parsed.success) {
    redirect("/tables?error=table_status");
  }

  const table = await prisma.diningTable.findFirst({
    where: {
      id: parsed.data.tableId,
      businessId
    }
  });

  if (!table) {
    redirect(`${parsed.data.redirectTo}?error=table_missing`);
  }

  await prisma.diningTable.updateMany({
    where: { id: table.id, businessId },
    data: { status: parsed.data.status }
  });

  revalidatePath("/dashboard");
  revalidatePath("/tables");
  redirect(parsed.data.redirectTo);
}

export async function assignReservationToTableAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    feature: "tables"
  });
  const businessId = session.user.businessId;

  const parsed = tableAssignSchema.safeParse({
    tableId: formData.get("tableId"),
    reservationId: formData.get("reservationId"),
    redirectTo: formData.get("redirectTo")
  });

  if (!parsed.success) {
    redirect("/tables?error=table_assign");
  }

  const table = await prisma.diningTable.findFirst({
    where: {
      id: parsed.data.tableId,
      businessId
    }
  });

  if (!table) {
    redirect(`${parsed.data.redirectTo}?error=table_missing`);
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: parsed.data.reservationId,
      businessId
    }
  });

  if (!reservation) {
    redirect(`${parsed.data.redirectTo}?error=reservation_missing`);
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      assignedTableId: parsed.data.tableId,
      status: ReservationStatus.CONFIRMED
    }
  });

  await prisma.diningTable.updateMany({
    where: { id: table.id, businessId },
    data: {
      status: TableStatus.RESERVED
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/tables");
  redirect(parsed.data.redirectTo);
}
