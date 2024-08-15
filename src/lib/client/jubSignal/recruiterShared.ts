import { number, object, string } from "yup";
import { JUB_SIGNAL_MESSAGE_TYPE, encryptMessage } from ".";

export type RecruiterSharedMessage = {
  name: string; // Display name
  encPk: string; // Encryption public key
  role: string; // Role
  project: string; // Project
  jobLink: string; // Link to job
  decryptionShareLink: string; // Link to decryption share
  matchId: number; // Match ID
  matchResultsLink: string; // Link to match results
};

export const recruiterSharedMessageSchema = object({
  name: string().required(),
  encPk: string().required(),
  role: string().required(),
  project: string().required(),
  jobLink: string().required(),
  decryptionShareLink: string().required(),
  matchId: number().required(),
  matchResultsLink: string().required(),
});

export type EncryptRecruiterSharedMessageArgs = {
  displayName: string;
  encryptionPublicKey: string;
  role: string;
  project: string;
  jobLink: string;
  decryptionShareLink: string;
  matchId: number;
  matchResultsLink: string;
  senderPrivateKey: string;
  recipientPublicKey: string;
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
  };

  const encryptedMessage = await encryptMessage(
    JUB_SIGNAL_MESSAGE_TYPE.RECRUITER_SHARED,
    messageData,
    senderPrivateKey,
    recipientPublicKey
  );

  return encryptedMessage;
}
