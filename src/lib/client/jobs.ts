import { MessageRequest } from "@/pages/api/messages";
import { encryptRecruiterSharedMessage } from "./jubSignal/recruiterShared";
import { getAuthToken, getKeys, getProfile } from "./localStorage";
import { getJobs, saveJobs } from "./localStorage/jobs";
import { loadMessages } from "./jubSignalClient";

export const recruiterProcessNewMatches = async () => {
  console.log("recruiter processing new matches...");
  const jobs = getJobs();
  if (!jobs) {
    return;
  }

  if (!jobs.recruiterInput || !jobs.jobsPrivateKey) {
    console.log("not recruiter, ending...");
    return;
  }

  const authToken = getAuthToken();
  if (!authToken || authToken.expiresAt < new Date()) {
    return;
  }

  const profile = getProfile();
  const keys = getKeys();
  if (!profile || !keys) {
    return;
  }
  const senderPrivateKey = keys.encryptionPrivateKey;

  // fetch list of all recruiter match ids
  const processedMatchIds = jobs.recruiterProcessedMatchIds || [];
  const response = await fetch(
    `/api/jobs/get_recruiter_matches?authToken=${authToken.value}`
  );
  if (!response.ok) {
    console.error("Failed to fetch recruiter matches");
    return;
  }

  const { matches } = await response.json();
  const newMessages: MessageRequest[] = [];
  const newProcessedMatchIds: number[] = [];
  console.log(
    "recruiter processing new matches, old match ids: ",
    processedMatchIds
  );

  for (const match of matches) {
    if (!processedMatchIds.includes(match.id)) {
      console.log("recruiter processing new match", match.id);

      // TODO: compute decryption share from match results and upload it
      const jobsPrivateKey = jobs.jobsPrivateKey;
      const decryptionShare = match.matchResultsLink;
      const decryptionShareLink = decryptionShare;

      // create a new jubSignal message
      const jubSignalMessage = await encryptRecruiterSharedMessage({
        displayName: profile.displayName,
        encryptionPublicKey: profile.encryptionPublicKey,
        role: jobs.recruiterInput.title,
        project: jobs.recruiterInput.project,
        jobLink: jobs.recruiterInput.link,
        decryptionShareLink,
        matchId: match.id,
        matchResultsLink: match.matchResultsLink,
        senderPrivateKey,
        recipientPublicKey: match.accepterEncPubKey,
      });

      // Add the message to the list
      newMessages.push({
        recipientPublicKey: match.accepterEncPubKey,
        encryptedMessage: jubSignalMessage,
      });

      // Add the id to the new list
      newProcessedMatchIds.push(match.id);
    }
  }

  if (newMessages.length > 0) {
    // send jubSignal messages
    await loadMessages({
      forceRefresh: false,
      messageRequests: newMessages,
    });

    // Update the processed match IDs
    jobs.recruiterProcessedMatchIds = [
      ...processedMatchIds,
      ...newProcessedMatchIds,
    ];

    // Update the local storage
    saveJobs(jobs);
  }
};
