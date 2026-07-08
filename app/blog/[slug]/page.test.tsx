import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/blog/loadBlogPosts", () => ({
  loadBlogPost: vi.fn((slug: string) => {
    if (slug !== "2026-07-08-event-photo-face-masking") {
      throw new Error("not found");
    }
    return {
      title: "イベント写真を SNS に投稿する前に顔を隠すべき理由",
      date: "2026-07-08",
      summary: "投稿前のチェックポイントをまとめます",
      category: "プライバシー",
      tags: ["SNS", "顔隠し"],
      slug: "2026-07-08-event-photo-face-masking",
      pageTitle: "イベント写真を SNS に投稿する前に顔を隠すべき理由 | ブログ | 伏せ太郎（Fusely）",
      description: "投稿前のチェックポイントをまとめます",
      canonicalPath: "blog/2026-07-08-event-photo-face-masking",
      content: "投稿前チェックリストを確認しましょう。\n\n[ブログ一覧へ](/blog)",
    };
  }),
  loadBlogPostSlugs: vi.fn(() => ["2026-07-08-event-photo-face-masking"]),
}));

import BlogPostPage from "./page";

describe("BlogPostPage", () => {
  it("ブログ記事詳細を表示する", async () => {
    const ui = await BlogPostPage({
      params: Promise.resolve({ slug: "2026-07-08-event-photo-face-masking" }),
    });
    render(ui);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "イベント写真を SNS に投稿する前に顔を隠すべき理由",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("公開日: 2026年7月8日")).toBeInTheDocument();
    expect(screen.getByText("プライバシー")).toBeInTheDocument();
    expect(screen.getByText("SNS")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ブログ一覧へ戻る" })).toHaveAttribute("href", "/blog");
  });
});
