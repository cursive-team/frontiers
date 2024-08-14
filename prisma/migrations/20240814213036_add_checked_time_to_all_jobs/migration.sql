/*
  Warnings:

  - Made the column `lastCheckedTime` on table `JobMatchQueue` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "JobMatchQueue" ALTER COLUMN "lastCheckedTime" SET NOT NULL,
ALTER COLUMN "lastCheckedTime" SET DEFAULT CURRENT_TIMESTAMP;
