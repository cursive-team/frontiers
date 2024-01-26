import { Message } from "@/lib/client/jubSignal";
import {
  deleteFromLocalStorage,
  getFromLocalStorage,
  saveToLocalStorage,
} from ".";

export const MESSAGES_STORAGE_KEY = "messages";

// Overwrites existing messages in profile
export const writeMessages = (messages: Message[]): void => {
  saveToLocalStorage(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
};

export const getMessages = (): Message[] => {
  const messages = getFromLocalStorage(MESSAGES_STORAGE_KEY);
  if (messages) {
    return JSON.parse(messages);
  }

  return [];
};

export const deleteAllMessages = (): void => {
  deleteFromLocalStorage(MESSAGES_STORAGE_KEY);
};
