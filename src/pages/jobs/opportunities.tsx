import { AppContent } from "@/components/AppContent";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Input } from "@/components/Input";
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

export default function JobOpportunities() {
  return (
    <AppContent>
      <FormStepLayout
        title="What kind of opportunities are you hiring for?"
        subtitle={
          <span className="block pb-4 text-white/50">
            {`We will show your opportunity to qualifying job seekers who will have the option to match with you.`}
          </span>
        }
        actions={<Button>Save and continue</Button>}
      >
        <div className="flex flex-col gap-4">
          <Input
            label={
              <span className="text-white text-sm pb-2 block">
                Title of role
              </span>
            }
            border="full"
          />
          <Input
            label={
              <span className="text-white text-sm pb-2 block">Add link</span>
            }
            description="To a job description"
            border="full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-white text-sm">Github data</h3>
            <span className="font-normal text-sm leading-5 text-white/50">
              What type of data are you looking for?
            </span>
          </div>
          <Section title="Role">
            <Checkbox id="role" label="Front end" />
            <Checkbox id="role" label="Back end" />
            <Checkbox id="role" label="Full stack" />
          </Section>
        </div>

        <Section title="Job level">
          <Checkbox id="level" label="Junior" />
          <Checkbox id="level" label="Senior" />
          <Checkbox id="level" label="Staff" />
        </Section>
        <Section title="Minimum salary (in thousands)">
          <InputRange id="salary" />
        </Section>
        <Section title="Experience">
          <InputRange id="experience" />
        </Section>
        <Section title="Rust ETH commits">
          <InputRange id="prs" />
        </Section>
        <Section title="PRs">
          <InputRange id="prs" />
        </Section>
        <Section title="Years">
          <InputRange id="years" />
        </Section>
        <Section title="Unique rust-eth repo commits">
          <InputRange id="years" />
        </Section>
      </FormStepLayout>
    </AppContent>
  );
}
