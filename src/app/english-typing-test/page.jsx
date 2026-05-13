import LocalSeoArticle from "@/app/components/local-seo/LocalSeoArticle";
import { englishTypingTest } from "@/content/localSeo/indoreLandings";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata(englishTypingTest.meta);

export default function Page() {
  return <LocalSeoArticle data={englishTypingTest} />;
}
