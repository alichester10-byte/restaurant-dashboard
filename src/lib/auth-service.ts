import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { AuditCategory, Prisma, SubscriptionStatus, UserRole } from "@prisma/client";
import { getAppBaseUrl, hasBusinessAccess } from "@/lib/billing";
import { createSession } from "@/lib/auth";
import { safeCreateAuditLog } from "@/lib/audit";
import { findAuthUserByEmail, getEmailTwoFactorSchemaStatus } from "@/lib/email-two-factor-runtime";
import {
  isEmailDeliveryConfigured,
  sendEmailTwoFactorCode,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { rateLimitPlaceholder } from "@/lib/rate-limit";
import { getRequestIp, sanitizeNullableText, sanitizeText } from "@/lib/security";
import { verifyTotpToken } from "@/lib/two-factor";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "@/lib/validation";
import { CreateBusinessError, createBusinessWithAdmin } from "@/lib/tenant";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_TWO_FACTOR_TTL_MS = 10 * 60 * 1000;
const EMAIL_TWO_FACTOR_RESEND_COOLDOWN_MS = 60 * 1000;
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
    | "two_factor_required"
    | "two_factor_setup_required"
    | "database_issue"
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
      | "two_factor_required"
      | "two_factor_setup_required"
      | "database_issue"
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

function createSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function updateUserLoginFields(
  userId: string,
  data: {
    failedLoginAttempts?: number;
    lockedUntil?: Date | null;
    lastLoginAt?: Date;
    lastLoginIp?: string | null;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true }
  });
}

async function enforceSuperAdminEmailTwoFactor(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      emailTwoFactorEnabled: true,
      emailTwoFactorRequiredByAdmin: true
    },
    select: { id: true }
  });
}

async function createEmailTwoFactorChallenge(input: {
  userId: string;
  businessId: string;
  role: UserRole;
  email: string;
  name: string;
  ipAddress: string | null;
}) {
  if (!isEmailDeliveryConfigured()) {
    throw new AuthFlowError("two_factor_setup_required", "Email 2FA kurulumu gerekli. Lütfen e-posta gönderim ayarlarını tamamlayın.");
  }

  await prisma.emailTwoFactorCode.deleteMany({
    where: {
      userId: input.userId
    }
  });

  const challengeToken = createPlainToken();
  const plainCode = createSixDigitCode();
  const expiresAt = new Date(Date.now() + EMAIL_TWO_FACTOR_TTL_MS);
  const delivery = await sendEmailTwoFactorCode({
    to: input.email,
    name: input.name,
    code: plainCode
  });

  if (!delivery.ok) {
    throw new AuthFlowError("two_factor_setup_required", "Email 2FA kurulumu gerekli. Lütfen e-posta gönderim ayarlarını tamamlayın.");
  }

  await prisma.emailTwoFactorCode.create({
    data: {
      userId: input.userId,
      challengeHash: hashToken(challengeToken),
      codeHash: hashToken(plainCode),
      expiresAt,
      lastSentAt: new Date()
    }
  });

  await safeCreateAuditLog({
    businessId: input.businessId,
    actorUserId: input.userId,
    actorRole: input.role,
    category: AuditCategory.AUTH,
    action: "email_two_factor_code_sent",
    message: "Email-based two-factor code sent during login.",
    ipAddress: input.ipAddress
  });

  return {
    challengeToken,
    expiresAt
  };
}

async function resendEmailTwoFactorChallenge(input: {
  challengeToken: string;
  expectedUserId?: string;
  ipAddress: string | null;
}) {
  const challenge = await prisma.emailTwoFactorCode.findUnique({
    where: {
      challengeHash: hashToken(input.challengeToken)
    },
    include: {
      user: true
    }
  });

  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    throw new AuthFlowError("expired_token", "Doğrulama kodunun süresi doldu. Lütfen yeniden giriş yapın.");
  }

  if (input.expectedUserId && challenge.userId !== input.expectedUserId) {
    throw new AuthFlowError("invalid_credentials", "Doğrulama oturumu eşleşmedi. Lütfen yeniden giriş yapın.");
  }

  if (!isEmailDeliveryConfigured()) {
    throw new AuthFlowError("two_factor_setup_required", "Email 2FA kurulumu gerekli. Lütfen e-posta gönderim ayarlarını tamamlayın.");
  }

  const waitMs = challenge.lastSentAt.getTime() + EMAIL_TWO_FACTOR_RESEND_COOLDOWN_MS - Date.now();
  if (waitMs > 0) {
    throw new AuthFlowError("rate_limited", `Yeni kodu tekrar istemek için ${Math.ceil(waitMs / 1000)} saniye bekleyin.`);
  }

  const nextCode = createSixDigitCode();
  const delivery = await sendEmailTwoFactorCode({
    to: challenge.user.email,
    name: challenge.user.name,
    code: nextCode
  });

  if (!delivery.ok) {
    throw new AuthFlowError("two_factor_setup_required", "Email 2FA kurulumu gerekli. Lütfen e-posta gönderim ayarlarını tamamlayın.");
  }

  await prisma.emailTwoFactorCode.update({
    where: {
      id: challenge.id
    },
    data: {
      codeHash: hashToken(nextCode),
      expiresAt: new Date(Date.now() + EMAIL_TWO_FACTOR_TTL_MS),
      lastSentAt: new Date()
    }
  });

  await safeCreateAuditLog({
    businessId: challenge.user.businessId,
    actorUserId: challenge.userId,
    actorRole: challenge.user.role,
    category: AuditCategory.AUTH,
    action: "email_two_factor_code_resent",
    message: "Email-based two-factor code resent during login.",
    ipAddress: input.ipAddress
  });

  return {
    challengeToken: input.challengeToken
  };
}

