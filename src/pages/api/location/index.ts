import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { Location } from "@prisma/client";
import { ErrorResponse } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Location[] | ErrorResponse>
) {
  if (req.method === "GET") {
    try {
      const locations: Location[] = await prisma.location.findMany();

      return res.status(200).json(locations);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
