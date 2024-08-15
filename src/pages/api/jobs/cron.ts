import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import pako from "pako";
import { deserializeMPCData, serializeMPCData } from "@/lib/client/mpc";
import {
  ni_hiring_init_web,
  ni_hiring_server_setup_web,
  ni_hiring_server_compute_web,
} from "pz-hiring";
import { put } from "@vercel/blob";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch the next job match queue entry that is not completed or invalid
    const nextJobMatch = await prisma.jobMatchQueue.findFirst({
      where: {
        matchResultsLink: { equals: null },
        isInvalid: false,
      },
      orderBy: {
        lastCheckedTime: "asc",
      },
    });

    if (!nextJobMatch) {
      return res.status(404).json({ error: "No job match queue entry found" });
    }

    const proposer = await prisma.user.findUnique({
      where: {
        id: nextJobMatch.proposerId,
      },
    });

    const accepter = await prisma.user.findUnique({
      where: {
        id: nextJobMatch.accepterId,
      },
    });

    // mark job invalid if proposer or accepter not found
    if (!proposer || !accepter) {
      await prisma.jobMatchQueue.update({
        where: {
          id: nextJobMatch.id,
        },
        data: {
          isInvalid: true,
          lastCheckedTime: new Date(),
        },
      });
      return res.status(400).json({ error: "Proposer or accepter not found" });
    }

    // mark job invalid if proposer is candidate or accepter is recruiter
    if (proposer.isCandidate || accepter.isRecruiter) {
      await prisma.jobMatchQueue.update({
        where: {
          id: nextJobMatch.id,
        },
        data: {
          isInvalid: true,
          lastCheckedTime: new Date(),
        },
      });
      return res
        .status(200)
        .json({ message: "Proposer is candidate or accepter is recruiter" });
    }

    // update job checked time if proposer is not recruiter or accepter is not candidate or if either party has not submitted encrypted data or keys
    const proposerPublicKeyLink = proposer.jobsPublicKeyLink;
    const accepterPublicKeyLink = accepter.jobsPublicKeyLink;
    const proposerInputLink = proposer.jobsEncryptedDataLink;
    const accepterInputLink = accepter.jobsEncryptedDataLink;
    if (
      !proposer.isRecruiter ||
      !accepter.isCandidate ||
      !proposerPublicKeyLink ||
      !accepterPublicKeyLink ||
      !proposerInputLink ||
      !accepterInputLink
    ) {
      await prisma.jobMatchQueue.update({
        where: {
          id: nextJobMatch.id,
        },
        data: {
          lastCheckedTime: new Date(),
        },
      });
      return res.status(200).json({
        message: "Proposer is not recruiter or accepter is not candidate",
      });
    }

    // fetch respective server key shares from blob
    console.time("fetching public keys");
    const proposerPublicKeyResponse = await fetch(proposerPublicKeyLink);
    const accepterPublicKeyResponse = await fetch(accepterPublicKeyLink);
    if (!proposerPublicKeyResponse.ok || !accepterPublicKeyResponse.ok) {
      throw new Error("Failed to fetch public key blobs");
    }
    const proposerPublicKey = new Uint8Array(
      await proposerPublicKeyResponse.arrayBuffer()
    );
    const accepterPublicKey = new Uint8Array(
      await accepterPublicKeyResponse.arrayBuffer()
    );
    console.timeEnd("fetching public keys");

    // inflate using pako/gzip
    console.time("deserializing public keys");
    const inflatedProposerPublicKey = pako.inflate(proposerPublicKey, {
      to: "string",
    });
    const deserializedProposerPublicKey = deserializeMPCData(
      inflatedProposerPublicKey
    );
    const inflatedAccepterPublicKey = pako.inflate(accepterPublicKey, {
      to: "string",
    });
    const deserializedAccepterPublicKey = deserializeMPCData(
      inflatedAccepterPublicKey
    );
    console.timeEnd("deserializing public keys");

    // Fetch proposer and accepter encrypted data
    console.time("fetching input data");
    const proposerInputResponse = await fetch(proposerInputLink);
    const accepterInputResponse = await fetch(accepterInputLink);
    if (!proposerInputResponse.ok || !accepterInputResponse.ok) {
      throw new Error("Failed to fetch input data blobs");
    }
    console.timeEnd("fetching input data");

    // deserialize using bespoke function
    console.time("deserializing input data");
    const proposerInput = deserializeMPCData(
      await proposerInputResponse.text()
    );
    const accepterInput = deserializeMPCData(
      await accepterInputResponse.text()
    );
    console.timeEnd("deserializing input data");

    // server creates shared key for proposer/accepter
    console.time("setting up server keys");

    // only need to run this once, running it more leads to error but doesn't
    // break the rest of the code, so this is hacky way of getting around it
    try {
      ni_hiring_init_web(BigInt(1));
    } catch (e) {
      console.error("Error initializing server:", e);
    }
    try {
      ni_hiring_server_setup_web(
        deserializedProposerPublicKey,
        deserializedAccepterPublicKey
      );
    } catch (e) {
      console.error("Error setting up server keys:", e);
    }
    console.timeEnd("setting up server keys");

    console.time("computing FHE computation");
    let res_fhe = ni_hiring_server_compute_web(proposerInput, accepterInput);
    console.timeEnd("computing FHE computation");

    console.time("uploading FHE result");
    const blob = await put("fhe_result", serializeMPCData(res_fhe), {
      access: "public",
    });
    console.timeEnd("uploading FHE result");

    // log match result
    await prisma.jobMatchQueue.update({
      where: {
        id: nextJobMatch.id,
      },
      data: {
        matchResultsLink: blob.url,
        lastCheckedTime: new Date(),
      },
    });

    return res.status(200).json({
      message: "Job match executed successfully",
      jobMatch: nextJobMatch,
    });
  } catch (error) {
    console.error("Error executing job match:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const config = {
  maxDuration: 300, // 5 minutes in seconds
};
