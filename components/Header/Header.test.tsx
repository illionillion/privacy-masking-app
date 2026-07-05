import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GITHUB_REPOSITORY_URL } from "@/lib/githubRepositoryUrl";
import { Header } from "./index";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

import { usePathname } from "next/navigation";

describe("Header", () => {
  it("アプリ名が表示される", () => {
    render(<Header />);
    expect(screen.getByText("伏せ太郎")).toBeInTheDocument();
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

  it("検索導線がモーダルを開くボタンになっている", () => {
    vi.mocked(usePathname).mockReturnValue("/faq");
    render(<Header />);

    expect(screen.getByRole("button", { name: "サイト内検索" })).toBeInTheDocument();
  });

  it("/app では検索導線を表示しない", () => {
    vi.mocked(usePathname).mockReturnValue("/app");
    render(<Header />);

    expect(screen.queryByRole("button", { name: "サイト内検索" })).not.toBeInTheDocument();
  });

  it("FAQ が /faq へのリンクになっている", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Header />);
    const link = screen.getByRole("link", { name: "FAQ" });
    expect(link).toHaveAttribute("href", "/faq");
  });

  it("今すぐ使うが /app へのリンクになっている", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: "今すぐ使う" });
    expect(link).toHaveAttribute("href", "/app");
  });

  it("GitHubリポジトリがアイコンリンクで外部遷移できる", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: /GitHubでスター/ });
    expect(link).toHaveAttribute("href", GITHUB_REPOSITORY_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
