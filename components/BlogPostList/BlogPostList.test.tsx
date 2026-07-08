import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogPostList } from "./index";

describe("BlogPostList", () => {
  it("記事一覧を表示する", () => {
    render(
      <BlogPostList
        posts={[
          {
            title: "テスト記事",
            date: "2026-07-08",
            summary: "概要テキスト",
            category: "プライバシー",
            tags: ["SNS"],
            slug: "2026-07-08-test",
            pageTitle: "テスト記事 | ブログ | 伏せ太郎（Fusely）",
            description: "概要テキスト",
            canonicalPath: "blog/2026-07-08-test",
            content: "本文",
          },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "テスト記事" })).toHaveAttribute(
      "href",
      "/blog/2026-07-08-test"
    );
    expect(screen.getByText("概要テキスト")).toBeInTheDocument();
    expect(screen.getByText("プライバシー")).toBeInTheDocument();
    expect(screen.getByText("2026年7月8日")).toBeInTheDocument();
  });
});
