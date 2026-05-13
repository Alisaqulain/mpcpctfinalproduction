import LocalSeoArticle from "@/app/components/local-seo/LocalSeoArticle";
import { cpctPracticeTest } from "@/content/localSeo/indoreLandings";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata(cpctPracticeTest.meta);

export default function Page() {
  return <LocalSeoArticle data={cpctPracticeTest} />;
}
