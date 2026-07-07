import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { assertFaqFrontmatter } from "@/lib/faqDocumentFrontmatter";
import { assertGuidePostFrontmatter, guideSlugFromFilename } from "@/lib/guides/frontmatter";
import { substituteLegalDocumentPlaceholders } from "@/lib/legalDocumentPlaceholders";
import { parseFaqContent } from "@/lib/parseFaqContent";
import { normalizeSearchTags } from "@/lib/search/normalizeSearchTags";
import { stripMarkdownSnippet } from "@/lib/search/stripMarkdownSnippet";
import type { SearchIndexEntry } from "@/lib/search/types";
import { assertUpdatePostFrontmatter, updateSlugFromFilename } from "@/lib/updatePostFrontmatter";

/**
 * `content/guides` から検索 index エントリを収集する。
 */
function collectGuideEntries(contentRoot: string): SearchIndexEntry[] {
  const guidesDir = path.join(contentRoot, "guides");
  if (!fs.existsSync(guidesDir)) {
    return [];
  }

  return fs
    .readdirSync(guidesDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((filename) => {
      const slug = guideSlugFromFilename(filename);
      const raw = fs.readFileSync(path.join(guidesDir, filename), "utf8");
      const { data } = matter(raw);
      const frontmatter = assertGuidePostFrontmatter(data as Record<string, unknown>, slug);

      return {
        id: `guide:${slug}`,
        type: "guide" as const,
        title: frontmatter.title,
        summary: frontmatter.summary,
        tags: normalizeSearchTags(data.tags),
        url: `/guides/${slug}`,
      };
    });
}

/**
 * `content/updates` から検索 index エントリを収集する。
 */
function collectUpdateEntries(contentRoot: string): SearchIndexEntry[] {
  const updatesDir = path.join(contentRoot, "updates");
  if (!fs.existsSync(updatesDir)) {
    return [];
  }

  return fs
    .readdirSync(updatesDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((filename) => {
      const slug = updateSlugFromFilename(filename);
      const raw = fs.readFileSync(path.join(updatesDir, filename), "utf8");
      const { data } = matter(raw);
      const frontmatter = assertUpdatePostFrontmatter(data as Record<string, unknown>, slug);

      return {
        id: `update:${slug}`,
        type: "update" as const,
        title: frontmatter.title,
        summary: frontmatter.summary,
        tags: normalizeSearchTags(data.tags),
        url: `/updates/${slug}`,
      };
    });
}

/**
 * `content/faq/faq.md` から Q&A 単位の検索 index エントリを収集する。
 */
function collectFaqEntries(contentRoot: string): SearchIndexEntry[] {
  const filePath = path.join(contentRoot, "faq", "faq.md");
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  assertFaqFrontmatter(data as Record<string, unknown>);
  const parsed = parseFaqContent(substituteLegalDocumentPlaceholders(content.trim()));

  return parsed.items.map((item) => ({
    id: `faq:${item.id}`,
    type: "faq" as const,
    title: item.question,
    summary: stripMarkdownSnippet(item.answer),
    tags: ["FAQ"],
    url: `/faq#${item.id}`,
  }));
}

/**
 * guides / updates / FAQ からサイト内検索用 index を組み立てる。
 */
export function collectSearchIndexEntries(
  contentRoot = path.join(process.cwd(), "content")
): SearchIndexEntry[] {
  return [
    ...collectGuideEntries(contentRoot),
    ...collectUpdateEntries(contentRoot),
    ...collectFaqEntries(contentRoot),
  ];
}
