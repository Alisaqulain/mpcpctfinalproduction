import LocalSeoArticle from "@/app/components/local-seo/LocalSeoArticle";
import { hindiTypingTest } from "@/content/localSeo/indoreLandings";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata(hindiTypingTest.meta);

export default function Page() {
  return <LocalSeoArticle data={hindiTypingTest} />;
}
