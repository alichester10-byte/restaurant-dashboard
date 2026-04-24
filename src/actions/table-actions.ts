"use server";

import { AuditCategory, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessWriteAccess } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { sanitizeNullableText, sanitizeText } from "@/lib/security";
import { tableArchiveSchema, tableFormSchema } from "@/lib/validation";

export async function saveTableAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN, UserRole.STAFF],
    feature: "tables"
  });
  const businessId = session.user.businessId;

  const parsed = tableFormSchema.safeParse({
    id: formData.get("id"),
    number: sanitizeText(formData.get("number")),
    label: sanitizeText(formData.get("label")),
    zone: sanitizeText(formData.get("zone")),
    area: formData.get("area"),
    shape: formData.get("shape"),
    seatCapacity: formData.get("seatCapacity"),
    status: formData.get("status"),
    notes: sanitizeNullableText(formData.get("notes")),
    redirectTo: formData.get("redirectTo") ?? "/tables"
  });

  if (!parsed.success) {
    redirect("/tables?error=table_validation");
  }

  const existingByNumber = await prisma.diningTable.findFirst({
    where: {
      businessId,
      number: parsed.data.number,
      ...(parsed.data.id ? { id: { not: parsed.data.id } } : {})
    }
  });

  if (existingByNumber) {
    redirect(`${parsed.data.redirectTo}?error=table_number_exists`);
  }

  if (parsed.data.id) {
    const table = await prisma.diningTable.findFirst({
      where: {
        id: parsed.data.id,
        businessId,
        archivedAt: null
      }
    });

    if (!table) {
      redirect(`${parsed.data.redirectTo}?error=table_missing`);
    }

    await prisma.diningTable.update({
      where: { id: table.id },
      data: {
        number: parsed.data.number,
        label: parsed.data.label,
        zone: parsed.data.zone,
        area: parsed.data.area,
        shape: parsed.data.shape,
        seatCapacity: parsed.data.seatCapacity,
        status: parsed.data.status,
        notes: parsed.data.notes || null
      }
    });

    await createAuditLog({
      businessId,
      actorUserId: session.user.id,
      actorRole: session.user.role,
      category: AuditCategory.TABLE,
      action: "table_updated",
      message: "Dining table updated.",
      targetType: "DiningTable",
      targetId: table.id
    });

    revalidatePath("/dashboard");
    revalidatePath("/tables");
    redirect(`/tables?tableId=${table.id}&saved=updated`);
  }

  const table = await prisma.diningTable.create({
    data: {
      businessId,
      number: parsed.data.number,
      label: parsed.data.label,
      zone: parsed.data.zone,
      area: parsed.data.area,
      shape: parsed.data.shape,
      seatCapacity: parsed.data.seatCapacity,
      status: parsed.data.status,
      notes: parsed.data.notes || null
    }
  });

  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.TABLE,
    action: "table_created",
    message: "Dining table created.",
    targetType: "DiningTable",
    targetId: table.id
  });

  revalidatePath("/dashboard");
  revalidatePath("/tables");
  redirect(`/tables?tableId=${table.id}&saved=created`);
}

export async function archiveTableAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "tables"
  });
  const businessId = session.user.businessId;

  const parsed = tableArchiveSchema.safeParse({
    tableId: formData.get("tableId"),
    redirectTo: formData.get("redirectTo") ?? "/tables"
  });

  if (!parsed.success) {
    redirect("/tables?error=table_delete");
  }

  const table = await prisma.diningTable.findFirst({
    where: {
      id: parsed.data.tableId,
      businessId,
      archivedAt: null
    }
  });

  if (!table) {
    redirect(`${parsed.data.redirectTo}?error=table_missing`);
  }

  await prisma.diningTable.update({
    where: {
      id: table.id
    },
    data: {
      archivedAt: new Date()
    }
  });

  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.TABLE,
    action: "table_archived",
    message: "Dining table archived.",
    targetType: "DiningTable",
    targetId: table.id
  });

  revalidatePath("/dashboard");
  revalidatePath("/tables");
  redirect("/tables?saved=archived");
}
