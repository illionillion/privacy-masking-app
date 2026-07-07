/**
 * frontmatter の tags を検索用タグ配列へ正規化する。
 */
export function normalizeSearchTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    .map((tag) => tag.trim());
}
