import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { generateSignatureKeyPair } from "@/lib/shared/signature";
import { initialLocationData, userUids, speakerUids } from "@/shared/keygen";
import { getServerRandomNullifierRandomness } from "@/lib/server/proving";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const password = req.body.password;
  if (password !== process.env.KEYGEN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch all users from the prisma table
    const allUsers = await prisma.user.findMany();

    // Extract user IDs
    const allUserIds = allUsers.map((user) => user.id);

    // Extract speaker user IDs
    const speakerUserIds = allUsers
      .filter((user) => user.isUserSpeaker)
      .map((user) => user.id);

    // BEGIN HARDCODED QUESTS FOR SIG SING WORKSHOP
    // Quest 1: Meet 10 attendees
    await prisma.quest.create({
      data: {
        name: "💻 Frontiers Superconnector",
        description:
          "Connect with 50 different people at Frontiers to make this proof. Ask to tap their badge, share socials, and discover event activity that you have in common.",
        userRequirements: {
          create: [
            {
              name: "Connect with 50 people at Frontiers",
              numSigsRequired: 50,
              sigNullifierRandomness: getServerRandomNullifierRandomness(), // Ensures signatures cannot be reused to meet this requirement
              users: {
                connect: allUserIds.map((id) => ({ id })),
              },
            },
          ],
        },
        locationRequirements: {
          create: [],
        },
      },
    });

    // Quest 2: Meet 3 speakers
    await prisma.quest.create({
      data: {
        name: "🎤 Speaker Connector",
        description:
          "Ask 3 speakers a question or share feedback about their talk. Ask to tap their badge to collect a link to their presentation slides (if available)",
        userRequirements: {
          create: [
            {
              name: "Connect with 3 speakers at Frontiers",
              numSigsRequired: 3,
              sigNullifierRandomness: getServerRandomNullifierRandomness(), // Ensures signatures cannot be reused to meet this requirement
              users: {
                connect: speakerUserIds.map((id) => ({ id })),
              },
            },
          ],
        },
        locationRequirements: {
          create: [],
        },
      },
    });

    // // Quest 3: Attend 5 talks
    // await prisma.quest.create({
    //   data: {
    //     name: "👩‍🏫 Collect 5 Talk ZK-POAPs",
    //     description:
    //       "Collect 5 ZK-POAPs for talks you enjoyed to make this proof. Find the NFC stickers corresponding to each one.",
    //     userRequirements: {
    //       create: [],
    //     },
    //     locationRequirements: {
    //       create: [
    //         {
    //           name: "Attend 5 talks at ZK Summit 11",
    //           numSigsRequired: 5,
    //           sigNullifierRandomness: getServerRandomNullifierRandomness(), // Ensures signatures cannot be reused to meet this requirement
    //           locations: {
    //             connect: allTalkIds.map((id) => ({ id })),
    //           },
    //         },
    //       ],
    //     },
    //   },
    // });
    // END HARDCODED QUESTS FOR SIG SING WORKSHOP

    res.status(200).json({});
  } catch (error) {
    console.log("Failed to generate keys", error);
    res.status(500).json({ error: "Failed to generate keys" });
  }
}
