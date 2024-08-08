import { Placeholder } from "@/components/placeholders/Placeholder";
import { QuestCard } from "@/components/cards/QuestCard";
import { LoadingWrapper } from "@/components/wrappers/LoadingWrapper";
import { useFetchQuests } from "@/hooks/useFetchQuests";

import Link from "next/link";
import React, { useMemo, useRef, useState } from "react";

import { QuestWithCompletion } from "@/types";
import { getPinnedQuest } from "@/lib/client/localStorage/questPinned";
import { useQuestRequirements } from "@/hooks/useQuestRequirements";
import { Card } from "@/components/cards/Card";

export default function MPCPage() {
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
    <div className="flex flex-col gap-4 pt-4">
      <span className="text-iron-600 font-sans text-xs">
        Discover connections with your social graph, using MPC for efficient
        results while maintaining your data privacy.
      </span>

      <Link href={`/mpc/fruits`}>
        <Card.Base className="flex flex-col gap-4 p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <Card.Title className="text-white text-sm font-bold">
                  🍎 Rate fruits
                </Card.Title>
                <span className="text-xs font-iron-600 font-sans">
                  Rate some fruits with your friends, discover how aligned you
                  are without revealing any specific votes. Votes happen in
                  batches of 10.
                </span>
              </div>
            </div>
          </div>
        </Card.Base>
      </Link>

      <Link href={`/mpc/talks`}>
        <Card.Base className="flex flex-col gap-4 p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <Card.Title className="text-white text-sm font-bold">
                  Top 3 Talks
                </Card.Title>
                <span className="text-xs font-iron-600 font-sans">
                  Rate some talks, only reveal the top 3 after everyone votes.
                  Learn about which ones were most successful without putting
                  down other speakers.
                </span>
              </div>
            </div>
          </div>
        </Card.Base>
      </Link>
    </div>
  );
}
