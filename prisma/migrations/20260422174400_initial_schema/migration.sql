-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "employeeId" TEXT,
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
    "usesCompanyFederalDefault" BOOLEAN NOT NULL DEFAULT true,
    "usesCompanyStateDefault" BOOLEAN NOT NULL DEFAULT true,
    "federalWithholdingPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "stateWithholdingPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
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
CREATE TABLE "CompanyPayrollSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyPayrollSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatePayrollRule" (
    "id" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    "supportLevel" TEXT NOT NULL,
    "hasStateIncomeTax" BOOLEAN NOT NULL DEFAULT true,
    "hasExtraEmployeeWithholdings" BOOLEAN NOT NULL DEFAULT false,
    "extraWithholdingTypes" TEXT,
    "defaultStateWithholdingMode" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "defaultStateWithholdingValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultPfmlEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultPfmlEmployeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "disclaimerText" TEXT,
    "lastReviewedAt" TIMESTAMP(3),
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatePayrollRule_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "PayrollEstimate" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "timesheetWeekId" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "Crew_companyId_idx" ON "Crew"("companyId");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPayrollSettings_companyId_key" ON "CompanyPayrollSettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "StatePayrollRule_stateCode_key" ON "StatePayrollRule"("stateCode");

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
CREATE UNIQUE INDEX "PayrollEstimate_timesheetWeekId_key" ON "PayrollEstimate"("timesheetWeekId");

-- CreateIndex
CREATE INDEX "PrivateReport_employeeId_reportDate_idx" ON "PrivateReport"("employeeId", "reportDate");

-- CreateIndex
CREATE INDEX "PrivateReport_crewId_reportDate_idx" ON "PrivateReport"("crewId", "reportDate");

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
ALTER TABLE "PayrollEstimate" ADD CONSTRAINT "PayrollEstimate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEstimate" ADD CONSTRAINT "PayrollEstimate_timesheetWeekId_fkey" FOREIGN KEY ("timesheetWeekId") REFERENCES "TimesheetWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateReport" ADD CONSTRAINT "PrivateReport_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateReport" ADD CONSTRAINT "PrivateReport_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateReport" ADD CONSTRAINT "PrivateReport_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
