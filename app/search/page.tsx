import { SiteSearch } from "@/components/SiteSearch";
import { buildPageMetadata } from "@/lib/buildPageMetadata";

export const metadata = buildPageMetadata({
  title: "サイト内検索 | 伏せ太郎（Fusely）",
  description:
    "使い方ガイド・更新情報・FAQ を横断して検索できます。伏せ太郎（Fusely）のヘルプやお知らせを素早く見つけられます。",
  canonicalPath: "search",
});

/**
 * サイト内検索ページ
 */
export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">サイト内検索</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        使い方ガイド・更新情報・FAQ から目的のページを探せます。
      </p>
      <div className="mt-8">
        <SiteSearch />
      </div>
    </div>
  );
}
