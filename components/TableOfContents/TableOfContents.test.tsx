import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TableOfContents } from "./index";

vi.mock("@/lib/scrollToHeadingId", () => ({
  navigateToHeadingId: vi.fn(),
}));

import { navigateToHeadingId } from "@/lib/scrollToHeadingId";

describe("TableOfContents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("見出しが0件なら何も描画しない", () => {
    const { container } = render(<TableOfContents headings={[]} activeId={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("見出しが1件でもアンカーリンクを表示する", () => {
    render(<TableOfContents headings={[{ id: "ひとつ", text: "ひとつ" }]} activeId="ひとつ" />);

    expect(screen.getByRole("link", { name: "ひとつ" })).toHaveAttribute("href", "#ひとつ");
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

  it("リンククリックで navigateToHeadingId を呼ぶ", async () => {
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

    expect(navigateToHeadingId).toHaveBeenCalledWith("まとめ");
  });

  it("修飾キー付きクリックでは navigateToHeadingId を呼ばない", () => {
    render(
      <TableOfContents
        headings={[
          { id: "投稿前チェックリスト", text: "投稿前チェックリスト" },
          { id: "まとめ", text: "まとめ" },
        ]}
        activeId="投稿前チェックリスト"
      />
    );

    const link = screen.getByRole("link", { name: "まとめ" });
    link.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true, button: 0 })
    );

    expect(navigateToHeadingId).not.toHaveBeenCalled();
  });
});
