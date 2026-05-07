import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GITHUB_REPOSITORY_URL } from "@/lib/githubRepositoryUrl";
import { Header } from "./index";

describe("Header", () => {
  it("アプリ名が表示される", () => {
    render(<Header />);
    expect(screen.getByText("伏せ太郎")).toBeInTheDocument();
  });

  it("サブタイトルが表示される", () => {
    render(<Header />);
    expect(screen.getByText("画像内の顔・個人情報を安全にマスキング")).toBeInTheDocument();
  });

  it("header要素がレンダリングされる", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("ロゴがトップページ(/)へのリンクになっている", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: /伏せ太郎/ });
    expect(link).toHaveAttribute("href", "/");
  });

  it("サービス紹介がLP(/lp)へのリンクになっている", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: "サービス紹介" });
    expect(link).toHaveAttribute("href", "/lp");
  });

  it("GitHubリポジトリがアイコンリンクで外部遷移できる", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: /GitHubでスター/ });
    expect(link).toHaveAttribute("href", GITHUB_REPOSITORY_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
