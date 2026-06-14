import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/loadUpdatePosts", () => ({
  loadUpdatePost: vi.fn((slug: string) => {
    if (slug !== "2026-06-13-faq-page") {
      throw new Error("not found");
    }
    return {
      title: "FAQページを追加",
      date: "2026-06-13",
      summary: "FAQ を公開しました",
      slug: "2026-06-13-faq-page",
      pageTitle: "FAQページを追加 | 更新情報 | 伏せ太郎（Fusely）",
      description: "FAQ を公開しました",
      canonicalPath: "updates/2026-06-13-faq-page",
      content: "FAQ ページを追加しました。\n\n[更新情報一覧へ](/updates)",
    };
  }),
  loadUpdatePostSlugs: vi.fn(() => ["2026-06-13-faq-page"]),
}));

import UpdatePostPage from "./page";

describe("UpdatePostPage", () => {
  it("更新記事詳細を表示する", async () => {
    const ui = await UpdatePostPage({
      params: Promise.resolve({ slug: "2026-06-13-faq-page" }),
    });
    render(ui);

    expect(screen.getByRole("heading", { level: 1, name: "FAQページを追加" })).toBeInTheDocument();
    expect(screen.getByText("公開日: 2026年6月13日")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "更新情報一覧へ戻る" })).toHaveAttribute(
      "href",
      "/updates"
    );
  });
});
