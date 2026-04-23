CREATE TYPE "BillingProvider" AS ENUM ('PAYTR');

CREATE TYPE "BillingPaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED');

CREATE TABLE "BillingPayment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL DEFAULT 'PAYTR',
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "BillingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "merchantOid" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "collectedAmountMinor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'TL',
    "requestedByEmail" TEXT NOT NULL,
    "requestedByName" TEXT,
    "testMode" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReasonCode" TEXT,
    "failureReasonMessage" TEXT,
    "callbackHash" TEXT,
    "callbackPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingPayment_merchantOid_key" ON "BillingPayment"("merchantOid");
CREATE INDEX "BillingPayment_businessId_status_idx" ON "BillingPayment"("businessId", "status");
CREATE INDEX "BillingPayment_businessId_createdAt_idx" ON "BillingPayment"("businessId", "createdAt");

ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
