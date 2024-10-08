import { JobCandidateInput } from "@/components/jobs/CandidatePage";
import {
  deleteFromLocalStorage,
  getFromLocalStorage,
  saveToLocalStorage,
} from ".";
import { JobRecruiterInput } from "@/components/jobs/RecruiterPage";
import { CandidateJobMatch } from "@/components/jobs/CandidateJobsView";
import { RecruiterJobMatch } from "@/components/jobs/RecruiterMatchView";

export const JOBS_STORAGE_KEY = "jobs";

export type Jobs = {
  jobsPrivateKey?: string;
  candidateInput?: JobCandidateInput;
  recruiterInput?: JobRecruiterInput;
  candidateProcessedMatches?: Record<number, CandidateJobMatch>;
  candidateAcceptedMatchIds?: number[];
  candidateRejectedMatchIds?: number[];
  recruiterProcessedMatchIds?: number[];
  recruiterAcceptedMatches?: Record<number, RecruiterJobMatch>;
};

export const saveJobs = (jobs: Jobs): void => {
  saveToLocalStorage(JOBS_STORAGE_KEY, JSON.stringify(jobs));
};

export const getJobs = (): Jobs | undefined => {
  const jobs = getFromLocalStorage(JOBS_STORAGE_KEY);
  if (jobs) {
    return JSON.parse(jobs);
  }

  return undefined;
};

export const deleteJobs = (): void => {
  deleteFromLocalStorage(JOBS_STORAGE_KEY);
};
