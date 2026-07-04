import { GuidePostNotFoundError } from "@/lib/guides/notFoundError";
import type { GuidePostFrontmatter } from "@/lib/guides/types";

const REQUIRED_FRONTMATTER_KEYS: (keyof GuidePostFrontmatter)[] = ["title", "summary", "order"];

const GUIDE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * frontmatter の order を正の整数に正規化する。
 */
function normalizeGuidePostOrder(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return null;
  }

  return value;
}

/**
 * 使い方ガイド slug が許可パターンに一致するか検証する。
 */
export function assertGuidePostSlug(slug: string): void {
  if (!GUIDE_SLUG_PATTERN.test(slug)) {
    throw new GuidePostNotFoundError(`content/guides/${slug}.md: invalid slug "${slug}"`);
  }
}

/**
 * 使い方ガイド MD の frontmatter に必須キーが揃っているか検証する。
 */
export function assertGuidePostFrontmatter(
  data: Record<string, unknown>,
  slug: string
): GuidePostFrontmatter {
  const missing = REQUIRED_FRONTMATTER_KEYS.filter((key) => {
    if (key === "order") {
      return normalizeGuidePostOrder(data.order) === null;
    }
    return typeof data[key] !== "string" || (data[key] as string).length === 0;
  });
  if (missing.length > 0) {
    throw new Error(
      `content/guides/${slug}.md: missing or invalid frontmatter: ${missing.join(", ")}`
    );
  }

  return {
    title: data.title as string,
    summary: data.summary as string,
    order: normalizeGuidePostOrder(data.order)!,
  };
}

/**
 * 使い方ガイドファイル名から slug を取り出す。
 */
export function guideSlugFromFilename(filename: string): string {
  if (!filename.endsWith(".md")) {
    throw new Error(`content/guides/${filename}: filename must end with .md`);
  }

  const slug = filename.slice(0, -".md".length);
  assertGuidePostSlug(slug);

  return slug;
}
