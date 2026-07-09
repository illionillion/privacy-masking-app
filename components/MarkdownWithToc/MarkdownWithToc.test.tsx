import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownWithToc } from "./index";

vi.mock("@/lib/useActiveHeadingId", () => ({
  useActiveHeadingId: vi.fn(() => "まとめ"),
}));

describe("MarkdownWithToc", () => {
  it("見出しが1件以上なら目次を表示する", () => {
    render(
      <MarkdownWithToc
        headings={[
          { id: "投稿前チェックリスト", text: "投稿前チェックリスト" },
          { id: "まとめ", text: "まとめ" },
        ]}
        header={<h1>記事タイトル</h1>}
      >
        <p>本文</p>
      </MarkdownWithToc>
    );

    expect(screen.getAllByRole("navigation", { name: "目次" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { level: 1, name: "記事タイトル" })).toBeInTheDocument();
    expect(screen.getByText("本文")).toBeInTheDocument();
  });

  it("見出しが0件なら目次を出さない", () => {
    render(
      <MarkdownWithToc headings={[]} header={<h1>短い記事</h1>}>
        <p>本文</p>
      </MarkdownWithToc>
    );

    expect(screen.queryByRole("navigation", { name: "目次" })).not.toBeInTheDocument();
  });

  it("見出しが1件でも目次を表示する", () => {
    render(
      <MarkdownWithToc headings={[{ id: "ひとつ", text: "ひとつ" }]} header={<h1>短い記事</h1>}>
        <p>本文</p>
      </MarkdownWithToc>
    );

    expect(screen.getAllByRole("navigation", { name: "目次" }).length).toBeGreaterThan(0);
  });
});
