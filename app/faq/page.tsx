import { LegalMarkdownContent } from "@/components/LegalMarkdownContent";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { loadFaqDocument } from "@/lib/loadFaqDocument";

const doc = loadFaqDocument();

export const metadata = buildPageMetadata({
  title: doc.pageTitle,
  description: doc.description,
  canonicalPath: doc.canonicalPath,
});

/**
 * よくある質問（FAQ）ページ
 */
export default function FaqPage() {
  return (
    <LegalPageLayout title={doc.title} lastUpdatedLabel={doc.lastUpdated}>
      <LegalMarkdownContent content={doc.content} />
    </LegalPageLayout>
  );
}
