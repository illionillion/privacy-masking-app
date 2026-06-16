import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/loadUpdatePosts", () => ({
  loadUpdatePost: vi.fn((slug: string) => {
    if (slug !== "2026-06-10-ocr-phone-detection") {
      throw new Error("not found");
    }
    return {
      title: "OCRの電話番号検出を改善",
      date: "2026-06-10",
      summary: "電話番号の検出精度を改善しました",
      slug: "2026-06-10-ocr-phone-detection",
      pageTitle: "OCRの電話番号検出を改善 | 更新情報 | 伏せ太郎（Fusely）",
      description: "電話番号の検出精度を改善しました",
      canonicalPath: "updates/2026-06-10-ocr-phone-detection",
      content: "電話番号の検出精度を改善しました。\n\n[更新情報一覧へ](/updates)",
    };
  }),
  loadUpdatePostSlugs: vi.fn(() => ["2026-06-10-ocr-phone-detection"]),
}));

import UpdatePostPage from "./page";

describe("UpdatePostPage", () => {
  it("更新記事詳細を表示する", async () => {
    const ui = await UpdatePostPage({
      params: Promise.resolve({ slug: "2026-06-10-ocr-phone-detection" }),
    });
    render(ui);

    expect(
      screen.getByRole("heading", { level: 1, name: "OCRの電話番号検出を改善" })
    ).toBeInTheDocument();
    expect(screen.getByText("公開日: 2026年6月10日")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "更新情報一覧へ戻る" })).toHaveAttribute(
      "href",
      "/updates"
    );
  });
});
