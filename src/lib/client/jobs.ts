import { MessageRequest } from "@/pages/api/messages";
import { encryptRecruiterSharedMessage } from "./jubSignal/recruiterShared";
import { getAuthToken, getKeys, getProfile } from "./localStorage";
import { getJobs, saveJobs } from "./localStorage/jobs";
import { loadMessages } from "./jubSignalClient";
import { deserializeMPCData, serializeMPCData } from "./mpc";
import init, {
  ni_hiring_client_dec_share_web,
  ni_hiring_init_web,
} from "@/lib/ni_hiring_web";

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
    "recruiter processing new matches",
    matches,
    "old match ids",
    processedMatchIds
  );

  for (const match of matches) {
    if (!processedMatchIds.includes(match.id)) {
      console.log("recruiter processing new match", match.id);

      const jobsPrivateKey = deserializeMPCData(jobs.jobsPrivateKey);
      const fheResResponse = await fetch(match.matchResultsLink);
      const fheRes = deserializeMPCData(await fheResResponse.text());

      console.log(fheRes, jobsPrivateKey);

      await init();
      try {
        ni_hiring_init_web(BigInt(1));
      } catch (e) {}

      const decryptionShare = ni_hiring_client_dec_share_web(
        jobsPrivateKey,
        fheRes
      );

      const decryptionShareLink = serializeMPCData(decryptionShare);
      console.log("decryption share link: ", decryptionShareLink);
      console.log("match", match);

      // add other information
      const tags = [];
      if (jobs.recruiterInput.tagZk) {
        tags.push("ZK");
      }
      if (jobs.recruiterInput.tagDefi) {
        tags.push("DeFi");
      }
      if (jobs.recruiterInput.tagConsumer) {
        tags.push("Consumer");
      }
      if (jobs.recruiterInput.tagInfra) {
        tags.push("Infra");
      }
      const allTags = tags.join(", ");

      let stage = "";
      if (jobs.recruiterInput.stageParadigm) {
        stage = "Paradigm";
      }
      if (jobs.recruiterInput.stageGrant) {
        stage = "Grant";
      }
      if (jobs.recruiterInput.stageSeed) {
        stage = "Seed";
      }
      if (jobs.recruiterInput.stageSeriesA) {
        stage = "Series A+";
      }

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
        jobTags: allTags === "" ? "None" : allTags,
        jobStage: stage === "" ? "None" : stage,
        jobExperience: jobs.recruiterInput.experience || 1,
        jobPartTime: jobs.recruiterInput.partTime || false,
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
