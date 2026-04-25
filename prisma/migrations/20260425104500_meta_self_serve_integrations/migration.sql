ALTER TYPE "IntegrationStatus" ADD VALUE IF NOT EXISTS 'CONNECTING';
ALTER TYPE "IntegrationStatus" ADD VALUE IF NOT EXISTS 'ERROR';

ALTER TABLE "IntegrationConnection"
  ADD COLUMN "metaBusinessId" TEXT,
  ADD COLUMN "wabaId" TEXT,
  ADD COLUMN "phoneNumberId" TEXT,
  ADD COLUMN "displayPhoneNumber" TEXT,
  ADD COLUMN "facebookPageId" TEXT,
  ADD COLUMN "instagramAccountId" TEXT,
  ADD COLUMN "instagramUsername" TEXT,
  ADD COLUMN "accessTokenEncrypted" TEXT,
  ADD COLUMN "tokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "webhookSubscribedAt" TIMESTAMP(3),
  ADD COLUMN "lastWebhookReceivedAt" TIMESTAMP(3),
  ADD COLUMN "errorMessage" TEXT;

ALTER TABLE "ReservationRequest"
  ADD COLUMN "sourceConversationId" TEXT,
  ADD COLUMN "sourceMessageId" TEXT;

CREATE INDEX "IntegrationConnection_provider_phoneNumberId_idx" ON "IntegrationConnection"("provider", "phoneNumberId");
CREATE INDEX "IntegrationConnection_provider_wabaId_idx" ON "IntegrationConnection"("provider", "wabaId");
CREATE INDEX "IntegrationConnection_provider_facebookPageId_idx" ON "IntegrationConnection"("provider", "facebookPageId");
CREATE INDEX "IntegrationConnection_provider_instagramAccountId_idx" ON "IntegrationConnection"("provider", "instagramAccountId");

CREATE UNIQUE INDEX "ReservationRequest_businessId_sourceMessageId_key" ON "ReservationRequest"("businessId", "sourceMessageId");
