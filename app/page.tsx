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
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{HOME_PAGE_HEADING}</h1>
        <p className="mt-2 text-zinc-600">{HOME_PAGE_LEAD}</p>
      </div>
      <MaskingGallery />
      <section
        className="mt-12 border-t border-zinc-200 pt-8 text-sm leading-relaxed text-zinc-500"
        aria-label="伏せ太郎について"
      >
        <h2 className="sr-only">伏せ太郎（Fusely）について</h2>
        <p>{HOME_PAGE_ABOUT}</p>
      </section>
    </div>
  );
}
