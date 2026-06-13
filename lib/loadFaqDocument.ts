import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { assertFaqFrontmatter } from "@/lib/faqDocumentFrontmatter";
import { substituteLegalDocumentPlaceholders } from "@/lib/legalDocumentPlaceholders";
import type { LoadedFaqDocument } from "@/lib/loadFaqDocument.types";

export type { FaqDocumentFrontmatter, LoadedFaqDocument } from "@/lib/loadFaqDocument.types";

/**
 * `content/faq/faq.md` を読み込み、frontmatter と置換済み本文を返す。
 * 静的エクスポートのビルド時・Server Component からのみ呼び出すこと。
 */
export function loadFaqDocument(): LoadedFaqDocument {
  const filePath = path.join(process.cwd(), "content", "faq", "faq.md");
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = assertFaqFrontmatter(data as Record<string, unknown>);

  return {
    ...frontmatter,
    content: substituteLegalDocumentPlaceholders(content.trim()),
  };
}
