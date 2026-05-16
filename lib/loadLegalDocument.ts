import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { substituteLegalDocumentPlaceholders } from "@/lib/legalDocumentPlaceholders";

/** 読み込み可能な法務ドキュメントの slug。 */
export type LegalDocumentSlug = "terms" | "privacy";

/** frontmatter から読み取る法務ページのメタ情報。 */
export type LegalDocumentFrontmatter = {
  title: string;
  pageTitle: string;
  description: string;
  canonicalPath: string;
  lastUpdated: string;
};

export type LoadedLegalDocument = LegalDocumentFrontmatter & {
  content: string;
};

const REQUIRED_FRONTMATTER_KEYS: (keyof LegalDocumentFrontmatter)[] = [
  "title",
  "pageTitle",
  "description",
  "canonicalPath",
  "lastUpdated",
];

function assertFrontmatter(
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

/**
 * `content/legal/{slug}.md` を読み込み、frontmatter と置換済み本文を返す。
 * 静的エクスポートのビルド時・Server Component からのみ呼び出すこと。
 */
export function loadLegalDocument(slug: LegalDocumentSlug): LoadedLegalDocument {
  const filePath = path.join(process.cwd(), "content", "legal", `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = assertFrontmatter(data as Record<string, unknown>, slug);

  return {
    ...frontmatter,
    content: substituteLegalDocumentPlaceholders(content.trim()),
  };
}