async function verifyEmailTwoFactorChallenge(input: {
  challengeToken: string;
  otpCode: string;
  expectedUserId?: string;
  ipAddress: string | null;
}) {
  const challenge = await prisma.emailTwoFactorCode.findUnique({
    where: {
      challengeHash: hashToken(input.challengeToken)
    },
    include: {
      user: {
        include: {
          business: true
        }
      }
    }
  });

  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    throw new AuthFlowError("expired_token", "Doğrulama kodunun süresi doldu. Lütfen yeniden giriş yapın.");
  }

  if (input.expectedUserId && challenge.userId !== input.expectedUserId) {
    throw new AuthFlowError("invalid_credentials", "Doğrulama oturumu eşleşmedi. Lütfen yeniden giriş yapın.");
  }

  if (challenge.codeHash !== hashToken(input.otpCode)) {
    await safeCreateAuditLog({
      businessId: challenge.user.businessId,
      actorUserId: challenge.userId,
      actorRole: challenge.user.role,
      category: AuditCategory.AUTH,
      action: "email_two_factor_failed",
      message: "Email-based two-factor verification failed.",
      ipAddress: input.ipAddress
    });
    throw new AuthFlowError("invalid_credentials", "Doğrulama kodu geçersiz.");
  }

  await prisma.emailTwoFactorCode.update({
    where: {
      id: challenge.id
    },
    data: {
      consumedAt: new Date()
    }
  });

  return challenge.user;
}

function getFirstValidationMessage(error: {
  flatten: () => {
    formErrors: string[];
    fieldErrors: Record<string, string[] | undefined>;
  };
}) {
  const flattened = error.flatten();
  const firstFieldError = Object.values(flattened.fieldErrors).flat().find(Boolean);
  return firstFieldError ?? flattened.formErrors[0] ?? "Kayıt bilgileri geçersiz.";
}

