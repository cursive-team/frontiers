-- AlterTable
ALTER TABLE "JobMatchQueue" ADD COLUMN     "isInvalid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastCheckedTime" TIMESTAMP(3);
