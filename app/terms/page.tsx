import { LegalMarkdownContent } from "@/components/LegalMarkdownContent";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { loadLegalDocument } from "@/lib/loadLegalDocument";

const doc = loadLegalDocument("terms");

export const metadata = buildPageMetadata({
  title: doc.pageTitle,
  description: doc.description,
  canonicalPath: doc.canonicalPath,
});

/**
 * 利用規約ページ
 */
export default function TermsPage() {
  return (
    <LegalPageLayout title={doc.title} dateText={doc.lastUpdated}>
      <LegalMarkdownContent content={doc.content} />
    </LegalPageLayout>
  );
}
