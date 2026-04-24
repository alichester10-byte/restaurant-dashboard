"use server";

import { AuditCategory, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requireSuperAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { sendAccountLifecycleEmails } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { sanitizeNullableText, sanitizeText } from "@/lib/security";
import { CreateBusinessError, createBusinessWithAdmin } from "@/lib/tenant";
import { businessAdminCreateSchema, businessOnboardingSchema, businessStatusSchema } from "@/lib/validation";

function getCreateBusinessErrorRedirect(pathname: string, code: string) {
  return `${pathname}?error=${encodeURIComponent(code)}`;
}

export async function onboardingCreateBusinessAction(formData: FormData) {
  const parsed = businessOnboardingSchema.safeParse({
    businessName: sanitizeText(formData.get("businessName")),
    ownerName: sanitizeText(formData.get("ownerName")),
    ownerEmail: sanitizeText(formData.get("ownerEmail")).toLowerCase(),
    ownerPhone: sanitizeText(formData.get("ownerPhone")),
    businessPhone: sanitizeText(formData.get("businessPhone")),
    businessAddress: sanitizeText(formData.get("businessAddress")),
    city: sanitizeText(formData.get("city")),
    district: sanitizeText(formData.get("district")),
    restaurantType: sanitizeText(formData.get("restaurantType")),
    estimatedTableCount: formData.get("estimatedTableCount"),
    notes: sanitizeNullableText(formData.get("notes")),
    adminPassword: formData.get("adminPassword"),
    createDefaultTables: formData.get("createDefaultTables") ?? "false",
    redirectTo: formData.get("redirectTo") ?? "/login"
  });

  if (!parsed.success) {
    redirect(getCreateBusinessErrorRedirect("/onboarding", "validation"));
  }

  try {
    await createBusinessWithAdmin({
      ...parsed.data,
      createDefaultTables: parsed.data.createDefaultTables === "true"
    });
  } catch (error) {
    if (error instanceof CreateBusinessError) {
      redirect(getCreateBusinessErrorRedirect("/onboarding", error.code));
    }

    redirect(getCreateBusinessErrorRedirect("/onboarding", "unknown"));
  }

  redirect(`${parsed.data.redirectTo}?created=1`);
}

export async function superAdminCreateBusinessAction(formData: FormData) {
  const session = await requireSuperAdmin();

  const parsed = businessAdminCreateSchema.safeParse({
    businessName: sanitizeText(formData.get("businessName")),
    ownerName: sanitizeText(formData.get("ownerName")),
    ownerEmail: sanitizeText(formData.get("ownerEmail")).toLowerCase(),
    ownerPhone: sanitizeText(formData.get("ownerPhone")),
    businessPhone: sanitizeText(formData.get("businessPhone")),
    businessAddress: sanitizeText(formData.get("businessAddress")),
    city: sanitizeText(formData.get("city")),
    district: sanitizeText(formData.get("district")),
    restaurantType: sanitizeText(formData.get("restaurantType")),
    estimatedTableCount: formData.get("estimatedTableCount"),
    notes: sanitizeNullableText(formData.get("notes")),
    adminPassword: formData.get("adminPassword"),
    createDefaultTables: formData.get("createDefaultTables") ?? "true",
    redirectTo: "/super-admin",
    plan: formData.get("plan"),
    subscriptionStatus: formData.get("subscriptionStatus")
  });

  if (!parsed.success) {
    redirect(getCreateBusinessErrorRedirect("/super-admin", "validation"));
  }

  try {
    const result = await createBusinessWithAdmin({
      ...parsed.data,
      createDefaultTables: parsed.data.createDefaultTables === "true"
    });

    await sendAccountLifecycleEmails({
      userId: result.admin.id,
      email: result.admin.email,
      name: result.admin.name,
      businessName: result.business.name
    });

    await createAuditLog({
      businessId: result.business.id,
      actorUserId: session.user.id,
      actorRole: session.user.role,
      category: AuditCategory.SUPER_ADMIN,
      action: "business_created_by_super_admin",
      message: "Super admin created a business workspace.",
      targetType: "Business",
      targetId: result.business.id
    });
  } catch (error) {
    if (error instanceof CreateBusinessError) {
      redirect(getCreateBusinessErrorRedirect("/super-admin", error.code));
    }

    redirect(getCreateBusinessErrorRedirect("/super-admin", "unknown"));
  }

  revalidatePath("/super-admin");
  redirect("/super-admin?created=1");
}

export async function updateBusinessStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();

  const parsed = businessStatusSchema.safeParse({
    businessId: formData.get("businessId"),
    status: formData.get("status"),
    plan: formData.get("plan") || undefined,
    subscriptionStatus: formData.get("subscriptionStatus") || undefined,
    internalNotes: sanitizeNullableText(formData.get("internalNotes")),
    trialDays: formData.get("trialDays") || undefined,
    redirectTo: formData.get("redirectTo") ?? "/super-admin"
  });

  if (!parsed.success) {
    redirect("/super-admin?error=update_business");
  }

  const business = await prisma.business.findUnique({
    where: { id: parsed.data.businessId }
  });

  if (!business) {
    redirect("/super-admin?error=update_business");
  }

  const nextTrialEnd =
    typeof parsed.data.trialDays === "number"
      ? new Date(Date.now() + parsed.data.trialDays * 24 * 60 * 60 * 1000)
      : business.trialEndsAt;

  await prisma.business.update({
    where: {
      id: parsed.data.businessId
    },
    data: {
      status: parsed.data.status,
      suspendedAt: parsed.data.status === "SUSPENDED" ? new Date() : null,
      subscriptionPlan: parsed.data.plan,
      subscriptionStatus: parsed.data.subscriptionStatus,
      internalNotes: parsed.data.internalNotes || null,
      trialEndsAt: nextTrialEnd
    }
  });

  await createAuditLog({
    businessId: business.id,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.SUPER_ADMIN,
    action: "business_status_updated",
    message: "Super admin updated business plan or status.",
    targetType: "Business",
    targetId: business.id,
    metadata: {
      status: parsed.data.status,
      plan: parsed.data.plan,
      subscriptionStatus: parsed.data.subscriptionStatus,
      trialDays: parsed.data.trialDays ?? null
    }
  });

  revalidatePath("/super-admin");
  redirect(parsed.data.redirectTo);
}
