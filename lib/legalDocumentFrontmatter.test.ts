import { describe, expect, it } from "vitest";
import { assertFrontmatter } from "./legalDocumentFrontmatter";

describe("assertFrontmatter", () => {
  it("必須キーが欠落しているときエラーを投げる", () => {
    expect(() => assertFrontmatter({}, "terms")).toThrow(
      "content/legal/terms.md: missing or empty frontmatter: title, pageTitle, description, canonicalPath, lastUpdated"
    );
  });

  it("必須キーが空文字のときエラーを投げる", () => {
    expect(() =>
      assertFrontmatter(
        {
          title: "利用規約",
          pageTitle: "",
          description: "説明",
          canonicalPath: "terms",
          lastUpdated: "2026年5月12日",
        },
        "privacy"
      )
    ).toThrow("content/legal/privacy.md: missing or empty frontmatter: pageTitle");
  });

  it("canonicalPath が / で始まるときエラーを投げる", () => {
    expect(() =>
      assertFrontmatter(
        {
          title: "利用規約",
          pageTitle: "利用規約 | 伏せ太郎",
          description: "説明",
          canonicalPath: "/terms",
          lastUpdated: "2026年5月12日",
        },
        "terms"
      )
    ).toThrow('content/legal/terms.md: canonicalPath must not start with "/": /terms');
  });

  it("canonicalPath が slug と一致しないときエラーを投げる", () => {
    expect(() =>
      assertFrontmatter(
        {
          title: "利用規約",
          pageTitle: "利用規約 | 伏せ太郎",
          description: "説明",
          canonicalPath: "privacy",
          lastUpdated: "2026年5月12日",
        },
        "terms"
      )
    ).toThrow('content/legal/terms.md: canonicalPath must be "terms", got "privacy"');
  });

  it("必須キーが揃っているとき frontmatter を返す", () => {
    const result = assertFrontmatter(
      {
        title: "利用規約",
        pageTitle: "利用規約 | 伏せ太郎",
        description: "説明",
        canonicalPath: "terms",
        lastUpdated: "2026年5月12日",
      },
      "terms"
    );

    expect(result.title).toBe("利用規約");
    expect(result.canonicalPath).toBe("terms");
  });
});
