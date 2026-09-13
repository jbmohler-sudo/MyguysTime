ALTER TABLE "Company" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Company" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Company" ADD COLUMN "subscriptionStatus" TEXT;
ALTER TABLE "Company" ADD COLUMN "subscriptionTrialEndsAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Company_stripeCustomerId_key" ON "Company"("stripeCustomerId");
CREATE UNIQUE INDEX "Company_stripeSubscriptionId_key" ON "Company"("stripeSubscriptionId");
