import type { FaqDocumentFrontmatter } from "@/lib/loadFaqDocument.types";

const REQUIRED_FRONTMATTER_KEYS: (keyof FaqDocumentFrontmatter)[] = [
  "title",
  "pageTitle",
  "description",
  "canonicalPath",
  "lastUpdated",
];

/**
 * FAQ MD の frontmatter に必須キーが揃っているか検証する。
 */
export function assertFaqFrontmatter(data: Record<string, unknown>): FaqDocumentFrontmatter {
  const missing = REQUIRED_FRONTMATTER_KEYS.filter(
    (key) => typeof data[key] !== "string" || (data[key] as string).length === 0
  );
  if (missing.length > 0) {
    throw new Error(`content/faq/faq.md: missing or empty frontmatter: ${missing.join(", ")}`);
  }

  const canonicalPath = data.canonicalPath as string;
  if (canonicalPath.startsWith("/")) {
    throw new Error(`content/faq/faq.md: canonicalPath must not start with "/": ${canonicalPath}`);
  }
  if (canonicalPath !== "faq") {
    throw new Error(`content/faq/faq.md: canonicalPath must be "faq", got "${canonicalPath}"`);
  }

  return {
    title: data.title as string,
    pageTitle: data.pageTitle as string,
    description: data.description as string,
    canonicalPath,
    lastUpdated: data.lastUpdated as string,
  };
}
