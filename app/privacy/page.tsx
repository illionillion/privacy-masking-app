import { LegalMarkdownContent } from "@/components/LegalMarkdownContent";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { loadLegalDocument } from "@/lib/loadLegalDocument";

const doc = loadLegalDocument("privacy");

export const metadata = buildPageMetadata({
  title: doc.pageTitle,
  description: doc.description,
  canonicalPath: doc.canonicalPath,
});

/**
 * プライバシーポリシーページ
 */
export default function PrivacyPage() {
  return (
    <LegalPageLayout title={doc.title} dateText={doc.lastUpdated}>
      <LegalMarkdownContent content={doc.content} />
    </LegalPageLayout>
  );
}
