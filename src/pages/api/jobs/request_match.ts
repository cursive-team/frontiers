import { NextApiRequest, NextApiResponse } from "next";
import { verifyAuthToken } from "@/lib/server/auth";
import prisma from "@/lib/server/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { authToken, encryptionPublicKey } = req.body;

  if (!authToken || !encryptionPublicKey) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const userId = await verifyAuthToken(authToken);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.isRecruiter) {
    return res
      .status(400)
      .json({ error: "Only recruiters can request matches" });
  }

  const otherUser = await prisma.user.findFirst({
    where: {
      encryptionPublicKey,
    },
  });
  if (!otherUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const existingMatch = await prisma.jobMatchQueue.findFirst({
    where: {
      proposerId: userId,
      accepterId: otherUser.id,
    },
  });
  if (existingMatch) {
    return res
      .status(400)
      .json({ error: "Match request already sent to this user" });
  }

  try {
    await prisma.jobMatchQueue.create({
      data: {
        proposerId: userId,
        accepterId: otherUser.id,
      },
    });

    return res.status(200).json({ message: "Match request sent successfully" });
  } catch (error) {
    console.error("Error encrypting message:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
