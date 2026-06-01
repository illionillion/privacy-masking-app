import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GITHUB_REPOSITORY_URL } from "@/lib/githubRepositoryUrl";
import Home from "./page";

describe("Home (LandingPage)", () => {
  it("サービス名が表示される", () => {
    render(<Home />);
    expect(screen.getAllByText("伏せ太郎").length).toBeGreaterThan(0);
  });

  it("キャッチコピーが表示される", () => {
    render(<Home />);
    expect(screen.getByText(/ブラウザだけで画像の/)).toBeInTheDocument();
  });

  it("CTAボタンが /app へのリンクになっている", () => {
    render(<Home />);
    const ctaLinks = screen.getAllByRole("link", { name: /今すぐ使う/ });
    expect(ctaLinks.length).toBeGreaterThan(0);
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/app");
    });
  });

  it("GitHubでスター導線が外部リンクになっている", () => {
    render(<Home />);
    const githubLink = screen.getByRole("link", { name: /GitHubでスター/ });
    expect(githubLink).toHaveAttribute("href", GITHUB_REPOSITORY_URL);
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("デモセクションの見出しが表示される", () => {
    render(<Home />);
    expect(screen.getByText("こんな感じでマスキングできます")).toBeInTheDocument();
  });

  it("3ステップセクションの見出しが表示される", () => {
    render(<Home />);
    expect(screen.getByText("たった3ステップで完了")).toBeInTheDocument();
  });
});
