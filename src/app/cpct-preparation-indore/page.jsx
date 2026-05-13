import LocalSeoArticle from "@/app/components/local-seo/LocalSeoArticle";
import { cpctPreparationIndore } from "@/content/localSeo/indoreLandings";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata(cpctPreparationIndore.meta);

export default function Page() {
  return <LocalSeoArticle data={cpctPreparationIndore} />;
}
