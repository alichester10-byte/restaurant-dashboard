ALTER TYPE "SubscriptionPlan" RENAME VALUE 'GROWTH' TO 'PRO';
ALTER TYPE "SubscriptionPlan" RENAME VALUE 'SCALE' TO 'ENTERPRISE';

ALTER TABLE "Business" ADD COLUMN "stripePriceId" TEXT;
ALTER TABLE "Business" ADD COLUMN "subscriptionCurrentPeriodEndsAt" TIMESTAMP(3);
ALTER TABLE "Business" ADD COLUMN "lastPaymentFailedAt" TIMESTAMP(3);
