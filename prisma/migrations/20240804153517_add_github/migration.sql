/*
  Warnings:

  - Added the required column `githubEmail` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `githubImage` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `githubName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubEmail" TEXT NOT NULL,
ADD COLUMN     "githubImage" TEXT NOT NULL,
ADD COLUMN     "githubName" TEXT NOT NULL;
