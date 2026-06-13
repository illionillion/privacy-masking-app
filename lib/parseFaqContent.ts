import { legalHeadingToId } from "@/lib/legalHeadingId";

/** FAQ の1問1答。 */
export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

/** FAQ Markdown を intro と Q&A 一覧に分割した結果。 */
export type ParsedFaqContent = {
  intro: string;
  items: FaqItem[];
  footer: string;
};

const FAQ_FOOTER_PATTERN = /\n*\[トップページへ戻る\]\(\/\)\s*$/;

/**
 * FAQ Markdown 本文を intro・Q&A・フッターに分割する。
 * 見出し（`##`）を質問、直下の本文を回答として扱う。
 */
export function parseFaqContent(content: string): ParsedFaqContent {
  const trimmed = content.trim();
  const footerMatch = trimmed.match(FAQ_FOOTER_PATTERN);
  const body = footerMatch ? trimmed.replace(FAQ_FOOTER_PATTERN, "").trim() : trimmed;
  const footer = footerMatch ? "[トップページへ戻る](/)" : "";

  const sections = body.split(/^## /m);
  const intro = sections[0]?.trim() ?? "";
  const items = sections.slice(1).map((section) => {
    const newlineIndex = section.indexOf("\n");
    const question = newlineIndex === -1 ? section.trim() : section.slice(0, newlineIndex).trim();
    const answer = newlineIndex === -1 ? "" : section.slice(newlineIndex + 1).trim();

    return {
      id: legalHeadingToId(question),
      question,
      answer,
    };
  });

  return { intro, items, footer };
}
