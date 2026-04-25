import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { AuditCategory, AuditSeverity, UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeCreateAuditLog } from "@/lib/audit";
import { getBusinessEntitlement, getCanonicalAppUrl, hasBusinessAccess } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/security";
import { verifyTotpToken } from "@/lib/two-factor";
import { loginSchema } from "@/lib/validation";
import { rateLimitPlaceholder } from "@/lib/rate-limit";

const SESSION_COOKIE = "restaurant_ops_session";
const SESSION_TTL_DAYS = 7;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  return secret;
}

function getSessionCookieDomain() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return undefined;
  }

  try {
    const hostname = new URL(getCanonicalAppUrl()).hostname;
    if (hostname === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      return undefined;
    }

    return hostname;
  } catch {
    return undefined;
  }
}

function getSessionCookieOptions(expires: Date) {
  const domain = getSessionCookieDomain();

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
    ...(domain ? { domain } : {})
  };
}

export async function createSession(userId: string, options?: { impersonatedByUserId?: string | null }) {
  getSessionSecret();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.deleteMany({
    where: {
      userId
    }
  });

  await prisma.session.create({
    data: {
      userId,
      impersonatedByUserId: options?.impersonatedByUserId ?? null,
      tokenHash,
      expiresAt
    }
  });

  cookies().set(SESSION_COOKIE, token, getSessionCookieOptions(expiresAt));
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashToken(token)
      }
    });
  }

  cookies().set(SESSION_COOKIE, "", getSessionCookieOptions(new Date(0)));
}

export async function getCurrentSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashToken(token)
    },
    include: {
      user: {
        include: {
          business: true
        }
      }
    }
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  await prisma.session.update({
    where: {
      id: session.id
    },
    data: {
      lastSeenAt: new Date()
    }
  });

  return session;
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(...roles: UserRole[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    redirect(session.user.role === UserRole.SUPER_ADMIN ? "/super-admin" : "/dashboard");
  }
  return session;
}

export async function requireSuperAdmin() {
  return requireRole(UserRole.SUPER_ADMIN);
}

export async function requireBusinessUser() {
  return requireBusinessAccess();
}

export function isSuperAdmin(role: UserRole) {
  return role === UserRole.SUPER_ADMIN;
}

export function getBusinessScope(session: Awaited<ReturnType<typeof requireAuth>>) {
  return {
    businessId: session.user.businessId,
    role: session.user.role,
    isSuperAdmin: isSuperAdmin(session.user.role)
  };
}

export async function requireBusinessAccess(options?: { allowInactive?: boolean; roles?: UserRole[] }) {
  const roles = options?.roles ?? [UserRole.BUSINESS_ADMIN, UserRole.STAFF];
  const session = await requireRole(...roles);

  if (!options?.allowInactive && !hasBusinessAccess(session.user.business, session.user.role)) {
    redirect("/billing");
  }

  return session;
}

function buildUpgradeRedirect(feature?: string) {
  const params = new URLSearchParams();
  params.set("upgrade", feature ?? "pro");
  return `/billing?${params.toString()}`;
}

export async function requireBusinessWriteAccess(options?: {
  roles?: UserRole[];
  feature?: string;
}) {
  const session = await requireBusinessAccess({
    roles: options?.roles
  });

  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  if (!entitlement.canWrite) {
    redirect(buildUpgradeRedirect(options?.feature));
  }

  return session;
}

export async function authenticate(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    otpCode: formData.get("otpCode")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors[0] ?? "Giriş bilgileri geçersiz." };
  }

  const ipAddress = getRequestIp();
  const limiter = await rateLimitPlaceholder(parsed.data.email, "login");
  if (!limiter.allowed) {
    await safeCreateAuditLog({
      category: AuditCategory.AUTH,
      action: "login_rate_limited",
      message: "Login attempt blocked by rate limit.",
      severity: AuditSeverity.WARN,
      metadata: {
        email: parsed.data.email
      },
      ipAddress
    });
    return { ok: false, error: "Çok fazla deneme yapıldı. Lütfen tekrar deneyin." };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email
    }
  });

  if (!user) {
    await safeCreateAuditLog({
      category: AuditCategory.AUTH,
      action: "login_failed",
      message: "Login failed because user does not exist.",
      severity: AuditSeverity.WARN,
      metadata: {
        email: parsed.data.email
      },
      ipAddress
    });
    return { ok: false, error: "E-posta veya şifre hatalı." };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await safeCreateAuditLog({
      businessId: user.businessId,
      actorUserId: user.id,
      actorRole: user.role,
      category: AuditCategory.AUTH,
      action: "login_locked",
      message: "Login blocked because account is temporarily locked.",
      severity: AuditSeverity.WARN,
      ipAddress
    });
    return { ok: false, error: "Hesap geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin." };
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!isValid) {
    const nextAttemptCount = user.failedLoginAttempts + 1;
    const lockedUntil = nextAttemptCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
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
      severity: AuditSeverity.WARN,
      ipAddress,
      metadata: {
        failedLoginAttempts: nextAttemptCount,
        lockedUntil: lockedUntil?.toISOString() ?? null
      }
    });
    return { ok: false, error: "E-posta veya şifre hatalı." };
  }

  if (user.twoFactorEnabled) {
    await safeCreateAuditLog({
      businessId: user.businessId,
      actorUserId: user.id,
      actorRole: user.role,
      category: AuditCategory.AUTH,
      action: "two_factor_challenge_started",
      message: "Two-factor verification required during login.",
      severity: AuditSeverity.WARN,
      ipAddress
    });

    const otpCode = parsed.data.otpCode?.trim() ?? "";
    if (!user.twoFactorSecret || !verifyTotpToken({ secret: user.twoFactorSecret, token: otpCode })) {
      await safeCreateAuditLog({
        businessId: user.businessId,
        actorUserId: user.id,
        actorRole: user.role,
        category: AuditCategory.AUTH,
        action: "two_factor_failed",
        message: "Two-factor verification failed during login.",
        severity: AuditSeverity.WARN,
        ipAddress
      });
      return { ok: false, error: "Doğrulama kodu geçersiz." };
    }
  }

  await createSession(user.id);
  await prisma.business.update({
    where: {
      id: user.businessId
    },
    data: {
      lastActivityAt: new Date()
    }
  });
  await prisma.user.update({
    where: {
      id: user.id
    },
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
  return { ok: true, role: user.role };
}
