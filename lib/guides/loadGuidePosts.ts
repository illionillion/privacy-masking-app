import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  assertGuidePostFrontmatter,
  assertGuidePostSlug,
  guideSlugFromFilename,
} from "@/lib/guides/frontmatter";
import { GuidePostNotFoundError } from "@/lib/guides/notFoundError";
import type { LoadedGuidePost } from "@/lib/guides/types";

export type { GuidePostFrontmatter, LoadedGuidePost } from "@/lib/guides/types";

const GUIDES_CONTENT_DIR = path.join(process.cwd(), "content", "guides");

/**
 * ガイドタイトルから pageTitle を組み立てる。
 */
function buildGuidePageTitle(title: string): string {
  return `${title} | 使い方ガイド | 伏せ太郎（Fusely）`;
}

/**
 * slug から canonicalPath を組み立てる。
 */
function buildGuideCanonicalPath(slug: string): string {
  return `guides/${slug}`;
}

/**
 * `content/guides` 配下の Markdown ファイル名から slug 一覧を返す。
 */
function listGuidePostSlugs(): string[] {
  if (!fs.existsSync(GUIDES_CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(GUIDES_CONTENT_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((filename) => guideSlugFromFilename(filename));
}

/**
 * `content/guides/{slug}.md` を読み込む。
 */
export function loadGuidePost(slug: string): LoadedGuidePost {
  assertGuidePostSlug(slug);

  const filePath = path.join(GUIDES_CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new GuidePostNotFoundError(`content/guides/${slug}.md: file not found`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = assertGuidePostFrontmatter(data as Record<string, unknown>, slug);

  return {
    ...frontmatter,
    slug,
    pageTitle: buildGuidePageTitle(frontmatter.title),
    description: frontmatter.summary,
    canonicalPath: buildGuideCanonicalPath(slug),
    content: content.trim(),
  };
}

/**
 * 使い方ガイドを order 昇順（同じ order は slug 昇順）で返す。
 */
export function loadAllGuidePosts(): LoadedGuidePost[] {
  const posts = listGuidePostSlugs().map((slug) => loadGuidePost(slug));

  return posts.sort((left, right) => {
    const orderCompare = left.order - right.order;
    if (orderCompare !== 0) {
      return orderCompare;
    }
    return left.slug.localeCompare(right.slug);
  });
}

/**
 * 使い方ガイドの slug 一覧を返す（静的生成用）。
 */
export function loadGuidePostSlugs(): string[] {
  return listGuidePostSlugs();
}
