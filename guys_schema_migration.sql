-- MyGuys app schema
-- Regenerated from prisma/schema.prisma (no tax tables).
-- Prisma/Neon uses the table owner. These GRANT/REVOKE statements lock PostgREST roles.

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseId" UUID,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "employeeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "preferredView" TEXT NOT NULL DEFAULT 'office',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ownerName" TEXT,
    "stateCode" TEXT NOT NULL,
    "onboardingCompletedAt" TIMESTAMP(3),
    "onboardingCompletedByUserId" TEXT,
    "payrollDisclaimerAcceptedAt" TIMESTAMP(3),
    "payrollDisclaimerAcceptedByUserId" TEXT,
    "payrollDisclaimerVersion" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionTrialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crew" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "foremanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "workerType" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "hourlyRateCents" INTEGER NOT NULL,
    "overtimeRateCents" INTEGER,
    "defaultCrewId" TEXT,
    "archiveReason" TEXT,
    "archiveNotes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "rehiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "lastSentAt" TIMESTAMP(3),
    "sendCount" INTEGER NOT NULL DEFAULT 0,
    "invitedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyPayrollSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "timeTrackingStyle" TEXT NOT NULL DEFAULT 'FOREMAN',
    "weekStartDay" INTEGER NOT NULL DEFAULT 1,
    "defaultLunchMinutes" INTEGER NOT NULL DEFAULT 30,
    "payType" TEXT NOT NULL DEFAULT 'HOURLY_OVERTIME',
    "payrollMethod" TEXT NOT NULL DEFAULT 'MANUAL',
    "trackExpenses" BOOLEAN NOT NULL DEFAULT true,
    "payrollPrepDisclaimer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyPayrollSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewAssignment" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrewAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewDayDefault" (
    "id" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "startTimeMinutes" INTEGER,
    "endTimeMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewDayDefault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetWeek" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedByEmployeeAt" TIMESTAMP(3),
    "reviewedByForemanAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "exportedAt" TIMESTAMP(3),
    "exportedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimesheetWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetStatusAudit" (
    "id" TEXT NOT NULL,
    "timesheetWeekId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimesheetStatusAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntryDay" (
    "id" TEXT NOT NULL,
    "timesheetWeekId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "startTimeMinutes" INTEGER,
    "endTimeMinutes" INTEGER,
    "lunchMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "jobTag" TEXT,
    "employeeConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyAdjustment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "timesheetWeekId" TEXT NOT NULL,
    "gasReimbursementCents" INTEGER NOT NULL DEFAULT 0,
    "pettyCashCents" INTEGER NOT NULL DEFAULT 0,
    "deductionCents" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSubmission" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "timesheetWeekId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "hasReceipt" BOOLEAN NOT NULL DEFAULT false,
    "receiptPath" TEXT,
    "submittedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEstimate" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "timesheetWeekId" TEXT NOT NULL,
    "regularMinutes" INTEGER NOT NULL,
    "overtimeMinutes" INTEGER NOT NULL,
    "grossPayCents" INTEGER NOT NULL,
    "netCheckEstimateCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateReport" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "crewId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "jobTag" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "factualDescription" TEXT NOT NULL,
    "followUpStatus" TEXT NOT NULL DEFAULT 'OPEN',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollExport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "exportKind" TEXT NOT NULL DEFAULT 'qbo',
    "totalRows" INTEGER NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "fileName" TEXT NOT NULL,
    "exportedByUserId" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "Crew_companyId_idx" ON "Crew"("companyId");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_tokenHash_key" ON "UserInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "UserInvite_companyId_idx" ON "UserInvite"("companyId");

-- CreateIndex
CREATE INDEX "UserInvite_employeeId_idx" ON "UserInvite"("employeeId");

-- CreateIndex
CREATE INDEX "UserInvite_invitedByUserId_idx" ON "UserInvite"("invitedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPayrollSettings_companyId_key" ON "CompanyPayrollSettings"("companyId");

-- CreateIndex
CREATE INDEX "CrewAssignment_crewId_startsOn_idx" ON "CrewAssignment"("crewId", "startsOn");

-- CreateIndex
CREATE INDEX "CrewAssignment_employeeId_startsOn_idx" ON "CrewAssignment"("employeeId", "startsOn");

-- CreateIndex
CREATE UNIQUE INDEX "CrewDayDefault_crewId_weekStartDate_dayIndex_key" ON "CrewDayDefault"("crewId", "weekStartDate", "dayIndex");

-- CreateIndex
CREATE INDEX "TimesheetWeek_crewId_weekStartDate_idx" ON "TimesheetWeek"("crewId", "weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetWeek_employeeId_weekStartDate_key" ON "TimesheetWeek"("employeeId", "weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "TimeEntryDay_timesheetWeekId_dayIndex_key" ON "TimeEntryDay"("timesheetWeekId", "dayIndex");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyAdjustment_timesheetWeekId_key" ON "WeeklyAdjustment"("timesheetWeekId");

-- CreateIndex
CREATE INDEX "ExpenseSubmission_companyId_timesheetWeekId_idx" ON "ExpenseSubmission"("companyId", "timesheetWeekId");

-- CreateIndex
CREATE INDEX "ExpenseSubmission_employeeId_createdAt_idx" ON "ExpenseSubmission"("employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "ExpenseSubmission_submittedByUserId_idx" ON "ExpenseSubmission"("submittedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEstimate_timesheetWeekId_key" ON "PayrollEstimate"("timesheetWeekId");

-- CreateIndex
CREATE INDEX "PrivateReport_employeeId_reportDate_idx" ON "PrivateReport"("employeeId", "reportDate");

-- CreateIndex
CREATE INDEX "PrivateReport_crewId_reportDate_idx" ON "PrivateReport"("crewId", "reportDate");

-- CreateIndex
CREATE INDEX "PayrollExport_companyId_idx" ON "PayrollExport"("companyId");

-- CreateIndex
CREATE INDEX "PayrollExport_exportedAt_idx" ON "PayrollExport"("exportedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crew" ADD CONSTRAINT "Crew_foremanId_fkey" FOREIGN KEY ("foremanId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crew" ADD CONSTRAINT "Crew_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_defaultCrewId_fkey" FOREIGN KEY ("defaultCrewId") REFERENCES "Crew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPayrollSettings" ADD CONSTRAINT "CompanyPayrollSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewAssignment" ADD CONSTRAINT "CrewAssignment_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewAssignment" ADD CONSTRAINT "CrewAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewDayDefault" ADD CONSTRAINT "CrewDayDefault_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetWeek" ADD CONSTRAINT "TimesheetWeek_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetWeek" ADD CONSTRAINT "TimesheetWeek_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetStatusAudit" ADD CONSTRAINT "TimesheetStatusAudit_timesheetWeekId_fkey" FOREIGN KEY ("timesheetWeekId") REFERENCES "TimesheetWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntryDay" ADD CONSTRAINT "TimeEntryDay_timesheetWeekId_fkey" FOREIGN KEY ("timesheetWeekId") REFERENCES "TimesheetWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyAdjustment" ADD CONSTRAINT "WeeklyAdjustment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyAdjustment" ADD CONSTRAINT "WeeklyAdjustment_timesheetWeekId_fkey" FOREIGN KEY ("timesheetWeekId") REFERENCES "TimesheetWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSubmission" ADD CONSTRAINT "ExpenseSubmission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSubmission" ADD CONSTRAINT "ExpenseSubmission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSubmission" ADD CONSTRAINT "ExpenseSubmission_timesheetWeekId_fkey" FOREIGN KEY ("timesheetWeekId") REFERENCES "TimesheetWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSubmission" ADD CONSTRAINT "ExpenseSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEstimate" ADD CONSTRAINT "PayrollEstimate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEstimate" ADD CONSTRAINT "PayrollEstimate_timesheetWeekId_fkey" FOREIGN KEY ("timesheetWeekId") REFERENCES "TimesheetWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateReport" ADD CONSTRAINT "PrivateReport_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateReport" ADD CONSTRAINT "PrivateReport_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateReport" ADD CONSTRAINT "PrivateReport_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollExport" ADD CONSTRAINT "PayrollExport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollExport" ADD CONSTRAINT "PayrollExport_exportedByUserId_fkey" FOREIGN KEY ("exportedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS + explicit grants
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Crew" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyPayrollSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrewAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrewDayDefault" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimesheetWeek" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimesheetStatusAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeEntryDay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeeklyAdjustment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExpenseSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollEstimate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrivateReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollExport" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "User" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "User" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "User" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "User" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "Company" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "Company" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "Company" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "Company" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "Crew" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "Crew" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "Crew" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "Crew" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "Employee" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "Employee" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "Employee" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "Employee" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "UserInvite" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "UserInvite" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "UserInvite" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "UserInvite" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "CompanyPayrollSettings" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "CompanyPayrollSettings" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "CompanyPayrollSettings" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "CompanyPayrollSettings" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "CrewAssignment" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "CrewAssignment" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "CrewAssignment" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "CrewAssignment" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "CrewDayDefault" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "CrewDayDefault" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "CrewDayDefault" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "CrewDayDefault" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "TimesheetWeek" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "TimesheetWeek" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "TimesheetWeek" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "TimesheetWeek" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "TimesheetStatusAudit" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "TimesheetStatusAudit" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "TimesheetStatusAudit" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "TimesheetStatusAudit" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "TimeEntryDay" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "TimeEntryDay" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "TimeEntryDay" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "TimeEntryDay" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "WeeklyAdjustment" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "WeeklyAdjustment" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "WeeklyAdjustment" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "WeeklyAdjustment" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "ExpenseSubmission" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "ExpenseSubmission" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "ExpenseSubmission" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "ExpenseSubmission" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "PayrollEstimate" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "PayrollEstimate" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "PayrollEstimate" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "PayrollEstimate" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "PrivateReport" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "PrivateReport" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "PrivateReport" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "PrivateReport" TO service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "PayrollExport" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "PayrollExport" FROM authenticated;
  END IF;
  REVOKE ALL ON TABLE "PayrollExport" FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "PayrollExport" TO service_role;
  END IF;
END
$$;
