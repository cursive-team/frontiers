import { useState } from "react";
import { Icons } from "./Icons";

interface BannerProps {
  title?: string;
  closable?: boolean;
}

export const Banner = ({ title, closable = true }: BannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="flex items-center justify-between bg-secondary p-2 text-white">
      <span className="text-sm">{title}</span>
      {closable && (
        <button
          onClick={() => {
            setIsVisible(false);
          }}
        >
          <Icons.Close className="" />
        </button>
      )}
    </div>
  );
};
