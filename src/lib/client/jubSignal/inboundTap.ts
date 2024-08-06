import { boolean, object, string } from "yup";
import { JUB_SIGNAL_MESSAGE_TYPE, encryptMessage } from ".";

export type InboundTapMessage = {
  name: string; // Display name
  encPk: string; // Encryption public key
  psiPkLink: string; // Link to PSI public keys
  pkId: string; // Public key index for PSI
  x?: string; // Twitter handle
  fc?: string; // Farcaster handle
  tg?: string; // Telegram handle
  bio?: string; // Bio
  pk: string; // Signature public key
  msg: string; // Signature message
  sig: string; // Signature
  isSpk?: boolean; // Is speaker
  ghUserId: string; // GitHub ID
  ghLogin: string; // GitHub username
};

export const inboundTapMessageSchema = object({
  name: string().required(),
  encPk: string().required(),
  psiPkLink: string().required(),
  pkId: string().required(),
  x: string().optional(),
  fc: string().optional(),
  tg: string().optional(),
  bio: string().optional(),
  pk: string().required(),
  msg: string().required(),
  sig: string().required(),
  isSpk: boolean().optional().default(false),
  ghUserId: string().required(),
  ghLogin: string().required(),
});

export type EncryptInboundTapMessageArgs = {
  displayName: string;
  encryptionPublicKey: string;
  psiPublicKeysLink: string;
  pkId: string;
  twitterUsername?: string;
  farcasterUsername?: string;
  telegramUsername?: string;
  bio?: string;
  signaturePublicKey: string;
  signatureMessage: string;
  signature: string;
  isSpeaker?: boolean;
  githubUserId: string;
  githubLogin: string;
  senderPrivateKey: string;
  recipientPublicKey: string;
};

export async function encryptInboundTapMessage({
  displayName,
  encryptionPublicKey,
  psiPublicKeysLink,
  pkId,
  twitterUsername,
  farcasterUsername,
  telegramUsername,
  bio,
  signaturePublicKey,
  signatureMessage,
  signature,
  isSpeaker,
  githubUserId,
  githubLogin,
  senderPrivateKey,
  recipientPublicKey,
}: EncryptInboundTapMessageArgs): Promise<string> {
  const messageData: InboundTapMessage = {
    name: displayName,
    encPk: encryptionPublicKey,
    psiPkLink: psiPublicKeysLink,
    pkId,
    x: twitterUsername,
    fc: farcasterUsername,
    tg: telegramUsername,
    bio,
    pk: signaturePublicKey,
    msg: signatureMessage,
    sig: signature,
    isSpk: isSpeaker,
    ghUserId: githubUserId,
    ghLogin: githubLogin,
  };

  const encryptedMessage = await encryptMessage(
    JUB_SIGNAL_MESSAGE_TYPE.INBOUND_TAP,
    messageData,
    senderPrivateKey,
    recipientPublicKey
  );

  return encryptedMessage;
}
