ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "EmailTwoFactorCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "challengeHash" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailTwoFactorCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmailTwoFactorCode_challengeHash_key" ON "EmailTwoFactorCode"("challengeHash");
CREATE INDEX IF NOT EXISTS "EmailTwoFactorCode_userId_idx" ON "EmailTwoFactorCode"("userId");
CREATE INDEX IF NOT EXISTS "EmailTwoFactorCode_expiresAt_idx" ON "EmailTwoFactorCode"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "EmailTwoFactorCode"
  ADD CONSTRAINT "EmailTwoFactorCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
