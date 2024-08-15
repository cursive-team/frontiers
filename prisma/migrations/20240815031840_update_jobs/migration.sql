/*
  Warnings:

  - You are about to drop the column `isCompleted` on the `JobMatchQueue` table. All the data in the column will be lost.
  - You are about to drop the `TestingJobCandidateInput` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestingJobMatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestingJobRecruiterInput` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `jobsEncryptedDataLink` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobsPublicKeyLink` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TestingJobCandidateInput" DROP CONSTRAINT "TestingJobCandidateInput_userId_fkey";

-- DropForeignKey
ALTER TABLE "TestingJobMatch" DROP CONSTRAINT "TestingJobMatch_jobMatchId_fkey";

-- DropForeignKey
ALTER TABLE "TestingJobRecruiterInput" DROP CONSTRAINT "TestingJobRecruiterInput_userId_fkey";

-- AlterTable
ALTER TABLE "JobMatchQueue" DROP COLUMN "isCompleted",
ADD COLUMN     "matchResults" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isCandidate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecruiter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobsEncryptedDataLink" TEXT NOT NULL,
ADD COLUMN     "jobsPublicKeyLink" TEXT NOT NULL;

-- DropTable
DROP TABLE "TestingJobCandidateInput";

-- DropTable
DROP TABLE "TestingJobMatch";

-- DropTable
DROP TABLE "TestingJobRecruiterInput";
