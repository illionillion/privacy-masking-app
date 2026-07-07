import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    vi.unstubAllGlobals();
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("isOpen が false のときは何もレンダリングしない", () => {
    render(<SearchModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("open() を呼ぶとダイアログとオーバーレイが表示される", async () => {
    render(<SearchModal />);
    useSearchModalStore.getState().open();
    await screen.findByRole("dialog");
    expect(screen.getByRole("heading", { name: "サイト内検索" })).toBeInTheDocument();
    expect(screen.getByTestId("search-modal-overlay")).toBeInTheDocument();
  });

  it("開いたとき preload を呼び失敗状態からリトライする", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
    vi.stubGlobal("fetch", fetchMock);

    useSearchIndexStore.getState().preload();
    await vi.waitFor(() => {
      expect(useSearchIndexStore.getState().loadError).not.toBeNull();
    });

    render(<SearchModal />);
    useSearchModalStore.getState().open();
    await screen.findByRole("dialog");

    await vi.waitFor(() => {
      expect(useSearchIndexStore.getState().hasLoaded).toBe(true);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
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

    await user.click(screen.getByTestId("search-modal-overlay"));
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
