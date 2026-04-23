"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sendAccountLifecycleEmails } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { CreateBusinessError, createBusinessWithAdmin } from "@/lib/tenant";
import { businessAdminCreateSchema, businessOnboardingSchema, businessStatusSchema } from "@/lib/validation";

function getCreateBusinessErrorRedirect(pathname: string, code: string) {
  return `${pathname}?error=${encodeURIComponent(code)}`;
}

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
