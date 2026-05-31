import { serializeJsonLd } from "@/lib/serializeJsonLd";
import { SITE_DEFAULT_DESCRIPTION } from "@/lib/siteSeo";
import { getSiteUrl } from "@/lib/siteUrl";

/**
 * WebApplication 向け JSON-LD（検索エンジン向け構造化データ）
 */
export function JsonLdWebApplication() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "伏せ太郎",
    alternateName: "Fusely",
    url: `${getSiteUrl()}/app`,
    description: SITE_DEFAULT_DESCRIPTION,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    featureList: [
      "ブラウザでの顔隠し",
      "顔・文字の検出とマスキング",
      "検出できない部分の手動調整",
      "スクショ・写真の個人情報処理",
    ],
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
