import {
  AuthToken,
  deleteAccountFromLocalStorage,
  loadBackup,
  saveAuthToken,
} from "@/lib/client/localStorage";
import { toast } from "sonner";
import { loadMessages } from "@/lib/client/jubSignalClient";
import { useRouter } from "next/router";
import { useStateMachine } from "little-state-machine";
import updateStateFromAction from "@/lib/shared/updateAction";
import { signOut } from "next-auth/react";

interface CompleteLoginProps {
  backup: string;
  token?: AuthToken;
}

export const useCompleteLogin = ({
  onSuccessfulLogin: onSuccessfulLoginHandler,
}: {
  onSuccessfulLogin?: () => void;
}) => {
  const router = useRouter();

  const { getState } = useStateMachine({ updateStateFromAction });
  // This function is called once a backup is loaded
  // It fetches the user's jubSignal messages, populates localStorage,
  // saves the auth token, and calls the onSuccessfulLogin callback
  const completeLogin = async ({ backup, token }: CompleteLoginProps) => {
    const savedAuthToken: AuthToken = getState()?.login?.authToken as AuthToken;

    const authToken = savedAuthToken || token;

    if (!authToken) {
      console.error("No auth token found");
      toast.error("Error logging in. Please try again.");
      return;
    }

    // Populate localStorage with auth and backup data to load messages
    saveAuthToken(authToken!);
    loadBackup(backup);

    try {
      await loadMessages({ forceRefresh: true });
    } catch (error) {
      deleteAccountFromLocalStorage(); // Clear localStorage if login fails
      await signOut();
      toast.error("Error logging in. Please try again.");
      return;
    }

    // Login is successful
    onSuccessfulLoginHandler?.();
    router.push("/"); // redirect to home page when login is successful
  };

  return {
    completeLogin,
  };
};
