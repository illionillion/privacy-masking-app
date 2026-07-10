import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "./index";

describe("MarkdownContent", () => {
  it("内部リンクは Next Link、外部リンクは新規タブで開く", () => {
    render(
      <MarkdownContent
        content={[
          "[LP](/lp)",
          "",
          "[GitHub](https://github.com/example/repo)",
          "",
          "[protocol relative](//example.com)",
        ].join("\n")}
      />
    );

    const lpLink = screen.getByRole("link", { name: "LP" });
    expect(lpLink).toHaveAttribute("href", "/lp");
    expect(lpLink.tagName).toBe("A");

    const githubLink = screen.getByRole("link", { name: "GitHub" });
    expect(githubLink).toHaveAttribute("href", "https://github.com/example/repo");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");

    const protocolRelativeLink = screen.getByRole("link", { name: "protocol relative" });
    expect(protocolRelativeLink).toHaveAttribute("href", "//example.com");
    expect(protocolRelativeLink).toHaveAttribute("target", "_blank");
    expect(protocolRelativeLink).toHaveAttribute("rel", "noopener noreferrer");
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
    expect(heading).toHaveClass("scroll-mt-24");
  });

  it("重複 h2 には連番 id を付与する", () => {
    render(<MarkdownContent content={["## まとめ", "", "## まとめ"].join("\n")} />);

    const headings = screen.getAllByRole("heading", { level: 2, name: "まとめ" });
    expect(headings[0]).toHaveAttribute("id", "まとめ");
    expect(headings[1]).toHaveAttribute("id", "まとめ-2");
  });

  it("親の再レンダー後も h2 id がずれない", async () => {
    const user = userEvent.setup();

    function Wrapper({ content }: { content: string }) {
      const [count, setCount] = useState(0);

      return (
        <div>
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            rerender {count}
          </button>
          <MarkdownContent content={content} />
        </div>
      );
    }

    render(<Wrapper content={["## まとめ", "", "## まとめ"].join("\n")} />);

    await user.click(screen.getByRole("button", { name: "rerender 0" }));

    const headings = screen.getAllByRole("heading", { level: 2, name: "まとめ" });
    expect(headings[0]).toHaveAttribute("id", "まとめ");
    expect(headings[1]).toHaveAttribute("id", "まとめ-2");
  });

  it("details 記法を開閉ブロックとして表示する", () => {
    render(
      <MarkdownContent
        content={["::::details スマホの場合", "タップして画像を選択します。", "::::"].join("\n")}
      />
    );

    const summary = screen.getByText("スマホの場合");
    expect(summary.tagName).toBe("SUMMARY");
    expect(summary).toHaveClass("cursor-pointer");
    expect(summary.closest("details")).toBeInTheDocument();
    expect(summary.closest("details")).toHaveClass("rounded-lg");
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

  it("画像をクリックすると拡大モーダルを開閉できる", async () => {
    const user = userEvent.setup();
    render(<MarkdownContent content="![操作画面](/guides/manual-edit/edit-button.png)" />);

    await user.click(screen.getByRole("button", { name: "操作画面を拡大表示" }));

    const dialog = screen.getByRole("dialog", { name: "操作画面" });
    expect(within(dialog).getByRole("paragraph")).toHaveTextContent("操作画面");
    expect(screen.getAllByRole("img", { name: "操作画面" })).toHaveLength(2);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "操作画面" })).not.toBeInTheDocument();
  });

  it("画像 URL が欠けている場合は描画しない", () => {
    render(<MarkdownContent content="![欠落画像]()" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /拡大/ })).not.toBeInTheDocument();
  });

  it("右上の拡大ボタンからも画像モーダルを開ける", async () => {
    const user = userEvent.setup();
    render(<MarkdownContent content="![設定画面](/guides/settings/settings-modal.png)" />);

    const expandButton = screen.getByRole("button", { name: "設定画面をモーダルで開く" });
    expect(expandButton).toHaveClass("group-hover:opacity-100");

    await user.click(expandButton);
    await user.click(screen.getByRole("button", { name: "拡大画像を閉じる" }));

    expect(screen.queryByRole("dialog", { name: "設定画面" })).not.toBeInTheDocument();
  });

  it("HTML コメントを本文に表示しない", () => {
    render(
      <MarkdownContent
        content={["公開する本文", "<!--", "画像 TODO", "-->", "続きの本文"].join("\n")}
      />
    );

    expect(screen.getByText("公開する本文")).toBeInTheDocument();
    expect(screen.getByText("続きの本文")).toBeInTheDocument();
    expect(screen.queryByText("画像 TODO")).not.toBeInTheDocument();
  });

  it("HTML コメント内の h2 は id 割り当てに含めない", () => {
    render(
      <MarkdownContent
        content={["<!--", "## コメント内見出し", "-->", "## 実際の見出し"].join("\n")}
      />
    );

    const heading = screen.getByRole("heading", { level: 2, name: "実際の見出し" });
    expect(heading).toHaveAttribute("id", "実際の見出し");
  });

  it("テーブルに表示用スタイルを適用する", () => {
    render(<MarkdownContent content={["| 左 | 右 |", "| --- | --- |", "| A | B |"].join("\n")} />);

    expect(screen.getByRole("table")).toHaveClass("border-collapse");
    expect(screen.getByRole("columnheader", { name: "左" })).toHaveClass("px-3");
    expect(screen.getByRole("cell", { name: "A" })).toHaveClass("align-top");
  });
});
