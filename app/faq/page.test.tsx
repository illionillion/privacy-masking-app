import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/loadFaqDocument", () => ({
  loadFaqDocument: vi.fn(() => ({
    title: "よくある質問（FAQ）",
    pageTitle: "よくある質問（FAQ） | 伏せ太郎（Fusely）",
    description: "テスト用 description",
    canonicalPath: "faq",
    lastUpdated: "2026年6月1日",
    content: [
      "伏せ太郎（Fusely）の FAQ です。",
      "",
      "## 画像はサーバーに送信されますか？",
      "",
      "送信されません。",
      "",
      "## 対応している画像形式とサイズ上限は？",
      "",
      "JPEG / PNG / WebP / GIF に対応しています。",
    ].join("\n"),
  })),
}));

import FaqPage from "./page";

describe("FaqPage", () => {
  it("FAQ の見出しと主要な質問が表示される", () => {
    render(<FaqPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "よくある質問（FAQ）" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "画像はサーバーに送信されますか？" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "対応している画像形式とサイズ上限は？" })
    ).toBeInTheDocument();
    expect(screen.getByText("送信されません。")).toBeInTheDocument();
  });
});
