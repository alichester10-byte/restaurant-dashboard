"use server";

import { AuditCategory, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessAccess, requireBusinessWriteAccess } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { getEmailTwoFactorSchemaStatus } from "@/lib/email-two-factor-runtime";
import { isEmailDeliveryConfigured } from "@/lib/email";
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
    businessType: formData.get("businessType"),
    restaurantName: sanitizeText(formData.get("restaurantName")),
    phone: sanitizeText(formData.get("phone")),
    email: sanitizeNullableText(formData.get("email")),
    address: sanitizeNullableText(formData.get("address")),
    serviceFocus: sanitizeText(formData.get("serviceFocus")),
    seatingCapacity: formData.get("seatingCapacity"),
    averageDiningDurationMin: formData.get("averageDiningDurationMin"),
    maxPartySize: formData.get("maxPartySize"),
    reservationLeadTimeDays: formData.get("reservationLeadTimeDays"),
    reminderEnabled: formData.get("reminderEnabled"),
    reminderTimingHours: formData.get("reminderTimingHours"),
    reminderChannel: formData.get("reminderChannel"),
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

  await prisma.$transaction([
    prisma.business.update({
      where: {
        id: businessId
      },
      data: {
        businessType: parsed.data.businessType,
        restaurantType: parsed.data.serviceFocus
      }
    }),
    prisma.restaurantSettings.update({
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
        reminderEnabled: parsed.data.reminderEnabled === "true",
        reminderTimingHours: parsed.data.reminderTimingHours,
        reminderChannel: parsed.data.reminderChannel,
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
    })
  ]);

  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.BUSINESS,
    action: "settings_updated",
    message: "Business settings updated."
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function enableEmailTwoFactorAction() {
  const session = await requireBusinessAccess({
    roles: [UserRole.BUSINESS_ADMIN, UserRole.STAFF]
  });
  const schema = await getEmailTwoFactorSchemaStatus();

  if (!schema.ready) {
    redirect("/settings?security=email_2fa_schema_missing");
  }

  if (!isEmailDeliveryConfigured()) {
    redirect("/settings?security=email_2fa_setup_required");
  }

  await prisma.user.update({
    where: {
      id: session.user.id
    },
    data: {
      emailTwoFactorEnabled: true
    }
  });

  await createAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.SECURITY,
    action: "email_two_factor_enabled",
    message: "User enabled email-based two-factor authentication."
  });

  revalidatePath("/settings");
  redirect("/settings?security=email_2fa_enabled");
}

export async function disableEmailTwoFactorAction() {
  const session = await requireBusinessAccess({
    roles: [UserRole.BUSINESS_ADMIN, UserRole.STAFF]
  });
  const schema = await getEmailTwoFactorSchemaStatus();

  if (!schema.ready) {
    redirect("/settings?security=email_2fa_schema_missing");
  }

  if (session.user.emailTwoFactorRequiredByAdmin) {
    redirect("/settings?security=email_2fa_forced");
  }

  await prisma.emailTwoFactorCode.deleteMany({
    where: {
      userId: session.user.id
    }
  });

  await prisma.user.update({
    where: {
      id: session.user.id
    },
    data: {
      emailTwoFactorEnabled: false
    }
  });

  await createAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.SECURITY,
    action: "email_two_factor_disabled",
    message: "User disabled email-based two-factor authentication."
  });

  revalidatePath("/settings");
  redirect("/settings?security=email_2fa_disabled");
}
