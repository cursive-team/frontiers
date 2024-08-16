import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { JobCandidateInput } from "@/components/jobs/CandidatePage";
import { JobRecruiterInput } from "@/components/jobs/RecruiterPage";
import { computeJobMatchOutput } from "@/lib/server/jobs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch the next job match queue entry that is not completed or invalid
    const nextJobMatch = await prisma.jobMatchQueue.findFirst({
      where: {
        isCompleted: false,
        isInvalid: false,
      },
      orderBy: {
        lastCheckedTime: "asc",
      },
    });

    if (!nextJobMatch) {
      return res.status(404).json({ error: "No job match queue entry found" });
    }

    const proposer = await prisma.user.findUnique({
      where: {
        id: nextJobMatch.proposerId,
      },
    });
    if (!proposer) {
      return res.status(404).json({ error: "Proposer not found" });
    }

    const accepter = await prisma.user.findUnique({
      where: {
        id: nextJobMatch.accepterId,
      },
    });
    if (!accepter) {
      return res.status(404).json({ error: "Accepter not found" });
    }

    // get proposer input
    const proposerRecruiterInput =
      await prisma.testingJobRecruiterInput.findFirst({
        where: {
          userId: proposer.id,
        },
      });
    if (!proposerRecruiterInput) {
      return res
        .status(400)
        .json({ error: "Proposer has not submitted recruiter input" });
    }

    // if accepter is recruiter, mark job invalid
    const accepterIsRecruiter = await prisma.testingJobRecruiterInput.findFirst(
      {
        where: {
          userId: accepter.id,
        },
      }
    );
    if (accepterIsRecruiter) {
      await prisma.jobMatchQueue.update({
        where: {
          id: nextJobMatch.id,
        },
        data: {
          isInvalid: true,
          lastCheckedTime: new Date(),
        },
      });

      return res.status(200).json({
        message: "Job match marked as invalid",
        jobMatch: nextJobMatch,
      });
    }

    // if accepter is not candidate, update last checked time and return
    const accepterIsCandidate = await prisma.testingJobCandidateInput.findFirst(
      {
        where: {
          userId: accepter.id,
        },
      }
    );
    if (!accepterIsCandidate) {
      await prisma.jobMatchQueue.update({
        where: {
          id: nextJobMatch.id,
        },
        data: {
          lastCheckedTime: new Date(),
        },
      });

      return res.status(200).json({
        message: "Job match accepter has not submitted candidate input",
        jobMatch: nextJobMatch,
      });
    }

    // compute match output
    const recruiterInput = JSON.parse(
      proposerRecruiterInput.inputData
    ) as JobRecruiterInput;
    const candidateInput = JSON.parse(
      accepterIsCandidate.inputData
    ) as JobCandidateInput;
    const isSuccessfulMatch = await computeJobMatchOutput(
      recruiterInput,
      candidateInput
    );

    // send match output to recruiter

    // send match output to client
    if (isSuccessfulMatch) {
      await prisma.testingJobMatch.create({
        data: {
          jobMatchId: nextJobMatch.id,
          candidateData: accepterIsCandidate.inputData,
          recruiterData: proposerRecruiterInput.inputData,
        },
      });
    }

    await prisma.jobMatchQueue.update({
      where: {
        id: nextJobMatch.id,
      },
      data: {
        isCompleted: true,
        lastCheckedTime: new Date(),
      },
    });

    return res.status(200).json({
      message: "Job match executed successfully",
      jobMatch: nextJobMatch,
    });
  } catch (error) {
    console.error("Error executing job match:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
