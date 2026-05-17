import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { assertFrontmatter } from "@/lib/legalDocumentFrontmatter";
import { substituteLegalDocumentPlaceholders } from "@/lib/legalDocumentPlaceholders";
import type { LegalDocumentSlug, LoadedLegalDocument } from "@/lib/loadLegalDocument.types";

export type {
  LegalDocumentFrontmatter,
  LegalDocumentSlug,
  LoadedLegalDocument,
} from "@/lib/loadLegalDocument.types";

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
