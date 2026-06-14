import clsx from "clsx";
import Link from "next/link";
import { formatUpdateDate } from "@/lib/formatUpdateDate";
import type { LoadedUpdatePost } from "@/lib/loadUpdatePosts.types";

type UpdatePostListProps = {
  posts: LoadedUpdatePost[];
};

/**
 * 更新情報一覧。日付・タイトル・概要から詳細ページへリンクする。
 */
export function UpdatePostList({ posts }: UpdatePostListProps) {
  if (posts.length === 0) {
    return <p className="text-sm text-zinc-500">公開中の更新記事はまだありません。</p>;
  }

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <li
          key={post.slug}
          className={clsx([
            "rounded-xl",
            "border border-zinc-200",
            "bg-white",
            "p-5",
            "shadow-sm",
            "transition-colors",
            "hover:border-indigo-200",
          ])}
        >
          <time dateTime={post.date} className="text-xs font-medium text-zinc-500">
            {formatUpdateDate(post.date)}
          </time>
          <h2 className="mt-2 text-base font-semibold text-zinc-900">
            <Link
              href={`/updates/${post.slug}`}
              className="underline-offset-4 transition-colors hover:text-indigo-700 hover:underline"
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
