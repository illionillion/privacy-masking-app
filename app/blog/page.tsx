import { BlogPostList } from "@/components/BlogPostList";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { loadAllBlogPosts } from "@/lib/blog/loadBlogPosts";

const posts = loadAllBlogPosts();

export const metadata = buildPageMetadata({
  title: "ブログ | 伏せ太郎（Fusely）",
  description:
    "写真投稿や個人情報マスキングの注意点をまとめた伏せ太郎（Fusely）のブログ。SNS 公開前のチェックポイントを紹介します。",
  canonicalPath: "blog",
});

/**
 * ブログ一覧ページ
 */
export default function BlogPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">ブログ</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        写真やスクリーンショットを公開する前に押さえておきたいプライバシーのポイントをまとめます。
        不安を煽らず、公開前に確認できる具体的なチェック項目を中心に紹介します。
      </p>
      <div className="mt-8">
        <BlogPostList posts={posts} />
      </div>
    </div>
  );
}
