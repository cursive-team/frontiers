-- CreateTable
CREATE TABLE "TestingJobMatch" (
    "id" SERIAL NOT NULL,
    "jobMatchId" INTEGER NOT NULL,
    "candidateData" TEXT NOT NULL,
    "recruiterData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestingJobMatch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestingJobMatch" ADD CONSTRAINT "TestingJobMatch_jobMatchId_fkey" FOREIGN KEY ("jobMatchId") REFERENCES "JobMatchQueue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
