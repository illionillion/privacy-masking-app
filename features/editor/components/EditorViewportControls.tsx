"use client";

import clsx from "clsx";

interface EditorViewportControlsProps {
  /** ルート要素に追加するクラス（モーダル内 sticky など） */
  className?: string;
  viewZoom: number;
  onResetViewport: () => void;
}

/**
 * EditorCanvas 上部の表示ズームコントロール（等倍・中央リセットのみ）
 */
export function EditorViewportControls({
  className,
  viewZoom,
  onResetViewport,
}: EditorViewportControlsProps) {
  return (
    <div
      className={clsx([
        "flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5",
        className,
      ])}
    >
      <span className="text-xs text-zinc-600">表示ズーム</span>
      <div className="flex items-center gap-2">
        <span className="text-xs tabular-nums text-zinc-500">{Math.round(viewZoom * 100)}%</span>
        <button
          type="button"
          className="inline-flex h-7 items-center justify-center rounded border border-zinc-300 bg-white px-2.5 text-xs text-zinc-800 hover:bg-zinc-100"
          aria-label={`表示を等倍・中央に戻す。現在 ${Math.round(viewZoom * 100)}%`}
          onClick={onResetViewport}
        >
          等倍・中央
        </button>
      </div>
    </div>
  );
}
