import Link from "next/link";
import { clsx } from "clsx";
import { buildPageMetadata } from "@/lib/buildPageMetadata";

const NOT_FOUND_PAGE_TITLE = "ページが見つかりません | 伏せ太郎 | Fusely";
const NOT_FOUND_DESCRIPTION =
  "お探しのページは移動または削除された可能性があります。URL をご確認のうえ、トップからお試しください。";

/** 404: OGP 画像は layout から継承。og:url は付けない */
export const metadata = buildPageMetadata({
  title: NOT_FOUND_PAGE_TITLE,
  description: NOT_FOUND_DESCRIPTION,
  robots: { index: false, follow: true },
});

/**
 * 404 Not Found ページ
 *
 * 存在しないパスへのアクセス時に表示する。ルートレイアウトのヘッダー配下に描画される。
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-5xl font-bold tabular-nums tracking-tight text-indigo-600 sm:text-6xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:mt-5 sm:text-3xl">
        ページが見つかりません
      </h1>
      <p className="mt-4 max-w-md text-pretty text-zinc-600">{NOT_FOUND_DESCRIPTION}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className={clsx([
            "inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white",
            "transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
          ])}
        >
          トップに戻る
        </Link>
        <Link
          href="/lp"
          className={clsx([
            "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800",
            "transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400",
          ])}
        >
          サービス紹介を見る
        </Link>
      </div>
    </div>
  );
}
