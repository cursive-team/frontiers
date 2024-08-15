/*
  Warnings:

  - You are about to drop the column `matchResults` on the `JobMatchQueue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JobMatchQueue" DROP COLUMN "matchResults",
ADD COLUMN     "matchResultsLink" TEXT;
