import clsx from "clsx";
import Link from "next/link";
import type { LoadedBlogPost } from "@/lib/blog/types";
import { formatUpdateDate } from "@/lib/formatUpdateDate";

type BlogPostListProps = {
  posts: LoadedBlogPost[];
};

/**
 * ブログ記事一覧。カテゴリ・日付・タイトル・概要から詳細ページへリンクする。
 */
export function BlogPostList({ posts }: BlogPostListProps) {
  if (posts.length === 0) {
    return <p className="text-sm text-zinc-500">公開中のブログ記事はまだありません。</p>;
  }

  return (
    <ul className="space-y-4">
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs font-semibold tracking-wide text-indigo-600">
              {post.category}
            </span>
            <time dateTime={post.date} className="text-xs font-medium text-zinc-500">
              {formatUpdateDate(post.date)}
            </time>
          </div>
          <h2 className="mt-2 text-base font-semibold text-zinc-900">
            <Link
              href={`/blog/${post.slug}`}
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
    </ul>
  );
}
