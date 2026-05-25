"use client";

import clsx from "clsx";

interface EditorCanvasPlaceholderProps {
  /** ルート要素に追加するクラス */
  className?: string;
}

/**
 * 編集モーダル内キャンバスの読み込み中プレースホルダー
 *
 * 初回の dynamic import や画像メタデータ取得中にレイアウトシフトを抑える。
 */
export function EditorCanvasPlaceholder({ className }: EditorCanvasPlaceholderProps) {
  return (
    <div
      className={clsx([
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50",
        className,
      ])}
      aria-busy="true"
      aria-label="編集キャンバスを読み込み中"
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5">
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="h-7 w-20 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="min-h-[min(52dvh,28rem)] flex-1 animate-pulse bg-zinc-100" />
    </div>
  );
}
