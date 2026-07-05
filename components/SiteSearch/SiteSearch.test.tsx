import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteSearch } from "./index";
import type { SearchIndexEntry } from "@/lib/search/types";

const SAMPLE_INDEX: SearchIndexEntry[] = [
  {
    id: "guide:settings",
    type: "guide",
    title: "設定を変える方法",
    summary: "検出やマスキングの設定を変更します。",
    tags: ["設定"],
    url: "/guides/settings",
  },
  {
    id: "faq:privacy",
    type: "faq",
    title: "画像はサーバーに送信されますか？",
    summary: "送信されません。",
    tags: ["FAQ"],
    url: "/faq#privacy",
  },
];

describe("SiteSearch", () => {
  it("index を読み込んでクエリで絞り込める", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => SAMPLE_INDEX,
      })
    );

    render(<SiteSearch />);

    await waitFor(() => {
      expect(screen.getByText("2 件のページを検索できます")).toBeInTheDocument();
    });

    await user.type(screen.getByRole("searchbox"), "設定");

    expect(screen.getByText("1 件の結果")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "設定を変える方法" })).toHaveAttribute(
      "href",
      "/guides/settings"
    );
    expect(
      screen.queryByRole("link", { name: "画像はサーバーに送信されますか？" })
    ).not.toBeInTheDocument();
  });
});
