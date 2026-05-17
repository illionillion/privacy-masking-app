import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMarkdownContent } from "./index";

describe("LegalMarkdownContent", () => {
  it("内部リンクは Next Link、外部リンクは新規タブで開く", () => {
    render(
      <LegalMarkdownContent
        content={["[LP](/lp)", "", "[GitHub](https://github.com/example/repo)"].join("\n")}
      />
    );

    const lpLink = screen.getByRole("link", { name: "LP" });
    expect(lpLink).toHaveAttribute("href", "/lp");
    expect(lpLink.tagName).toBe("A");

    const githubLink = screen.getByRole("link", { name: "GitHub" });
    expect(githubLink).toHaveAttribute("href", "https://github.com/example/repo");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("ページ内アンカーは同一タブで開き target を付けない", () => {
    render(<LegalMarkdownContent content="[第1条](#第1条適用)" />);

    const anchorLink = screen.getByRole("link", { name: "第1条" });
    expect(anchorLink.getAttribute("href")).toMatch(/^#/);
    expect(decodeURIComponent(anchorLink.getAttribute("href") ?? "")).toBe("#第1条適用");
    expect(anchorLink).not.toHaveAttribute("target");
    expect(anchorLink).not.toHaveAttribute("rel");
  });

  it("h2 に id を付与する", () => {
    render(<LegalMarkdownContent content="## 第1条（適用）" />);

    const heading = screen.getByRole("heading", { level: 2, name: "第1条（適用）" });
    expect(heading).toHaveAttribute("id", "第1条適用");
  });
});
