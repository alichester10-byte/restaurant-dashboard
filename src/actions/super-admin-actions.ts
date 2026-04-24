"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { AuditCategory, AuditSeverity, SubscriptionStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, requireAuth, requireSuperAdmin } from "@/lib/auth";
import { safeCreateAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getRequestIp, sanitizeText } from "@/lib/security";
import { buildOtpAuthUri, generateTwoFactorSecret, verifyTotpToken } from "@/lib/two-factor";
import { businessDataResetSchema, impersonationSchema, superAdminPasswordResetSchema, twoFactorSetupSchema } from "@/lib/validation";

function buildDetailRedirect(businessId: string, key: string, value: string) {
  return `/super-admin/${businessId}?${key}=${encodeURIComponent(value)}`;
}

export async function startSuperAdminTwoFactorSetupAction() {
  const session = await requireSuperAdmin();
  const secret = generateTwoFactorSecret();

  await prisma.user.update({
    where: {
      id: session.user.id
    },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: false
    }
  });

  await safeCreateAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.SUPER_ADMIN,
    action: "super_admin_two_factor_started",
    message: "Super admin initiated two-factor setup.",
    ipAddress: getRequestIp()
  });

  revalidatePath("/admin/security");
  redirect("/admin/security?setup=1");
}

export async function confirmSuperAdminTwoFactorAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: session.user.id
    }
  });

  const parsed = twoFactorSetupSchema.safeParse({
    secret: user.twoFactorSecret ?? "",
    token: sanitizeText(formData.get("token")),
    redirectTo: "/admin/security"
  });

  if (!parsed.success || !user.twoFactorSecret || !verifyTotpToken({ secret: user.twoFactorSecret, token: parsed.data.token })) {
    redirect("/admin/security?error=two_factor");
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      twoFactorEnabled: true
    }
  });

  await safeCreateAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.SUPER_ADMIN,
    action: "super_admin_two_factor_enabled",
    message: "Super admin enabled two-factor authentication.",
    ipAddress: getRequestIp()
  });

  revalidatePath("/admin/security");
  redirect("/admin/security?saved=two_factor_enabled");
}

export async function disableSuperAdminTwoFactorAction() {
  const session = await requireSuperAdmin();

  await prisma.user.update({
    where: {
      id: session.user.id
    },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null
    }
  });

  await safeCreateAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.SUPER_ADMIN,
    action: "super_admin_two_factor_disabled",
    message: "Super admin disabled two-factor authentication.",
    ipAddress: getRequestIp()
  });

  revalidatePath("/admin/security");
  redirect("/admin/security?saved=two_factor_disabled");
}

export async function impersonateBusinessAdminAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = impersonationSchema.safeParse({
    businessId: formData.get("businessId"),
    redirectTo: formData.get("redirectTo") ?? "/dashboard"
  });

  if (!parsed.success) {
    redirect("/super-admin?error=impersonation");
  }

  const target = await prisma.user.findFirst({
    where: {
      businessId: parsed.data.businessId,
      role: UserRole.BUSINESS_ADMIN
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!target) {
    redirect(buildDetailRedirect(parsed.data.businessId, "error", "impersonation"));
  }

  await createSession(target.id, {
    impersonatedByUserId: session.user.id
  });

  await safeCreateAuditLog({
    businessId: parsed.data.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.SUPER_ADMIN,
    action: "impersonation_started",
    message: "Super admin started business admin impersonation.",
    targetType: "User",
    targetId: target.id,
    ipAddress: getRequestIp()
  });

  redirect(parsed.data.redirectTo);
}

export async function stopImpersonationAction() {
  const session = await requireAuth();
  if (!session.impersonatedByUserId) {
    redirect("/");
  }

  await createSession(session.impersonatedByUserId);

  await safeCreateAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.impersonatedByUserId,
    actorRole: UserRole.SUPER_ADMIN,
    category: AuditCategory.SUPER_ADMIN,
    action: "impersonation_stopped",
    message: "Super admin stopped impersonation session.",
    targetType: "User",
    targetId: session.user.id,
    ipAddress: getRequestIp()
  });

  redirect("/super-admin");
}

