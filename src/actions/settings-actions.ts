"use server";

import { AuditCategory, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessAccess, requireBusinessWriteAccess } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { getEmailTwoFactorSchemaStatus } from "@/lib/email-two-factor-runtime";
import { isEmailDeliveryConfigured } from "@/lib/email";
import { enforcePlanUsageLimit, PlanLimitError } from "@/lib/plan-config";
import { prisma } from "@/lib/prisma";
import { sanitizeNullableText, sanitizeText } from "@/lib/security";
import { managementItemToggleSchema, resourceFormSchema, serviceFormSchema, settingsSchema, staffMemberFormSchema } from "@/lib/validation";

function redirectWithPlanError(path: string, error: unknown) {
  if (error instanceof PlanLimitError) {
    redirect(`${path}?error=plan_limit&reason=${error.code}`);
  }
}

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

export async function saveServiceAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "settings"
  });
  const businessId = session.user.businessId;
  const parsed = serviceFormSchema.safeParse({
    id: formData.get("id"),
    name: sanitizeText(formData.get("name")),
    description: sanitizeNullableText(formData.get("description")),
    durationMinutes: formData.get("durationMinutes") ? Number(formData.get("durationMinutes")) : undefined,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    isActive: formData.get("isActive") ?? "true",
    redirectTo: formData.get("redirectTo") ?? "/settings"
  });

  if (!parsed.success) {
    redirect("/settings?error=service_validation");
  }

  const payload = {
    businessId,
    businessType: session.user.business.businessType,
    name: parsed.data.name,
    description: parsed.data.description || null,
    durationMinutes: parsed.data.durationMinutes || null,
    price: parsed.data.price ?? null,
    isActive: parsed.data.isActive === "true"
  };

  if (parsed.data.id) {
    await prisma.service.updateMany({
      where: { id: parsed.data.id, businessId },
      data: payload
    });
  } else {
    try {
      await enforcePlanUsageLimit(businessId, "services");
    } catch (error) {
      redirectWithPlanError("/settings", error);
      throw error;
    }
    await prisma.service.create({
      data: payload
    });
  }

  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.BUSINESS,
    action: parsed.data.id ? "service_updated" : "service_created",
    message: "Service catalog updated."
  });

  revalidatePath("/settings");
  redirect("/settings?saved=services");
}

export async function toggleServiceStatusAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "settings"
  });
  const businessId = session.user.businessId;
  const parsed = managementItemToggleSchema.safeParse({
    id: formData.get("id"),
    nextState: formData.get("nextState"),
    redirectTo: formData.get("redirectTo") ?? "/settings"
  });

  if (!parsed.success) {
    redirect("/settings?error=service_toggle");
  }

  await prisma.service.updateMany({
    where: { id: parsed.data.id, businessId },
    data: { isActive: parsed.data.nextState === "true" }
  });

  revalidatePath("/settings");
  redirect("/settings?saved=services");
}

export async function saveStaffMemberAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "settings"
  });
  const businessId = session.user.businessId;
  const parsed = staffMemberFormSchema.safeParse({
    id: formData.get("id"),
    name: sanitizeText(formData.get("name")),
    phone: sanitizeNullableText(formData.get("phone")),
    email: sanitizeNullableText(formData.get("email")),
    role: sanitizeNullableText(formData.get("role")),
    isActive: formData.get("isActive") ?? "true",
    redirectTo: formData.get("redirectTo") ?? "/settings"
  });

  if (!parsed.success) {
    redirect("/settings?error=staff_validation");
  }

  const payload = {
    businessId,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    role: parsed.data.role || null,
    isActive: parsed.data.isActive === "true"
  };

  if (parsed.data.id) {
    await prisma.staffMember.updateMany({
      where: { id: parsed.data.id, businessId },
      data: payload
    });
  } else {
    try {
      await enforcePlanUsageLimit(businessId, "staff");
    } catch (error) {
      redirectWithPlanError("/settings", error);
      throw error;
    }
    await prisma.staffMember.create({
      data: payload
    });
  }

  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.BUSINESS,
    action: parsed.data.id ? "staff_member_updated" : "staff_member_created",
    message: "Staff list updated."
  });

  revalidatePath("/settings");
  redirect("/settings?saved=staff");
}

export async function toggleStaffMemberStatusAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "settings"
  });
  const businessId = session.user.businessId;
  const parsed = managementItemToggleSchema.safeParse({
    id: formData.get("id"),
    nextState: formData.get("nextState"),
    redirectTo: formData.get("redirectTo") ?? "/settings"
  });

  if (!parsed.success) {
    redirect("/settings?error=staff_toggle");
  }

  await prisma.staffMember.updateMany({
    where: { id: parsed.data.id, businessId },
    data: { isActive: parsed.data.nextState === "true" }
  });

  revalidatePath("/settings");
  redirect("/settings?saved=staff");
}

export async function saveBookableResourceAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "settings"
  });
  const businessId = session.user.businessId;
  const parsed = resourceFormSchema.safeParse({
    id: formData.get("id"),
    name: sanitizeText(formData.get("name")),
    type: sanitizeText(formData.get("type")),
    capacity: formData.get("capacity") ? Number(formData.get("capacity")) : undefined,
    isActive: formData.get("isActive") ?? "true",
    redirectTo: formData.get("redirectTo") ?? "/settings"
  });

  if (!parsed.success) {
    redirect("/settings?error=resource_validation");
  }

  const payload = {
    businessId,
    name: parsed.data.name,
    type: parsed.data.type,
    capacity: parsed.data.capacity ?? null,
    isActive: parsed.data.isActive === "true"
  };

  if (parsed.data.id) {
    await prisma.bookableResource.updateMany({
      where: { id: parsed.data.id, businessId },
      data: payload
    });
  } else {
    try {
      await enforcePlanUsageLimit(businessId, "resources");
    } catch (error) {
      redirectWithPlanError("/settings", error);
      throw error;
    }
    await prisma.bookableResource.create({
      data: payload
    });
  }

  await createAuditLog({
    businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.BUSINESS,
    action: parsed.data.id ? "resource_updated" : "resource_created",
    message: "Bookable resources updated."
  });

  revalidatePath("/settings");
  redirect("/settings?saved=resources");
}

export async function toggleBookableResourceStatusAction(formData: FormData) {
  const session = await requireBusinessWriteAccess({
    roles: [UserRole.BUSINESS_ADMIN],
    feature: "settings"
  });
  const businessId = session.user.businessId;
  const parsed = managementItemToggleSchema.safeParse({
    id: formData.get("id"),
    nextState: formData.get("nextState"),
    redirectTo: formData.get("redirectTo") ?? "/settings"
  });

  if (!parsed.success) {
    redirect("/settings?error=resource_toggle");
  }

  await prisma.bookableResource.updateMany({
    where: { id: parsed.data.id, businessId },
    data: { isActive: parsed.data.nextState === "true" }
  });

  revalidatePath("/settings");
  redirect("/settings?saved=resources");
}
