import type { Metadata } from "next";
import { resolveSiteUrl } from "@/lib/siteUrl";
import { DemoSection } from "./_components/DemoSection";
import { FinalCtaSection } from "./_components/FinalCtaSection";
import { HeroSection } from "./_components/HeroSection";
import { HowToSection } from "./_components/HowToSection";
import { PrivacySection } from "./_components/PrivacySection";
import { UseCasesSection } from "./_components/UseCasesSection";

const LP_TITLE = "伏せ太郎 | Fusely - ブラウザだけで画像の個人情報を安全に隠せるツール";
const LP_DESCRIPTION =
  "顔・テキストをブラウザだけで自動検出してマスキング。画像はサーバーに送信しない完全プライベートツール。";

export const metadata: Metadata = {
  title: LP_TITLE,
  description: LP_DESCRIPTION,
  alternates: {
    canonical: "lp",
  },
  openGraph: {
    title: LP_TITLE,
    description: LP_DESCRIPTION,
    url: resolveSiteUrl("lp"),
  },
  twitter: {
    title: LP_TITLE,
    description: LP_DESCRIPTION,
  },
};

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
    </div>
  );
}
