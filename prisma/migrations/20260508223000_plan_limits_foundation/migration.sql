ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'FREE';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'BUSINESS';

ALTER TABLE "Business"
ADD COLUMN "subscriptionCurrentPeriodStartsAt" TIMESTAMP(3);
