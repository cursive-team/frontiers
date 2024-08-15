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
        matchResults: { not: null },
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

    const accepter = await prisma.user.findUnique({
      where: {
        id: nextJobMatch.accepterId,
      },
    });

    // mark job invalid if proposer or accepter not found
    if (!proposer || !accepter) {
      await prisma.jobMatchQueue.update({
        where: {
          id: nextJobMatch.id,
        },
        data: {
          isInvalid: true,
          lastCheckedTime: new Date(),
        },
      });
      return res.status(400).json({ error: "Proposer or accepter not found" });
    }

    // mark job invalid if proposer is candidate or accepter is recruiter
    if (proposer.isCandidate || accepter.isRecruiter) {
      await prisma.jobMatchQueue.update({
        where: {
          id: nextJobMatch.id,
        },
        data: {
          isInvalid: true,
          lastCheckedTime: new Date(),
        },
      });
      return res
        .status(200)
        .json({ message: "Proposer is candidate or accepter is recruiter" });
    }

    // update job checked time if proposer is not recruiter or accepter is not candidate or if either party has not submitted encrypted data or keys
    const proposerPublicKeyLink = proposer.jobsPublicKeyLink;
    const accepterPublicKeyLink = accepter.jobsPublicKeyLink;
    const proposerInputLink = proposer.jobsEncryptedDataLink;
    const accepterInputLink = accepter.jobsEncryptedDataLink;
    if (
      !proposer.isRecruiter ||
      !accepter.isCandidate ||
      !proposerPublicKeyLink ||
      !accepterPublicKeyLink ||
      !proposerInputLink ||
      !accepterInputLink
    ) {
      await prisma.jobMatchQueue.update({
        where: {
          id: nextJobMatch.id,
        },
        data: {
          lastCheckedTime: new Date(),
        },
      });
      return res.status(200).json({
        message: "Proposer is not recruiter or accepter is not candidate",
      });
    }

    // TODO: compute shared public key
    const sharedPublicKey = "shared";
    // TODO: fetch proposer and accepter encrypted data
    const proposerEncryptedData = JSON.parse(
      proposerInputLink
    ) as JobRecruiterInput;
    const accepterEncryptedData = JSON.parse(
      accepterInputLink
    ) as JobCandidateInput;
    // TODO: compute computation result
    const isSuccessfulMatch = await computeJobMatchOutput(
      proposerEncryptedData,
      accepterEncryptedData
    );

    // log match result
    await prisma.jobMatchQueue.update({
      where: {
        id: nextJobMatch.id,
      },
      data: {
        matchResults: isSuccessfulMatch.toString(),
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
