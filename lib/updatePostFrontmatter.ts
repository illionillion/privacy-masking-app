import { isValidUpdateIsoDate } from "@/lib/formatUpdateDate";
import type { UpdatePostFrontmatter } from "@/lib/loadUpdatePosts.types";
import { UpdatePostNotFoundError } from "@/lib/updatePostNotFoundError";

const REQUIRED_FRONTMATTER_KEYS: (keyof UpdatePostFrontmatter)[] = ["title", "date", "summary"];

const UPDATE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * gray-matter が YAML 日付を Date にパースする場合があるため、ISO 日付文字列に正規化する。
 */
function normalizeUpdatePostDate(value: unknown): string | null {
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
 * 更新記事 slug が許可パターンに一致するか検証する。
 */
export function assertUpdatePostSlug(slug: string): void {
  if (!UPDATE_SLUG_PATTERN.test(slug)) {
    throw new UpdatePostNotFoundError(`content/updates/${slug}.md: invalid slug "${slug}"`);
  }
}

/**
 * 更新記事 MD の frontmatter に必須キーが揃っているか検証する。
 */
export function assertUpdatePostFrontmatter(
  data: Record<string, unknown>,
  slug: string
): UpdatePostFrontmatter {
  const missing = REQUIRED_FRONTMATTER_KEYS.filter((key) => {
    if (key === "date") {
      return normalizeUpdatePostDate(data.date) === null;
    }
    return typeof data[key] !== "string" || (data[key] as string).length === 0;
  });
  if (missing.length > 0) {
    throw new Error(
      `content/updates/${slug}.md: missing or empty frontmatter: ${missing.join(", ")}`
    );
  }

  const date = normalizeUpdatePostDate(data.date)!;
  if (!isValidUpdateIsoDate(date)) {
    throw new Error(`content/updates/${slug}.md: date must be YYYY-MM-DD: ${date}`);
  }

  return {
    title: data.title as string,
    date,
    summary: data.summary as string,
  };
}

/**
 * 更新記事ファイル名から slug を取り出す。
 */
export function updateSlugFromFilename(filename: string): string {
  if (!filename.endsWith(".md")) {
    throw new Error(`content/updates/${filename}: filename must end with .md`);
  }

  const slug = filename.slice(0, -".md".length);
  assertUpdatePostSlug(slug);

  return slug;
}
