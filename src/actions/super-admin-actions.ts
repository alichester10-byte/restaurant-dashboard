"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  AuditCategory,
  AuditSeverity,
  BillingPaymentStatus,
  ComplianceRequestStatus,
  ComplianceRequestType,
  IntegrationStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, requireAuth, requireSuperAdmin } from "@/lib/auth";
import { safeCreateAuditLog } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/email";
import { isEmailDeliveryConfigured } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/billing";
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

function getSafeRedirect(formData: FormData, fallback: string) {
  return String(formData.get("redirectTo") || fallback);
}

function createPlainToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
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

export async function revokeUserSessionsAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const userId = sanitizeText(formData.get("userId"));
  const redirectTo = getSafeRedirect(formData, "/super-admin/users");

  if (!userId) {
    redirect(`${redirectTo}?error=revoke_sessions`);
  }

  await prisma.session.deleteMany({
    where: {
      userId
    }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: session.user.businessId,
    category: AuditCategory.SECURITY,
    action: "user_sessions_revoked",
    message: "Super admin revoked user sessions.",
    targetType: "User",
    targetId: userId,
    severity: AuditSeverity.WARN,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/users");
  revalidatePath("/super-admin/security");
  redirect(`${redirectTo}?saved=revoke_sessions`);
}

export async function forceLogoutBusinessSessionsAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const businessId = sanitizeText(formData.get("businessId"));
  const redirectTo = getSafeRedirect(formData, "/super-admin/businesses");

  if (!businessId) {
    redirect(`${redirectTo}?error=force_logout`);
  }

  await prisma.session.deleteMany({
    where: {
      user: {
        is: {
          businessId
        }
      }
    }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId,
    category: AuditCategory.SECURITY,
    action: "business_sessions_revoked",
    message: "Super admin force logged out all business sessions.",
    targetType: "Business",
    targetId: businessId,
    severity: AuditSeverity.WARN,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/businesses");
  revalidatePath("/super-admin/security");
  redirect(`${redirectTo}?saved=force_logout`);
}

export async function forceLogoutAllSessionsAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const redirectTo = getSafeRedirect(formData, "/super-admin/security");

  await prisma.session.deleteMany({
    where: {
      NOT: {
        userId: session.user.id
      }
    }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: session.user.businessId,
    category: AuditCategory.SECURITY,
    action: "all_sessions_revoked",
    message: "Super admin revoked all active platform sessions.",
    severity: AuditSeverity.CRITICAL,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/security");
  redirect(`${redirectTo}?saved=all_sessions_revoked`);
}

export async function setUserAccountStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const userId = sanitizeText(formData.get("userId"));
  const mode = sanitizeText(formData.get("mode"));
  const redirectTo = getSafeRedirect(formData, "/super-admin/users");

  const target = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!target) {
    redirect(`${redirectTo}?error=user_status`);
  }

  const disabling = mode === "disable";
  await prisma.user.update({
    where: { id: target.id },
    data: disabling
      ? {
          disabledAt: new Date(),
          disabledReason: "Super admin action"
        }
      : {
          disabledAt: null,
          disabledReason: null,
          failedLoginAttempts: 0,
          lockedUntil: null
        },
    select: { id: true }
  });

  if (disabling) {
    await prisma.session.deleteMany({
      where: { userId: target.id }
    });
  }

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: target.businessId,
    category: AuditCategory.SECURITY,
    action: disabling ? "user_disabled" : "user_restored",
    message: disabling ? "Super admin disabled a user account." : "Super admin restored a user account.",
    targetType: "User",
    targetId: target.id,
    severity: AuditSeverity.WARN,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/users");
  redirect(`${redirectTo}?saved=${disabling ? "user_disabled" : "user_restored"}`);
}

export async function setUserEmailTwoFactorRequirementAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const userId = sanitizeText(formData.get("userId"));
  const mode = sanitizeText(formData.get("mode"));
  const redirectTo = getSafeRedirect(formData, "/super-admin/users");

  const target = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!target) {
    redirect(`${redirectTo}?error=email_2fa`);
  }

  if (target.role === UserRole.SUPER_ADMIN && mode === "disable" && target.id === session.user.id) {
    redirect(`${redirectTo}?error=email_2fa`);
  }

  const enabling = mode !== "disable";
  await prisma.user.update({
    where: { id: target.id },
    data: {
      emailTwoFactorEnabled: enabling ? true : target.role === UserRole.SUPER_ADMIN ? true : false,
      emailTwoFactorRequiredByAdmin: enabling ? true : false
    },
    select: { id: true }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: target.businessId,
    category: AuditCategory.SECURITY,
    action: enabling ? "super_admin_email_two_factor_forced" : "super_admin_email_two_factor_relaxed",
    message: enabling
      ? "Super admin forced email two-factor authentication for a user."
      : "Super admin relaxed email two-factor enforcement for a user.",
    targetType: "User",
    targetId: target.id,
    severity: target.role === UserRole.SUPER_ADMIN ? AuditSeverity.CRITICAL : AuditSeverity.INFO,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/users");
  redirect(`${redirectTo}?saved=${enabling ? "email_2fa_forced" : "email_2fa_relaxed"}`);
}

export async function forcePasswordResetAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const userId = sanitizeText(formData.get("userId"));
  const redirectTo = getSafeRedirect(formData, "/super-admin/users");
  const target = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!target) {
    redirect(`${redirectTo}?error=password_reset`);
  }

  const token = createPlainToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: target.id,
      usedAt: null
    }
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: target.id,
      tokenHash,
      expiresAt
    }
  });

  if (isEmailDeliveryConfigured()) {
    await sendPasswordResetEmail({
      to: target.email,
      name: target.name,
      resetUrl: `${getAppBaseUrl()}/reset-password?token=${token}`
    });
  }

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: target.businessId,
    category: AuditCategory.SECURITY,
    action: "password_reset_forced",
    message: "Super admin initiated a forced password reset.",
    targetType: "User",
    targetId: target.id,
    severity: AuditSeverity.WARN,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/users");
  redirect(`${redirectTo}?saved=password_reset`);
}

