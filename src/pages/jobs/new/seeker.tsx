import { AppContent } from "@/components/AppContent";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Input } from "@/components/Input";
import { InputRange } from "@/components/InputRange";
import { Radio } from "@/components/Radio";
import { FormStepLayout } from "@/layouts/FormStepLayout";
import { cn } from "@/lib/client/utils";
import { toggleArrayElement } from "@/lib/shared/utils";
import { register } from "module";
import React, { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";

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

export default function JobSeekerPage() {
  const { setValue, watch, register, handleSubmit } = useForm({
    defaultValues: {
      experience: 0,
      salary: 0,
      email: "",
      education: "",
      field: [],
      companyStage: [],
      socials: [],
    },
  });

  const education = watch("education", "");
  const experience = watch("experience", 0);
  const salary = watch("salary", 0);
  const field: string[] = watch("field", []) ?? [];
  const companyStage: string[] = watch("companyStage", []);
  const socials: string[] = watch("socials", []);

  const onSubmitForm = (formValues: any) => {
    console.log("formValues => ", formValues);
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
              label="Master's"
              checked={education === "master"}
              onChange={() => {
                setValue("education", "master");
              }}
            />
            <Radio
              id="education-3"
              label="Bachelor's"
              checked={education === "bachelor"}
              onChange={() => {
                setValue("education", "bachelor");
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
        <Section title="Fields">
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              id="field-1"
              checked={field.includes("computer-science")}
              onChange={(checked) => {
                setValue(
                  "field",
                  toggleArrayElement(field, "computer-science") as any
                );
              }}
              label="Computer Science"
            />
            <Checkbox
              id="field-2"
              label="Math"
              checked={field.includes("math")}
              onChange={(checked) => {
                setValue("field", toggleArrayElement(field, "math") as any);
              }}
            />
            <Checkbox
              id="field-3"
              label="Physics"
              checked={field.includes("physics")}
              onChange={(checked) => {
                setValue("field", toggleArrayElement(field, "physics") as any);
              }}
            />
            <Checkbox
              id="field-4"
              label="Other"
              checked={field.includes("other")}
              onChange={(checked) => {
                setValue("field", toggleArrayElement(field, "other") as any);
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
        <Section title="Interests">
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              id="interests-1"
              checked={field.includes("zl-mpc")}
              onChange={(checked) => {
                setValue("field", toggleArrayElement(field, "zl-mpc") as any);
              }}
              label="ZL/MPC"
            />
            <Checkbox
              id="interests-2"
              label="Defi"
              checked={field.includes("defi")}
              onChange={(checked) => {
                setValue("field", toggleArrayElement(field, "defi") as any);
              }}
            />
            <Checkbox
              id="interests-3"
              label="Consumer"
              checked={field.includes("consumer")}
              onChange={(checked) => {
                setValue("field", toggleArrayElement(field, "consumer") as any);
              }}
            />
            <Checkbox
              id="interests-4"
              label="Infrastructure"
              checked={field.includes("infrastructure")}
              onChange={(checked) => {
                setValue(
                  "field",
                  toggleArrayElement(field, "infrastructure") as any
                );
              }}
            />
          </div>
        </Section>

        <Section title="What opportunities are you seeking?" active />

        <Section title="Salary (in thousands)">
          <InputRange
            id="salary"
            min={10}
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
              checked={companyStage?.includes("open-source")}
              value="open-source"
              onChange={() => {
                setValue(
                  "companyStage",
                  toggleArrayElement(companyStage, "open-source") as any
                );
              }}
              label="Open source"
            />
            <Checkbox
              id="companyStage-2"
              label="Seed"
              checked={companyStage?.includes("seed")}
              value="seed"
              onChange={() => {
                setValue(
                  "companyStage",
                  toggleArrayElement(companyStage, "seed") as any
                );
              }}
            />
            <Checkbox
              id="companyStage-3"
              label="Series A"
              value="series-a"
              checked={companyStage?.includes("series-a")}
              onChange={() => {
                setValue(
                  "companyStage",
                  toggleArrayElement(companyStage, "series-a") as any
                );
              }}
            />
            <Checkbox
              id="companyStage-4"
              name="companyStage"
              value="series-c"
              label="Series C+"
              checked={companyStage?.includes("series-c")}
              onChange={() => {
                setValue(
                  "companyStage",
                  toggleArrayElement(companyStage, "series-c") as any
                );
              }}
            />
          </div>
        </Section>

        <Section
          title="Github data"
          description="We'll use public data from your connected account to identify recruiting opportunities"
          active
        />

        <Section
          title="Contact info"
          description="Choose how you would like to be contacted by recruiters."
          active
        />

        <Section title="Email">
          <Input {...register("email")} border="full" />
        </Section>

        <Section title="Your Socials">
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              id="social-1"
              checked={socials?.includes("telegram")}
              value="telegram"
              onChange={() => {
                setValue(
                  "socials",
                  toggleArrayElement(socials, "telegram") as any
                );
              }}
              label="Telegram"
            />
            <Checkbox
              id="social-2"
              checked={socials?.includes("x")}
              value="x"
              onChange={() => {
                setValue("socials", toggleArrayElement(socials, "x") as any);
              }}
              label="X"
            />
            <Checkbox
              id="social-3"
              checked={socials?.includes("farcaster")}
              value="farcaster"
              onChange={() => {
                setValue(
                  "socials",
                  toggleArrayElement(socials, "farcaster") as any
                );
              }}
              label="Farcaster"
            />
          </div>
        </Section>
      </FormStepLayout>
    </AppContent>
  );
}
