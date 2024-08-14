import { AppContent } from "@/components/AppContent";
import { Button } from "@/components/Button";
import { Card } from "@/components/cards/Card";
import { Icons } from "@/components/Icons";
import { Modal } from "@/components/modals/Modal";
import { Tabs } from "@/components/Tabs";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import { classed } from "@tw-classed/react";
import Link from "next/link";
import React, { useState } from "react";

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
export default function CandidateJobsView() {
  const [showJobDetailModal, setShowJobDetailModal] = useState(false);
  const hasOpportunities = true;
  const hasOptedIn = true;

  return (
    <>
      <Modal
        isOpen={showJobDetailModal}
        setIsOpen={setShowJobDetailModal}
        withBackButton
      >
        <FormStepLayout
          className="h-full"
          actions={
            <div className="flex flex-col gap-2 text-center">
              <Button className="mt-20">Share your contact</Button>
              <span className=" text-secondary text-sm font-inter font-medium">
                This recruiter will receive your Telegram handle.
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
                  Opportunity title
                </h5>
              </div>
            </Card.Base>
            <div className="flex flex-col gap-1">
              <Title>Level</Title>
              <Description>level</Description>
            </div>
            <Link href={"#"} target="_blank">
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
                {!hasOpportunities ? (
                  <span className="mt-20 text-white/50 text-xs text-center">
                    No opportunities yet.{" "}
                  </span>
                ) : (
                  <div className="flex flex-col w-full">
                    <OpportunityCard
                      label="opportunity 1"
                      description="example"
                      onClick={() => {
                        setShowJobDetailModal(true);
                      }}
                    />
                    <OpportunityCard
                      label="opportunity 2"
                      description="example"
                      onClick={() => {
                        setShowJobDetailModal(true);
                      }}
                    />
                  </div>
                )}
              </div>
            ),
          },
          {
            label: "You opted-in",
            children: (
              <div className="flex flex-col h-full">
                {!hasOptedIn ? (
                  <span className="mt-20 text-white/50 text-xs text-center">
                    No opted-in yet.{" "}
                  </span>
                ) : (
                  <div className="flex flex-col w-full">
                    <OpportunityCard
                      label="opportunity opted 1"
                      description="example"
                      onClick={() => {
                        setShowJobDetailModal(true);
                      }}
                    />
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