export async function resetBusinessIntegrationStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const businessId = sanitizeText(formData.get("businessId"));
  const redirectTo = getSafeRedirect(formData, "/super-admin/meta");

  if (!businessId) {
    redirect(`${redirectTo}?error=integration_reset`);
  }

  await prisma.integrationConnection.updateMany({
    where: { businessId },
    data: {
      status: IntegrationStatus.NEEDS_CONFIGURATION,
      errorMessage: null,
      accessTokenEncrypted: null,
      webhookSubscribedAt: null,
      lastWebhookReceivedAt: null
    }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId,
    category: AuditCategory.INTEGRATION,
    action: "integration_reset",
    message: "Super admin reset business integration status.",
    targetType: "Business",
    targetId: businessId,
    severity: AuditSeverity.WARN,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/meta");
  revalidatePath("/super-admin/businesses");
  redirect(`${redirectTo}?saved=integration_reset`);
}

export async function updatePlatformConfigAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const redirectTo = getSafeRedirect(formData, "/super-admin/legal");
  const current = await prisma.platformConfig.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" }
  });

  const readMaybe = (key: string, fallback: string | null = null) =>
    formData.has(key) ? sanitizeText(formData.get(key)) || fallback : fallback;
  const readBool = (key: string, fallback: boolean) =>
    formData.has(key) ? sanitizeText(formData.get(key)) !== "false" : fallback;

  await prisma.platformConfig.upsert({
    where: { id: "platform" },
    update: {
      companyName: readMaybe("companyName", current.companyName) ?? current.companyName,
      contactEmail: readMaybe("contactEmail", current.contactEmail) ?? current.contactEmail,
      businessAddress: readMaybe("businessAddress", current.businessAddress),
      privacyPolicyVersion: readMaybe("privacyPolicyVersion", current.privacyPolicyVersion) ?? current.privacyPolicyVersion,
      termsVersion: readMaybe("termsVersion", current.termsVersion) ?? current.termsVersion,
      cookieNoticeEnabled: readBool("cookieNoticeEnabled", current.cookieNoticeEnabled),
      dataDeletionRequestUrl: readMaybe("dataDeletionRequestUrl", current.dataDeletionRequestUrl),
      metaDomainVerificationStatus: readMaybe("metaDomainVerificationStatus", current.metaDomainVerificationStatus),
      metaBusinessVerificationStatus: readMaybe("metaBusinessVerificationStatus", current.metaBusinessVerificationStatus),
      metaAppReviewStatus: readMaybe("metaAppReviewStatus", current.metaAppReviewStatus),
      deploymentMarker: readMaybe("deploymentMarker", current.deploymentMarker),
      complianceNotes: readMaybe("complianceNotes", current.complianceNotes)
    },
    create: {
      id: "platform",
      companyName: readMaybe("companyName", current.companyName) ?? current.companyName,
      contactEmail: readMaybe("contactEmail", current.contactEmail) ?? current.contactEmail,
      businessAddress: readMaybe("businessAddress", current.businessAddress),
      privacyPolicyVersion: readMaybe("privacyPolicyVersion", current.privacyPolicyVersion) ?? current.privacyPolicyVersion,
      termsVersion: readMaybe("termsVersion", current.termsVersion) ?? current.termsVersion,
      cookieNoticeEnabled: readBool("cookieNoticeEnabled", current.cookieNoticeEnabled),
      dataDeletionRequestUrl: readMaybe("dataDeletionRequestUrl", current.dataDeletionRequestUrl),
      metaDomainVerificationStatus: readMaybe("metaDomainVerificationStatus", current.metaDomainVerificationStatus),
      metaBusinessVerificationStatus: readMaybe("metaBusinessVerificationStatus", current.metaBusinessVerificationStatus),
      metaAppReviewStatus: readMaybe("metaAppReviewStatus", current.metaAppReviewStatus),
      deploymentMarker: readMaybe("deploymentMarker", current.deploymentMarker),
      complianceNotes: readMaybe("complianceNotes", current.complianceNotes)
    }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: session.user.businessId,
    category: AuditCategory.SUPER_ADMIN,
    action: "legal_document_updated",
    message: "Super admin updated platform legal/compliance settings.",
    severity: AuditSeverity.INFO,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/legal");
  revalidatePath("/super-admin/system");
  revalidatePath("/super-admin/meta");
  redirect(`${redirectTo}?saved=platform_config`);
}

export async function createComplianceRequestAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const redirectTo = getSafeRedirect(formData, "/super-admin/legal");
  const businessId = sanitizeText(formData.get("businessId")) || undefined;
  const requestedByUserId = sanitizeText(formData.get("requestedByUserId")) || undefined;
  const type = sanitizeText(formData.get("type")) as ComplianceRequestType;

  await prisma.complianceRequest.create({
    data: {
      businessId,
      requestedByUserId,
      type,
      status: ComplianceRequestStatus.OPEN,
      subjectEmail: sanitizeText(formData.get("subjectEmail")) || null,
      notes: sanitizeText(formData.get("notes")) || null
    }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: businessId ?? session.user.businessId,
    category: AuditCategory.SUPER_ADMIN,
    action: "compliance_request_created",
    message: "Super admin created a compliance/data request record.",
    severity: AuditSeverity.INFO,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/legal");
  redirect(`${redirectTo}?saved=compliance_request`);
}

export async function updateComplianceRequestStatusAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const redirectTo = getSafeRedirect(formData, "/super-admin/legal");
  const id = sanitizeText(formData.get("id"));
  const status = sanitizeText(formData.get("status")) as ComplianceRequestStatus;

  await prisma.complianceRequest.update({
    where: { id },
    data: {
      status,
      completedAt: status === ComplianceRequestStatus.COMPLETED ? new Date() : null,
      notes: sanitizeText(formData.get("notes")) || undefined
    }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: session.user.businessId,
    category: AuditCategory.SUPER_ADMIN,
    action: "compliance_request_updated",
    message: "Super admin updated compliance request status.",
    severity: AuditSeverity.INFO,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/legal");
  redirect(`${redirectTo}?saved=compliance_status`);
}

export async function markBillingIssueAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const businessId = sanitizeText(formData.get("businessId"));
  const redirectTo = getSafeRedirect(formData, "/super-admin/billing");
  const business = await prisma.business.update({
    where: { id: businessId },
    data: {
      subscriptionStatus: SubscriptionStatus.PAST_DUE,
      lastPaymentFailedAt: new Date()
    }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: business.id,
    category: AuditCategory.BILLING,
    action: "billing_payment_issue_marked",
    message: "Super admin marked a billing issue on business account.",
    targetType: "Business",
    targetId: business.id,
    severity: AuditSeverity.WARN,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/billing");
  redirect(`${redirectTo}?saved=billing_issue`);
}

export async function manualPlanOverrideAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const businessId = sanitizeText(formData.get("businessId"));
  const plan = sanitizeText(formData.get("plan")) as SubscriptionPlan;
  const redirectTo = getSafeRedirect(formData, "/super-admin/billing");

  await prisma.business.update({
    where: { id: businessId },
    data: {
      subscriptionPlan: plan,
      subscriptionStatus: SubscriptionStatus.ACTIVE
    }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId,
    category: AuditCategory.BILLING,
    action: "billing_plan_changed",
    message: "Super admin manually changed business plan.",
    targetType: "Business",
    targetId: businessId,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/billing");
  revalidatePath("/super-admin/businesses");
  redirect(`${redirectTo}?saved=plan_changed`);
}

export async function runMetaDiagnosticsAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const redirectTo = getSafeRedirect(formData, "/super-admin/meta");

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: session.user.businessId,
    category: AuditCategory.INTEGRATION,
    action: "meta_diagnostics_tested",
    message: "Super admin ran Meta configuration diagnostics.",
    ipAddress: getRequestIp()
  });

  redirect(`${redirectTo}?saved=meta_diagnostics`);
}

export async function testWebhookEndpointAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const redirectTo = getSafeRedirect(formData, "/super-admin/meta");

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId: session.user.businessId,
    category: AuditCategory.WEBHOOK,
    action: "meta_webhook_tested",
    message: "Super admin tested webhook endpoint availability.",
    ipAddress: getRequestIp()
  });

  redirect(`${redirectTo}?saved=webhook_test`);
}

export async function addBusinessInternalNoteAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const businessId = sanitizeText(formData.get("businessId"));
  const redirectTo = getSafeRedirect(formData, "/super-admin/businesses");
  const note = sanitizeText(formData.get("internalNotes"));

  await prisma.business.update({
    where: { id: businessId },
    data: {
      internalNotes: note || null
    }
  });

  await safeCreateAuditLog({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    businessId,
    category: AuditCategory.SUPER_ADMIN,
    action: "business_internal_note_updated",
    message: "Super admin updated business internal note.",
    targetType: "Business",
    targetId: businessId,
    ipAddress: getRequestIp()
  });

  revalidatePath("/super-admin/businesses");
  revalidatePath(`/super-admin/${businessId}`);
  redirect(`${redirectTo}?saved=note`);
}
