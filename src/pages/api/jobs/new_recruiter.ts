import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { verifyAuthToken } from "@/lib/server/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { inputData, authToken } = req.body;

  if (!inputData || typeof inputData !== "string") {
    return res.status(400).json({ error: "Invalid input data" });
  }

  const userId = await verifyAuthToken(authToken);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const existingCandidateInput =
    await prisma.testingJobCandidateInput.findFirst({
      where: {
        userId,
      },
    });
  if (existingCandidateInput) {
    return res.status(400).json({ error: "Candidate already exists" });
  }

  const existingRecruiterInput =
    await prisma.testingJobRecruiterInput.findFirst({
      where: {
        userId,
      },
    });
  if (existingRecruiterInput) {
    return res.status(400).json({ error: "Recruiter already exists" });
  }

  try {
    await prisma.testingJobRecruiterInput.create({
      data: {
        userId,
        inputData,
      },
    });

    return res.status(201).json({});
  } catch (error) {
    console.error("Error creating new recruiter:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}