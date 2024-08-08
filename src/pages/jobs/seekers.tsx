import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
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
      <Section title="Minimum salary (in thousands)"></Section>
      <Section title="Experience"></Section>
      <Section title="Constraints">
        <Checkbox id="constraints" label="open-source only" />
      </Section>
    </FormStepLayout>
  );
}
