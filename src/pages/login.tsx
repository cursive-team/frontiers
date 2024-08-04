import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import { hashPassword } from "@/lib/client/utils";
import {
  deleteAccountFromLocalStorage,
  getProfile,
  loadBackup,
  saveAuthToken,
  saveProfile,
} from "@/lib/client/localStorage";
import { decryptBackupString } from "@/lib/shared/backup";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import { toast } from "sonner";
import { loadMessages } from "@/lib/client/jubSignalClient";
import { supabase } from "@/lib/client/realtime";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { startAuthentication } from "@simplewebauthn/browser";
import { signIn, signOut, useSession } from "next-auth/react";

enum DisplayState {
  GITHUB,
  PASSKEY,
  PASSWORD,
}

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [displayState, setDisplayState] = useState<DisplayState>(
    DisplayState.GITHUB
  );
  const [displayName, setDisplayName] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleGithubLogin = async () => {
      if (status === "authenticated") {
        const existingDisplayName = await getExistingUserDisplayName();
        if (!existingDisplayName) {
          toast.error("This GitHub account is not registered.");
          await signOut();
          window.location.href = "/";
          return;
        }

        setDisplayName(existingDisplayName);
        setDisplayState(DisplayState.PASSKEY);
      }
    };
    handleGithubLogin();
  }, [status]);

  const getExistingUserDisplayName = async (): Promise<string | undefined> => {
    const response = await fetch(`/api/login/get_username`);
    if (!response.ok) {
      console.error(
        `HTTP error when getting user display name! status: ${response.status}`
      );
      return undefined;
    }

    const data = await response.json();

    return data.displayName;
  };

  const handlePasswordLogin = () => {
    setDisplayState(DisplayState.PASSWORD);
  };

  const handlePasskeyLogin = () => {
    setDisplayState(DisplayState.PASSKEY);
  };

  const handleSubmitWithPasskey = async (e: FormEvent<Element>) => {
    e.preventDefault();

    if (!displayName) {
      toast.error("Please enter your display name.");
      return;
    }

    setLoading(true);

    const authenticationOptions = await generateAuthenticationOptions({
      rpID: window.location.hostname,
    });

    let id;
    try {
      const { id: authId } = await startAuthentication(authenticationOptions);
      id = authId;
    } catch (error) {
      console.error("Error logging in: ", error);
      toast.error("Authentication failed! Please try again.");
      setLoading(false);
      return;
    }

    await login(displayName, id);
  };

  const handleSubmitWithPassword = async (e: FormEvent<Element>) => {
    e.preventDefault();

    setLoading(true);

    if (!displayName || !password) {
      toast.error("Please enter your username and password");
      setLoading(false);
      return;
    }

    await login(displayName, password);
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      console.error("Error logging in");
      toast.error("Error logging in. Please try again.");
      setLoading(false);
      return;
    }

    const {
      authToken,
      backup,
      password: passwordData,
      twitterUsername,
      telegramUsername,
      bio,
    } = await response.json();
    if (!authToken) {
      console.error("No auth token found");
      toast.error("Error logging in. Please try again.");
      setLoading(false);
      return;
    }

    const { salt, hash } = passwordData;
    const derivedPasswordHash = await hashPassword(password, salt);
    if (derivedPasswordHash !== hash) {
      toast.error("Incorrect password");
      setLoading(false);
      return;
    }

    const { encryptedData, authenticationTag, iv } = backup;
    const decryptedBackupData = decryptBackupString(
      encryptedData,
      authenticationTag,
      iv,
      username,
      password
    );

    // Populate localStorage with auth and backup data to load messages
    saveAuthToken(authToken);
    loadBackup(decryptedBackupData);

    const profile = getProfile();
    if (!profile) {
      console.error("Profile not found");
      deleteAccountFromLocalStorage();
      await signOut();
      toast.error("Error logging in. Please try again.");
      setLoading(false);
      return;
    } else {
      saveProfile({
        ...profile,
        twitterUsername,
        telegramUsername,
        bio,
      });
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously();
    if (!authData) {
      console.error("Error with realtime auth.", authError);
      toast.error("Error with PSI account setup.");
      setLoading(false);
      return;
    }

    try {
      await loadMessages({ forceRefresh: true });
    } catch (error) {
      deleteAccountFromLocalStorage();
      await signOut();
      toast.error("Error logging in. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/");
  };

  if (displayState === DisplayState.GITHUB) {
    return (
      <Button variant="primary" onClick={() => signIn("github")}>
        Login with GitHub
      </Button>
    );
  } else if (displayState === DisplayState.PASSKEY) {
    return (
      <FormStepLayout
        title="Backpocket Alpha"
        subtitle="Login to view your social graph and make queries."
        className="pt-4"
        onSubmit={handleSubmitWithPasskey}
      >
        <Input
          type="text"
          id="displayName"
          label="Github account"
          placeholder="Name you registered with"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={true}
        />
        <Button type="submit">
          {loading ? "Logging in..." : "Login with passkey"}
        </Button>
        <Button
          variant="transparent"
          onClick={(e) => {
            e.preventDefault();
            handlePasswordLogin();
          }}
        >
          Login with password instead
        </Button>
        <div className="text-center">
          <span
            className="text-center text-sm"
            onClick={async () => {
              await signOut();
              window.location.reload();
            }}
          >
            <u>Change Github Account</u>
          </span>
        </div>
      </FormStepLayout>
    );
  } else if (displayState === DisplayState.PASSWORD) {
    return (
      <FormStepLayout
        title="Backpocket Alpha"
        subtitle="Login to view your social graph and event activity, or tap your card if you haven’t registered."
        className="pt-4"
        onSubmit={handleSubmitWithPassword}
      >
        <Input
          type="text"
          id="displayName"
          label="Github account"
          placeholder="Name you registered with"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={true}
        />
        <Input
          type="password"
          id="password"
          label="Password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit">{loading ? "Logging in..." : "Login"}</Button>
        <Button variant="transparent" onClick={handlePasskeyLogin}>
          Login with passkey instead
        </Button>
      </FormStepLayout>
    );
  }
}

Login.getInitialProps = () => {
  return { fullPage: true };
};
