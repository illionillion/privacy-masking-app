import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { MarkdownContent } from "@/components/MarkdownContent";
import { buildPageMetadata } from "@/lib/buildPageMetadata";
import { formatUpdateDate } from "@/lib/formatUpdateDate";
import { isUpdatePostNotFoundError } from "@/lib/updatePostNotFoundError";
import { loadUpdatePost, loadUpdatePostSlugs } from "@/lib/loadUpdatePosts";

type UpdatePostPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * 更新記事詳細の静的パスを生成する。
 */
export function generateStaticParams() {
  return loadUpdatePostSlugs().map((slug) => ({ slug }));
}

/**
 * 更新記事詳細の metadata を生成する。
 */
export async function generateMetadata({ params }: UpdatePostPageProps) {
  const { slug } = await params;

  try {
    const post = loadUpdatePost(slug);
    return buildPageMetadata({
      title: post.pageTitle,
      description: post.description,
      canonicalPath: post.canonicalPath,
    });
  } catch (error) {
    if (isUpdatePostNotFoundError(error)) {
      return {};
    }
    throw error;
  }
}

/**
 * 更新記事詳細ページ
 */
export default async function UpdatePostPage({ params }: UpdatePostPageProps) {
  const { slug } = await params;

  let post;
  try {
    post = loadUpdatePost(slug);
  } catch (error) {
    if (isUpdatePostNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  return (
    <LegalPageLayout title={post.title} dateText={formatUpdateDate(post.date)} dateLabel="公開日">
      <MarkdownContent content={post.content} />
      <p className="pt-2">
        <Link
          href="/updates"
          className="font-medium text-indigo-600 underline-offset-2 hover:underline"
        >
          更新情報一覧へ戻る
        </Link>
      </p>
    </LegalPageLayout>
  );
}

/** 未生成 slug へのアクセスは 404 とする */
export const dynamicParams = false;
