import { boolean, object, string } from "yup";
import { JUB_SIGNAL_MESSAGE_TYPE, encryptMessage } from ".";

export type JobInputMessage = {
  isCandidate: boolean;
  privateKey: string;
  serializedInput: string;
};

export const jobInputMessageSchema = object({
  isCandidate: boolean().required(),
  privateKey: string().required(),
  serializedInput: string().required(),
});

export type EncryptJobInputMessageArgs = {
  isCandidate: boolean;
  privateKey: string;
  serializedInput: string;
  senderPrivateKey: string;
  recipientPublicKey: string;
};

export async function encryptJobInputMessage({
  isCandidate,
  privateKey,
  serializedInput,
  senderPrivateKey,
  recipientPublicKey,
}: EncryptJobInputMessageArgs): Promise<string> {
  const messageData: JobInputMessage = {
    isCandidate,
    privateKey,
    serializedInput,
  };

  const encryptedMessage = await encryptMessage(
    JUB_SIGNAL_MESSAGE_TYPE.JOB_INPUT,
    messageData,
    senderPrivateKey,
    recipientPublicKey
  );

  return encryptedMessage;
}
