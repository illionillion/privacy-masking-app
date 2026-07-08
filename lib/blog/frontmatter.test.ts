import { describe, expect, it } from "vitest";
import { assertBlogPostFrontmatter } from "./frontmatter";

describe("assertBlogPostFrontmatter", () => {
  it("必須項目が揃っているとき frontmatter を返す", () => {
    const frontmatter = assertBlogPostFrontmatter(
      {
        title: "テスト記事",
        date: "2026-07-08",
        summary: "概要",
        category: "プライバシー",
        tags: ["SNS", "顔隠し"],
      },
      "2026-07-08-test"
    );

    expect(frontmatter).toEqual({
      title: "テスト記事",
      date: "2026-07-08",
      summary: "概要",
      category: "プライバシー",
      tags: ["SNS", "顔隠し"],
    });
  });

  it("date が Date のとき ISO 日付文字列に正規化する", () => {
    const frontmatter = assertBlogPostFrontmatter(
      {
        title: "テスト記事",
        date: new Date(Date.UTC(2026, 6, 8)),
        summary: "概要",
        category: "プライバシー",
        tags: ["SNS"],
      },
      "2026-07-08-test"
    );

    expect(frontmatter.date).toBe("2026-07-08");
  });

  it("tags が空配列のときエラーを投げる", () => {
    expect(() =>
      assertBlogPostFrontmatter(
        {
          title: "テスト記事",
          date: "2026-07-08",
          summary: "概要",
          category: "プライバシー",
          tags: [],
        },
        "2026-07-08-test"
      )
    ).toThrow(/missing or empty frontmatter: tags/);
  });

  it("category が欠けているときエラーを投げる", () => {
    expect(() =>
      assertBlogPostFrontmatter(
        {
          title: "テスト記事",
          date: "2026-07-08",
          summary: "概要",
          tags: ["SNS"],
        },
        "2026-07-08-test"
      )
    ).toThrow(/missing or empty frontmatter: category/);
  });

  it("date が実在しない暦日のときエラーを投げる", () => {
    expect(() =>
      assertBlogPostFrontmatter(
        {
          title: "テスト記事",
          date: "2026-07-32",
          summary: "概要",
          category: "プライバシー",
          tags: ["SNS"],
        },
        "2026-07-08-test"
      )
    ).toThrow(/valid YYYY-MM-DD calendar date/);
  });
});
