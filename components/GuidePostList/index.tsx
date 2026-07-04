import clsx from "clsx";
import Link from "next/link";
import type { LoadedGuidePost } from "@/lib/guides/types";

type GuidePostListProps = {
  posts: LoadedGuidePost[];
};

/**
 * 使い方ガイド一覧。手順番号・タイトル・概要から詳細ページへリンクする。
 */
export function GuidePostList({ posts }: GuidePostListProps) {
  if (posts.length === 0) {
    return <p className="text-sm text-zinc-500">公開中のガイドはまだありません。</p>;
  }

  return (
    <ol className="space-y-4">
      {posts.map((post) => (
        <li
          key={post.slug}
          className={clsx([
            "relative",
            "rounded-xl",
            "border border-zinc-200",
            "bg-white",
            "p-5",
            "shadow-sm",
            "transition-colors",
            "hover:border-indigo-200",
            "has-[:focus-visible]:ring-2",
            "has-[:focus-visible]:ring-indigo-500",
            "has-[:focus-visible]:ring-offset-2",
          ])}
        >
          <p className="text-xs font-semibold tracking-wide text-indigo-600">ガイド {post.order}</p>
          <h2 className="mt-2 text-base font-semibold text-zinc-900">
            <Link
              href={`/guides/${post.slug}`}
              className={clsx([
                "underline-offset-4",
                "transition-colors",
                "hover:text-indigo-700",
                "hover:underline",
                "focus-visible:text-indigo-700",
                "focus-visible:underline",
                "after:absolute",
                "after:inset-0",
                "after:rounded-xl",
                "after:content-['']",
                "focus-visible:outline-none",
              ])}
            >
              {post.title}
            </Link>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{post.summary}</p>
        </li>
      ))}
    </ol>
  );
}
