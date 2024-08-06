import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { ErrorResponse } from "@/types";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ isUnique: boolean } | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Session not found" });
  }
  const githubUserId = (session as any).githubUserId;

  const sharedUser = await prisma.user.findFirst({
    where: {
      githubUserId,
    },
  });
  if (sharedUser) {
    return res.status(200).json({ isUnique: false });
  } else {
    return res.status(200).json({ isUnique: true });
  }
}
