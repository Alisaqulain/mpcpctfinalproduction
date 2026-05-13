import LocalSeoArticle from "@/app/components/local-seo/LocalSeoArticle";
import { typingTestIndore } from "@/content/localSeo/indoreLandings";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata(typingTestIndore.meta);

export default function Page() {
  return <LocalSeoArticle data={typingTestIndore} />;
}
