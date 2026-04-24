"use server";

import { AuditCategory, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessWriteAccess } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { sanitizeNullableText, sanitizeText } from "@/lib/security";
import { settingsSchema } from "@/lib/validation";

export async function updateSettingsAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "settings"
  });
  const businessId = session.user.businessId;

  const parsed = settingsSchema.safeParse({
    restaurantName: sanitizeText(formData.get("restaurantName")),
    phone: sanitizeText(formData.get("phone")),
    email: sanitizeNullableText(formData.get("email")),
    address: sanitizeNullableText(formData.get("address")),
    seatingCapacity: formData.get("seatingCapacity"),
    averageDiningDurationMin: formData.get("averageDiningDurationMin"),
    maxPartySize: formData.get("maxPartySize"),
    reservationLeadTimeDays: formData.get("reservationLeadTimeDays"),
    allowWalkIns: formData.get("allowWalkIns"),
    requirePhoneVerification: formData.get("requirePhoneVerification"),
    monday: formData.get("monday"),
    tuesday: formData.get("tuesday"),
    wednesday: formData.get("wednesday"),
    thursday: formData.get("thursday"),
    friday: formData.get("friday"),
    saturday: formData.get("saturday"),
    sunday: formData.get("sunday"),
    notes: sanitizeNullableText(formData.get("notes"))
  });

  if (!parsed.success) {
    redirect("/settings?error=settings_validation");
  }

  const settings = await prisma.restaurantSettings.findFirstOrThrow({
    where: {
      businessId
    }
  });

  await prisma.restaurantSettings.update({
    where: { id: settings.id },
    data: {
      restaurantName: parsed.data.restaurantName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      seatingCapacity: parsed.data.seatingCapacity,
      averageDiningDurationMin: parsed.data.averageDiningDurationMin,
      maxPartySize: parsed.data.maxPartySize,
      reservationLeadTimeDays: parsed.data.reservationLeadTimeDays,
      allowWalkIns: parsed.data.allowWalkIns === "true",
      requirePhoneVerification: parsed.data.requirePhoneVerification === "true",
      openingHours: {
        monday: parsed.data.monday,
        tuesday: parsed.data.tuesday,
        wednesday: parsed.data.wednesday,
        thursday: parsed.data.thursday,
        friday: parsed.data.friday,
        saturday: parsed.data.saturday,
        sunday: parsed.data.sunday
      },
      notes: parsed.data.notes || null
    }
  });

  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.BUSINESS,
    action: "settings_updated",
    message: "Restaurant settings updated."
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
