-- MyGuys App Schema Migration
-- Generated from existing Supabase project
-- Run this in your new Supabase project to recreate the schema

-- Company Table
CREATE TABLE IF NOT EXISTS "Company" (
  id TEXT PRIMARY KEY,
  "companyName" TEXT NOT NULL,
  "ownerName" TEXT,
  "stateCode" TEXT NOT NULL,
  "onboardingCompletedAt" TIMESTAMP,
  "onboardingCompletedByUserId" TEXT,
  "payrollDisclaimerAcceptedAt" TIMESTAMP,
  "payrollDisclaimerAcceptedByUserId" TEXT,
  "payrollDisclaimerVersion" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

-- CompanyPayrollSettings Table
CREATE TABLE IF NOT EXISTS "CompanyPayrollSettings" (
  id TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "defaultFederalWithholdingMode" TEXT NOT NULL DEFAULT 'PERCENTAGE',
  "defaultFederalWithholdingValue" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
  "defaultStateWithholdingMode" TEXT NOT NULL DEFAULT 'PERCENTAGE',
  "defaultStateWithholdingValue" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
  "timeTrackingStyle" TEXT NOT NULL DEFAULT 'FOREMAN',
  "defaultLunchMinutes" INTEGER NOT NULL DEFAULT 30,
  "payType" TEXT NOT NULL DEFAULT 'HOURLY_OVERTIME',
  "trackExpenses" BOOLEAN NOT NULL DEFAULT true,
  "payrollPrepDisclaimer" TEXT,
  "pfmlEnabled" BOOLEAN NOT NULL DEFAULT false,
  "pfmlEmployeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "extraWithholdingLabel" TEXT,
  "extraWithholdingRate" DOUBLE PRECISION,
  "supportLevelSnapshot" TEXT NOT NULL DEFAULT 'PARTIAL_MANUAL',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  "payrollMethod" TEXT NOT NULL DEFAULT 'manual',
  "weekStartDay" INTEGER NOT NULL DEFAULT 1
);

-- Crew Table
CREATE TABLE IF NOT EXISTS "Crew" (
  id TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  name TEXT NOT NULL,
  "foremanId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

-- Employee Table
CREATE TABLE IF NOT EXISTS "Employee" (
  id TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "workerType" TEXT NOT NULL DEFAULT 'EMPLOYEE',
  "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  "hourlyRateCents" INTEGER NOT NULL,
  "overtimeRateCents" INTEGER,
  "usesCompanyFederalDefault" BOOLEAN NOT NULL DEFAULT true,
  "usesCompanyStateDefault" BOOLEAN NOT NULL DEFAULT true,
  "federalWithholdingPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
  "stateWithholdingPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
  "defaultCrewId" TEXT REFERENCES "Crew"(id),
  "archiveReason" TEXT,
  "archiveNotes" TEXT,
  "archivedAt" TIMESTAMP,
  "rehiredAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  "federalFilingStatus" TEXT NOT NULL DEFAULT 'single',
  "w4Step3Amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "w4CollectedAt" TIMESTAMP
);

-- User Table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT,
  "companyId" TEXT REFERENCES "Company"(id)
);

-- CrewAssignment Table
CREATE TABLE IF NOT EXISTS "CrewAssignment" (
  id TEXT PRIMARY KEY,
  "crewId" TEXT NOT NULL REFERENCES "Crew"(id),
  "employeeId" TEXT NOT NULL REFERENCES "Employee"(id),
  "startsOn" TIMESTAMP NOT NULL,
  "endsOn" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CrewDayDefault Table
CREATE TABLE IF NOT EXISTS "CrewDayDefault" (
  id TEXT PRIMARY KEY,
  "crewId" TEXT NOT NULL REFERENCES "Crew"(id),
  "weekStartDate" TIMESTAMP NOT NULL,
  "dayIndex" INTEGER NOT NULL,
  "startTimeMinutes" INTEGER,
  "endTimeMinutes" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

-- TimesheetWeek Table
CREATE TABLE IF NOT EXISTS "TimesheetWeek" (
  id TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "weekStartDate" TIMESTAMP NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

-- TimesheetStatusAudit Table
CREATE TABLE IF NOT EXISTS "TimesheetStatusAudit" (
  id TEXT PRIMARY KEY,
  "timesheetWeekId" TEXT NOT NULL REFERENCES "TimesheetWeek"(id),
  "status" TEXT NOT NULL,
  "changedByUserId" TEXT,
  "changedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TimeEntryDay Table
CREATE TABLE IF NOT EXISTS "TimeEntryDay" (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL REFERENCES "Employee"(id),
  "timesheetWeekId" TEXT NOT NULL REFERENCES "TimesheetWeek"(id),
  "dayIndex" INTEGER NOT NULL,
  "startTimeMinutes" INTEGER,
  "endTimeMinutes" INTEGER,
  "lunchMinutes" INTEGER DEFAULT 30,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

-- WeeklyAdjustment Table
CREATE TABLE IF NOT EXISTS "WeeklyAdjustment" (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL REFERENCES "Employee"(id),
  "timesheetWeekId" TEXT NOT NULL REFERENCES "TimesheetWeek"(id),
  "adjustmentType" TEXT NOT NULL,
  "minutesOrCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

-- PayrollEstimate Table
CREATE TABLE IF NOT EXISTS "PayrollEstimate" (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL REFERENCES "Employee"(id),
  "timesheetWeekId" TEXT NOT NULL REFERENCES "TimesheetWeek"(id),
  "regularMinutes" INTEGER NOT NULL,
  "overtimeMinutes" INTEGER NOT NULL,
  "grossPayCents" INTEGER NOT NULL,
  "federalWithholdingMode" TEXT NOT NULL DEFAULT 'PERCENTAGE',
  "federalWithholdingValue" DOUBLE PRECISION NOT NULL,
  "stateWithholdingMode" TEXT NOT NULL DEFAULT 'PERCENTAGE',
  "stateWithholdingValue" DOUBLE PRECISION NOT NULL,
  "federalWithholdingCents" INTEGER NOT NULL,
  "stateWithholdingCents" INTEGER NOT NULL,
  "pfmlWithholdingCents" INTEGER NOT NULL DEFAULT 0,
  "extraStateWithholdingLabel" TEXT,
  "extraStateWithholdingCents" INTEGER NOT NULL DEFAULT 0,
  "manualNetOverrideCents" INTEGER,
  "netCheckEstimateCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

-- PrivateReport Table
CREATE TABLE IF NOT EXISTS "PrivateReport" (
  id TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "reportType" TEXT NOT NULL,
  "reportData" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- UserInvite Table
CREATE TABLE IF NOT EXISTS "UserInvite" (
  id TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  email TEXT NOT NULL,
  role TEXT,
  "inviteToken" TEXT UNIQUE,
  "expiresAt" TIMESTAMP,
  "acceptedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PayrollExport Table
CREATE TABLE IF NOT EXISTS "PayrollExport" (
  id TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"(id),
  "weekStart" TEXT NOT NULL,
  "exportKind" TEXT NOT NULL DEFAULT 'qbo',
  "totalRows" INTEGER NOT NULL,
  "totalHours" DOUBLE PRECISION NOT NULL,
  "fileName" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- StatePayrollRule Table (if needed)
CREATE TABLE IF NOT EXISTS "StatePayrollRule" (
  id TEXT PRIMARY KEY,
  "stateCode" TEXT NOT NULL,
  "ruleType" TEXT NOT NULL,
  "ruleValue" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_Company_stateCode" ON "Company"("stateCode");
CREATE INDEX IF NOT EXISTS "idx_CompanyPayrollSettings_companyId" ON "CompanyPayrollSettings"("companyId");
CREATE INDEX IF NOT EXISTS "idx_Crew_companyId" ON "Crew"("companyId");
CREATE INDEX IF NOT EXISTS "idx_Employee_companyId" ON "Employee"("companyId");
CREATE INDEX IF NOT EXISTS "idx_Employee_defaultCrewId" ON "Employee"("defaultCrewId");
CREATE INDEX IF NOT EXISTS "idx_CrewAssignment_crewId" ON "CrewAssignment"("crewId");
CREATE INDEX IF NOT EXISTS "idx_CrewAssignment_employeeId" ON "CrewAssignment"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_TimeEntryDay_employeeId" ON "TimeEntryDay"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_TimeEntryDay_timesheetWeekId" ON "TimeEntryDay"("timesheetWeekId");
CREATE INDEX IF NOT EXISTS "idx_PayrollEstimate_employeeId" ON "PayrollEstimate"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_PayrollEstimate_timesheetWeekId" ON "PayrollEstimate"("timesheetWeekId");
CREATE INDEX IF NOT EXISTS "idx_TimesheetWeek_companyId" ON "TimesheetWeek"("companyId");

-- Enable RLS on all application tables.
-- The app accesses these tables through the backend service layer, so there are
-- intentionally no anon/authenticated policies here by default.
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyPayrollSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Crew" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrewAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrewDayDefault" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollEstimate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollExport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrivateReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StatePayrollRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeEntryDay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimesheetStatusAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimesheetWeek" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeeklyAdjustment" ENABLE ROW LEVEL SECURITY;
