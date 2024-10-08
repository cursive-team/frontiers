"use client";
import { ReactNode, useState } from "react";
import { Icons } from "./Icons";
import { cn } from "@/lib/client/utils";

interface AccordionProps {
  label: string;
  className?: string;
  children?: ReactNode;
}

const Accordion = ({ label, children, className = "" }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className="flex flex-col p-3 bg-black border border-white/20"
      aria-expanded={isOpen}
    >
      <div
        className="grid grid-cols-[1fr_16px] gap-1 justify-between items-center cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <span className="font-inter text-sm font-semibold leading-6 text-white">
          {label}
        </span>
        <Icons.ArrowUp
          size={16}
          className={cn("duration-200", {
            "transform rotate-180": !isOpen,
          })}
          color={"#FFFFFF"}
        />
      </div>
      <div className="overflow-hidden box-border transition-all duration-300 ease-in-out">
        <div
          className={cn(
            "block overflow-hidden max-h-0 duration-200 ease-in-out",
            isOpen
              ? "grid-rows-[1fr] opacity-100 max-h-full"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <p
            className={cn(
              "block overflow-hidden pt-4 text-primary text-sm leading-5 font-inter font-normal",
              className
            )}
          >
            {children}
          </p>
        </div>
      </div>
    </div>
  );
};

Accordion.displayName = "Accordion";
export { Accordion };
