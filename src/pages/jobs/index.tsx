import CandidateJobsView from "@/components/jobs/CandidateJobsView";
import CandidatePage, {
  JobCandidateInput,
} from "@/components/jobs/CandidatePage";
import JobsEntryPage from "@/components/jobs/JobsEntryPage";
import RecruiterMatchView from "@/components/jobs/RecruiterMatchView";
import RecruiterPage, {
  JobRecruiterInput,
} from "@/components/jobs/RecruiterPage";
import { getAuthToken } from "@/lib/client/localStorage";
import { getJobs, saveJobs } from "@/lib/client/localStorage/jobs";
import React, { useEffect, useState } from "react";
import { CandidateJobMatch } from "../api/jobs/get_candidate_matches";

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
  const [pendingMatches, setPendingMatches] = useState<CandidateJobMatch[]>([]);
  const [matches, setMatches] = useState<CandidateJobMatch[]>([]);

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken || authToken.expiresAt < new Date()) {
      return;
    }

    const fetchMatches = async () => {
      const jobs = getJobs();
      if (jobs) {
        if (jobs.candidateInput) {
          const response = await fetch(
            `/api/jobs/get_candidate_matches?authToken=${authToken.value}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch candidate matches");
          }
          const data = await response.json();
          if (data.matches) {
            setPendingMatches(data.matches);
          }
          setDisplayState(JobsDisplayState.CANDIDATE_MATCHES);
        } else if (jobs.recruiterInput) {
          const response = await fetch(
            `/api/jobs/get_recruiter_matches?authToken=${authToken.value}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch recruiter matches");
          }
          const data = await response.json();
          if (data.matches) {
            setMatches(data.matches);
          }
          setDisplayState(JobsDisplayState.RECRUITER_MATCHES);
        }
      }
    };

    fetchMatches();
  }, []);

  const handleIsCandidate = () => {
    setDisplayState(JobsDisplayState.CANDIDATE_FORM);
  };

  const handleIsRecruiter = () => {
    setDisplayState(JobsDisplayState.RECRUITER_FORM);
  };

  const handleSubmitCandidateInput = (candidateInput: JobCandidateInput) => {
    saveJobs({ candidateInput });
    setDisplayState(JobsDisplayState.CANDIDATE_MATCHES);
  };

  const handleSubmitRecruiterInput = (recruiterInput: JobRecruiterInput) => {
    saveJobs({ recruiterInput });
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
      return <CandidateJobsView pendingMatches={pendingMatches} />;
    case JobsDisplayState.RECRUITER_MATCHES:
      return <RecruiterMatchView matches={matches} />;
  }
};

export default Jobs;
