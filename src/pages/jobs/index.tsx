import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import Link from "next/link";
import React from "react";

export default function Jobs() {
  return (
    <FormStepLayout
      title="Private job networking"
      subtitle={
        <span className="block pb-4 text-white/50">
          {`As a job searcher, enter your preferences and store them privately. As a recruiter, enter your requirements and send out a query with MPC to get private matches. Searchers have to mark “interested” in a job opportunity for the recruiter to learn anything.`}
        </span>
      }
      className="pt-4"
      //onSubmit={handleSubmitWithPassword}
      footer={
        <div className="flex flex-col gap-4 px-4">
          <Link href="/jobs/opportunities">
            <Button variant="black" type="submit">
              {`I'm hiring`}
            </Button>
          </Link>

          <span className="h-6 relative font-normal text-sm text-white font-inter text-center">
            <div className="after:content-[''] after:top-[12px] after:absolute after:h-[1px] after:bg-white/40 after:w-full after:left-0"></div>
            <div className="absolute right-1/2 translate-x-3 bg-black px-2 z-10">
              or
            </div>
          </span>
          <Link href="/jobs/seekers">
            <Button variant="black">{`I'm open to opportunities`}</Button>
          </Link>
        </div>
      }
    />
  );
}
