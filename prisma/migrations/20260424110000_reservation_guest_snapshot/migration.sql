ALTER TABLE "Reservation"
ADD COLUMN "guestName" TEXT,
ADD COLUMN "guestPhone" TEXT;

UPDATE "Reservation" r
SET
  "guestName" = c."name",
  "guestPhone" = c."phone"
FROM "Customer" c
WHERE r."customerId" = c."id";

ALTER TABLE "Reservation"
ALTER COLUMN "guestName" SET NOT NULL,
ALTER COLUMN "guestPhone" SET NOT NULL;
