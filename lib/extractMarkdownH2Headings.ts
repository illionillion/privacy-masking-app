import { markdownHeadingToId } from "@/lib/markdownHeadingId";

export type MarkdownHeading = {
  id: string;
  text: string;
};

/**
 * Markdown 本文から ATX 形式の h2（`##`）を抽出する。
 *
 * コードフェンス内の行は無視する。`MarkdownContent` が付与する id と揃えるため
 * `markdownHeadingToId` を使う。
 */
export function extractMarkdownH2Headings(content: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const lines = content.split("\n");
  let inCodeFence = false;

  for (const line of lines) {
    const trimmedStart = line.trimStart();
    if (trimmedStart.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) {
      continue;
    }

    const match = /^##\s+(.+)$/.exec(line);
    if (!match) {
      continue;
    }

    const text = match[1]!.trim();
    if (text.length === 0) {
      continue;
    }

    headings.push({
      text,
      id: markdownHeadingToId(text),
    });
  }

  return headings;
}
