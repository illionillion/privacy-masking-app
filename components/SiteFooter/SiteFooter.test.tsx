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
    expect(screen.getByRole("link", { name: "サービス紹介（LP）" })).toHaveAttribute("href", "/lp");
  });

  it("GitHub 外部リンクが正しく設定される", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: /GitHub Issues/ })).toHaveAttribute(
      "href",
      GITHUB_ISSUES_URL
    );
    expect(screen.getByRole("link", { name: /GitHub Discussions/ })).toHaveAttribute(
      "href",
      GITHUB_DISCUSSIONS_URL
    );
    expect(screen.getByRole("link", { name: /ソースコード/ })).toHaveAttribute(
      "href",
      GITHUB_REPOSITORY_URL
    );
  });
});
