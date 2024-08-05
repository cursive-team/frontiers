/*
  Warnings:

  - Added the required column `talkTime` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "talkTime" TIMESTAMP(3) NOT NULL;
