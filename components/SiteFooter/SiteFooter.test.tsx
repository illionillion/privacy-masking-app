import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
  GITHUB_REPOSITORY_URL,
} from "@/lib/githubRepositoryUrl";
import { SiteFooter } from "./index";

describe("SiteFooter", () => {
  it("contentinfo ロールのフッターが表示される", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("内部リンクが正しい href を持つ", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: "プライバシーポリシー" })).toHaveAttribute(
      "href",
      "/privacy"
    );
    expect(screen.getByRole("link", { name: "利用規約" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "マスキングツール" })).toHaveAttribute("href", "/app");
  });

  it("GitHub 外部リンクが正しく設定される", () => {
    render(<SiteFooter />);
    const issuesLink = screen.getByRole("link", { name: /GitHub Issues/ });
    expect(issuesLink).toHaveAttribute("href", GITHUB_ISSUES_URL);
    expect(issuesLink).toHaveAttribute("target", "_blank");
    expect(issuesLink).toHaveAttribute("rel", "noopener noreferrer");

    const discussionsLink = screen.getByRole("link", { name: /GitHub Discussions/ });
    expect(discussionsLink).toHaveAttribute("href", GITHUB_DISCUSSIONS_URL);
    expect(discussionsLink).toHaveAttribute("target", "_blank");
    expect(discussionsLink).toHaveAttribute("rel", "noopener noreferrer");

    const repoLink = screen.getByRole("link", { name: /ソースコード/ });
    expect(repoLink).toHaveAttribute("href", GITHUB_REPOSITORY_URL);
    expect(repoLink).toHaveAttribute("target", "_blank");
    expect(repoLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
