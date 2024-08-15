import { AppContent } from "@/components/AppContent";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Input } from "@/components/Input";
import { InputRange } from "@/components/InputRange";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import React from "react";
import { useForm } from "react-hook-form";
import { Radio } from "../Radio";
import { Section } from "./Section";
import { Banner } from "../Banner";

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
  handleSubmitRecruiterInput: (formValues: JobRecruiterInput) => Promise<void>;
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
    await handleSubmitRecruiterInput(formValues);
  };

  return (
    <FormStepLayout
      childrenClassName="!gap-4 overflow-hidden"
      onSubmit={handleSubmit(onSubmitForm)}
      title={
        <h3 className="font-semibold text-white text-[18px] leading-6">
          What opportunities are you hiring for?
        </h3>
      }
      titleClassName="px-4"
      subtitle={
        <span className="block pb-4 text-white/50">
          {`We will show your opportunity to qualifying job seekers who will have the option to match with you.`}
        </span>
      }
      footer={
        <div className="flex flex-col gap-4 bg-black px-4">
          <Button type="submit">Save and continue</Button>
          <span className="text-center text-secondary text-[12px] font-inter">
            Review your answers. They cannot be edited later.
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-4 mb-8">
        <Section title="Overview" active />
        <Section title="Title of role">
          <Input {...register("title")} border="full" />
        </Section>
        <Section title="Project name">
          <Input {...register("project")} border="full" />
        </Section>
        <Section title="Add link">
          <Input {...register("link")} border="full" />
        </Section>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <Section title="Candidate qualifications" active />
        <Section title="Minimum education">
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
        <Section title="Minimum development experience (in years)">
          <InputRange
            // @ts-ignore
            id="experience"
            // @ts-ignore
            min={1}
            // @ts-ignore
            value={experience}
            max={8}
            moreMax
            onChange={(e: any) => {
              setValue("experience", e?.target?.value);
            }}
          />
        </Section>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <Section title="Opportunity constraints" active />
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
        <Section title="Project stage">
          <div className="grid grid-cols-2 gap-2">
            <Radio
              id="companyStage-1"
              checked={stageParadigm}
              onChange={(checked) => {
                setValue("stageParadigm", checked);
                setValue("stageGrant", false);
                setValue("stageSeed", false);
                setValue("stageSeriesA", false);
              }}
              label="Paradigm project"
            />
            <Radio
              id="companyStage-2"
              label="Grant"
              checked={stageGrant}
              onChange={(checked) => {
                setValue("stageParadigm", false);
                setValue("stageGrant", checked);
                setValue("stageSeed", false);
                setValue("stageSeriesA", false);
              }}
            />
            <Radio
              id="companyStage-3"
              label="Seed"
              checked={stageSeed}
              onChange={(checked) => {
                setValue("stageParadigm", false);
                setValue("stageGrant", false);
                setValue("stageSeed", checked);
                setValue("stageSeriesA", false);
              }}
            />
            <Radio
              id="companyStage-4"
              name="companyStage"
              label="Series A+"
              checked={stageSeriesA}
              onChange={(checked) => {
                setValue("stageParadigm", false);
                setValue("stageGrant", false);
                setValue("stageSeed", false);
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

        <Section title="Annual salary maximum (in thousands)">
          <InputRange
            id="salary"
            min={0}
            max={750}
            moreMax={true}
            // @ts-ignore
            value={salary}
            onChange={(e: any) => {
              setValue("salary", e?.target?.value);
            }}
          />
        </Section>
      </div>
    </FormStepLayout>
  );
}
