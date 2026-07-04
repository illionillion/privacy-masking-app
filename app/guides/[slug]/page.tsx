import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { isGuidePostNotFoundError } from "@/lib/guides/notFoundError";
import { loadGuidePost, loadGuidePostSlugs } from "@/lib/guides/loadGuidePosts";

type GuidePostPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * 使い方ガイド詳細の静的パスを生成する。
 */
export function generateStaticParams() {
  return loadGuidePostSlugs().map((slug) => ({ slug }));
}

/**
 * 使い方ガイド詳細の metadata を生成する。
 */
export async function generateMetadata({ params }: GuidePostPageProps) {
  const { slug } = await params;

  try {
    const post = loadGuidePost(slug);
    return buildPageMetadata({
      title: post.pageTitle,
      description: post.description,
      canonicalPath: post.canonicalPath,
    });
  } catch (error) {
    if (isGuidePostNotFoundError(error)) {
      return {};
    }
    throw error;
  }
}

/**
 * 使い方ガイド詳細ページ
 */
export default async function GuidePostPage({ params }: GuidePostPageProps) {
  const { slug } = await params;

  let post;
  try {
    post = loadGuidePost(slug);
  } catch (error) {
    if (isGuidePostNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold tracking-wide text-indigo-600">ガイド {post.order}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">{post.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{post.summary}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
        <MarkdownContent content={post.content} />
        <p className="pt-2">
          <Link
            href="/guides"
            className="font-medium text-indigo-600 underline-offset-2 hover:underline"
          >
            使い方ガイド一覧へ戻る
          </Link>
        </p>
      </div>
    </div>
  );
}

/** 未生成 slug へのアクセスは 404 とする */
export const dynamicParams = false;
