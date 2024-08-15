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
import React, { ReactNode, useEffect, useState } from "react";
import { CandidateJobMatch } from "../api/jobs/get_candidate_matches";
import { Modal } from "@/components/modals/Modal";

enum JobsDisplayState {
  SELECT_ROLE = "SELECT_ROLE",
  CANDIDATE_FORM = "CANDIDATE_FORM",
  RECRUITER_FORM = "RECRUITER_FORM",
  CANDIDATE_MATCHES = "CANDIDATE_MATCHES",
  RECRUITER_MATCHES = "RECRUITER_MATCHES",
}

const Jobs: React.FC = () => {
  const [candidateModal, setCandidateModal] = useState(false);
  const [recruiterModal, setRecruiterModal] = useState(false);
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
    setCandidateModal(true);
  };

  const handleIsRecruiter = () => {
    setRecruiterModal(true);
  };

  const handleSubmitCandidateInput = (candidateInput: JobCandidateInput) => {
    saveJobs({ candidateInput });
    setCandidateModal(false);
    setDisplayState(JobsDisplayState.CANDIDATE_MATCHES);
  };

  const handleSubmitRecruiterInput = (recruiterInput: JobRecruiterInput) => {
    saveJobs({ recruiterInput });
    setRecruiterModal(false);
    setDisplayState(JobsDisplayState.RECRUITER_MATCHES);
  };

  const JobViewMapping: Partial<Record<JobsDisplayState, ReactNode>> = {
    [JobsDisplayState.SELECT_ROLE]: (
      <JobsEntryPage
        handleIsCandidate={handleIsCandidate}
        handleIsRecruiter={handleIsRecruiter}
      />
    ),
    [JobsDisplayState.CANDIDATE_MATCHES]: (
      <CandidateJobsView pendingMatches={pendingMatches} />
    ),
    [JobsDisplayState.RECRUITER_MATCHES]: (
      <RecruiterMatchView matches={matches} />
    ),
  };

  return (
    <>
      <Modal
        withBackButton
        isOpen={recruiterModal}
        setIsOpen={setRecruiterModal}
      >
        <RecruiterPage
          handleSubmitRecruiterInput={handleSubmitRecruiterInput}
        />
      </Modal>
      <Modal
        withBackButton
        isOpen={candidateModal}
        setIsOpen={setCandidateModal}
      >
        <CandidatePage
          handleSubmitCandidateInput={handleSubmitCandidateInput}
        />
      </Modal>
      {JobViewMapping[displayState]}
    </>
  );
};

export default Jobs;
