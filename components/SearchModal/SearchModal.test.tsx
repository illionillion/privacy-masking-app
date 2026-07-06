import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetSearchIndexStore, useSearchIndexStore } from "@/lib/searchIndexStore";
import { useSearchModalStore } from "@/lib/searchModalStore";
import { SearchModal } from "./index";

/** ストアをリセットするヘルパー */
function resetStore() {
  useSearchModalStore.setState({ isOpen: false });
  resetSearchIndexStore();
}

describe("SearchModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("isOpen が false のときは何もレンダリングしない", () => {
    render(<SearchModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("マウント時に検索 index の preload を開始する", () => {
    const preload = vi.fn();
    useSearchIndexStore.setState({ preload });
    render(<SearchModal />);
    expect(preload).toHaveBeenCalledTimes(1);
  });

  it("open() を呼ぶとダイアログとオーバーレイが表示される", async () => {
    render(<SearchModal />);
    useSearchModalStore.getState().open();
    await screen.findByRole("dialog");
    expect(screen.getByRole("heading", { name: "サイト内検索" })).toBeInTheDocument();
    expect(document.querySelector(".absolute.inset-0.bg-black\\/50")).toBeInTheDocument();
  });

  it("閉じるボタンでモーダルが閉じる", async () => {
    const user = userEvent.setup();
    render(<SearchModal />);
    useSearchModalStore.getState().open();
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "検索を閉じる" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("オーバーレイをクリックするとモーダルが閉じる", async () => {
    const user = userEvent.setup();
    render(<SearchModal />);
    useSearchModalStore.getState().open();
    await screen.findByRole("dialog");

    await user.click(document.querySelector(".absolute.inset-0.bg-black\\/50")!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ESC キーでモーダルが閉じる", async () => {
    const user = userEvent.setup();
    render(<SearchModal />);
    useSearchModalStore.getState().open();
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("開いたとき閉じるボタンにフォーカスが移動する", async () => {
    render(<SearchModal />);
    useSearchModalStore.getState().open();
    await screen.findByRole("dialog");

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "検索を閉じる" }));
    });
  });
});
