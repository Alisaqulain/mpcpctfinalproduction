import LocalSeoArticle from "@/app/components/local-seo/LocalSeoArticle";
import { cccExamIndore } from "@/content/localSeo/indoreLandings";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata(cccExamIndore.meta);

export default function Page() {
  return <LocalSeoArticle data={cccExamIndore} />;
}
