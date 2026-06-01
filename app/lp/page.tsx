import Link from "next/link";
import { buildPageMetadata } from "@/lib/buildPageMetadata";

/** 旧 `/lp` はトップへ統合。canonical は `/` */
export const metadata = buildPageMetadata({
  canonicalPath: "./",
  robots: { index: false, follow: true },
});

/**
 * 旧 LP URL（/lp）からトップへの案内
 *
 * 本番では public/_redirects により 301 リダイレクトする。
 */
export default function LpLegacyPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-zinc-600">サービス紹介ページはトップ（/）に移動しました。</p>
      <Link
        href="/"
        className="mt-4 text-sm font-medium text-indigo-600 underline-offset-4 hover:underline"
      >
        トップへ
      </Link>
    </div>
  );
}
