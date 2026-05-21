import Link from "next/link";
import { BackToTopButton } from "@/components/BackToTopButton";
import { HomeCompactDemo } from "@/components/HomeCompactDemo";
import { MaskingGallery } from "@/features/masking";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { HOME_PAGE_ABOUT, HOME_PAGE_HEADING, HOME_PAGE_LEAD } from "@/lib/siteSeo";

/** トップ（/）: title / description は layout。canonical と OGP url のみ上書き */
export const metadata = buildPageMetadata({ canonicalPath: "./" });

/**
 * メインページ
 *
 * Privacy Masking Tool のトップページ。
 * マスキングエディター（画像アップロード + 顔検出 + Canvas表示）を表示する。
 */
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{HOME_PAGE_HEADING}</h1>
        <p className="mt-2 text-zinc-600">{HOME_PAGE_LEAD}</p>
      </header>

      <MaskingGallery />

      <section className="mt-10" aria-labelledby="home-demo-heading">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-left">
            <h2
              id="home-demo-heading"
              className="text-lg font-semibold tracking-tight text-zinc-900"
            >
              使い例
            </h2>
            <p className="mt-1 text-sm text-zinc-500">こんな感じでマスキングできます</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
              {HOME_PAGE_ABOUT}
            </p>
          </div>
          <Link
            href="/lp"
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
