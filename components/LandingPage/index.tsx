import { BackToTopButton } from "@/components/BackToTopButton";
import { DemoSection } from "@/components/LandingPage/DemoSection";
import { FinalCtaSection } from "@/components/LandingPage/FinalCtaSection";
import { HeroSection } from "@/components/LandingPage/HeroSection";
import { HowToSection } from "@/components/LandingPage/HowToSection";
import { PrivacySection } from "@/components/LandingPage/PrivacySection";
import { UseCasesSection } from "@/components/LandingPage/UseCasesSection";

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
