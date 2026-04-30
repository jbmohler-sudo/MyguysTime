CREATE TABLE "ExpenseSubmission" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "timesheetWeekId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "hasReceipt" BOOLEAN NOT NULL DEFAULT false,
    "submittedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExpenseSubmission_companyId_timesheetWeekId_idx" ON "ExpenseSubmission"("companyId", "timesheetWeekId");
CREATE INDEX "ExpenseSubmission_employeeId_createdAt_idx" ON "ExpenseSubmission"("employeeId", "createdAt");
CREATE INDEX "ExpenseSubmission_submittedByUserId_idx" ON "ExpenseSubmission"("submittedByUserId");

ALTER TABLE "ExpenseSubmission" ADD CONSTRAINT "ExpenseSubmission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseSubmission" ADD CONSTRAINT "ExpenseSubmission_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseSubmission" ADD CONSTRAINT "ExpenseSubmission_timesheetWeekId_fkey" FOREIGN KEY ("timesheetWeekId") REFERENCES "TimesheetWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseSubmission" ADD CONSTRAINT "ExpenseSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
