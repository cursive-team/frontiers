import { bool, number, object, string } from "yup";
import { JUB_SIGNAL_MESSAGE_TYPE, encryptMessage } from ".";

export type RecruiterSharedMessage = {
  name: string; // Display name
  encPk: string; // Encryption public key
  role: string; // Role
  project: string; // Project
  jobLink?: string; // Link to job
  decryptionShareLink: string; // Link to decryption share
  matchId: number; // Match ID
  matchResultsLink: string; // Link to match results
  jobTags?: string; // Job tags
  jobStage?: string; // Job stage
  jobExperience?: number; // Job experience
  jobPartTime?: boolean; // Job part time
};

export const recruiterSharedMessageSchema = object({
  name: string().required(),
  encPk: string().required(),
  role: string().required(),
  project: string().required(),
  jobLink: string().optional(),
  decryptionShareLink: string().required(),
  matchId: number().required(),
  matchResultsLink: string().required(),
  jobTags: string().optional(),
  jobStage: string().optional(),
  jobExperience: number().optional(),
  jobPartTime: bool().optional(),
});

export type EncryptRecruiterSharedMessageArgs = {
  displayName: string;
  encryptionPublicKey: string;
  role: string;
  project: string;
  jobLink?: string;
  decryptionShareLink: string;
  matchId: number;
  matchResultsLink: string;
  senderPrivateKey: string;
  recipientPublicKey: string;
  jobTags?: string;
  jobStage?: string;
  jobExperience?: number;
  jobPartTime?: boolean;
};

export async function encryptRecruiterSharedMessage({
  displayName,
  encryptionPublicKey,
  role,
  project,
  jobLink,
  decryptionShareLink,
  matchId,
  matchResultsLink,
  senderPrivateKey,
  recipientPublicKey,
  jobTags,
  jobStage,
  jobExperience,
  jobPartTime,
}: EncryptRecruiterSharedMessageArgs): Promise<string> {
  const messageData: RecruiterSharedMessage = {
    name: displayName,
    encPk: encryptionPublicKey,
    role,
    project,
    jobLink,
    decryptionShareLink,
    matchId,
    matchResultsLink,
    jobTags,
    jobStage,
    jobExperience,
    jobPartTime,
  };

  const encryptedMessage = await encryptMessage(
    JUB_SIGNAL_MESSAGE_TYPE.RECRUITER_SHARED,
    messageData,
    senderPrivateKey,
    recipientPublicKey
  );

  return encryptedMessage;
}
