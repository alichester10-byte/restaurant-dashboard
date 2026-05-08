-- Alter Reservation for generic availability foundation
ALTER TABLE "Reservation"
ADD COLUMN "serviceId" TEXT,
ADD COLUMN "staffMemberId" TEXT,
ADD COLUMN "resourceId" TEXT,
ADD COLUMN "durationMinutes" INTEGER,
ADD COLUMN "bookingMetadata" JSONB;

-- Add indexes
CREATE INDEX "Reservation_serviceId_idx" ON "Reservation"("serviceId");
CREATE INDEX "Reservation_staffMemberId_idx" ON "Reservation"("staffMemberId");
CREATE INDEX "Reservation_resourceId_idx" ON "Reservation"("resourceId");

-- Add foreign keys
ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_staffMemberId_fkey"
FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_resourceId_fkey"
FOREIGN KEY ("resourceId") REFERENCES "BookableResource"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
