import { ReactNode } from "react";
import { cn } from "@/lib/client/utils";

export interface SectionProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  active?: boolean; // add background to label
}
export const Section = ({
  title,
  children,
  active = false,
  description,
}: SectionProps) => (
  <div className={cn("flex flex-col")}>
    <div className="flex flex-col gap-1">
      {title && (
        <h3
          className={cn(
            "px-4 text-sm leading-6",
            active
              ? "py-2 bg-gray/20 font-medium text-white"
              : "py-2 font-normal text-white/75"
          )}
        >
          {title}
        </h3>
      )}
      {description && (
        <span className="font-normal text-sm leading-5 text-white/50 px-4">
          {description}
        </span>
      )}
    </div>
    <div className="flex flex-col gap-1 px-4">{children}</div>
  </div>
);
