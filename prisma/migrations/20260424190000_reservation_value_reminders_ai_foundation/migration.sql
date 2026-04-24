ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'SEATED';
ALTER TYPE "ReservationSource" ADD VALUE IF NOT EXISTS 'AI';

CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');
CREATE TYPE "ReminderStatus" AS ENUM ('NOT_SCHEDULED', 'SCHEDULED', 'SENT', 'FAILED');

ALTER TABLE "RestaurantSettings"
  ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reminderTimingHours" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN "reminderChannel" "ReminderChannel" NOT NULL DEFAULT 'EMAIL';

ALTER TABLE "Reservation"
  ADD COLUMN "reminderStatus" "ReminderStatus" NOT NULL DEFAULT 'NOT_SCHEDULED',
  ADD COLUMN "reminderScheduledAt" TIMESTAMP(3),
  ADD COLUMN "reminderSentAt" TIMESTAMP(3),
  ADD COLUMN "lastReminderError" TEXT;
