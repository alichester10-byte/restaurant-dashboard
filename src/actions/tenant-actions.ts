"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBusinessWithAdmin } from "@/lib/tenant";
import { businessAdminCreateSchema, businessOnboardingSchema, businessStatusSchema } from "@/lib/validation";

export async function onboardingCreateBusinessAction(formData: FormData) {
  const parsed = businessOnboardingSchema.safeParse({
    businessName: formData.get("businessName"),
    slug: formData.get("slug"),
    restaurantName: formData.get("restaurantName"),
    phone: formData.get("phone"),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
    seatingCapacity: formData.get("seatingCapacity"),
    createDefaultTables: formData.get("createDefaultTables") ?? "false",
    redirectTo: formData.get("redirectTo") ?? "/login"
  });

  if (!parsed.success) {
    redirect(`/onboarding?error=validation`);
  }

  await createBusinessWithAdmin({
    ...parsed.data,
    createDefaultTables: parsed.data.createDefaultTables === "true"
  });

  redirect("/login?created=1");
}

export async function superAdminCreateBusinessAction(formData: FormData) {
  await requireRole(UserRole.SUPER_ADMIN);

  const parsed = businessAdminCreateSchema.safeParse({
    businessName: formData.get("businessName"),
    slug: formData.get("slug"),
    restaurantName: formData.get("restaurantName"),
    phone: formData.get("phone"),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
    seatingCapacity: formData.get("seatingCapacity"),
    createDefaultTables: formData.get("createDefaultTables") ?? "true",
    redirectTo: "/super-admin",
    plan: formData.get("plan"),
    subscriptionStatus: formData.get("subscriptionStatus")
  });

  if (!parsed.success) {
    redirect("/super-admin?error=create_business");
  }

  await createBusinessWithAdmin({
    ...parsed.data,
    createDefaultTables: parsed.data.createDefaultTables === "true"
  });

  revalidatePath("/super-admin");
  redirect("/super-admin?created=1");
}

export async function updateBusinessStatusAction(formData: FormData) {
  await requireRole(UserRole.SUPER_ADMIN);

  const parsed = businessStatusSchema.safeParse({
    businessId: formData.get("businessId"),
    status: formData.get("status"),
    plan: formData.get("plan") || undefined,
    subscriptionStatus: formData.get("subscriptionStatus") || undefined,
    redirectTo: formData.get("redirectTo") ?? "/super-admin"
  });

  if (!parsed.success) {
    redirect("/super-admin?error=update_business");
  }

  await prisma.business.update({
    where: {
      id: parsed.data.businessId
    },
    data: {
      status: parsed.data.status,
      suspendedAt: parsed.data.status === "SUSPENDED" ? new Date() : null,
      subscriptionPlan: parsed.data.plan,
      subscriptionStatus: parsed.data.subscriptionStatus
    }
  });

  revalidatePath("/super-admin");
  redirect(parsed.data.redirectTo);
}
