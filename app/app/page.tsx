import Link from "next/link";
import { BackToTopButton } from "@/components/BackToTopButton";
import { HomeCompactDemo } from "@/components/HomeCompactDemo";
import { MaskingGallery } from "@/features/masking";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { APP_PAGE_ABOUT, APP_PAGE_HEADING, APP_PAGE_LEAD } from "@/lib/siteSeo";

export const metadata = buildPageMetadata({
  title: "マスキング編集 | 伏せ太郎（Fusely）",
  description:
    "写真・スクショをアップロードし、顔・文字を検出してマスキングします。ブラウザ内だけで処理し、画像はサーバーに送信しません。",
  canonicalPath: "app",
});

/**
 * マスキングツール本体（画像アップロード + 顔検出 + Canvas 編集）
 */
export default function AppPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{APP_PAGE_HEADING}</h1>
        <p className="mt-2 text-zinc-600">{APP_PAGE_LEAD}</p>
      </header>

      <MaskingGallery />

      <section className="mt-10" aria-labelledby="app-demo-heading">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-left">
            <h2
              id="app-demo-heading"
              className="text-lg font-semibold tracking-tight text-zinc-900"
            >
              使い例
            </h2>
            <p className="mt-1 text-sm text-zinc-500">こんな感じでマスキングできます</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">{APP_PAGE_ABOUT}</p>
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-indigo-600 underline-offset-4 transition-colors hover:text-indigo-800 hover:underline sm:pt-1"
          >
            説明をもっと見る
          </Link>
        </div>
        <HomeCompactDemo />
      </section>

      <BackToTopButton />
    </div>
  );
}
