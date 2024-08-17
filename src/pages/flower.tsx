import { classed } from "@tw-classed/react";
import Head from "next/head";
import Image from "next/image";

const Title = classed.span("text-center text-white text-[20px] font-bold");

export default function FlowerPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const imageUrl = urlParams.get("imageUrl") || "";

  const pageTitle = "Your Frontiers Flower Garden";
  const pageDescription = "Check out my unique Frontiers Flower Garden!";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@cursve_team" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={decodeURIComponent(imageUrl)} />
      </Head>
      <div className="flex flex-col items-center justify-center">
        <Title className="mt-16 mb-4">Frontiers 2024 Flower Garden</Title>
        <Image
          src={decodeURIComponent(imageUrl)}
          alt="Frontiers Flower Garden"
          width={500}
          height={300}
          className="mx-auto"
        />
      </div>
    </>
  );
}

FlowerPage.getInitialProps = () => {
  return { fullPage: true };
};
