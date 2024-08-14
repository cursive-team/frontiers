-- CreateTable
CREATE TABLE "JobMatchQueue" (
    "id" SERIAL NOT NULL,
    "proposerId" INTEGER NOT NULL,
    "accepterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobMatchQueue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobMatchQueue" ADD CONSTRAINT "JobMatchQueue_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatchQueue" ADD CONSTRAINT "JobMatchQueue_accepterId_fkey" FOREIGN KEY ("accepterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
