import { AppHeaderLogo } from "@/components/AppHeader";
import { AppLink } from "@/components/AppLink";
import { Button } from "@/components/Button";
import { RegisterCard } from "@/components/cards/RegisterCard";
import Link from "next/link";

export default function IntroPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 mx-auto">
        <AppHeaderLogo />
      </div>
      <div className="flex flex-col px-4 gap-14">
        <RegisterCard />
        <div className="flex flex-col gap-8">
          <Link href="/">
            <Button variant="link">My card is already registered</Button>
          </Link>
          <span className="text-xs text-white/50 text-center font-inter ">
            App built by{" "}
            <AppLink
              href="https://cursive.team/"
              className="text-primary underline"
            >
              Cursive
            </AppLink>{" "}
            for Paradigm Frontiers.
          </span>
        </div>
      </div>
    </div>
  );
}

IntroPage.getInitialProps = () => {
  return { showFooter: false, showHeader: false };
};
