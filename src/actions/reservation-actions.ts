"use server";

import { ReservationStatus, TableStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reservationSchema, tableAssignSchema, tableUpdateSchema } from "@/lib/validation";

function buildReservationDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

async function syncTableStatus(tableId?: string | null, status?: ReservationStatus) {
  if (!tableId) {
    return;
  }

  const tableStatus =
    status === ReservationStatus.CANCELLED || status === ReservationStatus.NO_SHOW
      ? TableStatus.EMPTY
      : TableStatus.RESERVED;

  await prisma.diningTable.update({
    where: { id: tableId },
    data: { status: tableStatus }
  });
}

export async function saveReservationAction(formData: FormData) {
  await requireAuth();

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

  const customer = await prisma.customer.upsert({
    where: { phone: parsed.data.phone },
    update: {
      name: parsed.data.customerName
    },
    create: {
      name: parsed.data.customerName,
      phone: parsed.data.phone
    }
  });

  if (parsed.data.id) {
    const existing = await prisma.reservation.findUnique({
      where: { id: parsed.data.id }
    });

    const reservation = await prisma.reservation.update({
      where: { id: parsed.data.id },
      data: {
        customerId: customer.id,
        assignedTableId: parsed.data.tableId || null,
        status: parsed.data.status,
        source: parsed.data.source,
        startAt,
        endAt,
        guestCount: parsed.data.guestCount,
        occasion: parsed.data.occasion || null,
        notes: parsed.data.notes || null
      }
    });

    if (existing?.assignedTableId && existing.assignedTableId !== reservation.assignedTableId) {
      await prisma.diningTable.update({
        where: { id: existing.assignedTableId },
        data: { status: TableStatus.EMPTY }
      });
    }

    await syncTableStatus(reservation.assignedTableId, reservation.status);
  } else {
    const reservation = await prisma.reservation.create({
      data: {
        customerId: customer.id,
        assignedTableId: parsed.data.tableId || null,
        status: parsed.data.status,
        source: parsed.data.source,
        startAt,
        endAt,
        guestCount: parsed.data.guestCount,
        occasion: parsed.data.occasion || null,
        notes: parsed.data.notes || null
      }
    });

    await syncTableStatus(reservation.assignedTableId, reservation.status);
  }

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/tables");
  redirect(redirectTo);
}

export async function updateReservationStatusAction(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id"));
  const status = formData.get("status") as ReservationStatus;
  const redirectTo = String(formData.get("redirectTo") ?? "/reservations");

  const reservation = await prisma.reservation.update({
    where: { id },
    data: { status }
  });

  await syncTableStatus(reservation.assignedTableId, status);

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/tables");
  redirect(redirectTo);
}

export async function updateTableStatusAction(formData: FormData) {
  await requireAuth();

  const parsed = tableUpdateSchema.safeParse({
    tableId: formData.get("tableId"),
    status: formData.get("status"),
    redirectTo: formData.get("redirectTo")
  });

  if (!parsed.success) {
    redirect("/tables?error=table_status");
  }

  await prisma.diningTable.update({
    where: { id: parsed.data.tableId },
    data: { status: parsed.data.status }
  });

  revalidatePath("/dashboard");
  revalidatePath("/tables");
  redirect(parsed.data.redirectTo);
}

export async function assignReservationToTableAction(formData: FormData) {
  await requireAuth();

  const parsed = tableAssignSchema.safeParse({
    tableId: formData.get("tableId"),
    reservationId: formData.get("reservationId"),
    redirectTo: formData.get("redirectTo")
  });

  if (!parsed.success) {
    redirect("/tables?error=table_assign");
  }

  await prisma.reservation.update({
    where: { id: parsed.data.reservationId },
    data: {
      assignedTableId: parsed.data.tableId,
      status: ReservationStatus.CONFIRMED
    }
  });

  await prisma.diningTable.update({
    where: { id: parsed.data.tableId },
    data: {
      status: TableStatus.RESERVED
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/tables");
  redirect(parsed.data.redirectTo);
}
