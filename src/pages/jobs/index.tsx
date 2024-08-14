import CandidateJobsView from "@/components/jobs/CandidateJobsView";
import CandidatePage, {
  JobCandidateInput,
} from "@/components/jobs/CandidatePage";
import JobsEntryPage from "@/components/jobs/JobsEntryPage";
import RecruiterMatchView from "@/components/jobs/RecruiterMatchView";
import RecruiterPage, {
  JobRecruiterInput,
} from "@/components/jobs/RecruiterPage";
import React, { useState } from "react";

enum JobsDisplayState {
  SELECT_ROLE = "SELECT_ROLE",
  CANDIDATE_FORM = "CANDIDATE_FORM",
  RECRUITER_FORM = "RECRUITER_FORM",
  CANDIDATE_MATCHES = "CANDIDATE_MATCHES",
  RECRUITER_MATCHES = "RECRUITER_MATCHES",
}

const Jobs: React.FC = () => {
  const [displayState, setDisplayState] = useState<JobsDisplayState>(
    JobsDisplayState.SELECT_ROLE
  );

  const handleIsCandidate = () => {
    setDisplayState(JobsDisplayState.CANDIDATE_FORM);
  };

  const handleIsRecruiter = () => {
    setDisplayState(JobsDisplayState.RECRUITER_FORM);
  };

  const handleSubmitCandidateInput = (candidateInput: JobCandidateInput) => {
    setDisplayState(JobsDisplayState.CANDIDATE_MATCHES);
  };

  const handleSubmitRecruiterInput = (recruiterInput: JobRecruiterInput) => {
    setDisplayState(JobsDisplayState.RECRUITER_MATCHES);
  };

  switch (displayState) {
    case JobsDisplayState.SELECT_ROLE:
      return (
        <JobsEntryPage
          handleIsCandidate={handleIsCandidate}
          handleIsRecruiter={handleIsRecruiter}
        />
      );
    case JobsDisplayState.CANDIDATE_FORM:
      return (
        <CandidatePage
          handleSubmitCandidateInput={handleSubmitCandidateInput}
        />
      );
    case JobsDisplayState.RECRUITER_FORM:
      return (
        <RecruiterPage
          handleSubmitRecruiterInput={handleSubmitRecruiterInput}
        />
      );
    case JobsDisplayState.CANDIDATE_MATCHES:
      return <CandidateJobsView />;
    case JobsDisplayState.RECRUITER_MATCHES:
      return <RecruiterMatchView />;
  }
};

export default Jobs;
