import { MaskingGallery } from "@/features/masking";

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
          画像をアップロードすると、顔を自動検出してスタンプでマスキングし、ダウンロードできます
        </p>
      </div>
      <MaskingGallery />
    </div>
  );
}
