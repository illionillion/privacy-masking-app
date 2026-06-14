import { UpdatePostList } from "@/components/UpdatePostList";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { loadAllUpdatePosts } from "@/lib/loadUpdatePosts";

const posts = loadAllUpdatePosts();

export const metadata = buildPageMetadata({
  title: "更新情報 | 伏せ太郎（Fusely）",
  description:
    "伏せ太郎（Fusely）の機能追加・改善の更新ログ。FAQ やマスキングツールの変更点を時系列で掲載しています。",
  canonicalPath: "updates",
});

/**
 * 更新情報一覧ページ
 */
export default function UpdatesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">更新情報</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        伏せ太郎（Fusely）の機能追加・改善をお知らせします。ユーザー向けの変更のみ掲載しています。
      </p>
      <div className="mt-8">
        <UpdatePostList posts={posts} />
      </div>
    </div>
  );
}
