-- Add companyId to Crew and Employee tables
ALTER TABLE "Crew" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Employee" ADD COLUMN "companyId" TEXT;

-- Backfill existing records with the first company
WITH company_id AS (
  SELECT id FROM "Company" ORDER BY "createdAt" ASC LIMIT 1
)
UPDATE "Crew" SET "companyId" = (SELECT id FROM company_id) WHERE "companyId" IS NULL;

WITH company_id AS (
  SELECT id FROM "Company" ORDER BY "createdAt" ASC LIMIT 1
)
UPDATE "Employee" SET "companyId" = (SELECT id FROM company_id) WHERE "companyId" IS NULL;

-- Make columns NOT NULL
ALTER TABLE "Crew" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Employee" ALTER COLUMN "companyId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "Crew" ADD CONSTRAINT "Crew_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "Crew_companyId_idx" ON "Crew"("companyId");
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");
