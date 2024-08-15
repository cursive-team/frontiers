import { AppContent } from "@/components/AppContent";
import { Button } from "@/components/Button";
import { Card } from "@/components/cards/Card";
import { Icons } from "@/components/Icons";
import { Modal } from "@/components/modals/Modal";
import { Tabs } from "@/components/Tabs";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import { encryptCandidateSharedMessage } from "@/lib/client/jubSignal/candidateShared";
import { loadMessages } from "@/lib/client/jubSignalClient";
import { getKeys, getProfile } from "@/lib/client/localStorage";
import { getJobs, saveJobs } from "@/lib/client/localStorage/jobs";
import { classed } from "@tw-classed/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const Title = classed.span("text-white text-xs font-normal font-inter");
const Description = classed.h5("text-white/50 font-inter font-normal text-sm");
const LinkCard = classed.div("p-3 border border-white/20");

interface OpportunityCardProps {
  label: string;
  description?: string;
  onClick?: () => void;
}

const OpportunityCard = ({
  label,
  description,
  onClick = () => {},
  ...props
}: OpportunityCardProps) => {
  return (
    <div
      className="hover:bg-gray/30 first-of-type:border-t first-of-type:border-t-white/20 border-b border-b-white/20 py-6"
      onClick={onClick}
      {...props}
    >
      <AppContent className="flex items-center justify-between">
        <div className="flex flex-col ">
          <span className="text-white font-inter text-sm font-medium">
            {label}
          </span>
          <span className="text-white/50 font-inter text-xs">
            {description}
          </span>
        </div>
        <button>
          <Icons.ArrowRight size={24} />
        </button>
      </AppContent>
    </div>
  );
};

export type CandidateJobMatch = {
  recruiterDisplayName: string;
  recruiterEncPubKey: string;
  role: string;
  project: string;
  jobLink: string;
  matchId: number;
  isMatch: boolean;
};

