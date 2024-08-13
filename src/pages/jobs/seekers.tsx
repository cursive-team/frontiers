import { AppContent } from "@/components/AppContent";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { InputRange } from "@/components/InputRange";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import React from "react";

const Section = ({ title, children }: any) => (
  <div className="flex flex-col gap-3">
    <h3 className="p-2 bg-gray/20 font-medium text-white text-sm leading-6">
      {title}
    </h3>
    {children}
  </div>
);

export default function JobSearch() {
  return (
    <AppContent>
      <FormStepLayout
        title="What are your qualifications?"
        subtitle={
          <span className="block pb-4 text-white/50">
            {`We will show you opportunities that match your preferences and you can choose if you want to match with a recruiter.`}
          </span>
        }
        actions={<Button>Save and continue</Button>}
      >
        <Section title="Job level">
          <Checkbox id="level" label="Junior" />
          <Checkbox id="level" label="Senior" />
          <Checkbox id="level" label="Staff" />
        </Section>
        <Section title="Minimum salary (in thousands)">
          <InputRange id="salary" />
        </Section>
        <Section title="Experience">
          <InputRange id="salary" />
        </Section>
        <Section title="Constraints">
          <Checkbox id="constraints" label="open-source only" />
        </Section>
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-white text-[21px] leading-6">
            Github data
          </h3>
          <span className="font-normal text-sm leading-5 text-white/50">
            We have pulled the following public commit data from your GitHub, to
            be used in discovering overlap with recruiting opportunities.
          </span>
        </div>
      </FormStepLayout>
    </AppContent>
  );
}
