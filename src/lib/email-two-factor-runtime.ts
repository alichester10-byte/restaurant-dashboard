import { BusinessType, Prisma, SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type BusinessSnapshot = {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessPhone: string;
  businessAddress: string | null;
  city: string | null;
  district: string | null;
  restaurantType: string | null;
  estimatedTableCount: number | null;
  status: "ACTIVE" | "SUSPENDED";
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
  subscriptionCurrentPeriodEndsAt: Date | null;
  lastPaymentFailedAt: Date | null;
  suspendedAt: Date | null;
  onboardingCompletedAt: Date | null;
  notes: string | null;
  internalNotes: string | null;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthUserCompat = {
  id: string;
  email: string;
  businessId: string;
  name: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  role: UserRole;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  emailTwoFactorEnabled: boolean;
  emailTwoFactorRequiredByAdmin: boolean;
  disabledAt: Date | null;
  disabledReason: string | null;
  business: BusinessSnapshot;
};

export type SessionCompat = {
  id: string;
  tokenHash: string;
  userId: string;
  impersonatedByUserId: string | null;
  expiresAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  user: AuthUserCompat;
};

type SchemaStatus = {
  ready: boolean;
  missingColumn: boolean;
  missingTable: boolean;
};

let cachedSchemaStatus: SchemaStatus | null = null;
let cachedAt = 0;

function mapRole(role: string): UserRole {
  if (role === "SUPER_ADMIN") return UserRole.SUPER_ADMIN;
  if (role === "STAFF") return UserRole.STAFF;
  return UserRole.BUSINESS_ADMIN;
}

export function isEmailTwoFactorSchemaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("emailTwoFactorEnabled") ||
    message.includes("EmailTwoFactorCode") ||
    message.includes("businessType") ||
    message.includes("subscriptionCurrentPeriodStartsAt") ||
    message.includes("does not exist in the current database") ||
    message.includes("column \"emailTwoFactorEnabled\"") ||
    message.includes("relation \"EmailTwoFactorCode\"") ||
    message.includes("column \"businessType\"") ||
    message.includes("column \"subscriptionCurrentPeriodStartsAt\"")
  );
}

async function fetchLegacyBusinessSnapshot(businessId: string) {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    slug: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    businessPhone: string;
    businessAddress: string | null;
    city: string | null;
    district: string | null;
    restaurantType: string | null;
    estimatedTableCount: number | null;
    status: string;
    subscriptionPlan: string | null;
    subscriptionStatus: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    trialStartsAt: Date | null;
    trialEndsAt: Date | null;
    subscriptionCurrentPeriodEndsAt: Date | null;
    lastPaymentFailedAt: Date | null;
    suspendedAt: Date | null;
    onboardingCompletedAt: Date | null;
    notes: string | null;
    internalNotes: string | null;
    lastActivityAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>>(
    Prisma.sql`
      SELECT
        id,
        name,
        slug,
        "ownerName",
        "ownerEmail",
        "ownerPhone",
        "businessPhone",
        "businessAddress",
        city,
        district,
        "restaurantType",
        "estimatedTableCount",
        status::text as status,
        "subscriptionPlan"::text as "subscriptionPlan",
        "subscriptionStatus"::text as "subscriptionStatus",
        "stripeCustomerId",
        "stripeSubscriptionId",
        "stripePriceId",
        "trialStartsAt",
        "trialEndsAt",
        "subscriptionCurrentPeriodEndsAt",
        "lastPaymentFailedAt",
        "suspendedAt",
        "onboardingCompletedAt",
        notes,
        "internalNotes",
        "lastActivityAt",
        "createdAt",
        "updatedAt"
      FROM "Business"
      WHERE id = ${businessId}
      LIMIT 1
    `
  );

  const row = rows[0];
  if (!row) {
    throw new Error(`Legacy business snapshot not found for ${businessId}`);
  }

  return {
    ...row,
    businessType: BusinessType.RESTAURANT,
    status: row.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
    subscriptionPlan:
      row.subscriptionPlan === "FREE" ||
      row.subscriptionPlan === "STARTER" ||
      row.subscriptionPlan === "PRO" ||
      row.subscriptionPlan === "BUSINESS" ||
      row.subscriptionPlan === "ENTERPRISE"
        ? row.subscriptionPlan
        : SubscriptionPlan.PRO,
    subscriptionStatus:
      row.subscriptionStatus === "ACTIVE" ||
      row.subscriptionStatus === "TRIALING" ||
      row.subscriptionStatus === "PAST_DUE" ||
      row.subscriptionStatus === "CANCELED"
        ? row.subscriptionStatus
        : SubscriptionStatus.ACTIVE
  } satisfies BusinessSnapshot;
}

