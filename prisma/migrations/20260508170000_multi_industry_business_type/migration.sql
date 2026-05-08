-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM (
  'RESTAURANT',
  'CAFE',
  'BEAUTY_SALON',
  'BARBER',
  'CLINIC',
  'DENTIST',
  'FITNESS',
  'HOTEL',
  'CAR_SERVICE',
  'CAR_WASH',
  'EVENT_VENUE',
  'EDUCATION',
  'CONSULTING',
  'SPA',
  'WELLNESS',
  'OTHER'
);

-- AlterTable
ALTER TABLE "Business"
ADD COLUMN "businessType" "BusinessType" NOT NULL DEFAULT 'RESTAURANT';
