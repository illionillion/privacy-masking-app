import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/guides/loadGuidePosts", () => ({
  loadAllGuidePosts: vi.fn(() => [
    {
      title: "画像の読み込ませ方",
      summary: "画像を追加して編集を始める手順",
      order: 1,
      slug: "image-import",
      pageTitle: "画像の読み込ませ方 | 使い方ガイド | 伏せ太郎（Fusely）",
      description: "画像を追加して編集を始める手順",
      canonicalPath: "guides/image-import",
      content: "本文",
    },
  ]),
}));

import GuidesPage from "./page";

describe("GuidesPage", () => {
  it("使い方ガイド一覧を表示する", () => {
    render(<GuidesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "使い方ガイド" })).toBeInTheDocument();
    expect(screen.getByText(/画像はブラウザ内で処理され/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "画像の読み込ませ方" })).toHaveAttribute(
      "href",
      "/guides/image-import"
    );
  });
});
