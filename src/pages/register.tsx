import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";
import { generateEncryptionKeyPair } from "@/lib/client/encryption";
import { generateSignatureKeyPair, sign } from "@/lib/shared/signature";
import { generateSalt, hashPassword } from "@/lib/client/utils";
import {
  createBackup,
  deleteAccountFromLocalStorage,
  saveAuthToken,
  saveKeys,
  saveProfile,
} from "@/lib/client/localStorage";
import { encryptBackupString } from "@/lib/shared/backup";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import { toast } from "sonner";
import { loadMessages } from "@/lib/client/jubSignalClient";
import { encryptRegisteredMessage } from "@/lib/client/jubSignal/registered";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { startRegistration } from "@simplewebauthn/browser";
import {
  farcasterUsernameRegex,
  telegramUsernameRegex,
  twitterUsernameRegex,
} from "@/lib/shared/utils";
import { supabase } from "@/lib/client/realtime";
import { generatePSIKeys, psiBlobUploadClient } from "@/lib/client/psi";
import { classed } from "@tw-classed/react";
import { Card } from "@/components/cards/Card";
import { Spinner } from "@/components/Spinner";
import Link from "next/link";
import { logClientEvent } from "@/lib/client/metrics";
import { useSession, signIn, signOut } from "next-auth/react";
import { AppHeaderLogo } from "@/components/AppHeader";
import { Icon } from "@mui/material";
import { Icons } from "@/components/Icons";
import { AppLink } from "@/components/AppLink";
import { AppContent } from "@/components/AppContent";

enum DisplayState {
  GITHUB,
  USER_INFO,
  PASSKEY,
  PASSWORD,
  CREATING,
}

