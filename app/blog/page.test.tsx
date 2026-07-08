import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/blog/loadBlogPosts", () => ({
  loadAllBlogPosts: vi.fn(() => [
    {
      title: "イベント写真を SNS に投稿する前に顔を隠すべき理由",
      date: "2026-07-08",
      summary: "投稿前のチェックポイントをまとめます",
      category: "プライバシー",
      tags: ["SNS", "顔隠し"],
      slug: "2026-07-08-event-photo-face-masking",
      pageTitle: "イベント写真を SNS に投稿する前に顔を隠すべき理由 | ブログ | 伏せ太郎（Fusely）",
      description: "投稿前のチェックポイントをまとめます",
      canonicalPath: "blog/2026-07-08-event-photo-face-masking",
      content: "本文",
    },
  ]),
}));

import BlogPage from "./page";

describe("BlogPage", () => {
  it("ブログ一覧を表示する", () => {
    render(<BlogPage />);

    expect(screen.getByRole("heading", { level: 1, name: "ブログ" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "イベント写真を SNS に投稿する前に顔を隠すべき理由" })
    ).toHaveAttribute("href", "/blog/2026-07-08-event-photo-face-masking");
  });
});
