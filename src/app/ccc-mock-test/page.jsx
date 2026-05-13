import LocalSeoArticle from "@/app/components/local-seo/LocalSeoArticle";
import { cccMockTest } from "@/content/localSeo/indoreLandings";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata(cccMockTest.meta);

export default function Page() {
  return <LocalSeoArticle data={cccMockTest} />;
}
