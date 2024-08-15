import { array, number, object, string } from "yup";
import { JUB_SIGNAL_MESSAGE_TYPE, encryptMessage } from ".";

export type CandidateSharedMessage = {
  name: string; // Display name
  encPk: string; // Encryption public key
  bio?: string; // Bio
  email: string; // Email
  githubUserId: string; // GitHub user ID
  githubLogin: string; // GitHub username
  education: number; // Education
  interests: string[]; // Interests
  experience: number; // Experience
  stage: string[]; // Stage
  matchId: number; // Match ID
};

export const candidateSharedMessageSchema = object({
  name: string().required(),
  encPk: string().required(),
  bio: string().optional(),
  email: string().required(),
  githubUserId: string().required(),
  githubLogin: string().required(),
  education: number().required(),
  interests: array().of(string().required()).required(),
  experience: number().required(),
  stage: array().of(string().required()).required(),
  matchId: number().required(),
});

export type EncryptCandidateSharedMessageArgs = {
  displayName: string;
  encryptionPublicKey: string;
  bio?: string;
  email: string;
  githubUserId: string;
  githubLogin: string;
  education: number;
  interests: string[];
  experience: number;
  stage: string[];
  matchId: number;
  senderPrivateKey: string;
  recipientPublicKey: string;
};

export async function encryptCandidateSharedMessage({
  displayName,
  encryptionPublicKey,
  bio,
  email,
  githubUserId,
  githubLogin,
  education,
  interests,
  experience,
  stage,
  matchId,
  senderPrivateKey,
  recipientPublicKey,
}: EncryptCandidateSharedMessageArgs): Promise<string> {
  const messageData: CandidateSharedMessage = {
    name: displayName,
    encPk: encryptionPublicKey,
    bio,
    email,
    githubUserId,
    githubLogin,
    education,
    interests,
    experience,
    stage,
    matchId,
  };

  const encryptedMessage = await encryptMessage(
    JUB_SIGNAL_MESSAGE_TYPE.CANDIDATE_SHARED,
    messageData,
    senderPrivateKey,
    recipientPublicKey
  );

  return encryptedMessage;
}
