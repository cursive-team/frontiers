import { Icons } from "@/components/Icons";
import { TabsProps, Tabs } from "@/components/Tabs";
import { Card } from "@/components/cards/Card";
import { ListLayout } from "@/layouts/ListLayout";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Activity,
  Profile,
  User,
  getActivities,
  getAuthToken,
  getKeys,
  getProfile,
  getUsers,
} from "@/lib/client/localStorage";
import { JUB_SIGNAL_MESSAGE_TYPE } from "@/lib/client/jubSignal";
import { SliderModal } from "@/components/modals/SliderModal";
import { Button } from "@/components/Button";
import { formatDate } from "@/lib/shared/utils";
import { loadMessages } from "@/lib/client/jubSignalClient";
import { Spinner } from "@/components/Spinner";
import { CircleCard } from "@/components/cards/CircleCard";
import { ArtworkSnapshot } from "@/components/artwork/ArtworkSnapshot";
import useSettings from "@/hooks/useSettings";
import { useStateMachine } from "little-state-machine";
import updateStateFromAction from "@/lib/shared/updateAction";
import { IconCircle } from "@/components/IconCircle";
import { NoResultContent } from "@/components/NoResultContent";
import { classed } from "@tw-classed/react";
import { logClientEvent } from "@/lib/client/metrics";
import { Location } from "@prisma/client";

interface LinkCardProps {
  name: string;
  date: string;
  href: string;
  other?: string;
}

const LinkCard = ({ name, date, href, other }: LinkCardProps) => {
  return (
    <Link href={href}>
      <div className="w-full border border-white/20 p-3">
        <div className="grid grid-cols-[1fr_90px] w-full">
          {other ? (
            <div className="flex flex-row gap-2 truncate items-end">
              <span className="text-white font-medium text-sm  text-left">
                {name}
              </span>
              <span className="text-white/50 font-medium text-xs text-left truncate">
                {other}
              </span>
            </div>
          ) : (
            <span className="text-white font-bold text-sm text-left truncate">
              {name}
            </span>
          )}

          <span className="text-white/50 font-inter font-medium text-xs">
            {date}
          </span>
        </div>
      </div>
    </Link>
  );
};

interface ActivityFeedProps {
  type: JUB_SIGNAL_MESSAGE_TYPE;
  name: string;
  id: string;
  date: string;
}

const CardTitleOverride = classed.h1(
  "text-sm font-normal leading-6 font-inter"
);

interface FeedContentProps {
  title: React.ReactNode;
  titleOverride?: boolean;
  description: string;
  icon: React.ReactNode;
}
const FeedContent = ({
  title,
  description,
  titleOverride,
  icon,
}: FeedContentProps) => {
  return (
    <div className="grid grid-cols-[1fr_80px] items-center justify-between py-1 gap-4">
      <div className="grid grid-cols-[24px_1fr] items-center gap-2 truncate">
        <IconCircle>{icon}</IconCircle>
        <CardTitleOverride className="truncate">{title}</CardTitleOverride>
      </div>
      <Card.Description>{description}</Card.Description>
    </div>
  );
};

const ActivityFeed = ({ type, name, id, date }: ActivityFeedProps) => {
  switch (type) {
    case JUB_SIGNAL_MESSAGE_TYPE.OUTBOUND_TAP:
      return (
        <FeedContent
          title={
            <>
              <span className="text-iron-600">{"Sent socials to "}</span>
              <span className="text-white">{name}</span>
            </>
          }
          icon={<Icons.Person className="text-secondary" />}
          description={date}
        />
      );
    case JUB_SIGNAL_MESSAGE_TYPE.OVERLAP_COMPUTED:
      return (
        <Link href={`/users/${id}`}>
          <FeedContent
            title={
              <>
                <span className="text-iron-600">{"Overlapped with "}</span>
                <span className="text-white">{name}</span>
              </>
            }
            titleOverride={true}
            icon={<CircleCard icon="overlap" />}
            description={date}
          />
        </Link>
      );
    case JUB_SIGNAL_MESSAGE_TYPE.INBOUND_TAP:
      return (
        <Link href={`/users/${id}`}>
          <FeedContent
            title={
              <>
                <span className="text-iron-600">
                  {"Received socials from "}
                </span>
                <span className="text-white">{name}</span>
              </>
            }
            titleOverride={true}
            icon={<Icons.Person className="text-secondary" />}
            description={date}
          />
        </Link>
      );
    case JUB_SIGNAL_MESSAGE_TYPE.LOCATION_TAP:
      return (
        <Link href={`/locations/${id}`}>
          <FeedContent
            title={
              <>
                <span className="text-iron-600">{"Attended talk "}</span>
                <span className="text-white">{name}</span>
              </>
            }
            titleOverride={true}
            icon={<CircleCard icon="location" />}
            description={date}
          />
        </Link>
      );
    case JUB_SIGNAL_MESSAGE_TYPE.QUEST_COMPLETED:
      return (
        <Link href={`/proofs/${id}`}>
          <FeedContent
            icon={<CircleCard icon="proof" />}
            title={
              <>
                <span className="text-iron-600">{"Made a proof "}</span>
                <span className="text-white">{name}</span>
              </>
            }
            titleOverride={true}
            description={date}
          />
        </Link>
      );
    case JUB_SIGNAL_MESSAGE_TYPE.ITEM_REDEEMED:
      return (
        <FeedContent
          title={
            <>
              {"Redeemed "} <u>{name}</u>
            </>
          }
          description={date}
          icon={<Icons.Store />}
        />
      );
    default:
      return null;
  }
};

