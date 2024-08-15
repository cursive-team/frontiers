import { AppContent } from "@/components/AppContent";
import { Button } from "@/components/Button";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import React from "react";

type JobsEntryPageProps = {
  handleIsCandidate: () => void;
  handleIsRecruiter: () => void;
};

export default function JobsEntryPage({
  handleIsCandidate,
  handleIsRecruiter,
}: JobsEntryPageProps) {
  return (
    <AppContent className="h-full">
      <FormStepLayout
        title={"Private job matching"}
        subtitle={
          <div className="flex flex-col gap-1">
            <span className="block pb-4 text-white/75">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <b>Recruiters</b>: Enter job requirements and privately share
                  them with folks you meet using MPC.
                </li>
                <li>
                  <b>Candidates</b>: Enter your job preferences and compare them
                  privately with opportunities to discover matches.{" "}
                  <i>Recruiters never see a match without your approval.</i>
                </li>
              </ul>
            </span>

            <span className="text-[12px] text-white/50 leading-snug">
              This is an experimental feature that Cursive is testing at
              Frontiers. Your data is encrypted using{" "}
              <a
                href="https://github.com/gausslabs/phantom-zone"
                target="_blank"
                rel="noopener noreferrer"
              >
                <u>phantom-zone</u>
              </a>
              , a new and unaudited Multi-Party FHE Rust VM.
            </span>
          </div>
        }
        className="pt-4 h-full"
        //onSubmit={handleSubmitWithPassword}
        footer={
          <div className="flex flex-col gap-4">
            <Button variant="black" onClick={handleIsRecruiter}>
              {`I'm recruiting for a role`}
            </Button>

            <span className="h-6 relative font-normal text-sm text-white font-inter text-center">
              <div className="after:content-[''] after:top-[12px] after:absolute after:h-[1px] after:bg-white/40 after:w-full after:left-0"></div>
              <div className="absolute right-1/2 translate-x-3 bg-black px-2 z-10">
                or
              </div>
            </span>
            <Button
              variant="black"
              onClick={handleIsCandidate}
            >{`I'm a candidate for new roles`}</Button>
          </div>
        }
      />
    </AppContent>
  );
}
