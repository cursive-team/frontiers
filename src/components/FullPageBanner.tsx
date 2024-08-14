import { Card } from "./cards/Card";
import useSettings from "@/hooks/useSettings";
import { Inter } from "next/font/google";
import { AppHeaderLogo } from "./AppHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

interface FullPageBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  description: string;
  title?: string;
  iconSize?: number;
}

const FullPageBanner = ({ description, title }: FullPageBannerProps) => {
  const { pageHeight } = useSettings();
  return (
    <div
      style={{
        minHeight: `${pageHeight}px`,
      }}
      className={`flex text-center h-full ${inter.variable} font-inter`}
    >
      <div className="flex flex-col gap-6 my-auto mx-auto px-10">
        <div className="flex flex-col gap-2">
          {title && <Card.Title className="!text-lg">{title}</Card.Title>}
          <Card.Base className="p-2">
            <Card.Description>
              <span className="font-inter text-sm text-white">
                {description}
              </span>
            </Card.Description>
          </Card.Base>
        </div>
      </div>
    </div>
  );
};

FullPageBanner.displayName = "FullPageBanner";

export { FullPageBanner };
