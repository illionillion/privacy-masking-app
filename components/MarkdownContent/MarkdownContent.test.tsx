import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "./index";

describe("MarkdownContent", () => {
  it("内部リンクは Next Link、外部リンクは新規タブで開く", () => {
    render(
      <MarkdownContent
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
    render(<MarkdownContent content="[第1条](#第1条適用)" />);

    const anchorLink = screen.getByRole("link", { name: "第1条" });
    expect(anchorLink.getAttribute("href")).toMatch(/^#/);
    expect(decodeURIComponent(anchorLink.getAttribute("href") ?? "")).toBe("#第1条適用");
    expect(anchorLink).not.toHaveAttribute("target");
    expect(anchorLink).not.toHaveAttribute("rel");
  });

  it("h2 に id を付与する", () => {
    render(<MarkdownContent content="## 第1条（適用）" />);

    const heading = screen.getByRole("heading", { level: 2, name: "第1条（適用）" });
    expect(heading).toHaveAttribute("id", "第1条適用");
  });

  it("details 記法を開閉ブロックとして表示する", () => {
    render(
      <MarkdownContent
        content={["::::details スマホの場合", "タップして画像を選択します。", "::::"].join("\n")}
      />
    );

    const summary = screen.getByText("スマホの場合");
    expect(summary.tagName).toBe("SUMMARY");
    expect(summary.closest("details")).toBeInTheDocument();
    expect(screen.getByText("タップして画像を選択します。")).toBeInTheDocument();
  });

  it("画像 URL の hash で表示サイズを指定できる", () => {
    render(
      <MarkdownContent content="![スマホで画像を選択する場合](/guides/image-import/image-select-sp.png#small)" />
    );

    const image = screen.getByRole("img", { name: "スマホで画像を選択する場合" });
    expect(image).toHaveAttribute("src", "/guides/image-import/image-select-sp.png");
    expect(image).toHaveClass("max-w-48");
  });
});
