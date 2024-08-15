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
import { AppHeaderLogo } from "@/components/AppHeader";
import { AppLink } from "@/components/AppLink";
import { AppContent } from "@/components/AppContent";

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
      farcasterUsername,
      telegramUsername,
      bio,
      githubUserId,
      githubLogin,
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
        farcasterUsername,
        telegramUsername,
        bio,
        githubUserId,
        githubLogin,
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

  const LoginStateContentMapping: Record<DisplayState, any> = {
    [DisplayState.GITHUB]: (
      <div className="grid grid-rows-[1fr_auto] h-full">
        <div className="flex flex-col  justify-center">
          <span className="text-center text-base leading-6 text-white/75 font-inter px-10">
            Tap NFC badges to share socials, make ZK proofs about your Frontiers
            experience, and privately match on job opportunities using MPC.
          </span>
        </div>
        <div className="mt-auto mb-4">
          <Button variant="black" onClick={() => signIn("github")}>
            Login with GitHub
          </Button>
        </div>
      </div>
    ),
    [DisplayState.PASSKEY]: (
      <FormStepLayout
        className="pt-4"
        onSubmit={handleSubmitWithPasskey}
        footer={
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-4">
              <Button variant="black" type="submit">
                {loading ? "Logging in..." : "Restore backup with passkey"}
              </Button>
              <span className="h-6 relative font-normal text-sm text-white font-inter text-center">
                <div className="after:content-[''] after:top-[12px] after:absolute after:h-[1px] after:bg-white/40 after:w-full after:left-0"></div>
                <div className="absolute right-1/2 translate-x-3 bg-black px-2 z-10">
                  or
                </div>
              </span>
              <Button
                variant="black"
                onClick={(e) => {
                  e.preventDefault();
                  handlePasswordLogin();
                }}
              >
                Restore backup with password
              </Button>
            </div>

            <div className="text-center">
              <span
                className="text-center text-white/50 text-sm"
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
              >
                <u>Change Github Account</u>
              </span>
            </div>
          </div>
        }
      >
        <Input
          type="text"
          id="displayName"
          label="Display name"
          placeholder="Name you registered with"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={true}
        />
      </FormStepLayout>
    ),
    [DisplayState.PASSWORD]: (
      <FormStepLayout
        subtitle={
          <span className="block pb-4">
            {`Login to view your social graph and event activity, or tap your
            card if you haven't registered.`}
          </span>
        }
        className="pt-4"
        onSubmit={handleSubmitWithPassword}
        footer={
          <div className="flex flex-col gap-4">
            <Button variant="black" type="submit">
              {loading ? "Restoring backup..." : "Restore backup"}
            </Button>
            <span className="h-6 relative font-normal text-sm text-white font-inter text-center">
              <div className="after:content-[''] after:top-[12px] after:absolute after:h-[1px] after:bg-white/40 after:w-full after:left-0"></div>
              <div className="absolute right-1/2 translate-x-3 bg-black px-2 z-10">
                or
              </div>
            </span>
            <Button variant="black" onClick={handlePasskeyLogin}>
              Restore backup with passkey instead
            </Button>
          </div>
        }
      >
        <Input
          type="text"
          id="displayName"
          label="Display name"
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
      </FormStepLayout>
    ),
  };

  return (
    <div className="flex flex-col grow pb-4">
      <AppHeaderLogo className="mx-auto py-5" />
      <AppContent className="flex flex-col h-full">
        {LoginStateContentMapping?.[displayState]}
        <span className="text-xs text-white/50 text-center mt-auto font-inter ">
          App built by{" "}
          <AppLink
            href="https://cursive.team/"
            className="text-primary underline"
          >
            Cursive
          </AppLink>{" "}
          for Paradigm Frontiers.
        </span>
      </AppContent>
    </div>
  );
}

Login.getInitialProps = () => {
  return { fullPage: true };
};
