-- Phase 3 account separation:
-- 1. Add company/account lifecycle fields to User while preserving employeeId linkage.
-- 2. Backfill companyId from the linked employee for existing seeded/demo accounts.
-- 3. Add UserInvite for future invite acceptance without requiring login access on Employee.

ALTER TABLE "User"
ADD COLUMN "companyId" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "invitedAt" TIMESTAMP(3),
ADD COLUMN "acceptedAt" TIMESTAMP(3),
ADD COLUMN "deactivatedAt" TIMESTAMP(3);

UPDATE "User" AS "u"
SET
  "companyId" = "e"."companyId",
  "acceptedAt" = COALESCE("u"."acceptedAt", "u"."createdAt")
FROM "Employee" AS "e"
WHERE "u"."employeeId" = "e"."id"
  AND "u"."companyId" IS NULL;

UPDATE "User" AS "u"
SET
  "companyId" = "c"."id",
  "acceptedAt" = COALESCE("u"."acceptedAt", "u"."createdAt")
FROM "Company" AS "c"
WHERE "u"."companyId" IS NULL
  AND (
    "c"."onboardingCompletedByUserId" = "u"."id"
    OR "c"."payrollDisclaimerAcceptedByUserId" = "u"."id"
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "User"
    WHERE "companyId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Phase 3 migration requires every existing user to resolve to a companyId before User.companyId can become required.';
  END IF;
END $$;

ALTER TABLE "User"
ALTER COLUMN "companyId" SET NOT NULL;

CREATE INDEX "User_companyId_idx" ON "User"("companyId");

ALTER TABLE "User"
ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "UserInvite" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserInvite_tokenHash_key" ON "UserInvite"("tokenHash");
CREATE INDEX "UserInvite_companyId_idx" ON "UserInvite"("companyId");
CREATE INDEX "UserInvite_employeeId_idx" ON "UserInvite"("employeeId");
CREATE INDEX "UserInvite_invitedByUserId_idx" ON "UserInvite"("invitedByUserId");

ALTER TABLE "UserInvite"
ADD CONSTRAINT "UserInvite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserInvite"
ADD CONSTRAINT "UserInvite_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserInvite"
ADD CONSTRAINT "UserInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
