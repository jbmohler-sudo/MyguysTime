-- AlterTable
ALTER TABLE "CompanyPayrollSettings" ADD COLUMN     "payrollMethod" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "weekStartDay" INTEGER NOT NULL DEFAULT 1;
