import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/loadUpdatePosts", () => ({
  loadAllUpdatePosts: vi.fn(() => [
    {
      title: "OCRの電話番号検出を改善",
      date: "2026-06-10",
      summary: "電話番号の検出精度を改善しました",
      slug: "2026-06-10-ocr-phone-detection",
      pageTitle: "OCRの電話番号検出を改善 | 更新情報 | 伏せ太郎（Fusely）",
      description: "電話番号の検出精度を改善しました",
      canonicalPath: "updates/2026-06-10-ocr-phone-detection",
      content: "本文",
    },
  ]),
}));

import UpdatesPage from "./page";

describe("UpdatesPage", () => {
  it("更新情報一覧を表示する", () => {
    render(<UpdatesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "更新情報" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "OCRの電話番号検出を改善" })).toHaveAttribute(
      "href",
      "/updates/2026-06-10-ocr-phone-detection"
    );
  });
});
