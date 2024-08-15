-- AlterTable
ALTER TABLE "User" ALTER COLUMN "jobsEncryptedDataLink" DROP NOT NULL,
ALTER COLUMN "jobsPublicKeyLink" DROP NOT NULL;
