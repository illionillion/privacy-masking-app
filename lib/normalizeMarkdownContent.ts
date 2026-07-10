const DETAILS_DIRECTIVE_PATTERN = /^(:{3,})details[ \t]+(.+)$/gm;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;

/**
 * Qiita 風の `:::details タイトル` を remark-directive のラベル構文へ正規化する。
 */
export function normalizeDetailsDirective(content: string): string {
  return content.replace(DETAILS_DIRECTIVE_PATTERN, (_, fence: string, rawTitle: string) => {
    const title = rawTitle.trim();
    return title.length > 0 ? `${fence}details[${title}]` : `${fence}details`;
  });
}

/**
 * 執筆メモ用の HTML コメントを公開本文から取り除く。
 */
export function stripMarkdownComments(content: string): string {
  return content.replace(HTML_COMMENT_PATTERN, "");
}

/**
 * Markdown 本文を `MarkdownContent` の描画前処理と同じ形に正規化する。
 */
export function normalizeMarkdownContent(content: string): string {
  return normalizeDetailsDirective(stripMarkdownComments(content));
}
