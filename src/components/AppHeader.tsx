import { Icons } from "@/components/Icons";
import { classed } from "@tw-classed/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";
import { deleteAccountFromLocalStorage } from "@/lib/client/localStorage";
import Profile from "./Profile";
import { useStateMachine } from "little-state-machine";
import updateStateFromAction from "@/lib/shared/updateAction";
import { ProfileDisplayState } from "@/types";
import { supabase } from "@/lib/client/realtime";
import { Button } from "./Button";
import { LINKS } from "@/hooks/useSettings";
import { cn } from "@/lib/client/utils";
import { signOut } from "next-auth/react";
import { AppLink } from "./AppLink";

const Title = classed.h3("block font-inter text-white", {
  variants: {
    size: {
      small: "text-base leading-1 font-semibold",
      medium: "text-[21px] leading-5 font-medium",
    },
  },
  defaultVariants: {
    size: "small",
  },
});
const Description = classed.span("text-sm text-white leading-5");

const ContentWrapper = classed.div("flex flex-col gap-3 mt-3 xs:gap-4 xs:mt-6");

interface AppHeaderContentProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean) => void;
  handleSignout: () => void;
}

interface AppBackHeaderProps {
  redirectTo?: string; // redirect to this page instead of back
  onBackClick?: () => void;
  actions?: ReactNode;
  label?: string;
  sticky?: boolean;
}

export const AppBackHeader = ({
  redirectTo,
  onBackClick,
  actions,
  label,
  sticky = false,
}: AppBackHeaderProps) => {
  const router = useRouter();

  return (
    <div
      className={cn("flex justify-between items-center h-[50px] xs:h-[60px]", {
        "sticky top-0 bg-main": sticky,
      })}
    >
      <button
        type="button"
        className="flex items-center gap-1 text-white"
        onClick={() => {
          if (typeof onBackClick === "function") {
            onBackClick?.();
          } else {
            if (redirectTo) {
              router.push(redirectTo);
            } else {
              router.back();
            }
          }
        }}
      >
        <Icons.ArrowLeft />
        <span className="text-sm font-normal text-white">
          {label || "Back"}
        </span>
      </button>
      {actions}
    </div>
  );
};

