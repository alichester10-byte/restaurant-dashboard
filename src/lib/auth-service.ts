import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { AuditCategory, SubscriptionStatus } from "@prisma/client";
import { getAppBaseUrl, hasBusinessAccess } from "@/lib/billing";
import { createSession } from "@/lib/auth";
import { safeCreateAuditLog } from "@/lib/audit";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { rateLimitPlaceholder } from "@/lib/rate-limit";
import { getRequestIp, sanitizeNullableText, sanitizeText } from "@/lib/security";
import { verifyTotpToken } from "@/lib/two-factor";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "@/lib/validation";
import { CreateBusinessError, createBusinessWithAdmin } from "@/lib/tenant";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const prismaAuth = prisma as any;

export class AuthFlowError extends Error {
  code:
    | "invalid_credentials"
    | "validation"
    | "email_exists"
    | "weak_password"
    | "invalid_token"
    | "expired_token"
    | "rate_limited"
    | "unknown";

  constructor(
    code:
      | "invalid_credentials"
      | "validation"
      | "email_exists"
      | "weak_password"
      | "invalid_token"
      | "expired_token"
      | "rate_limited"
      | "unknown",
    message: string
  ) {
    super(message);
    this.code = code;
  }
}

function createPlainToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function loginWithEmail(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: sanitizeText(formData.get("email")).toLowerCase(),
    password: formData.get("password")
  });

  if (!parsed.success) {
    throw new AuthFlowError("validation", parsed.error.flatten().formErrors[0] ?? "Bilgiler geçersiz.");
  }

  const email = normalizeEmail(parsed.data.email);
  const ipAddress = getRequestIp();
  const limiter = await rateLimitPlaceholder(email, "login");
  if (!limiter.allowed) {
    throw new AuthFlowError("rate_limited", "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.");
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    },
    include: {
      business: true
    }
  });

  if (!user) {
    await safeCreateAuditLog({
      category: AuditCategory.AUTH,
      action: "login_failed",
      message: "Login failed because user does not exist.",
      metadata: {
        email
      },
      ipAddress
    });
    throw new AuthFlowError("invalid_credentials", "E-posta veya şifre hatalı.");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await safeCreateAuditLog({
      businessId: user.businessId,
      actorUserId: user.id,
      actorRole: user.role,
      category: AuditCategory.AUTH,
      action: "login_locked",
      message: "Login blocked because account is temporarily locked.",
      metadata: {
        lockedUntil: user.lockedUntil.toISOString()
      },
      ipAddress
    });
    throw new AuthFlowError("rate_limited", "Hesap geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.");
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!isValid) {
    const nextAttemptCount = user.failedLoginAttempts + 1;
    const lockedUntil = nextAttemptCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        failedLoginAttempts: nextAttemptCount,
        lockedUntil
      }
    });

    await safeCreateAuditLog({
      businessId: user.businessId,
      actorUserId: user.id,
      actorRole: user.role,
      category: AuditCategory.AUTH,
      action: "login_failed",
      message: "Login failed due to invalid password.",
      metadata: {
        failedLoginAttempts: nextAttemptCount,
        lockedUntil: lockedUntil?.toISOString() ?? null
      },
      ipAddress
    });
    throw new AuthFlowError("invalid_credentials", "E-posta veya şifre hatalı.");
  }

  if (user.twoFactorEnabled) {
    const otpCode = parsed.data.otpCode?.trim() ?? "";
    if (!user.twoFactorSecret || !verifyTotpToken({ secret: user.twoFactorSecret, token: otpCode })) {
      await safeCreateAuditLog({
        businessId: user.businessId,
        actorUserId: user.id,
        actorRole: user.role,
        category: AuditCategory.AUTH,
        action: "two_factor_failed",
        message: "Two-factor verification failed during login.",
        ipAddress
      });
      throw new AuthFlowError("invalid_credentials", "Doğrulama kodu geçersiz.");
    }
  }

  await createSession(user.id);
  await prisma.business.update({
    where: { id: user.businessId },
    data: { lastActivityAt: new Date() }
  });
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress
    }
  });
  await safeCreateAuditLog({
    businessId: user.businessId,
    actorUserId: user.id,
    actorRole: user.role,
    category: AuditCategory.AUTH,
    action: "login_success",
    message: "User logged in successfully.",
    ipAddress
  });

  return {
    redirectTo:
      user.role === "SUPER_ADMIN"
        ? "/super-admin"
        : hasBusinessAccess(user.business, user.role)
          ? "/dashboard"
          : "/billing",
    user
  };
}

