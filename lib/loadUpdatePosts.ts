import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { substituteLegalDocumentPlaceholders } from "@/lib/legalDocumentPlaceholders";
import type { LoadedUpdatePost } from "@/lib/loadUpdatePosts.types";
import {
  assertUpdatePostFrontmatter,
  assertUpdatePostSlug,
  updateSlugFromFilename,
} from "@/lib/updatePostFrontmatter";

export type { LoadedUpdatePost, UpdatePostFrontmatter } from "@/lib/loadUpdatePosts.types";

const UPDATES_CONTENT_DIR = path.join(process.cwd(), "content", "updates");

/**
 * 更新記事が存在しない（404 相当）エラーか判定する。
 */
export function isUpdatePostNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes(": invalid slug") || error.message.includes(": file not found");
}

/**
 * 記事タイトルから pageTitle を組み立てる。
 */
function buildUpdatePageTitle(title: string): string {
  return `${title} | 更新情報 | 伏せ太郎（Fusely）`;
}

/**
 * slug から canonicalPath を組み立てる。
 */
function buildUpdateCanonicalPath(slug: string): string {
  return `updates/${slug}`;
}

/**
 * `content/updates` 配下の Markdown ファイル名から slug 一覧を返す。
 */
function listUpdatePostSlugs(): string[] {
  if (!fs.existsSync(UPDATES_CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(UPDATES_CONTENT_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((filename) => updateSlugFromFilename(filename));
}

/**
 * `content/updates/{slug}.md` を読み込む。
 */
export function loadUpdatePost(slug: string): LoadedUpdatePost {
  assertUpdatePostSlug(slug);

  const filePath = path.join(UPDATES_CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`content/updates/${slug}.md: file not found`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = assertUpdatePostFrontmatter(data as Record<string, unknown>, slug);

  return {
    ...frontmatter,
    slug,
    pageTitle: buildUpdatePageTitle(frontmatter.title),
    description: frontmatter.summary,
    canonicalPath: buildUpdateCanonicalPath(slug),
    content: substituteLegalDocumentPlaceholders(content.trim()),
  };
}

/**
 * 更新記事を日付降順（同日は slug 降順）で返す。
 */
export function loadAllUpdatePosts(): LoadedUpdatePost[] {
  const posts = listUpdatePostSlugs().map((slug) => loadUpdatePost(slug));

  return posts.sort((left, right) => {
    const dateCompare = right.date.localeCompare(left.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return right.slug.localeCompare(left.slug);
  });
}

/**
 * 更新記事の slug 一覧を返す（静的生成用）。
 */
export function loadUpdatePostSlugs(): string[] {
  return listUpdatePostSlugs();
}