export async function resetBusinessDataAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = businessDataResetSchema.safeParse({
    businessId: formData.get("businessId"),
    confirmation: sanitizeText(formData.get("confirmation")),
    redirectTo: formData.get("redirectTo") ?? "/super-admin"
  });

  if (!parsed.success) {
    redirect("/super-admin?error=reset_business");
  }

  const business = await prisma.business.findUnique({
    where: {
      id: parsed.data.businessId
    }
  });

  if (!business || (parsed.data.confirmation !== business.slug && parsed.data.confirmation !== business.name)) {
    redirect(buildDetailRedirect(parsed.data.businessId, "error", "reset_business"));
  }

  await prisma.$transaction([
    prisma.reservationRequest.deleteMany({ where: { businessId: business.id } }),
    prisma.callLog.deleteMany({ where: { businessId: business.id } }),
    prisma.reservation.deleteMany({ where: { businessId: business.id } }),
    prisma.customer.deleteMany({ where: { businessId: business.id } }),
    prisma.diningTable.deleteMany({ where: { businessId: business.id } })
  ]);

  await safeCreateAuditLog({
    businessId: business.id,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.SUPER_ADMIN,
    action: "business_data_reset",
    message: "Super admin reset business operational data.",
    targetType: "Business",
    targetId: business.id,
    severity: AuditSeverity.WARN,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/${business.id}`);
  redirect(buildDetailRedirect(business.id, "saved", "reset"));
}

export async function cancelBusinessSubscriptionAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = superAdminPasswordResetSchema.safeParse({
    userId: formData.get("businessId"),
    redirectTo: formData.get("redirectTo") ?? "/super-admin"
  });

  if (!parsed.success) {
    redirect("/super-admin?error=update_business");
  }

  await prisma.business.update({
    where: {
      id: parsed.data.userId
    },
    data: {
      subscriptionStatus: SubscriptionStatus.CANCELED
    }
  });

  await safeCreateAuditLog({
    businessId: parsed.data.userId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.SUPER_ADMIN,
    action: "subscription_canceled",
    message: "Super admin canceled business subscription.",
    targetType: "Business",
    targetId: parsed.data.userId,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/${parsed.data.userId}`);
  redirect(buildDetailRedirect(parsed.data.userId, "saved", "subscription_canceled"));
}

export async function rotateSuperAdminPasswordAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = superAdminPasswordResetSchema.safeParse({
    userId: formData.get("userId"),
    redirectTo: formData.get("redirectTo") ?? "/admin/security"
  });

  if (!parsed.success || parsed.data.userId !== session.user.id) {
    redirect("/admin/security?error=password_reset");
  }

  const temporaryPassword = `Lm${cryptoRandom(6)}!${cryptoRandom(6)}#${cryptoRandom(4)}`;
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  await prisma.user.update({
    where: {
      id: session.user.id
    },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  });

  await safeCreateAuditLog({
    businessId: session.user.businessId,
    actorUserId: session.user.id,
    actorRole: session.user.role,
    category: AuditCategory.SUPER_ADMIN,
    action: "super_admin_password_rotated",
    message: "Super admin password rotated.",
    ipAddress: getRequestIp()
  });

  revalidatePath("/admin/security");
  redirect(`/admin/security?rotated=${encodeURIComponent(temporaryPassword)}`);
}

function cryptoRandom(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from(crypto.randomBytes(length))
    .map((value) => alphabet[value % alphabet.length])
    .join("");
}

export async function getPendingTwoFactorSetup(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      email: true,
      twoFactorEnabled: true,
      twoFactorSecret: true
    }
  });

  if (!user || !user.twoFactorSecret || user.twoFactorEnabled) {
    return null;
  }

  return {
    secret: user.twoFactorSecret,
    otpauthUrl: buildOtpAuthUri({
      issuer: "Limon Masa",
      accountName: user.email,
      secret: user.twoFactorSecret
    })
  };
}
