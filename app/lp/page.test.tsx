import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LpPage from "./page";

describe("LpPage", () => {
  it("サービス名が表示される", () => {
    render(<LpPage />);
    expect(screen.getAllByText("伏せ太郎").length).toBeGreaterThan(0);
  });

  it("キャッチコピーが表示される", () => {
    render(<LpPage />);
    expect(screen.getByText(/ブラウザだけで画像の/)).toBeInTheDocument();
  });

  it("CTAボタンが / へのリンクになっている", () => {
    render(<LpPage />);
    const ctaLinks = screen.getAllByRole("link", { name: /今すぐ使う/ });
    expect(ctaLinks.length).toBeGreaterThan(0);
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/");
    });
  });

  it("GitHubでスター導線が外部リンクになっている", () => {
    render(<LpPage />);
    const githubLink = screen.getByRole("link", { name: "GitHubでスター" });
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/illionillion/privacy-masking-app"
    );
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("デモセクションの見出しが表示される", () => {
    render(<LpPage />);
    expect(screen.getByText("こんな感じでマスキングできます")).toBeInTheDocument();
  });

  it("3ステップセクションの見出しが表示される", () => {
    render(<LpPage />);
    expect(screen.getByText("たった3ステップで完了")).toBeInTheDocument();
  });

  it("プライバシーセクションの見出しが表示される", () => {
    render(<LpPage />);
    expect(screen.getByText("プライバシーを最優先に設計")).toBeInTheDocument();
  });

  it("ユースケースセクションの見出しが表示される", () => {
    render(<LpPage />);
    expect(screen.getByText("こんな場面で使われています")).toBeInTheDocument();
  });
});