export async function loginWithEmail(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: sanitizeText(formData.get("email")).toLowerCase(),
    password: formData.get("password"),
    otpCode: sanitizeNullableText(formData.get("otpCode")),
    challengeToken: sanitizeNullableText(formData.get("challengeToken")),
    intent: sanitizeText(formData.get("intent")) || "login"
  });

  if (!parsed.success) {
    throw new AuthFlowError("validation", parsed.error.flatten().formErrors[0] ?? "Bilgiler geçersiz.");
  }

  const email = normalizeEmail(parsed.data.email);
  const ipAddress = getRequestIp();

  console.info("[auth:login-step]", {
    step: "login_start",
    email,
    intent: parsed.data.intent
  });

  if (parsed.data.intent === "resend_email_2fa") {
    const challengeToken = parsed.data.challengeToken?.trim() ?? "";
    if (!challengeToken) {
      throw new AuthFlowError("expired_token", "Doğrulama oturumu bulunamadı. Lütfen yeniden giriş yapın.");
    }

    const resend = await resendEmailTwoFactorChallenge({
      challengeToken,
      ipAddress
    });

    return {
      requiresTwoFactor: true as const,
      challengeMethod: "email" as const,
      challengeToken: resend.challengeToken,
      challengeMessage: "Yeni doğrulama kodu e-posta adresinize gönderildi."
    };
  }

  const limiter = await rateLimitPlaceholder(email, "login");
  if (!limiter.allowed) {
    throw new AuthFlowError("rate_limited", "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.");
  }

  const { user, schemaReady } = await findAuthUserByEmail(email);
  console.info("[auth:login-step]", {
    step: "user_found",
    email,
    userFound: Boolean(user),
    migrationCompatibilityMode: !schemaReady
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

  if (user.disabledAt) {
    await safeCreateAuditLog({
      businessId: user.businessId,
      actorUserId: user.id,
      actorRole: user.role,
      category: AuditCategory.SECURITY,
      action: "login_blocked_disabled_account",
      message: "Login blocked because account is disabled.",
      metadata: {
        disabledAt: user.disabledAt.toISOString(),
        disabledReason: user.disabledReason ?? null
      },
      ipAddress
    });
    throw new AuthFlowError("invalid_credentials", "Hesap erişimi devre dışı bırakılmış. Lütfen destek ile iletişime geçin.");
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  console.info("[auth:login-step]", {
    step: "password_ok",
    email,
    passwordCompareOk: isValid,
    migrationCompatibilityMode: !schemaReady
  });
  if (!isValid) {
    const nextAttemptCount = user.failedLoginAttempts + 1;
    const lockedUntil = nextAttemptCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await updateUserLoginFields(user.id, {
      failedLoginAttempts: nextAttemptCount,
      lockedUntil
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

  let authenticatedUser = user;
  const requiresEmailTwoFactor = schemaReady
    ? user.role === UserRole.SUPER_ADMIN || user.emailTwoFactorRequiredByAdmin || user.emailTwoFactorEnabled
    : false;

  if (user.role === UserRole.SUPER_ADMIN && !schemaReady) {
    throw new AuthFlowError(
      "two_factor_setup_required",
      "Super Admin güvenlik güncellemesi bekleniyor. Lütfen veritabanı migration'ını uygulayın."
    );
  }

  if (requiresEmailTwoFactor && schemaReady) {
    if (user.role === UserRole.SUPER_ADMIN && (!user.emailTwoFactorEnabled || !user.emailTwoFactorRequiredByAdmin)) {
      await enforceSuperAdminEmailTwoFactor(user.id);
      authenticatedUser = {
        ...authenticatedUser,
        emailTwoFactorEnabled: true,
        emailTwoFactorRequiredByAdmin: true
      };
    }

    if (parsed.data.intent === "verify_email_2fa") {
      const challengeToken = parsed.data.challengeToken?.trim() ?? "";
      const otpCode = parsed.data.otpCode?.trim() ?? "";
      if (!challengeToken || !otpCode) {
        throw new AuthFlowError("two_factor_required", "E-postanıza gönderilen 6 haneli kodu girin.");
      }

      authenticatedUser = await verifyEmailTwoFactorChallenge({
        challengeToken,
        otpCode,
        expectedUserId: user.id,
        ipAddress
      });
    } else {
      const challenge = await createEmailTwoFactorChallenge({
        userId: authenticatedUser.id,
        businessId: authenticatedUser.businessId,
        role: authenticatedUser.role,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        ipAddress
      });

      return {
        requiresTwoFactor: true as const,
        challengeMethod: "email" as const,
        challengeToken: challenge.challengeToken,
        challengeMessage: "Giriş kodunu e-posta adresinize gönderdik."
      };
    }
  } else if ((user.emailTwoFactorEnabled || user.emailTwoFactorRequiredByAdmin) && !schemaReady) {
    console.warn("[auth:email-2fa-disabled-by-migration-gap]", {
      email,
      reason: "email_two_factor_schema_not_ready"
    });
  } else if (user.twoFactorEnabled) {
    const otpCode = parsed.data.otpCode?.trim() ?? "";
    if (!otpCode) {
      return {
        requiresTwoFactor: true as const,
        challengeMethod: "totp" as const,
        challengeMessage: "Yönetici 2FA kodunuzu girin."
      };
    }

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

  await createSession(authenticatedUser.id);
  console.info("[auth:login-step]", {
    step: "session_created",
    email,
    migrationCompatibilityMode: !schemaReady
  });
  await prisma.business.update({
    where: { id: authenticatedUser.businessId },
    data: { lastActivityAt: new Date() }
  });
  await updateUserLoginFields(authenticatedUser.id, {
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
    lastLoginIp: ipAddress
  });
  await safeCreateAuditLog({
    businessId: authenticatedUser.businessId,
    actorUserId: authenticatedUser.id,
    actorRole: authenticatedUser.role,
    category: AuditCategory.AUTH,
    action: "login_success",
    message: "User logged in successfully.",
    ipAddress
  });

  const redirectTo =
    authenticatedUser.role === "SUPER_ADMIN"
      ? "/super-admin"
      : hasBusinessAccess(authenticatedUser.business, authenticatedUser.role)
        ? "/dashboard"
        : "/billing";

  console.info("[auth:login-step]", {
    step: "redirect_to_dashboard",
    email,
    redirectTo,
    migrationCompatibilityMode: !schemaReady
  });

  return {
    redirectTo,
    user: authenticatedUser
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
    throw new AuthFlowError("validation", getFirstValidationMessage(parsed.error));
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
    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientInitializationError) {
      throw new AuthFlowError("database_issue", "Veritabanı kurulumu eksik veya güncel değil. Lütfen destek ekibiyle iletişime geçin.");
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

export async function getEmailTwoFactorSettingsState() {
  const schema = await getEmailTwoFactorSchemaStatus();
  return {
    available: schema.ready,
    warning: schema.ready
      ? null
      : "Email 2FA altyapısı henüz veritabanına uygulanmadı. Migration tamamlanana kadar giriş akışı 2FA kapalı gibi çalışır."
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
