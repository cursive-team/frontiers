import { classed } from "@tw-classed/react";

export const IconCircle = classed.div(
  "flex justify-center items-center h-6 w-6 rounded-full text-secondary",
  {
    variants: {
      color: {
        primary: "bg-gray/60",
        secondary: "bg-gray/60",
      },
      border: {
        true: "border-2 border-[#393939]",
      },
    },
    defaultVariants: {
      color: "primary",
      border: false,
    },
  }
);