const AppHeaderContent = ({
  isMenuOpen,
  setIsMenuOpen,
  handleSignout,
}: AppHeaderContentProps) => {
  const { actions, getState } = useStateMachine({ updateStateFromAction });
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);

  const profileViewState: ProfileDisplayState =
    getState().profileView || ProfileDisplayState.EDIT;

  if (!isMenuOpen) return null;

  const MenuItems: { label: string; children: ReactNode }[] = [
    {
      label: "Profile & settings",
      children: <Profile handleSignout={handleSignout} />,
    },
    {
      label: "About",
      children: (
        <>
          <ContentWrapper>
            <Title>About the app</Title>
            <Description className="!text-white">
            This app allows you to verifiably digitize your Frontiers experience and make provable claims about the people you have met. Every single tap gives you a digital signature representing the fact that you met someone. You can make zk proofs about these signatures, like proving that you met 3 people without revealing who they were or the signatures themselves.
            </Description>
            <Description className="!text-white">
            Crucially, all the data you collect in this app is yours - our servers only store an encrypted backup. You get to decide who sees your data and how it is used.
            </Description>
            <Description className="!text-white">
              Cursive{" "}
              <a
                target="_blank"
                className="underline"
                href="https://cursive.team"
              >
                (cursive.team)
              </a>{" "}
              is a team building applications of signed data. We want to build
              experiences where people own their data and use it in powerful
              ways. If this is something you are interested in, please reach
              out!
            </Description>
            <Description>
              <Link href={LINKS.GITHUB} target="_blank">
                <div className="border border-white/50 p-3">
                  <div className="flex w-full items-center justify-between">
                    <span className="text-white font-semibold text-xs">
                      App GitHub
                    </span>
                    <Icons.ExternalLink className="text-white " />
                  </div>
                </div>
              </Link>
            </Description>
            <Description>
              <Link href={LINKS.CURSIVE_SITE} target="_blank">
                <div className="border border-white/50 p-3">
                  <div className="flex w-full items-center justify-between">
                    <span className="text-white font-semibold text-xs">
                      Cursive homepage
                    </span>
                    <Icons.ExternalLink className="text-white" />
                  </div>
                </div>
              </Link>
            </Description>
            <span className="text-xs text-white/50 text-center mt-20 font-inter ">
              App built by{" "}
              <AppLink
                href="https://cursive.team/"
                className="text-primary underline"
              >
                Cursive
              </AppLink>{" "}
              for Paradigm Frontiers.
            </span>
          </ContentWrapper>
        </>
      ),
    },
  ];

  const onBack = () => {
    if (
      profileViewState === ProfileDisplayState.CHOOSE_PASSWORD ||
      profileViewState === ProfileDisplayState.INPUT_PASSWORD
    ) {
      actions.updateStateFromAction({
        ...getState(),
      });
      return; //
    }

    setActiveMenuIndex(null);
  };

  const showBackButton = activeMenuIndex !== null;

  return (
    <div className="fixed inset-0 w-full overflow-auto px-4 xs:px-4 z-10 h-full bg-main">
      <div className="flex xs:h-[60px] py-5">
        {showBackButton && (
          <button
            onClick={onBack}
            type="button"
            className="flex gap-2 items-center text-white"
          >
            <Icons.ArrowLeft />
            <span>Back</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
            // reset profile view
            actions.updateStateFromAction({
              ...getState(),
              profileView: ProfileDisplayState.EDIT,
            });
            // reset active menu
            setActiveMenuIndex(null);
          }}
          className="flex gap-3 items-center ml-auto text-white"
        >
          <span>Close</span>
          {isMenuOpen ? <Icons.Close /> : <Icons.Burgher />}
        </button>
      </div>
      <div className="mt-2">
        <div className="flex flex-col gap-6">
          {MenuItems.map((item, index) => {
            if (activeMenuIndex !== null) return null;
            return (
              <Title
                key={item.label}
                size="medium"
                onClick={() => {
                  setActiveMenuIndex(index);
                }}
              >
                {item.label}
              </Title>
            );
          })}
        </div>

        {activeMenuIndex !== null && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {MenuItems[activeMenuIndex].children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface AppHeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean) => void;
}
export const AppHeaderLogo = ({ className = "" }: any) => {
  return (
    <Link className={cn(className)} href="/">
      <button type="button" className="flex gap-2 items-center">
        <Icons.Logo />
      </button>
    </Link>
  );
};
const AppHeader = ({ isMenuOpen, setIsMenuOpen }: AppHeaderProps) => {
  const { actions, getState } = useStateMachine({ updateStateFromAction });

  const handleSignout = async () => {
    deleteAccountFromLocalStorage();
    await supabase.auth.signOut();
    await signOut();
    window.location.href = "/";
  };

  const toggleMenu = () => {
    const newState = !isMenuOpen;
    // update state for menu
    actions.updateStateFromAction({
      ...getState(),
      isMenuOpen: newState,
    });
    setIsMenuOpen(newState);
  };

  return (
    <div
      className={cn("flex w-full items-center p-4 py-5 xs:px-4 z-50", {
        "bg-main": isMenuOpen,
        "bg-transparent": !isMenuOpen,
      })}
    >
      {!isMenuOpen && <AppHeaderLogo />}

      <div className="flex gap-4 items-center ml-auto">
        <span className="text-white">{isMenuOpen && "Close"}</span>
        <button className="text-white" onClick={toggleMenu}>
          {isMenuOpen ? (
            <Icons.Close className="text-white" />
          ) : (
            <Icons.Burgher className="text-white" />
          )}
        </button>
      </div>

      <AppHeaderContent
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        handleSignout={handleSignout}
      />
    </div>
  );
};

AppHeader.displayName = "AppHeader";

export { AppHeader };
