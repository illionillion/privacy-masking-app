import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/loadUpdatePosts", () => ({
  loadAllUpdatePosts: vi.fn(() => [
    {
      title: "FAQページを追加",
      date: "2026-06-13",
      summary: "FAQ を公開しました",
      slug: "2026-06-13-faq-page",
      pageTitle: "FAQページを追加 | 更新情報 | 伏せ太郎（Fusely）",
      description: "FAQ を公開しました",
      canonicalPath: "updates/2026-06-13-faq-page",
      content: "本文",
    },
  ]),
}));

import UpdatesPage from "./page";

describe("UpdatesPage", () => {
  it("更新情報一覧を表示する", () => {
    render(<UpdatesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "更新情報" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "FAQページを追加" })).toHaveAttribute(
      "href",
      "/updates/2026-06-13-faq-page"
    );
  });
});
