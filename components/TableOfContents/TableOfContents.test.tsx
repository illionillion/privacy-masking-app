import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TableOfContents } from "./index";

vi.mock("@/lib/scrollToHeadingId", () => ({
  scrollToHeadingId: vi.fn(() => true),
}));

import { scrollToHeadingId } from "@/lib/scrollToHeadingId";

describe("TableOfContents", () => {
  it("見出しが2件未満なら何も描画しない", () => {
    const { container } = render(
      <TableOfContents headings={[{ id: "ひとつ", text: "ひとつ" }]} activeId="ひとつ" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("見出しへのアンカーリンクを表示する", () => {
    render(
      <TableOfContents
        headings={[
          { id: "投稿前チェックリスト", text: "投稿前チェックリスト" },
          { id: "まとめ", text: "まとめ" },
        ]}
        activeId="まとめ"
      />
    );

    expect(screen.getByRole("navigation", { name: "目次" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "投稿前チェックリスト" })).toHaveAttribute(
      "href",
      "#投稿前チェックリスト"
    );
    expect(screen.getByRole("link", { name: "まとめ" })).toHaveAttribute("aria-current", "true");
  });

  it("collapsible のとき details で折りたためる", () => {
    render(
      <TableOfContents
        headings={[
          { id: "a", text: "見出しA" },
          { id: "b", text: "見出しB" },
        ]}
        activeId="a"
        collapsible
      />
    );

    expect(screen.getByText("目次").closest("summary")).toBeInTheDocument();
    expect(document.querySelector("details")).toBeInTheDocument();
  });

  it("リンククリックで scrollToHeadingId を呼ぶ", async () => {
    const user = userEvent.setup();

    render(
      <TableOfContents
        headings={[
          { id: "投稿前チェックリスト", text: "投稿前チェックリスト" },
          { id: "まとめ", text: "まとめ" },
        ]}
        activeId="投稿前チェックリスト"
      />
    );

    await user.click(screen.getByRole("link", { name: "まとめ" }));

    expect(scrollToHeadingId).toHaveBeenCalledWith("まとめ");
  });
});
