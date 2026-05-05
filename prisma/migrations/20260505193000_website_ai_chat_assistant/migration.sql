CREATE TYPE "ChatSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CLOSED');

CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

CREATE TABLE "ChatSession" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "customerName" TEXT,
  "customerPhone" TEXT,
  "requestedDate" TEXT,
  "requestedTime" TEXT,
  "partySize" INTEGER,
  "notes" TEXT,
  "status" "ChatSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "completedReservationRequestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" "ChatMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatSession_businessId_status_idx" ON "ChatSession"("businessId", "status");
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

ALTER TABLE "ChatSession"
ADD CONSTRAINT "ChatSession_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMessage"
ADD CONSTRAINT "ChatMessage_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
