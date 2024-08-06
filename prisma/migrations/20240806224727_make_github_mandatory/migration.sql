/*
  Warnings:

  - Made the column `githubEmail` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `githubImage` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `githubName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `githubLogin` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `githubUserId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "githubEmail" SET NOT NULL,
ALTER COLUMN "githubImage" SET NOT NULL,
ALTER COLUMN "githubName" SET NOT NULL,
ALTER COLUMN "githubLogin" SET NOT NULL,
ALTER COLUMN "githubUserId" SET NOT NULL;
