import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { MarkdownWithToc } from "@/components/MarkdownWithToc";
import { isBlogPostNotFoundError } from "@/lib/blog/notFoundError";
import { loadBlogPost, loadBlogPostSlugs } from "@/lib/blog/loadBlogPosts";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { extractMarkdownH2Headings } from "@/lib/extractMarkdownH2Headings";
import { formatUpdateDate } from "@/lib/formatUpdateDate";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * ブログ記事詳細の静的パスを生成する。
 */
export function generateStaticParams() {
  return loadBlogPostSlugs().map((slug) => ({ slug }));
}

/**
 * ブログ記事詳細の metadata を生成する。
 */
export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;

  try {
    const post = loadBlogPost(slug);
    return buildPageMetadata({
      title: post.pageTitle,
      description: post.description,
      canonicalPath: post.canonicalPath,
    });
  } catch (error) {
    if (isBlogPostNotFoundError(error)) {
      return {};
    }
    throw error;
  }
}

/**
 * ブログ記事詳細ページ
 */
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  let post;
  try {
    post = loadBlogPost(slug);
  } catch (error) {
    if (isBlogPostNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  const headings = extractMarkdownH2Headings(post.content);

  return (
    <MarkdownWithToc
      headings={headings}
      header={
        <>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{post.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">公開日: {formatUpdateDate(post.date)}</p>
          <p className="mt-3 text-xs font-semibold tracking-wide text-indigo-600">
            {post.category}
          </p>
          {post.tags.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      }
    >
      <MarkdownContent content={post.content} />
      <p className="pt-2">
        <Link
          href="/blog"
          className="font-medium text-indigo-600 underline-offset-2 hover:underline"
        >
          ブログ一覧へ戻る
        </Link>
      </p>
    </MarkdownWithToc>
  );
}

/** 未生成 slug へのアクセスは 404 とする */
export const dynamicParams = false;
