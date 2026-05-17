/**
 * 見出しテキストから HTML id 属性用の文字列を生成する。
 */
export function legalHeadingToId(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[（）()]/g, "")
    .replace(/[^a-zA-Z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, "");
}
