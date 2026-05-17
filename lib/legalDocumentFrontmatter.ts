import type { LegalDocumentFrontmatter, LegalDocumentSlug } from "@/lib/loadLegalDocument.types";

const REQUIRED_FRONTMATTER_KEYS: (keyof LegalDocumentFrontmatter)[] = [
  "title",
  "pageTitle",
  "description",
  "canonicalPath",
  "lastUpdated",
];

/**
 * 法務 MD の frontmatter に必須キーが揃っているか検証する。
 */
export function assertFrontmatter(
  data: Record<string, unknown>,
  slug: LegalDocumentSlug
): LegalDocumentFrontmatter {
  const missing = REQUIRED_FRONTMATTER_KEYS.filter(
    (key) => typeof data[key] !== "string" || (data[key] as string).length === 0
  );
  if (missing.length > 0) {
    throw new Error(
      `content/legal/${slug}.md: missing or empty frontmatter: ${missing.join(", ")}`
    );
  }

  return {
    title: data.title as string,
    pageTitle: data.pageTitle as string,
    description: data.description as string,
    canonicalPath: data.canonicalPath as string,
    lastUpdated: data.lastUpdated as string,
  };
}
