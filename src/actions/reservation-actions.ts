"use server";

import { ReservationStatus, TableStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reservationSchema, tableAssignSchema, tableUpdateSchema } from "@/lib/validation";

function buildReservationDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

async function syncTableStatus(businessId: string, tableId?: string | null, status?: ReservationStatus) {
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
  const session = await requireBusinessUser();
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

  const customer = await prisma.customer.upsert({
    where: {
      businessId_phone: {
        businessId,
        phone: parsed.data.phone
      }
    },
    update: {
      name: parsed.data.customerName
    },
    create: {
      businessId,
      name: parsed.data.customerName,
      phone: parsed.data.phone
    }
  });

  if (parsed.data.id) {
    const existing = await prisma.reservation.findFirst({
      where: { id: parsed.data.id, businessId }
    });

    if (!existing) {
      redirect(`${redirectTo}?error=reservation_missing`);
    }

    const reservation = await prisma.reservation.update({
      where: { id: existing.id },
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

    await syncTableStatus(businessId, reservation.assignedTableId, reservation.status);
  } else {
    const reservation = await prisma.reservation.create({
      data: {
        businessId,
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

    await syncTableStatus(businessId, reservation.assignedTableId, reservation.status);
  }

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/tables");
  redirect(redirectTo);
}

export async function updateReservationStatusAction(formData: FormData) {
  const session = await requireBusinessUser();
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
    data: { status }
  });

  await syncTableStatus(businessId, reservation.assignedTableId, status);

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/tables");
  redirect(redirectTo);
}

export async function updateTableStatusAction(formData: FormData) {
  const session = await requireBusinessUser();
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

  await prisma.diningTable.update({
    where: { id: table.id },
    data: { status: parsed.data.status }
  });

  revalidatePath("/dashboard");
  revalidatePath("/tables");
  redirect(parsed.data.redirectTo);
}

export async function assignReservationToTableAction(formData: FormData) {
  const session = await requireBusinessUser();
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

  await prisma.diningTable.update({
    where: { id: table.id },
    data: {
      status: TableStatus.RESERVED
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/reservations");
  revalidatePath("/tables");
  redirect(parsed.data.redirectTo);
}
