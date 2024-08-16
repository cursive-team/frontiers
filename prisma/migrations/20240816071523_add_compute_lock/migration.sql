-- AlterTable
ALTER TABLE "JobMatchQueue" ADD COLUMN     "computeLock" BOOLEAN NOT NULL DEFAULT false;
