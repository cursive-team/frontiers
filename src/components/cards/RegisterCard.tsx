import { classed } from "@tw-classed/react";
import React, { ReactNode } from "react";

const Description = classed.span(
  "text-sm text-white/75 [&>strong]:text-white [&>strong]:font-bold leading-5 font-sans"
);

export const RegisterCard = () => {
  return (
    <div className="bg-gray/20 relative min-h-[400px] bg-no-repeat bg-center bg-cover flex flex-col gap-14 p-4 rounded-2xl border border-white/20 mx-4">
      <div
        className=" absolute inset-0 bg-cover bg-center bg-no-repeat -z-10 opacity-50"
        style={{
          backgroundImage: "url(/shapes/shape.svg)",
        }}
      ></div>
      <div className="relative bg-secondary p-4 rounded-2xl">
        <span className="text-white text-lg leading-6 font-sans">
          Hold NFC card against your phone until you receive a notification.
        </span>
      </div>
      <div className="relative flex flex-col gap-8 px-4">
        <Description>
          <strong>iPhone:</strong> Hold card against the top of your phone and
          unlock the screen.
        </Description>
        <Description>
          <strong>Android:s</strong> Unlock your phone and hold card against the
          center of your phone. Ensure NFC is turned on in your settings.
        </Description>
      </div>
    </div>
  );
};
