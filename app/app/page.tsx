import { BackToTopButton } from "@/components/BackToTopButton";
import { MaskingGallery } from "@/features/masking";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { APP_PAGE_HEADING, APP_PAGE_LEAD } from "@/lib/siteSeo";

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

      <BackToTopButton />
    </div>
  );
}
