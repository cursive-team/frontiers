import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { ErrorResponse } from "@/types";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ displayName?: string } | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Session not found" });
  }
  const githubUserId = (session as any).githubUserId;
  if (!githubUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      githubUserId,
    },
  });
  if (existingUser) {
    return res.status(200).json({ displayName: existingUser.displayName });
  } else {
    return res.status(200).json({ displayName: undefined });
  }
}
