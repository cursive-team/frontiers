import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { verifyAuthToken } from "@/lib/server/auth";

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
    const matches = await prisma.jobMatchQueue.findMany({
      where: {
        proposerId: userId,
        matchResultsLink: { not: null },
      },
      select: {
        id: true,
        matchResultsLink: true,
        accepter: {
          select: {
            encryptionPublicKey: true,
          },
        },
      },
    });

    if (!matches || matches.length === 0) {
      return res.status(200).json({ matches: [] });
    }

    // Format the matches to include candidate and recruiter data
    const formattedMatches = matches.map((match) => ({
      id: match.id,
      matchResultsLink: match.matchResultsLink,
      accepterEncPubKey: match.accepter.encryptionPublicKey,
    }));

    return res.status(200).json({ matches: formattedMatches });
  } catch (error) {
    console.error("Error fetching recruiter matches:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
