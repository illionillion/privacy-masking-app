"use client";

import clsx from "clsx";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus } from "lucide-react";
import type { ViewportDirection } from "../hooks/useEditorViewport";

interface EditorViewportControlsProps {
  /** ルート要素に追加するクラス（モーダル内 sticky など） */
  className?: string;
  canPan: boolean;
  canZoomOut: boolean;
  canZoomIn: boolean;
  viewZoom: number;
  onNudgeViewCenter: (dxImageDir: ViewportDirection, dyImageDir: ViewportDirection) => void;
  onResetViewCenter: () => void;
  onZoomOut: () => void;
  onResetViewport: () => void;
  onZoomIn: () => void;
}

/**
 * EditorCanvas 上部の表示ズーム / 表示移動コントロール
 *
 * 描画ロジックとは分離し、ボタン構成とレスポンシブレイアウトだけを担当する。
 */
export function EditorViewportControls({
  className,
  canPan,
  canZoomOut,
  canZoomIn,
  viewZoom,
  onNudgeViewCenter,
  onResetViewCenter,
  onZoomOut,
  onResetViewport,
  onZoomIn,
}: EditorViewportControlsProps) {
  return (
    <div
      className={clsx([
        "flex flex-col gap-1 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5",
        className,
      ])}
    >
      <span className="text-xs text-zinc-600">表示ズーム</span>
      <div className="flex w-full flex-wrap items-start gap-2 md:items-center">
        {canPan && (
          <div className="flex flex-col gap-1 border-r border-zinc-300 pr-1.5 md:flex-row md:items-center md:gap-2">
            <div className="flex items-center justify-between gap-2 md:justify-start">
              <span className="text-xs text-zinc-600">移動</span>
              <button
                type="button"
                className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs text-zinc-800 hover:bg-zinc-100"
                aria-label="表示位置を中央に戻す"
                onClick={onResetViewCenter}
              >
                中央
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1 md:flex-nowrap">
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                aria-label="表示を左へ移動"
                onClick={() => onNudgeViewCenter(-1, 0)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                aria-label="表示を上へ移動"
                onClick={() => onNudgeViewCenter(0, -1)}
              >
                <ChevronUp className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                aria-label="表示を下へ移動"
                onClick={() => onNudgeViewCenter(0, 1)}
              >
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                aria-label="表示を右へ移動"
                onClick={() => onNudgeViewCenter(1, 0)}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
        <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center justify-between gap-2 md:justify-start">
            <span className="text-xs text-zinc-600">拡大縮小</span>
            <span className="text-xs tabular-nums text-zinc-500">
              {Math.round(viewZoom * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={clsx([
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-300 text-zinc-800",
                canZoomOut
                  ? "bg-white hover:bg-zinc-100"
                  : "cursor-not-allowed bg-zinc-100 text-zinc-400",
              ])}
              aria-label="ズームアウト"
              aria-disabled={!canZoomOut}
              disabled={!canZoomOut}
              onClick={onZoomOut}
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex h-7 items-center justify-center rounded border border-zinc-300 bg-white px-2 text-xs text-zinc-800 hover:bg-zinc-100"
              aria-label={`表示ズームを等倍に戻す。現在 ${Math.round(viewZoom * 100)}%`}
              onClick={onResetViewport}
            >
              等倍
            </button>
            <button
              type="button"
              className={clsx([
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-300 text-zinc-800",
                canZoomIn
                  ? "bg-white hover:bg-zinc-100"
                  : "cursor-not-allowed bg-zinc-100 text-zinc-400",
              ])}
              aria-label="ズームイン"
              aria-disabled={!canZoomIn}
              disabled={!canZoomIn}
              onClick={onZoomIn}
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
