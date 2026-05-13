import HomePageClient from "./components/HomePageClient";
import HomeMarketingSections from "./components/HomeMarketingSections";
import { pageMetadata } from "../lib/metadata";

export const metadata = pageMetadata.home;

export default function HomePage() {
  return (
    <>
      <HomePageClient />
      <HomeMarketingSections />
    </>
  );
}
