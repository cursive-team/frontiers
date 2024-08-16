import { AppContent } from "@/components/AppContent";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Input } from "@/components/Input";
import { InputRange } from "@/components/InputRange";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import { cn } from "@/lib/client/utils";
import React, { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Radio } from "../Radio";
import { getAuthToken, getProfile, getUsers } from "@/lib/client/localStorage";
import { toast } from "sonner";

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
  <div className="flex flex-col gap-">
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

export type JobRecruiterInput = {
  title: string;
  project: string;
  link: string;
  education: "high-school" | "bachelor" | "master" | "phd";
  experience: number;
  tagZk: boolean;
  tagDefi: boolean;
  tagConsumer: boolean;
  tagInfra: boolean;
  salary: number;
  partTime: boolean;
  stageParadigm: boolean;
  stageGrant: boolean;
  stageSeed: boolean;
  stageSeriesA: boolean;
};

interface RecruiterPageProps {
  handleSubmitRecruiterInput: (formValues: JobRecruiterInput) => void;
}

export default function RecruiterPage({
  handleSubmitRecruiterInput,
}: RecruiterPageProps) {
  const { setValue, watch, register, handleSubmit } =
    useForm<JobRecruiterInput>({
      defaultValues: {
        title: "",
        project: "",
        link: "",
        tagConsumer: false,
        tagDefi: false,
        tagInfra: false,
        tagZk: false,
        stageParadigm: false,
        stageGrant: false,
        stageSeed: false,
        stageSeriesA: false,
        partTime: false,
      },
    });

  const education = watch("education", "high-school");
  const experience = watch("experience", 0);
  const interestZk = watch("tagZk", false);
  const interestDefi = watch("tagDefi", false);
  const interestConsumer = watch("tagConsumer", false);
  const interestInfra = watch("tagInfra", false);
  const salary = watch("salary", 0);
  const stageParadigm = watch("stageParadigm", false);
  const stageGrant = watch("stageGrant", false);
  const stageSeed = watch("stageSeed", false);
  const stageSeriesA = watch("stageSeriesA", false);
  const partTime = watch("partTime", false);

  const onSubmitForm = async (formValues: JobRecruiterInput) => {
    const authToken = getAuthToken();
    if (!authToken || authToken.expiresAt < new Date()) {
      toast.error("Please try logging in again.");
      return;
    }

    const profile = getProfile();
    if (!profile) {
      toast.error("Please try logging in again.");
      return;
    }

    const users = getUsers();
    const userEncPubKeys = Object.values(users)
      .filter((user) => user.encPk !== profile.encryptionPublicKey)
      .map((user) => user.encPk);

    const response = await fetch("/api/jobs/new_recruiter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputData: JSON.stringify(formValues),
        authToken: authToken.value,
        userEncPubKeys,
      }),
    });

    if (!response.ok) {
      toast.error("Failed to submit your recruiter profile.");
      return;
    }

    toast.success("Your recruiter profile has been submitted.");
    console.log("submitted recruiter profile", formValues);
    handleSubmitRecruiterInput(formValues);
  };

  return (
    <AppContent>
      <FormStepLayout
        onSubmit={handleSubmit(onSubmitForm)}
        title="What kind of opportunities are you hiring for?"
        childrenClassName="overflow-hidden"
        subtitle={
          <span className="block pb-4 text-white/50">
            {`We will show your opportunity to qualifying job seekers who will have the option to match with you.`}
          </span>
        }
        actions={<Button type="submit">Save and continue</Button>}
      >
        <div className="flex flex-col gap-6">
          <Section title="Title of role">
            <Input {...register("title")} border="full" />
          </Section>
          <Section title="Project name">
            <Input {...register("project")} border="full" />
          </Section>
          <Section title="Add link">
            <Input {...register("link")} border="full" />
          </Section>
          <Section title="Candidate qualifications" active />
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
          <Section title="Minimum experience (in years)">
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
          <Section title="Project tags">
            <div className="grid grid-cols-2 gap-2">
              <Checkbox
                id="interests-1"
                checked={interestZk}
                onChange={(checked) => {
                  setValue("tagZk", checked);
                }}
                label="ZK/MPC"
              />
              <Checkbox
                id="interests-2"
                label="DeFi"
                checked={interestDefi}
                onChange={(checked) => {
                  setValue("tagDefi", checked);
                }}
              />
              <Checkbox
                id="interests-3"
                label="Consumer"
                checked={interestConsumer}
                onChange={(checked) => {
                  setValue("tagConsumer", checked);
                }}
              />
              <Checkbox
                id="interests-4"
                label="Infrastructure"
                checked={interestInfra}
                onChange={(checked) => {
                  setValue("tagInfra", checked);
                }}
              />
            </div>
          </Section>
          <Section title="Opportunity constraints" active />
          <Section title="Annual salary (in thousands)">
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
          <Section title="Project stage">
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

          <Section title="Commitment">
            <Checkbox
              id="commitment"
              name="commitment"
              label="This is a part-time contract"
              checked={partTime}
              onChange={(checked) => {
                setValue("partTime", checked);
              }}
            />
          </Section>
        </div>
      </FormStepLayout>
    </AppContent>
  );
}

RecruiterPage.getInitialProps = () => {
  return { showHeader: false, showFooter: false };
};
