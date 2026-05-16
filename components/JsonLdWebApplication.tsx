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
    url: getSiteUrl(),
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
      "画像の個人情報マスキング",
      "AIによる自動マスキング",
      "スクショ・写真の個人情報処理",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