type CandidateJobsViewProps = {
  matches: CandidateJobMatch[];
};
export default function CandidateJobsView({ matches }: CandidateJobsViewProps) {
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);
  const [match, setMatch] = useState<CandidateJobMatch | undefined>(undefined);
  const [acceptedIds, setAcceptedIds] = useState<number[]>([]);

  const hasOpportunities = true;
  const hasOptedIn = true;

  useEffect(() => {
    const jobs = getJobs();
    const acceptedIds = jobs?.candidateAcceptedMatchIds ?? [];
    setAcceptedIds(acceptedIds);
  }, []);

  const handleAccept = async (match: CandidateJobMatch) => {
    console.log("candidate accepting match", match);
    const jobs = getJobs();
    const profile = getProfile();
    const keys = getKeys();

    if (!jobs || !jobs.candidateInput || !profile || !keys) {
      toast.error("Failed to accept match. Please try again");
      return;
    }

    const interests = [];
    if (jobs.candidateInput.interestZk) {
      interests.push("zk");
    }
    if (jobs.candidateInput.interestDefi) {
      interests.push("defi");
    }
    if (jobs.candidateInput.interestConsumer) {
      interests.push("consumer");
    }
    if (jobs.candidateInput.interestInfra) {
      interests.push("infra");
    }

    const stage = [];
    if (jobs.candidateInput.stageParadigm) {
      stage.push("paradigm");
    }
    if (jobs.candidateInput.stageGrant) {
      stage.push("grant");
    }
    if (jobs.candidateInput.stageSeed) {
      stage.push("seed");
    }
    if (jobs.candidateInput.stageSeriesA) {
      stage.push("seriesA");
    }

    const jubSignalMessage = await encryptCandidateSharedMessage({
      displayName: profile.displayName,
      encryptionPublicKey: profile.encryptionPublicKey,
      bio: profile.bio,
      email: jobs.candidateInput.email,
      githubUserId: profile.githubUserId,
      githubLogin: profile.githubLogin,
      education: jobs.candidateInput.education,
      interests,
      experience: jobs.candidateInput.experience,
      stage,
      matchId: match.matchId,
      senderPrivateKey: keys.encryptionPrivateKey,
      recipientPublicKey: match.recruiterEncPubKey,
    });

    const newMessages = [
      {
        recipientPublicKey: match.recruiterEncPubKey,
        encryptedMessage: jubSignalMessage,
      },
    ];
    // send jubSignal messages
    await loadMessages({
      forceRefresh: false,
      messageRequests: newMessages,
    });

    jobs.candidateAcceptedMatchIds = [...acceptedIds, match.matchId];
    setAcceptedIds(jobs.candidateAcceptedMatchIds);
    toast.success("You have accepted the match. Your contact will be shared.");
    saveJobs(jobs);
  };

  const validMatches = matches.filter((match) => match.isMatch);
  const pendingMatches = validMatches.filter(
    (match) => !acceptedIds.includes(match.matchId)
  );
  const acceptedMatches = validMatches.filter((match) =>
    acceptedIds.includes(match.matchId)
  );

  return (
    <>
      <Modal
        isOpen={showJobDetailModal && match !== undefined}
        setIsOpen={setShowJobDetailModal}
        withBackButton
      >
        <FormStepLayout
          className="h-full"
          actions={
            <div className="flex flex-col gap-2 text-center">
              <Button
                className="mt-20"
                onClick={async () => await handleAccept(match!)}
              >
                Share your contact
              </Button>
              <span className=" text-secondary text-sm font-inter font-medium">
                This recruiter will receive your email.
              </span>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <Card.Base
              className="!border-white/20 !rounded-none bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/shapes/card-shape-2.svg')",
              }}
            >
              <div className="flex flex-col py-4 px-3 min-h-[180px]">
                <h5 className="mt-auto text-white font-inter font-semibold text-xl leading-6">
                  {match!.role}
                </h5>
              </div>
            </Card.Base>
            {/* <div className="flex flex-col gap-1">
              <Title>Level</Title>
              <Description>level</Description>
            </div> */}
            <div className="flex flex-col gap-1">
              <Title>Recruiter</Title>
              <Description>{match!.recruiterDisplayName}</Description>
            </div>
            <Link href={match!.jobLink} target="_blank">
              <LinkCard className="flex w-full items-center justify-between">
                <span className="text-white font-medium font-inter text-xs">
                  Job description
                </span>
                <Icons.ExternalLink className="text-white" />
              </LinkCard>
            </Link>
          </div>
        </FormStepLayout>
      </Modal>
      <Tabs
        items={[
          {
            label: "Opportunities",
            children: (
              <div className="flex flex-col h-full">
                {pendingMatches.length === 0 ? (
                  <span className="mt-20 text-white/50 text-xs text-center">
                    No opportunities yet.{" "}
                  </span>
                ) : (
                  <div className="flex flex-col w-full">
                    {pendingMatches.map((match, index) => (
                      <OpportunityCard
                        key={index}
                        label={match.role}
                        description={match.project}
                        onClick={() => {
                          setShowJobDetailModal(true);
                          setMatch(match);
                        }}
                      />
                    ))}
                    {/* <OpportunityCard
                      label="Software Engineer"
                      description="Reth"
                      onClick={() => {
                        setShowJobDetailModal(true);
                      }}
                    />
                    <OpportunityCard
                      label="ZK Circuits Engineer"
                      description="Axiom"
                      onClick={() => {
                        setShowJobDetailModal(true);
                      }}
                    /> */}
                  </div>
                )}
              </div>
            ),
          },
          {
            label: "You opted-in",
            children: (
              <div className="flex flex-col h-full">
                {acceptedMatches.length === 0 ? (
                  <span className="mt-20 text-white/50 text-xs text-center">
                    No opted-in yet.{" "}
                  </span>
                ) : (
                  <div className="flex flex-col w-full">
                    {acceptedMatches.map((match, index) => (
                      <OpportunityCard
                        key={index}
                        label={match.role}
                        description={match.project}
                        onClick={() => {
                          setShowJobDetailModal(true);
                          setMatch(match);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      ></Tabs>
    </>
  );
}
