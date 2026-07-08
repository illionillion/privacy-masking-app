import { isValidUpdateIsoDate } from "../formatUpdateDate";
import { normalizeSearchTags } from "../search/normalizeSearchTags";
import { BlogPostNotFoundError } from "./notFoundError";
import type { BlogPostFrontmatter } from "./types";

const REQUIRED_STRING_KEYS: (keyof Pick<BlogPostFrontmatter, "title" | "summary" | "category">)[] =
  ["title", "summary", "category"];

const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * gray-matter が YAML 日付を Date にパースする場合があるため、ISO 日付文字列に正規化する。
 */
function normalizeBlogPostDate(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * ブログ記事 slug が許可パターンに一致するか検証する。
 */
export function assertBlogPostSlug(slug: string): void {
  if (!BLOG_SLUG_PATTERN.test(slug)) {
    throw new BlogPostNotFoundError(`content/blog/${slug}.md: invalid slug "${slug}"`);
  }
}

/**
 * ブログ記事 MD の frontmatter に必須キーが揃っているか検証する。
 */
export function assertBlogPostFrontmatter(
  data: Record<string, unknown>,
  slug: string
): BlogPostFrontmatter {
  const missing: string[] = [];

  for (const key of REQUIRED_STRING_KEYS) {
    if (typeof data[key] !== "string" || (data[key] as string).length === 0) {
      missing.push(key);
    }
  }

  if (normalizeBlogPostDate(data.date) === null) {
    missing.push("date");
  }

  const tags = normalizeSearchTags(data.tags);
  if (!Array.isArray(data.tags) || tags.length === 0) {
    missing.push("tags");
  }

  if (missing.length > 0) {
    throw new Error(`content/blog/${slug}.md: missing or empty frontmatter: ${missing.join(", ")}`);
  }

  const date = normalizeBlogPostDate(data.date)!;
  if (!isValidUpdateIsoDate(date)) {
    throw new Error(
      `content/blog/${slug}.md: date must be a valid YYYY-MM-DD calendar date: ${date}`
    );
  }

  return {
    title: data.title as string,
    date,
    summary: data.summary as string,
    category: data.category as string,
    tags,
  };
}

/**
 * ブログ記事ファイル名から slug を取り出す。
 */
export function blogSlugFromFilename(filename: string): string {
  if (!filename.endsWith(".md")) {
    throw new Error(`content/blog/${filename}: filename must end with .md`);
  }

  const slug = filename.slice(0, -".md".length);
  assertBlogPostSlug(slug);

  return slug;
}