export async function registerBusinessAccount(formData: FormData) {
  const email = normalizeEmail(sanitizeText(formData.get("ownerEmail")));
  const limiter = await rateLimitPlaceholder(email, "register");
  if (!limiter.allowed) {
    throw new AuthFlowError("rate_limited", "Çok fazla kayıt denemesi yapıldı. Lütfen tekrar deneyin.");
  }

  const parsed = (
    await import("@/lib/validation")
  ).businessOnboardingSchema.safeParse({
    businessName: sanitizeText(formData.get("businessName")),
    ownerName: sanitizeText(formData.get("ownerName")),
    ownerEmail: email,
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
    redirectTo: formData.get("redirectTo") ?? "/login"
  });

  if (!parsed.success) {
    throw new AuthFlowError("validation", parsed.error.flatten().formErrors[0] ?? "Kayıt bilgileri geçersiz.");
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(parsed.data.adminPassword)) {
    throw new AuthFlowError("weak_password", "Şifre en az 8 karakter, bir harf ve bir rakam içermeli.");
  }

  let result: Awaited<ReturnType<typeof createBusinessWithAdmin>>;
  try {
    result = await createBusinessWithAdmin({
      ...parsed.data,
      createDefaultTables: parsed.data.createDefaultTables === "true"
    });
  } catch (error) {
    if (error instanceof CreateBusinessError) {
      if (error.code === "owner_email_exists") {
        throw new AuthFlowError("email_exists", "Bu e-posta ile zaten bir hesap oluşturulmuş.");
      }
      throw new AuthFlowError("validation", error.message);
    }
    throw new AuthFlowError("unknown", "Kayıt sırasında beklenmeyen bir hata oluştu.");
  }

  await sendAccountLifecycleEmails({
    userId: result.admin.id,
    email,
    name: result.admin.name,
    businessName: result.business.name
  });

  return {
    redirectTo: `${parsed.data.redirectTo}?toast=account_created&email=${encodeURIComponent(email)}`,
    email
  };
}

export async function sendAccountLifecycleEmails(input: {
  userId: string;
  email: string;
  name: string;
  businessName: string;
}) {
  const verificationToken = await createEmailVerificationToken({
    userId: input.userId,
    email: input.email
  });

  const verificationUrl = `${getAppBaseUrl()}/verify-email?token=${verificationToken}`;

  await Promise.allSettled([
    sendWelcomeEmail({
      to: input.email,
      name: input.name,
      businessName: input.businessName
    }),
    sendVerificationEmail({
      to: input.email,
      name: input.name,
      verificationUrl
    })
  ]);
}

export async function createEmailVerificationToken(input: { userId: string; email: string }) {
  const plainToken = createPlainToken();
  const tokenHash = hashToken(plainToken);

  await prismaAuth.emailVerificationToken.create({
    data: {
      userId: input.userId,
      email: input.email,
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
    }
  });

  return plainToken;
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const verification = await prismaAuth.emailVerificationToken.findUnique({
    where: {
      tokenHash
    },
    include: {
      user: true
    }
  });

  if (!verification || verification.usedAt) {
    throw new AuthFlowError("invalid_token", "Doğrulama bağlantısı geçersiz.");
  }

  if (verification.expiresAt < new Date()) {
    throw new AuthFlowError("expired_token", "Doğrulama bağlantısının süresi dolmuş.");
  }

  await prisma.$transaction([
    prismaAuth.emailVerificationToken.update({
      where: {
        id: verification.id
      },
      data: {
        usedAt: new Date()
      }
    }),
    prismaAuth.user.update({
      where: {
        id: verification.userId
      },
      data: {
        emailVerifiedAt: new Date()
      }
    })
  ]);

  return verification.user;
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: sanitizeText(formData.get("email")).toLowerCase()
  });

  if (!parsed.success) {
    throw new AuthFlowError("validation", parsed.error.flatten().formErrors[0] ?? "Geçerli bir e-posta girin.");
  }

  const email = normalizeEmail(parsed.data.email);
  const limiter = await rateLimitPlaceholder(email, "forgot-password");
  if (!limiter.allowed) {
    throw new AuthFlowError("rate_limited", "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.");
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) {
    return { ok: true as const };
  }

  const plainToken = createPlainToken();
  const tokenHash = hashToken(plainToken);

  await prismaAuth.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS)
    }
  });

  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${plainToken}`;
  await safeCreateAuditLog({
    businessId: user.businessId,
    actorUserId: user.id,
    actorRole: user.role,
    category: AuditCategory.AUTH,
    action: "password_reset_requested",
    message: "Password reset requested."
  });
  await sendPasswordResetEmail({
    to: email,
    name: user.name,
    resetUrl
  });

  return { ok: true as const };
}

export async function validatePasswordResetToken(token: string) {
  const tokenHash = hashToken(token);
  const resetToken = await prismaAuth.passwordResetToken.findUnique({
    where: {
      tokenHash
    },
    include: {
      user: true
    }
  });

  if (!resetToken || resetToken.usedAt) {
    throw new AuthFlowError("invalid_token", "Şifre sıfırlama bağlantısı geçersiz.");
  }

  if (resetToken.expiresAt < new Date()) {
    throw new AuthFlowError("expired_token", "Şifre sıfırlama bağlantısının süresi dolmuş.");
  }

  return resetToken;
}

export async function resetPassword(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    throw new AuthFlowError("validation", parsed.error.flatten().formErrors[0] ?? "Şifre güncellenemedi.");
  }

  const resetToken = await validatePasswordResetToken(parsed.data.token);
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prismaAuth.passwordResetToken.update({
      where: {
        id: resetToken.id
      },
      data: {
        usedAt: new Date()
      }
    }),
    prisma.user.update({
      where: {
        id: resetToken.userId
      },
      data: {
        passwordHash
      }
    }),
    prisma.session.deleteMany({
      where: {
        userId: resetToken.userId
      }
    })
  ]);

  await safeCreateAuditLog({
    businessId: resetToken.user.businessId,
    actorUserId: resetToken.user.id,
    actorRole: resetToken.user.role,
    category: AuditCategory.AUTH,
    action: "password_reset_completed",
    message: "Password reset completed."
  });

  return { ok: true as const };
}
