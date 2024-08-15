import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  fetchUserByUUID,
  getKeys,
  getLocationSignatures,
  getProfile,
  getUsers,
  User,
} from "@/lib/client/localStorage";
import { AppBackHeader, AppHeaderLogo } from "@/components/AppHeader";
import { Card } from "@/components/cards/Card";
import Link from "next/link";
import { classed } from "@tw-classed/react";
import { labelStartWith, removeLabelStartWith } from "@/lib/shared/utils";
import { InputWrapper } from "@/components/input/InputWrapper";
import { ArtworkSnapshot } from "@/components/artwork/ArtworkSnapshot";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/client/realtime";
import { toast } from "sonner";
import { generateSelfBitVector, psiBlobUploadClient } from "@/lib/client/psi";
import init, { round1_js, round2_js, round3_js } from "@/lib/mp_psi/mp_psi";
import { encryptOverlapComputedMessage } from "@/lib/client/jubSignal/overlapComputed";
import { loadMessages } from "@/lib/client/jubSignalClient";
import { CircleCard } from "@/components/cards/CircleCard";
import { IconCircle } from "@/components/IconCircle";
import { ProfilePicModal } from "@/components/modals/ProfilePicModal";
import useSettings from "@/hooks/useSettings";
import { Accordion } from "@/components/Accordion";
import { handleUsername } from "@/lib/client/utils";
import { Icons } from "@/components/Icons";
import { logClientEvent } from "@/lib/client/metrics";
import { useSession } from "next-auth/react";
import { Icon } from "@mui/material";
import { AppContent } from "@/components/AppContent";
import { Spinner } from "@/components/Spinner";
import githubData from "@/lib/client/github.json";
import { Stats } from "@/components/Stats";

const Label = classed.span("text-sm text-gray-12");

interface LinkCardProps {
  label?: string;
  href: string;
  value?: string;
}

const LinkCard = ({ label, value, href }: LinkCardProps) => {
  return (
    <Link href={href} target="_blank">
      <div className="grid items-center grid-cols-[auto_1fr_auto] gap-1">
        <span className="text-sm text-white/50 font-inter font-normal leading-6">
          {label}
        </span>
        <div className="h-[1px] bg-white/20 w-full"></div>
        <span className="text-right">{handleUsername(value) ?? "N/A"}</span>
      </div>
    </Link>
  );
};

enum PSIState {
  NOT_STARTED,
  ROUND1,
  ROUND2,
  ROUND3,
  JUBSIGNAL,
  COMPLETE,
}

const PSIStateMapping: Record<PSIState, string> = {
  [PSIState.NOT_STARTED]: "Not started",
  [PSIState.ROUND1]: "Creating collective encryption pubkey with 2PC...",
  [PSIState.ROUND2]: "Performing PSI with FHE...",
  [PSIState.ROUND3]: "Decrypting encrypted results with 2PC...",
  [PSIState.JUBSIGNAL]: "Creating encrypted backup of overlap...",
  [PSIState.COMPLETE]: "Complete",
};

type RepoContributionData = {
  repo: string;
  first: Date;
  total: number;
  rank: number;
};

const UserProfilePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<User>();
  const alreadyConnected = router?.query?.alreadyConnected === "true";
  const [showProfilePicModal, setShowProfilePicModal] =
    useState<boolean>(false);
  const { pageWidth } = useSettings();

  const [selfEncPk, setSelfEncPk] = useState<string>();
  const [otherEncPk, setOtherEncPk] = useState<string>();
  const [channelName, setChannelName] = useState<string>();
  const [broadcastEvent, setBroadcastEvent] = useState<any>();

  const [psiState, setPsiState] = useState<PSIState>(PSIState.NOT_STARTED);
  const [selfRound1Output, setSelfRound1Output] = useState<any>();
  const [otherRound2MessageLink, setOtherRound2MessageLink] =
    useState<string>();
  const [selfRound2Output, setSelfRound2Output] = useState<any>();
  const [round2Order, setRound2Order] = useState<boolean>();
  const [otherRound3MessageLink, setOtherRound3MessageLink] =
    useState<string>();
  const [selfRound3Output, setSelfRound3Output] = useState<any>();

  const [wantsToInitiatePSI, setWantsToInitiatePSI] = useState(false);
  const [otherUserWantsToInitiatePSI, setOtherUserWantsToInitiatePSI] =
    useState(false);
  const [currentUserInChannel, setCurrentUserInChannel] = useState(false);
  const [otherUserInChannel, setOtherUserInChannel] = useState(false);
  const [otherUserTemporarilyLeft, setOtherUserTemporarilyLeft] =
    useState(false);

  const [userOverlap, setUserOverlap] = useState<
    { userId: string; name: string }[]
  >([]);
  const [locationOverlap, setLocationOverlap] = useState<
    { locationId: string; name: string }[]
  >([]);

  const { data: githubSession } = useSession();
  const [userGithubInfo, setUserGithubInfo] =
    useState<RepoContributionData[]>();
  const [githubInfoLoading, setGithubInfoLoading] = useState<boolean>(false);
  const [userTalkInfo, setUserTalkInfo] = useState<
    { talkName: string; talkId: string }[]
  >([]);

  // set up channel for PSI
  const setupChannel = () => {
    if (!selfEncPk || !otherEncPk || !channelName) return;
    logClientEvent("psiSetupChannel", {});

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: selfEncPk },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setCurrentUserInChannel(true);
        const newState = channel.presenceState();
        if (Object.keys(newState).includes(otherEncPk)) {
          console.log("Other user in channel ", otherEncPk);
          setOtherUserInChannel(true);
          setOtherUserTemporarilyLeft(false);
        }
      })
      .on("presence", { event: "leave" }, async ({ key }) => {
        if (key === otherEncPk) {
          console.log("Other user left channel ", otherEncPk);
          setOtherUserTemporarilyLeft(true);
          setOtherUserInChannel(false);
        } else {
          setCurrentUserInChannel(false);
        }
      })
      .on("broadcast", { event: "initiatePSI" }, async (event) => {
        console.log(
          "Received initiate PSI from ",
          otherEncPk,
          psiState,
          wantsToInitiatePSI,
          otherUserWantsToInitiatePSI
        );
        setPsiState((prevState) => {
          console.log(
            "Current psi state when receiving initiatePSI",
            prevState,
            wantsToInitiatePSI,
            otherUserWantsToInitiatePSI
          );
          if (wantsToInitiatePSI) {
            console.log(
              "Starting psi after other user responded with initiatePSI",
              otherEncPk
            );
            // reset psi initation and start psi
            setWantsToInitiatePSI(false);
            setOtherUserWantsToInitiatePSI(false);
            return PSIState.ROUND1;
          } else {
            console.log("Other user wants to initiate psi", otherEncPk);
            setOtherUserWantsToInitiatePSI(true);
            return prevState;
          }
        });
      })
      .on("broadcast", { event: "message" }, (event) => {
        setBroadcastEvent(event);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user: selfEncPk,
          });
        }
      });
  };

  const closeChannel = async () => {
    if (!channelName) return;
    await supabase.removeChannel(supabase.channel(channelName));
  };

  const processOverlap = (overlap: number[]) => {
    const users = getUsers();
    const locations = getLocationSignatures();
    let locationOverlapIds = [];
    let userOverlapIds = [];

    for (let i = 0; i < overlap.length; i++) {
      if (overlap[i] >= 1000) {
        continue;
      } else if (overlap[i] > 500) {
        const locationId = (overlap[i] - 500).toString();
        locationOverlapIds.push({
          locationId,
          name: locations[locationId].name,
        });
      } else {
        for (const userId in users) {
          if (parseInt(users[userId].pkId) === overlap[i]) {
            userOverlapIds.push({
              userId,
              name: users[userId].name,
            });
          }
        }
      }
    }
    // console.log(userOverlapIds);
    setUserOverlap(userOverlapIds);
    setLocationOverlap(locationOverlapIds);
  };

  // process broadcast events
  useEffect(() => {
    if (!broadcastEvent) return;

    console.log(broadcastEvent);

    const { payload } = broadcastEvent;
    if (payload.state === PSIState.ROUND2 && payload.to === selfEncPk) {
      setOtherRound2MessageLink(payload.data);
      setRound2Order(parseInt(payload.otherPkId) > parseInt(user?.pkId!));
    } else if (payload.state === PSIState.ROUND3 && payload.to === selfEncPk) {
      setOtherRound3MessageLink(payload.data);
    }
  }, [broadcastEvent, user?.pkId, selfEncPk]);

  // process state changes
  useEffect(() => {
    if (
      selfRound1Output &&
      otherRound2MessageLink &&
      round2Order !== undefined &&
      psiState === PSIState.ROUND1
    ) {
      setPsiState(PSIState.ROUND2);
    } else if (
      selfRound2Output &&
      otherRound3MessageLink &&
      psiState === PSIState.ROUND2
    ) {
      setPsiState(PSIState.ROUND3);
    } else if (selfRound3Output && psiState === PSIState.ROUND3) {
      setPsiState(PSIState.JUBSIGNAL);
    }
  }, [
    psiState,
    selfRound1Output,
    otherRound2MessageLink,
    round2Order,
    selfRound2Output,
    otherRound3MessageLink,
    selfRound3Output,
  ]);

  useEffect(() => {
    async function handleOverlapRounds() {
      if (!selfEncPk || !otherEncPk || !channelName) return;

      const keys = getKeys();
      if (!keys) return;
      const { psiPrivateKeys, psiPublicKeysLink } = keys;

      if (psiState === PSIState.ROUND1) {
        logClientEvent("psiRound1", {});
        const selfBitVector = generateSelfBitVector();
        const otherPsiPublicKeysLink = user?.psiPkLink;

        await init();
        const round1Output = round1_js(
          {
            psi_keys: psiPrivateKeys,
            message_round1: JSON.parse(
              await fetch(psiPublicKeysLink).then((res) => res.text())
            ),
          },
          JSON.parse(
            await fetch(otherPsiPublicKeysLink!).then((res) => res.text())
          ),
          selfBitVector
        );
        setSelfRound1Output(round1Output);

        const round2MessageLink = await psiBlobUploadClient(
          "round2Message",
          JSON.stringify(round1Output.message_round2)
        );

        supabase.channel(channelName).send({
          type: "broadcast",
          event: "message",
          payload: {
            state: PSIState.ROUND2,
            data: round2MessageLink,
            to: otherEncPk,
            otherPkId: user?.pkId, // hacky way of getting our own pkId
          },
        });
      } else if (psiState === PSIState.ROUND2) {
        logClientEvent("psiRound2", {});
        await init();
        const round2Output = round2_js(
          {
            psi_keys: psiPrivateKeys,
            message_round1: JSON.parse(
              await fetch(psiPublicKeysLink).then((res) => res.text())
            ),
          },
          selfRound1Output,
          JSON.parse(
            await fetch(otherRound2MessageLink!).then((res) => res.text())
          ),
          round2Order!
        );
        setSelfRound2Output(round2Output);

        const round3MessageLink = await psiBlobUploadClient(
          "round3Message",
          JSON.stringify(round2Output.message_round3)
        );

        supabase.channel(channelName).send({
          type: "broadcast",
          event: "message",
          payload: {
            state: PSIState.ROUND3,
            data: round3MessageLink,
            to: otherEncPk,
          },
        });
      } else if (psiState === PSIState.ROUND3) {
        logClientEvent("psiRound3", {});
        await init();
        const psiOutput = round3_js(
          selfRound2Output!,
          JSON.parse(
            await fetch(otherRound3MessageLink!).then((res) => res.text())
          )
        );
        let overlapIndices = [];
        for (let i = 0; i < psiOutput.length; i++) {
          if (psiOutput[i] === 1) {
            overlapIndices.push(i);
          }
        }

        setSelfRound3Output(overlapIndices);
      } else if (psiState === PSIState.JUBSIGNAL) {
        logClientEvent("psiRoundJubsSignal", {});
        await closeChannel();

        const encryptedMessage = await encryptOverlapComputedMessage(
          selfRound3Output,
          id?.toString()!,
          keys.encryptionPrivateKey,
          selfEncPk
        );

        try {
          await loadMessages({
            forceRefresh: false,
            messageRequests: [
              {
                encryptedMessage,
                recipientPublicKey: selfEncPk,
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

        processOverlap(selfRound3Output || []);
        setPsiState(PSIState.COMPLETE);
      }
    }

    handleOverlapRounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [psiState, selfEncPk, otherEncPk, channelName]);

  useEffect(() => {
    if (otherUserTemporarilyLeft) {
      const currentState = psiState;
      const timer = setTimeout(() => {
        if (psiState === currentState) {
          console.log(
            "Resetting PSI due to other user temporarily leaving",
            currentState,
            psiState
          );
          setPsiState(PSIState.NOT_STARTED);
          setSelfRound1Output(undefined);
          setOtherRound2MessageLink(undefined);
          setSelfRound2Output(undefined);
          setOtherRound3MessageLink(undefined);
          setSelfRound3Output(undefined);
          setOtherUserInChannel(false);
          setOtherUserTemporarilyLeft(false);
          setWantsToInitiatePSI(false);
          setOtherUserWantsToInitiatePSI(false);
        }
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [otherUserTemporarilyLeft, psiState]);

  useEffect(() => {
    const fetchUser = async () => {
      if (typeof id === "string") {
        const profile = getProfile();
        const keys = getKeys();
        if (!profile || !keys) {
          toast.error("You must be logged in to view this page.");
          router.push("/");
          return;
        }

        const fetchedUser = fetchUserByUUID(id);
        setUser(fetchedUser);

        if (fetchedUser) {
          // set psi info
          setOtherEncPk(fetchedUser.encPk);
          setSelfEncPk(profile.encryptionPublicKey);
          setChannelName(
            [fetchedUser.encPk, profile.encryptionPublicKey].sort().join("")
          );
          // always set up channel
          setupChannel();
          if (fetchedUser.oI) {
            processOverlap(JSON.parse(fetchedUser.oI));
            setPsiState(PSIState.COMPLETE);
          }

          // get talks info
          const talksResponse = await fetch(
            `/api/user/get_talks?encPk=${encodeURIComponent(fetchedUser.encPk)}`
          );
          if (talksResponse.ok) {
            const talksData = await talksResponse.json();
            setUserTalkInfo(talksData.talks);
          }

          // get github info
          if (
            !userGithubInfo &&
            githubSession &&
            (githubSession as any).accessToken &&
            fetchedUser.ghUserId &&
            !isNaN(parseInt(fetchedUser.ghUserId, 10))
          ) {
            setGithubInfoLoading(true);
            const userGithubId = parseInt(fetchedUser.ghUserId, 10);
            type GithubRepoData = {
              author_id: number;
              id: number;
              commits: number;
              first_commit_date: string;
              name: string;
              rank: number;
            }[];
            // type GithubData = {
            //   "alloy-rs": GithubRepoData;
            //   "axiom-crypto": GithubRepoData;
            //   bluealloy: GithubRepoData;
            //   chainbound: GithubRepoData;
            //   "cursive-team": GithubRepoData;
            //   "ethereum-optimism": GithubRepoData;
            //   ethereum: GithubRepoData;
            //   flashbots: GithubRepoData;
            //   "foundry-rs": GithubRepoData;
            //   paradigmxyz: GithubRepoData;
            //   primitivefinance: GithubRepoData;
            //   risc0: GithubRepoData;
            //   risechain: GithubRepoData;
            //   "shadow-hq": GithubRepoData;
            //   sigp: GithubRepoData;
            //   SorellaLabs: GithubRepoData;
            //   succinctlabs: GithubRepoData;
            //   wevm: GithubRepoData;
            //   taikoxyz: GithubRepoData;
            // };
            const fetchedGithubData = githubData as Record<
              string,
              GithubRepoData
            >;

            const userContributions: RepoContributionData[] = [];
            Object.keys(fetchedGithubData).forEach((repo) => {
              const repoData = fetchedGithubData[repo];
              repoData.forEach((entry) => {
                if (entry.author_id === userGithubId) {
                  userContributions.push({
                    repo,
                    first: new Date(entry.first_commit_date),
                    total: entry.commits,
                    rank: entry.rank,
                  });
                }
              });
            });

            setUserGithubInfo(userContributions);
            setGithubInfoLoading(false);
          }
        }
      }
    };
    fetchUser();
  }, [id, router, githubSession, userGithubInfo]);

  const handleInitiatePSI = () => {
    if (!user || !channelName) return;

    console.log(
      "Initiating psi...",
      wantsToInitiatePSI,
      otherUserWantsToInitiatePSI
    );

    logClientEvent("psiInitiatePSI", {});
    setWantsToInitiatePSI(true);
    supabase.channel(channelName).send({
      type: "broadcast",
      event: "initiatePSI",
      payload: {},
    });

    // start psi if other user is already interested
    if (otherUserWantsToInitiatePSI) {
      console.log("Starting psi after other user initiating PSI", otherEncPk);
      setWantsToInitiatePSI(false);
      setOtherUserWantsToInitiatePSI(false);
      setPsiState(PSIState.ROUND1);
    }
  };

  const handleUpdatePSI = () => {
    if (!user || !channelName) return;

    console.log(
      "Updating psi...",
      wantsToInitiatePSI,
      otherUserWantsToInitiatePSI
    );

    logClientEvent("psiUpdatePSI", {});
    setSelfRound1Output(undefined);
    setOtherRound2MessageLink(undefined);
    setSelfRound2Output(undefined);
    setOtherRound3MessageLink(undefined);
    setSelfRound3Output(undefined);
    supabase.channel(channelName).send({
      type: "broadcast",
      event: "initiatePSI",
      payload: {},
    });

    // start psi if other user is already interested
    if (otherUserWantsToInitiatePSI) {
      console.log("Starting psi after other user initiating PSI", otherEncPk);
      setWantsToInitiatePSI(false);
      setOtherUserWantsToInitiatePSI(false);
      setPsiState(PSIState.ROUND1);
    } else {
      console.log("Setting wants to initiate PSI after update", otherEncPk);
      setWantsToInitiatePSI(true);
      setPsiState(PSIState.NOT_STARTED);
    }
  };

  if (!user) {
    return (
      <>
        <AppHeaderLogo className="mx-auto py-4" />
        <div className="text-white text-lg flex items-center justify-center h-full">
          User not found
        </div>
      </>
    );
  }

  const isOverlapComputed = psiState === PSIState.COMPLETE;

  return (
    <AppContent>
      <ProfilePicModal
        isOpen={showProfilePicModal}
        setIsOpen={setShowProfilePicModal}
        size={pageWidth - 60}
        name={user?.name!}
        pubKey={user?.sigPk ?? ""}
      />
      <AppBackHeader redirectTo="/?defaultTabIndex=1" />
      {alreadyConnected && (
        <div className="flex items-start justify-center py-28">
          <span className="text-xl text-white">
            You have already connected with this user!
          </span>
        </div>
      )}
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 xs:gap-5 items-center">
          <div
            onClick={() => {
              logClientEvent("artShowProfilePicModal", {});
              setShowProfilePicModal(true);
            }}
            className="w-32 h-32 rounded-[4px] relative flex-shrink-0"
          >
            <ArtworkSnapshot
              width={128}
              height={128}
              pubKey={user?.sigPk ?? ""}
            />
            <button type="button" className="absolute right-1 top-1 z-1">
              <Icons.Zoom />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl text-white font-semibold font-inter leading-6 tracking-[-0.1px]">
              {user?.name}
            </h2>
            <div className="flex items-center gap-1">
              {user?.bio && (
                <span
                  className="text-white/50 text-xs font-inter font-medium mt-1 left-5"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {user?.bio}
                </span>
              )}
            </div>
          </div>
        </div>
        {!user?.inTs && (
          <div className="p-3 border border-white/20 flex-col justify-center items-start gap-1 inline-flex">
            <InputWrapper
              className="flex flex-col gap-2"
              label="Details pending"
            >
              <span className="text-white/50 font-inter text-[14px] left-5 mt-1">
                If {user?.name} taps you back and shares their socials, they
                will appear here.
              </span>
            </InputWrapper>
          </div>
        )}

        {user?.note && (
          <Accordion label="Notes">
            <span className="text-white/50 text-[14px] mt-1 left-5">
              {user?.note}
            </span>
          </Accordion>
        )}

        {(user.x || user.tg || user.fc) && (
          <Accordion label="Socials">
            <div className="flex flex-col gap-1">
              {(user.x?.length ?? 0) > 1 && (
                <LinkCard
                  label="Twitter"
                  href={`https://x.com/${removeLabelStartWith(user.x, "@")}`}
                  value={labelStartWith(user.x, "@")}
                />
              )}
              {(user.fc?.length ?? 0) > 1 && (
                <LinkCard
                  label="Farcaster"
                  href={`https://warpcast.com/${removeLabelStartWith(
                    user.fc,
                    "@"
                  )}`}
                  value={labelStartWith(user.fc, "@")}
                />
              )}
              {(user.tg?.length ?? 0) > 1 && (
                <LinkCard
                  label="Telegram"
                  href={`https://t.me/${removeLabelStartWith(user.tg, "@")}`}
                  value={labelStartWith(user.tg, "@")}
                />
              )}
            </div>
          </Accordion>
        )}

        {userTalkInfo?.length > 0 && (
          <Accordion label="Speaker">
            <div className="flex flex-col gap-1">
              {userTalkInfo.map((talkInfo, index) => (
                <span
                  key={index}
                  className="text-primary text-[14px] mt-1 left-5"
                >
                  <Link href={"/talks/" + talkInfo.talkId}>
                    {talkInfo.talkName}
                  </Link>
                </span>
              ))}
            </div>
          </Accordion>
        )}

        <Button
          onClick={() =>
            console.log(wantsToInitiatePSI, otherUserWantsToInitiatePSI)
          }
        >
          Log PSI state
        </Button>

        {userGithubInfo && (
          <Accordion className="flex flex-col gap-2" label="Dev stats">
            <LinkCard
              label="Github"
              value={user.ghLogin}
              href={"https://github.com/" + user.ghLogin}
            ></LinkCard>
            <div className="flex flex-col gap-1">
              {userGithubInfo.map((repo, index) => (
                <Stats
                  key={index}
                  title={repo.repo}
                  items={[
                    {
                      label: "1st commit",
                      value: repo.first.toDateString(),
                    },
                    {
                      label: "Total",
                      value: repo.total.toString(),
                    },
                    {
                      label: "Rank",
                      value: repo.rank.toString(),
                    },
                  ]}
                />
              ))}
            </div>
          </Accordion>
        )}

        <Card.Base className="flex flex-col p-4 gap-6 !bg-gray/20 !rounded-none !border-white/20 mt-4 mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icons.Cards className="text-secondary" />
              <span className="font-medium text-white text-sm font-inter">
                What do you both have in common?
              </span>
            </div>

            <span className="text-white/50 font-inter text-xs font-normal">
              {isOverlapComputed ? (
                "Overlap computed at the time you both opted into "
              ) : (
                <>
                  If you both tap Discover <b>at the same time</b> we will
                  privately compute any overlap using
                </>
              )}
              <a
                href="https://github.com/cursive-team/2P-PSI/tree/vivek/wasm-2p-psi"
                target="_blank"
                rel="noopener noreferrer"
              >
                {" "}
                <u>2PC + FHE</u>.
              </a>
            </span>
          </div>
          {isOverlapComputed ? (
            <div className="flex flex-col gap-1">
              {userOverlap.map(({ userId, name }, index) => {
                return (
                  <div
                    onClick={() => {
                      window.location.href = `/users/${userId}`;
                    }}
                    key={index}
                  >
                    <div className="flex justify-between border-b w-full border-gray-300  last-of-type:border-none first-of-type:pt-0 py-1">
                      <div className="flex items-center gap-2">
                        <IconCircle>
                          <CircleCard icon="person" />
                        </IconCircle>
                        <Card.Title>{name}</Card.Title>
                      </div>
                    </div>
                  </div>
                );
              })}
              {locationOverlap.map(({ locationId, name }, index) => {
                return (
                  <Link href={`/locations/${locationId}`} key={index}>
                    <div className="flex justify-between border-b w-full border-gray-300  last-of-type:border-none first-of-type:pt-0 py-1">
                      <div className="flex items-center gap-2">
                        <IconCircle>
                          <CircleCard icon="location" />
                        </IconCircle>
                        <Card.Title>{name}</Card.Title>
                      </div>
                    </div>
                  </Link>
                );
              })}
              <Button
                type="button"
                onClick={handleUpdatePSI}
                size="small"
                variant="gray"
                style={{
                  marginTop: "16px",
                }}
              >
                Update
              </Button>
            </div>
          ) : psiState === PSIState.NOT_STARTED ? (
            <Button
              type="button"
              onClick={handleInitiatePSI}
              size="small"
              variant="gray"
              disabled={!otherUserInChannel}
            >
              {wantsToInitiatePSI
                ? "Waiting for other user to accept..."
                : otherUserInChannel
                ? "Discover"
                : "Waiting for other user to connect..."}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-white text-xs text-center">
                {PSIStateMapping[psiState]}
              </span>
              <div className="relative">
                <Card.Progress
                  style={{
                    width: `${(100 * psiState) / PSIState.COMPLETE}%`,
                  }}
                />
              </div>
            </div>
          )}
        </Card.Base>
      </div>
    </AppContent>
  );
};

UserProfilePage.getInitialProps = () => {
  return { showHeader: false, showFooter: false };
};

export default UserProfilePage;
