import type { Metadata } from "next";
import { MaskingGallery } from "@/features/masking";
import { SITE_SOCIAL_METADATA } from "@/lib/siteOpenGraph";
import { resolveSiteUrl } from "@/lib/siteUrl";

const HOME_TITLE = "伏せ太郎 | Fusely";
const HOME_DESCRIPTION =
  "伏せ太郎（Fusely）は、画像内の顔・文字情報を検出して黒塗り・モザイク・ぼかし編集ができるブラウザ完結型ツール";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: resolveSiteUrl(),
    ...SITE_SOCIAL_METADATA.openGraph,
  },
  twitter: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    ...SITE_SOCIAL_METADATA.twitter,
  },
};

/**
 * メインページ
 *
 * Privacy Masking Tool のトップページ。
 * マスキングエディター（画像アップロード + 顔検出 + Canvas表示）を表示する。
 */
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          画像プライバシーマスキング
        </h1>
        <p className="mt-2 text-zinc-600">
          画像をアップロードすると、顔・文字を検出してマスキングを編集し、ダウンロードできます
        </p>
      </div>
      <MaskingGallery />
    </div>
  );
}
