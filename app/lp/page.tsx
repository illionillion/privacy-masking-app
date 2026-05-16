import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { LP_PAGE_DESCRIPTION, LP_PAGE_TITLE } from "@/lib/siteSeo";
import { BackToTopButton } from "./_components/BackToTopButton";
import { DemoSection } from "./_components/DemoSection";
import { FinalCtaSection } from "./_components/FinalCtaSection";
import { HeroSection } from "./_components/HeroSection";
import { HowToSection } from "./_components/HowToSection";
import { PrivacySection } from "./_components/PrivacySection";
import { UseCasesSection } from "./_components/UseCasesSection";

export const metadata = buildPageMetadata({
  title: LP_PAGE_TITLE,
  description: LP_PAGE_DESCRIPTION,
  canonicalPath: "lp",
});

/**
 * LP（ランディングページ）
 *
 * `/lp` ルートに配置される静的マーケティングページ。
 * 画像処理コードを含まない純粋な紹介ページ。
 */
export default function LpPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <DemoSection />
      <HowToSection />
      <PrivacySection />
      <UseCasesSection />
      <FinalCtaSection />
      <BackToTopButton />
    </div>
  );
}
