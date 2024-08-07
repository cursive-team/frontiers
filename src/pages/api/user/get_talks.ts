import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { ErrorResponse } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    { talks: { talkName: string; talkId: string }[] } | ErrorResponse
  >
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { encPk } = req.query;

  if (typeof encPk !== "string") {
    return res.status(400).json({ error: "Invalid encryption public key" });
  }

  try {
    const user = await prisma.user.findMany({
      where: { encryptionPublicKey: encPk },
      include: { talks: true },
    });

    if (!user || user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const talks = user[0].talks.map((talk) => ({
      talkName: talk.name,
      talkId: talk.id.toString(),
    }));

    return res.status(200).json({ talks });
  } catch (error) {
    console.error("Error fetching talks for user", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
