-- CreateTable
CREATE TABLE "TestingJobCandidateInput" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "inputData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestingJobCandidateInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestingJobRecruiterInput" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "inputData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestingJobRecruiterInput_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestingJobCandidateInput" ADD CONSTRAINT "TestingJobCandidateInput_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestingJobRecruiterInput" ADD CONSTRAINT "TestingJobRecruiterInput_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
