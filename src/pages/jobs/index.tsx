import CandidateJobsView from "@/components/jobs/CandidateJobsView";
import CandidatePage, {
  JobCandidateInput,
} from "@/components/jobs/CandidatePage";
import JobsEntryPage from "@/components/jobs/JobsEntryPage";
import RecruiterMatchView from "@/components/jobs/RecruiterMatchView";
import RecruiterPage, {
  JobRecruiterInput,
} from "@/components/jobs/RecruiterPage";
import { getAuthToken, getProfile, getUsers } from "@/lib/client/localStorage";
import { getJobs, saveJobs } from "@/lib/client/localStorage/jobs";
import React, { useEffect, useState } from "react";
import { CandidateJobMatch } from "../api/jobs/get_candidate_matches";
import { toast } from "sonner";

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
  const [publicKeyLink, setPublicKeyLink] = useState<string>();
  const [privateKey, setPrivateKey] = useState<string>();
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

  const generateJobsKeys = async (): Promise<{
    publicKeyLink: string;
    privateKey: string;
  }> => {
    // TODO: generate a public and private key pair
    const publicKey = "pub";
    const privateKey = "priv";
    // TODO: upload the public key to the server
    const publicKeyLink = "pubLink";
    return {
      publicKeyLink,
      privateKey,
    };
  };

  const handleIsCandidate = async () => {
    setDisplayState(JobsDisplayState.CANDIDATE_FORM);
    const { publicKeyLink, privateKey } = await generateJobsKeys();
    setPublicKeyLink(publicKeyLink);
    setPrivateKey(privateKey);
  };

  const handleIsRecruiter = async () => {
    setDisplayState(JobsDisplayState.RECRUITER_FORM);
    const { publicKeyLink, privateKey } = await generateJobsKeys();
    setPublicKeyLink(publicKeyLink);
    setPrivateKey(privateKey);
  };

  const handleSubmitCandidateInput = async (
    candidateInput: JobCandidateInput
  ) => {
    if (!publicKeyLink || !privateKey) {
      toast.error("Error generating keys");
      return;
    }

    const authToken = getAuthToken();
    if (!authToken || authToken.expiresAt < new Date()) {
      toast.error("You must be logged in to submit a candidate profile");
      return;
    }

    // TODO: upload encrypted candidate input to the server
    const encryptedCandidateInput = candidateInput;
    const encryptedCandidateInputLink = candidateInput;

    const response = await fetch("/api/jobs/new_candidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authToken: authToken.value,
        jobsPublicKeyLink: publicKeyLink,
        jobsEncryptedDataLink: encryptedCandidateInputLink,
        isCandidate: true,
      }),
    });

    if (!response.ok) {
      toast.error("Error submitting candidate profile");
      return;
    }

    // update local storage with user jobs profile
    // TODO: send jubsignal message to self
    saveJobs({ jobsPrivateKey: privateKey, candidateInput });
    setDisplayState(JobsDisplayState.CANDIDATE_MATCHES);
    toast.success("Your candidate profile has been added.");
    console.log("submitted candidate profile", candidateInput);
  };

  const handleSubmitRecruiterInput = async (
    recruiterInput: JobRecruiterInput
  ) => {
    if (!publicKeyLink || !privateKey) {
      toast.error("Error generating keys");
      return;
    }

    const authToken = getAuthToken();
    if (!authToken || authToken.expiresAt < new Date()) {
      toast.error("You must be logged in to submit a candidate profile");
      return;
    }

    const profile = getProfile();
    if (!profile) {
      toast.error("Please try logging in again.");
      return;
    }

    // TODO: upload encrypted recruiter input to the server
    const encryptedRecruiterInput = recruiterInput;
    const encryptedRecruiterInputLink = recruiterInput;

    // send initial list of users to match with
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
        authToken: authToken.value,
        jobsPublicKeyLink: publicKeyLink,
        jobsEncryptedDataLink: encryptedRecruiterInputLink,
        isCandidate: false,
        userEncPubKeys,
      }),
    });

    if (!response.ok) {
      toast.error("Error submitting recruiter profile");
      return;
    }

    // update local storage with user jobs profile
    // TODO: send jubsignal message to self
    saveJobs({ jobsPrivateKey: privateKey, recruiterInput });
    setDisplayState(JobsDisplayState.RECRUITER_MATCHES);
    toast.success("Your recruiter profile has been submitted.");
    console.log("submitted recruiter profile", recruiterInput);
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
