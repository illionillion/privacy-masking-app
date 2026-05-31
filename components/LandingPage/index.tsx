import { BackToTopButton } from "@/components/BackToTopButton";
import { DemoSection } from "@/app/lp/_components/DemoSection";
import { FinalCtaSection } from "@/app/lp/_components/FinalCtaSection";
import { HeroSection } from "@/app/lp/_components/HeroSection";
import { HowToSection } from "@/app/lp/_components/HowToSection";
import { PrivacySection } from "@/app/lp/_components/PrivacySection";
import { UseCasesSection } from "@/app/lp/_components/UseCasesSection";

/**
 * サービス紹介ランディングページ本体（トップ `/` 用）
 */
export function LandingPage() {
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
