/**
 * Markdown 見出しテキストから HTML id 属性用の文字列を生成する。
 */
export function markdownHeadingToId(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[（）()]/g, "")
    .replace(/[^a-zA-Z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, "");
}

/**
 * 同一ページ内で重複しない見出し id を割り当てる。
 */
export function assignUniqueMarkdownHeadingId(text: string, usedIds: Set<string>): string {
  const base = markdownHeadingToId(text);

  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  usedIds.add(candidate);
  return candidate;
}
