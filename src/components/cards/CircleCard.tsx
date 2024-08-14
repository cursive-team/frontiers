import Image from "next/image";
import type * as Classed from "@tw-classed/react";
import { IconCircle } from "../IconCircle";
import { cn } from "@/lib/client/utils";

type CardIconType = "person" | "location" | "proof" | "overlap";

type CardIconVariants = Classed.VariantProps<typeof IconCircle>;

const CardIconMapping: Record<CardIconType, string> = {
  person: "/icons/person.svg",
  location: "/icons/location.svg",
  proof: "/icons/proof.svg",
  overlap: "/icons/overlap.svg",
};

interface CircleCardProps extends CardIconVariants {
  icon: CardIconType;
  isMultiple?: boolean; // have multiple icons
  className?: string;
}

const IconSizeMapping: Record<"xs" | "sm" | "md", number> = {
  xs: 10,
  sm: 18,
  md: 24,
};

const IconSizeClass: Record<"xs" | "sm" | "md", string> = {
  xs: "h-[10px]",
  sm: "h-[18px]",
  md: "h-[32px]",
};

const CircleCard = ({ icon, color, border, ...props }: CircleCardProps) => {
  const iconSize = IconSizeMapping["xs"];
  const iconSizeClass = IconSizeClass["xs"];

  return (
    <IconCircle color={color} border={border} {...props}>
      <Image
        src={CardIconMapping[icon]}
        height={iconSize}
        width={iconSize}
        className={cn("text-secondary", iconSizeClass)}
        alt={`${icon} icon`}
      />
    </IconCircle>
  );
};

CircleCard.displayName = "CircleCard";
export { CircleCard };
