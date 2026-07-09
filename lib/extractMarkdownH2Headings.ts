import { assignUniqueMarkdownHeadingId } from "@/lib/markdownHeadingId";

export type MarkdownHeading = {
  id: string;
  text: string;
};

/** ATX 形式 h2（先頭インデント最大3スペース・末尾の閉じ `##` に対応） */
const ATX_H2_PATTERN = /^( {0,3})##(?!#)\s+(.+?)(?:\s+#+\s*)?$/;

/**
 * ATX 見出し行から h2 の表示テキストを取り出す。
 */
function parseAtxH2Line(line: string): string | null {
  const match = ATX_H2_PATTERN.exec(line);
  if (!match) {
    return null;
  }

  const text = match[2]!.trim();
  return text.length > 0 ? text : null;
}

/**
 * Markdown 本文から ATX 形式の h2（`##`）を抽出する。
 *
 * コードフェンス内の行は無視する。`MarkdownContent` が付与する id と揃えるため
 * `markdownHeadingToId` を使う。
 */
export function extractMarkdownH2Headings(content: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const usedIds = new Set<string>();
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

    const text = parseAtxH2Line(line);
    if (text === null) {
      continue;
    }

    headings.push({
      text,
      id: assignUniqueMarkdownHeadingId(text, usedIds),
    });
  }

  return headings;
}
