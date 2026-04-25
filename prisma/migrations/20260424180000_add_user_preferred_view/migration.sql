-- AlterTable: add preferredView column to User with a default of 'office'
ALTER TABLE "User" ADD COLUMN "preferredView" TEXT NOT NULL DEFAULT 'office';
