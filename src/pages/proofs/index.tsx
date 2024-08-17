import { Placeholder } from "@/components/placeholders/Placeholder";
import { QuestCard } from "@/components/cards/QuestCard";
import { LoadingWrapper } from "@/components/wrappers/LoadingWrapper";
import { useFetchQuests } from "@/hooks/useFetchQuests";

import Link from "next/link";
import React, { useMemo, useRef, useState } from "react";

import { QuestWithCompletion } from "@/types";
import { getPinnedQuest } from "@/lib/client/localStorage/questPinned";
import { useQuestRequirements } from "@/hooks/useQuestRequirements";
import { AppContent } from "@/components/AppContent";

export default function QuestsPage() {
  const pinnedQuests = useRef<Set<number>>(getPinnedQuest());
  const { isLoading, data: allQuests = [] } = useFetchQuests();

  const displayQuests: QuestWithCompletion[] = useMemo(() => {
    const unorderedQuests = allQuests.filter((quest) => !quest.isHidden);
    const quests = unorderedQuests.sort((a, b) => b.priority - a.priority);
    // We want to restrict proofs to have one requirement
    const singleRequirementQuests = quests.filter(
      (quest) =>
        (quest.userRequirements.length === 1 &&
          quest.locationRequirements.length === 0) ||
        (quest.locationRequirements.length === 1 &&
          quest.userRequirements.length === 0)
    );

    const pinnedQuest = singleRequirementQuests.filter((quest) =>
      pinnedQuests.current.has(quest.id)
    );
    const notPinnedQuest = singleRequirementQuests.filter(
      (quest) => !pinnedQuests.current.has(quest.id)
    );

    return [...pinnedQuest, ...notPinnedQuest];
  }, [allQuests, pinnedQuests]);

  const { numRequirementsSatisfied } = useQuestRequirements(displayQuests);

  return (
    <AppContent className="flex flex-col gap-4 pt-4">
      <span className="text-white/75 font-inter text-sm">
        Post proofs about your Frontiers experience on Twitter, while preserving
        privacy over the people you met.
      </span>

      <LoadingWrapper
        className="flex flex-col gap-4"
        isLoading={isLoading}
        fallback={<Placeholder.List items={3} />}
        noResultsLabel="No proofs found"
      >
        <>
          {displayQuests.map(
            (
              {
                id,
                name,
                description,
                userRequirements,
                locationRequirements,
                isCompleted = false,
                userTapReq,
              }: QuestWithCompletion,
              index
            ) => {
              const key = `${id}-${index}`;

              if (name === "🎤 Speaker Whisperer") {
                return null;
              }

              return (
                <Link href={`/proofs/${id}`} key={key}>
                  <QuestCard
                    title={name}
                    description={
                      <span className="text-white/50">{description}</span>
                    }
                    userTapReqCount={userTapReq ? 1 : 0}
                    completedReqs={numRequirementsSatisfied[index]}
                    userRequirements={userRequirements}
                    locationRequirements={locationRequirements}
                    isCompleted={isCompleted}
                    isPinned={pinnedQuests.current.has(id)}
                  />
                </Link>
              );
            }
          )}
        </>
      </LoadingWrapper>
    </AppContent>
  );
}
