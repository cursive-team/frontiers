import { object, string } from "yup";
import {
  deleteFromLocalStorage,
  getFromLocalStorage,
  saveToLocalStorage,
} from ".";

export const PROFILE_STORAGE_KEY = "profile";

export type Profile = {
  displayName: string;
  encryptionPublicKey: string;
  signaturePublicKey: string;
  twitterUsername?: string;
  farcasterUsername?: string;
  telegramUsername?: string;
  bio?: string;
  githubUserId: string;
  githubLogin: string;
};

export const profileSchema = object({
  displayName: string().required(),
  encryptionPublicKey: string().required(),
  signaturePublicKey: string().required(),
  twitterUsername: string().optional().default(undefined),
  farcasterUsername: string().optional().default(undefined),
  telegramUsername: string().optional().default(undefined),
  bio: string().optional().default(undefined),
  githubUserId: string().required(),
  githubLogin: string().required(),
});

export const saveProfile = (profile: Profile): void => {
  saveToLocalStorage(PROFILE_STORAGE_KEY, JSON.stringify(profile));
};

export const getProfile = (): Profile | undefined => {
  const profile = getFromLocalStorage(PROFILE_STORAGE_KEY);
  if (profile) {
    return JSON.parse(profile);
  }

  return undefined;
};

export const deleteProfile = (): void => {
  deleteFromLocalStorage(PROFILE_STORAGE_KEY);
};
