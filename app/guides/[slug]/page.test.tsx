import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/guides/loadGuidePosts", () => ({
  loadGuidePost: vi.fn((slug: string) => {
    if (slug !== "image-import") {
      throw new Error("not found");
    }
    return {
      title: "画像の読み込ませ方",
      summary: "画像を追加して編集を始める手順",
      order: 1,
      slug: "image-import",
      pageTitle: "画像の読み込ませ方 | 使い方ガイド | 伏せ太郎（Fusely）",
      description: "画像を追加して編集を始める手順",
      canonicalPath: "guides/image-import",
      content:
        "## ドロップゾーンに画像をドラッグ&ドロップ\n\n画像はブラウザ内で処理されます。\n\n## まとめ\n\n準備完了です。",
    };
  }),
  loadGuidePostSlugs: vi.fn(() => ["image-import"]),
}));

import GuidePostPage from "./page";

describe("GuidePostPage", () => {
  it("使い方ガイド詳細を表示する", async () => {
    const ui = await GuidePostPage({
      params: Promise.resolve({ slug: "image-import" }),
    });
    render(ui);

    expect(screen.getByText("ガイド 1")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "画像の読み込ませ方" })
    ).toBeInTheDocument();
    expect(screen.getByText("画像はブラウザ内で処理されます。")).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "目次" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "使い方ガイド一覧へ戻る" })).toHaveAttribute(
      "href",
      "/guides"
    );
  });
});
