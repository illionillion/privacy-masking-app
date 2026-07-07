const DEFAULT_SNIPPET_LENGTH = 160;

/**
 * Markdown 断片を検索用のプレーンテキストへ変換する。
 */
export function stripMarkdownSnippet(text: string, maxLength = DEFAULT_SNIPPET_LENGTH): string {
  const plain = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength)}…`;
}
