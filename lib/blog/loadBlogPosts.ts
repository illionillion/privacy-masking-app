import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  assertBlogPostFrontmatter,
  assertBlogPostSlug,
  blogSlugFromFilename,
} from "@/lib/blog/frontmatter";
import { BlogPostNotFoundError } from "@/lib/blog/notFoundError";
import type { LoadedBlogPost } from "@/lib/blog/types";

export type { BlogPostFrontmatter, LoadedBlogPost } from "@/lib/blog/types";

const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");

/**
 * 記事タイトルから pageTitle を組み立てる。
 */
function buildBlogPageTitle(title: string): string {
  return `${title} | ブログ | 伏せ太郎（Fusely）`;
}

/**
 * slug から canonicalPath を組み立てる。
 */
function buildBlogCanonicalPath(slug: string): string {
  return `blog/${slug}`;
}

/**
 * `content/blog` 配下の Markdown ファイル名から slug 一覧を返す。
 */
function listBlogPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(BLOG_CONTENT_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((filename) => blogSlugFromFilename(filename));
}

/**
 * `content/blog/{slug}.md` を読み込む。
 */
export function loadBlogPost(slug: string): LoadedBlogPost {
  assertBlogPostSlug(slug);

  const filePath = path.join(BLOG_CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new BlogPostNotFoundError(`content/blog/${slug}.md: file not found`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = assertBlogPostFrontmatter(data as Record<string, unknown>, slug);

  return {
    ...frontmatter,
    slug,
    pageTitle: buildBlogPageTitle(frontmatter.title),
    description: frontmatter.summary,
    canonicalPath: buildBlogCanonicalPath(slug),
    content: content.trim(),
  };
}

/**
 * ブログ記事を日付降順（同日は slug 降順）で返す。
 */
export function loadAllBlogPosts(): LoadedBlogPost[] {
  const posts = listBlogPostSlugs().map((slug) => loadBlogPost(slug));

  return posts.sort((left, right) => {
    const dateCompare = right.date.localeCompare(left.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return right.slug.localeCompare(left.slug);
  });
}

/**
 * ブログ記事の slug 一覧を返す（静的生成用）。
 */
export function loadBlogPostSlugs(): string[] {
  return listBlogPostSlugs();
}
