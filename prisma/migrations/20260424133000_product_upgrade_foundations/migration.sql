CREATE TYPE "TableArea" AS ENUM ('WINDOW', 'ENTRANCE', 'GARDEN', 'TERRACE', 'MAIN_DINING', 'VIP', 'BAR', 'CUSTOM');
CREATE TYPE "TableShape" AS ENUM ('ROUND', 'SQUARE', 'RECTANGLE', 'BOOTH', 'BAR', 'CUSTOM');
CREATE TYPE "IntegrationProvider" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'GOOGLE_WEB', 'WEBSITE_WIDGET', 'AI_ASSISTANT');
CREATE TYPE "IntegrationStatus" AS ENUM ('NOT_CONNECTED', 'CONNECTED', 'NEEDS_CONFIGURATION');
CREATE TYPE "ReservationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "AuditCategory" AS ENUM ('AUTH', 'SECURITY', 'BILLING', 'SUPER_ADMIN', 'BUSINESS', 'WEBHOOK', 'RESERVATION', 'TABLE', 'INTEGRATION');
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARN', 'CRITICAL');

ALTER TABLE "Business"
ADD COLUMN "ownerName" TEXT,
ADD COLUMN "ownerEmail" TEXT,
ADD COLUMN "ownerPhone" TEXT,
ADD COLUMN "businessPhone" TEXT,
ADD COLUMN "businessAddress" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "district" TEXT,
ADD COLUMN "restaurantType" TEXT,
ADD COLUMN "estimatedTableCount" INTEGER,
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "lastActivityAt" TIMESTAMP(3);

WITH first_admin AS (
  SELECT DISTINCT ON (u."businessId")
    u."businessId",
    u."name",
    u."email"
  FROM "User" u
  ORDER BY u."businessId", CASE WHEN u."role" = 'BUSINESS_ADMIN' THEN 0 ELSE 1 END, u."createdAt" ASC
),
settings AS (
  SELECT rs."businessId", rs."phone", rs."address"
  FROM "RestaurantSettings" rs
)
UPDATE "Business" b
SET
  "ownerName" = COALESCE(fa."name", b."name"),
  "ownerEmail" = COALESCE(fa."email", CONCAT(b."slug", '@example.com')),
  "ownerPhone" = COALESCE(s."phone", '+90 555 000 00 00'),
  "businessPhone" = COALESCE(s."phone", '+90 555 000 00 00'),
  "businessAddress" = s."address",
  "lastActivityAt" = COALESCE(b."updatedAt", b."createdAt")
FROM first_admin fa
LEFT JOIN settings s ON s."businessId" = b."id"
WHERE fa."businessId" = b."id" OR s."businessId" = b."id";

UPDATE "Business"
SET
  "ownerName" = COALESCE("ownerName", "name"),
  "ownerEmail" = COALESCE("ownerEmail", CONCAT("slug", '@example.com')),
  "ownerPhone" = COALESCE("ownerPhone", '+90 555 000 00 00'),
  "businessPhone" = COALESCE("businessPhone", '+90 555 000 00 00'),
  "lastActivityAt" = COALESCE("lastActivityAt", "updatedAt");

ALTER TABLE "Business"
ALTER COLUMN "ownerName" SET NOT NULL,
ALTER COLUMN "ownerEmail" SET NOT NULL,
ALTER COLUMN "ownerPhone" SET NOT NULL,
ALTER COLUMN "businessPhone" SET NOT NULL;

CREATE INDEX "Business_ownerEmail_idx" ON "Business"("ownerEmail");

ALTER TABLE "DiningTable"
ADD COLUMN "area" "TableArea" NOT NULL DEFAULT 'MAIN_DINING',
ADD COLUMN "shape" "TableShape" NOT NULL DEFAULT 'RECTANGLE',
ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE TABLE "IntegrationConnection" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
  "externalAccountId" TEXT,
  "config" JSONB,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReservationRequest" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "source" "ReservationSource" NOT NULL,
  "status" "ReservationRequestStatus" NOT NULL DEFAULT 'PENDING',
  "guestName" TEXT NOT NULL,
  "guestPhone" TEXT,
  "requestedDate" TEXT,
  "requestedTime" TEXT,
  "guestCount" INTEGER,
  "notes" TEXT,
  "extractedData" JSONB,
  "confidenceScore" DOUBLE PRECISION,
  "rawMessage" TEXT,
  "reviewReason" TEXT,
  "approvedReservationId" TEXT,
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReservationRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "businessId" TEXT,
  "actorUserId" TEXT,
  "actorRole" "UserRole",
  "category" "AuditCategory" NOT NULL,
  "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "message" TEXT NOT NULL,
  "ipAddress" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitBucket" (
  "id" TEXT NOT NULL,
  "businessId" TEXT,
  "action" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "windowKey" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "blockedUntil" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationConnection_businessId_provider_key" ON "IntegrationConnection"("businessId", "provider");
CREATE INDEX "IntegrationConnection_businessId_idx" ON "IntegrationConnection"("businessId");

CREATE INDEX "ReservationRequest_businessId_status_idx" ON "ReservationRequest"("businessId", "status");
CREATE INDEX "ReservationRequest_businessId_source_idx" ON "ReservationRequest"("businessId", "source");

CREATE INDEX "AuditLog_businessId_category_createdAt_idx" ON "AuditLog"("businessId", "category", "createdAt");
CREATE INDEX "AuditLog_category_severity_createdAt_idx" ON "AuditLog"("category", "severity", "createdAt");

CREATE UNIQUE INDEX "RateLimitBucket_action_identifier_windowKey_key" ON "RateLimitBucket"("action", "identifier", "windowKey");
CREATE INDEX "RateLimitBucket_action_identifier_idx" ON "RateLimitBucket"("action", "identifier");
CREATE INDEX "RateLimitBucket_blockedUntil_idx" ON "RateLimitBucket"("blockedUntil");

ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationRequest" ADD CONSTRAINT "ReservationRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RateLimitBucket" ADD CONSTRAINT "RateLimitBucket_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
