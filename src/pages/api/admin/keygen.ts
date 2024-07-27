import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { generateSignatureKeyPair } from "@/lib/shared/signature";
import { initialKeygenData, keyUids } from "@/shared/keygen";
import { getServerRandomNullifierRandomness } from "@/lib/server/proving";

type CreateChipKeyData = {
  chipId: string;
  signaturePublicKey: string;
  signaturePrivateKey: string;
};

type PrecreateUserData = {
  chipId: string;
  isRegistered: boolean;
  isUserSpeaker: boolean;
  displayName: string;
  encryptionPublicKey: string;
  signaturePublicKey: string;
  psiPublicKeysLink: string;
};

type CreateLocationData = {
  id: number;
  chipId: string;
  name: string;
  stage: string;
  speaker: string;
  description: string;
  startTime: string;
  endTime: string;
  signaturePublicKey: string;
};

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

  // const existingChipKey = await prisma.chipKey.findFirst();
  // if (existingChipKey) {
  //   return res.status(400).json({ error: "Chip keys already exist" });
  // }

  try {
    const allUserIds: number[] = [];
    // const speakerUserIds: number[] = [];

    const allChipKeyData: CreateChipKeyData[] = [];
    const allUserData: PrecreateUserData[] = [];
    // const allLocationData: CreateLocationData[] = [];

    const newKeyUids = [];
    for (let i = 1; i <= 50; i++) {
      newKeyUids.push("CURSIVE" + i.toString().padStart(2, "0"));
    }

    for (const chipId of newKeyUids) {
      // Generate and save signing keypair
      const { signingKey, verifyingKey } = generateSignatureKeyPair();
      allChipKeyData.push({
        chipId,
        signaturePublicKey: verifyingKey,
        signaturePrivateKey: signingKey,
      });

      allUserData.push({
        chipId,
        isRegistered: false,
        isUserSpeaker: false,
        displayName: chipId,
        encryptionPublicKey: "",
        signaturePublicKey: verifyingKey,
        psiPublicKeysLink: "",
      });
    }

    // Create all chip keys
    await prisma.chipKey.createMany({
      data: allChipKeyData,
    });

    // Create all users
    await prisma.user.createMany({
      data: allUserData,
    });

    // Create all locations
    // await prisma.location.createMany({
    //   data: allLocationData,
    // });

    // BEGIN HARDCODED QUESTS FOR SIG SING WORKSHOP
    // Quest 1: Meet 10 attendees
    // await prisma.quest.create({
    //   data: {
    //     name: "🦋 Social Butterfly",
    //     description:
    //       "Connect with 10 people to make this proof. Ask to tap their ring, share socials, and discover event activity that you have in common.",
    //     userRequirements: {
    //       create: [
    //         {
    //           name: "Connect with 10 people at SigSing",
    //           numSigsRequired: 10,
    //           sigNullifierRandomness: getServerRandomNullifierRandomness(), // Ensures signatures cannot be reused to meet this requirement
    //           users: {
    //             connect: allUserIds.map((id) => ({ id })),
    //           },
    //         },
    //       ],
    //     },
    //     locationRequirements: {
    //       create: [],
    //     },
    //   },
    // });

    // Quest 2: Meet 3 speakers
    // await prisma.quest.create({
    //   data: {
    //     name: "🎤 Meet the speakers",
    //     description:
    //       "Ask 3 speakers a question or share feedback about their talk. Ask to tap their ring to collect a link to their presentation slides (if available)",
    //     userRequirements: {
    //       create: [
    //         {
    //           name: "Connect with 3 speakers at the Sig Sing workshop",
    //           numSigsRequired: 3,
    //           sigNullifierRandomness: getServerRandomNullifierRandomness(), // Ensures signatures cannot be reused to meet this requirement
    //           users: {
    //             connect: speakerUserIds.map((id) => ({ id })),
    //           },
    //         },
    //       ],
    //     },
    //     locationRequirements: {
    //       create: [],
    //     },
    //   },
    // });

    // Quest 3: Attend 5 talks
    // await prisma.quest.create({
    //   data: {
    //     name: "👩‍🏫 Acropolis Assembler",
    //     description:
    //       "Tap in to 5 talks at Zk Summit 11 to make this proof. Look for cards on posters at conference room entrances.",
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
