import React, { ReactNode } from "react";
import { Card } from "./Card";
import { LocationRequirement, UserRequirement } from "@/types";
import { Icons } from "../Icons";
import { CircleCard } from "./CircleCard";
import { PointCard } from "./PointCard";

type QuestCardProps = {
  title: string;
  description: ReactNode;
  userTapReqCount: number; // 1 or 0
  userRequirements?: UserRequirement[];
  locationRequirements?: LocationRequirement[];
  completedReqs?: number; // number of completed signatures
  isCompleted: boolean; // whether the quest is completed
  isPinned?: boolean;
  reward?: string | number;
};

const QuestRequirementIcons = ({
  userRequirements = [],
  locationRequirements = [],
  userTapReqCount = 0,
}: Pick<
  QuestCardProps,
  "userRequirements" | "locationRequirements" | "userTapReqCount"
>) => {
  const requirementIconsLimit = 4;
  const totalRequirements =
    userRequirements.length + locationRequirements.length + userTapReqCount;
  const overcomeRequirementLimit = totalRequirements > requirementIconsLimit;
  const remainingRequirements = totalRequirements - requirementIconsLimit;

  // user tap requirements use the "magic" icon
  // user requirements use the "person" icon
  // location requirements use the "location" icon
  // no icon for proving

  return (
    <div className="flex relative items-center gap-1">
      <div className="flex">
        {userTapReqCount === 1 && <CircleCard isMultiple={true} icon="proof" />}
        {[...userRequirements, ...locationRequirements]
          .splice(0, requirementIconsLimit - userTapReqCount)
          .map((item: UserRequirement | LocationRequirement, index) => {
            const isPersonRequirement = "users" in item;

            return (
              <CircleCard
                key={index}
                isMultiple={true}
                icon={isPersonRequirement ? "person" : "location"}
                border
              />
            );
          })}
      </div>
      {overcomeRequirementLimit && (
        <span className="text-[11px] text-gray-11 font-normal tracking-[0.8px]">
          {`+${remainingRequirements}`}
        </span>
      )}
    </div>
  );
};

const QuestCard = ({
  title,
  description,
  locationRequirements = [],
  userRequirements = [],
  completedReqs,
  isCompleted,
  isPinned,
  userTapReqCount,
  reward,
}: QuestCardProps) => {
  const numRequirements =
    locationRequirements.length === 0
      ? userRequirements[0].numSigsRequired
      : locationRequirements[0].numSigsRequired;

  const percentageComplete = completedReqs
    ? (completedReqs / numRequirements) * 100
    : 0;

  return (
    <Card.Base className="flex flex-col gap-4 p-3 !pb-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Card.Title className="text-white text-sm font-bold">
              {title}
            </Card.Title>
            <span className="text-xs font-iron-600 font-inter">
              {description}
            </span>
          </div>
          {isCompleted && <Icons.checkedCircle />}
        </div>
      </div>
      <div className="flex gap-4 items-center justify-between">
        {
          <QuestRequirementIcons
            userRequirements={userRequirements}
            locationRequirements={locationRequirements}
            userTapReqCount={userTapReqCount}
          />
        }
        {isCompleted ? (
          <Card.Description className="!text-primary">
            {"Proof Completed"}
          </Card.Description>
        ) : completedReqs === numRequirements ? (
          <Card.Description className="!text-primary">{`Generate proof of completion`}</Card.Description>
        ) : (
          <Card.Description className="!text-secondary !font-medium">{`${
            completedReqs || 0
          }/${numRequirements}`}</Card.Description>
        )}
      </div>
      <Card.Progress
        style={{
          width: `${percentageComplete}%`,
        }}
      />
    </Card.Base>
  );
};

QuestCard.displayName = "QuestCard";
export { QuestCard };
