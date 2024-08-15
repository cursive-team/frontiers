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

  const { authToken, jobsPublicKeyLink, jobsEncryptedDataLink, isCandidate } =
    JSON.parse(req.body);

  const userId = await verifyAuthToken(authToken);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.isCandidate || user.isRecruiter) {
    return res
      .status(400)
      .json({ error: "User is already a candidate or recruiter" });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        jobsPublicKeyLink,
        jobsEncryptedDataLink,
        isCandidate,
        isRecruiter: !isCandidate,
      },
    });

    return res.status(201).json({});
  } catch (error) {
    console.error("Error creating new candidate:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