export async function getEmailTwoFactorSchemaStatus() {
  if (cachedSchemaStatus && Date.now() - cachedAt < 60_000) {
    return cachedSchemaStatus;
  }

  try {
    const [columnRows, tableRows] = await Promise.all([
      prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'User'
            AND column_name = 'emailTwoFactorEnabled'
        ) AS "exists"
      `,
      prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'EmailTwoFactorCode'
        ) AS "exists"
      `
    ]);

    cachedSchemaStatus = {
      ready: Boolean(columnRows[0]?.exists) && Boolean(tableRows[0]?.exists),
      missingColumn: !Boolean(columnRows[0]?.exists),
      missingTable: !Boolean(tableRows[0]?.exists)
    };
  } catch (error) {
    console.error("[email-2fa:schema-status-check-failed]", {
      error: error instanceof Error ? error.message : "unknown_error"
    });
    cachedSchemaStatus = {
      ready: false,
      missingColumn: true,
      missingTable: true
    };
  }

  cachedAt = Date.now();
  return cachedSchemaStatus;
}

async function fetchBusinessSnapshot(businessId: string) {
  try {
    return await prisma.business.findUniqueOrThrow({
      where: { id: businessId }
    });
  } catch (error) {
    if (!isEmailTwoFactorSchemaError(error)) {
      throw error;
    }

    console.warn("[auth:legacy-business-fallback]", {
      businessId,
      reason: error instanceof Error ? error.message : "unknown_error"
    });

    return fetchLegacyBusinessSnapshot(businessId);
  }
}

async function fetchLegacyAuthUser(where: { id?: string; email?: string }) {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    email: string;
    businessId: string;
    name: string;
    passwordHash: string;
    emailVerifiedAt: Date | null;
    role: string;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
    twoFactorEnabled: boolean;
    twoFactorSecret: string | null;
    emailTwoFactorRequiredByAdmin: boolean | null;
    disabledAt: Date | null;
    disabledReason: string | null;
  }>>(
    Prisma.sql`
      SELECT
        id,
        email,
        "businessId",
        name,
        "passwordHash",
        "emailVerifiedAt",
        role::text as role,
        "failedLoginAttempts",
        "lockedUntil",
        "lastLoginAt",
        "lastLoginIp",
        "twoFactorEnabled",
        "twoFactorSecret",
        false as "emailTwoFactorRequiredByAdmin",
        "disabledAt",
        "disabledReason"
      FROM "User"
      WHERE ${where.id ? Prisma.sql`id = ${where.id}` : Prisma.sql`email = ${where.email!}`}
      LIMIT 1
    `
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const business = await fetchBusinessSnapshot(row.businessId);

  return {
    ...row,
    role: mapRole(row.role),
    emailTwoFactorEnabled: false,
    emailTwoFactorRequiredByAdmin: false,
    business
  } satisfies AuthUserCompat;
}

export async function findAuthUserByEmail(email: string): Promise<{ user: AuthUserCompat | null; schemaReady: boolean }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true }
    });
    return {
      user: user as AuthUserCompat | null,
      schemaReady: true
    };
  } catch (error) {
    if (!isEmailTwoFactorSchemaError(error)) {
      throw error;
    }

    console.warn("[auth:legacy-user-fallback]", {
      lookup: "email",
      email,
      reason: error instanceof Error ? error.message : "unknown_error"
    });

    const emailTwoFactorSchema = await getEmailTwoFactorSchemaStatus();

    return {
      user: await fetchLegacyAuthUser({ email }),
      schemaReady: emailTwoFactorSchema.ready
    };
  }
}

export async function findAuthUserById(userId: string): Promise<{ user: AuthUserCompat | null; schemaReady: boolean }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });
    return {
      user: user as AuthUserCompat | null,
      schemaReady: true
    };
  } catch (error) {
    if (!isEmailTwoFactorSchemaError(error)) {
      throw error;
    }

    console.warn("[auth:legacy-user-fallback]", {
      lookup: "id",
      userId,
      reason: error instanceof Error ? error.message : "unknown_error"
    });

    const emailTwoFactorSchema = await getEmailTwoFactorSchemaStatus();

    return {
      user: await fetchLegacyAuthUser({ id: userId }),
      schemaReady: emailTwoFactorSchema.ready
    };
  }
}

export async function findSessionWithUser(tokenHash: string): Promise<{ session: SessionCompat | null; schemaReady: boolean }> {
  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            business: true
          }
        }
      }
    });

    return {
      session: session as SessionCompat | null,
      schemaReady: true
    };
  } catch (error) {
    if (!isEmailTwoFactorSchemaError(error)) {
      throw error;
    }

    console.warn("[auth:legacy-session-fallback]", {
      reason: error instanceof Error ? error.message : "unknown_error"
    });

    const emailTwoFactorSchema = await getEmailTwoFactorSchemaStatus();

    const session = await prisma.session.findUnique({
      where: { tokenHash }
    });

    if (!session) {
      return { session: null, schemaReady: emailTwoFactorSchema.ready };
    }

    const { user } = await findAuthUserById(session.userId);
    if (!user) {
      return { session: null, schemaReady: emailTwoFactorSchema.ready };
    }

    return {
      session: {
        ...session,
        user
      },
      schemaReady: emailTwoFactorSchema.ready
    };
  }
}
