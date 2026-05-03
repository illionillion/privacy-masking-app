import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConfirmStore } from "@/lib/confirmStore";
import { ConfirmDialog } from "./index";

/** ストアをリセットするヘルパー */
function resetStore() {
  useConfirmStore.setState({ isOpen: false, message: "", resolve: null });
}

describe("ConfirmDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  describe("表示・非表示", () => {
    it("isOpen が false のときは何もレンダリングしない", () => {
      render(<ConfirmDialog />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("open() を呼ぶとダイアログが表示される", async () => {
      render(<ConfirmDialog />);
      void useConfirmStore.getState().open("本当に削除しますか？");
      await screen.findByRole("dialog");
      expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();
    });
  });

  describe("Promise の解決", () => {
    it("OK ボタンをクリックすると Promise が true で解決される", async () => {
      render(<ConfirmDialog />);
      const promise = useConfirmStore.getState().open("確認");
      await screen.findByRole("dialog");

      await userEvent.click(screen.getByRole("button", { name: "OK" }));
      await expect(promise).resolves.toBe(true);
    });

    it("キャンセルボタンをクリックすると Promise が false で解決される", async () => {
      render(<ConfirmDialog />);
      const promise = useConfirmStore.getState().open("確認");
      await screen.findByRole("dialog");

      await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));
      await expect(promise).resolves.toBe(false);
    });

    it("オーバーレイをクリックすると Promise が false で解決される", async () => {
      render(<ConfirmDialog />);
      const promise = useConfirmStore.getState().open("確認");
      await screen.findByRole("dialog");

      await userEvent.click(document.querySelector(".absolute.inset-0.bg-black\\/50")!);
      await expect(promise).resolves.toBe(false);
    });
  });

  describe("キーボード操作", () => {
    it("ESC キーを押すと Promise が false で解決される", async () => {
      render(<ConfirmDialog />);
      const promise = useConfirmStore.getState().open("確認");
      await screen.findByRole("dialog");

      await userEvent.keyboard("{Escape}");
      await expect(promise).resolves.toBe(false);
    });
  });

  describe("フォーカス管理", () => {
    it("ダイアログが開いたとき、キャンセルボタンにフォーカスが移動する", async () => {
      render(<ConfirmDialog />);
      void useConfirmStore.getState().open("確認");
      await screen.findByRole("dialog");

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByRole("button", { name: "キャンセル" }));
      });
    });

    it("ダイアログを閉じると元のフォーカス位置に戻る", async () => {
      const { container } = render(
        <>
          <button type="button">トリガー</button>
          <ConfirmDialog />
        </>
      );
      const triggerButton = container.querySelector("button")!;
      triggerButton.focus();
      expect(document.activeElement).toBe(triggerButton);

      const promise = useConfirmStore.getState().open("確認");
      await screen.findByRole("dialog");

      await userEvent.click(screen.getByRole("button", { name: "OK" }));
      await promise;

      await waitFor(() => {
        expect(document.activeElement).toBe(triggerButton);
      });
    });
  });

  describe("再入処理", () => {
    it("ダイアログ表示中に再度 open() を呼ぶと前の Promise が false で解決される", async () => {
      render(<ConfirmDialog />);
      const firstPromise = useConfirmStore.getState().open("最初の確認");
      await screen.findByRole("dialog");

      void useConfirmStore.getState().open("2回目の確認");
      await expect(firstPromise).resolves.toBe(false);
    });
  });
});
