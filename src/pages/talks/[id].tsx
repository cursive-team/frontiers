import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ErrorResponse, LocationWithQuests } from "@/types";
import { classed } from "@tw-classed/react";
import { AppBackHeader } from "@/components/AppHeader";
import { toast } from "sonner";
import { LoadingWrapper } from "@/components/wrappers/LoadingWrapper";
import { LocationDetailPlaceholder } from "@/components/placeholders/LocationDetailPlaceholder";
import { Card } from "@/components/cards/Card";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Icons } from "@/components/Icons";
import { getUsers, User } from "@/lib/client/localStorage";
import { AppContent } from "@/components/AppContent";

const Title = classed.span("text-white text-xs font-normal font-inter");
const Description = classed.h5("text-white/50 font-inter font-normal text-sm");
const LinkCard = classed.div("p-3 border border-white/20");

const LocationDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [location, setLocation] = useState<LocationWithQuests>();
  const [users, setUsers] = useState<Record<string, User>>({});

  useEffect(() => {
    const fetchLocation = async () => {
      if (typeof id === "string") {
        try {
          const response = await fetch(`/api/location/${id}`);
          if (!response.ok) {
            const errorResponse: ErrorResponse = await response.json();
            console.error(errorResponse.error);
            toast.error("An error occurred. Please try again.");
            router.push("/");
          } else {
            const data: LocationWithQuests = await response.json();
            setLocation(data);
          }
        } catch (err) {
          toast.error("An error occurred. Please try again.");
          router.push("/");
        }

        const tap = router.query.tap;
        if (tap === "true") {
          toast.success("You've successfully tapped in!", {
            position: "bottom-center",
          });
        }
      }
    };

    fetchLocation();
  }, [router, id]);

  useEffect(() => {
    const users = getUsers();
    setUsers(users);
  }, []);

  const getSpeakerComponent = (): JSX.Element | null => {
    if (!location) {
      return null;
    }
    if (!users || !location.speakerUser) {
      return <Description>{location.speaker}</Description>;
    }

    const speakerUserEncPk = location.speakerUser.encryptionPublicKey;
    const userKey = Object.keys(users).find(
      (key) => users[key].encPk === speakerUserEncPk
    );

    if (userKey) {
      return (
        <Link href={`/users/${userKey}`}>
          <Description>{location.speaker}</Description>
        </Link>
      );
    } else {
      return <Description>{location.speaker}</Description>;
    }
  };

  return (
    <AppContent>
      <AppBackHeader redirectTo="/?defaultTabIndex=2" />
      <LoadingWrapper
        isLoading={!location}
        fallback={<LocationDetailPlaceholder />}
        className="flex flex-col gap-6"
      >
        {location && (
          <div className="flex flex-col gap-4">
            <Card.Base
              className="!border-white/20 !rounded-none bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/shapes/card-shape-2.svg')",
              }}
            >
              <div className="flex flex-col py-4 px-3 min-h-[180px]">
                <h5 className="mt-auto text-white font-inter font-semibold text-xl leading-6">
                  {location.name}
                </h5>
              </div>
            </Card.Base>
            {location.speaker && (
              <div className="flex flex-col gap-1">
                <Title>Speaker</Title>
                {getSpeakerComponent()}
              </div>
            )}
            {location.description && (
              <div className="flex flex-col gap-1">
                <Title>Description</Title>
                <Description>{location.description}</Description>
              </div>
            )}
            <div className="flex flex-col gap-4 mt-10">
              {(location.slidesLink || true) && (
                <Link href={location?.slidesLink ?? "#"} target="_blank">
                  <LinkCard className="flex w-full items-center justify-between">
                    <span className="text-white font-medium font-inter text-xs">
                      Slides
                    </span>
                    <Icons.ExternalLink className="text-white" />
                  </LinkCard>
                </Link>
              )}
              {location?.speakerSocial ||
                (true && (
                  <Link href={location?.speakerSocial ?? "#"} target="_blank">
                    <LinkCard className="flex w-full items-center justify-between">
                      <span className="text-white font-medium font-inter text-xs">
                        Follow the speaker
                      </span>
                      <Icons.ExternalLink className="text-white" />
                    </LinkCard>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </LoadingWrapper>
    </AppContent>
  );
};

LocationDetails.getInitialProps = () => {
  return { fullPage: true };
};

export default LocationDetails;
