CREATE TYPE "ComplianceRequestType" AS ENUM ('EXPORT', 'DELETE', 'ANONYMIZE');
CREATE TYPE "ComplianceRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailTwoFactorRequiredByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "disabledReason" TEXT;

CREATE TABLE IF NOT EXISTS "PlatformConfig" (
  "id" TEXT NOT NULL DEFAULT 'platform',
  "companyName" TEXT NOT NULL DEFAULT 'Limon Masa',
  "contactEmail" TEXT NOT NULL DEFAULT 'info@limonmasa.com',
  "businessAddress" TEXT,
  "privacyPolicyVersion" TEXT NOT NULL DEFAULT 'v1.0',
  "termsVersion" TEXT NOT NULL DEFAULT 'v1.0',
  "cookieNoticeEnabled" BOOLEAN NOT NULL DEFAULT true,
  "dataDeletionRequestUrl" TEXT,
  "metaDomainVerificationStatus" TEXT,
  "metaBusinessVerificationStatus" TEXT,
  "metaAppReviewStatus" TEXT,
  "deploymentMarker" TEXT,
  "complianceNotes" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ComplianceRequest" (
  "id" TEXT NOT NULL,
  "businessId" TEXT,
  "requestedByUserId" TEXT,
  "type" "ComplianceRequestType" NOT NULL,
  "status" "ComplianceRequestStatus" NOT NULL DEFAULT 'OPEN',
  "subjectEmail" TEXT,
  "notes" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComplianceRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ComplianceRequest_businessId_idx" ON "ComplianceRequest"("businessId");
CREATE INDEX IF NOT EXISTS "ComplianceRequest_requestedByUserId_idx" ON "ComplianceRequest"("requestedByUserId");
CREATE INDEX IF NOT EXISTS "ComplianceRequest_status_idx" ON "ComplianceRequest"("status");

DO $$ BEGIN
  ALTER TABLE "ComplianceRequest"
  ADD CONSTRAINT "ComplianceRequest_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ComplianceRequest"
  ADD CONSTRAINT "ComplianceRequest_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "PlatformConfig" ("id", "updatedAt") VALUES ('platform', CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
