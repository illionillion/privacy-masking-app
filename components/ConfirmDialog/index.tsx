"use client";

import { useCallback, useEffect, useRef } from "react";
import { useConfirmStore } from "@/lib/confirmStore";

/**
 * グローバル確認ダイアログコンポーネント
 *
 * `useConfirmStore` の `open` メソッドで表示され、
 * 「OK」または「キャンセル」でユーザーの応答を Promise で返す。
 *
 * - ESC キーでキャンセル
 * - Tab キーによるフォーカストラップ（ダイアログ内に留まる）
 * - ダイアログ表示中はスクロールをロック
 */
export function ConfirmDialog() {
  const { isOpen, message, close } = useConfirmStore();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  /**
   * ダイアログが開いたとき、キャンセルボタンにフォーカスを移動する。
   * 閉じたときは開く前にフォーカスしていた要素へフォーカスを戻す。
   */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevFocusedElement = document.activeElement as HTMLElement | null;
    if (isOpen) {
      cancelButtonRef.current?.focus();
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocusedElement?.focus();
    };
  }, [isOpen]);

  /** ESC キーでダイアログをキャンセルする */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  /**
   * Tab キーのフォーカストラップ処理
   *
   * ダイアログ内のフォーカス可能な要素の間でのみ Tab が循環するよう制御する。
   */
  const handleKeyDownDialog = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-message"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDownDialog}
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={() => close(false)}
      />

      {/* ダイアログ本体 */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-sm rounded-xl bg-white px-6 py-5 shadow-xl"
      >
        <p id="confirm-dialog-message" className="mb-5 text-sm text-zinc-800">
          {message}
        </p>

        <div className="flex justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={() => close(false)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
