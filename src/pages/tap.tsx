import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  LocationTapResponse,
  PersonTapResponse,
  TapResponseCode,
  tapResponseSchema,
} from "./api/tap/cmac";
import LoginForm from "@/components/LoginForm";
import {
  getAuthToken,
  getKeys,
  getProfile,
  getLocationSignature,
  fetchUserByUUID,
  getUsers,
  getLocationSignatures,
} from "@/lib/client/localStorage";
import {
  encryptInboundTapMessage,
  encryptLocationTapMessage,
  encryptOutboundTapMessage,
} from "@/lib/client/jubSignal";
import { loadMessages } from "@/lib/client/jubSignalClient";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";
import { hashPublicKeyToUUID } from "@/lib/client/utils";
import { logClientEvent } from "@/lib/client/metrics";

export default function Tap() {
  const router = useRouter();
  const [pendingPersonTapResponse, setPendingPersonTapResponse] =
    useState<PersonTapResponse>();
  const [pendingLocationTapResponse, setPendingLocationTapResponse] =
    useState<LocationTapResponse>();

  // Save the newly tapped person to local storage and redirect to their profile
  // Send jubSignal message to self and other user
  const processPersonTap = useCallback(
    async (person: PersonTapResponse) => {
      const userId = await hashPublicKeyToUUID(person.encryptionPublicKey);

      const authToken = getAuthToken();
      const profile = getProfile();
      const keys = getKeys();

      if (!authToken || authToken.expiresAt < new Date() || !profile || !keys) {
        toast.error("You must be logged in to connect");
        router.push("/register");
        return;
      }

      const user = fetchUserByUUID(userId);
      if (user && user.sig) {
        toast.error("You have already met this user!");
        router.push("/users/" + userId + "?tap=true");
        return;
      }

      const senderPrivateKey = keys.encryptionPrivateKey;
      const thisUserPublicKey = profile.encryptionPublicKey;
      const otherUserPublicKey = person.encryptionPublicKey;
      const encryptedInboundMessage = await encryptInboundTapMessage({
        displayName: person.displayName,
        encryptionPublicKey: otherUserPublicKey,
        pkId: person.pkId,
        psiPublicKeysLink: person.psiPublicKeysLink,
        twitterUsername: person.twitter,
        farcasterUsername: person.farcaster,
        telegramUsername: person.telegram,
        bio: person.bio,
        signaturePublicKey: person.signaturePublicKey,
        signatureMessage: person.signatureMessage,
        signature: person.signature,
        isSpeaker: person.isUserSpeaker,
        senderPrivateKey,
        recipientPublicKey: thisUserPublicKey,
      });

      const encryptedOutboundMessage = await encryptOutboundTapMessage({
        displayName: profile.displayName,
        encryptionPublicKey: thisUserPublicKey,
        senderPrivateKey,
        recipientPublicKey: otherUserPublicKey,
      });

      // Send user tap as encrypted jubSignal message to self
      // Simultaneously send outbound tap to other user
      try {
        await loadMessages({
          forceRefresh: false,
          messageRequests: [
            {
              encryptedMessage: encryptedInboundMessage,
              recipientPublicKey: thisUserPublicKey,
            },
            {
              encryptedMessage: encryptedOutboundMessage,
              recipientPublicKey: otherUserPublicKey,
            },
          ],
        });
      } catch (error) {
        console.error("Error sending message updates to server: ", error);
        toast.error(
          "An error occured while processing the tap. Please try again."
        );
        router.push("/");
        return;
      }
      router.push("/users/" + userId + "?tap=true");
    },
    [router]
  );

  // First, record the location signature as a jubSignal message
  // Then, save the newly tapped location to local storage and redirect to their profile
  const processLocationTap = useCallback(
    async (location: LocationTapResponse) => {
      const authToken = getAuthToken();
      const profile = getProfile();
      const keys = getKeys();

      if (!authToken || authToken.expiresAt < new Date() || !profile || !keys) {
        toast.error("You must be logged in to connect");
        router.push("/register");
        return;
      }

      const locationSignature = getLocationSignature(location.id);
      if (locationSignature) {
        toast.error("You have already visited this location!");
        router.push(`/locations/${location.id}`);
        return;
      }

      const recipientPublicKey = profile.encryptionPublicKey;
      const encryptedMessage = await encryptLocationTapMessage({
        locationId: location.id,
        locationName: location.name,
        signaturePublicKey: location.signaturePublicKey,
        signatureMessage: location.signatureMessage,
        signature: location.signature,
        senderPrivateKey: keys.encryptionPrivateKey,
        recipientPublicKey,
      });

      // Send location tap as encrypted jubSignal message to self
      // Simultaneously update location signature and activity feed in local storage
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
        console.error(
          "Error sending encrypted location tap to server: ",
          error
        );
        toast.error(
          "An error occured while processing the tap. Please try again."
        );
        router.push("/");
        return;
      }

      router.push(`/locations/${location.id}?tap=true`);
    },
    [router]
  );

  useEffect(() => {
    const getMockRefUrlParam = (mockRef: string | undefined): string => {
      return mockRef ? `&mockRef=${mockRef}` : "";
    };

    const handlePersonRegistration = (chipEnc: string) => {
      const authToken = getAuthToken();
      if (authToken) {
        router.push(`/friend_not_registered`);
        return;
      }
      router.push(`/register?chipEnc=${chipEnc}`);
    };

    const handleLocationRegistration = (chipEnc: string) => {
      router.push(`/register_location?chipEnc=${chipEnc}`);
    };

    const handleSigCardLocationRegistration = (signaturePublicKey: string) => {
      router.push(`/register_location?sigPk=${signaturePublicKey}`);
    };

    const handlePersonTap = async (person: PersonTapResponse) => {
      const authToken = getAuthToken();
      if (!authToken || authToken.expiresAt < new Date()) {
        // If user is not logged in, redirect to login
        router.push("/register");
        // setPendingPersonTapResponse(person);
      } else {
        processPersonTap(person);
      }
    };

    const handleLocationTap = async (location: LocationTapResponse) => {
      const authToken = getAuthToken();
      if (!authToken || authToken.expiresAt < new Date()) {
        // If user is not logged in, redirect to login
        router.push("/register");
        // setPendingLocationTapResponse(location);
      } else {
        processLocationTap(location);
      }
    };

    // ----- HANDLE CMAC TAP -----

    if (!location.hash) {
      toast.error("Invalid tap! Please try again.");
      router.push("/");
      return;
    }

    logClientEvent("tapProcessNewTap", {});

    const urlParams = new URLSearchParams(location.hash.slice(1));
    const chipEnc = urlParams.get("e");

    if (!chipEnc) {
      toast.error("Invalid tap! Please try again.");
      router.push("/");
    }

    fetch(`/api/tap/plain?chipEnc=${chipEnc}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(async (data) => {
        const tapResponse = tapResponseSchema.validateSync(data);
        switch (tapResponse.code) {
          case TapResponseCode.CMAC_INVALID:
            throw new Error("CMAC invalid!");
          case TapResponseCode.PERSON_NOT_REGISTERED:
            logClientEvent("tapPersonNotRegistered", {});
            handlePersonRegistration(chipEnc!);
            break;
          case TapResponseCode.LOCATION_NOT_REGISTERED:
            logClientEvent("tapLocationNotRegistered", {});
            handleLocationRegistration(chipEnc!);
            break;
          case TapResponseCode.VALID_PERSON:
            logClientEvent("tapValidPerson", {});
            if (!tapResponse.person) {
              throw new Error("Person is null!");
            }
            await handlePersonTap(tapResponse.person);
            break;
          case TapResponseCode.VALID_LOCATION:
            logClientEvent("tapValidLocation", {});
            if (!tapResponse.location) {
              throw new Error("Location is null!");
            }
            await handleLocationTap(tapResponse.location);
            break;
          case TapResponseCode.CHIP_KEY_NOT_FOUND:
            throw new Error("Chip key not found!");
          default:
            throw new Error("Invalid tap response code!");
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Error! Please contact a member of the Cursive team.");
        router.push("/");
      });
  }, [router, processPersonTap, processLocationTap]);

  if (pendingPersonTapResponse) {
    const authToken = getAuthToken();

    const description = !authToken
      ? "If you haven't registered, tap your badge to take part in the experience!"
      : "";

    return (
      <LoginForm
        description={description}
        onSuccessfulLogin={() => processPersonTap(pendingPersonTapResponse)}
      />
    );
  }

  if (pendingLocationTapResponse) {
    const authToken = getAuthToken();

    const description = !authToken
      ? "If you haven't registered, tap your badge to take part in the experience!"
      : "";
    return (
      <LoginForm
        description={description}
        onSuccessfulLogin={() => processLocationTap(pendingLocationTapResponse)}
      />
    );
  }

  return (
    <div className="mx-auto my-auto">
      <Spinner />
    </div>
  );
}

Tap.getInitialProps = () => {
  return { fullPage: true };
};
