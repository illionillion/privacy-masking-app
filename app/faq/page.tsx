import { BackToTopButton } from "@/components/BackToTopButton";
import { FaqAccordion } from "@/components/FaqAccordion";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { loadFaqDocument } from "@/lib/loadFaqDocument";
import { parseFaqContent } from "@/lib/parseFaqContent";

const doc = loadFaqDocument();
const faq = parseFaqContent(doc.content);

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
    <>
      <LegalPageLayout title={doc.title} dateText={doc.lastUpdated}>
        <FaqAccordion intro={faq.intro} items={faq.items} footer={faq.footer} />
      </LegalPageLayout>
      <BackToTopButton />
    </>
  );
}