export default function Social() {
  const router = useRouter();
  const { getState } = useStateMachine({ updateStateFromAction });
  const { pageWidth } = useSettings();
  const [showSliderModal, setShowSliderModal] = useState(false);
  const [profile, setProfile] = useState<Profile>();
  const [numConnections, setNumConnections] = useState<number>(0);
  const [tabsItems, setTabsItems] = useState<TabsProps["items"]>();
  const [isLoading, setLoading] = useState(false);

  const isMenuOpen = getState().isMenuOpen ?? false;

  // Helper function to compute data needed to populate tabs
  const computeTabsItems = (
    profileData: Profile,
    users: Record<string, User>,
    activities: Activity[],
    locations: Location[]
  ): TabsProps["items"] => {
    // Group activities by date
    const groupedActivities: Activity[][] = [];
    let currentDate: string | undefined = undefined;
    let currentDateActivities: Activity[] = [];
    activities.forEach((activity) => {
      if (activity.type === JUB_SIGNAL_MESSAGE_TYPE.REGISTERED) return;
      const date = new Date(activity.ts).toDateString();
      if (currentDate === undefined) {
        currentDateActivities.push(activity);
        currentDate = date;
      } else if (currentDate === date) {
        currentDateActivities.push(activity);
      } else {
        groupedActivities.push(currentDateActivities);
        currentDateActivities = [activity];
        currentDate = date;
      }
    });
    groupedActivities.push(currentDateActivities);

    // Sort contacts by name then group by first letter
    const usersList = Object.entries(users).map(([key, value]) => ({
      ...value,
      uuid: key,
    }));
    const contactUsersList = usersList.filter(
      (user) => user.inTs && user.encPk !== profileData.encryptionPublicKey
    );
    const sortedContactUsers = contactUsersList.sort((a, b) => {
      return a.name.localeCompare(b.name, "en", { sensitivity: "base" }); // Ignore case
    });
    const groupedContactUsers: (User & { uuid: string })[][] = []; // User with uuid property included
    let currentLetter: string | undefined = undefined;
    let currentLetterUsers: (User & { uuid: string })[] = [];
    sortedContactUsers.forEach((user) => {
      const letter = user.name[0].toUpperCase();
      if (currentLetter === undefined) {
        currentLetterUsers.push(user);
        currentLetter = letter;
      } else if (currentLetter === letter) {
        currentLetterUsers.push(user);
      } else {
        groupedContactUsers.push(currentLetterUsers);
        currentLetterUsers = [user];
        currentLetter = letter;
      }
    });
    groupedContactUsers.push(currentLetterUsers);

    // Group locations by date and time
    const groupedLocations: Location[][] = [];
    let currentLocationDate: string | undefined = undefined;
    let currentDateLocations: Location[] = [];
    locations.sort(
      (a, b) => new Date(a.talkTime).getTime() - new Date(b.talkTime).getTime()
    );
    locations.forEach((location) => {
      const date = new Date(location.talkTime).toDateString();
      if (currentLocationDate === undefined) {
        currentDateLocations.push(location);
        currentLocationDate = date;
      } else if (currentLocationDate === date) {
        currentDateLocations.push(location);
      } else {
        groupedLocations.push(currentDateLocations);
        currentDateLocations = [location];
        currentLocationDate = date;
      }
    });
    groupedLocations.push(currentDateLocations);

    return [
      {
        label: "Activity Feed",
        children: (
          <div className="flex flex-col gap-4 mt-2">
            {activities.length === 1 && (
              <NoResultContent>
                Get started by tapping rings and NFC stickers!
              </NoResultContent>
            )}
            {activities.length > 1 &&
              groupedActivities.map((activities, index) => {
                return (
                  <ListLayout
                    key={index}
                    label={new Date(activities[0].ts).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric" }
                    )}
                    spacing="sm"
                  >
                    {activities.map((activity, index) => {
                      return (
                        <ActivityFeed
                          key={index}
                          type={activity.type}
                          name={activity.name}
                          id={activity.id}
                          date={formatDate(activity.ts)}
                        />
                      );
                    })}
                  </ListLayout>
                );
              })}
          </div>
        ),
      },
      {
        label: "Contacts",
        children: (
          <div className="flex flex-col gap-5 mt-2">
            {contactUsersList.length === 0 && (
              <NoResultContent>
                Tap rings to share socials and connect with others!
              </NoResultContent>
            )}
            {contactUsersList.length !== 0 &&
              groupedContactUsers.map((users, index) => {
                const groupLetter = users[0].name[0].toUpperCase();

                return (
                  <ListLayout key={index} label={groupLetter}>
                    <div className="flex flex-col gap-1">
                      {users.map((user, index) => {
                        const { name, inTs, bio } = user;
                        const date = inTs ? formatDate(inTs) : "-";

                        return (
                          <LinkCard
                            key={index}
                            name={name}
                            date={date}
                            other={bio ?? ""}
                            href={`/users/${user.uuid}`}
                          />
                        );
                      })}
                    </div>
                  </ListLayout>
                );
              })}
          </div>
        ),
      },
      {
        label: "Talks",
        children: (
          <div className="flex flex-col gap-5 mt-2">
            {locations.length === 0 ? (
              <NoResultContent>{"No talks available."}</NoResultContent>
            ) : (
              groupedLocations.map((locations, index) => {
                return (
                  <ListLayout
                    key={index}
                    label={new Date(locations[0].talkTime).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric" }
                    )}
                    spacing="sm"
                  >
                    <div className="flex flex-col gap-1">
                      {locations.map((location, index) => {
                        return (
                          <LinkCard
                            key={index}
                            name={location.name}
                            date={formatDate(location.talkTime.toString())}
                            href={`/talks/${location.id}`}
                          />
                        );
                      })}
                    </div>
                  </ListLayout>
                );
              })
            )}
          </div>
        ),
      },
    ];
  };

  useEffect(() => {
    const updateSocialInfo = async () => {
      setLoading(true);

      const profileData = getProfile();
      const keyData = getKeys();
      const authToken = getAuthToken();
      if (
        !profileData ||
        !keyData ||
        !authToken ||
        authToken.expiresAt < new Date()
      ) {
        setLoading(false);
        router.push("/register");
        return;
      }

      // User is logged in, set profile
      setProfile(profileData);

      // If page is reloaded, load messages
      const navigationEntries = window.performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const navigationEntry = navigationEntries[0];
        if (navigationEntry.type && navigationEntry.type === "reload") {
          try {
            logClientEvent("loadMessagesPageRefresh", {});
            await loadMessages({ forceRefresh: false });
          } catch (error) {
            console.error("Failed to load messages upon page reload:", error);
          }
        }
      }

      // Fetch locations
      const fetchLocations = async (): Promise<Location[]> => {
        const response = await fetch(`/api/location`);
        if (!response.ok) {
          console.error("Error fetching locations: ", response.statusText);
          return [];
        }

        const locations = await response.json();
        return locations;
      };
      const locations = await fetchLocations();

      // Compute tabs items
      const users = getUsers();
      const activities = getActivities();
      setNumConnections(
        Object.values(users).filter(
          (user) => user.inTs && user.encPk !== profileData.encryptionPublicKey
        ).length
      );
      setTabsItems(computeTabsItems(profileData, users, activities, locations));
      setLoading(false);
    };

    updateSocialInfo();
  }, [router]);

  if (isLoading) {
    return (
      <div className="my-auto mx-auto">
        <Spinner />
      </div>
    );
  }

  if (!profile || !tabsItems) return null;
  return (
    <>
      <SliderModal
        isOpen={showSliderModal}
        setIsOpen={setShowSliderModal}
        size={pageWidth - 60}
      />
      <div className="flex flex-col pt-4">
        <div className="flex gap-6 mb-6">
          <div
            onClick={() => {
              logClientEvent("artShowSliderModal", {});
              setShowSliderModal(true);
            }}
            className="size-32 rounded-[4px] relative overflow-hidden"
          >
            <ArtworkSnapshot
              width={128}
              height={128}
              pubKey={profile.signaturePublicKey}
              homePage={true}
            />
            <button type="button" className="absolute right-1 top-1 z-1">
              <Icons.Zoom />
            </button>
          </div>

          <div className="flex flex-col justify-center gap-4 py-2">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl leading-6 font-inter tracking-[-0.1px] text-white font-semibold">
                {profile?.displayName}
              </h2>
              <span className="text-xs font-inter font-normal text-white/50">
                {numConnections === 1
                  ? `1 contact`
                  : `${numConnections} contacts`}
              </span>
            </div>
            <Link href="/leaderboard">
              <Button size="small" variant="gray">
                View leaderboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Tabs items={tabsItems} />
    </>
  );
}
