import { GuidePostList } from "@/components/GuidePostList";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { loadAllGuidePosts } from "@/lib/guides/loadGuidePosts";

export const metadata = buildPageMetadata({
  title: "使い方ガイド | 伏せ太郎（Fusely）",
  description:
    "伏せ太郎（Fusely）で画像を読み込み、顔や個人情報を手動編集し、マスキング設定を変更するための使い方ガイドです。",
  canonicalPath: "guides",
});

/**
 * 使い方ガイド一覧ページ
 */
export default function GuidesPage() {
  const posts = loadAllGuidePosts();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">使い方ガイド</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        伏せ太郎（Fusely）で画像を読み込み、顔や個人情報を隠して保存するまでの手順をまとめます。
        画像はブラウザ内で処理され、サーバーには送信されません。
      </p>
      <div className="mt-8">
        <GuidePostList posts={posts} />
      </div>
    </div>
  );
}
