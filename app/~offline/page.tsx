import Link from "next/link";
import { buildPageMetadata } from "@/lib/buildPageMetadata";

export const metadata = buildPageMetadata({
  title: "オフライン | 伏せ太郎（Fusely）",
  description: "ネットワークに接続できません。接続を確認してから再度お試しください。",
  canonicalPath: "~offline",
  robots: { index: false, follow: false },
});

/**
 * オフライン時のフォールバックページ。
 */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-zinc-900">オフラインです</h1>
      <p className="mt-3 text-zinc-600">
        ネットワークに接続できません。接続を確認してから、もう一度お試しください。
      </p>
      <Link
        href="/app"
        className="mt-8 inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        マスキングツールへ
      </Link>
    </div>
  );
}