const Title = classed.h3("font-medium text-primary text-base text-center");
const Description = classed.div(
  Card.Base,
  "p-2 text-sm font-normal text-white/75 font-inter !border-none  !rounded-[8px]"
);
const Underline = classed.span("text-primary");
export default function Register() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [displayState, setDisplayState] = useState<DisplayState>(
    DisplayState.GITHUB
  );
  const [displayName, setDisplayName] = useState<string>();
  const [twitter, setTwitter] = useState<string>("@");
  const [farcaster, setFarcaster] = useState<string>("@");
  const [telegram, setTelegram] = useState<string>("@");
  const [bio, setBio] = useState<string>();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [chipEnc, setChipEnc] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [isAccountReady, setIsAccountReady] = useState(false);

  useEffect(() => {
    if (router.query.chipEnc) {
      setChipEnc(router.query.chipEnc as string);
    }
  }, [router.query]);

  useEffect(() => {
    const handleGithubLogin = async () => {
      if (status === "authenticated") {
        const githubIsUnique = await checkGithubIsUnique();
        if (!githubIsUnique) {
          toast.error("Github account is already registered.");
          await signOut();
          return;
        }

        setDisplayState(DisplayState.USER_INFO);
      }
    };
    handleGithubLogin();
  }, [status]);

  useEffect(() => {
    if (displayState === DisplayState.USER_INFO) {
      if (session && (session as any).githubLogin) {
        setDisplayName((session as any).githubLogin);
      }
    }
  }, [displayState, session]);

  const checkGithubIsUnique = async (): Promise<boolean> => {
    const response = await fetch(`/api/register/check_github`);
    if (!response.ok) {
      console.error(
        `HTTP error when checking github uniqueness! status: ${response.status}`
      );
      return false;
    }

    const data = await response.json();

    return data.isUnique;
  };

  const checkUsernameIsUnique = async (
    displayName: string
  ): Promise<boolean> => {
    const response = await fetch(
      `/api/register/check_username?displayName=${displayName}`
    );
    if (!response.ok) {
      console.error(
        `HTTP error when checking username uniqueness! status: ${response.status}`
      );
      return false;
    }

    const data = await response.json();

    return data.isUnique;
  };

  const handleSubmitUserInfo = async (e: FormEvent<Element>) => {
    e.preventDefault();

    logClientEvent("registerAttemptUserInfo", {});

    if (
      !displayName ||
      /^\s|\s$/.test(displayName) ||
      displayName.length > 20
    ) {
      toast.error(
        "Display name cannot have leading or trailing whitespace and must be 20 characters or less"
      );
      return;
    }

    if (twitter !== "@" && !twitterUsernameRegex.test(twitter)) {
      toast.error("Please enter a valid Twitter username.");
      return;
    }

    if (farcaster !== "@" && !farcasterUsernameRegex.test(farcaster)) {
      toast.error("Please enter a valid Farcaster username.");
    }

    if (telegram !== "@" && !telegramUsernameRegex.test(telegram)) {
      toast.error("Please enter a valid Telegram username.");
      return;
    }

    if (bio && bio.length > 200) {
      toast.error("Bio must be 200 characters or less.");
      return;
    }

    const isUsernameUnique = await checkUsernameIsUnique(displayName);
    if (!isUsernameUnique) {
      toast.error("Display name is already taken.");
      return;
    }

    logClientEvent("registerSuccessUserInfo", {});

    setDisplayState(DisplayState.PASSKEY);
  };

  const handleCreateWithPassword = async () => {
    logClientEvent("registerAttemptCreateWithPassword", {});

    if (!displayName) {
      toast.error("Error creating account. Please try again");
      return;
    }

    const isUsernameUnique = await checkUsernameIsUnique(displayName);
    if (!isUsernameUnique) {
      toast.error("Display name is already taken.");
      return;
    }

    logClientEvent("registerSuccessCreateWithPassword", {});

    setDisplayState(DisplayState.PASSWORD);
  };

  const handleCreateWithPasskey = () => {
    logClientEvent("registerSuccessCreateWithPasskey", {});

    setDisplayState(DisplayState.PASSKEY);
  };

  const handleSubmitWithPasskey = async (e: FormEvent<Element>) => {
    e.preventDefault();

    logClientEvent("registerAttemptSubmitWithPasskey", {});

    if (!displayName) {
      toast.error("Error creating account. Please try again");
      return;
    }

    setLoading(true);

    const isUsernameUnique = await checkUsernameIsUnique(displayName);
    if (!isUsernameUnique) {
      toast.error("Display name is already taken.");
      return;
    }

    const registrationOptions = await generateRegistrationOptions({
      rpName: "sig-sing-workshop",
      rpID: window.location.hostname,
      userID: displayName,
      userName: displayName,
      attestationType: "none",
    });

    try {
      const { id, response: authResponse } = await startRegistration(
        registrationOptions
      );
      const authPublicKey = authResponse.publicKey;
      if (!authPublicKey) {
        throw new Error("No public key returned from authenticator");
      }

      logClientEvent("registerSuccessSubmitWithPasskey", {});

      await createAccount(displayName, id, authPublicKey);
    } catch (error) {
      console.error("Error creating account: ", error);
      toast.error("Authentication failed! Please try again.");
      setLoading(false);
      return;
    }
  };

  const handleSubmitWithPassword = async (e: FormEvent<Element>) => {
    e.preventDefault();

    if (!displayName || !password) {
      toast.error("Please enter a display name and password.");
      return;
    }

    if (password.length < 5) {
      toast.error("Password must be at least 5 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    logClientEvent("registerSuccessSubmitWithPassword", {});

    setLoading(true);

    await createAccount(displayName, password, undefined);
  };

  const createAccount = async (
    displayName: string,
    password: string,
    authPublicKey: string | undefined
  ) => {
    setLoading(true);
    const prevDisplayState = displayState;
    setDisplayState(DisplayState.CREATING); // Show the loading spinner

    if (!session) {
      toast.error("Error creating account! Please try again.");
      setLoading(false);
      setDisplayState(prevDisplayState);
      return;
    }
    const githubUserId = (session as any).githubUserId;
    const githubLogin = (session as any).githubLogin;
    if (!githubUserId || !githubLogin) {
      toast.error("Error creating account! Please try again.");
      setLoading(false);
      setDisplayState(prevDisplayState);
      return;
    }

    const { privateKey, publicKey } = await generateEncryptionKeyPair();
    const { psiPrivateKeys, psiPublicKeys } = await generatePSIKeys();
    const {
      signingKey: signaturePrivateKey,
      verifyingKey: signaturePublicKey,
    } = generateSignatureKeyPair();

    // upload psi keys to blob
    const psiPublicKeysLink = await psiBlobUploadClient(
      "psiPublicKeys",
      JSON.stringify(psiPublicKeys)
    );

    // set up realtime account
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously();
    if (!authData) {
      console.error("Error with realtime auth.", authError);
      toast.error("Error with PSI account setup.");
      setLoading(false);
      setDisplayState(prevDisplayState);
      return;
    }

    let passwordSalt, passwordHash;
    passwordSalt = generateSalt();
    passwordHash = await hashPassword(password, passwordSalt);

    const response = await fetch("/api/register/create_account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chipEnc,
        displayName,
        encryptionPublicKey: publicKey,
        signaturePublicKey,
        signaturePrivateKey,
        psiPublicKeysLink,
        passwordSalt,
        passwordHash,
        authPublicKey,
        twitter,
        farcaster,
        telegram,
        bio,
      }),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      toast.error("Error creating account! Please try again.");
      setLoading(false);
      setDisplayState(prevDisplayState);
      return;
    }

    const data = await response.json();
    const { authToken, signingKey, verifyingKey } = data;
    if (!authToken || !authToken.value || !authToken.expiresAt) {
      console.error("Account created, but no auth token returned.");
      toast.error("Account created, but error logging in! Please try again.");
      setLoading(false);
      return;
    }

    if (!signingKey || !verifyingKey) {
      console.error("Account created, but no keys returned.");
      toast.error(
        "Error generating keys. Please talk to a member of the Cursive team."
      );
      setLoading(false);
      setDisplayState(prevDisplayState);
      return;
    }

    // Ensure the user is logged out of an existing session before creating a new account
    deleteAccountFromLocalStorage();
    saveKeys({
      encryptionPrivateKey: privateKey,
      signaturePrivateKey: signingKey,
      psiPrivateKeys,
      psiPublicKeysLink,
    });
    saveProfile({
      displayName,
      encryptionPublicKey: publicKey,
      signaturePublicKey: verifyingKey,
      twitterUsername: twitter,
      farcasterUsername: farcaster,
      telegramUsername: telegram,
      bio,
      githubUserId,
      githubLogin,
    });
    saveAuthToken({
      value: authToken.value,
      expiresAt: new Date(authToken.expiresAt),
    });

    let backupData = createBackup();
    if (!backupData) {
      console.error("Error creating backup!");
      toast.error("Error creating backup! Please try again.");
      setLoading(false);
      setDisplayState(prevDisplayState);
      return;
    }

    const backup = encryptBackupString(backupData, displayName, password);

    const backupResponse = await fetch("/api/backup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        backup,
        authToken: authToken.value,
      }),
    });

    if (!backupResponse.ok) {
      console.error(`HTTP error! status: ${backupResponse.status}`);
      toast.error("Error storing backup! Please try again.");
      setLoading(false);
      return;
    }

    // Send a jubSignal message to self to store the signature
    const dataToSign = uuidv4().replace(/-/g, ""); // For now, we just sign a random uuid as a hex string
    const signature = sign(signingKey, dataToSign);
    const recipientPublicKey = publicKey;
    const encryptedMessage = await encryptRegisteredMessage({
      signaturePublicKey: verifyingKey,
      signatureMessage: dataToSign,
      signature,
      senderPrivateKey: privateKey,
      recipientPublicKey,
    });
    try {
      await loadMessages({
        forceRefresh: false,
        messageRequests: [
          {
            encryptedMessage,
            recipientPublicKey,
          },
        ],
      });
    } catch (error) {
      console.error("Error sending registration tap to server: ", error);
      toast.error("An error occured while registering.");
      setLoading(false);
      return;
    }

    setIsAccountReady(true);
    setLoading(false);
  };

  const StateContent: Record<DisplayState, JSX.Element> = {
    [DisplayState.GITHUB]: (
      <div className="grid grid-rows-[1fr_auto] h-full">
        <div className="flex flex-col  justify-center">
          <span className="text-center text-base leading-6 text-white/75 font-inter px-10">
            Tap NFC badges to share socials, make ZK proofs about your Frontiers
            experience, and privately match on job opportunities using MPC.
          </span>
        </div>
        <div className="flex flex-col gap-4 mt-auto pb-4">
          <Button
            icon={<Icons.Github className="mr-2" />}
            variant="black"
            onClick={() => signIn("github")}
          >
            {status === "loading" ? "Signing in..." : "Sign In With Github"}
          </Button>
        </div>
      </div>
    ),
    [DisplayState.USER_INFO]: (
      <FormStepLayout
        description={
          <span className="pb-4 block">
            What do you want others to see when they tap your badge?
          </span>
        }
        className="pt-4"
        footer={
          <div className="flex flex-col gap-2 mt-auto">
            <Button variant="black" type="submit" loading={loading}>
              Next
            </Button>
            <div className="text-center">
              <span
                className="text-center font-inter text-sm text-white/50"
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
        onSubmit={handleSubmitUserInfo}
      >
        <Input
          type="text"
          id="displayName"
          label="Display name (*)"
          placeholder="Name others will see upon tap"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Input
          type="text"
          id="twitter"
          label="Twitter"
          placeholder="@username"
          value={twitter}
          onChange={(e) =>
            setTwitter(
              e.target.value.charAt(0) === "@"
                ? e.target.value
                : "@" + e.target.value
            )
          }
        />
        <Input
          type="text"
          id="farcaster"
          label="Farcaster"
          placeholder="@username"
          value={farcaster}
          onChange={(e) =>
            setFarcaster(
              e.target.value.charAt(0) === "@"
                ? e.target.value
                : "@" + e.target.value
            )
          }
        />
        <Input
          type="text"
          id="telegram"
          label="Telegram"
          placeholder="@username"
          value={telegram}
          onChange={(e) =>
            setTelegram(
              e.target.value.charAt(0) === "@"
                ? e.target.value
                : "@" + e.target.value
            )
          }
        />
        <Input
          type="text"
          id="bio"
          label="Bio"
          placeholder="Your organization, website, other info"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </FormStepLayout>
    ),
    [DisplayState.PASSKEY]: (
      <FormStepLayout
        description="You can choose to backup your information with a password or a passkey, which will generate an encryption key for your data."
        className="pt-4"
        onSubmit={handleSubmitWithPasskey}
        footer={
          <div className="flex flex-col gap-4">
            <Button variant="black" onClick={handleCreateWithPassword}>
              Backup with password
            </Button>
            <span className="h-6 relative font-normal text-sm text-white font-inter text-center">
              <div className="after:content-[''] after:top-[12px] after:absolute after:h-[1px] after:bg-white/40 after:w-full after:left-0"></div>
              <div className="absolute right-1/2 translate-x-3 bg-black px-2 z-10">
                or
              </div>
            </span>
            <Button variant="black" type="submit" loading={loading}>
              Backup with passkey
            </Button>
          </div>
        }
      ></FormStepLayout>
    ),
    [DisplayState.PASSWORD]: (
      <FormStepLayout
        subtitle={
          <span className="pb-4 block">
            Choose a master password to maintain an encrypted backup your data.
          </span>
        }
        className="pt-4"
        onSubmit={handleSubmitWithPassword}
        footer={
          <div className="flex flex-col gap-4">
            <Button variant="black" type="submit" loading={loading}>
              Register
            </Button>
            <span
              className="text-center text-white/50 text-sm"
              onClick={handleCreateWithPasskey}
            >
              <u>Backup with passkey instead</u>
            </span>
          </div>
        }
      >
        <Input
          type="password"
          id="password"
          label="Master password"
          placeholder=""
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          id="confirmPassword"
          label="Confirm master password"
          placeholder=""
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </FormStepLayout>
    ),
    [DisplayState.CREATING]: (
      <div className="h-full flex flex-col pt-4 pb-8 ">
        <div className="flex flex-col my-auto justify-center">
          <Title>
            <div className="flex items-center justify-center m-4 gap-2 text-white font-bold">
              {isAccountReady ? "Account created!" : "Creating account"}
              {!isAccountReady && (
                <Spinner size={20} className="!text-primary" />
              )}
            </div>
          </Title>
          <div className="flex flex-col gap-2 m-4">
            <Description>
              <span>
                Tap other people{"'"}s NFC badges to connect and{" "}
                <Underline>receive socials</Underline>.
              </span>
            </Description>
            <Description>
              <span>
                Each tap produces a <Underline>unique signature</Underline>,
                privately digitizing an in-person interaction.
              </span>
            </Description>
            <Description>
              <span>
                Make <Underline>ZK proofs</Underline> about the people you{"'"}
                ve met using your collected sigs.
              </span>
            </Description>
            <Description>
              <span>
                {" "}
                Use MPC to <Underline> discover common contacts</Underline> and
                to <Underline>query your social graph.</Underline>
              </span>
            </Description>
          </div>
        </div>
        {isAccountReady && (
          <Link href="/">
            <Button variant="black" className="mt-auto">
              Enter the app!
            </Button>
          </Link>
        )}
      </div>
    ),
  };

  return (
    <div className="flex flex-col grow pb-4">
      <AppHeaderLogo className="mx-auto py-5" />

      <AppContent className="flex flex-col h-full">
        {StateContent?.[displayState]}
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

Register.getInitialProps = () => {
  return { fullPage: true };
};
