-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'GROWTH', 'SCALE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "BusinessStatus" NOT NULL DEFAULT 'ACTIVE',
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'STARTER',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "trialStartsAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "trialEndsAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "onboardingCompletedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- Seed a default business for safe backfill of the existing single-tenant data
INSERT INTO "Business" (
    "id",
    "name",
    "slug",
    "status",
    "subscriptionPlan",
    "subscriptionStatus",
    "trialStartsAt",
    "trialEndsAt",
    "createdAt",
    "updatedAt",
    "notes"
) VALUES (
    'default_business_tenant',
    'Demo Business',
    'demo-business',
    'ACTIVE',
    'STARTER',
    'TRIALING',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'Backfilled from the original single-tenant demo'
);

-- Add tenant columns
ALTER TABLE "User" ADD COLUMN "businessId" TEXT;
ALTER TABLE "RestaurantSettings" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "businessId" TEXT;
ALTER TABLE "DiningTable" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "businessId" TEXT;
ALTER TABLE "CallLog" ADD COLUMN "businessId" TEXT;

-- Backfill tenant ownership
UPDATE "User" SET "businessId" = 'default_business_tenant' WHERE "businessId" IS NULL;
UPDATE "RestaurantSettings" SET "businessId" = 'default_business_tenant' WHERE "businessId" IS NULL;
UPDATE "Customer" SET "businessId" = 'default_business_tenant' WHERE "businessId" IS NULL;
UPDATE "DiningTable" SET "businessId" = 'default_business_tenant' WHERE "businessId" IS NULL;
UPDATE "Reservation" SET "businessId" = 'default_business_tenant' WHERE "businessId" IS NULL;
UPDATE "CallLog" SET "businessId" = 'default_business_tenant' WHERE "businessId" IS NULL;

-- Convert legacy user roles to SaaS roles
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'BUSINESS_ADMIN', 'STAFF');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE
      WHEN "role"::text = 'ADMIN' THEN 'BUSINESS_ADMIN'::"UserRole_new"
      WHEN "role"::text = 'MANAGER' THEN 'STAFF'::"UserRole_new"
      ELSE 'STAFF'::"UserRole_new"
    END
  );
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'BUSINESS_ADMIN';

-- Tenant-safe uniqueness
DROP INDEX IF EXISTS "Customer_phone_key";
DROP INDEX IF EXISTS "DiningTable_number_key";

-- Business table indexes
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
CREATE UNIQUE INDEX "Business_stripeCustomerId_key" ON "Business"("stripeCustomerId");
CREATE UNIQUE INDEX "Business_stripeSubscriptionId_key" ON "Business"("stripeSubscriptionId");
CREATE INDEX "Business_status_idx" ON "Business"("status");
CREATE INDEX "Business_subscriptionStatus_idx" ON "Business"("subscriptionStatus");

-- New tenant-aware uniqueness and indexes
CREATE UNIQUE INDEX "RestaurantSettings_businessId_key" ON "RestaurantSettings"("businessId");
CREATE INDEX "RestaurantSettings_businessId_idx" ON "RestaurantSettings"("businessId");
CREATE UNIQUE INDEX "Customer_businessId_phone_key" ON "Customer"("businessId", "phone");
CREATE INDEX "Customer_businessId_idx" ON "Customer"("businessId");
CREATE UNIQUE INDEX "DiningTable_businessId_number_key" ON "DiningTable"("businessId", "number");
CREATE INDEX "DiningTable_businessId_idx" ON "DiningTable"("businessId");
CREATE INDEX "User_businessId_idx" ON "User"("businessId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Reservation_businessId_idx" ON "Reservation"("businessId");
CREATE INDEX "CallLog_businessId_idx" ON "CallLog"("businessId");

-- Enforce tenant ownership
ALTER TABLE "User" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "RestaurantSettings" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "DiningTable" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "CallLog" ALTER COLUMN "businessId" SET NOT NULL;

-- Foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantSettings" ADD CONSTRAINT "RestaurantSettings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiningTable" ADD CONSTRAINT "DiningTable_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
