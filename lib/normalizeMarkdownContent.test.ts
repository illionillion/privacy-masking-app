import { describe, expect, it } from "vitest";
import { extractMarkdownH2Headings } from "./extractMarkdownH2Headings";
import { normalizeMarkdownContent } from "./normalizeMarkdownContent";

describe("normalizeMarkdownContent", () => {
  it("HTML コメントを除去する", () => {
    const normalized = normalizeMarkdownContent(
      ["公開する本文", "<!--", "## コメント内見出し", "-->", "続きの本文"].join("\n")
    );

    expect(normalized).not.toContain("コメント内見出し");
    expect(normalized).toContain("公開する本文");
    expect(normalized).toContain("続きの本文");
  });

  it("details ディレクティブを remark-directive 向けに正規化する", () => {
    const normalized = normalizeMarkdownContent("::::details スマホの場合");

    expect(normalized).toBe("::::details[スマホの場合]");
  });
});

describe("extractMarkdownH2Headings with normalizeMarkdownContent", () => {
  it("HTML コメント内の h2 は見出しとして数えない", () => {
    const content = ["<!--", "## コメント内見出し", "-->", "## 実際の見出し"].join("\n");
    const headings = extractMarkdownH2Headings(normalizeMarkdownContent(content));

    expect(headings).toEqual([{ text: "実際の見出し", id: "実際の見出し" }]);
  });
});
