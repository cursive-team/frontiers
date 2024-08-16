import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { JobRecruiterInput } from "@/components/jobs/RecruiterPage";
import { JobCandidateInput } from "@/components/jobs/CandidatePage";
import { verifyAuthToken } from "@/lib/server/auth";

export type CandidateJobMatch = {
  id: number;
  candidateData: JobCandidateInput;
  recruiterData: JobRecruiterInput;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { authToken } = req.query;
  const userId = await verifyAuthToken(authToken as string);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch matches for the given recruiter ID
    const matches = await prisma.testingJobMatch.findMany({
      where: {
        jobMatch: {
          proposerId: userId,
        },
        candidateAccepted: false,
      },
      include: {
        jobMatch: true,
      },
    });

    if (!matches || matches.length === 0) {
      return res.status(200).json({ matches: [] });
    }

    // Format the matches to include candidate and recruiter data
    const formattedMatches = matches.map((match) => ({
      id: match.id,
      candidateData: JSON.parse(match.candidateData) as JobCandidateInput,
      recruiterData: JSON.parse(match.recruiterData) as JobRecruiterInput,
    }));

    return res.status(200).json({ matches: formattedMatches });
  } catch (error) {
    console.error("Error fetching recruiter matches:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
