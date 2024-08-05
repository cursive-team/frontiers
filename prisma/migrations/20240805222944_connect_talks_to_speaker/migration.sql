-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "speakerUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_speakerUserId_fkey" FOREIGN KEY ("speakerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
