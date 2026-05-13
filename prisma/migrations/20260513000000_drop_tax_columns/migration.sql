-- Drop tax withholding columns from Employee
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "federalFilingStatus";
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "w4Step3Amount";
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "w4CollectedAt";
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "usesCompanyFederalDefault";
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "usesCompanyStateDefault";
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "federalWithholdingPercent";
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "stateWithholdingPercent";

-- Drop tax withholding columns from CompanyPayrollSettings
ALTER TABLE "CompanyPayrollSettings" DROP COLUMN IF EXISTS "defaultFederalWithholdingMode";
ALTER TABLE "CompanyPayrollSettings" DROP COLUMN IF EXISTS "defaultFederalWithholdingValue";
ALTER TABLE "CompanyPayrollSettings" DROP COLUMN IF EXISTS "defaultStateWithholdingMode";
ALTER TABLE "CompanyPayrollSettings" DROP COLUMN IF EXISTS "defaultStateWithholdingValue";
ALTER TABLE "CompanyPayrollSettings" DROP COLUMN IF EXISTS "pfmlEnabled";
ALTER TABLE "CompanyPayrollSettings" DROP COLUMN IF EXISTS "pfmlEmployeeRate";
ALTER TABLE "CompanyPayrollSettings" DROP COLUMN IF EXISTS "extraWithholdingLabel";
ALTER TABLE "CompanyPayrollSettings" DROP COLUMN IF EXISTS "extraWithholdingRate";
ALTER TABLE "CompanyPayrollSettings" DROP COLUMN IF EXISTS "supportLevelSnapshot";

-- Drop tax withholding columns from PayrollEstimate
ALTER TABLE "PayrollEstimate" DROP COLUMN IF EXISTS "federalWithholdingMode";
ALTER TABLE "PayrollEstimate" DROP COLUMN IF EXISTS "federalWithholdingValue";
ALTER TABLE "PayrollEstimate" DROP COLUMN IF EXISTS "stateWithholdingMode";
ALTER TABLE "PayrollEstimate" DROP COLUMN IF EXISTS "stateWithholdingValue";
ALTER TABLE "PayrollEstimate" DROP COLUMN IF EXISTS "federalWithholdingCents";
ALTER TABLE "PayrollEstimate" DROP COLUMN IF EXISTS "stateWithholdingCents";
ALTER TABLE "PayrollEstimate" DROP COLUMN IF EXISTS "pfmlWithholdingCents";
ALTER TABLE "PayrollEstimate" DROP COLUMN IF EXISTS "extraStateWithholdingLabel";
ALTER TABLE "PayrollEstimate" DROP COLUMN IF EXISTS "extraStateWithholdingCents";
ALTER TABLE "PayrollEstimate" DROP COLUMN IF EXISTS "manualNetOverrideCents";

-- Drop StatePayrollRule table
DROP TABLE IF EXISTS "StatePayrollRule";
