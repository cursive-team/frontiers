import { JobCandidateInput } from "@/components/jobs/CandidatePage";
import { JobRecruiterInput } from "@/components/jobs/RecruiterPage";

export const computeJobMatchOutput = async (
  recruiterInput: JobRecruiterInput,
  candidateInput: JobCandidateInput
): Promise<boolean> => {
  if (
    recruiterInput.education === "phd" &&
    candidateInput.education !== "phd"
  ) {
    return false;
  }
  if (
    recruiterInput.education === "master" &&
    candidateInput.education !== "master" &&
    candidateInput.education !== "phd"
  ) {
    return false;
  }
  if (
    recruiterInput.education === "bachelor" &&
    candidateInput.education === "high-school"
  ) {
    return false;
  }
  if (recruiterInput.experience > candidateInput.experience) {
    return false;
  }
  if (recruiterInput.salary < candidateInput.salary) {
    return false;
  }
  return true;
};
