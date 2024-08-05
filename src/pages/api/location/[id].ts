import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { ErrorResponse, LocationWithQuests } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LocationWithQuests | ErrorResponse>
) {
  if (req.method === "GET") {
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid input parameters" });
    }

    const location: LocationWithQuests | null =
      await prisma.location.findUnique({
        where: {
          id: parseInt(id),
        },
        include: {
          questRequirements: {
            select: {
              id: true,
              questId: true,
            },
          },
          speakerUser: {
            select: {
              displayName: true,
              encryptionPublicKey: true,
              signaturePublicKey: true,
            },
          },
        },
      });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    return res.status(200).json(location);
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
