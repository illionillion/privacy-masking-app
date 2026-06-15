import { describe, expect, it } from "vitest";
import { assertUpdatePostFrontmatter } from "./updatePostFrontmatter";

describe("assertUpdatePostFrontmatter", () => {
  it("date が文字列のときそのまま検証する", () => {
    const frontmatter = assertUpdatePostFrontmatter(
      {
        title: "テスト記事",
        date: "2026-06-10",
        summary: "概要",
      },
      "2026-06-10-test"
    );

    expect(frontmatter.date).toBe("2026-06-10");
  });

  it("date が Date のとき ISO 日付文字列に正規化する", () => {
    const frontmatter = assertUpdatePostFrontmatter(
      {
        title: "テスト記事",
        date: new Date(Date.UTC(2026, 5, 10)),
        summary: "概要",
      },
      "2026-06-10-test"
    );

    expect(frontmatter.date).toBe("2026-06-10");
  });

  it("date が不正な Date のときエラーを投げる", () => {
    expect(() =>
      assertUpdatePostFrontmatter(
        {
          title: "テスト記事",
          date: new Date("invalid"),
          summary: "概要",
        },
        "2026-06-10-test"
      )
    ).toThrow(/missing or empty frontmatter: date/);
  });

  it("date が実在しない暦日のときエラーを投げる", () => {
    expect(() =>
      assertUpdatePostFrontmatter(
        {
          title: "テスト記事",
          date: "2026-06-31",
          summary: "概要",
        },
        "2026-06-10-test"
      )
    ).toThrow(/valid YYYY-MM-DD calendar date/);
  });
});
