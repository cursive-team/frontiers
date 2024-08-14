import { AppContent } from "@/components/AppContent";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Input } from "@/components/Input";
import { InputRange } from "@/components/InputRange";
import { Radio } from "@/components/Radio";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import { getAuthToken } from "@/lib/client/localStorage";
import { cn } from "@/lib/client/utils";
import { toggleArrayElement } from "@/lib/shared/utils";
import { register } from "module";
import React, { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export type JobCandidateInput = {
  education: "high-school" | "bachelor" | "master" | "phd";
  experience: number;
  interestZk: boolean;
  interestDefi: boolean;
  interestConsumer: boolean;
  interestInfra: boolean;
  salary: number;
  stageParadigm: boolean;
  stageGrant: boolean;
  stageSeed: boolean;
  stageSeriesA: boolean;
  partTime: boolean;
  email: string;
};

interface SectionProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  active?: boolean; // add background to label
}
const Section = ({
  title,
  children,
  active = false,
  description,
}: SectionProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex flex-col gap-1">
      {title && (
        <h3
          className={cn(
            "py-2 text-sm leading-6",
            active
              ? "bg-gray/20 font-medium text-white px-2"
              : "font-normal text-white/75"
          )}
        >
          {title}
        </h3>
      )}
      {description && (
        <span className="font-normal text-sm leading-5 text-white/50">
          {description}
        </span>
      )}
    </div>
    <div className="flex flex-col gap-1">{children}</div>
  </div>
);

interface CandidatePageProps {
  handleSubmitCandidateInput: (formValues: JobCandidateInput) => void;
}

export default function CandidatePage({
  handleSubmitCandidateInput,
}: CandidatePageProps) {
  const { setValue, watch, register, handleSubmit } =
    useForm<JobCandidateInput>({
      defaultValues: {
        education: "bachelor",
        experience: 0,
        interestZk: false,
        interestDefi: false,
        interestConsumer: false,
        interestInfra: false,
        salary: 0,
        stageParadigm: false,
        stageGrant: false,
        stageSeed: false,
        stageSeriesA: false,
        partTime: false,
        email: "",
      },
    });

  const education = watch("education", "high-school");
  const experience = watch("experience", 0);
  const interestZk = watch("interestZk", false);
  const interestDefi = watch("interestDefi", false);
  const interestConsumer = watch("interestConsumer", false);
  const interestInfra = watch("interestInfra", false);
  const salary = watch("salary", 0);
  const stageParadigm = watch("stageParadigm", false);
  const stageGrant = watch("stageGrant", false);
  const stageSeed = watch("stageSeed", false);
  const stageSeriesA = watch("stageSeriesA", false);
  const partTime = watch("partTime", false);

  const onSubmitForm = async (formValues: JobCandidateInput) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formValues.email || !emailRegex.test(formValues.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const authToken = getAuthToken();
    if (!authToken || authToken.expiresAt < new Date()) {
      toast.error("Please try logging in again.");
      return;
    }

    const response = await fetch("/api/jobs/new_candidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputData: JSON.stringify(formValues),
        authToken: authToken.value,
      }),
    });

    if (!response.ok) {
      toast.error("Failed to submit your candidate profile.");
      return;
    }

    toast.success("Your candidate profile has been submitted.");
    handleSubmitCandidateInput(formValues);
  };

  return (
    <AppContent className="overflow-hidden">
      <FormStepLayout
        childrenClassName="!gap-4"
        onSubmit={handleSubmit(onSubmitForm)}
        title="Candidate profile"
        subtitle={
          <span className="block pb-4 text-white/50">
            {`We will show you opportunities that match your preferences and you can choose if you want to match with a recruiter.`}
          </span>
        }
        footer={
          <div className="flex flex-col gap-2 bg-black">
            <Button type="submit">Save and continue</Button>
            <span className="text-center text-secondary text-sm font-inter">
              Review your answers. They cannot be edited later.
            </span>
          </div>
        }
      >
        <Banner title="Your info is encrypted until you share it." />
        <Section title="What are your qualifications?" active />
        <Section title="Education">
          <div className="grid grid-cols-2 gap-2">
            <Radio
              id="education-1"
              label="High school"
              value="high-school"
              checked={education === "high-school"}
              onChange={() => {
                setValue("education", "high-school");
              }}
            />
            <Radio
              id="education-2"
              label="Bachelor's"
              checked={education === "bachelor"}
              onChange={() => {
                setValue("education", "bachelor");
              }}
            />
            <Radio
              id="education-3"
              label="Master's"
              checked={education === "master"}
              onChange={() => {
                setValue("education", "master");
              }}
            />
            <Radio
              id="education-4"
              label="PhD"
              checked={education === "phd"}
              onChange={() => {
                setValue("education", "phd");
              }}
            />
          </div>
        </Section>
        <Section title="Experience (in years)">
          <InputRange
            // @ts-ignore
            id="experience"
            // @ts-ignore
            min={0}
            // @ts-ignore
            value={experience}
            max={8}
            moreMax
            onChange={(e: any) => {
              setValue("experience", e?.target?.value);
            }}
          />
        </Section>

        <Section title="What opportunities are you seeking?" active />

        <Section title="Interests">
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              id="interests-1"
              checked={interestZk}
              onChange={(checked) => {
                setValue("interestZk", checked);
              }}
              label="ZK/MPC"
            />
            <Checkbox
              id="interests-2"
              label="DeFi"
              checked={interestDefi}
              onChange={(checked) => {
                setValue("interestDefi", checked);
              }}
            />
            <Checkbox
              id="interests-3"
              label="Consumer"
              checked={interestConsumer}
              onChange={(checked) => {
                setValue("interestConsumer", checked);
              }}
            />
            <Checkbox
              id="interests-4"
              label="Infrastructure"
              checked={interestInfra}
              onChange={(checked) => {
                setValue("interestInfra", checked);
              }}
            />
          </div>
        </Section>
        <Section title="Salary (in thousands)">
          <InputRange
            id="salary"
            min={0}
            max={600}
            // @ts-ignore
            value={salary}
            onChange={(e: any) => {
              setValue("salary", e?.target?.value);
            }}
          />
        </Section>
        <Section title="Company stage">
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              id="companyStage-1"
              checked={stageParadigm}
              onChange={(checked) => {
                setValue("stageParadigm", checked);
              }}
              label="Paradigm project"
            />
            <Checkbox
              id="companyStage-2"
              label="Grant"
              checked={stageGrant}
              onChange={(checked) => {
                setValue("stageGrant", checked);
              }}
            />
            <Checkbox
              id="companyStage-3"
              label="Seed"
              checked={stageSeed}
              onChange={(checked) => {
                setValue("stageSeed", checked);
              }}
            />
            <Checkbox
              id="companyStage-4"
              name="companyStage"
              label="Series A+"
              checked={stageSeriesA}
              onChange={(checked) => {
                setValue("stageSeriesA", checked);
              }}
            />
          </div>
        </Section>

        <Section title="Commitment" active>
          <Checkbox
            id="commitment"
            name="commitment"
            label="I'm open to part-time roles"
            checked={partTime}
            onChange={(checked) => {
              setValue("partTime", checked);
            }}
          />
        </Section>

        <Section
          title="Contact info"
          description="Choose how you would like to be contacted by recruiters."
          active
        />

        <Section title="Email">
          <Input {...register("email")} border="full" />
        </Section>
      </FormStepLayout>
    </AppContent>
  );
}